import { describe, it, expect } from "vitest";

/**
 * Tests for stock management logic used across the app.
 */

function decrementStock(currentStock: number, quantity: number): number {
  return Math.max(currentStock - quantity, 0);
}

function canAddToCart(
  productStock: number,
  currentCartQty: number,
  requestedQty: number
): boolean {
  if (productStock <= 0) return false;
  if (currentCartQty + requestedQty > productStock) return false;
  return true;
}

function validateStockForCheckout(
  items: { productId: string; quantity: number }[],
  products: { id: string; stock_quantity: number; name: string }[]
): { valid: boolean; error?: string } {
  for (const item of items) {
    const product = products.find((p) => p.id === item.productId);
    if (!product) return { valid: false, error: `Product not found: ${item.productId}` };
    if (product.stock_quantity < item.quantity) {
      return {
        valid: false,
        error: `Insufficient stock for "${product.name}": only ${product.stock_quantity} available`,
      };
    }
  }
  return { valid: true };
}

describe("Stock Decrement", () => {
  it("decrements stock normally", () => {
    expect(decrementStock(24, 2)).toBe(22);
  });

  it("never goes below zero", () => {
    expect(decrementStock(1, 5)).toBe(0);
  });

  it("handles exact stock", () => {
    expect(decrementStock(5, 5)).toBe(0);
  });

  it("handles zero stock", () => {
    expect(decrementStock(0, 1)).toBe(0);
  });
});

describe("Cart Addition Validation", () => {
  it("allows adding when stock available", () => {
    expect(canAddToCart(24, 0, 1)).toBe(true);
  });

  it("allows adding up to stock limit", () => {
    expect(canAddToCart(24, 23, 1)).toBe(true);
  });

  it("prevents exceeding stock", () => {
    expect(canAddToCart(24, 24, 1)).toBe(false);
  });

  it("prevents adding when out of stock", () => {
    expect(canAddToCart(0, 0, 1)).toBe(false);
  });

  it("prevents adding multiple exceeding stock", () => {
    expect(canAddToCart(5, 3, 5)).toBe(false);
  });
});

describe("Checkout Stock Validation", () => {
  const products = [
    { id: "prod-1", stock_quantity: 24, name: "Headphones" },
    { id: "prod-2", stock_quantity: 35, name: "Keyboard" },
    { id: "prod-3", stock_quantity: 0, name: "Mouse" },
  ];

  it("validates when all items have stock", () => {
    const result = validateStockForCheckout(
      [{ productId: "prod-1", quantity: 2 }, { productId: "prod-2", quantity: 1 }],
      products
    );
    expect(result.valid).toBe(true);
  });

  it("fails for out-of-stock product", () => {
    const result = validateStockForCheckout(
      [{ productId: "prod-3", quantity: 1 }],
      products
    );
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Mouse");
  });

  it("fails for exceeding stock", () => {
    const result = validateStockForCheckout(
      [{ productId: "prod-1", quantity: 50 }],
      products
    );
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Headphones");
  });

  it("fails for unknown product", () => {
    const result = validateStockForCheckout(
      [{ productId: "nonexistent", quantity: 1 }],
      products
    );
    expect(result.valid).toBe(false);
    expect(result.error).toContain("nonexistent");
  });

  it("validates empty cart", () => {
    const result = validateStockForCheckout([], products);
    expect(result.valid).toBe(true);
  });
});
