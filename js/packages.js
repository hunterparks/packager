/**
 * @typedef {Object} Package
 * @property {string} id
 * @property {string} label
 * @property {string} trackingNumber
 * @property {string} carrier            Carrier id from js/carriers.js
 * @property {string} [estimatedDelivery] "YYYY-MM-DD"
 * @property {string} [notes]
 * @property {string} createdAt          ISO timestamp
 */

/** The user-editable fields of a Package. */
/** @typedef {Omit<Package, "id" | "createdAt">} PackageFields */

const STORAGE_KEY = "packager_packages_v1";

/** @returns {Package[]} */
export function loadPackages() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // Unreadable or corrupt data: start with an empty list rather than a broken page.
    return [];
  }
}

/** @param {Package[]} packages */
export function savePackages(packages) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(packages));
}

/**
 * @param {PackageFields} fields
 * @returns {Package}
 */
export function createPackage(fields) {
  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...fields,
  };
}

/**
 * Display order: packages without a delivery date first (newest first),
 * then dated packages from soonest to latest.
 * @param {Package[]} packages
 */
export function sortPackages(packages) {
  const undated = packages
    .filter((p) => !p.estimatedDelivery)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const dated = packages
    .filter((p) => p.estimatedDelivery)
    .sort((a, b) => a.estimatedDelivery.localeCompare(b.estimatedDelivery));
  return [...undated, ...dated];
}
