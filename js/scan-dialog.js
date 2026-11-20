// QR code scanner. Uses the browser's built-in BarcodeDetector where it exists
// (Chrome/Edge on Android and macOS, Samsung Internet) and falls back to the
// vendored jsQR library everywhere else (Firefox, every browser on iPhone).
// jsQR is only downloaded the first time the fallback is needed.

const dialog = document.getElementById("scan-dialog");
const video = dialog.querySelector("video");
const message = document.getElementById("scan-dialog-message");

const SCAN_INTERVAL_MS = 150;
// jsQR works on raw pixels, so frames are scaled down to this many pixels on
// the long side first: plenty for a QR code held up to the camera, and fast.
const FALLBACK_MAX_SIZE = 640;

/** @type {MediaStream | null} */
let stream = null;
/** @type {Promise<(source: HTMLVideoElement) => Promise<string | null>> | null} */
let decoderPromise = null;
// Bumped on every open and close, so a camera that finishes starting after the
// dialog was closed (e.g. while the permission prompt was up) is shut down.
let session = 0;

let result = null;
let resolveOpen = null;

/** True when this browser can use the camera (needs HTTPS or localhost). */
export function isScanSupported() {
  return Boolean(navigator.mediaDevices?.getUserMedia);
}

/**
 * Opens the camera and waits for a QR code.
 * @returns {Promise<string | null>} The QR code's text, or null if cancelled.
 */
export function scanQrCode() {
  result = null;
  setMessage("Point the camera at a QR code");
  dialog.showModal();
  startCamera(++session);
  return new Promise((resolve) => {
    resolveOpen = resolve;
  });
}

dialog.querySelector('[data-action="cancel"]').addEventListener("click", () => dialog.close());

// Fires for a successful scan, Cancel and Escape.
dialog.addEventListener("close", () => {
  session++;
  stopCamera();
  resolveOpen?.(result);
  resolveOpen = null;
});

async function startCamera(id) {
  let newStream;
  let decode;
  try {
    [newStream, decode] = await Promise.all([
      navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false }),
      getDecoder(),
    ]);
  } catch (error) {
    newStream?.getTracks().forEach((track) => track.stop());
    if (id === session) {
      setMessage(
        error.name === "NotAllowedError"
          ? "Camera access was blocked. Allow it in your browser settings to scan."
          : "Couldn't start the scanner.",
      );
    }
    return;
  }

  if (id !== session) {
    newStream.getTracks().forEach((track) => track.stop());
    return;
  }

  stream = newStream;
  video.srcObject = stream;
  scanFrames(id, decode);
}

async function scanFrames(id, decode) {
  while (id === session) {
    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      try {
        const text = await decode(video);
        if (text && id === session) {
          result = text;
          dialog.close();
          return;
        }
      } catch {
        // A frame that can't be read yet; try the next one.
      }
    }
    await new Promise((resolve) => setTimeout(resolve, SCAN_INTERVAL_MS));
  }
}

function stopCamera() {
  stream?.getTracks().forEach((track) => track.stop());
  stream = null;
  video.srcObject = null;
}

function setMessage(text) {
  message.textContent = text;
}

// ── Decoders ───────────────────────────────────────────────────────────────

/** Returns a function that reads a QR code from a video frame, or null if none. */
function getDecoder() {
  decoderPromise ??= createDecoder().catch((error) => {
    decoderPromise = null; // e.g. offline when jsQR was first needed: retry next time
    throw error;
  });
  return decoderPromise;
}

async function createDecoder() {
  if (await hasNativeQrDetector()) {
    const detector = new BarcodeDetector({ formats: ["qr_code"] });
    return async (source) => (await detector.detect(source))[0]?.rawValue || null;
  }

  // jsQR is a UMD bundle: run as a module, it sets `self.jsQR`.
  await import("./vendor/jsQR.js");
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });

  return async (source) => {
    const scale = Math.min(1, FALLBACK_MAX_SIZE / Math.max(source.videoWidth, source.videoHeight));
    canvas.width = Math.round(source.videoWidth * scale);
    canvas.height = Math.round(source.videoHeight * scale);
    if (!canvas.width || !canvas.height) return null;
    context.drawImage(source, 0, 0, canvas.width, canvas.height);
    const { data, width, height } = context.getImageData(0, 0, canvas.width, canvas.height);
    return self.jsQR(data, width, height, { inversionAttempts: "dontInvert" })?.data || null;
  };
}

async function hasNativeQrDetector() {
  if (!("BarcodeDetector" in window)) return false;
  try {
    return (await BarcodeDetector.getSupportedFormats()).includes("qr_code");
  } catch {
    return false;
  }
}
