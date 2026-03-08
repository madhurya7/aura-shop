import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import CartPage from "@/pages/CartPage";
import { CartProvider } from "@/context/CartContext";

// Mock useAllProducts
vi.mock("@/hooks/useProducts", () => ({
  useAllProducts: () => ({
    data: [
      { id: "prod-1", name: "Headphones", stock_quantity: 24, price: 249.99 },
      { id: "prod-2", name: "Keyboard", stock_quantity: 35, price: 179.99 },
    ],
    isLoading: false,
  }),
}));

// Mock sonner
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// Mock productImages
vi.mock("@/lib/productImages", () => ({
  getProductImage: (url: string) => url || "/placeholder.svg",
}));

function renderCartPage() {
  return render(
    <MemoryRouter>
      <CartProvider>
        <CartPage />
      </CartProvider>
    </MemoryRouter>
  );
}

describe("CartPage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("shows empty cart state", () => {
    renderCartPage();
    expect(screen.getByText("Your cart is empty")).toBeInTheDocument();
    expect(screen.getByText("Continue Shopping")).toBeInTheDocument();
  });

  it("shows cart items when cart has items", () => {
    localStorage.setItem(
      "cart",
      JSON.stringify([
        {
          productId: "prod-1",
          name: "Wireless Headphones",
          price: 249.99,
          image_url: "/products/headphones.jpg",
          category: "Audio",
          quantity: 2,
        },
      ])
    );
    renderCartPage();
    expect(screen.getByText("Shopping Cart")).toBeInTheDocument();
    expect(screen.getByText("Wireless Headphones")).toBeInTheDocument();
    expect(screen.getByText("Order Summary")).toBeInTheDocument();
  });

  it("shows correct total price", () => {
    localStorage.setItem(
      "cart",
      JSON.stringify([
        {
          productId: "prod-1",
          name: "Headphones",
          price: 249.99,
          image_url: "",
          category: "Audio",
          quantity: 2,
        },
        {
          productId: "prod-2",
          name: "Keyboard",
          price: 179.99,
          image_url: "",
          category: "Peripherals",
          quantity: 1,
        },
      ])
    );
    renderCartPage();
    expect(screen.getByText("$679.97")).toBeInTheDocument();
  });

  it("shows Proceed to Checkout link", () => {
    localStorage.setItem(
      "cart",
      JSON.stringify([
        { productId: "prod-1", name: "Item", price: 10, image_url: "", category: "Test", quantity: 1 },
      ])
    );
    renderCartPage();
    expect(screen.getByText("Proceed to Checkout")).toBeInTheDocument();
  });

  it("removes item when trash button is clicked", () => {
    localStorage.setItem(
      "cart",
      JSON.stringify([
        { productId: "prod-1", name: "Headphones", price: 249.99, image_url: "", category: "Audio", quantity: 1 },
        { productId: "prod-2", name: "Keyboard", price: 179.99, image_url: "", category: "Peripherals", quantity: 1 },
      ])
    );
    renderCartPage();
    // There should be trash buttons for each item
    const trashButtons = screen.getAllByRole("button").filter((btn) => {
      return btn.querySelector("svg.lucide-trash-2");
    });
    expect(trashButtons.length).toBeGreaterThanOrEqual(1);
    fireEvent.click(trashButtons[0]);
    // After removing, only one item should remain
    expect(screen.queryByText("Headphones")).not.toBeInTheDocument();
  });

  it("shows stock warning when quantity exceeds stock", () => {
    localStorage.setItem(
      "cart",
      JSON.stringify([
        { productId: "prod-1", name: "Headphones", price: 249.99, image_url: "", category: "Audio", quantity: 50 },
      ])
    );
    renderCartPage();
    expect(screen.getByText(/Only 24 available/)).toBeInTheDocument();
  });
});
