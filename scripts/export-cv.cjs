#!/usr/bin/env node
"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require("playwright");
const {
  PDFDocument,
  PDFDict,
  PDFName,
  PDFString,
  PDFHexString,
} = require("pdf-lib");

const ROOT = path.resolve(__dirname, "..");
const TITLE = "Phung Duc Anh - CV";
const PAGE_MM = { width: 210, height: 297, margin: 12 };
const CSS_PX_PER_MM = 96 / 25.4;
const PRINTABLE = {
  width: (PAGE_MM.width - PAGE_MM.margin * 2) * CSS_PX_PER_MM,
  height: (PAGE_MM.height - PAGE_MM.margin * 2) * CSS_PX_PER_MM,
};
const OUTPUTS = [
  path.join(ROOT, "output", "pdf", "Phung-Duc-Anh-CV.pdf"),
  path.join(ROOT, "assets", "phung-duc-anh-cv.pdf"),
];

async function inspectLayout(page) {
  const result = await page.evaluate(async (printable) => {
    await document.fonts.ready;
    const resume = document.querySelector("article#resume.resume-document");
    const problems = [];
    const tolerance = 0.5; // Fractional CSS-pixel rounding, never a layout adjustment.
    const bounds = resume.getBoundingClientRect();
    const elements = [
      document.documentElement,
      document.body,
      resume,
      ...resume.querySelectorAll("*"),
    ];
    const describe = (element) =>
      element.id ? `#${element.id}` : element.tagName.toLowerCase();

    if (!resume.innerText.trim() || bounds.width <= 0 || bounds.height <= 0) {
      problems.push("The resume is empty or not visible in print media.");
    }

    function checkBounds(rect, label) {
      if (!rect.width || !rect.height) return;
      if (rect.left < -tolerance || rect.right > printable.width + tolerance) {
        problems.push(
          `${label} exceeds the printable width (${rect.left.toFixed(2)}..${rect.right.toFixed(2)} px).`,
        );
      }
      if (rect.top < -tolerance || rect.bottom > printable.height + tolerance) {
        problems.push(
          `${label} exceeds the printable height (${rect.top.toFixed(2)}..${rect.bottom.toFixed(2)} px).`,
        );
      }
    }

    checkBounds(bounds, "#resume");
    for (const element of elements) {
      const style = getComputedStyle(element);
      if (style.display === "none" || style.visibility === "hidden") continue;
      const label = describe(element);
      if (
        ["hidden", "clip"].includes(style.overflowX) ||
        ["hidden", "clip"].includes(style.overflowY) ||
        style.clipPath !== "none" ||
        style.clip !== "auto"
      ) {
        problems.push(
          `${label} uses clipping; export must fit without hiding content.`,
        );
      }
      if (
        style.transform !== "none" ||
        !["1", "normal", ""].includes(style.zoom)
      ) {
        problems.push(
          `${label} uses a transform or zoom; export must fit at its authored size.`,
        );
      }
      if (element !== document.documentElement && element !== document.body) {
        for (const rect of element.getClientRects()) checkBounds(rect, label);
        if (
          element.clientWidth &&
          element.scrollWidth > element.clientWidth + 1
        ) {
          problems.push(`${label} has horizontal content overflow.`);
        }
      }
      if (
        element.tagName === "IMG" &&
        (!element.complete || !element.naturalWidth)
      ) {
        problems.push(`${label} contains an image that did not load.`);
      }
    }

    // Text ranges catch overflow even when a fixed-height parent conceals its size.
    const walker = document.createTreeWalker(resume, NodeFilter.SHOW_TEXT);
    for (let text = walker.nextNode(); text; text = walker.nextNode()) {
      if (!text.textContent.trim()) continue;
      const range = document.createRange();
      range.selectNodeContents(text);
      for (const rect of range.getClientRects()) {
        checkBounds(rect, `Text "${text.textContent.trim().slice(0, 55)}"`);
      }
    }

    const links = [...resume.querySelectorAll("a[href]")].map(
      (link) => link.href,
    );
    for (const href of links) {
      if (!/^(https?:|mailto:|tel:)/i.test(href)) {
        problems.push(
          `Resume links must use absolute web, email, or telephone URLs: ${href}`,
        );
      }
    }

    return {
      problems: [...new Set(problems)],
      links: [...new Set(links)],
      width: bounds.width,
      height: bounds.height,
    };
  }, PRINTABLE);

  if (result.problems.length) {
    throw new Error(
      `Resume layout validation failed:\n- ${result.problems.slice(0, 20).join("\n- ")}`,
    );
  }
  return result;
}

async function validatePdf(bytes, expectedLinks) {
  const pdf = await PDFDocument.load(bytes);
  if (pdf.getPageCount() !== 1) {
    throw new Error(
      `Expected exactly 1 PDF page; received ${pdf.getPageCount()}. Adjust resume.css or content; do not scale or clip it.`,
    );
  }

  const page = pdf.getPage(0);
  const size = page.getSize();
  const expectedWidth = (PAGE_MM.width * 72) / 25.4;
  const expectedHeight = (PAGE_MM.height * 72) / 25.4;
  if (
    Math.abs(size.width - expectedWidth) > 1 ||
    Math.abs(size.height - expectedHeight) > 1
  ) {
    throw new Error(
      `Expected portrait A4; received ${size.width.toFixed(2)} × ${size.height.toFixed(2)} pt.`,
    );
  }

  const actualLinks = new Set();
  for (const annotationRef of page.node.Annots()?.asArray() || []) {
    const annotation = pdf.context.lookup(annotationRef, PDFDict);
    const action = annotation.lookupMaybe(PDFName.of("A"), PDFDict);
    const uriRef = action?.get(PDFName.of("URI"));
    if (!uriRef) continue;
    const uri = pdf.context.lookup(uriRef);
    if (uri instanceof PDFString || uri instanceof PDFHexString)
      actualLinks.add(uri.decodeText());
  }
  const missingLinks = expectedLinks.filter((href) => !actualLinks.has(href));
  if (missingLinks.length) {
    throw new Error(
      `PDF is missing clickable links:\n- ${missingLinks.join("\n- ")}`,
    );
  }
  return size;
}

async function writeValidatedCopies(bytes) {
  const pending = [];
  try {
    for (const destination of OUTPUTS) {
      await fs.mkdir(path.dirname(destination), { recursive: true });
      const temporary = `${destination}.${process.pid}.tmp`;
      pending.push({ temporary, destination });
      await fs.writeFile(temporary, bytes, { flag: "wx" });
    }
    for (const { temporary, destination } of pending)
      await fs.rename(temporary, destination);
  } finally {
    await Promise.all(
      pending.map(({ temporary }) => fs.rm(temporary, { force: true })),
    );
  }
}

async function main() {
  const sourceUrl = pathToFileURL(path.join(ROOT, "index.html")).href;
  const resumeCss = await fs.readFile(path.join(ROOT, "resume.css"), "utf8");
  const channel = process.env.CV_BROWSER_CHANNEL?.trim();
  let browser;

  try {
    try {
      browser = await chromium.launch({
        headless: true,
        ...(channel ? { channel } : {}),
      });
    } catch (error) {
      throw new Error(
        `Could not launch ${channel || "Playwright Chromium"}. Run "npx playwright install chromium" or set CV_BROWSER_CHANNEL=chrome to use installed Chrome.\n${error.message}`,
      );
    }

    const context = await browser.newContext({
      viewport: {
        width: Math.ceil(PRINTABLE.width),
        height: Math.ceil(PRINTABLE.height),
      },
      deviceScaleFactor: 1,
      javaScriptEnabled: false,
      serviceWorkers: "block",
    });
    // Read the local HTML only; website scripts, remote fonts, and all other requests are blocked.
    await context.route("**/*", (route) => {
      const request = route.request();
      return request.url() === sourceUrl &&
        request.resourceType() === "document"
        ? route.continue()
        : route.abort("blockedbyclient");
    });

    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    await page.emulateMedia({ media: "print", colorScheme: "light" });
    await page.goto(sourceUrl, { waitUntil: "domcontentloaded" });
    if ((await page.locator("article#resume.resume-document").count()) !== 1) {
      throw new Error(
        "index.html must contain exactly one article#resume.resume-document.",
      );
    }
    const markup = await page
      .locator("#resume")
      .evaluate((element) => element.outerHTML);

    // Isolate the authored resume from the portfolio and from browser/site stylesheet differences.
    await page.setContent(
      `<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>${TITLE}</title><style>${resumeCss}
@page { size: A4 portrait; margin: ${PAGE_MM.margin}mm; }
html, body { margin: 0; padding: 0; background: white; color-scheme: light; }
body { width: ${PAGE_MM.width - PAGE_MM.margin * 2}mm; }
#resume, #resume * { font-family: Arial, Helvetica, sans-serif !important; }
</style></head><body>${markup}</body></html>`,
      { waitUntil: "load" },
    );

    const layout = await inspectLayout(page);
    const bytes = await page.pdf({
      format: "A4",
      margin: { top: "12mm", right: "12mm", bottom: "12mm", left: "12mm" },
      scale: 1,
      preferCSSPageSize: true,
      printBackground: true,
      displayHeaderFooter: false,
      tagged: true,
    });
    const pageSize = await validatePdf(bytes, layout.links);
    await writeValidatedCopies(bytes);

    console.log(
      `Validated: 1 A4 page (${pageSize.width.toFixed(2)} × ${pageSize.height.toFixed(2)} pt), ${layout.links.length} clickable links.`,
    );
    console.log(
      `Content: ${(layout.width / CSS_PX_PER_MM).toFixed(2)} × ${(layout.height / CSS_PX_PER_MM).toFixed(2)} mm within 186 × 273 mm; scale 1.`,
    );
    for (const output of OUTPUTS) console.log(`Saved: ${output}`);
  } finally {
    if (browser) await browser.close();
  }
}

main().catch((error) => {
  console.error(`CV export failed: ${error.message}`);
  process.exitCode = 1;
});
