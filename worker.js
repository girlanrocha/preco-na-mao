const PBKDF2_ITERATIONS = 100000;
const SESSION_DAYS = 30;

// ========================================
// FUNÇÕES AUXILIARES
// ========================================

function bytesToBase64(bytes) {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

function base64ToBytes(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

function bytesToHex(bytes) {
  return [...bytes]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ========================================
// SENHA
// ========================================

async function hashPassword(password, saltBytes = null) {
  const encoder = new TextEncoder();

  const salt =
    saltBytes ||
    crypto.getRandomValues(new Uint8Array(16));

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt,
      iterations: PBKDF2_ITERATIONS
    },
    keyMaterial,
    256
  );

  return [
    "pbkdf2_sha256",
    PBKDF2_ITERATIONS,
    bytesToBase64(salt),
    bytesToBase64(new Uint8Array(derivedBits))
  ].join("$");
}

async function verifyPassword(password, storedHash) {
  try {
    if (!storedHash) return false;

    const parts = storedHash.split("$");

    if (parts.length !== 4) {
      return false;
    }

    const algorithm = parts[0];
    const iterations = Number(parts[1]);
    const salt = base64ToBytes(parts[2]);
    const expectedHash = parts[3];

    if (algorithm !== "pbkdf2_sha256") {
      return false;
    }

    const encoder = new TextEncoder();

    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      "PBKDF2",
      false,
      ["deriveBits"]
    );

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        hash: "SHA-256",
        salt,
        iterations
      },
      keyMaterial,
      256
    );

    const calculatedHash =
      bytesToBase64(new Uint8Array(derivedBits));

    return calculatedHash === expectedHash;

  } catch (error) {
    console.error("ERRO VERIFICAR SENHA:", error);
    return false;
  }
}

// ========================================
// SESSÃO
// ========================================

function createSessionToken() {
  const bytes =
    crypto.getRandomValues(new Uint8Array(32));

  return bytesToHex(bytes);
}

async function hashToken(token) {
  const data =
    new TextEncoder().encode(token);

  const digest =
    await crypto.subtle.digest("SHA-256", data);

  return bytesToHex(
    new Uint8Array(digest)
  );
}

function getCookie(request, name) {
  const cookieHeader =
    request.headers.get("Cookie") || "";

  const cookies =
    cookieHeader.split(";");

  for (const cookie of cookies) {
    const [key, ...value] =
      cookie.trim().split("=");

    if (key === name) {
      return value.join("=");
    }
  }

  return null;
}

function sessionCookie(token) {
  const maxAge =
    SESSION_DAYS * 24 * 60 * 60;

  return [
    `vp_session=${token}`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    `Max-Age=${maxAge}`
  ].join("; ");
}

function clearSessionCookie() {
  return [
    "vp_session=",
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    "Max-Age=0"
  ].join("; ");
}

async function getCurrentUser(request, env) {
  const token =
    getCookie(request, "vp_session");

  if (!token) {
    return null;
  }

  const tokenHash =
    await hashToken(token);

  const session =
    await env.DB.prepare(`
      SELECT
        sessions.id AS session_id,
        users.id,
        users.name,
        users.email,
        users.city,
        users.points
      FROM sessions
      INNER JOIN users
        ON users.id = sessions.user_id
      WHERE sessions.token_hash = ?
        AND sessions.expires_at > CURRENT_TIMESTAMP
      LIMIT 1
    `)
      .bind(tokenHash)
      .first();

  return session || null;
}

// ========================================
// WORKER
// ========================================

export default {

  async fetch(request, env) {

    const url =
      new URL(request.url);

    // ====================================
    // API
    // ====================================

    if (url.pathname.startsWith("/api/")) {

      // ==================================
      // STATUS DA API
      // ==================================

      if (
        url.pathname === "/api/status" &&
        request.method === "GET"
      ) {

        return Response.json({
          ok: true,
          app: "VP Compras",
          message: "API funcionando"
        });
      }

      // ==================================
      // TESTE DO BANCO D1
      // ==================================

      if (
        url.pathname === "/api/db-status" &&
        request.method === "GET"
      ) {

        try {

          const result =
            await env.DB
              .prepare(
                "SELECT COUNT(*) AS total FROM rewards"
              )
              .first();

          return Response.json({
            ok: true,
            database: "preco-na-mao-db",
            connected: true,
            rewards: result?.total ?? 0
          });

        } catch (error) {

          return Response.json(
            {
              ok: false,
              connected: false,
              error: error.message
            },
            { status: 500 }
          );
        }
      }

      // ==================================
      // CADASTRO
      // ==================================

      if (
        url.pathname === "/api/register" &&
        request.method === "POST"
      ) {

        try {

          const body =
            await request.json();

          const name =
            typeof body.name === "string"
              ? body.name.trim()
              : "";

          const email =
            typeof body.email === "string"
              ? body.email.trim().toLowerCase()
              : "";

          const password =
            typeof body.password === "string"
              ? body.password
              : "";

          const city =
            typeof body.city === "string"
              ? body.city.trim()
              : "Vila Pavão";

          if (
            name.length < 2 ||
            name.length > 100
          ) {

            return Response.json(
              {
                ok: false,
                message: "Informe um nome válido."
              },
              { status: 400 }
            );
          }

          if (
            !validEmail(email) ||
            email.length > 254
          ) {

            return Response.json(
              {
                ok: false,
                message: "Informe um e-mail válido."
              },
              { status: 400 }
            );
          }

          if (
            password.length < 8 ||
            password.length > 128
          ) {

            return Response.json(
              {
                ok: false,
                message:
                  "A senha deve ter pelo menos 8 caracteres."
              },
              { status: 400 }
            );
          }

          const existing =
            await env.DB.prepare(`
              SELECT id
              FROM users
              WHERE email = ?
              LIMIT 1
            `)
              .bind(email)
              .first();

          if (existing) {

            return Response.json(
              {
                ok: false,
                message:
                  "Já existe uma conta com este e-mail."
              },
              { status: 409 }
            );
          }

          const passwordHash =
            await hashPassword(password);

          const result =
            await env.DB.prepare(`
              INSERT INTO users
              (
                name,
                email,
                password_hash,
                city,
                points
              )
              VALUES (?, ?, ?, ?, 0)
            `)
              .bind(
                name,
                email,
                passwordHash,
                city || "Vila Pavão"
              )
              .run();

          const userId =
            result.meta.last_row_id;

          return Response.json(
            {
              ok: true,
              message:
                "Conta criada com sucesso.",
              user: {
                id: userId,
                code:
                  "VP-" +
                  String(userId).padStart(5, "0"),
                name,
                email,
                city:
                  city || "Vila Pavão",
                points: 0
              }
            },
            { status: 201 }
          );

        } catch (error) {

          console.error(
            "ERRO CADASTRO:",
            error
          );

          return Response.json(
            {
              ok: false,
              message:
                "Erro no cadastro: " +
                error.message
            },
            { status: 500 }
          );
        }
      }

      // ==================================
      // LOGIN
      // ==================================

      if (
        url.pathname === "/api/login" &&
        request.method === "POST"
      ) {

        try {

          const body =
            await request.json();

          const email =
            typeof body.email === "string"
              ? body.email.trim().toLowerCase()
              : "";

          const password =
            typeof body.password === "string"
              ? body.password
              : "";

          const user =
            await env.DB.prepare(`
              SELECT
                id,
                name,
                email,
                password_hash,
                city,
                points
              FROM users
              WHERE email = ?
              LIMIT 1
            `)
              .bind(email)
              .first();

          if (!user) {

            return Response.json(
              {
                ok: false,
                message:
                  "E-mail ou senha incorretos."
              },
              { status: 401 }
            );
          }

          const passwordOK =
            await verifyPassword(
              password,
              user.password_hash
            );

          if (!passwordOK) {

            return Response.json(
              {
                ok: false,
                message:
                  "E-mail ou senha incorretos."
              },
              { status: 401 }
            );
          }

          await env.DB.prepare(`
            DELETE FROM sessions
            WHERE expires_at <= CURRENT_TIMESTAMP
          `).run();

          const token =
            createSessionToken();

          const tokenHash =
            await hashToken(token);

          await env.DB.prepare(`
            INSERT INTO sessions
            (
              user_id,
              token_hash,
              expires_at
            )
            VALUES (
              ?,
              ?,
              datetime('now', '+30 days')
            )
          `)
            .bind(
              user.id,
              tokenHash
            )
            .run();

          return Response.json(
            {
              ok: true,
              message:
                "Login realizado.",
              user: {
                id: user.id,
                code:
                  "VP-" +
                  String(user.id)
                    .padStart(5, "0"),
                name: user.name,
                email: user.email,
                city: user.city,
                points: user.points
              }
            },
            {
              headers: {
                "Set-Cookie":
                  sessionCookie(token)
              }
            }
          );

        } catch (error) {

          console.error(
            "ERRO LOGIN:",
            error
          );

          return Response.json(
            {
              ok: false,
              message:
                "Não foi possível realizar o login.",
              error: error.message
            },
            { status: 500 }
          );
        }
      }

      // ==================================
      // USUÁRIO LOGADO
      // ==================================

      if (
        url.pathname === "/api/me" &&
        request.method === "GET"
      ) {

        try {

          const user =
            await getCurrentUser(
              request,
              env
            );

          if (!user) {

            return Response.json(
              {
                ok: false,
                loggedIn: false
              },
              { status: 401 }
            );
          }

          return Response.json({
            ok: true,
            loggedIn: true,

            user: {
              id: user.id,
              code:
                "VP-" +
                String(user.id)
                  .padStart(5, "0"),
              name: user.name,
              email: user.email,
              city: user.city,
              points: user.points
            }
          });

        } catch (error) {

          console.error(
            "ERRO /API/ME:",
            error
          );

          return Response.json(
            {
              ok: false,
              loggedIn: false,
              error: error.message
            },
            { status: 500 }
          );
        }
      }

      // ==================================
      // PUBLICAR PREÇO
      // ==================================

      if (
        url.pathname === "/api/prices" &&
        request.method === "POST"
      ) {

        try {

          const user =
            await getCurrentUser(
              request,
              env
            );

          if (!user) {

            return Response.json(
              {
                ok: false,
                message:
                  "Você precisa estar logado."
              },
              { status: 401 }
            );
          }

          const body =
            await request.json();

          const category =
            typeof body.category === "string"
              ? body.category.trim()
              : "";

          const productName =
            typeof body.product === "string"
              ? body.product.trim()
              : "";

          const brand =
            typeof body.brand === "string"
              ? body.brand.trim()
              : "";

          const storeName =
            typeof body.store === "string"
              ? body.store.trim()
              : "";

          const price =
            Number(body.price);

          if (
            !productName ||
            !storeName ||
            !Number.isFinite(price) ||
            price <= 0
          ) {

            return Response.json(
              {
                ok: false,
                message:
                  "Preencha produto, estabelecimento e preço."
              },
              { status: 400 }
            );
          }

          // Procura produto

          let product =
            await env.DB.prepare(`
              SELECT id
              FROM products
              WHERE LOWER(name) = LOWER(?)
                AND LOWER(COALESCE(brand, '')) = LOWER(?)
              LIMIT 1
            `)
              .bind(
                productName,
                brand
              )
              .first();

          // Cria produto se necessário

          if (!product) {

            const productResult =
              await env.DB.prepare(`
                INSERT INTO products
                (
                  name,
                  category,
                  brand
                )
                VALUES (?, ?, ?)
              `)
                .bind(
                  productName,
                  category || "Supermercado",
                  brand
                )
                .run();

            product = {
              id:
                productResult.meta
                  .last_row_id
            };
          }

          // Procura estabelecimento

          let establishment =
            await env.DB.prepare(`
              SELECT id
              FROM establishments
              WHERE LOWER(name) = LOWER(?)
                AND LOWER(city) = LOWER(?)
              LIMIT 1
            `)
              .bind(
                storeName,
                user.city || "Vila Pavão"
              )
              .first();

          // Cria estabelecimento

          if (!establishment) {

            const establishmentResult =
              await env.DB.prepare(`
                INSERT INTO establishments
                (
                  name,
                  category,
                  city
                )
                VALUES (?, ?, ?)
              `)
                .bind(
                  storeName,
                  category || "Supermercado",
                  user.city || "Vila Pavão"
                )
                .run();

            establishment = {
              id:
                establishmentResult
                  .meta.last_row_id
            };
          }

          // Grava preço

          const priceResult =
            await env.DB.prepare(`
              INSERT INTO prices
              (
                user_id,
                product_id,
                establishment_id,
                price,
                purchase_date,
                status
              )
              VALUES (
                ?, ?, ?, ?, date('now'), 'active'
              )
            `)
              .bind(
                user.id,
                product.id,
                establishment.id,
                price
              )
              .run();

          // Acrescenta 10 pontos

          await env.DB.prepare(`
            UPDATE users
            SET points = points + 10
            WHERE id = ?
          `)
            .bind(user.id)
            .run();

          // Histórico dos pontos

          await env.DB.prepare(`
            INSERT INTO point_transactions
            (
              user_id,
              points,
              type,
              description
            )
            VALUES (
              ?,
              10,
              'price_submission',
              ?
            )
          `)
            .bind(
              user.id,
              `Preço cadastrado: ${productName}`
            )
            .run();

          const updatedUser =
            await env.DB.prepare(`
              SELECT points
              FROM users
              WHERE id = ?
            `)
              .bind(user.id)
              .first();

          return Response.json(
            {
              ok: true,
              message:
                "Preço publicado com sucesso.",
              priceId:
                priceResult.meta.last_row_id,
              pointsEarned: 10,
              points:
                updatedUser?.points ?? 0
            },
            { status: 201 }
          );

        } catch (error) {

          console.error(
            "ERRO PUBLICAR PREÇO:",
            error
          );

          return Response.json(
            {
              ok: false,
              message:
                "Não foi possível publicar o preço.",
              error: error.message
            },
            { status: 500 }
          );
        }
      }

      // ==================================
      // LISTAR PREÇOS
      // ==================================

      if (
        url.pathname === "/api/prices" &&
        request.method === "GET"
      ) {

        try {

          const result =
            await env.DB.prepare(`
              SELECT
                prices.id,
                prices.price,
                prices.created_at,

(
  SELECT COUNT(*)
  FROM price_confirmations
  WHERE price_confirmations.price_id = prices.id
) AS confirmations,


                
                products.name AS product,
                products.brand,
                products.category,
                establishments.name AS store,
                establishments.city,
                users.id AS user_id,
                users.name AS user_name
              FROM prices
              INNER JOIN products
                ON products.id =
                   prices.product_id
              INNER JOIN establishments
                ON establishments.id =
                   prices.establishment_id
              INNER JOIN users
                ON users.id =
                   prices.user_id
              WHERE prices.status = 'active'
              ORDER BY prices.id DESC
              LIMIT 100
            `).all();

          const prices =
            (result.results || []).map(
              (item) => ({
                ...item,
                user_code:
                  "VP-" +
                  String(item.user_id)
                    .padStart(5, "0")
              })
            );

          return Response.json({
            ok: true,
            prices
          });

        } catch (error) {

          console.error(
            "ERRO LISTAR PREÇOS:",
            error
          );

          return Response.json(
            {
              ok: false,
              message:
                "Não foi possível carregar os preços.",
              error: error.message
            },
            { status: 500 }
          );
        }
      }
// ==================================
// CONFIRMAR PREÇO
// ==================================

if (
  url.pathname.startsWith("/api/prices/") &&
  url.pathname.endsWith("/confirm") &&
  request.method === "POST"
) {

  try {

    const user =
      await getCurrentUser(request, env);

    if (!user) {
      return Response.json(
        {
          ok: false,
          message: "Você precisa estar logado."
        },
        { status: 401 }
      );
    }


    const parts =
      url.pathname.split("/");

    const priceId =
      Number(parts[3]);


    if (
      !Number.isInteger(priceId) ||
      priceId <= 0
    ) {

      return Response.json(
        {
          ok: false,
          message: "Preço inválido."
        },
        { status: 400 }
      );
    }


    const price =
      await env.DB.prepare(`
        SELECT id
        FROM prices
        WHERE id = ?
          AND status = 'active'
        LIMIT 1
      `)
        .bind(priceId)
        .first();


    if (!price) {

      return Response.json(
        {
          ok: false,
          message: "Preço não encontrado."
        },
        { status: 404 }
      );
    }


    // Verifica se o usuário já confirmou

    const existing =
      await env.DB.prepare(`
        SELECT 1
        FROM price_confirmations
        WHERE price_id = ?
          AND user_id = ?
        LIMIT 1
      `)
        .bind(
          priceId,
          user.id
        )
        .first();


    if (existing) {

      const total =
        await env.DB.prepare(`
          SELECT COUNT(*) AS total
          FROM price_confirmations
          WHERE price_id = ?
        `)
          .bind(priceId)
          .first();


      return Response.json({
        ok: true,
        alreadyConfirmed: true,
        confirmations:
          Number(total?.total || 0),
        message:
          "Você já confirmou este preço."
      });
    }


    // Registra a confirmação

    await env.DB.prepare(`
      INSERT INTO price_confirmations
      (
        price_id,
        user_id
      )
      VALUES (?, ?)
    `)
      .bind(
        priceId,
        user.id
      )
      .run();


    // Conta confirmações

    const total =
      await env.DB.prepare(`
        SELECT COUNT(*) AS total
        FROM price_confirmations
        WHERE price_id = ?
      `)
        .bind(priceId)
        .first();


    return Response.json({
      ok: true,
      alreadyConfirmed: false,
      confirmations:
        Number(total?.total || 0),
      message:
        "Preço confirmado!"
    });


  } catch (error) {

    console.error(
      "ERRO CONFIRMAR PREÇO:",
      error
    );


    return Response.json(
      {
        ok: false,
        message:
          "Não foi possível confirmar o preço.",
        error: error.message
      },
      { status: 500 }
    );

  }

}
      // ==================================
      // LOGOUT
      // ==================================

      if (
        url.pathname === "/api/logout" &&
        request.method === "POST"
      ) {

        try {

          const token =
            getCookie(
              request,
              "vp_session"
            );

          if (token) {

            const tokenHash =
              await hashToken(token);

            await env.DB.prepare(`
              DELETE FROM sessions
              WHERE token_hash = ?
            `)
              .bind(tokenHash)
              .run();
          }

          return Response.json(
            {
              ok: true,
              message:
                "Você saiu da conta."
            },
            {
              headers: {
                "Set-Cookie":
                  clearSessionCookie()
              }
            }
          );

        } catch (error) {

          return Response.json(
            {
              ok: true
            },
            {
              headers: {
                "Set-Cookie":
                  clearSessionCookie()
              }
            }
          );
        }
      }

      // ==================================
      // ROTA NÃO ENCONTRADA
      // ==================================

      return Response.json(
        {
          ok: false,
          message:
            "Rota da API não encontrada"
        },
        { status: 404 }
      );
    }

    // ====================================
    // SITE
    // ====================================

    return env.ASSETS.fetch(request);
  }
};
