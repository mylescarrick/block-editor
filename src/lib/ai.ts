import { createBlock, generateId } from "@/lib/utils";
import type { Block } from "@/types/blocks";

// ============================================================================
// AI GENERATION (STUB)
// Replace with actual API calls to your AI backend
// The structure here shows how json-render's catalog approach would work
// ============================================================================

/**
 * Generate a system prompt that describes available blocks
 * This is similar to json-render's generateCatalogPrompt
 */
export function generateBlockCatalogPrompt(): string {
  return `
You are a document block generator. You create structured content blocks.

Available block types:

1. paragraph - A text paragraph
   Props: { content: string (HTML), align: "left" | "center" | "right" }

2. heading - A heading
   Props: { content: string (HTML), level: "h1" | "h2" | "h3", align: "left" | "center" | "right" }

3. image - An image with caption
   Props: { src: string (URL), alt: string, caption?: string, width: "small" | "medium" | "large" | "full" }

4. callout - A highlighted callout box
   Props: { content: string (HTML), variant: "info" | "warning" | "success" | "error", emoji?: string }

5. quote - A blockquote
   Props: { content: string (HTML), attribution?: string }

6. code - A code block
   Props: { code: string, language: string }

7. divider - A horizontal line
   Props: { style: "solid" | "dashed" | "dotted" }

8. columns - A multi-column layout
   Props: { layout: "1-1" | "1-2" | "2-1" | "1-1-1", columns: Block[][] }

Output valid JSON array of blocks. Each block must have: { type, props: { id, ...typeSpecificProps } }
`.trim();
}

/**
 * Parse AI response into blocks
 * In production, this would validate against your Zod schemas
 */
export function parseAIResponse(response: string): Block[] {
  try {
    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/) || [
      null,
      response,
    ];
    const jsonStr = jsonMatch[1] || response;

    const parsed = JSON.parse(jsonStr.trim());
    const blocks = Array.isArray(parsed) ? parsed : [parsed];

    // Ensure each block has an ID
    return blocks.map((block) => ({
      ...block,
      props: {
        ...block.props,
        id: block.props?.id || generateId(),
      },
    }));
  } catch (error) {
    console.error("Failed to parse AI response:", error);
    return [];
  }
}

// ============================================================================
// MOCK AI RESPONSES FOR DEMO
// These simulate what an AI would generate
// ============================================================================

const mockResponses: Record<string, () => Block[]> = {
  intro: () => [
    createBlock("heading", {
      content: "Welcome to Your New Document",
      level: "h1",
    }),
    createBlock("paragraph", {
      content:
        "This is your space to <strong>create</strong>, <em>collaborate</em>, and <u>communicate</u>. Start typing to begin your journey.",
    }),
  ],

  features: () => [
    createBlock("heading", { content: "Key Features", level: "h2" }),
    createBlock("callout", {
      content:
        "<strong>Block-based editing</strong> — Drag, drop, and rearrange content with ease.",
      variant: "info",
      emoji: "🧱",
    }),
    createBlock("callout", {
      content:
        "<strong>Rich formatting</strong> — Bold, italic, underline, and more.",
      variant: "success",
      emoji: "✨",
    }),
    createBlock("callout", {
      content:
        "<strong>Multi-column layouts</strong> — Create sophisticated page designs.",
      variant: "warning",
      emoji: "📐",
    }),
  ],

  "two-column": () => {
    const leftParagraph = createBlock("paragraph", {
      content:
        "<strong>Left Column</strong><br/>This content appears on the left side of the layout. You can add any blocks here.",
    });
    const rightParagraph = createBlock("paragraph", {
      content:
        "<strong>Right Column</strong><br/>This content appears on the right side. Columns can be resized using different layouts.",
    });

    return [
      createBlock("heading", { content: "Two-Column Layout", level: "h2" }),
      createBlock("columns", {
        layout: "1-1",
        columns: [[leftParagraph.props.id], [rightParagraph.props.id]],
      }),
      leftParagraph,
      rightParagraph,
    ];
  },

  "three-column": () => {
    const col1 = createBlock("callout", {
      content: "First column with important info",
      variant: "info",
      emoji: "1️⃣",
    });
    const col2 = createBlock("callout", {
      content: "Second column with more details",
      variant: "success",
      emoji: "2️⃣",
    });
    const col3 = createBlock("callout", {
      content: "Third column wrapping it up",
      variant: "warning",
      emoji: "3️⃣",
    });

    return [
      createBlock("heading", { content: "Three-Column Layout", level: "h2" }),
      createBlock("columns", {
        layout: "1-1-1",
        columns: [[col1.props.id], [col2.props.id], [col3.props.id]],
      }),
      col1,
      col2,
      col3,
    ];
  },

  "code-example": () => [
    createBlock("heading", { content: "Code Example", level: "h2" }),
    createBlock("paragraph", { content: "Here's a simple React component:" }),
    createBlock("code", {
      language: "typescript",
      code: `import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <button onClick={() => setCount(c => c + 1)}>
      Count: {count}
    </button>
  );
}`,
    }),
  ],

  "image-gallery": () => [
    createBlock("heading", { content: "Image Showcase", level: "h2" }),
    createBlock("image", {
      src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200",
      alt: "Mountain landscape",
      caption: "A beautiful mountain landscape at sunset",
      width: "large",
    }),
    createBlock("paragraph", {
      content:
        "<em>Images can have captions and different width settings.</em>",
      align: "center",
    }),
  ],
};

/**
 * Generate blocks from a prompt
 * STUB: Replace with actual AI API call
 */
export async function generateBlocksFromPrompt(
  prompt: string
): Promise<Block[]> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  const normalizedPrompt = prompt.toLowerCase();

  // Check for keyword matches in mock responses
  if (
    normalizedPrompt.includes("intro") ||
    normalizedPrompt.includes("welcome")
  ) {
    return mockResponses.intro();
  }
  if (normalizedPrompt.includes("feature")) {
    return mockResponses.features();
  }
  if (normalizedPrompt.includes("two") && normalizedPrompt.includes("column")) {
    return mockResponses["two-column"]();
  }
  if (
    normalizedPrompt.includes("three") &&
    normalizedPrompt.includes("column")
  ) {
    return mockResponses["three-column"]();
  }
  if (normalizedPrompt.includes("code")) {
    return mockResponses["code-example"]();
  }
  if (
    normalizedPrompt.includes("image") ||
    normalizedPrompt.includes("photo")
  ) {
    return mockResponses["image-gallery"]();
  }

  // Default: create a paragraph with the prompt as content
  return [createBlock("paragraph", { content: `<p>${prompt}</p>` })];
}

/**
 * Generate content suggestions based on context
 */
export async function generateSuggestions(_context: string): Promise<string[]> {
  await new Promise((resolve) => setTimeout(resolve, 200));

  return [
    "Add an introduction section",
    "Create a two-column layout",
    "Add a code example",
    "Insert an image gallery",
    "Add feature highlights",
  ];
}
