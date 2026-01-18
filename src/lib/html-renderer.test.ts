/**
 * Unit tests for HTML rendering functions.
 * Tests blockToHtml() and documentToHtml() for all block types.
 */
import { describe, expect, it } from "bun:test";
import type {
  Block,
  BlockDocument,
  CalloutBlock,
  CodeBlock,
  ColumnsBlock,
  DividerBlock,
  HeadingBlock,
  ImageBlock,
  ParagraphBlock,
  QuoteBlock,
} from "@/types/blocks";
import { blockToHtml, documentToHtml } from "./html-renderer";

// =============================================================================
// Test Helpers
// =============================================================================

let blockIdCounter = 0;

function createBlockId(): string {
  blockIdCounter++;
  return `test-block-${blockIdCounter}`;
}

function createParagraphBlock(
  content: string,
  align: "left" | "center" | "right" = "left"
): ParagraphBlock {
  return {
    type: "paragraph",
    props: {
      id: createBlockId(),
      content,
      align,
    },
  };
}

function createHeadingBlock(
  content: string,
  level: "h1" | "h2" | "h3" = "h2",
  align: "left" | "center" | "right" = "left"
): HeadingBlock {
  return {
    type: "heading",
    props: {
      id: createBlockId(),
      content,
      level,
      align,
    },
  };
}

function createQuoteBlock(content: string, attribution?: string): QuoteBlock {
  return {
    type: "quote",
    props: {
      id: createBlockId(),
      content,
      attribution,
    },
  };
}

function createImageBlock(
  src: string,
  alt: string,
  caption?: string,
  width: "small" | "medium" | "large" | "full" = "large"
): ImageBlock {
  return {
    type: "image",
    props: {
      id: createBlockId(),
      src,
      alt,
      caption,
      width,
    },
  };
}

function createCodeBlock(code: string, language = "typescript"): CodeBlock {
  return {
    type: "code",
    props: {
      id: createBlockId(),
      code,
      language,
    },
  };
}

function createDividerBlock(
  style: "solid" | "dashed" | "dotted" = "solid"
): DividerBlock {
  return {
    type: "divider",
    props: {
      id: createBlockId(),
      style,
    },
  };
}

function createCalloutBlock(
  content: string,
  variant: "info" | "warning" | "success" | "error" = "info",
  emoji?: string
): CalloutBlock {
  return {
    type: "callout",
    props: {
      id: createBlockId(),
      content,
      variant,
      emoji,
    },
  };
}

function createColumnsBlock(
  layout: "1-1" | "1-2" | "2-1" | "1-1-1",
  columns: string[][]
): ColumnsBlock {
  return {
    type: "columns",
    props: {
      id: createBlockId(),
      layout,
      columns,
    },
  };
}

function createDocument(blocks: Block[]): BlockDocument {
  const blockMap: Record<string, Block> = {};
  const rootBlockIds: string[] = [];

  for (const block of blocks) {
    blockMap[block.props.id] = block;
    rootBlockIds.push(block.props.id);
  }

  return {
    id: "test-doc",
    title: "Test Document",
    blocks: blockMap,
    rootBlockIds,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// Simple getBlock function that returns undefined (for non-columns tests)
const noopGetBlock = (): Block | undefined => undefined;

// =============================================================================
// blockToHtml() Tests - Paragraph
// =============================================================================

describe("blockToHtml - paragraph", () => {
  it("should render paragraph with text-base class", () => {
    const block = createParagraphBlock("Hello world");
    const html = blockToHtml(block, noopGetBlock);

    expect(html).toContain("<p");
    expect(html).toContain("</p>");
    expect(html).toContain("text-base");
    expect(html).toContain("Hello world");
  });

  it("should apply left alignment class by default", () => {
    const block = createParagraphBlock("Left aligned");
    const html = blockToHtml(block, noopGetBlock);

    expect(html).toContain("text-left");
  });

  it("should apply center alignment class", () => {
    const block = createParagraphBlock("Centered", "center");
    const html = blockToHtml(block, noopGetBlock);

    expect(html).toContain("text-center");
  });

  it("should apply right alignment class", () => {
    const block = createParagraphBlock("Right aligned", "right");
    const html = blockToHtml(block, noopGetBlock);

    expect(html).toContain("text-right");
  });

  it("should preserve HTML content in paragraph", () => {
    const block = createParagraphBlock(
      "<strong>Bold</strong> and <em>italic</em>"
    );
    const html = blockToHtml(block, noopGetBlock);

    expect(html).toContain("<strong>Bold</strong>");
    expect(html).toContain("<em>italic</em>");
  });
});

// =============================================================================
// blockToHtml() Tests - Heading
// =============================================================================

describe("blockToHtml - heading", () => {
  it("should render h1 with text-4xl font-display", () => {
    const block = createHeadingBlock("Main Title", "h1");
    const html = blockToHtml(block, noopGetBlock);

    expect(html).toContain("<h1");
    expect(html).toContain("</h1>");
    expect(html).toContain("text-4xl");
    expect(html).toContain("font-display");
    expect(html).toContain("Main Title");
  });

  it("should render h2 with text-2xl font-semibold", () => {
    const block = createHeadingBlock("Subtitle", "h2");
    const html = blockToHtml(block, noopGetBlock);

    expect(html).toContain("<h2");
    expect(html).toContain("</h2>");
    expect(html).toContain("text-2xl");
    expect(html).toContain("font-semibold");
  });

  it("should render h3 with text-xl font-semibold", () => {
    const block = createHeadingBlock("Section", "h3");
    const html = blockToHtml(block, noopGetBlock);

    expect(html).toContain("<h3");
    expect(html).toContain("</h3>");
    expect(html).toContain("text-xl");
    expect(html).toContain("font-semibold");
  });

  it("should apply alignment classes to headings", () => {
    const block = createHeadingBlock("Centered Title", "h1", "center");
    const html = blockToHtml(block, noopGetBlock);

    expect(html).toContain("text-center");
  });
});

// =============================================================================
// blockToHtml() Tests - Quote
// =============================================================================

describe("blockToHtml - quote", () => {
  it("should render blockquote with border-l-4 styling", () => {
    const block = createQuoteBlock("A wise quote");
    const html = blockToHtml(block, noopGetBlock);

    expect(html).toContain("<blockquote");
    expect(html).toContain("</blockquote>");
    expect(html).toContain("border-l-4");
    expect(html).toContain("pl-4");
    expect(html).toContain("italic");
    expect(html).toContain("A wise quote");
  });

  it("should render cite element when attribution provided", () => {
    const block = createQuoteBlock("Famous words", "Albert Einstein");
    const html = blockToHtml(block, noopGetBlock);

    expect(html).toContain("<cite");
    expect(html).toContain("</cite>");
    expect(html).toContain("— Albert Einstein");
  });

  it("should not render cite element when no attribution", () => {
    const block = createQuoteBlock("Anonymous quote");
    const html = blockToHtml(block, noopGetBlock);

    expect(html).not.toContain("<cite");
  });
});

// =============================================================================
// blockToHtml() Tests - Image
// =============================================================================

describe("blockToHtml - image", () => {
  it("should render figure with img element", () => {
    const block = createImageBlock(
      "https://example.com/image.png",
      "Test image"
    );
    const html = blockToHtml(block, noopGetBlock);

    expect(html).toContain("<figure");
    expect(html).toContain("</figure>");
    expect(html).toContain("<img");
    expect(html).toContain('src="https://example.com/image.png"');
    expect(html).toContain('alt="Test image"');
  });

  it("should render figcaption when caption provided", () => {
    const block = createImageBlock(
      "https://example.com/image.png",
      "Test",
      "A beautiful sunset"
    );
    const html = blockToHtml(block, noopGetBlock);

    expect(html).toContain("<figcaption");
    expect(html).toContain("</figcaption>");
    expect(html).toContain("A beautiful sunset");
  });

  it("should not render figcaption when no caption", () => {
    const block = createImageBlock("https://example.com/image.png", "Test");
    const html = blockToHtml(block, noopGetBlock);

    expect(html).not.toContain("<figcaption");
  });

  it("should apply width classes for different sizes", () => {
    const smallBlock = createImageBlock(
      "https://example.com/img.png",
      "small",
      undefined,
      "small"
    );
    const mediumBlock = createImageBlock(
      "https://example.com/img.png",
      "medium",
      undefined,
      "medium"
    );
    const largeBlock = createImageBlock(
      "https://example.com/img.png",
      "large",
      undefined,
      "large"
    );
    const fullBlock = createImageBlock(
      "https://example.com/img.png",
      "full",
      undefined,
      "full"
    );

    expect(blockToHtml(smallBlock, noopGetBlock)).toContain("max-w-xs");
    expect(blockToHtml(mediumBlock, noopGetBlock)).toContain("max-w-md");
    expect(blockToHtml(largeBlock, noopGetBlock)).toContain("max-w-2xl");
    expect(blockToHtml(fullBlock, noopGetBlock)).toContain("w-full");
  });

  it("should escape HTML in src and alt attributes", () => {
    const block = createImageBlock(
      'https://example.com/img.png?q="test"',
      'Image with "quotes"'
    );
    const html = blockToHtml(block, noopGetBlock);

    expect(html).toContain("&quot;");
    expect(html).not.toContain('q="test"');
  });
});

// =============================================================================
// blockToHtml() Tests - Code
// =============================================================================

describe("blockToHtml - code", () => {
  it("should render pre/code with dark theme styling", () => {
    const block = createCodeBlock("const x = 1;", "javascript");
    const html = blockToHtml(block, noopGetBlock);

    expect(html).toContain("<pre");
    expect(html).toContain("<code");
    expect(html).toContain("</code>");
    expect(html).toContain("</pre>");
    expect(html).toContain("bg-gray-900");
    expect(html).toContain("text-gray-100");
    expect(html).toContain("font-mono");
  });

  it("should include language class", () => {
    const block = createCodeBlock("print('hello')", "python");
    const html = blockToHtml(block, noopGetBlock);

    expect(html).toContain('class="language-python');
  });

  it("should escape HTML in code content", () => {
    const block = createCodeBlock("<div>Hello</div>", "html");
    const html = blockToHtml(block, noopGetBlock);

    expect(html).toContain("&lt;div&gt;Hello&lt;/div&gt;");
    expect(html).not.toContain("<div>Hello</div>");
  });

  it("should escape special characters in language name", () => {
    const block = createCodeBlock("code", '<script>alert("xss")</script>');
    const html = blockToHtml(block, noopGetBlock);

    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });
});

// =============================================================================
// blockToHtml() Tests - Divider
// =============================================================================

describe("blockToHtml - divider", () => {
  it("should render hr element", () => {
    const block = createDividerBlock();
    const html = blockToHtml(block, noopGetBlock);

    expect(html).toContain("<hr");
  });

  it("should apply solid style by default", () => {
    const block = createDividerBlock("solid");
    const html = blockToHtml(block, noopGetBlock);

    expect(html).toContain("border-solid");
  });

  it("should apply dashed style", () => {
    const block = createDividerBlock("dashed");
    const html = blockToHtml(block, noopGetBlock);

    expect(html).toContain("border-dashed");
  });

  it("should apply dotted style", () => {
    const block = createDividerBlock("dotted");
    const html = blockToHtml(block, noopGetBlock);

    expect(html).toContain("border-dotted");
  });
});

// =============================================================================
// blockToHtml() Tests - Callout
// =============================================================================

describe("blockToHtml - callout", () => {
  it("should render aside element", () => {
    const block = createCalloutBlock("Important note");
    const html = blockToHtml(block, noopGetBlock);

    expect(html).toContain("<aside");
    expect(html).toContain("</aside>");
    expect(html).toContain("Important note");
  });

  it("should apply info variant styling", () => {
    const block = createCalloutBlock("Info message", "info");
    const html = blockToHtml(block, noopGetBlock);

    expect(html).toContain("bg-blue-50");
    expect(html).toContain("border-blue-200");
    expect(html).toContain("text-blue-800");
  });

  it("should apply warning variant styling", () => {
    const block = createCalloutBlock("Warning message", "warning");
    const html = blockToHtml(block, noopGetBlock);

    expect(html).toContain("bg-yellow-50");
    expect(html).toContain("border-yellow-200");
    expect(html).toContain("text-yellow-800");
  });

  it("should apply success variant styling", () => {
    const block = createCalloutBlock("Success message", "success");
    const html = blockToHtml(block, noopGetBlock);

    expect(html).toContain("bg-green-50");
    expect(html).toContain("border-green-200");
    expect(html).toContain("text-green-800");
  });

  it("should apply error variant styling", () => {
    const block = createCalloutBlock("Error message", "error");
    const html = blockToHtml(block, noopGetBlock);

    expect(html).toContain("bg-red-50");
    expect(html).toContain("border-red-200");
    expect(html).toContain("text-red-800");
  });

  it("should render emoji when provided", () => {
    const block = createCalloutBlock("Note", "info", "💡");
    const html = blockToHtml(block, noopGetBlock);

    expect(html).toContain("💡");
    expect(html).toContain("mr-2");
  });

  it("should not render emoji span when no emoji", () => {
    const block = createCalloutBlock("Note", "info");
    const html = blockToHtml(block, noopGetBlock);

    expect(html).not.toContain("mr-2 text-lg");
  });
});

// =============================================================================
// blockToHtml() Tests - Columns
// =============================================================================

describe("blockToHtml - columns", () => {
  it("should render flex container", () => {
    const block = createColumnsBlock("1-1", [[], []]);
    const html = blockToHtml(block, noopGetBlock);

    expect(html).toContain("flex");
    expect(html).toContain("flex-wrap");
  });

  it("should render children recursively", () => {
    const childBlock1 = createParagraphBlock("Column 1 content");
    const childBlock2 = createParagraphBlock("Column 2 content");

    const columnsBlock = createColumnsBlock("1-1", [
      [childBlock1.props.id],
      [childBlock2.props.id],
    ]);

    const getBlock = (id: string): Block | undefined => {
      if (id === childBlock1.props.id) {
        return childBlock1;
      }
      if (id === childBlock2.props.id) {
        return childBlock2;
      }
      return undefined;
    };

    const html = blockToHtml(columnsBlock, getBlock);

    expect(html).toContain("Column 1 content");
    expect(html).toContain("Column 2 content");
  });

  it("should apply correct flex-basis for 1-1 layout", () => {
    const block = createColumnsBlock("1-1", [[], []]);
    const html = blockToHtml(block, noopGetBlock);

    expect(html).toContain("flex-basis: 50%");
  });

  it("should apply correct flex-basis for 1-2 layout", () => {
    const block = createColumnsBlock("1-2", [[], []]);
    const html = blockToHtml(block, noopGetBlock);

    // Uses full precision percentages (1/3 and 2/3)
    expect(html).toContain("flex-basis: 33.33333333333333%");
    expect(html).toContain("flex-basis: 66.66666666666666%");
  });

  it("should apply correct flex-basis for 2-1 layout", () => {
    const block = createColumnsBlock("2-1", [[], []]);
    const html = blockToHtml(block, noopGetBlock);

    // Uses full precision percentages (2/3 and 1/3)
    expect(html).toContain("flex-basis: 66.66666666666666%");
    expect(html).toContain("flex-basis: 33.33333333333333%");
  });

  it("should apply correct flex-basis for 1-1-1 layout", () => {
    const block = createColumnsBlock("1-1-1", [[], [], []]);
    const html = blockToHtml(block, noopGetBlock);

    // All three columns should have 1/3 (full precision)
    const matches = html.match(/flex-basis: 33\.33333333333333%/g);
    expect(matches?.length).toBe(3);
  });

  it("should show empty column message when column has no children", () => {
    const block = createColumnsBlock("1-1", [[], []]);
    const html = blockToHtml(block, noopGetBlock);

    expect(html).toContain("Empty column");
    expect(html).toContain("text-gray-400");
    expect(html).toContain("italic");
  });

  it("should handle missing child blocks gracefully", () => {
    const columnsBlock = createColumnsBlock("1-1", [["missing-block-id"], []]);

    const html = blockToHtml(columnsBlock, noopGetBlock);

    // Should not crash and should show empty column message for empty column
    expect(html).toContain("Empty column");
  });

  it("should render nested blocks within columns", () => {
    const heading = createHeadingBlock("Column Header", "h2");
    const paragraph = createParagraphBlock("Column paragraph");

    const columnsBlock = createColumnsBlock("1-1", [
      [heading.props.id, paragraph.props.id],
      [],
    ]);

    const getBlock = (id: string): Block | undefined => {
      if (id === heading.props.id) {
        return heading;
      }
      if (id === paragraph.props.id) {
        return paragraph;
      }
      return undefined;
    };

    const html = blockToHtml(columnsBlock, getBlock);

    expect(html).toContain("<h2");
    expect(html).toContain("Column Header");
    expect(html).toContain("<p");
    expect(html).toContain("Column paragraph");
  });
});

// =============================================================================
// documentToHtml() Tests
// =============================================================================

describe("documentToHtml", () => {
  it("should combine multiple blocks correctly", () => {
    const heading = createHeadingBlock("Document Title", "h1");
    const paragraph = createParagraphBlock("Introduction paragraph");
    const divider = createDividerBlock();

    const document = createDocument([heading, paragraph, divider]);
    const html = documentToHtml(document);

    expect(html).toContain("<h1");
    expect(html).toContain("Document Title");
    expect(html).toContain("<p");
    expect(html).toContain("Introduction paragraph");
    expect(html).toContain("<hr");
  });

  it("should preserve block order from rootBlockIds", () => {
    const block1 = createParagraphBlock("First");
    const block2 = createParagraphBlock("Second");
    const block3 = createParagraphBlock("Third");

    const document = createDocument([block1, block2, block3]);
    const html = documentToHtml(document);

    const firstIndex = html.indexOf("First");
    const secondIndex = html.indexOf("Second");
    const thirdIndex = html.indexOf("Third");

    expect(firstIndex).toBeLessThan(secondIndex);
    expect(secondIndex).toBeLessThan(thirdIndex);
  });

  it("should return empty string for empty document", () => {
    const document = createDocument([]);
    const html = documentToHtml(document);

    expect(html).toBe("");
  });

  it("should skip missing blocks in rootBlockIds", () => {
    const validBlock = createParagraphBlock("Valid block");
    const document: BlockDocument = {
      id: "test-doc",
      title: "Test",
      blocks: {
        [validBlock.props.id]: validBlock,
      },
      rootBlockIds: ["missing-id", validBlock.props.id, "another-missing"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const html = documentToHtml(document);

    expect(html).toContain("Valid block");
    expect(html).not.toContain("missing");
  });

  it("should handle document with columns containing children", () => {
    const childParagraph = createParagraphBlock("Child content");
    const columnsBlock = createColumnsBlock("1-1", [
      [childParagraph.props.id],
      [],
    ]);

    const document: BlockDocument = {
      id: "test-doc",
      title: "Test",
      blocks: {
        [columnsBlock.props.id]: columnsBlock,
        [childParagraph.props.id]: childParagraph,
      },
      rootBlockIds: [columnsBlock.props.id],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const html = documentToHtml(document);

    expect(html).toContain("flex");
    expect(html).toContain("Child content");
  });

  it("should handle all block types in a single document", () => {
    const heading = createHeadingBlock("Title", "h1");
    const paragraph = createParagraphBlock("Text content");
    const quote = createQuoteBlock("Quote content", "Author");
    const image = createImageBlock("https://example.com/img.png", "Image alt");
    const code = createCodeBlock("const x = 1;", "javascript");
    const divider = createDividerBlock();
    const callout = createCalloutBlock("Callout content", "info", "💡");

    const document = createDocument([
      heading,
      paragraph,
      quote,
      image,
      code,
      divider,
      callout,
    ]);
    const html = documentToHtml(document);

    expect(html).toContain("<h1");
    expect(html).toContain("<p");
    expect(html).toContain("<blockquote");
    expect(html).toContain("<figure");
    expect(html).toContain("<pre");
    expect(html).toContain("<hr");
    expect(html).toContain("<aside");
  });
});
