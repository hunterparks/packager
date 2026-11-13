// Entry point: owns the package list and wires the UI pieces together.

import { confirmDelete } from "./delete-dialog.js";
import { renderPackageCard } from "./package-card.js";
import { openPackageDialog } from "./package-dialog.js";
import { createPackage, loadPackages, savePackages, sortPackages } from "./packages.js";

const addButton = document.getElementById("add-button");
const list = document.getElementById("package-list");
const emptyState = document.getElementById("empty-state");

/** @type {import("./packages.js").Package[]} */
let packages = loadPackages();

/** Replaces the package list, saves it and redraws. */
function update(nextPackages) {
  packages = nextPackages;
  savePackages(packages);
  render();
}

function render() {
  emptyState.hidden = packages.length > 0;
  list.hidden = packages.length === 0;
  list.replaceChildren(
    ...sortPackages(packages).map((pkg) =>
      renderPackageCard(pkg, {
        onEdit: () => editPackage(pkg),
        onDelete: () => deletePackage(pkg),
      }),
    ),
  );
}

async function addPackage() {
  const fields = await openPackageDialog();
  if (fields) update([createPackage(fields), ...packages]);
}

async function editPackage(pkg) {
  const fields = await openPackageDialog(pkg);
  if (fields) update(packages.map((p) => (p.id === pkg.id ? { ...p, ...fields } : p)));
}

async function deletePackage(pkg) {
  if (await confirmDelete(pkg)) update(packages.filter((p) => p.id !== pkg.id));
}

addButton.addEventListener("click", addPackage);
render();
