import fs from "node:fs";

const SOURCE_PDF =
  "/Users/bloodknofsky/Documents/1. Lab Works (QuSI)/01_Core_Review_Papers/2020_Barry_RevModPhys_NV_sensitivity_optimization_Review.pdf";
const OUT_PATH =
  "/Users/bloodknofsky/Desktop/hello-page/my-app/data/nv-corpus.json";
const CHUNK_SIZE = 1200;
const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_DIMENSIONS = 512;
// A table-of-contents page can dilute whatever real paragraph it gets chunked
// alongside (fixed-size chunking has no notion of "skip this part"). Tried
// skipping such a page outright once — don't: since chunking is fixed-size,
// removing any page shifts every later chunk boundary by that page's length,
// which can silently break unrelated retrieval elsewhere in the document.
// Leave this empty unless a per-page fix is verified not to regress anything
// else (re-run the suggested questions after any change here).
const SKIP_PAGES = [];

function reconstructReadingOrder(items) {
  if (items.length === 0) return "";
  const sortByPosition = (a, b) => {
    if (Math.abs(a.y - b.y) > 2) return b.y - a.y;
    return a.x - b.x;
  };
  const xs = Array.from(new Set(items.map((i) => Math.round(i.x)))).sort((a, b) => a - b);
  let splitX = null;
  if (xs.length > 2) {
    let maxGap = 0, gapIndex = -1;
    for (let i = 1; i < xs.length; i++) {
      const gap = xs[i] - xs[i - 1];
      if (gap > maxGap) { maxGap = gap; gapIndex = i; }
    }
    if (maxGap > 40 && gapIndex > xs.length * 0.2 && gapIndex < xs.length * 0.8) {
      splitX = (xs[gapIndex - 1] + xs[gapIndex]) / 2;
    }
  }
  if (splitX === null) {
    return items.slice().sort(sortByPosition).map((i) => i.str).join(" ");
  }
  const left = items.filter((i) => i.x < splitX).sort(sortByPosition);
  const right = items.filter((i) => i.x >= splitX).sort(sortByPosition);
  return left.map((i) => i.str).join(" ") + "\n" + right.map((i) => i.str).join(" ");
}

// Bibliography entries ("Author, F. M., year, Journal Vol, page.") are dense
// with ", <year>," patterns in a way flowing prose never is. Detect where that
// density becomes permanent (never drops again) and cut there — reference
// lists are pure citation noise for Q&A and only pollute retrieval.
function stripBibliography(text) {
  const pattern = /,\s(19|20)\d{2},/g;
  const window = 2000;
  const threshold = 3;
  const lookahead = 5;
  const counts = [];
  for (let i = 0; i < text.length; i += window) {
    const slice = text.slice(i, i + window);
    counts.push((slice.match(pattern) || []).length);
  }
  for (let i = 0; i < counts.length - lookahead; i++) {
    if (counts.slice(i, i + lookahead).every((c) => c >= threshold)) {
      console.log(
        `Detected bibliography starting around char ${i * window} of ${text.length} — truncating.`
      );
      return text.slice(0, i * window);
    }
  }
  console.log("No bibliography boundary detected — keeping full text.");
  return text;
}

function chunkText(text) {
  const clean = text.replace(/\s+/g, " ").trim();
  const chunks = [];
  for (let i = 0; i < clean.length; i += CHUNK_SIZE) {
    chunks.push(clean.slice(i, i + CHUNK_SIZE));
  }
  return chunks.filter((c) => c.length > 0);
}

async function extractPdfText(path) {
  const pdfjsLib = await import(
    "/Users/bloodknofsky/Desktop/hello-page/my-app/node_modules/pdfjs-dist/legacy/build/pdf.mjs"
  );
  const data = new Uint8Array(fs.readFileSync(path));
  const pdf = await pdfjsLib.getDocument({ data, isEvalSupported: false }).promise;
  let text = "";
  console.log("Total pages:", pdf.numPages);
  for (let p = 1; p <= pdf.numPages; p++) {
    if (SKIP_PAGES.includes(p)) {
      console.log(`Skipping page ${p} (in SKIP_PAGES)`);
      continue;
    }
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    const items = content.items.map((i) =>
      "str" in i ? { str: i.str, x: i.transform[4], y: i.transform[5] } : { str: "", x: 0, y: 0 }
    );
    text += reconstructReadingOrder(items) + "\n";
  }
  return text;
}

async function embedAll(chunks) {
  const apiKey = process.env.OPENAI_API_KEY;
  const BATCH = 100;
  const vectors = [];
  for (let i = 0; i < chunks.length; i += BATCH) {
    const batch = chunks.slice(i, i + BATCH);
    const res = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: EMBEDDING_MODEL, input: batch, dimensions: EMBEDDING_DIMENSIONS }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Embedding batch ${i} failed: ${res.status} ${body}`);
    }
    const data = await res.json();
    vectors.push(...data.data.map((d) => d.embedding));
    console.log(`Embedded ${Math.min(i + BATCH, chunks.length)}/${chunks.length}`);
  }
  return vectors;
}

const rawText = await extractPdfText(SOURCE_PDF);
console.log("Extracted", rawText.length, "characters");

const text = stripBibliography(rawText);
console.log("After stripping bibliography:", text.length, "characters");
console.log("--- sample (first 300 chars) ---");
console.log(text.slice(0, 300));

const chunks = chunkText(text);
console.log("\nChunk count:", chunks.length);

const vectors = await embedAll(chunks);

const corpus = {
  title: "Sensitivity optimization for NV-diamond magnetometry",
  authors: "Barry, Schloss, Bauch, Turner, Hart, Pham, Walsworth",
  source: "Reviews of Modern Physics 92, 015004 (2020)",
  doi: "10.1103/RevModPhys.92.015004",
  embeddingModel: EMBEDDING_MODEL,
  embeddingDimensions: EMBEDDING_DIMENSIONS,
  chunkSize: CHUNK_SIZE,
  chunks,
  vectors,
};

fs.mkdirSync("/Users/bloodknofsky/Desktop/hello-page/my-app/data", { recursive: true });
fs.writeFileSync(OUT_PATH, JSON.stringify(corpus));
console.log("\nWrote corpus to", OUT_PATH);
console.log("File size:", (fs.statSync(OUT_PATH).size / 1024 / 1024).toFixed(2), "MB");
