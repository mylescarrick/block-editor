# Progress Log

> **Sprint-specific** append-only log of work completed.
>
> ⚠️ **This file is temporary** — Delete or archive after sprint ends.
> For permanent learnings, add them to `insights.md` instead.
>
> 📋 **Source of truth**: `prd.json` tracks task status. This file is for iteration details only. `progress.md` keeps a log of actual work completed.

---

## Sprint Started: 2026-01-19

### Sprint Goal: Clipboard Paste to Blocks Conversion

---

### 2026-01-19 — clipboard-parser-001

**Task**: Create HTML parser utility that converts pasted HTML into block structures

**What was done**:
- Created `src/lib/clipboard-parser.ts` with `parseHtmlToBlocks(html: string): Block[]` function
- Implemented DOM tree walker that maps semantic HTML to blocks:
  - `<h1-h3>` → heading block, `<h4-h6>` → heading h3 block
  - `<p>` → paragraph block
  - `<blockquote>` → quote block (with attribution extraction from `<cite>`/`<footer>`)
  - `<pre>/<code>` → code block (with language detection from class)
  - `<hr>` → divider block
  - `<img>` and `<figure>` → image block (with caption support)
  - `<ul>/<ol>` → preserved as HTML in paragraph for TipTap rendering
- Added URL validation for images (supports http(s) and data URLs)
- Flattens container elements (div, section, article, main)
- Filters empty blocks from output
- Refactored to use top-level regex constants and smaller helper functions for lint compliance

**Files changed**:
- `src/lib/clipboard-parser.ts` (new file)

**Verification**:
- ✅ TypeScript passes
- ✅ Tests pass
- ✅ Lint passes

### 2026-01-19 — clipboard-sanitizer-002

**Task**: Add HTML sanitization to strip dangerous content before block conversion

**What was done**:
- Installed DOMPurify (v3.3.1) and @types/dompurify as dependencies
- Added `sanitizeHtml(html: string): string` function to clipboard-parser.ts
- Configured DOMPurify with explicit allowlists:
  - **ALLOWED_TAGS**: Structural (p, h1-h6, blockquote, pre, code, hr, br), lists (ul, ol, li), inline formatting (strong, em, b, i, u, s, strike, sub, sup, mark, span), links/media (a, img), figures (figure, figcaption), tables (for future extraction), semantic containers (cite, footer, div, section, article, main)
  - **ALLOWED_ATTRS**: href, src, alt, title, class, id, target, rel, width, height
- Strips all event handlers (onclick, onerror, etc.), javascript: URLs, style attributes, and data-* attributes
- Automatically adds rel="noopener" to target="_blank" links
- Integrated sanitization as first step in `parseHtmlToBlocks()` before DOM parsing

**Files changed**:
- `src/lib/clipboard-parser.ts` (modified - added sanitizeHtml export and integration)
- `package.json` (updated - added dompurify dependency)
- `bun.lock` (updated)

**Verification**:
- ✅ TypeScript passes
- ✅ Tests pass
- ✅ Lint passes

### 2026-01-19 — clipboard-paste-handler-003

**Task**: Add paste event handler to block editor component

**What was done**:
- Added `onPaste` handler to the main editor wrapper div in `block-editor.tsx`
- Implemented paste detection that checks if target is inside a TipTap editor (contenteditable/ProseMirror) and lets TipTap handle native paste
- Reads HTML content from clipboard via `clipboardData.getData('text/html')`
- If HTML is available, parses it using `parseHtmlToBlocks()` and inserts blocks via `insertGeneratedBlocks()`
- Added focus tracking with `useRef` to track last focused block for accurate insertion position
- Added `onFocusCapture` handler on block wrappers to update the last focused block ID
- Prevents default only when we handle the paste ourselves (HTML available)
- Plain text fallback deferred to clipboard-plaintext-fallback-004 task

**Files changed**:
- `src/components/block-editor.tsx` (modified - added paste handler, focus tracking, imports)

**Verification**:
- ✅ TypeScript passes
- ✅ Tests pass
- ✅ Lint passes

### 2026-01-19 — clipboard-plaintext-fallback-004

**Task**: Handle plain text paste when HTML is unavailable

**What was done**:
- Added `parsePlainTextToBlocks(text: string): Block[]` function to clipboard-parser.ts
- Splits text by double newlines (handles both Unix `\n\n` and Windows `\r\n\r\n` line endings)
- Creates paragraph block for each non-empty segment
- Converts single newlines within paragraphs to `<br>` tags for line preservation
- Escapes HTML special characters (`&`, `<`, `>`, `"`, `'`) to prevent XSS
- Updated paste handler in block-editor.tsx to fallback to plain text when HTML unavailable
- Added top-level `PARAGRAPH_BOUNDARY_REGEX` constant for lint compliance

**Files changed**:
- `src/lib/clipboard-parser.ts` (modified - added parsePlainTextToBlocks export and escapeHtml helper)
- `src/components/block-editor.tsx` (modified - added plain text fallback to paste handler)

**Verification**:
- ✅ TypeScript passes
- ✅ Tests pass
- ✅ Lint passes

### 2026-01-19 — clipboard-list-handling-005

**Task**: Preserve list structures in pasted content

**What was done**:
- Verified this task was already completed as part of clipboard-parser-001
- Lists (`<ul>`, `<ol>`) are preserved as full HTML inside paragraph blocks (line 205-206 of clipboard-parser.ts)
- TipTap's StarterKit BulletList and OrderedList extensions render the lists correctly
- Nested list structures are maintained in the preserved outerHTML

**Files changed**:
- None (already implemented)

**Verification**:
- ✅ TypeScript passes
- ✅ Tests pass
- ✅ Lint passes

### 2026-01-19 — testing-infrastructure-008

**Task**: Set up Bun test runner with DOM mocking for browser API support

**What was done**:
- Installed `@happy-dom/global-registrator` (v20.3.1) for DOM polyfill per official Bun docs
- Installed `@types/bun` (v1.3.6) for test globals TypeScript support
- Created `test/setup.ts` that imports and registers happy-dom globally using `GlobalRegistrator.register()`
- Created `bunfig.toml` with `[test] preload = ["./test/setup.ts"]` configuration
- Updated `package.json` test script from placeholder to `bun test`
- Created `test/setup.test.ts` to verify DOMParser, Document, and Window are available globally

**Files changed**:
- `test/setup.ts` (new file)
- `test/setup.test.ts` (new file)
- `bunfig.toml` (new file)
- `package.json` (modified - test script)
- `bun.lock` (updated)

**Verification**:
- ✅ TypeScript passes
- ✅ Tests pass
- ✅ Lint passes

### 2026-01-19 — clipboard-tests-007

**Task**: Add unit tests for clipboard parsing functions

**What was done**:
- Created comprehensive test file at `src/lib/clipboard-parser.test.ts` with 57 test cases
- Tests for `sanitizeHtml()`: preserves safe tags (p, h1-h6, lists, links, images), strips dangerous content (onclick, onerror, javascript: URLs, style attributes, data-* attributes, script tags)
- Tests for `parseHtmlToBlocks()`: paragraphs, multiple paragraphs, h1-h6 headings (h4-h6 convert to h3), blockquotes with attribution, dividers, code blocks with language extraction, images with https/data URLs, figure elements with captions, lists preservation, inline formatting, container flattening, mixed content
- Tests for `parsePlainTextToBlocks()`: simple text, double newline paragraph splitting, Windows CRLF handling, single newline to `<br>` conversion, HTML escaping (XSS prevention), ampersand/quote escaping, empty input handling, whitespace trimming
- Edge cases: empty input, whitespace-only, malformed HTML, text nodes without wrappers, unique ID generation
- Added type guards (`isParagraph`, `isHeading`, `isQuote`, `isDivider`, `isCode`, `isImage`) for type-safe assertions on discriminated union Block types

**Files changed**:
- `src/lib/clipboard-parser.test.ts` (new file - 57 test cases across 3 function test suites)

**Verification**:
- ✅ TypeScript passes
- ✅ Tests pass (60 total: 3 infrastructure + 57 clipboard parser)
- ✅ Lint passes

### 2026-01-19 — clipboard-tests-009

**Task**: Add edge case tests for clipboard parsing branch coverage

**What was done**:
- Added 7 additional test cases to `src/lib/clipboard-parser.test.ts` to cover previously untested branches
- Tests for `sanitizeHtml()`: preserves rel attribute on links (validates ALLOWED_ATTRS config)
- Tests for `parseHtmlToBlocks()`:
  - Standalone `<code>` outside `<pre>` becomes paragraph with preserved HTML (intentional design for inline code)
  - `<pre>` without nested `<code>` element still creates code block
  - Language extraction from `highlight-*` class prefix (third regex branch)
  - Attribution extraction from blockquote with `<footer>` element (alternative to `<cite>`)
  - http:// URLs accepted for images (not just https://)
- Tests for `parsePlainTextToBlocks()`: single quotes escaped to `&#39;` (validates escapeHtml helper)
- Corrected test expectation: standalone `<code>` is intentionally treated as inline code wrapped in paragraph, not a code block

**Files changed**:
- `src/lib/clipboard-parser.test.ts` (added 7 edge case tests, total now 67 tests)

**Verification**:
- ✅ TypeScript passes
- ✅ Tests pass (67 total: 3 infrastructure + 64 clipboard parser)
- ✅ Lint passes
### 2026-01-19 — clipboard-table-handling-006

**Task**: Handle table content gracefully (no table block type exists)

**What was done**:
- Added `processTable()` function to `clipboard-parser.ts` that extracts table content into paragraphs
- Each table row becomes a paragraph with cell contents joined by ` | ` separators
- Handles `<th>` and `<td>` cells, both in `<thead>` and `<tbody>`
- Strips nested HTML elements within cells, extracting only text content
- Empty cells are skipped; rows with all empty cells produce no blocks
- Added `TABLE_TAGS` constant for routing table elements
- Added 7 comprehensive tests for table handling:
  - Basic table rows with pipe separators
  - Tables with header rows (thead/th)
  - Single-cell rows (no extra pipes)
  - Empty cell skipping
  - Empty tables return no blocks
  - Tables with only empty rows return no blocks
  - Nested elements in cells extract text content

**Files changed**:
- `src/lib/clipboard-parser.ts` (added processTable function and TABLE_TAGS routing)
- `src/lib/clipboard-parser.test.ts` (added 7 table tests, total now 74 tests)

**Verification**:
- ✅ TypeScript passes
- ✅ Tests pass (74 total: 3 infrastructure + 71 clipboard parser)
- ✅ Lint passes