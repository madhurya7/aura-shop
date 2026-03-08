import { describe, it, expect } from "vitest";

// Price formatting logic extracted from components
function formatPrice(price: number): string {
  return `$${Number(price).toFixed(2)}`;
}

function calculateLineTotal(price: number, quantity: number): string {
  return `$${(price * quantity).toFixed(2)}`;
}

function calculateCartTotal(items: { price: number; quantity: number }[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

describe("Price Formatting", () => {
  it("formats whole dollar amounts", () => {
    expect(formatPrice(100)).toBe("$100.00");
  });

  it("formats cents correctly", () => {
    expect(formatPrice(249.99)).toBe("$249.99");
  });

  it("formats single cent", () => {
    expect(formatPrice(10.1)).toBe("$10.10");
  });

  it("formats zero", () => {
    expect(formatPrice(0)).toBe("$0.00");
  });

  it("handles floating point edge cases", () => {
    expect(formatPrice(0.1 + 0.2)).toBe("$0.30");
  });
});

describe("Line Total Calculation", () => {
  it("calculates single item total", () => {
    expect(calculateLineTotal(249.99, 1)).toBe("$249.99");
  });

  it("calculates multi-quantity total", () => {
    expect(calculateLineTotal(249.99, 3)).toBe("$749.97");
  });

  it("handles zero quantity", () => {
    expect(calculateLineTotal(249.99, 0)).toBe("$0.00");
  });
});

describe("Cart Total Calculation", () => {
  it("calculates total for multiple items", () => {
    const items = [
      { price: 249.99, quantity: 2 },
      { price: 179.99, quantity: 1 },
    ];
    expect(calculateCartTotal(items)).toBeCloseTo(679.97, 2);
  });

  it("returns 0 for empty cart", () => {
    expect(calculateCartTotal([])).toBe(0);
  });

  it("handles single item", () => {
    expect(calculateCartTotal([{ price: 79.99, quantity: 1 }])).toBe(79.99);
  });

  it("handles large quantities", () => {
    const total = calculateCartTotal([{ price: 10, quantity: 1000 }]);
    expect(total).toBe(10000);
  });
});
