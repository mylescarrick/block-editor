import { z } from "zod";

// ============================================================================
// BLOCK SCHEMA DEFINITIONS
// These schemas define the structure of all blocks in the editor.
// Both AI-generated and manually created blocks conform to these schemas.
// ============================================================================

// Base props that all blocks share
const BaseBlockPropsSchema = z.object({
  id: z.string(),
});

// Text content schema (used by text-based blocks)
const RichTextSchema = z.string(); // HTML string from TipTap

// ============================================================================
// INDIVIDUAL BLOCK SCHEMAS
// ============================================================================

export const ParagraphBlockSchema = z.object({
  type: z.literal("paragraph"),
  props: BaseBlockPropsSchema.extend({
    content: RichTextSchema,
    align: z.enum(["left", "center", "right"]).default("left"),
  }),
});

export const HeadingBlockSchema = z.object({
  type: z.literal("heading"),
  props: BaseBlockPropsSchema.extend({
    content: RichTextSchema,
    level: z.enum(["h1", "h2", "h3"]).default("h2"),
    align: z.enum(["left", "center", "right"]).default("left"),
  }),
});

export const ImageBlockSchema = z.object({
  type: z.literal("image"),
  props: BaseBlockPropsSchema.extend({
    src: z.string().url(),
    alt: z.string().default(""),
    caption: z.string().optional(),
    width: z.enum(["small", "medium", "large", "full"]).default("large"),
  }),
});

export const DividerBlockSchema = z.object({
  type: z.literal("divider"),
  props: BaseBlockPropsSchema.extend({
    style: z.enum(["solid", "dashed", "dotted"]).default("solid"),
  }),
});

export const CalloutBlockSchema = z.object({
  type: z.literal("callout"),
  props: BaseBlockPropsSchema.extend({
    content: RichTextSchema,
    variant: z.enum(["info", "warning", "success", "error"]).default("info"),
    emoji: z.string().optional(),
  }),
});

export const CodeBlockSchema = z.object({
  type: z.literal("code"),
  props: BaseBlockPropsSchema.extend({
    code: z.string(),
    language: z.string().default("typescript"),
  }),
});

export const QuoteBlockSchema = z.object({
  type: z.literal("quote"),
  props: BaseBlockPropsSchema.extend({
    content: RichTextSchema,
    attribution: z.string().optional(),
  }),
});

// Column layout schema - contains child block IDs
export const ColumnsBlockSchema = z.object({
  type: z.literal("columns"),
  props: BaseBlockPropsSchema.extend({
    layout: z.enum(["1-1", "1-2", "2-1", "1-1-1"]).default("1-1"),
    columns: z.array(z.array(z.string())), // Array of arrays of block IDs
  }),
});

// ============================================================================
// UNION BLOCK TYPE
// ============================================================================

export const BlockSchema = z.discriminatedUnion("type", [
  ParagraphBlockSchema,
  HeadingBlockSchema,
  ImageBlockSchema,
  DividerBlockSchema,
  CalloutBlockSchema,
  CodeBlockSchema,
  QuoteBlockSchema,
  ColumnsBlockSchema,
]);

export type Block = z.infer<typeof BlockSchema>;
export type BlockType = Block["type"];

export type ParagraphBlock = z.infer<typeof ParagraphBlockSchema>;
export type HeadingBlock = z.infer<typeof HeadingBlockSchema>;
export type ImageBlock = z.infer<typeof ImageBlockSchema>;
export type DividerBlock = z.infer<typeof DividerBlockSchema>;
export type CalloutBlock = z.infer<typeof CalloutBlockSchema>;
export type CodeBlock = z.infer<typeof CodeBlockSchema>;
export type QuoteBlock = z.infer<typeof QuoteBlockSchema>;
export type ColumnsBlock = z.infer<typeof ColumnsBlockSchema>;

// ============================================================================
// DOCUMENT SCHEMA
// ============================================================================

export const BlockDocumentSchema = z.object({
  id: z.string(),
  title: z.string(),
  blocks: z.record(z.string(), BlockSchema), // Map of blockId -> Block
  rootBlockIds: z.array(z.string()), // Order of top-level blocks
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type BlockDocument = z.infer<typeof BlockDocumentSchema>;

// ============================================================================
// BLOCK CATALOG (for AI generation)
// ============================================================================

export const BLOCK_CATALOG = {
  paragraph: {
    name: "Paragraph",
    description: "A text paragraph with optional alignment",
    icon: "pilcrow",
    defaultProps: {
      content: "",
      align: "left" as const,
    },
  },
  heading: {
    name: "Heading",
    description: "A heading (h1, h2, or h3)",
    icon: "heading",
    defaultProps: {
      content: "",
      level: "h2" as const,
      align: "left" as const,
    },
  },
  image: {
    name: "Image",
    description: "An image with optional caption",
    icon: "image",
    defaultProps: {
      src: "",
      alt: "",
      width: "large" as const,
    },
  },
  divider: {
    name: "Divider",
    description: "A horizontal divider line",
    icon: "minus",
    defaultProps: {
      style: "solid" as const,
    },
  },
  callout: {
    name: "Callout",
    description: "A callout box for important information",
    icon: "message-square",
    defaultProps: {
      content: "",
      variant: "info" as const,
      emoji: "💡",
    },
  },
  code: {
    name: "Code Block",
    description: "A code snippet with syntax highlighting",
    icon: "code",
    defaultProps: {
      code: "",
      language: "typescript",
    },
  },
  quote: {
    name: "Quote",
    description: "A blockquote with optional attribution",
    icon: "quote",
    defaultProps: {
      content: "",
    },
  },
  columns: {
    name: "Columns",
    description: "A multi-column layout container",
    icon: "columns",
    defaultProps: {
      layout: "1-1" as const,
      columns: [[], []] as string[][],
    },
  },
} as const;

export type BlockCatalogKey = keyof typeof BLOCK_CATALOG;
