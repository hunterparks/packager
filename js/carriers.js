/**
 * Supported carriers, keyed by id. The id is what gets stored on each package
 * and is also used for the badge colour class (`.badge--<id>` in css/style.css).
 * Key order is the order shown in the carrier picker.
 *
 * `trackingUrl` receives an already URL-encoded tracking number.
 * `hosts` are the domains (subdomains included) whose links in a scanned QR
 * code are recognised as that carrier's tracking links.
 */
export const CARRIERS = {
  usps: {
    name: "USPS",
    hosts: ["usps.com"],
    trackingUrl: (n) => `https://tools.usps.com/go/TrackConfirmAction?tLabels=${n}`,
  },
  ups: {
    name: "UPS",
    hosts: ["ups.com"],
    trackingUrl: (n) => `https://www.ups.com/track?tracknum=${n}`,
  },
  fedex: {
    name: "FedEx",
    hosts: ["fedex.com"],
    trackingUrl: (n) => `https://www.fedex.com/fedextrack/?trknbr=${n}`,
  },
  amazon: {
    name: "Amazon",
    hosts: ["amazon.com"],
    trackingUrl: (n) => `https://track.amazon.com/tracking/${n.toUpperCase()}`,
  },
  dhl: {
    name: "DHL",
    hosts: ["dhl.com"],
    trackingUrl: (n) => `https://www.dhl.com/us-en/home/tracking.html?tracking-id=${n}`,
  },
  ontrac: {
    name: "OnTrac",
    hosts: ["ontrac.com"],
    trackingUrl: (n) => `https://www.ontrac.com/tracking/?number=${n}`,
  },
  lasership: {
    name: "LSO",
    hosts: ["lasership.com", "lso.com"],
    pickerLabel: "LaserShip / LSO",
    trackingUrl: (n) => `https://www.lasership.com/track/${n}`,
  },
  gofo: {
    name: "GOFO",
    hosts: ["gofo.com"],
    trackingUrl: (n) => `https://www.gofo.com/us/track?searchID=${n}`,
  },
  yunexpress: {
    name: "Yun Express",
    hosts: ["yuntrack.com", "yunexpress.com"],
    trackingUrl: (n) => `https://www.yuntrack.com/parcelTracking?id=${n}`,
  },
  uniuni: {
    name: "UniUni",
    hosts: ["uniuni.com"],
    trackingUrl: (n) => `https://www.uniuni.com/tracking#tracking-detail?no=${n}`,
  },
  other: {
    name: "Other",
    trackingUrl: (n) => `https://www.google.com/search?q=${n}`,
  },
};

/** Returns a known carrier id, falling back to "other" for unknown values. */
export function normalizeCarrierId(id) {
  return Object.hasOwn(CARRIERS, id) ? id : "other";
}

export function carrierName(id) {
  return CARRIERS[normalizeCarrierId(id)].name;
}

export function trackingUrl(carrierId, trackingNumber) {
  const carrier = CARRIERS[normalizeCarrierId(carrierId)];
  return carrier.trackingUrl(encodeURIComponent(trackingNumber));
}

/**
 * Guesses the carrier from the shape of a tracking number.
 * Returns a carrier id, or null when the format isn't recognised.
 * More specific prefixes are checked before the generic all-digit formats.
 */
export function detectCarrier(raw) {
  const tn = raw.trim().toUpperCase().replace(/\s/g, "");
  if (tn.length < 8) return null;

  // UPS: 1Z + 16 alphanumeric chars
  if (/^1Z[0-9A-Z]{16}$/.test(tn)) return "ups";

  // Amazon Logistics: TBA + 12 digits
  if (/^TBA\d{12}$/.test(tn)) return "amazon";

  // DHL Express: JD + 16 digits; DHL eCommerce: GM + 16 digits
  if (/^(JD|GM)\d{16}$/.test(tn)) return "dhl";

  // LaserShip / LSO: 1LS or LS + 9 or more digits
  if (/^1?LS\d{9,}$/.test(tn)) return "lasership";

  // OnTrac: C + 14 digits
  if (/^C\d{14}$/.test(tn)) return "ontrac";

  // GOFO: GF + 2-letter country code + digits (e.g. GFUS01045932591808)
  if (/^GF[A-Z]{2}\d+$/.test(tn)) return "gofo";

  // Yun Express: YT + digits (e.g. YT2610400701656969)
  if (/^YT\d+$/.test(tn)) return "yunexpress";

  // UniUni: UUS or UNI + digits
  if (/^(UUS|UNI)\d+$/.test(tn)) return "uniuni";

  // USPS: 20–26 digits starting with 9
  if (/^9\d{19,25}$/.test(tn)) return "usps";
  // USPS: 420 + 5-digit ZIP + tracking number starting with 9
  if (/^420\d{5}9\d{19,21}$/.test(tn)) return "usps";
  // USPS international (e.g. EA123456789US)
  if (/^[A-Z]{2}\d{8}US$/.test(tn)) return "usps";

  // FedEx: 12 or 15 digits, or 20 digits starting with 96
  if (/^(\d{12}|\d{15})$/.test(tn)) return "fedex";
  if (/^96\d{18}$/.test(tn)) return "fedex";

  return null;
}

/**
 * Turns the text of a scanned QR code into form values.
 * A tracking link from a known carrier yields the tracking number inside it and
 * that carrier; anything else is passed through as the tracking number as-is.
 * @param {string} text
 * @returns {{ trackingNumber: string, carrier?: string }}
 */
export function parseScannedCode(text) {
  const raw = text.trim();
  const url = parseHttpUrl(raw);
  const carrier = url && carrierForHost(url.hostname);
  if (!carrier) return { trackingNumber: raw };

  const trackingNumber = trackingNumberFromUrl(url);
  return trackingNumber ? { trackingNumber, carrier } : { trackingNumber: raw };
}

function parseHttpUrl(text) {
  try {
    const url = new URL(text);
    return url.protocol === "https:" || url.protocol === "http:" ? url : null;
  } catch {
    return null;
  }
}

function carrierForHost(hostname) {
  const host = hostname.toLowerCase();
  for (const [id, carrier] of Object.entries(CARRIERS)) {
    if (carrier.hosts?.some((h) => host === h || host.endsWith(`.${h}`))) return id;
  }
  return null;
}

/**
 * Finds the tracking number in a carrier link. Carriers put it in a query
 * parameter (`?tracknum=…`), in a parameter after the hash (`#…?no=…`) or in
 * the path (`/tracking/TBA…`), under various names, so every candidate is
 * collected and the best one picked: first one with a recognised tracking
 * number format, then any query value, then a path segment.
 */
function trackingNumberFromUrl(url) {
  const hashQuery = url.hash.includes("?") ? url.hash.slice(url.hash.indexOf("?")) : "";
  const paramValues = [...url.searchParams.values(), ...new URLSearchParams(hashQuery).values()]
    .flatMap((value) => value.split(",")) // USPS allows several: tLabels=A,B
    .map((value) => value.trim())
    .filter(looksLikeTrackingNumber);
  const pathSegments = url.pathname
    .split("/")
    .map((segment) => decodeURIComponentSafe(segment).trim())
    .filter((segment) => looksLikeTrackingNumber(segment) && /\d/.test(segment))
    .reverse();

  const candidates = [...paramValues, ...pathSegments];
  return candidates.find((c) => detectCarrier(c)) ?? candidates[0] ?? null;
}

function looksLikeTrackingNumber(value) {
  return /^[0-9A-Za-z]{8,40}$/.test(value);
}

function decodeURIComponentSafe(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
