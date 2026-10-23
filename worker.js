export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Área da API do VP Compras
    if (url.pathname.startsWith("/api/")) {

      // Teste da API
      if (url.pathname === "/api/status") {
        return Response.json({
          ok: true,
          app: "VP Compras",
          message: "API funcionando"
        });
      }

      // Teste da conexão com o banco D1
      if (url.pathname === "/api/db-status") {
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

      return Response.json(
        { ok: false, message: "Rota da API não encontrada" },
        { status: 404 }
      );
    }

    // Mantém o site atual funcionando normalmente
    return env.ASSETS.fetch(request);
  }
};
