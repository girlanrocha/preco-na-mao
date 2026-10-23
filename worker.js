const PBKDF2_ITERATIONS = 210000;

function bytesToBase64(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

async function hashPassword(password, saltBytes = null) {
  const encoder = new TextEncoder();
  const salt = saltBytes || crypto.getRandomValues(new Uint8Array(16));

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

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {

      // Status da API
      if (url.pathname === "/api/status" && request.method === "GET") {
        return Response.json({
          ok: true,
          app: "VP Compras",
          message: "API funcionando"
        });
      }

      // Teste do banco D1
      if (url.pathname === "/api/db-status" && request.method === "GET") {
        try {
          const result = await env.DB
            .prepare("SELECT COUNT(*) AS total FROM rewards")
            .first();

          return Response.json({
            ok: true,
            database: "preco-na-mao-db",
            connected: true,
            rewards: result.total
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

      // Cadastro de usuário
      if (url.pathname === "/api/register" && request.method === "POST") {
        try {
          const contentType = request.headers.get("content-type") || "";

          if (!contentType.includes("application/json")) {
            return Response.json(
              { ok: false, message: "Envie os dados em JSON." },
              { status: 415 }
            );
          }

          const body = await request.json();

          const name =
            typeof body.name === "string" ? body.name.trim() : "";

          const email =
            typeof body.email === "string"
              ? body.email.trim().toLowerCase()
              : "";

          const password =
            typeof body.password === "string" ? body.password : "";

          if (name.length < 2 || name.length > 100) {
            return Response.json(
              { ok: false, message: "Informe um nome válido." },
              { status: 400 }
            );
          }

          if (!validEmail(email) || email.length > 254) {
            return Response.json(
              { ok: false, message: "Informe um e-mail válido." },
              { status: 400 }
            );
          }

          if (password.length < 8 || password.length > 128) {
            return Response.json(
              {
                ok: false,
                message: "A senha deve ter entre 8 e 128 caracteres."
              },
              { status: 400 }
            );
          }

          const existingUser = await env.DB
            .prepare("SELECT id FROM users WHERE email = ? LIMIT 1")
            .bind(email)
            .first();

          if (existingUser) {
            return Response.json(
              {
                ok: false,
                message: "Já existe uma conta cadastrada com este e-mail."
              },
              { status: 409 }
            );
          }

          const passwordHash = await hashPassword(password);

          const result = await env.DB
            .prepare(`
              INSERT INTO users
              (name, email, password_hash, city, points)
              VALUES (?, ?, ?, ?, 0)
            `)
            .bind(
              name,
              email,
              passwordHash,
              "Vila Pavão"
            )
            .run();

          return Response.json(
            {
              ok: true,
              message: "Cadastro realizado com sucesso.",
              user: {
                id: result.meta.last_row_id,
                name,
                email,
                city: "Vila Pavão",
                points: 0
              }
            },
            { status: 201 }
          );

        } catch (error) {
          return Response.json(
            {
              ok: false,
              message: "Não foi possível realizar o cadastro."
            },
            { status: 500 }
          );
        }
      }

      return Response.json(
        { ok: false, message: "Rota da API não encontrada" },
        { status: 404 }
      );
    }

    // Mantém o site atual funcionando
    return env.ASSETS.fetch(request);
  }
};
