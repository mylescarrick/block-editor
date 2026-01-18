/**
 * Unit tests for clipboard parsing functions.
 * Tests parseHtmlToBlocks(), sanitizeHtml(), and parsePlainTextToBlocks()
 */
import { describe, expect, it } from "bun:test";
import type {
  Block,
  CodeBlock,
  DividerBlock,
  HeadingBlock,
  ImageBlock,
  ParagraphBlock,
  QuoteBlock,
} from "@/types/blocks";
import {
  parseHtmlToBlocks,
  parsePlainTextToBlocks,
  sanitizeHtml,
} from "./clipboard-parser";

// Type guards for block types
function isParagraph(block: Block): block is ParagraphBlock {
  return block.type === "paragraph";
}

function isHeading(block: Block): block is HeadingBlock {
  return block.type === "heading";
}

function isQuote(block: Block): block is QuoteBlock {
  return block.type === "quote";
}

function isDivider(block: Block): block is DividerBlock {
  return block.type === "divider";
}

function isCode(block: Block): block is CodeBlock {
  return block.type === "code";
}

function isImage(block: Block): block is ImageBlock {
  return block.type === "image";
}

// =============================================================================
// sanitizeHtml() Tests
// =============================================================================

describe("sanitizeHtml", () => {
  it("should preserve safe HTML tags", () => {
    const html = "<p><strong>Bold</strong> and <em>italic</em></p>";
    const result = sanitizeHtml(html);

    expect(result).toContain("<p>");
    expect(result).toContain("<strong>");
    expect(result).toContain("<em>");
    expect(result).toContain("Bold");
    expect(result).toContain("italic");
  });

  it("should preserve headings", () => {
    const html = "<h1>Title</h1><h2>Subtitle</h2><h3>Section</h3>";
    const result = sanitizeHtml(html);

    expect(result).toContain("<h1>");
    expect(result).toContain("<h2>");
    expect(result).toContain("<h3>");
  });

  it("should preserve lists", () => {
    const html = "<ul><li>Item 1</li><li>Item 2</li></ul>";
    const result = sanitizeHtml(html);

    expect(result).toContain("<ul>");
    expect(result).toContain("<li>");
    expect(result).toContain("Item 1");
  });

  it("should preserve links with safe attributes", () => {
    const html = '<a href="https://example.com" title="Link">Click</a>';
    const result = sanitizeHtml(html);

    expect(result).toContain("<a");
    expect(result).toContain('href="https://example.com"');
    expect(result).toContain("Click");
  });

  it("should preserve images with safe attributes", () => {
    const html = '<img src="https://example.com/img.png" alt="Image">';
    const result = sanitizeHtml(html);

    expect(result).toContain("<img");
    expect(result).toContain('src="https://example.com/img.png"');
    expect(result).toContain('alt="Image"');
  });

  it("should strip onclick event handlers", () => {
    const html = "<button onclick=\"alert('xss')\">Click</button>";
    const result = sanitizeHtml(html);

    expect(result).not.toContain("onclick");
    expect(result).not.toContain("alert");
  });

  it("should strip onerror event handlers", () => {
    const html = '<img src="x" onerror="alert(\'xss\')">';
    const result = sanitizeHtml(html);

    expect(result).not.toContain("onerror");
    expect(result).not.toContain("alert");
  });

  it("should strip javascript: URLs", () => {
    const html = "<a href=\"javascript:alert('xss')\">Click</a>";
    const result = sanitizeHtml(html);

    expect(result).not.toContain("javascript:");
    expect(result).not.toContain("alert");
  });

  it("should strip style attributes", () => {
    const html = '<p style="color: red; background: url(evil.js)">Text</p>';
    const result = sanitizeHtml(html);

    expect(result).not.toContain("style=");
    expect(result).not.toContain("color");
    expect(result).toContain("Text");
  });

  it("should strip data-* attributes", () => {
    const html = '<div data-custom="value" data-evil="script">Text</div>';
    const result = sanitizeHtml(html);

    expect(result).not.toContain("data-custom");
    expect(result).not.toContain("data-evil");
  });

  it("should strip script tags completely", () => {
    const html = '<p>Safe</p><script>alert("xss")</script><p>Also safe</p>';
    const result = sanitizeHtml(html);

    expect(result).not.toContain("<script");
    expect(result).not.toContain("alert");
    expect(result).toContain("Safe");
    expect(result).toContain("Also safe");
  });

  it("should handle empty input", () => {
    expect(sanitizeHtml("")).toBe("");
    expect(sanitizeHtml("   ")).toBe("   ");
  });

  // Edge case tests (clipboard-tests-009)
  it("should preserve rel attribute on links", () => {
    const html =
      '<a href="https://example.com" target="_blank" rel="noopener">External</a>';
    const result = sanitizeHtml(html);

    expect(result).toContain('rel="noopener"');
    expect(result).toContain('target="_blank"');
  });
});

// =============================================================================
// parseHtmlToBlocks() Tests
// =============================================================================

describe("parseHtmlToBlocks", () => {
  describe("basic elements", () => {
    it("should parse paragraphs", () => {
      const html = "<p>Hello world</p>";
      const blocks = parseHtmlToBlocks(html);

      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe("paragraph");
      if (isParagraph(blocks[0])) {
        expect(blocks[0].props.content).toBe("Hello world");
      }
    });

    it("should parse multiple paragraphs", () => {
      const html = "<p>First</p><p>Second</p><p>Third</p>";
      const blocks = parseHtmlToBlocks(html);

      expect(blocks).toHaveLength(3);
      expect(blocks.every((b) => b.type === "paragraph")).toBe(true);
      if (isParagraph(blocks[0])) {
        expect(blocks[0].props.content).toBe("First");
      }
      if (isParagraph(blocks[1])) {
        expect(blocks[1].props.content).toBe("Second");
      }
      if (isParagraph(blocks[2])) {
        expect(blocks[2].props.content).toBe("Third");
      }
    });

    it("should parse h1 headings", () => {
      const html = "<h1>Main Title</h1>";
      const blocks = parseHtmlToBlocks(html);

      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe("heading");
      if (isHeading(blocks[0])) {
        expect(blocks[0].props.level).toBe("h1");
        expect(blocks[0].props.content).toBe("Main Title");
      }
    });

    it("should parse h2 headings", () => {
      const html = "<h2>Section Title</h2>";
      const blocks = parseHtmlToBlocks(html);

      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe("heading");
      if (isHeading(blocks[0])) {
        expect(blocks[0].props.level).toBe("h2");
      }
    });

    it("should parse h3 headings", () => {
      const html = "<h3>Subsection</h3>";
      const blocks = parseHtmlToBlocks(html);

      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe("heading");
      if (isHeading(blocks[0])) {
        expect(blocks[0].props.level).toBe("h3");
      }
    });

    it("should convert h4-h6 to h3 headings", () => {
      const html = "<h4>H4</h4><h5>H5</h5><h6>H6</h6>";
      const blocks = parseHtmlToBlocks(html);

      expect(blocks).toHaveLength(3);
      expect(blocks.every((b) => b.type === "heading")).toBe(true);
      for (const block of blocks) {
        if (isHeading(block)) {
          expect(block.props.level).toBe("h3");
        }
      }
    });

    it("should parse blockquotes", () => {
      const html = "<blockquote>Famous quote here</blockquote>";
      const blocks = parseHtmlToBlocks(html);

      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe("quote");
      if (isQuote(blocks[0])) {
        expect(blocks[0].props.content).toBe("Famous quote here");
      }
    });

    it("should extract attribution from blockquotes with cite", () => {
      const html =
        "<blockquote><p>Quote text</p><cite>Author Name</cite></blockquote>";
      const blocks = parseHtmlToBlocks(html);

      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe("quote");
      if (isQuote(blocks[0])) {
        expect(blocks[0].props.attribution).toBe("Author Name");
      }
    });

    // Edge case test (clipboard-tests-009)
    it("should extract attribution from blockquotes with footer", () => {
      const html =
        "<blockquote><p>A wise saying</p><footer>— Source Author</footer></blockquote>";
      const blocks = parseHtmlToBlocks(html);

      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe("quote");
      if (isQuote(blocks[0])) {
        expect(blocks[0].props.attribution).toBe("— Source Author");
      }
    });

    it("should parse hr as divider", () => {
      const html = "<p>Before</p><hr><p>After</p>";
      const blocks = parseHtmlToBlocks(html);

      expect(blocks).toHaveLength(3);
      expect(blocks[1].type).toBe("divider");
      if (isDivider(blocks[1])) {
        expect(blocks[1].props.style).toBe("solid");
      }
    });
  });

  describe("code blocks", () => {
    it("should parse pre/code blocks", () => {
      const html = "<pre><code>const x = 1;</code></pre>";
      const blocks = parseHtmlToBlocks(html);

      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe("code");
      if (isCode(blocks[0])) {
        expect(blocks[0].props.code).toBe("const x = 1;");
      }
    });

    it("should extract language from class", () => {
      const html =
        '<pre><code class="language-typescript">const x = 1;</code></pre>';
      const blocks = parseHtmlToBlocks(html);

      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe("code");
      if (isCode(blocks[0])) {
        expect(blocks[0].props.language).toBe("typescript");
      }
    });

    it("should handle lang- class prefix", () => {
      const html = '<pre><code class="lang-python">print("hello")</code></pre>';
      const blocks = parseHtmlToBlocks(html);

      if (isCode(blocks[0])) {
        expect(blocks[0].props.language).toBe("python");
      }
    });

    it("should default to plaintext when no language specified", () => {
      const html = "<pre><code>some code</code></pre>";
      const blocks = parseHtmlToBlocks(html);

      if (isCode(blocks[0])) {
        expect(blocks[0].props.language).toBe("plaintext");
      }
    });

    // Edge case tests (clipboard-tests-009)
    it("should handle standalone code element as paragraph with preserved HTML", () => {
      const html = "<code>inline code block</code>";
      const blocks = parseHtmlToBlocks(html);

      // Standalone <code> without <pre> is treated as inline code and wrapped in paragraph
      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe("paragraph");
      if (isParagraph(blocks[0])) {
        expect(blocks[0].props.content).toContain("<code>");
        expect(blocks[0].props.content).toContain("inline code block");
      }
    });

    it("should handle pre element without code child", () => {
      const html = "<pre>preformatted text only</pre>";
      const blocks = parseHtmlToBlocks(html);

      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe("code");
      if (isCode(blocks[0])) {
        expect(blocks[0].props.code).toBe("preformatted text only");
      }
    });

    it("should extract language from highlight-* class prefix", () => {
      const html =
        '<pre><code class="highlight-ruby">puts "hello"</code></pre>';
      const blocks = parseHtmlToBlocks(html);

      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe("code");
      if (isCode(blocks[0])) {
        expect(blocks[0].props.language).toBe("ruby");
      }
    });
  });

  describe("images", () => {
    it("should parse img elements with https URLs", () => {
      const html = '<img src="https://example.com/image.png" alt="Test image">';
      const blocks = parseHtmlToBlocks(html);

      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe("image");
      if (isImage(blocks[0])) {
        expect(blocks[0].props.src).toBe("https://example.com/image.png");
        expect(blocks[0].props.alt).toBe("Test image");
      }
    });

    // Edge case test (clipboard-tests-009)
    it("should parse img elements with http URLs", () => {
      const html = '<img src="http://example.com/image.png" alt="HTTP image">';
      const blocks = parseHtmlToBlocks(html);

      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe("image");
      if (isImage(blocks[0])) {
        expect(blocks[0].props.src).toBe("http://example.com/image.png");
        expect(blocks[0].props.alt).toBe("HTTP image");
      }
    });

    it("should parse img elements with data URLs", () => {
      const html = '<img src="data:image/png;base64,abc123" alt="Data image">';
      const blocks = parseHtmlToBlocks(html);

      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe("image");
      if (isImage(blocks[0])) {
        expect(blocks[0].props.src).toContain("data:image/png");
      }
    });

    it("should skip images with invalid URLs", () => {
      const html = '<img src="not-a-valid-url" alt="Invalid">';
      const blocks = parseHtmlToBlocks(html);

      expect(blocks).toHaveLength(0);
    });

    it("should parse figure elements with captions", () => {
      const html = `
        <figure>
          <img src="https://example.com/photo.jpg" alt="Photo">
          <figcaption>Photo caption here</figcaption>
        </figure>
      `;
      const blocks = parseHtmlToBlocks(html);

      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe("image");
      if (isImage(blocks[0])) {
        expect(blocks[0].props.caption).toBe("Photo caption here");
      }
    });
  });

  describe("lists", () => {
    it("should preserve unordered lists as HTML in paragraph", () => {
      const html = "<ul><li>Item 1</li><li>Item 2</li></ul>";
      const blocks = parseHtmlToBlocks(html);

      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe("paragraph");
      if (isParagraph(blocks[0])) {
        expect(blocks[0].props.content).toContain("<ul>");
        expect(blocks[0].props.content).toContain("<li>");
      }
    });

    it("should preserve ordered lists as HTML in paragraph", () => {
      const html = "<ol><li>First</li><li>Second</li></ol>";
      const blocks = parseHtmlToBlocks(html);

      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe("paragraph");
      if (isParagraph(blocks[0])) {
        expect(blocks[0].props.content).toContain("<ol>");
      }
    });

    it("should preserve nested list structure", () => {
      const html = `
        <ul>
          <li>Parent
            <ul>
              <li>Child 1</li>
              <li>Child 2</li>
            </ul>
          </li>
        </ul>
      `;
      const blocks = parseHtmlToBlocks(html);

      expect(blocks).toHaveLength(1);
      if (isParagraph(blocks[0])) {
        expect(blocks[0].props.content).toContain("<ul>");
        // Should contain nested ul
        expect(
          (blocks[0].props.content.match(/<ul>/g) || []).length
        ).toBeGreaterThanOrEqual(2);
      }
    });
  });

  describe("inline formatting", () => {
    it("should preserve bold formatting in paragraphs", () => {
      const html = "<p>This is <strong>bold</strong> text</p>";
      const blocks = parseHtmlToBlocks(html);

      if (isParagraph(blocks[0])) {
        expect(blocks[0].props.content).toContain("<strong>");
        expect(blocks[0].props.content).toContain("bold");
      }
    });

    it("should preserve italic formatting", () => {
      const html = "<p>This is <em>italic</em> text</p>";
      const blocks = parseHtmlToBlocks(html);

      if (isParagraph(blocks[0])) {
        expect(blocks[0].props.content).toContain("<em>");
      }
    });

    it("should preserve links in text", () => {
      const html = '<p>Visit <a href="https://example.com">our site</a></p>';
      const blocks = parseHtmlToBlocks(html);

      if (isParagraph(blocks[0])) {
        expect(blocks[0].props.content).toContain("<a");
        expect(blocks[0].props.content).toContain("href=");
        expect(blocks[0].props.content).toContain("our site");
      }
    });
  });

  describe("container elements", () => {
    it("should flatten div containers", () => {
      const html = "<div><p>Para 1</p><p>Para 2</p></div>";
      const blocks = parseHtmlToBlocks(html);

      expect(blocks).toHaveLength(2);
      expect(blocks[0].type).toBe("paragraph");
      expect(blocks[1].type).toBe("paragraph");
    });

    it("should flatten section containers", () => {
      const html = "<section><h2>Title</h2><p>Content</p></section>";
      const blocks = parseHtmlToBlocks(html);

      expect(blocks).toHaveLength(2);
      expect(blocks[0].type).toBe("heading");
      expect(blocks[1].type).toBe("paragraph");
    });

    it("should flatten article containers", () => {
      const html = "<article><h1>Article</h1><p>Body</p></article>";
      const blocks = parseHtmlToBlocks(html);

      expect(blocks).toHaveLength(2);
    });

    it("should handle deeply nested containers", () => {
      const html =
        "<div><section><article><div><p>Deep content</p></div></article></section></div>";
      const blocks = parseHtmlToBlocks(html);

      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe("paragraph");
      if (isParagraph(blocks[0])) {
        expect(blocks[0].props.content).toBe("Deep content");
      }
    });
  });

  describe("mixed content", () => {
    it("should parse mixed HTML correctly", () => {
      const html = `
        <h1>Document Title</h1>
        <p>Introduction paragraph with <strong>bold</strong> text.</p>
        <h2>Section One</h2>
        <p>Section content here.</p>
        <blockquote>A meaningful quote</blockquote>
        <hr>
        <h2>Section Two</h2>
        <pre><code class="language-javascript">console.log("hello");</code></pre>
      `;
      const blocks = parseHtmlToBlocks(html);

      expect(blocks.length).toBeGreaterThanOrEqual(7);

      // Check types in order
      expect(blocks[0].type).toBe("heading");
      if (isHeading(blocks[0])) {
        expect(blocks[0].props.level).toBe("h1");
      }

      expect(blocks[1].type).toBe("paragraph");

      expect(blocks[2].type).toBe("heading");
      if (isHeading(blocks[2])) {
        expect(blocks[2].props.level).toBe("h2");
      }

      expect(blocks[3].type).toBe("paragraph");

      expect(blocks[4].type).toBe("quote");

      expect(blocks[5].type).toBe("divider");

      expect(blocks[6].type).toBe("heading");

      expect(blocks[7].type).toBe("code");
      if (isCode(blocks[7])) {
        expect(blocks[7].props.language).toBe("javascript");
      }
    });
  });

  describe("edge cases", () => {
    it("should return empty array for empty input", () => {
      expect(parseHtmlToBlocks("")).toHaveLength(0);
      expect(parseHtmlToBlocks("   ")).toHaveLength(0);
    });

    it("should filter out empty blocks", () => {
      const html = "<p></p><p>Content</p><p>   </p>";
      const blocks = parseHtmlToBlocks(html);

      expect(blocks).toHaveLength(1);
      if (isParagraph(blocks[0])) {
        expect(blocks[0].props.content).toBe("Content");
      }
    });

    it("should handle malformed HTML gracefully", () => {
      const html = "<p>Unclosed paragraph<p>Another<div>Mixed";
      const blocks = parseHtmlToBlocks(html);

      // Should not throw and should extract some content
      expect(blocks.length).toBeGreaterThan(0);
    });

    it("should handle text nodes without wrapper elements", () => {
      const html = "Just plain text without tags";
      const blocks = parseHtmlToBlocks(html);

      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe("paragraph");
      if (isParagraph(blocks[0])) {
        expect(blocks[0].props.content).toBe("Just plain text without tags");
      }
    });

    it("should generate unique IDs for each block", () => {
      const html = "<p>One</p><p>Two</p><p>Three</p>";
      const blocks = parseHtmlToBlocks(html);

      const ids = blocks.map((b) => b.props.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });
});

// =============================================================================
// parsePlainTextToBlocks() Tests
// =============================================================================

describe("parsePlainTextToBlocks", () => {
  it("should create paragraph for simple text", () => {
    const text = "Hello world";
    const blocks = parsePlainTextToBlocks(text);

    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe("paragraph");
    if (isParagraph(blocks[0])) {
      expect(blocks[0].props.content).toBe("Hello world");
    }
  });

  it("should split by double newlines into paragraphs", () => {
    const text = "First paragraph\n\nSecond paragraph\n\nThird paragraph";
    const blocks = parsePlainTextToBlocks(text);

    expect(blocks).toHaveLength(3);
    if (isParagraph(blocks[0])) {
      expect(blocks[0].props.content).toBe("First paragraph");
    }
    if (isParagraph(blocks[1])) {
      expect(blocks[1].props.content).toBe("Second paragraph");
    }
    if (isParagraph(blocks[2])) {
      expect(blocks[2].props.content).toBe("Third paragraph");
    }
  });

  it("should handle Windows line endings (CRLF)", () => {
    const text = "First\r\n\r\nSecond\r\n\r\nThird";
    const blocks = parsePlainTextToBlocks(text);

    expect(blocks).toHaveLength(3);
  });

  it("should convert single newlines to <br>", () => {
    const text = "Line one\nLine two\nLine three";
    const blocks = parsePlainTextToBlocks(text);

    expect(blocks).toHaveLength(1);
    if (isParagraph(blocks[0])) {
      expect(blocks[0].props.content).toBe(
        "Line one<br>Line two<br>Line three"
      );
    }
  });

  it("should escape HTML special characters", () => {
    const text = "<script>alert('xss')</script>";
    const blocks = parsePlainTextToBlocks(text);

    expect(blocks).toHaveLength(1);
    if (isParagraph(blocks[0])) {
      expect(blocks[0].props.content).toContain("&lt;script&gt;");
      expect(blocks[0].props.content).not.toContain("<script>");
    }
  });

  it("should escape ampersands", () => {
    const text = "Tom & Jerry";
    const blocks = parsePlainTextToBlocks(text);

    if (isParagraph(blocks[0])) {
      expect(blocks[0].props.content).toBe("Tom &amp; Jerry");
    }
  });

  it("should escape quotes", () => {
    const text = 'He said "hello"';
    const blocks = parsePlainTextToBlocks(text);

    if (isParagraph(blocks[0])) {
      expect(blocks[0].props.content).toContain("&quot;");
    }
  });

  // Edge case test (clipboard-tests-009)
  it("should escape single quotes to &#39;", () => {
    const text = "It's a test";
    const blocks = parsePlainTextToBlocks(text);

    if (isParagraph(blocks[0])) {
      expect(blocks[0].props.content).toBe("It&#39;s a test");
    }
  });

  it("should return empty array for empty input", () => {
    expect(parsePlainTextToBlocks("")).toHaveLength(0);
    expect(parsePlainTextToBlocks("   ")).toHaveLength(0);
  });

  it("should skip empty paragraphs", () => {
    const text = "First\n\n\n\n\n\nSecond";
    const blocks = parsePlainTextToBlocks(text);

    // Multiple newlines should still result in 2 paragraphs (empty ones filtered)
    expect(blocks).toHaveLength(2);
  });

  it("should trim whitespace from paragraphs", () => {
    const text = "  Padded text  \n\n  Another padded  ";
    const blocks = parsePlainTextToBlocks(text);

    expect(blocks).toHaveLength(2);
    if (isParagraph(blocks[0])) {
      expect(blocks[0].props.content).toBe("Padded text");
    }
    if (isParagraph(blocks[1])) {
      expect(blocks[1].props.content).toBe("Another padded");
    }
  });

  it("should handle mixed line endings", () => {
    const text = "Unix\n\nWindows\r\n\r\nMore Unix\n\nDone";
    const blocks = parsePlainTextToBlocks(text);

    expect(blocks).toHaveLength(4);
  });

  it("should generate unique IDs for each block", () => {
    const text = "One\n\nTwo\n\nThree";
    const blocks = parsePlainTextToBlocks(text);

    const ids = blocks.map((b) => b.props.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});
