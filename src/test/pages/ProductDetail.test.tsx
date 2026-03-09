import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const mockProduct = {
  id: "p1",
  name: "Ceramic Vase",
  price: 45.0,
  category: "Pottery",
  description: "Beautiful hand-thrown ceramic vase",
  image_url: "",
  stock_quantity: 8,
  created_at: "",
  updated_at: "",
};

let currentProduct: typeof mockProduct | null = mockProduct;
let mockLoading = false;

vi.mock("@/hooks/useProducts", () => ({
  useProduct: () => ({ data: currentProduct, isLoading: mockLoading }),
}));

vi.mock("@/hooks/useReviews", () => ({
  useProductRating: () => ({ data: { avg_rating: 4.2, review_count: 10 } }),
  useProductRatings: () => ({ data: {} }),
}));

vi.mock("@/lib/productImages", () => ({
  getProductImage: (url: string) => url || "/placeholder.svg",
}));

const mockAddItem = vi.fn().mockReturnValue(true);
vi.mock("@/context/CartContext", () => ({
  useCart: () => ({
    addItem: mockAddItem,
    items: [],
    removeItem: vi.fn(),
    updateQuantity: vi.fn(),
    clearCart: vi.fn(),
    totalPrice: 0,
    totalItems: 0,
  }),
}));

vi.mock("@/context/CurrencyContext", () => ({
  useCurrency: () => ({
    zone: null,
    formatPrice: (p: number) => `$${p.toFixed(2)}`,
    convertPrice: (p: number) => p,
    currencySymbol: "$",
    currencyCode: "USD",
    countryCode: "US",
    setCountryCode: vi.fn(),
  }),
}));

vi.mock("@/components/ProductReviews", () => ({
  default: () => <div data-testid="product-reviews">Reviews</div>,
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import ProductDetail from "@/pages/ProductDetail";

const renderPage = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={["/product/p1"]}>
        <Routes>
          <Route path="/product/:id" element={<ProductDetail />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe("ProductDetail", () => {
  beforeEach(() => {
    currentProduct = mockProduct;
    mockLoading = false;
    mockAddItem.mockClear().mockReturnValue(true);
  });

  it("renders product name, category, and price", () => {
    renderPage();
    expect(screen.getByText("Ceramic Vase")).toBeInTheDocument();
    expect(screen.getByText("Pottery")).toBeInTheDocument();
    expect(screen.getByText("$45.00")).toBeInTheDocument();
  });

  it("renders product description", () => {
    renderPage();
    expect(screen.getByText("Beautiful hand-thrown ceramic vase")).toBeInTheDocument();
  });

  it("shows stock info", () => {
    renderPage();
    expect(screen.getByText("8 in stock")).toBeInTheDocument();
  });

  it("renders action buttons", () => {
    renderPage();
    expect(screen.getByText("Add to Cart")).toBeInTheDocument();
    expect(screen.getByText("Buy Now")).toBeInTheDocument();
  });

  it("shows product not found when product is null", () => {
    currentProduct = null;
    renderPage();
    expect(screen.getByText("Product not found.")).toBeInTheDocument();
  });

  it("shows loading state when loading", () => {
    mockLoading = true;
    currentProduct = null;
    renderPage();
    // When loading, product content should not be visible
    expect(screen.queryByText("Ceramic Vase")).not.toBeInTheDocument();
  });

  it("shows out of stock state", () => {
    currentProduct = { ...mockProduct, stock_quantity: 0 };
    renderPage();
    const outOfStockElements = screen.getAllByText(/Out of Stock/);
    expect(outOfStockElements.length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("Unavailable")).toBeInTheDocument();
  });

  it("renders product reviews section", () => {
    renderPage();
    expect(screen.getByTestId("product-reviews")).toBeInTheDocument();
  });
});
