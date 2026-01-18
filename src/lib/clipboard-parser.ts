import { createBlock } from "@/lib/utils";
import type { Block } from "@/types/blocks";

// Top-level regex patterns for performance
const HEADING_H1_H3_REGEX = /^h[1-3]$/;
const HEADING_H4_H6_REGEX = /^h[4-6]$/;
const LANGUAGE_CLASS_REGEX = /(?:language|lang|highlight)-(\w+)/;

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

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

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
