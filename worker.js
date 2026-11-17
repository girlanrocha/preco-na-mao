// ========================================
// VP COMPRAS - GUIA COMERCIAL
// Cloudflare Worker - ES Module
// ========================================
//
// Esta versão substitui temporariamente o backend antigo
// de login, preços, pontos e confirmações.
//
// O novo VP Compras funciona inicialmente como
// Guia Comercial público.
//
// O binding ASSETS é usado para servir:
// - index.html
// - style.css
// - app.js
// - manifest.json
// - ícones e demais arquivos estáticos
//
// O banco D1 pode continuar configurado no Cloudflare.
// Ele será reutilizado posteriormente no painel administrativo.
// ========================================

export default {
  async fetch(request, env) {
    try {
      return await env.ASSETS.fetch(request);
    } catch (error) {
      console.error("Erro ao carregar VP Compras:", error);

      return new Response(
        `<!doctype html>
        <html lang="pt-BR">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>VP Compras</title>
          <style>
            body {
              margin: 0;
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 20px;
              box-sizing: border-box;
              font-family: Arial, Helvetica, sans-serif;
              background: #f5f8fc;
              color: #172033;
            }

            .box {
              width: 100%;
              max-width: 480px;
              padding: 32px 24px;
              background: #ffffff;
              border-radius: 22px;
              text-align: center;
              box-shadow: 0 10px 30px rgba(0, 0, 0, .08);
            }

            h1 {
              margin: 0 0 12px;
              color: #075ed1;
            }

            p {
              margin: 0;
              line-height: 1.6;
              color: #667085;
            }
          </style>
        </head>

        <body>
          <div class="box">
            <h1>VP Compras</h1>
            <p>
              Não foi possível carregar o Guia Comercial.
              Tente novamente em alguns instantes.
            </p>
          </div>
        </body>
        </html>`,
        {
          status: 500,
          headers: {
            "Content-Type": "text/html; charset=UTF-8",
            "Cache-Control": "no-store"
          }
        }
      );
    }
  }
};
