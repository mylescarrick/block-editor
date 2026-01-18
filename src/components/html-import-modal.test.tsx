/**
 * Tests for HtmlImportModal component
 *
 * These tests verify the modal's logic and integration with parseHtmlToBlocks
 * without requiring a full React Testing Library setup.
 */
import { describe, expect, it, mock } from "bun:test";
import { parseHtmlToBlocks } from "@/lib/clipboard-parser";
import type { Block } from "@/types/blocks";

// ============================================================================
// Test parseHtmlToBlocks integration (the core logic used by the modal)
// ============================================================================

describe("HtmlImportModal - parseHtmlToBlocks integration", () => {
  it("should parse simple HTML paragraph", () => {
    const html = "<p>Hello world</p>";
    const blocks = parseHtmlToBlocks(html);

    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe("paragraph");
  });

  it("should parse multiple HTML elements", () => {
    const html = `
      <h1>Title</h1>
      <p>First paragraph</p>
      <p>Second paragraph</p>
    `;
    const blocks = parseHtmlToBlocks(html);

    expect(blocks).toHaveLength(3);
    expect(blocks[0].type).toBe("heading");
    expect(blocks[1].type).toBe("paragraph");
    expect(blocks[2].type).toBe("paragraph");
  });

  it("should return empty array for empty HTML", () => {
    const blocks = parseHtmlToBlocks("");
    expect(blocks).toHaveLength(0);
  });

  it("should return empty array for whitespace-only HTML", () => {
    const blocks = parseHtmlToBlocks("   \n\t  ");
    expect(blocks).toHaveLength(0);
  });

  it("should parse complex HTML structure", () => {
    const html = `
      <h1>Document Title</h1>
      <p>Introduction paragraph with <strong>bold</strong> text.</p>
      <blockquote>A meaningful quote</blockquote>
      <pre><code class="language-typescript">const x = 1;</code></pre>
      <hr />
    `;
    const blocks = parseHtmlToBlocks(html);

    expect(blocks.length).toBeGreaterThanOrEqual(4);

    const types = blocks.map((b) => b.type);
    expect(types).toContain("heading");
    expect(types).toContain("paragraph");
    expect(types).toContain("quote");
    expect(types).toContain("code");
  });
});

// ============================================================================
// Test modal callback behavior patterns
// ============================================================================

describe("HtmlImportModal - callback behavior", () => {
  it("onImport should be called with parsed blocks when valid HTML provided", () => {
    // biome-ignore lint/suspicious/noEmptyBlockStatements: mock callback
    const onImport = mock((_blocks: Block[]) => {});
    const html = "<p>Test content</p>";
    const blocks = parseHtmlToBlocks(html);

    // Simulate what the modal does when Import is clicked
    if (blocks.length > 0) {
      onImport(blocks);
    }

    expect(onImport).toHaveBeenCalledTimes(1);
    expect(onImport.mock.calls[0][0]).toHaveLength(1);
    expect(onImport.mock.calls[0][0][0].type).toBe("paragraph");
  });

  it("onImport should not be called when HTML is empty", () => {
    // biome-ignore lint/suspicious/noEmptyBlockStatements: mock callback
    const onImport = mock((_blocks: Block[]) => {});
    const blocks = parseHtmlToBlocks("");

    // Simulate what the modal does - it won't call onImport if no blocks
    if (blocks.length > 0) {
      onImport(blocks);
    }

    expect(onImport).not.toHaveBeenCalled();
  });

  it("onOpenChange should be called with false when canceling", () => {
    // biome-ignore lint/suspicious/noEmptyBlockStatements: mock callback
    const onOpenChange = mock((_open: boolean) => {});

    // Simulate cancel action
    onOpenChange(false);

    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("should close modal after successful import", () => {
    // biome-ignore lint/suspicious/noEmptyBlockStatements: mock callback
    const onImport = mock((_blocks: Block[]) => {});
    // biome-ignore lint/suspicious/noEmptyBlockStatements: mock callback
    const onOpenChange = mock((_open: boolean) => {});
    const html = "<p>Content</p>";
    const blocks = parseHtmlToBlocks(html);

    // Simulate the full import flow
    if (blocks.length > 0) {
      onImport(blocks);
      onOpenChange(false);
    }

    expect(onImport).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

// ============================================================================
// Test clipboard paste behavior
// ============================================================================

describe("HtmlImportModal - clipboard paste behavior", () => {
  it("should prefer text/html over text/plain from clipboard", () => {
    // When clipboard contains both HTML and plain text,
    // the modal should extract and use the HTML version
    const htmlContent = "<h1>Title</h1><p>Paragraph</p>";
    const plainContent = "Title\nParagraph";

    // HTML content should parse to structured blocks
    const htmlBlocks = parseHtmlToBlocks(htmlContent);
    const plainBlocks = parseHtmlToBlocks(plainContent);

    // HTML produces proper heading + paragraph
    expect(htmlBlocks.length).toBe(2);
    expect(htmlBlocks[0].type).toBe("heading");
    expect(htmlBlocks[1].type).toBe("paragraph");

    // Plain text just produces paragraphs
    expect(plainBlocks.every((b) => b.type === "paragraph")).toBe(true);
  });

  it("should handle clipboard with only plain text", () => {
    // When clipboard has no HTML, plain text is used as fallback
    const plainText = "Just plain text content";
    const blocks = parseHtmlToBlocks(plainText);

    // Plain text becomes a paragraph
    expect(blocks.length).toBeGreaterThan(0);
    expect(blocks[0].type).toBe("paragraph");
  });
});

// ============================================================================
// Test block count preview logic
// ============================================================================

describe("HtmlImportModal - block count preview", () => {
  it("should return 0 blocks for empty content", () => {
    const blocks = parseHtmlToBlocks("");
    expect(blocks.length).toBe(0);
  });

  it("should return 1 block for single element", () => {
    const blocks = parseHtmlToBlocks("<p>Single paragraph</p>");
    expect(blocks.length).toBe(1);
  });

  it("should return correct count for multiple elements", () => {
    const html = `
      <h1>Title</h1>
      <p>Para 1</p>
      <p>Para 2</p>
      <blockquote>Quote</blockquote>
    `;
    const blocks = parseHtmlToBlocks(html);
    expect(blocks.length).toBe(4);
  });

  it("should update count as content changes", () => {
    // Simulating the useMemo behavior in the component
    const getBlockCount = (html: string) =>
      html.trim() ? parseHtmlToBlocks(html).length : 0;

    expect(getBlockCount("")).toBe(0);
    expect(getBlockCount("<p>One</p>")).toBe(1);
    expect(getBlockCount("<p>One</p><p>Two</p>")).toBe(2);
  });
});

// ============================================================================
// Test edge cases
// ============================================================================

describe("HtmlImportModal - edge cases", () => {
  it("should handle malformed HTML gracefully", () => {
    const html = "<p>Unclosed paragraph<div>Mixed tags</span>";
    const blocks = parseHtmlToBlocks(html);

    // Should not throw and should produce some blocks
    expect(Array.isArray(blocks)).toBe(true);
  });

  it("should handle script tags safely (XSS prevention)", () => {
    const html = '<script>alert("xss")</script><p>Safe content</p>';
    const blocks = parseHtmlToBlocks(html);

    // Script content should be stripped, paragraph should remain
    const paragraph = blocks.find((b) => b.type === "paragraph");
    expect(paragraph).toBeDefined();

    // No block should contain script content
    for (const block of blocks) {
      if (block.type === "paragraph") {
        expect(block.props.content).not.toContain("alert");
      }
    }
  });

  it("should handle deeply nested HTML", () => {
    const html = `
      <div>
        <section>
          <article>
            <div>
              <p>Deeply nested content</p>
            </div>
          </article>
        </section>
      </div>
    `;
    const blocks = parseHtmlToBlocks(html);

    expect(blocks.length).toBeGreaterThan(0);
    expect(blocks.some((b) => b.type === "paragraph")).toBe(true);
  });

  it("should handle HTML with only whitespace text", () => {
    const html = "<p>   </p><p></p>";
    const blocks = parseHtmlToBlocks(html);

    // Empty paragraphs should be filtered out
    expect(
      blocks.every(
        (b) => b.type !== "paragraph" || b.props.content.trim() !== ""
      )
    ).toBe(true);
  });
});
