import type { Block, BlockDocument } from "@/types/blocks";
import { getColumnFlexBasis } from "./utils";

/**
 * Convert a single block to an HTML string with Tailwind styling.
 * Uses semantic HTML elements for accessibility and SEO.
 *
 * @param block - The block to render
 * @param getBlock - Callback to retrieve child blocks by ID (for columns)
 * @returns HTML string representation of the block
 */
export function blockToHtml(
  block: Block,
  getBlock: (id: string) => Block | undefined
): string {
  switch (block.type) {
    case "paragraph":
      return renderParagraph(block.props.content, block.props.align);

    case "heading":
      return renderHeading(
        block.props.content,
        block.props.level,
        block.props.align
      );

    case "quote":
      return renderQuote(block.props.content, block.props.attribution);

    case "image":
      return renderImage(
        block.props.src,
        block.props.alt,
        block.props.caption,
        block.props.width
      );

    case "code":
      return renderCode(block.props.code, block.props.language);

    case "divider":
      return renderDivider(block.props.style);

    case "callout":
      return renderCallout(
        block.props.content,
        block.props.variant,
        block.props.emoji
      );

    case "columns":
      return renderColumns(block.props.layout, block.props.columns, getBlock);

    default: {
      // Exhaustive check - TypeScript will error if we miss a case
      block satisfies never;
      return "";
    }
  }
}

/**
 * Convert an entire document to an HTML string.
 * Iterates through rootBlockIds to maintain block order.
 *
 * @param document - The document to render
 * @returns HTML string representation of the entire document
 */
export function documentToHtml(document: BlockDocument): string {
  const getBlock = (id: string): Block | undefined => document.blocks[id];

  const blocksHtml = document.rootBlockIds
    .map((blockId) => {
      const block = getBlock(blockId);
      if (!block) {
        return "";
      }
      return blockToHtml(block, getBlock);
    })
    .filter(Boolean)
    .join("\n");

  return blocksHtml;
}

// ============================================================================
// INDIVIDUAL BLOCK RENDERERS
// ============================================================================

function getAlignmentClass(align: "left" | "center" | "right"): string {
  const alignmentClasses = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  };
  return alignmentClasses[align];
}

function renderParagraph(
  content: string,
  align: "left" | "center" | "right"
): string {
  const alignClass = getAlignmentClass(align);
  return `<p class="text-base leading-relaxed mb-4 ${alignClass}">${content}</p>`;
}

function renderHeading(
  content: string,
  level: "h1" | "h2" | "h3",
  align: "left" | "center" | "right"
): string {
  const alignClass = getAlignmentClass(align);
  const levelClasses = {
    h1: "text-4xl font-display font-normal tracking-tight mb-6 mt-8",
    h2: "text-2xl font-semibold tracking-tight mb-4 mt-6",
    h3: "text-xl font-semibold mb-3 mt-4",
  };
  const levelClass = levelClasses[level];
  return `<${level} class="${levelClass} ${alignClass}">${content}</${level}>`;
}

function renderQuote(content: string, attribution?: string): string {
  const attributionHtml = attribution
    ? `<cite class="block mt-2 text-sm text-gray-500 not-italic">— ${attribution}</cite>`
    : "";

  return `<blockquote class="border-l-4 border-gray-300 pl-4 py-2 my-4 italic text-gray-700">
  ${content}
  ${attributionHtml}
</blockquote>`;
}

function renderImage(
  src: string,
  alt: string,
  caption?: string,
  width: "small" | "medium" | "large" | "full" = "large"
): string {
  const widthClasses = {
    small: "max-w-xs",
    medium: "max-w-md",
    large: "max-w-2xl",
    full: "w-full",
  };
  const widthClass = widthClasses[width];

  const captionHtml = caption
    ? `<figcaption class="mt-2 text-sm text-gray-500 text-center">${caption}</figcaption>`
    : "";

  return `<figure class="my-4 ${widthClass}">
  <img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" class="rounded-lg shadow-sm w-full" />
  ${captionHtml}
</figure>`;
}

function renderCode(code: string, language: string): string {
  return `<pre class="bg-gray-900 text-gray-100 p-4 rounded-lg my-4 overflow-x-auto"><code class="language-${escapeHtml(language)} font-mono text-sm">${escapeHtml(code)}</code></pre>`;
}

function renderDivider(style: "solid" | "dashed" | "dotted"): string {
  const styleClasses = {
    solid: "border-solid",
    dashed: "border-dashed",
    dotted: "border-dotted",
  };
  const styleClass = styleClasses[style];
  return `<hr class="my-8 border-t border-gray-300 ${styleClass}" />`;
}

function renderCallout(
  content: string,
  variant: "info" | "warning" | "success" | "error",
  emoji?: string
): string {
  const variantClasses = {
    info: "bg-blue-50 border-blue-200 text-blue-800",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
    success: "bg-green-50 border-green-200 text-green-800",
    error: "bg-red-50 border-red-200 text-red-800",
  };
  const variantClass = variantClasses[variant];

  const emojiHtml = emoji ? `<span class="mr-2 text-lg">${emoji}</span>` : "";

  return `<aside class="flex items-start p-4 my-4 rounded-lg border ${variantClass}">
  ${emojiHtml}
  <div class="flex-1">${content}</div>
</aside>`;
}

function renderColumns(
  layout: string,
  columns: string[][],
  getBlock: (id: string) => Block | undefined
): string {
  const flexBasis = getColumnFlexBasis(layout);

  const columnsHtml = columns
    .map((columnBlockIds, index) => {
      const columnContent = columnBlockIds
        .map((blockId) => {
          const block = getBlock(blockId);
          if (!block) {
            return "";
          }
          return blockToHtml(block, getBlock);
        })
        .filter(Boolean)
        .join("\n");

      const basis = flexBasis[index] || "50%";
      return `<div class="px-2" style="flex-basis: ${basis}; min-width: 0;">
  ${columnContent || '<p class="text-gray-400 italic">Empty column</p>'}
</div>`;
    })
    .join("\n");

  return `<div class="flex flex-wrap -mx-2 my-4">
${columnsHtml}
</div>`;
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Escape HTML special characters to prevent XSS.
 * Used for user-provided content like src, alt, language.
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
