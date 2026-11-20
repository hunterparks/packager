import { carrierName, normalizeCarrierId, trackingUrl } from "./carriers.js";
import { daysUntil, deliveryStatus, formatShortDate } from "./dates.js";

const template = document.getElementById("package-card-template");

const DELIVERY_PREFIX = { today: "📦 ", overdue: "⚠️ " };

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
    const dateText = `Est. ${formatShortDate(pkg.estimatedDelivery)}`;
    if (status === "upcoming") {
      // Upcoming dates get a chip with the number of days left (always ≥ 1).
      const days = daysUntil(pkg.estimatedDelivery);
      const chip = document.createElement("span");
      chip.className = "card__days";
      chip.textContent = String(days);
      chip.setAttribute("aria-label", `${days} ${days === 1 ? "day" : "days"} away`);
      delivery.replaceChildren(chip, ` ${dateText}`);
    } else {
      delivery.textContent = `${DELIVERY_PREFIX[status]}${dateText}`;
    }
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
