// ========================================
// VP COMPRAS - APP
// ========================================

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];


// ========================================
// MENSAGENS
// ========================================

function toast(message) {
  const box = $("#toast");

  if (!box) return;

  box.textContent = message;
  box.classList.add("show");

  setTimeout(() => {
    box.classList.remove("show");
  }, 2000);
}


// ========================================
// TELAS
// ========================================

function openScreen(id) {
  $$(".screen").forEach((screen) => {
    screen.classList.remove("active");
  });

  const screen = $("#" + id);

  if (screen) {
    screen.classList.add("active");
  }

  const nav = $("#mainNav");

  if (nav) {
    if (id === "login" || id === "register") {
      nav.style.display = "none";
    } else {
      nav.style.display = "";
    }
  }

  window.scrollTo(0, 0);
}


// ========================================
// SEGURANÇA DOS TEXTOS
// ========================================

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


// ========================================
// USUÁRIO
// ========================================

function updateUser(user) {
  if (!user) return;

  const idVP =
    `VP-${String(user.id).padStart(5, "0")}`;

  const points =
    Number(user.points || 0);

  if ($("#profileName")) {
    $("#profileName").textContent =
      user.name || "Meu perfil";
  }

  if ($("#profileInfo")) {
    $("#profileInfo").textContent =
      `${user.city || "Vila Pavão"} • ${idVP}`;
  }

  if ($("#profilePoints")) {
    $("#profilePoints").textContent = points;
  }

  if ($("#pointsBalance")) {
    $("#pointsBalance").textContent = points;
  }

  if ($("#topPoints")) {
    $("#topPoints").textContent = points;
  }
}


// ========================================
// VERIFICAR SESSÃO
// ========================================

async function checkSession() {
  try {
    const response = await fetch("/api/me", {
      method: "GET",
      credentials: "include"
    });

    const data = await response.json();

    if (response.ok && data.ok && data.user) {
      updateUser(data.user);

      openScreen("feed");

      await loadFeed();

      return;
    }

  } catch (error) {
    console.error(
      "Erro ao verificar sessão:",
      error
    );
  }

  openScreen("login");
}


// ========================================
// TROCAR LOGIN / CADASTRO
// ========================================

const showRegister = $("#showRegister");
const showLogin = $("#showLogin");

if (showRegister) {
  showRegister.addEventListener("click", () => {
    openScreen("register");
  });
}

if (showLogin) {
  showLogin.addEventListener("click", () => {
    openScreen("login");
  });
}


// ========================================
// CADASTRO
// ========================================

const registerForm = $("#registerForm");

if (registerForm) {
  registerForm.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();

      const name =
        $("#registerName").value.trim();

      const email =
        $("#registerEmail")
          .value
          .trim()
          .toLowerCase();

      const password =
        $("#registerPassword").value;

      const city =
        $("#registerCity").value.trim();

      if (!name || !email || !password || !city) {
        toast("Preencha todos os campos.");
        return;
      }

      if (password.length < 8) {
        toast(
          "A senha precisa ter pelo menos 8 caracteres."
        );
        return;
      }

      try {
        const response =
          await fetch("/api/register", {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            credentials: "include",

            body: JSON.stringify({
              name,
              email,
              password,
              city
            })
          });

        const data =
          await response.json();

        if (!response.ok || !data.ok) {
          toast(
            data.message ||
            "Não foi possível criar sua conta."
          );
          return;
        }

        registerForm.reset();

        if ($("#registerCity")) {
          $("#registerCity").value =
            "Vila Pavão";
        }

        toast(
          "Conta criada! Agora faça seu login."
        );

        openScreen("login");

      } catch (error) {
        console.error(error);

        toast(
          "Erro de conexão. Tente novamente."
        );
      }
    }
  );
}


// ========================================
// LOGIN
// ========================================

const loginForm = $("#loginForm");

if (loginForm) {
  loginForm.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();

      const email =
        $("#loginEmail")
          .value
          .trim()
          .toLowerCase();

      const password =
        $("#loginPassword").value;

      if (!email || !password) {
        toast(
          "Informe seu e-mail e senha."
        );
        return;
      }

      try {
        const response =
          await fetch("/api/login", {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            credentials: "include",

            body: JSON.stringify({
              email,
              password
            })
          });

        const data =
          await response.json();

        if (!response.ok || !data.ok) {
          toast(
            data.message ||
            "E-mail ou senha incorretos."
          );
          return;
        }

        updateUser(data.user);

        loginForm.reset();

        toast("Login realizado!");

        openScreen("feed");

        await loadFeed();

      } catch (error) {
        console.error(
          "Erro no login:",
          error
        );

        toast(
          "Erro de conexão. Tente novamente."
        );
      }
    }
  );
}


// ========================================
// MENU INFERIOR
// ========================================

$$(".nav").forEach((button) => {
  button.addEventListener("click", async () => {

    $$(".nav").forEach((item) => {
      item.classList.remove("on");
    });

    button.classList.add("on");

    const screen =
      button.dataset.screen;

    openScreen(screen);

    if (screen === "feed") {
      await loadFeed();
    }
  });
});


// ========================================
// LOGOUT
// ========================================

const logoutButton = $("#logoutButton");

if (logoutButton) {
  logoutButton.addEventListener(
    "click",
    async () => {

      try {
        await fetch("/api/logout", {
          method: "POST",
          credentials: "include"
        });

      } catch (error) {
        console.error(error);
      }

      if ($("#loginForm")) {
        $("#loginForm").reset();
      }

      toast("Você saiu da conta.");

      openScreen("login");
    }
  );
}


// ========================================
// PUBLICAR PREÇO
// ========================================

const priceForm = $("#priceForm");

if (priceForm) {
  priceForm.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();

      const category =
        $("#category").value;

      const product =
        $("#product").value.trim();

      const brand =
        $("#brand").value.trim();

      const store =
        $("#store").value.trim();

      const price =
        Number($("#price").value);

      if (
        !product ||
        !store ||
        !Number.isFinite(price) ||
        price <= 0
      ) {
        toast(
          "Preencha produto, estabelecimento e preço."
        );
        return;
      }

      try {
        const response =
          await fetch("/api/prices", {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            credentials: "include",

            body: JSON.stringify({
              category,
              product,
              brand,
              store,
              price
            })
          });

        const data =
          await response.json();

        if (!response.ok || !data.ok) {
          toast(
            data.message ||
            "Não foi possível publicar o preço."
          );
          return;
        }

        if ($("#topPoints")) {
          $("#topPoints").textContent =
            data.points;
        }

        if ($("#pointsBalance")) {
          $("#pointsBalance").textContent =
            data.points;
        }

        if ($("#profilePoints")) {
          $("#profilePoints").textContent =
            data.points;
        }

        priceForm.reset();

        toast(
          "+10 pontos! Preço publicado."
        );

        await loadFeed();

        setTimeout(() => {
          const feedButton =
            document.querySelector(
              '[data-screen="feed"]'
            );

          if (feedButton) {
            feedButton.click();
          } else {
            openScreen("feed");
          }
        }, 600);

      } catch (error) {
        console.error(
          "Erro ao publicar:",
          error
        );

        toast(
          "Erro de conexão. Tente novamente."
        );
      }
    }
  );
}


// ========================================
// FEED - CARREGAR PREÇOS DO D1
// ========================================

async function loadFeed() {
  const feedList = $("#feedList");

  if (!feedList) {
    return;
  }

  feedList.innerHTML =
    '<p class="empty">Carregando preços...</p>';

  try {
    const response =
      await fetch("/api/prices", {
        method: "GET",
        credentials: "include"
      });

    const data =
      await response.json();

    if (!response.ok || !data.ok) {
      feedList.innerHTML =
        '<p class="empty">Não foi possível carregar os preços.</p>';
      return;
    }

    if (
      !data.prices ||
      data.prices.length === 0
    ) {
      feedList.innerHTML =
        '<p class="empty">Ainda não há preços publicados.</p>';
      return;
    }

    feedList.innerHTML = "";

    data.prices.forEach((item) => {

      const card =
        document.createElement("div");

      card.className =
        "post price-card";

      const formattedPrice =
        Number(item.price)
          .toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
          });

      const firstName =
        String(
          item.user_name || "Usuário"
        )
          .trim()
          .split(/\s+/)[0];

      const initial =
        firstName
          .charAt(0)
          .toUpperCase();

      card.innerHTML = `
        <div class="social-post">

          <div class="social-user">

            <div class="social-avatar">
              ${escapeHTML(initial)}
            </div>

            <div class="social-user-info">
              <strong>
                ${escapeHTML(firstName)}
              </strong>

              <small>
                publicou um preço
              </small>
            </div>

            <span class="social-category">
              🛒 ${escapeHTML(
                item.category || ""
              )}
            </span>

          </div>

          <div class="social-product">

            <div class="social-product-info">

              <h3>
                ${escapeHTML(item.product)}
              </h3>

              ${
                item.brand
                  ? `
                    <p>
                      ${escapeHTML(
                        item.brand
                      )}
                    </p>
                  `
                  : ""
              }

              <span>
                🏪 ${escapeHTML(item.store)}
              </span>

              <span>
                📍 ${escapeHTML(
                  item.city || ""
                )}
              </span>

            </div>

            <strong class="social-price">
              ${formattedPrice}
            </strong>

          </div>

          <div class="social-actions instagram-actions">

  <button
    type="button"
    class="price-like"
    title="Preço útil"
  >
    <span class="money-icon">$</span>
    <b>0</b>
  </button>

  <button
    type="button"
    class="comment-price"
    title="Comentar"
  >
    <span>💬</span>
    <b>0</b>
  </button>

  <button
    type="button"
    class="share-price"
    title="Compartilhar"
  >
    <span>➤</span>
  </button>

</div>

        </div>
      `;

      feedList.appendChild(card);
    });

  } catch (error) {
    console.error(
      "Erro ao carregar feed:",
      error
    );

    feedList.innerHTML =
      '<p class="empty">Erro ao carregar os preços.</p>';
  }
}


// ========================================
// PESQUISA
// ========================================

const search = $("#search");

if (search) {
  search.addEventListener(
    "input",
    async () => {

      // Na próxima etapa esta área
      // será usada para comparar produtos
      // e mostrar o menor preço.

    }
  );
}


// ========================================
// SERVICE WORKER
// ========================================

if ("serviceWorker" in navigator) {
  window.addEventListener(
    "load",
    () => {

      navigator.serviceWorker
        .register("/sw.js")
        .catch((error) => {
          console.error(
            "Service Worker:",
            error
          );
        });
    }
  );
}


// ========================================
// INICIALIZAÇÃO
// ========================================

if ($("#mainNav")) {
  $("#mainNav").style.display = "none";
}

checkSession();
