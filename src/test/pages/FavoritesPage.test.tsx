import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CartProvider } from "@/context/CartContext";

const mockUser = { id: "user-1", email: "test@example.com" };
let currentUser: typeof mockUser | null = mockUser;

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ user: currentUser, loading: false }),
  AuthProvider: ({ children }: any) => children,
}));

const mockProducts = [
  { id: "p1", name: "Handloom Scarf", price: 29.99, category: "Handloom", description: "A beautiful scarf", image_url: "", stock_quantity: 10 },
  { id: "p2", name: "Silver Necklace", price: 49.99, category: "Jewelry", description: "Elegant necklace", image_url: "", stock_quantity: 5 },
];

let mockFavData: typeof mockProducts | undefined = mockProducts;
let mockFavLoading = false;

vi.mock("@/hooks/useFavorites", () => ({
  useFavoriteProducts: () => ({ data: mockFavData, isLoading: mockFavLoading }),
  useFavorites: () => ({ data: new Set(["p1", "p2"]) }),
  useToggleFavorite: () => ({ mutate: vi.fn() }),
}));

vi.mock("@/hooks/useReviews", () => ({
  useProductRatings: () => ({ data: {} }),
  useProductRating: () => ({ data: null }),
}));

vi.mock("@/hooks/useProducts", () => ({
  useAllProducts: () => ({ data: mockProducts, isLoading: false }),
}));

vi.mock("@/lib/productImages", () => ({
  getProductImage: (url: string) => url || "/placeholder.svg",
}));

import FavoritesPage from "@/pages/FavoritesPage";

const renderPage = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <CartProvider>
          <FavoritesPage />
        </CartProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe("FavoritesPage", () => {
  beforeEach(() => {
    currentUser = mockUser;
    mockFavData = mockProducts;
    mockFavLoading = false;
  });

  it("shows sign-in prompt when not authenticated", () => {
    currentUser = null;
    renderPage();
    expect(screen.getByText(/sign in to view your favorites/i)).toBeInTheDocument();
  });

  it("renders heading and product count", () => {
    renderPage();
    expect(screen.getByText("My Favorites")).toBeInTheDocument();
    expect(screen.getByText("2 saved items")).toBeInTheDocument();
  });

  it("renders product cards", () => {
    renderPage();
    expect(screen.getByText("Handloom Scarf")).toBeInTheDocument();
    expect(screen.getByText("Silver Necklace")).toBeInTheDocument();
  });

  it("shows empty state when no favorites", () => {
    mockFavData = [];
    renderPage();
    expect(screen.getByText(/no favorites yet/i)).toBeInTheDocument();
  });

  it("shows singular item text for one product", () => {
    mockFavData = [mockProducts[0]];
    renderPage();
    expect(screen.getByText("1 saved item")).toBeInTheDocument();
  });
});
