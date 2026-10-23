      // ============================
      // PUBLICAR PREÇO
      // ============================

      if (
        url.pathname === "/api/prices" &&
        request.method === "POST"
      ) {

        try {

          // Verifica quem está logado
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

          const body = await request.json();

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


          // Validação
          if (
            !productName ||
            !storeName ||
            !Number.isFinite(price) ||
            price <= 0
          ) {
            return Response.json(
              {
                ok: false,
                message: "Preencha produto, estabelecimento e preço."
              },
              { status: 400 }
            );
          }


          // Procura o produto
          let product =
            await env.DB.prepare(`
              SELECT id
              FROM products
              WHERE LOWER(name) = LOWER(?)
                AND LOWER(COALESCE(brand, '')) = LOWER(?)
              LIMIT 1
            `)
              .bind(productName, brand)
              .first();


          // Se não existir, cria
          if (!product) {

            const productResult =
              await env.DB.prepare(`
                INSERT INTO products
                (name, category, brand)
                VALUES (?, ?, ?)
              `)
                .bind(
                  productName,
                  category || "Supermercado",
                  brand
                )
                .run();

            product = {
              id: productResult.meta.last_row_id
            };
          }


          // Procura o estabelecimento
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


          // Se não existir, cria
          if (!establishment) {

            const establishmentResult =
              await env.DB.prepare(`
                INSERT INTO establishments
                (name, category, city)
                VALUES (?, ?, ?)
              `)
                .bind(
                  storeName,
                  category || "Supermercado",
                  user.city || "Vila Pavão"
                )
                .run();

            establishment = {
              id: establishmentResult.meta.last_row_id
            };
          }


          // Grava o preço
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


          // Dá 10 pontos ao usuário
          await env.DB.prepare(`
            UPDATE users
            SET points = points + 10
            WHERE id = ?
          `)
            .bind(user.id)
            .run();


          // Registra o movimento dos pontos
          await env.DB.prepare(`
            INSERT INTO point_transactions
            (
              user_id,
              points,
              type,
              description
            )
            VALUES (?, 10, 'price_submission', ?)
          `)
            .bind(
              user.id,
              `Preço cadastrado: ${productName}`
            )
            .run();


          // Busca saldo atualizado
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
              message: "Preço publicado com sucesso.",
              priceId: priceResult.meta.last_row_id,
              pointsEarned: 10,
              points: updatedUser.points
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
