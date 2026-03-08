import { describe, it, expect } from "vitest";
import { products, categories } from "@/data/products";

describe("Product Data", () => {
  it("contains products", () => {
    expect(products.length).toBeGreaterThan(0);
  });

  it("each product has required fields", () => {
    for (const product of products) {
      expect(product.id).toBeTruthy();
      expect(product.name).toBeTruthy();
      expect(product.description).toBeTruthy();
      expect(product.price).toBeGreaterThan(0);
      expect(product.image).toBeTruthy();
      expect(product.category).toBeTruthy();
      expect(product.stock).toBeGreaterThanOrEqual(0);
    }
  });

  it("has unique product IDs", () => {
    const ids = products.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has positive prices", () => {
    for (const product of products) {
      expect(product.price).toBeGreaterThan(0);
    }
  });

  it("categories are derived from products", () => {
    expect(categories.length).toBeGreaterThan(0);
    const uniqueCats = [...new Set(products.map((p) => p.category))];
    expect(categories).toEqual(uniqueCats);
  });

  it("categories contain no duplicates", () => {
    expect(new Set(categories).size).toBe(categories.length);
  });
});
