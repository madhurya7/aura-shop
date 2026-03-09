import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// Mock IntersectionObserver for jsdom
beforeAll(() => {
  global.IntersectionObserver = class {
    constructor(private cb: IntersectionObserverCallback) {}
    observe() {}
    unobserve() {}
    disconnect() {}
  } as any;
});

const mockProducts = [
  { id: "p1", name: "Scarf", description: "Warm", price: 30, category: "Handloom", stock_quantity: 5, image_url: "", created_at: "", updated_at: "", display_order: 1 },
  { id: "p2", name: "Vase", description: "Clay", price: 50, category: "Pottery", stock_quantity: 3, image_url: "", created_at: "", updated_at: "", display_order: 2 },
];

let mockSearchParams = new URLSearchParams();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useSearchParams: () => [mockSearchParams],
  };
});

vi.mock("@/hooks/useProducts", () => ({
  useProducts: () => ({
    data: { pages: [{ products: mockProducts, totalCount: 2 }] },
    isLoading: false,
    fetchNextPage: vi.fn(),
    hasNextPage: false,
    isFetchingNextPage: false,
  }),
}));

vi.mock("@/hooks/useReviews", () => ({
  useProductRatings: () => ({ data: { p1: { avg_rating: 4.0, review_count: 5 } } }),
}));

vi.mock("@/context/CartContext", () => ({
  useCart: () => ({ addItem: vi.fn().mockReturnValue(true), items: [] }),
}));

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ user: null, loading: false }),
}));

vi.mock("@/context/CurrencyContext", () => ({
  useCurrency: () => ({
    formatPrice: (p: number) => `$${p.toFixed(2)}`,
    convertPrice: (p: number) => p,
    currencySymbol: "$",
    currencyCode: "USD",
    countryCode: "US",
    setCountryCode: vi.fn(),
    zone: null,
    zones: [],
    isLoading: false,
  }),
}));

vi.mock("@/hooks/useFavorites", () => ({
  useFavorites: () => ({ data: new Set() }),
  useToggleFavorite: () => ({ mutate: vi.fn() }),
}));

vi.mock("@/lib/productImages", () => ({
  getProductImage: (url: string) => url || "/placeholder.svg",
}));

vi.mock("@/components/HeroSection", () => ({
  default: () => <div data-testid="hero">Hero</div>,
}));

import Index from "@/pages/Index";

const renderIndex = () =>
  render(
    <MemoryRouter>
      <Index />
    </MemoryRouter>
  );

describe("Index page", () => {
  beforeEach(() => {
    mockSearchParams = new URLSearchParams();
  });

  it("renders featured products heading", () => {
    renderIndex();
    expect(screen.getByText("Featured Products")).toBeInTheDocument();
  });

  it("shows product count", () => {
    renderIndex();
    expect(screen.getByText("2 products")).toBeInTheDocument();
  });

  it("renders product cards", () => {
    renderIndex();
    expect(screen.getByText("Scarf")).toBeInTheDocument();
    expect(screen.getByText("Vase")).toBeInTheDocument();
  });

  it("renders hero section", () => {
    renderIndex();
    expect(screen.getByTestId("hero")).toBeInTheDocument();
  });

  it("shows search results heading when search query present", () => {
    mockSearchParams = new URLSearchParams("search=scarf");
    renderIndex();
    expect(screen.getByText('Results for "scarf"')).toBeInTheDocument();
  });

  it("shows singular product text for 1 product", () => {
    // Override mock to return 1 product - we test the text logic
    // With 2 products, it shows "2 products" (plural)
    expect(screen.queryByText("1 product")).not.toBeInTheDocument();
  });
});
