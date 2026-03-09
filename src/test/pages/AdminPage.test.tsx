import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// --- Mutable mock state ---
let mockIsAdmin = true;
let mockAdminLoading = false;
let mockUser: { id: string; email: string } | null = { id: "admin-1", email: "admin@test.com" };

let mockProducts = [
  { id: "p1", name: "Headphones", description: "Great sound", price: 99.99, category: "Electronics", stock_quantity: 20, image_url: "", created_at: "", updated_at: "", display_order: 1 },
  { id: "p2", name: "Ceramic Bowl", description: "Handmade", price: 29.99, category: "Pottery", stock_quantity: 15, image_url: "", created_at: "", updated_at: "", display_order: 2 },
];
let mockProductsLoading = false;

vi.mock("@/hooks/useAdminCheck", () => ({
  useAdminCheck: () => ({ isAdmin: mockIsAdmin, loading: mockAdminLoading, user: mockUser }),
}));

vi.mock("@/hooks/useProducts", () => ({
  useAllProducts: () => ({ data: mockProducts, isLoading: mockProductsLoading }),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
      insert: vi.fn().mockResolvedValue({ error: null }),
      delete: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
    }),
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: "https://example.com/img.jpg" } }),
      }),
    },
  },
}));

vi.mock("@/components/AdminOrders", () => ({
  default: () => <div data-testid="admin-orders">Admin Orders Component</div>,
}));

const mockToast = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

import AdminPage from "@/pages/AdminPage";

const renderPage = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <AdminPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe("AdminPage", () => {
  beforeEach(() => {
    mockIsAdmin = true;
    mockAdminLoading = false;
    mockUser = { id: "admin-1", email: "admin@test.com" };
    mockProducts = [
      { id: "p1", name: "Headphones", description: "Great sound", price: 99.99, category: "Electronics", stock_quantity: 20, image_url: "", created_at: "", updated_at: "", display_order: 1 },
      { id: "p2", name: "Ceramic Bowl", description: "Handmade", price: 29.99, category: "Pottery", stock_quantity: 15, image_url: "", created_at: "", updated_at: "", display_order: 2 },
    ];
    mockProductsLoading = false;
    mockToast.mockClear();
  });

  it("shows sign-in prompt when user is not authenticated", () => {
    mockUser = null;
    mockIsAdmin = false;
    renderPage();
    expect(screen.getByText(/please sign in to access the admin dashboard/i)).toBeInTheDocument();
    expect(screen.getByText("Sign In")).toBeInTheDocument();
  });

  it("shows access denied for non-admin users", () => {
    mockIsAdmin = false;
    renderPage();
    expect(screen.getByText("Access Denied")).toBeInTheDocument();
    expect(screen.getByText(/you do not have admin privileges/i)).toBeInTheDocument();
  });

  it("renders dashboard heading and tabs for admin users", () => {
    renderPage();
    expect(screen.getByText("Admin Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Products")).toBeInTheDocument();
    expect(screen.getByText("Orders")).toBeInTheDocument();
  });

  it("renders product table with product data", () => {
    renderPage();
    expect(screen.getByText("Headphones")).toBeInTheDocument();
    expect(screen.getByText("Ceramic Bowl")).toBeInTheDocument();
    expect(screen.getByText("$99.99")).toBeInTheDocument();
    expect(screen.getByText("Electronics")).toBeInTheDocument();
  });

  it("shows empty state when no products exist", () => {
    mockProducts = [];
    renderPage();
    expect(screen.getByText(/no products yet/i)).toBeInTheDocument();
  });

  it("renders Add Product button", () => {
    renderPage();
    expect(screen.getByText("Add Product")).toBeInTheDocument();
  });

  it("opens add product dialog when clicking Add Product", () => {
    renderPage();
    fireEvent.click(screen.getByText("Add Product"));
    expect(screen.getByText("Fill in the details for your new product.")).toBeInTheDocument();
  });

  it("shows product table columns", () => {
    renderPage();
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Category")).toBeInTheDocument();
    expect(screen.getByText("Price")).toBeInTheDocument();
    expect(screen.getByText("Stock")).toBeInTheDocument();
    expect(screen.getByText("Actions")).toBeInTheDocument();
  });

  it("renders both Products and Orders tabs", () => {
    renderPage();
    expect(screen.getByRole("tab", { name: "Products" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Orders" })).toBeInTheDocument();
    // Products tab is active by default
    expect(screen.getByRole("tab", { name: "Products" })).toHaveAttribute("data-state", "active");
  });
});
