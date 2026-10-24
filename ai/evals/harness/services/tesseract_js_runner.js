// Thin Node runner that calls tesseract.js the same way the Next.js
// `/api/search/ocr` route does. Reads one image path from argv[2], prints
// the extracted text to stdout, exits 0. On any error exits non-zero with
// the message on stderr. The purpose is to let the Python eval harness
// score "today's OCR service" (the tesseract.js model behind the API) WITHOUT
// standing up a full Next.js dev server.
//
// Uses waquor/node_modules/tesseract.js — no new dep.

"use strict";

const path = require("path");
const Module = require("module");

async function main() {
  const imagePath = process.argv[2];
  if (!imagePath) {
    console.error("usage: node tesseract_js_runner.js <image-path>");
    process.exit(2);
  }

  // Resolve tesseract.js from waquor/node_modules so this script needs no
  // top-level package install.
  const waquorPkg = path.resolve(__dirname, "../../../../waquor");
  const req = Module.createRequire(path.join(waquorPkg, "package.json"));

  let tesseract;
  try {
    tesseract = req("tesseract.js");
  } catch (e) {
    console.error(
      "tesseract.js not available from waquor/node_modules — run " +
        "`npm --prefix waquor ci` first. (" +
        e.message +
        ")"
    );
    process.exit(3);
  }

  const langs = process.env.OCR_LANGS || "eng+ara";
  // Put the language cache under a stable per-user dir so repeat runs don't
  // re-download, and so the .traineddata blobs never land next to source.
  const os = require("os");
  const cachePath = path.join(os.tmpdir(), "banabuild-tesseract-cache");
  try {
    const { data } = await tesseract.recognize(imagePath, langs, {
      cachePath,
      logger: () => {},
    });
    process.stdout.write(data.text || "");
    process.exit(0);
  } catch (e) {
    console.error("tesseract.js error: " + (e && e.message ? e.message : e));
    process.exit(4);
  }
}

main();
