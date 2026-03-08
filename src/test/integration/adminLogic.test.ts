import { describe, it, expect } from "vitest";

/**
 * Tests for admin business logic.
 */

const ORDER_STATUSES = ["pending", "paid", "shipped", "delivered", "cancelled"] as const;

function isValidStatusTransition(from: string, to: string): boolean {
  // Admins can set any status (per the existing implementation)
  return ORDER_STATUSES.includes(to as any);
}

function buildProductPayload(form: {
  name: string;
  description: string;
  price: string;
  category: string;
  stock_quantity: string;
  image_url: string;
}) {
  return {
    name: form.name,
    description: form.description,
    price: parseFloat(form.price),
    category: form.category,
    stock_quantity: parseInt(form.stock_quantity) || 0,
    image_url: form.image_url,
  };
}

describe("Admin Order Status Management", () => {
  it("allows all valid status transitions", () => {
    for (const status of ORDER_STATUSES) {
      expect(isValidStatusTransition("pending", status)).toBe(true);
    }
  });

  it("rejects invalid status", () => {
    expect(isValidStatusTransition("pending", "nonexistent")).toBe(false);
  });
});

describe("Product Payload Builder", () => {
  it("builds correct payload from form data", () => {
    const payload = buildProductPayload({
      name: "Test Product",
      description: "A test product",
      price: "29.99",
      category: "Electronics",
      stock_quantity: "50",
      image_url: "/products/test.jpg",
    });

    expect(payload.name).toBe("Test Product");
    expect(payload.price).toBe(29.99);
    expect(payload.stock_quantity).toBe(50);
    expect(payload.category).toBe("Electronics");
  });

  it("defaults stock to 0 for invalid input", () => {
    const payload = buildProductPayload({
      name: "Test",
      description: "",
      price: "10",
      category: "",
      stock_quantity: "abc",
      image_url: "",
    });

    expect(payload.stock_quantity).toBe(0);
  });

  it("parses decimal prices correctly", () => {
    const payload = buildProductPayload({
      name: "Test",
      description: "",
      price: "199.95",
      category: "",
      stock_quantity: "0",
      image_url: "",
    });

    expect(payload.price).toBe(199.95);
  });
});
