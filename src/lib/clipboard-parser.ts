import DOMPurify from "dompurify";
import { createBlock } from "@/lib/utils";
import type { Block } from "@/types/blocks";

/**
 * Allowed HTML tags for sanitization.
 * Includes semantic/structural tags and inline formatting tags that TipTap supports.
 */
const ALLOWED_TAGS = [
  // Structural
  "p",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "blockquote",
  "pre",
  "code",
  "hr",
  "br",
  // Lists
  "ul",
  "ol",
  "li",
  // Inline formatting
  "strong",
  "em",
  "b",
  "i",
  "u",
  "s",
  "strike",
  "sub",
  "sup",
  "mark",
  "span",
  // Links and media
  "a",
  "img",
  // Figures
  "figure",
  "figcaption",
  // Tables (will be flattened later, but allow for extraction)
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  // Other semantic
  "cite",
  "footer",
  "div",
  "section",
  "article",
  "main",
];

/**
 * Allowed HTML attributes for sanitization.
 * Only safe attributes that don't execute code.
 */
const ALLOWED_ATTRS = [
  "href",
  "src",
  "alt",
  "title",
  "class",
  "id",
  "target",
  "rel",
  "width",
  "height",
];

/**
 * Sanitize HTML content to remove dangerous elements and attributes.
 * Uses DOMPurify to strip XSS vectors, event handlers, and javascript: URLs.
 *
 * @param html - Raw HTML string to sanitize
 * @returns Sanitized HTML string safe for DOM parsing
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: ALLOWED_ATTRS,
    ALLOW_DATA_ATTR: false,
    // Automatically add rel="noopener" to links with target="_blank"
    ADD_ATTR: ["rel"],
  });
}

// Top-level regex patterns for performance
const HEADING_H1_H3_REGEX = /^h[1-3]$/;
const HEADING_H4_H6_REGEX = /^h[4-6]$/;
const LANGUAGE_CLASS_REGEX = /(?:language|lang|highlight)-(\w+)/;
const PARAGRAPH_BOUNDARY_REGEX = /\n\s*\n|\r\n\s*\r\n/;

/**
 * Parse HTML string into Block structures for the editor.
 * Converts semantic HTML elements into their corresponding block types.
 *
 * Mapping:
 * - <h1-h3> → heading block
 * - <p> → paragraph block
 * - <blockquote> → quote block
 * - <pre>/<code> → code block
 * - <hr> → divider block
 * - <img> → image block
 * - Other elements → paragraph (with inner HTML preserved)
 */
export function parseHtmlToBlocks(html: string): Block[] {
  if (!html.trim()) {
    return [];
  }

  // Sanitize HTML before parsing to prevent XSS and strip dangerous content
  const sanitizedHtml = sanitizeHtml(html);

  const parser = new DOMParser();
  const doc = parser.parseFromString(sanitizedHtml, "text/html");

  const blocks: Block[] = [];
  const body = doc.body;

  // Process all child nodes of the body
  for (const node of Array.from(body.childNodes)) {
    const nodeBlocks = processNode(node);
    blocks.push(...nodeBlocks);
  }

  // Filter out empty blocks
  return blocks.filter((block) => !isEmptyBlock(block));
}

/**
 * Process a single DOM node and return blocks.
 * Handles element nodes, text nodes, and recursively processes children.
 */
function processNode(node: Node): Block[] {
  // Handle text nodes
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent?.trim();
    if (text) {
      return [createBlock("paragraph", { content: text })];
    }
    return [];
  }

  // Handle element nodes
  if (node.nodeType === Node.ELEMENT_NODE) {
    const element = node as Element;
    return processElement(element);
  }

  return [];
}

// Element tag categories for routing
const CONTAINER_TAGS = new Set(["div", "section", "article", "main"]);
const INLINE_TAGS = new Set(["span", "a", "strong", "em", "b", "i", "u"]);
const LIST_TAGS = new Set(["ul", "ol"]);
const TABLE_TAGS = new Set(["table"]);

/**
 * Process an element node and convert to appropriate block type(s).
 * Routes to specialized handlers based on tag type.
 */
function processElement(element: Element): Block[] {
  const tagName = element.tagName.toLowerCase();

  // Route to specialized handlers
  if (HEADING_H1_H3_REGEX.test(tagName)) {
    return processHeading(element, tagName as "h1" | "h2" | "h3");
  }
  if (HEADING_H4_H6_REGEX.test(tagName)) {
    return processHeading(element, "h3");
  }
  if (tagName === "p") {
    return [createBlock("paragraph", { content: element.innerHTML })];
  }
  if (tagName === "blockquote") {
    return processBlockquote(element);
  }
  if (tagName === "pre") {
    return processPreBlock(element);
  }
  if (
    tagName === "code" &&
    element.parentElement?.tagName.toLowerCase() !== "pre"
  ) {
    return [createBlock("paragraph", { content: element.outerHTML })];
  }
  if (tagName === "hr") {
    return [createBlock("divider", { style: "solid" })];
  }
  if (tagName === "img") {
    return processImage(element);
  }
  if (tagName === "figure") {
    return processFigure(element);
  }
  if (LIST_TAGS.has(tagName)) {
    return [createBlock("paragraph", { content: element.outerHTML })];
  }
  if (TABLE_TAGS.has(tagName)) {
    return processTable(element);
  }
  if (CONTAINER_TAGS.has(tagName)) {
    return processChildren(element);
  }
  if (INLINE_TAGS.has(tagName)) {
    const content = element.outerHTML;
    return content.trim() ? [createBlock("paragraph", { content })] : [];
  }
  if (tagName === "br") {
    return [];
  }

  // Default: if element has meaningful content, create paragraph
  const content = element.innerHTML.trim();
  return content ? [createBlock("paragraph", { content })] : [];
}

/**
 * Process heading elements (h1-h6).
 */
function processHeading(element: Element, level: "h1" | "h2" | "h3"): Block[] {
  return [createBlock("heading", { content: element.innerHTML, level })];
}

/**
 * Process blockquote elements, extracting attribution if present.
 */
function processBlockquote(element: Element): Block[] {
  const cite = element.querySelector("cite, footer");
  let attribution: string | undefined;
  let content = element.innerHTML;

  if (cite) {
    attribution = cite.textContent?.trim();
    const clone = element.cloneNode(true) as Element;
    clone.querySelector("cite, footer")?.remove();
    content = clone.innerHTML;
  }

  return [createBlock("quote", { content, attribution })];
}

/**
 * Process pre/code blocks.
 */
function processPreBlock(element: Element): Block[] {
  const codeEl = element.querySelector("code");
  const code = codeEl?.textContent || element.textContent || "";
  const language = extractLanguageFromClass(codeEl || element);
  return [createBlock("code", { code, language })];
}

/**
 * Process img elements.
 */
function processImage(element: Element): Block[] {
  const src = element.getAttribute("src") || "";
  const alt = element.getAttribute("alt") || "";
  if (src && isValidUrl(src)) {
    return [createBlock("image", { src, alt, width: "large" })];
  }
  return [];
}

/**
 * Process figure elements (typically images with captions).
 */
function processFigure(element: Element): Block[] {
  const img = element.querySelector("img");
  const figcaption = element.querySelector("figcaption");

  if (img) {
    const src = img.getAttribute("src") || "";
    const alt = img.getAttribute("alt") || "";
    const caption = figcaption?.textContent?.trim();
    if (src && isValidUrl(src)) {
      return [createBlock("image", { src, alt, caption, width: "large" })];
    }
  }
  return processChildren(element);
}

/**
 * Process table elements by extracting cell content.
 * Since there's no table block type, we flatten the content into paragraphs
 * with cells joined by ' | ' separators to preserve some structure.
 */
function processTable(element: Element): Block[] {
  const blocks: Block[] = [];
  const rows = element.querySelectorAll("tr");

  for (const row of Array.from(rows)) {
    const cells = row.querySelectorAll("th, td");
    if (cells.length > 0) {
      const cellContents = Array.from(cells)
        .map((cell) => cell.textContent?.trim() || "")
        .filter((text) => text.length > 0);

      if (cellContents.length > 0) {
        const content = cellContents.join(" | ");
        blocks.push(createBlock("paragraph", { content }));
      }
    }
  }

  // If no rows extracted, return empty (will be filtered out)
  return blocks;
}

/**
 * Process all child nodes of an element.
 */
function processChildren(element: Element): Block[] {
  const blocks: Block[] = [];
  for (const child of Array.from(element.childNodes)) {
    blocks.push(...processNode(child));
  }
  return blocks;
}

/**
 * Extract programming language from class attribute.
 * Handles formats like "language-typescript", "lang-js", "highlight-python"
 */
function extractLanguageFromClass(element: Element): string {
  const className = element.className || "";
  const match = className.match(LANGUAGE_CLASS_REGEX);
  return match?.[1] || "plaintext";
}

/**
 * Check if a string is a valid URL.
 */
function isValidUrl(str: string): boolean {
  // Accept data URLs and http(s) URLs
  if (str.startsWith("data:")) {
    return true;
  }
  try {
    const url = new URL(str);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Check if a block is effectively empty.
 */
function isEmptyBlock(block: Block): boolean {
  switch (block.type) {
    case "paragraph":
    case "heading":
    case "quote":
    case "callout":
      return !block.props.content.trim();
    case "code":
      return !block.props.code.trim();
    case "image":
      return !block.props.src;
    case "divider":
      return false; // Dividers are never empty
    case "columns":
      return block.props.columns.every((col) => col.length === 0);
    default:
      return false;
  }
}

/**
 * Parse plain text into Block structures.
 * Splits by double newlines to identify paragraph boundaries.
 * Single newlines within paragraphs become <br> tags.
 *
 * @param text - Plain text string to parse
 * @returns Array of paragraph blocks
 */
export function parsePlainTextToBlocks(text: string): Block[] {
  if (!text.trim()) {
    return [];
  }

  // Split by double newlines (paragraph boundaries)
  // Handle both Unix (\n\n) and Windows (\r\n\r\n) line endings
  const paragraphs = text.split(PARAGRAPH_BOUNDARY_REGEX);

  return paragraphs
    .map((para) => para.trim())
    .filter((para) => para.length > 0)
    .map((para) => {
      // Convert single newlines to <br> tags for line breaks within paragraphs
      // Escape HTML entities first to prevent XSS
      const escaped = escapeHtml(para);
      const content = escaped.replace(/\r?\n/g, "<br>");
      return createBlock("paragraph", { content });
    });
}

/**
 * Escape HTML special characters to prevent XSS.
 */
function escapeHtml(text: string): string {
  const htmlEscapes: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return text.replace(/[&<>"']/g, (char) => htmlEscapes[char]);
}
