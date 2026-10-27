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
              "Content-Type": "application/json"
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
        console.error(
          "Erro no cadastro:",
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
              <small>publicou um preço</small>
            </div>

            <span class="social-category">
              🛒 ${escapeHTML(item.category || "")}
            </span>

          </div>

          <div class="social-product">

            <h3>
              ${escapeHTML(item.product)}
            </h3>

            ${
              item.brand
                ? `<p>${escapeHTML(item.brand)}</p>`
                : ""
            }

            <div class="social-location">
              <span>
                🏪 ${escapeHTML(item.store)}
              </span>

              <span>
                📍 ${escapeHTML(item.city || "")}
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
              title="Preço confirmado"
            >
              <span class="money-icon">$</span>
              <b>0</b>
            </button>

            <button
              type="button"
              class="comment-price"
              title="Comentar"
            >
              <span class="comment-icon">💬</span>
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
// PESQUISA / COMPARAÇÃO
// ========================================

const search = $("#search");
const compareResults = $("#compareResults");
const productShortcuts = $$(".product-shortcuts button");


// Formata valor em Real
function formatBRL(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}


// Normaliza texto para facilitar a pesquisa
function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}


// ========================================
// MOSTRAR PREÇOS DE UM PRODUTO
// ========================================

async function compareProduct(productName) {

  if (!compareResults) {
    return;
  }

  const term = normalizeText(productName);

  if (!term) {

    compareResults.innerHTML = `
      <div class="compare-empty">
        <span>💰</span>
        <strong>Encontre o menor preço</strong>
        <p>
          Escolha um produto acima ou faça uma busca.
        </p>
      </div>
    `;

    return;
  }


  compareResults.innerHTML = `
    <div class="compare-empty">
      <span>🔎</span>
      <strong>Procurando preços...</strong>
      <p>
        Aguarde um instante.
      </p>
    </div>
  `;


  try {

    const response = await fetch("/api/prices", {
      method: "GET",
      credentials: "include"
    });


    const data = await response.json();


    if (!response.ok || !data.ok) {

      compareResults.innerHTML = `
        <div class="compare-empty">
          <span>⚠️</span>
          <strong>Não foi possível comparar</strong>
          <p>
            Tente novamente.
          </p>
        </div>
      `;

      return;
    }


    const prices = Array.isArray(data.prices)
      ? data.prices
      : [];


    // Procura o produto digitado/clicado
    const matches = prices.filter((item) => {

      const product =
        normalizeText(item.product);

      const brand =
        normalizeText(item.brand);

      return (
        product.includes(term) ||
        brand.includes(term)
      );

    });


    // Ordena do menor preço para o maior
    matches.sort((a, b) => {
      return Number(a.price) - Number(b.price);
    });


    if (matches.length === 0) {

      compareResults.innerHTML = `
        <div class="compare-empty">
          <span>🔎</span>

          <strong>
            Nenhum preço encontrado
          </strong>

          <p>
            Ainda não temos preço publicado para
            <b>${escapeHTML(productName)}</b>.
          </p>

          <p>
            Seja o primeiro a publicar.
          </p>
        </div>
      `;

      return;
    }


    // Menor preço
    const cheapest = matches[0];


    const cheapestPrice =
      formatBRL(cheapest.price);


    compareResults.innerHTML = `
      <div class="comparison-title">
        <span>Resultados para</span>
        <strong>
          ${escapeHTML(productName)}
        </strong>
      </div>


      <article class="cheapest-card">

        <div class="cheapest-badge">
          🏆 MENOR PREÇO
        </div>

        <div class="cheapest-product">

          <div>

            <h3>
              ${escapeHTML(cheapest.product || "")}
            </h3>

            ${
              cheapest.brand
                ? `
                  <p>
                    ${escapeHTML(cheapest.brand)}
                  </p>
                `
                : ""
            }

          </div>


          <strong class="cheapest-price">
            ${cheapestPrice}
          </strong>

        </div>


        <div class="cheapest-store">

          <span>
            🏪 ${escapeHTML(cheapest.store || "")}
          </span>

          <span>
            📍 ${escapeHTML(cheapest.city || "")}
          </span>

        </div>

      </article>


      ${
        matches.length > 1
          ? `
            <div class="other-prices">

              <h3>
                Outros preços encontrados
              </h3>

              <div id="otherPricesList"></div>

            </div>
          `
          : `
            <div class="only-price">
              Este é o único preço publicado até agora.
            </div>
          `
      }
    `;


    // ========================================
    // OUTROS PREÇOS
    // ========================================

    const otherPricesList =
      $("#otherPricesList");


    if (otherPricesList) {

      matches
        .slice(1)
        .forEach((item) => {

          const card =
            document.createElement("div");

          card.className =
            "comparison-price-card";


          card.innerHTML = `

            <div class="comparison-store">

              <strong>
                ${escapeHTML(item.store || "")}
              </strong>

              <small>
                📍 ${escapeHTML(item.city || "")}
              </small>

              ${
                item.brand
                  ? `
                    <small>
                      ${escapeHTML(item.brand)}
                    </small>
                  `
                  : ""
              }

            </div>


            <strong class="comparison-value">
              ${formatBRL(item.price)}
            </strong>

          `;


          otherPricesList.appendChild(card);

        });

    }


  } catch (error) {

    console.error(
      "Erro ao comparar preços:",
      error
    );


    compareResults.innerHTML = `
      <div class="compare-empty">

        <span>⚠️</span>

        <strong>
          Erro ao carregar preços
        </strong>

        <p>
          Verifique sua conexão e tente novamente.
        </p>

      </div>
    `;

  }

}


// ========================================
// BOTÕES DA CESTA BÁSICA
// ========================================

productShortcuts.forEach((button) => {

  button.addEventListener(
    "click",
    async () => {

      // Remove seleção anterior
      productShortcuts.forEach((item) => {
        item.classList.remove("selected");
      });


      // Marca produto escolhido
      button.classList.add("selected");


      const productName =
        button.dataset.product || "";


      // Coloca o produto no campo de busca
      if (search) {
        search.value = productName;
      }


      // Faz comparação
      await compareProduct(productName);

    }
  );

});


// ========================================
// PESQUISA DIGITADA
// ========================================

let searchTimer;


if (search) {

  search.addEventListener(
    "input",
    () => {

      clearTimeout(searchTimer);


      const value =
        search.value.trim();


      productShortcuts.forEach((button) => {

        const product =
          normalizeText(
            button.dataset.product
          );


        const typed =
          normalizeText(value);


        button.classList.toggle(
          "selected",
          Boolean(typed && product === typed)
        );

      });


      if (!value) {

        compareResults.innerHTML = `
          <div class="compare-empty">

            <span>💰</span>

            <strong>
              Encontre o menor preço
            </strong>

            <p>
              Escolha um produto acima ou faça uma busca.
            </p>

          </div>
        `;

        return;
      }


      // Espera um pouco para não pesquisar
      // a cada letra digitada
      searchTimer = setTimeout(() => {

        compareProduct(value);

      }, 450);

    }
  );

}

// ========================================
// CATEGORIAS DO COMPARADOR
// ========================================

const compareCategories = $$(".compare-cat");
const shortcutsContainer = $(".product-shortcuts");
const basketTitle = $(".basket-title strong");
const basketDescription = $(".basket-title small");

const categoryProducts = {

  cesta: {
    title: "🧺 Cesta básica",
    products: [
      ["🍚", "Arroz"],
      ["●", "Feijão"],
      ["☕", "Café"],
      ["🧂", "Açúcar"],
      ["💧", "Óleo"],
      ["🥛", "Leite"],
      ["🍝", "Macarrão"],
      ["🌾", "Farinha"]
    ]
  },

  farmacia: {
    title: "💊 Farmácia",
    products: [
      ["💊", "Dipirona"],
      ["💊", "Paracetamol"],
      ["🩹", "Curativo"],
      ["🧴", "Shampoo"],
      ["🪥", "Creme dental"],
      ["🧼", "Sabonete"],
      ["👶", "Fralda"],
      ["🧻", "Papel higiênico"]
    ]
  },

  combustiveis: {
    title: "⛽ Combustíveis",
    products: [
     
    ["⛽", "Gasolina"],
    ["⛽", "Gasolina Aditivada"],
    ["🌱", "Etanol"],
    ["🚛", "Diesel"]
  
  },

  construcao: {
    title: "🧱 Construção",
    products: [
      ["🏗️", "Cimento"],
      ["🧱", "Tijolo"],
      ["🏠", "Telha"],
      ["🪣", "Tinta"],
      ["🏗️", "Argamassa"],
      ["⛰️", "Areia"],
      ["🪨", "Brita"],
      ["🔩", "Vergalhão"]
    ]
  }

};


function resetCompareResults() {

  if (!compareResults) return;

  compareResults.innerHTML = `
    <div class="compare-empty">
      <span>💰</span>

      <strong>
        Encontre o menor preço
      </strong>

      <p>
        Escolha um produto acima ou faça uma busca.
      </p>
    </div>
  `;
}


function renderCategory(category) {

  const data = categoryProducts[category];

  if (!data || !shortcutsContainer) {
    return;
  }


  // Troca título

  if (basketTitle) {
    basketTitle.textContent = data.title;
  }

  if (basketDescription) {
    basketDescription.textContent =
      "Toque em um produto para comparar";
  }


  // Limpa produtos anteriores

  shortcutsContainer.innerHTML = "";


  // Cria novos produtos

  data.products.forEach(([icon, productName]) => {

    const button =
      document.createElement("button");

    button.type = "button";

    button.dataset.product =
      productName;

    button.innerHTML = `
      <span>${icon}</span>
      ${escapeHTML(productName)}
    `;


    // Clique no produto

    button.addEventListener(
      "click",
      async () => {

        shortcutsContainer
          .querySelectorAll("button")
          .forEach((item) => {
            item.classList.remove("selected");
          });


        button.classList.add("selected");


        if (search) {
          search.value = productName;
        }


        await compareProduct(productName);

      }
    );


    shortcutsContainer.appendChild(button);

  });


  // Limpa busca

  if (search) {
    search.value = "";
  }


  resetCompareResults();

}


// ========================================
// CLIQUE NAS CATEGORIAS
// ========================================

compareCategories.forEach((button) => {

  button.addEventListener(
    "click",
    () => {

      compareCategories.forEach((item) => {
        item.classList.remove("active");
      });


      button.classList.add("active");


      const category =
        button.dataset.category;


      renderCategory(category);

    }
  );

});
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


// Verifica se existe sessão
checkSession();
