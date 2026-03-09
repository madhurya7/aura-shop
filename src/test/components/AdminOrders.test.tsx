import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Must use vi.hoisted for variables referenced in vi.mock factories
const { mockOrders, mockToast } = vi.hoisted(() => ({
  mockOrders: [
    {
      id: "order-abc12345",
      email: "buyer@test.com",
      total_price: 149.99,
      order_status: "pending" as const,
      created_at: "2026-03-01T10:00:00Z",
      shipping_address: null,
      order_items: [
        { id: "oi1", quantity: 2, price_at_purchase: 49.99, product_id: "p1", products: { name: "Headphones" } },
        { id: "oi2", quantity: 1, price_at_purchase: 50.01, product_id: "p2", products: { name: "Keyboard" } },
      ],
    },
  ],
  mockToast: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: mockOrders, error: null }),
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    }),
  },
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

import AdminOrders from "@/components/AdminOrders";

const renderComponent = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <AdminOrders />
    </QueryClientProvider>
  );
};

describe("AdminOrders", () => {
  beforeEach(() => {
    mockToast.mockClear();
  });

  it("renders order table headers", async () => {
    renderComponent();
    expect(await screen.findByText("Order ID")).toBeInTheDocument();
    expect(screen.getByText("Customer")).toBeInTheDocument();
    expect(screen.getByText("Items")).toBeInTheDocument();
    expect(screen.getByText("Total")).toBeInTheDocument();
    expect(screen.getByText("Date")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
  });

  it("renders order data when loaded", async () => {
    renderComponent();
    expect(await screen.findByText("buyer@test.com")).toBeInTheDocument();
    expect(screen.getByText("$149.99")).toBeInTheDocument();
  });

  it("shows order items with product names", async () => {
    renderComponent();
    expect(await screen.findByText("Headphones × 2")).toBeInTheDocument();
    expect(screen.getByText("Keyboard × 1")).toBeInTheDocument();
  });

  it("shows Pending badge for pending orders", async () => {
    renderComponent();
    expect(await screen.findByText("Pending")).toBeInTheDocument();
  });
});
