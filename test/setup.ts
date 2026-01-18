/**
 * Test setup file for Bun test runner
 * Provides DOM APIs via happy-dom for browser API support in tests
 *
 * @see https://bun.sh/docs/test/dom
 */

import { GlobalRegistrator } from "@happy-dom/global-registrator";

// Register happy-dom globally to provide browser APIs:
// - Window, Document, DOMParser, Element, etc.
// - Required for clipboard-parser.ts (DOMParser) and DOMPurify
GlobalRegistrator.register();
