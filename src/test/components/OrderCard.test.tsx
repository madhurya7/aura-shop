import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("@/hooks/useReviews", () => ({
  useSubmitReview: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUserReviewForProduct: () => ({ data: null, isLoading: false }),
}));

vi.mock("@/lib/productImages", () => ({
  getProductImage: (url: string) => url || "/placeholder.svg",
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      delete: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
    }),
    functions: { invoke: vi.fn().mockResolvedValue({ data: { url: "https://pay.test" }, error: null }) },
  },
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import OrderCard from "@/components/OrderCard";
import type { Order } from "@/hooks/useOrders";

const baseOrder: Order = {
  id: "order-12345678-abcd",
  email: "buyer@test.com",
  total_price: 79.98,
  order_status: "paid",
  shipping_address: null,
  stripe_payment_id: "pi_123",
  created_at: "2026-03-01T10:00:00Z",
  updated_at: "2026-03-01T10:00:00Z",
  order_items: [
    {
      id: "oi1", product_id: "p1", quantity: 2, price_at_purchase: 29.99,
      product: { id: "p1", name: "Handloom Scarf", image_url: "", category: "Handloom" },
    },
    {
      id: "oi2", product_id: "p2", quantity: 1, price_at_purchase: 20.00,
      product: { id: "p2", name: "Ceramic Bowl", image_url: "", category: "Pottery" },
    },
  ],
};

const renderCard = (order: Order = baseOrder) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <OrderCard order={order} userId="u1" />
    </QueryClientProvider>
  );
};

describe("OrderCard", () => {
  it("renders order ID prefix", () => {
    renderCard();
    expect(screen.getByText("Order #order-12")).toBeInTheDocument();
  });

  it("renders order total", () => {
    renderCard();
    expect(screen.getByText("$79.98")).toBeInTheDocument();
  });

  it("renders order status badge", () => {
    renderCard();
    expect(screen.getByText("Paid")).toBeInTheDocument();
  });

  it("renders order items with product names", () => {
    renderCard();
    expect(screen.getByText("Handloom Scarf")).toBeInTheDocument();
    expect(screen.getByText("Ceramic Bowl")).toBeInTheDocument();
  });

  it("renders item quantities and prices", () => {
    renderCard();
    expect(screen.getByText("Qty: 2 × $29.99")).toBeInTheDocument();
    expect(screen.getByText("Qty: 1 × $20.00")).toBeInTheDocument();
  });

  it("shows Pay Now and Cancel Order for pending orders", () => {
    renderCard({ ...baseOrder, order_status: "pending" });
    expect(screen.getByText("Pay Now")).toBeInTheDocument();
    expect(screen.getByText("Cancel Order")).toBeInTheDocument();
  });

  it("does not show Pay Now for non-pending orders", () => {
    renderCard({ ...baseOrder, order_status: "delivered" });
    expect(screen.queryByText("Pay Now")).not.toBeInTheDocument();
    expect(screen.queryByText("Cancel Order")).not.toBeInTheDocument();
  });

  it("shows Rate button for delivered order items", () => {
    renderCard({ ...baseOrder, order_status: "delivered" });
    const rateButtons = screen.getAllByText("Rate");
    expect(rateButtons.length).toBe(2);
  });

  it("does not show Rate button for non-delivered orders", () => {
    renderCard({ ...baseOrder, order_status: "paid" });
    expect(screen.queryByText("Rate")).not.toBeInTheDocument();
  });

  it("renders order date", () => {
    renderCard();
    expect(screen.getByText("3/1/2026")).toBeInTheDocument();
  });

  it("shows Unknown Product when product data is missing", () => {
    const order = {
      ...baseOrder,
      order_items: [{ id: "oi1", product_id: "p1", quantity: 1, price_at_purchase: 10 }],
    };
    renderCard(order);
    expect(screen.getByText("Unknown Product")).toBeInTheDocument();
  });
});
