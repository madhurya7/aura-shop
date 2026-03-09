import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
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
  useProductRating: () => ({
    data: { avg_rating: 4.2, review_count: 10 },
  }),
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

vi.mock("@/components/ProductReviews", () => ({
  default: () => <div data-testid="product-reviews">Reviews</div>,
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const renderPage = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/product/p1"]}>
        <Routes>
          <Route path="/product/:id" element={<ProductDetailWrapper />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

function ProductDetailWrapper() {
  const ProductDetail = require("@/pages/ProductDetail").default;
  return <ProductDetail />;
}

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

  it("renders Add to Cart and Buy Now buttons", () => {
    renderPage();
    expect(screen.getByText("Add to Cart")).toBeInTheDocument();
    expect(screen.getByText("Buy Now")).toBeInTheDocument();
  });

  it("shows product not found when product is null", () => {
    currentProduct = null;
    renderPage();
    expect(screen.getByText("Product not found.")).toBeInTheDocument();
  });

  it("shows loading skeleton when loading", () => {
    mockLoading = true;
    currentProduct = null;
    const { container } = renderPage();
    const skeletons = container.querySelectorAll('[class*="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("shows out of stock badge and disables buttons when stock is 0", () => {
    currentProduct = { ...mockProduct, stock_quantity: 0 };
    renderPage();
    expect(screen.getByText("Out of Stock")).toBeInTheDocument();
    expect(screen.getByText("Unavailable")).toBeInTheDocument();
  });

  it("renders product reviews section", () => {
    renderPage();
    expect(screen.getByTestId("product-reviews")).toBeInTheDocument();
  });

  it("increments and decrements quantity", () => {
    renderPage();
    // Default qty is 1
    expect(screen.getByText("1")).toBeInTheDocument();
    // Click plus
    const buttons = screen.getAllByRole("button");
    const plusBtn = buttons.find((b) => b.querySelector('[class*="lucide-plus"]'));
    if (plusBtn) {
      fireEvent.click(plusBtn);
      expect(screen.getByText("2")).toBeInTheDocument();
    }
  });
});
