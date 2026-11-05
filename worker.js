// ========================================
// MODO MANUTENÇÃO
// ========================================

if (!url.pathname.startsWith("/api/")) {

  return new Response(`
<!DOCTYPE html>
<html lang="pt-BR">

<head>
  <meta charset="UTF-8">

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  >

  <meta name="theme-color" content="#1267d8">

  <title>VP Compras - Manutenção</title>

  <style>

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      min-height: 100vh;
      padding: 20px;

      display: flex;
      align-items: center;
      justify-content: center;

      background:
        linear-gradient(
          135deg,
          #eef5ff,
          #f8fbff
        );

      font-family:
        Arial,
        Helvetica,
        sans-serif;

      color: #172033;
    }

    .maintenance {
      width: 100%;
      max-width: 480px;

      background: #ffffff;

      border-radius: 26px;

      padding: 42px 28px;

      text-align: center;

      box-shadow:
        0 15px 45px
        rgba(18, 103, 216, 0.12);
    }

    .brand {
      color: #1267d8;
      font-size: 30px;
      font-weight: 900;

      margin-bottom: 6px;
    }

    .region {
      color: #667085;
      font-size: 13px;

      margin-bottom: 30px;
    }

    .icon {
      width: 90px;
      height: 90px;

      margin: 0 auto 22px;

      display: flex;
      align-items: center;
      justify-content: center;

      border-radius: 50%;

      background: #eaf3ff;

      font-size: 45px;
    }

    h1 {
      margin: 0 0 14px;

      font-size: 25px;

      color: #172033;
    }

    p {
      margin: 0;

      color: #667085;

      font-size: 15px;

      line-height: 1.6;
    }

    .status {
      display: inline-block;

      margin-top: 28px;

      padding: 10px 18px;

      background: #eaf3ff;

      color: #1267d8;

      border-radius: 30px;

      font-size: 13px;

      font-weight: 700;
    }

    .footer {
      margin-top: 30px;

      color: #98a2b3;

      font-size: 11px;
    }

  </style>
</head>

<body>

  <main class="maintenance">

    <div class="brand">
      VP Compras
    </div>

    <div class="region">
      Vila Pavão e região
    </div>

    <div class="icon">
      🛠️
    </div>

    <h1>
      Estamos em manutenção
    </h1>

    <p>
      Estamos trabalhando em melhorias
      no VP Compras para oferecer uma
      experiência ainda melhor.
      <br><br>
      Voltaremos em breve.
    </p>

    <div class="status">
      ⚙️ Sistema em atualização
    </div>

    <div class="footer">
      VP Compras
    </div>

  </main>

</body>

</html>
  `, {

    status: 503,

    headers: {
      "Content-Type":
        "text/html; charset=UTF-8",

      "Cache-Control":
        "no-store, no-cache, must-revalidate"
    }

  });

}
