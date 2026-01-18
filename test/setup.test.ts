/**
 * Minimal test to verify Bun test runner + happy-dom setup works correctly
 */
import { describe, expect, it } from "bun:test";

describe("Test infrastructure", () => {
  it("should have DOMParser available from happy-dom", () => {
    const parser = new DOMParser();
    const doc = parser.parseFromString("<p>Hello</p>", "text/html");
    const paragraph = doc.querySelector("p");

    expect(paragraph).not.toBeNull();
    expect(paragraph?.textContent).toBe("Hello");
  });

  it("should have Document available globally", () => {
    expect(typeof document).toBe("object");
    expect(typeof document.createElement).toBe("function");
  });

  it("should have Window available globally", () => {
    expect(typeof window).toBe("object");
  });
});
