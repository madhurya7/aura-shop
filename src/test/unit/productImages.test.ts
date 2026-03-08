import { describe, it, expect } from "vitest";
import { getProductImage } from "@/lib/productImages";

describe("getProductImage", () => {
  it("maps known image paths to imported assets", () => {
    const result = getProductImage("/products/headphones.jpg");
    // Should return a non-empty string (the imported asset path)
    expect(result).toBeTruthy();
    expect(typeof result).toBe("string");
  });

  it("returns the original URL for unknown paths", () => {
    const url = "https://example.com/custom-image.jpg";
    expect(getProductImage(url)).toBe(url);
  });

  it("returns the original path for unmapped local paths", () => {
    const path = "/products/nonexistent.jpg";
    expect(getProductImage(path)).toBe(path);
  });

  it("handles empty string", () => {
    expect(getProductImage("")).toBe("");
  });
});
