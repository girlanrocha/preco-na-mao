// ========================================
// VP COMPRAS - APP
// ========================================

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function toast(message) {
  const box = $("#toast");
  if (!box) return;

  box.textContent = message;
  box.classList.add("show");

  setTimeout(() => {
    box.classList.remove("show");
  }, 2000);
}

function openScreen(id) {
  $$(".screen").forEach((screen) => {
    screen.classList.remove("active");
  });

  const screen = $("#" + id);

  if (screen) {
    screen.classList.add("active");
  }

  // Menu inferior só aparece para usuário logado
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
// ATUALIZAR USUÁRIO NA TELA
// ========================================

function updateUser(user) {
  if (!user) return;

  const idVP = `VP-${String(user.id).padStart(5, "0")}`;

  if ($("#profileName")) {
    $("#profileName").textContent = user.name || "Meu perfil";
  }

  if ($("#profileInfo")) {
    $("#profileInfo").textContent =
      `${user.city || "Vila Pavão"} • ${idVP}`;
  }

  const userPoints = Number(user.points || 0);

  if ($("#profilePoints")) {
    $("#profilePoints").textContent = userPoints;
  }

  if ($("#pointsBalance")) {
    $("#pointsBalance").textContent = userPoints;
  }

  if ($("#topPoints")) {
    $("#topPoints").textContent = userPoints;
  }
}


// ========================================
// VERIFICAR SE JÁ ESTÁ LOGADO
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

      return;
    }

  } catch (error) {
    console.error("Erro ao verificar sessão:", error);
  }

  openScreen("login");
}


// ========================================
// BOTÕES ENTRAR / CRIAR CONTA
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

  registerForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const name = $("#registerName").value.trim();
    const email = $("#registerEmail").value.trim().toLowerCase();
    const password = $("#registerPassword").value;
    const city = $("#registerCity").value.trim();

    if (!name || !email || !password || !city) {
      toast("Preencha todos os campos.");
      return;
    }

    if (password.length < 8) {
      toast("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }

    try {

      const response = await fetch("/api/register", {

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

      const data = await response.json();

      if (!response.ok || !data.ok) {
        toast(data.message || "Não foi possível criar sua conta.");
        return;
      }

      registerForm.reset();

      if ($("#registerCity")) {
        $("#registerCity").value = "Vila Pavão";
      }

      toast("Conta criada! Agora faça seu login.");

      openScreen("login");

    } catch (error) {

      console.error(error);

      toast("Erro de conexão. Tente novamente.");

    }

  });

}


// ========================================
// LOGIN
// ========================================

const loginForm = $("#loginForm");

if (loginForm) {

  loginForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const email = $("#loginEmail").value.trim().toLowerCase();
    const password = $("#loginPassword").value;

    if (!email || !password) {
      toast("Informe seu e-mail e senha.");
      return;
    }

    try {

      const response = await fetch("/api/login", {

        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        credentials: "include",

        body: JSON.stringify({
          email,
          password
        })

      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        toast(data.message || "E-mail ou senha incorretos.");
        return;
      }

      updateUser(data.user);

      loginForm.reset();

      toast("Login realizado!");

      openScreen("feed");

    } catch (error) {

      console.error(error);

      toast("Erro de conexão. Tente novamente.");

    }

  });

}


// ========================================
// MENU INFERIOR
// ========================================

$$(".nav").forEach((button) => {

  button.addEventListener("click", () => {

    $$(".nav").forEach((item) => {
      item.classList.remove("on");
    });

    button.classList.add("on");

    openScreen(button.dataset.screen);

  });

});


// ========================================
// SAIR
// ========================================

const logoutButton = $("#logoutButton");

if (logoutButton) {

  logoutButton.addEventListener("click", async () => {

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

  });

}


// ========================================
// PUBLICAR PREÇO
// Por enquanto apenas estrutura visual.
// Depois conectaremos ao D1.
// ========================================

const priceForm = $("#priceForm");

if (priceForm) {

  priceForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const category = $("#category").value;
    const product = $("#product").value.trim();
    const brand = $("#brand").value.trim();
    const store = $("#store").value.trim();
    const price = Number($("#price").value);

    if (!product || !store || !price || price <= 0) {
      toast("Preencha produto, estabelecimento e preço.");
      return;
    }

    try {

      const response = await fetch("/api/prices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
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

      const data = await response.json();

      if (!response.ok || !data.ok) {
        toast(data.message || "Não foi possível publicar o preço.");
        return;
      }

      // Atualiza os pontos na tela
      if ($("#topPoints")) {
        $("#topPoints").textContent = data.points;
      }

      if ($("#pointsBalance")) {
        $("#pointsBalance").textContent = data.points;
      }

      if ($("#profilePoints")) {
        $("#profilePoints").textContent = data.points;
      }

      priceForm.reset();

      toast("+10 pontos! Preço publicado.");

      // Volta para o feed
      setTimeout(() => {
        const feedButton =
          document.querySelector('[data-screen="feed"]');

        if (feedButton) {
          feedButton.click();
        }
      }, 800);

    } catch (error) {

      console.error("Erro ao publicar:", error);

      toast("Erro de conexão. Tente novamente.");
    }

  });

}

// ========================================
// PESQUISA
// ========================================

const search = $("#search");

if (search) {

  search.addEventListener("input", () => {

    // A pesquisa será conectada ao banco D1
    // na próxima etapa.

  });

}


// ========================================
// SERVICE WORKER
// ========================================

if ("serviceWorker" in navigator) {

  window.addEventListener("load", () => {

    navigator.serviceWorker
      .register("/sw.js")
      .catch((error) => {
        console.error("Service Worker:", error);
      });

  });

}


// ========================================
// INICIALIZAÇÃO
// ========================================

// Esconde o menu enquanto verificamos a conta.

if ($("#mainNav")) {
  $("#mainNav").style.display = "none";
}

// Verifica a sessão no servidor.

checkSession();
