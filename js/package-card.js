import { carrierName, normalizeCarrierId, trackingUrl } from "./carriers.js";
import { deliveryStatus, formatShortDate } from "./dates.js";

const template = document.getElementById("package-card-template");

const DELIVERY_PREFIX = { today: "📦 ", overdue: "⚠️ ", upcoming: "" };

/**
 * Builds the list item for one package from the <template> in index.html.
 * @param {import("./packages.js").Package} pkg
 * @param {{ onEdit: () => void, onDelete: () => void }} handlers
 * @returns {HTMLLIElement}
 */
export function renderPackageCard(pkg, { onEdit, onDelete }) {
  const card = template.content.firstElementChild.cloneNode(true);
  const find = (selector) => card.querySelector(selector);

  // Carrier badge
  const name = carrierName(pkg.carrier);
  const badge = find(".badge");
  badge.href = trackingUrl(pkg.carrier, pkg.trackingNumber);
  badge.classList.add(`badge--${normalizeCarrierId(pkg.carrier)}`);
  badge.setAttribute("aria-label", `Track with ${name}`);
  find(".badge__name").textContent = name;

  find(".card__label").textContent = pkg.label;

  if (pkg.estimatedDelivery) {
    const status = deliveryStatus(pkg.estimatedDelivery);
    const delivery = find(".card__delivery");
    delivery.textContent = `${DELIVERY_PREFIX[status]}Est. ${formatShortDate(pkg.estimatedDelivery)}`;
    delivery.classList.add(`card__delivery--${status}`);
    delivery.hidden = false;
  }

  // Show only the ends of the tracking number to keep the card compact.
  const tn = pkg.trackingNumber;
  find(".card__tracking").textContent = `${tn.slice(0, 4)}…${tn.slice(-4)}`;

  if (pkg.notes) {
    const notes = find(".card__notes");
    notes.textContent = pkg.notes;
    notes.hidden = false;
  }

  find('[data-action="edit"]').addEventListener("click", onEdit);
  find('[data-action="delete"]').addEventListener("click", onDelete);

  return card;
}
