export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Área da API do VP Compras
    if (url.pathname.startsWith("/api/")) {
      if (url.pathname === "/api/status") {
        return Response.json({
          ok: true,
          app: "VP Compras",
          message: "API funcionando"
        });
      }

      return Response.json(
        { ok: false, message: "Rota da API não encontrada" },
        { status: 404 }
      );
    }

    // Todo o restante continua carregando o site atual
    return env.ASSETS.fetch(request);
  }
};
