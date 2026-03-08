import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

// We need to control the mock per test
let mockUser: any = null;
let mockAuthLoading = false;
vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ user: mockUser, loading: mockAuthLoading, session: null, signOut: vi.fn() }),
}));

let mockOrders: any[] = [];
let mockOrdersLoading = false;
vi.mock("@/hooks/useOrders", () => ({
  useUserOrders: () => ({ data: mockOrders, isLoading: mockOrdersLoading }),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    functions: { invoke: vi.fn() },
    from: () => ({
      delete: () => ({ eq: () => ({ eq: () => Promise.resolve({ error: null }) }) }),
    }),
  },
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/lib/productImages", () => ({
  getProductImage: (url: string) => url || "/placeholder.svg",
}));

vi.mock("@/hooks/useReviews", () => ({
  useSubmitReview: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUserReviewForProduct: () => ({ data: null, isLoading: false }),
}));

// Import AFTER mocks
import OrdersPage from "@/pages/OrdersPage";

function renderOrders() {
  return render(
    <MemoryRouter>
      <OrdersPage />
    </MemoryRouter>
  );
}

describe("OrdersPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = null;
    mockAuthLoading = false;
    mockOrders = [];
    mockOrdersLoading = false;
  });

  it("shows sign-in prompt for unauthenticated users", () => {
    mockUser = null;
    renderOrders();
    expect(screen.getByText("Sign in to view orders")).toBeInTheDocument();
    expect(screen.getByText("Sign In")).toBeInTheDocument();
  });

  it("shows empty state when no orders", () => {
    mockUser = { id: "user-1", email: "test@example.com" };
    mockOrders = [];
    renderOrders();
    expect(screen.getByText("No orders yet")).toBeInTheDocument();
    expect(screen.getByText("Start Shopping")).toBeInTheDocument();
  });

  it("shows order history heading for authenticated user", () => {
    mockUser = { id: "user-1", email: "test@example.com" };
    mockOrders = [];
    renderOrders();
    expect(screen.getByText("Order History")).toBeInTheDocument();
  });

  it("renders orders with items", () => {
    mockUser = { id: "user-1", email: "test@example.com" };
    mockOrders = [
      {
        id: "order-abc12345-long-id",
        email: "test@example.com",
        total_price: 249.99,
        order_status: "paid",
        created_at: "2026-03-01T00:00:00Z",
        updated_at: "2026-03-01T00:00:00Z",
        stripe_payment_id: null,
        shipping_address: null,
        order_items: [
          {
            id: "item-1",
            product_id: "prod-1",
            quantity: 1,
            price_at_purchase: 249.99,
            product: { id: "prod-1", name: "Wireless Headphones", image_url: "", category: "Audio" },
          },
        ],
      },
    ];
    renderOrders();
    expect(screen.getByText("Wireless Headphones")).toBeInTheDocument();
    expect(screen.getByText("$249.99")).toBeInTheDocument();
    expect(screen.getByText("Paid")).toBeInTheDocument();
  });

  it("shows Pay Now and Cancel Order for pending orders", () => {
    mockUser = { id: "user-1", email: "test@example.com" };
    mockOrders = [
      {
        id: "order-pending-123",
        email: "test@example.com",
        total_price: 79.99,
        order_status: "pending",
        created_at: "2026-03-01T00:00:00Z",
        updated_at: "2026-03-01T00:00:00Z",
        stripe_payment_id: "cs_test",
        shipping_address: null,
        order_items: [
          {
            id: "item-1",
            product_id: "prod-3",
            quantity: 1,
            price_at_purchase: 79.99,
            product: { id: "prod-3", name: "Gaming Mouse", image_url: "", category: "Peripherals" },
          },
        ],
      },
    ];
    renderOrders();
    expect(screen.getByText("Pay Now")).toBeInTheDocument();
    expect(screen.getByText("Cancel Order")).toBeInTheDocument();
  });

  it("does NOT show Pay Now for paid orders", () => {
    mockUser = { id: "user-1", email: "test@example.com" };
    mockOrders = [
      {
        id: "order-paid-123",
        email: "test@example.com",
        total_price: 100,
        order_status: "paid",
        created_at: "2026-03-01T00:00:00Z",
        updated_at: "2026-03-01T00:00:00Z",
        stripe_payment_id: null,
        shipping_address: null,
        order_items: [
          {
            id: "item-1",
            product_id: "prod-1",
            quantity: 1,
            price_at_purchase: 100,
            product: { id: "prod-1", name: "Test", image_url: "", category: "Test" },
          },
        ],
      },
    ];
    renderOrders();
    expect(screen.queryByText("Pay Now")).not.toBeInTheDocument();
    expect(screen.queryByText("Cancel Order")).not.toBeInTheDocument();
  });

  it("shows tracking & support section", () => {
    mockUser = { id: "user-1", email: "test@example.com" };
    renderOrders();
    expect(screen.getByText("Order Tracking & Support")).toBeInTheDocument();
    expect(screen.getByText("Send Query")).toBeInTheDocument();
  });
});
