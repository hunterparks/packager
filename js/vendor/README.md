# Vendored libraries

Copied in as-is: no package manager, no build step.

| File | Library | Version | License | Source |
| --- | --- | --- | --- | --- |
| `jsQR.js` | [jsQR](https://github.com/cozmo/jsQR) | 1.4.0 | Apache-2.0 (`jsQR.LICENSE`) | `dist/jsQR.js` from the npm tarball `jsqr-1.4.0.tgz` (sha1 `8efb8d0a7cc6863cb6d95116b9069123ce9eb2d1`) |

jsQR decodes QR codes in browsers without the built-in `BarcodeDetector`
(e.g. every browser on iPhone). It's loaded by `js/scan-dialog.js` only when needed.
