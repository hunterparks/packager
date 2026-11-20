// QR code scanner, built on the browser's own BarcodeDetector API (no library).
// BarcodeDetector is only available in some browsers (Chrome/Edge on Android
// and macOS, Samsung Internet), so the scan button is hidden everywhere else.

const dialog = document.getElementById("scan-dialog");
const video = dialog.querySelector("video");
const message = document.getElementById("scan-dialog-message");

const SCAN_INTERVAL_MS = 150;

/** @type {MediaStream | null} */
let stream = null;
let detector = null;
// Bumped on every open and close, so a camera that finishes starting after the
// dialog was closed (e.g. while the permission prompt was up) is shut down.
let session = 0;

let result = null;
let resolveOpen = null;

/** Resolves to true when this browser can scan QR codes from the camera. */
export async function isScanSupported() {
  if (!("BarcodeDetector" in window) || !navigator.mediaDevices?.getUserMedia) return false;
  try {
    return (await BarcodeDetector.getSupportedFormats()).includes("qr_code");
  } catch {
    return false;
  }
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
  try {
    newStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
      audio: false,
    });
  } catch (error) {
    if (id === session) {
      setMessage(
        error.name === "NotAllowedError"
          ? "Camera access was blocked. Allow it in your browser settings to scan."
          : "Couldn't open the camera.",
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
  detector ??= new BarcodeDetector({ formats: ["qr_code"] });
  scanFrames(id);
}

async function scanFrames(id) {
  while (id === session) {
    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      try {
        const [code] = await detector.detect(video);
        if (code?.rawValue && id === session) {
          result = code.rawValue;
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
