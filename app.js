card.innerHTML = `
  <div class="social-post">

    <div class="social-user">
      <div class="social-avatar">
        ${escapeHTML((item.user_name || "U").charAt(0).toUpperCase())}
      </div>

      <div class="social-user-info">
        <strong>
          ${escapeHTML((item.user_name || "Usuário").split(" ")[0])}
        </strong>
        <small>publicou um preço</small>
      </div>

      <span class="social-category">
        🛒 ${escapeHTML(item.category || "")}
      </span>
    </div>

    <div class="social-product">
      <div>
        <h3>${escapeHTML(item.product)}</h3>

        ${
          item.brand
            ? `<p>${escapeHTML(item.brand)}</p>`
            : ""
        }

        <span>
          🏪 ${escapeHTML(item.store)}
          &nbsp; • &nbsp;
          📍 ${escapeHTML(item.city || "")}
        </span>
      </div>

      <strong class="social-price">
        ${price}
      </strong>
    </div>

    <div class="social-actions">
      <button type="button">
        ✓ Confirmar
      </button>

      <button type="button">
        💬 Comentar
      </button>
    </div>

  </div>
`;
