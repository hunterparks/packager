# Packager

A mobile-first package tracker, live at **https://packager.stup.dev**.

Track shipments from USPS, UPS, FedEx, Amazon, DHL, OnTrac, LaserShip/LSO, GOFO, Yun Express, UniUni and more. Everything is stored in your browser's `localStorage`, so there's no account and no server.

## Features

- Add packages with a label, tracking number, carrier, estimated delivery date and notes
- Carrier auto-detected from the tracking number format
- Scan a QR code to add a package: carrier tracking links are unpacked into tracking number and carrier, any other text is used as the tracking number. Uses the browser's built-in `BarcodeDetector` where available and the vendored [jsQR](https://github.com/cozmo/jsQR) elsewhere (e.g. iPhone). Needs camera access, so the scan button is grayed out on plain-HTTP pages
- Paste a carrier tracking link into the tracking number field (e.g. copied from the iPhone Camera app's QR preview) to fill in the tracking number and carrier
- Tap the carrier badge to open that carrier's tracking page
- Undated packages listed first (newest first), then dated ones from soonest to latest
- Delivery date highlights: yellow for today, red for overdue
- Light and dark mode follow the system setting

## Project layout

Plain HTML, CSS and JavaScript modules: no framework, no build step, no package manager. The one third-party file, jsQR, is copied into `js/vendor/` (see its README there).

```
index.html             Page markup: header, list, card <template>, and both <dialog>s
css/style.css          All styles; colour tokens and dark mode at the top
js/main.js             Entry point: holds the package list, renders it, handles add/edit/delete
js/packages.js         Package type, localStorage load/save, creation and sort order
js/carriers.js         Carrier list, tracking URLs, tracking-number detection, QR link parsing
js/dates.js            Date helpers (today, formatting, today/overdue/upcoming)
js/package-card.js     Builds one list item from the card template
js/package-dialog.js   Add/edit form: validation, carrier auto-detection, pasting tracking links
js/delete-dialog.js    Delete confirmation
js/scan-dialog.js      QR code scanner (camera + BarcodeDetector, or jsQR as a fallback)
js/vendor/             Vendored third-party code (jsQR) with licenses
favicon.svg            📦
CNAME                  Custom domain for GitHub Pages
.nojekyll              Tells GitHub Pages to serve files as-is
```

### Adding a carrier

1. Add an entry to `CARRIERS` in `js/carriers.js`. Key order is the order shown in the picker.
2. Add a `.badge--<id>` colour rule in `css/style.css`.
3. Optionally, add a pattern to `detectCarrier`.
4. Optionally, list the carrier's domains in `hosts` so scanned tracking links are recognised.

## Running locally

ES modules don't load from `file://`, so serve the folder over HTTP:

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

## Deployment (GitHub Pages)

1. In the repo, go to **Settings → Pages** and set **Source** to *Deploy from a branch*, then pick `main` and `/ (root)`.
2. The `CNAME` file sets the custom domain to `packager.stup.dev`.
3. At your DNS provider, add a `CNAME` record from `packager` to `hunterparks.github.io`.
4. Once the certificate is issued, enable **Enforce HTTPS** under Settings → Pages.
