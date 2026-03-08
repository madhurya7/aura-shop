import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { CartProvider, useCart } from "@/context/CartContext";
import { mockProducts } from "../fixtures/products";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(window, "localStorage", { value: localStorageMock });

function wrapper({ children }: { children: React.ReactNode }) {
  return <CartProvider>{children}</CartProvider>;
}

describe("CartContext", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it("starts with an empty cart", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    expect(result.current.items).toHaveLength(0);
    expect(result.current.totalItems).toBe(0);
    expect(result.current.totalPrice).toBe(0);
  });

  it("adds an item to the cart", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => {
      result.current.addItem(mockProducts[0] as any);
    });
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].productId).toBe("prod-1");
    expect(result.current.items[0].quantity).toBe(1);
    expect(result.current.totalItems).toBe(1);
    expect(result.current.totalPrice).toBe(249.99);
  });

  it("increments quantity when adding the same item", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => {
      result.current.addItem(mockProducts[0] as any);
      result.current.addItem(mockProducts[0] as any);
    });
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].quantity).toBe(2);
    expect(result.current.totalItems).toBe(2);
  });

  it("prevents adding more than stock quantity", () => {
    const product = { ...mockProducts[0], stock_quantity: 2 } as any;
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => {
      result.current.addItem(product);
      result.current.addItem(product);
    });
    let added: boolean;
    act(() => {
      added = result.current.addItem(product);
    });
    expect(added!).toBe(false);
    expect(result.current.items[0].quantity).toBe(2);
  });

  it("prevents adding out-of-stock products", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    let added: boolean;
    act(() => {
      added = result.current.addItem(mockProducts[2] as any); // stock = 0
    });
    expect(added!).toBe(false);
    expect(result.current.items).toHaveLength(0);
  });

  it("removes an item from the cart", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => {
      result.current.addItem(mockProducts[0] as any);
      result.current.addItem(mockProducts[1] as any);
    });
    expect(result.current.items).toHaveLength(2);
    act(() => {
      result.current.removeItem("prod-1");
    });
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].productId).toBe("prod-2");
  });

  it("updates quantity", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => {
      result.current.addItem(mockProducts[0] as any);
    });
    act(() => {
      result.current.updateQuantity("prod-1", 5);
    });
    expect(result.current.items[0].quantity).toBe(5);
  });

  it("removes item when quantity set to 0", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => {
      result.current.addItem(mockProducts[0] as any);
    });
    act(() => {
      result.current.updateQuantity("prod-1", 0);
    });
    expect(result.current.items).toHaveLength(0);
  });

  it("prevents updating quantity beyond stock limit", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => {
      result.current.addItem(mockProducts[0] as any);
    });
    let updated: boolean;
    act(() => {
      updated = result.current.updateQuantity("prod-1", 50, 24);
    });
    expect(updated!).toBe(false);
  });

  it("clears the cart", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => {
      result.current.addItem(mockProducts[0] as any);
      result.current.addItem(mockProducts[1] as any);
    });
    act(() => {
      result.current.clearCart();
    });
    expect(result.current.items).toHaveLength(0);
    expect(result.current.totalPrice).toBe(0);
  });

  it("calculates total price correctly with multiple items", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => {
      result.current.addItem(mockProducts[0] as any, 2); // 249.99 × 2
      result.current.addItem(mockProducts[1] as any, 1); // 179.99 × 1
    });
    expect(result.current.totalPrice).toBeCloseTo(679.97, 2);
    expect(result.current.totalItems).toBe(3);
  });

  it("persists cart to localStorage", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => {
      result.current.addItem(mockProducts[0] as any);
    });
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "cart",
      expect.any(String)
    );
  });

  it("throws error when used outside CartProvider", () => {
    expect(() => {
      renderHook(() => useCart());
    }).toThrow("useCart must be used within CartProvider");
  });
});
