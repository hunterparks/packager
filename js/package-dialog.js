import { CARRIERS, detectCarrier } from "./carriers.js";

const dialog = document.getElementById("package-dialog");
const form = document.getElementById("package-form");
const title = document.getElementById("package-dialog-title");
const submitButton = document.getElementById("package-submit-button");
const clearDateButton = document.getElementById("clear-date-button");

const fields = {
  label: form.elements.label,
  trackingNumber: form.elements.trackingNumber,
  carrier: form.elements.carrier,
  estimatedDelivery: form.elements.estimatedDelivery,
  notes: form.elements.notes,
};

const REQUIRED_FIELDS = ["label", "trackingNumber", "carrier"];

// True while the carrier was picked by auto-detection rather than by the user.
// Auto-detected carriers follow the tracking number as it's edited; a carrier
// the user chose by hand is never overwritten.
let carrierAutoFilled = false;

// The values to hand back when the dialog closes; stays null on cancel.
let result = null;
let resolveOpen = null;

/**
 * Opens the add/edit dialog.
 * @param {import("./packages.js").Package} [pkg] Package to edit; omit to add a new one.
 * @param {Partial<import("./packages.js").PackageFields>} [prefill] Starting values when adding
 *   (e.g. from a scanned QR code). A missing carrier is auto-detected from the tracking number.
 * @returns {Promise<import("./packages.js").PackageFields | null>} The saved fields, or null if cancelled.
 */
export function openPackageDialog(pkg, prefill = {}) {
  const isEdit = Boolean(pkg);
  title.textContent = isEdit ? "Edit Package" : "Add Package";
  submitButton.textContent = isEdit ? "Save Changes" : "Add Package";

  const values = pkg ?? prefill;
  for (const [name, input] of Object.entries(fields)) {
    input.value = values[name] ?? "";
    setError(name, null);
  }
  carrierAutoFilled = false;
  if (!isEdit) autoDetectCarrier();
  updateClearDateButton();

  result = null;
  dialog.showModal();
  return new Promise((resolve) => {
    resolveOpen = resolve;
  });
}

// ── Setup ──────────────────────────────────────────────────────────────────

for (const [id, carrier] of Object.entries(CARRIERS)) {
  fields.carrier.add(new Option(carrier.pickerLabel ?? carrier.name, id));
}

// Editing a field clears its validation error.
for (const name of REQUIRED_FIELDS) {
  fields[name].addEventListener("input", () => setError(name, null));
}

fields.trackingNumber.addEventListener("input", autoDetectCarrier);

fields.carrier.addEventListener("input", () => {
  carrierAutoFilled = false;
});

fields.estimatedDelivery.addEventListener("input", updateClearDateButton);

clearDateButton.addEventListener("click", () => {
  fields.estimatedDelivery.value = "";
  updateClearDateButton();
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!validate()) return;
  result = readForm();
  dialog.close();
});

form.querySelector('[data-action="cancel"]').addEventListener("click", () => dialog.close());

// Clicks on the backdrop land on the <dialog> itself; clicks on the content land on the form.
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});

// Fires for every way of closing: submit, Cancel, backdrop click and Escape.
dialog.addEventListener("close", () => {
  resolveOpen?.(result);
  resolveOpen = null;
});

// ── Helpers ────────────────────────────────────────────────────────────────

/** Picks the carrier from the tracking number, unless the user chose one by hand. */
function autoDetectCarrier() {
  const detected = detectCarrier(fields.trackingNumber.value);
  if (detected && (fields.carrier.value === "" || carrierAutoFilled)) {
    fields.carrier.value = detected;
    setError("carrier", null);
    carrierAutoFilled = true;
  } else if (!detected && carrierAutoFilled) {
    fields.carrier.value = "";
    carrierAutoFilled = false;
  }
}

function validate() {
  let valid = true;
  for (const name of REQUIRED_FIELDS) {
    const missing = fields[name].value.trim() === "";
    setError(name, missing ? "Required" : null);
    if (missing) valid = false;
  }
  return valid;
}

function readForm() {
  return {
    label: fields.label.value.trim(),
    trackingNumber: fields.trackingNumber.value.trim().replace(/\s+/g, ""),
    carrier: fields.carrier.value,
    estimatedDelivery: fields.estimatedDelivery.value || undefined,
    notes: fields.notes.value.trim() || undefined,
  };
}

/** Shows `message` under the field, or clears the error when it's null. */
function setError(name, message) {
  const errorText = form.querySelector(`[data-error-for="${name}"]`);
  if (!errorText) return;
  errorText.textContent = message ?? "";
  errorText.hidden = !message;
  fields[name].classList.toggle("input--invalid", Boolean(message));
}

function updateClearDateButton() {
  clearDateButton.hidden = fields.estimatedDelivery.value === "";
}
