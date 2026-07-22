(function () {
  const commerce = window.LatelierCommerce;
  const ui = window.LatelierUI;

  function renderCart() {
    const cart = commerce.getCart();
    const linesTarget = document.querySelector("[data-cart-lines]");
    const subtotalTarget = document.querySelector("[data-cart-subtotal]");
    const totalTarget = document.querySelector("[data-cart-total]");
    const emptyTarget = document.querySelector("[data-cart-empty]");
    if (!linesTarget) return;

    emptyTarget.hidden = cart.lines.length > 0;
    linesTarget.innerHTML = cart.lines.map((line) => {
      const image = line.image || line.product?.images?.[0] || { src: "", altText: line.product?.title || "" };
      const countertopType = (line.attributes || []).find((item) => item.key === "Countertop Type")?.value || "";
      const subtitle = countertopType || (line.variant?.title || line.product?.title || "");
      const attributes = (line.title ? (line.attributes || []).filter((item) => item.key !== "Design" && item.key !== "Countertop Type") : (line.attributes || []))
        .map((item) => {
          const label = item.key === "Countertop Color" ? "Couleur du comptoir" : item.key;
          return `${label}: ${item.value}`;
        })
        .join(" · ");

      return `
        <article class="cart-line">
          <a href="product.html?handle=${encodeURIComponent(line.product?.handle || "")}">
            <img src="${image.src}" alt="${image.altText}">
          </a>
          <div>
            <h2>${line.title || line.product?.title || ""}</h2>
            <p>${subtitle}</p>
            ${attributes ? `<p class="cart-line-meta">${attributes}</p>` : ""}
            <div class="cart-line-actions">
              <label>
                <span class="sr-only">Quantite</span>
                <input class="quantity-input" type="number" min="1" value="${line.quantity}" data-cart-quantity="${line.lineId}">
              </label>
              <button class="remove-button" type="button" data-cart-remove="${line.lineId}">Retirer</button>
            </div>
          </div>
          <strong>${commerce.formatMoney(line.lineTotal)}</strong>
        </article>
      `;
    }).join("");

    subtotalTarget.textContent = commerce.formatMoney(cart.subtotal);
    totalTarget.textContent = commerce.formatMoney(cart.total || cart.subtotal);
    ui.updateCartBadge();

    linesTarget.querySelectorAll("[data-cart-quantity]").forEach((input) => {
      input.addEventListener("change", async () => {
        try {
          await commerce.updateCartLine(input.dataset.cartQuantity, Number(input.value));
        } catch (error) {
          console.error(error);
        }
        renderCart();
      });
    });

    linesTarget.querySelectorAll("[data-cart-remove]").forEach((button) => {
      button.addEventListener("click", async () => {
        try {
          await commerce.removeCartLine(button.dataset.cartRemove);
        } catch (error) {
          console.error(error);
        }
        renderCart();
      });
    });
  }

  document.addEventListener("DOMContentLoaded", async () => {
    await commerce.ready;
    renderCart();
    const checkoutButton = document.querySelector("[data-checkout]");
    if (checkoutButton) {
      checkoutButton.addEventListener("click", async () => {
        try {
          await commerce.goToCheckout();
        } catch (error) {
          console.error(error);
        }
      });
    }
    window.addEventListener("latelier:cart-updated", renderCart);
  });
})();
