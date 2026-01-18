import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { v4 as uuidv4 } from "uuid";
import type { Block, BlockDocument, BlockType } from "@/types/blocks";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return uuidv4();
}

// Create a new block with default props
export function createBlock<T extends BlockType>(
  type: T,
  props?: Partial<Omit<Extract<Block, { type: T }>["props"], "id">>
): Extract<Block, { type: T }> {
  const id = generateId();

  const defaultPropsMap: Record<BlockType, Record<string, unknown>> = {
    paragraph: { content: "", align: "left" },
    heading: { content: "", level: "h2", align: "left" },
    image: { src: "", alt: "", width: "large" },
    divider: { style: "solid" },
    callout: { content: "", variant: "info", emoji: "💡" },
    code: { code: "", language: "typescript" },
    quote: { content: "" },
    columns: { layout: "1-1", columns: [[], []] },
  };

  return {
    type,
    props: {
      id,
      ...defaultPropsMap[type],
      ...props,
    },
  } as Extract<Block, { type: T }>;
}

// Create a new empty document
export function createDocument(title = "Untitled"): BlockDocument {
  const now = new Date().toISOString();
  const firstBlock = createBlock("paragraph", { content: "" });

  return {
    id: generateId(),
    title,
    blocks: {
      [firstBlock.props.id]: firstBlock,
    },
    rootBlockIds: [firstBlock.props.id],
    createdAt: now,
    updatedAt: now,
  };
}

// Deep clone a document
export function cloneDocument(doc: BlockDocument): BlockDocument {
  return JSON.parse(JSON.stringify(doc));
}

// Get column layout ratios
export function getColumnWidths(layout: string): number[] {
  const layouts: Record<string, number[]> = {
    "1-1": [1, 1],
    "1-2": [1, 2],
    "2-1": [2, 1],
    "1-1-1": [1, 1, 1],
  };
  return layouts[layout] || [1, 1];
}

// Calculate flex-basis percentages from ratios
export function getColumnFlexBasis(layout: string): string[] {
  const widths = getColumnWidths(layout);
  const total = widths.reduce((a, b) => a + b, 0);
  return widths.map((w) => `${(w / total) * 100}%`);
}
