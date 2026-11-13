const dialog = document.getElementById("delete-dialog");
const nameText = document.getElementById("delete-dialog-name");

let confirmed = false;
let resolveOpen = null;

/**
 * Asks the user to confirm deleting a package.
 * @param {import("./packages.js").Package} pkg
 * @returns {Promise<boolean>} true if the user chose Delete.
 */
export function confirmDelete(pkg) {
  nameText.textContent = `"${pkg.label}"`;
  confirmed = false;
  dialog.showModal();
  return new Promise((resolve) => {
    resolveOpen = resolve;
  });
}

dialog.querySelector('[data-action="confirm"]').addEventListener("click", () => {
  confirmed = true;
  dialog.close();
});

dialog.querySelector('[data-action="cancel"]').addEventListener("click", () => dialog.close());

// Fires for Delete, Cancel and Escape.
dialog.addEventListener("close", () => {
  resolveOpen?.(confirmed);
  resolveOpen = null;
});
