import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const mockAddItem = vi.fn().mockReturnValue(true);
let mockUser: any = { id: "u1", email: "test@test.com" };
let mockFavoriteSet = new Set<string>();
const mockMutate = vi.fn();

vi.mock("@/context/CartContext", () => ({
  useCart: () => ({ addItem: mockAddItem, items: [] }),
}));

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ user: mockUser, loading: false }),
}));

vi.mock("@/hooks/useFavorites", () => ({
  useFavorites: () => ({ data: mockFavoriteSet }),
  useToggleFavorite: () => ({ mutate: mockMutate }),
}));

vi.mock("@/lib/productImages", () => ({
  getProductImage: (url: string) => url || "/placeholder.svg",
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import ProductCard from "@/components/ProductCard";
import { toast } from "sonner";

const baseProduct = {
  id: "p1", name: "Handloom Scarf", description: "Beautiful scarf", price: 29.99,
  category: "Handloom", stock_quantity: 10, image_url: "", created_at: "", updated_at: "",
};

const renderCard = (product = baseProduct, rating?: any) =>
  render(
    <MemoryRouter>
      <ProductCard product={product} index={0} rating={rating} />
    </MemoryRouter>
  );

describe("ProductCard", () => {
  beforeEach(() => {
    mockAddItem.mockClear().mockReturnValue(true);
    mockMutate.mockClear();
    mockUser = { id: "u1", email: "test@test.com" };
    mockFavoriteSet = new Set();
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  it("renders product name, category, price, and description", () => {
    renderCard();
    expect(screen.getByText("Handloom Scarf")).toBeInTheDocument();
    expect(screen.getByText("Handloom")).toBeInTheDocument();
    expect(screen.getByText("$29.99")).toBeInTheDocument();
    expect(screen.getByText("Beautiful scarf")).toBeInTheDocument();
  });

  it("renders Add button when in stock", () => {
    renderCard();
    expect(screen.getByText("Add")).toBeInTheDocument();
  });

  it("renders Sold Out when out of stock", () => {
    renderCard({ ...baseProduct, stock_quantity: 0 });
    expect(screen.getByText("Sold Out")).toBeInTheDocument();
    expect(screen.getByText("Out of Stock")).toBeInTheDocument();
  });

  it("calls addItem and shows toast on Add click", () => {
    renderCard();
    fireEvent.click(screen.getByText("Add"));
    expect(mockAddItem).toHaveBeenCalledWith(baseProduct);
    expect(toast.success).toHaveBeenCalledWith("Handloom Scarf added to cart");
  });

  it("shows error toast when addItem fails", () => {
    mockAddItem.mockReturnValue(false);
    renderCard();
    fireEvent.click(screen.getByText("Add"));
    expect(toast.error).toHaveBeenCalled();
  });

  it("shows error toast when trying to add out of stock item", () => {
    renderCard({ ...baseProduct, stock_quantity: 0 });
    fireEvent.click(screen.getByText("Sold Out"));
    expect(toast.error).toHaveBeenCalledWith("This product is out of stock");
  });

  it("renders star rating when provided", () => {
    renderCard(baseProduct, { avg_rating: 4.5, review_count: 12 });
    expect(screen.getByText("4.5")).toBeInTheDocument();
    expect(screen.getByText("(12)")).toBeInTheDocument();
  });

  it("does not render star rating when not provided", () => {
    renderCard();
    expect(screen.queryByText(/\(\d+\)/)).not.toBeInTheDocument();
  });

  it("shows sign-in error when favoriting without auth", () => {
    mockUser = null;
    renderCard();
    // Click the heart button
    const heartBtn = screen.getByRole("button", { name: "" }); // heart button has no text
    // Find button with Heart icon
    const buttons = document.querySelectorAll("button");
    const favBtn = Array.from(buttons).find(b => b.querySelector(".lucide-heart"));
    if (favBtn) fireEvent.click(favBtn);
    expect(toast.error).toHaveBeenCalledWith("Sign in to save favorites");
  });

  it("links to product detail page", () => {
    renderCard();
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/product/p1");
  });
});
