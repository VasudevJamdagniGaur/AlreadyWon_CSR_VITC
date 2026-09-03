/**
 * Document text extraction service.
 * Supports TXT, MD, JSON, CSV, PDF, DOCX.
 */

export async function extractTextFromBuffer(
  buffer: Buffer,
  mimeType: string,
  fileName: string
): Promise<string> {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";

  if (
    mimeType.includes("text/") ||
    ["txt", "md", "markdown", "csv", "json"].includes(ext)
  ) {
    return buffer.toString("utf-8");
  }

  if (mimeType.includes("pdf") || ext === "pdf") {
    try {
      // Dynamic import — pdf-parse
      const pdfParse = (await import("pdf-parse")).default;
      const result = await pdfParse(buffer);
      return result.text || "";
    } catch {
      return buffer.toString("utf-8").replace(/[^\x20-\x7E\n\r\t]/g, " ");
    }
  }

  if (
    mimeType.includes("wordprocessingml") ||
    mimeType.includes("msword") ||
    ext === "docx" ||
    ext === "doc"
  ) {
    try {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      return result.value || "";
    } catch {
      return "Unable to extract DOCX content.";
    }
  }

  // Fallback
  return buffer.toString("utf-8");
}

export function chunkText(
  text: string,
  chunkSize = 800,
  overlap = 100
): { content: string; section: string | null; chunkIndex: number }[] {
  const sections = identifySections(text);
  const chunks: { content: string; section: string | null; chunkIndex: number }[] = [];
  let idx = 0;

  const pushSlices = (content: string, section: string | null) => {
    if (content.length <= chunkSize) {
      chunks.push({ content, section, chunkIndex: idx++ });
      return;
    }
    let i = 0;
    while (i < content.length) {
      chunks.push({
        content: content.slice(i, i + chunkSize),
        section,
        chunkIndex: idx++,
      });
      i += Math.max(1, chunkSize - overlap);
    }
  };

  if (sections.length > 0) {
    for (const s of sections) {
      pushSlices(s.content, s.title);
    }
    return chunks;
  }

  pushSlices(text, null);
  return chunks;
}

export function identifySections(
  text: string
): { title: string; content: string }[] {
  const lines = text.split(/\r?\n/);
  const sections: { title: string; content: string }[] = [];
  let currentTitle = "Preamble";
  let currentLines: string[] = [];

  const headerRe =
    /^(#{1,3}\s+)?(executive summary|need|objectives?|beneficiar|geography|implementation|budget|timeline|monitoring|risks?|outcomes?|milestones?|mission|expertise)/i;

  for (const line of lines) {
    if (headerRe.test(line.trim()) && line.trim().length < 80) {
      if (currentLines.length > 0) {
        sections.push({ title: currentTitle, content: currentLines.join("\n") });
      }
      currentTitle = line.replace(/^#+\s*/, "").trim();
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }
  if (currentLines.length > 0) {
    sections.push({ title: currentTitle, content: currentLines.join("\n") });
  }
  return sections;
}

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/json",
];

export const ALLOWED_EXTENSIONS = ["pdf", "docx", "doc", "txt", "md", "csv", "json"];

export function validateUpload(fileName: string, mimeType: string): {
  valid: boolean;
  error?: string;
} {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: "Please upload a valid PDF, DOCX, TXT, MD, CSV, or JSON file.",
    };
  }
  // MIME can be unreliable in browsers — extension is primary check
  if (mimeType && !ALLOWED_MIME_TYPES.includes(mimeType) && !mimeType.includes("text") && !mimeType.includes("octet-stream") && !mimeType.includes("pdf") && !mimeType.includes("word")) {
    return {
      valid: false,
      error: "Unsupported file type.",
    };
  }
  return { valid: true };
}

/** Vector similarity fallback (cosine) when pgvector unavailable. */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

/** Simple bag-of-words embedding fallback for semantic search abstraction. */
export function simpleEmbed(text: string, dim = 64): number[] {
  const vec = new Array(dim).fill(0);
  const tokens = text.toLowerCase().split(/\W+/).filter(Boolean);
  for (const t of tokens) {
    let hash = 0;
    for (let i = 0; i < t.length; i++) hash = (hash * 31 + t.charCodeAt(i)) >>> 0;
    vec[hash % dim] += 1;
  }
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}
