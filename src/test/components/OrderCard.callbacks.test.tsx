import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const mockMutateAsync = vi.fn();
let mockExistingReview: any = null;

vi.mock("@/hooks/useReviews", () => ({
  useSubmitReview: () => ({ mutateAsync: mockMutateAsync, isPending: false }),
  useUserReviewForProduct: () => ({ data: mockExistingReview, isLoading: false }),
}));

vi.mock("@/lib/productImages", () => ({
  getProductImage: (url: string) => url || "/placeholder.svg",
}));

const mockFunctionsInvoke = vi.fn();
const mockFrom = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (...args: any[]) => mockFrom(...args),
    functions: { invoke: (...args: any[]) => mockFunctionsInvoke(...args) },
  },
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import OrderCard from "@/components/OrderCard";
import { toast } from "sonner";
import type { Order } from "@/hooks/useOrders";

const pendingOrder: Order = {
  id: "order-12345678-abcd",
  email: "buyer@test.com",
  total_price: 79.98,
  order_status: "pending",
  shipping_address: null,
  stripe_payment_id: null,
  created_at: "2026-03-01T10:00:00Z",
  updated_at: "2026-03-01T10:00:00Z",
  order_items: [
    {
      id: "oi1", product_id: "p1", quantity: 2, price_at_purchase: 29.99,
      product: { id: "p1", name: "Handloom Scarf", image_url: "", category: "Handloom" },
    },
  ],
};

const deliveredOrder: Order = {
  ...pendingOrder,
  order_status: "delivered",
};

const renderCard = (order: Order = pendingOrder) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <OrderCard order={order} userId="u1" />
    </QueryClientProvider>
  );
};

describe("OrderCard callbacks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExistingReview = null;
    mockFrom.mockReturnValue({
      delete: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
    });
  });

  // --- Retry Payment ---
  it("calls retry-payment and opens URL on Pay Now click", async () => {
    const mockOpen = vi.fn();
    vi.stubGlobal("open", mockOpen);
    mockFunctionsInvoke.mockResolvedValue({ data: { url: "https://pay.stripe.com/test" }, error: null });

    renderCard(pendingOrder);
    fireEvent.click(screen.getByText("Pay Now"));

    await waitFor(() => {
      expect(mockFunctionsInvoke).toHaveBeenCalledWith("retry-payment", { body: { orderId: pendingOrder.id } });
    });
    expect(mockOpen).toHaveBeenCalledWith("https://pay.stripe.com/test", "_blank");
    vi.unstubAllGlobals();
  });

  it("shows error toast when retry-payment fails", async () => {
    mockFunctionsInvoke.mockResolvedValue({ data: null, error: { message: "Payment failed" } });

    renderCard(pendingOrder);
    fireEvent.click(screen.getByText("Pay Now"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Payment failed");
    });
  });

  // --- Cancel Order ---
  it("calls delete on order_items, payments, orders when confirming cancel", async () => {
    const mockDeleteEq = vi.fn().mockResolvedValue({ error: null });
    const mockDelete = vi.fn().mockReturnValue({ eq: mockDeleteEq });
    mockFrom.mockReturnValue({ delete: mockDelete });

    renderCard(pendingOrder);
    fireEvent.click(screen.getByText("Cancel Order"));

    // Confirm in the alert dialog
    await waitFor(() => {
      expect(screen.getByText("Yes, Cancel Order")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("Yes, Cancel Order"));

    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith("order_items");
      expect(mockFrom).toHaveBeenCalledWith("payments");
      expect(mockFrom).toHaveBeenCalledWith("orders");
      expect(toast.success).toHaveBeenCalledWith("Order cancelled and removed");
    });
  });

  it("shows error toast when cancel fails", async () => {
    const mockDeleteEq = vi.fn()
      .mockResolvedValueOnce({ error: null })
      .mockResolvedValueOnce({ error: null })
      .mockResolvedValueOnce({ error: { message: "DB error" } });
    mockFrom.mockReturnValue({ delete: vi.fn().mockReturnValue({ eq: mockDeleteEq }) });

    renderCard(pendingOrder);
    fireEvent.click(screen.getByText("Cancel Order"));
    await waitFor(() => screen.getByText("Yes, Cancel Order"));
    fireEvent.click(screen.getByText("Yes, Cancel Order"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("DB error");
    });
  });

  // --- Review ---
  it("opens review dialog and submits a review", async () => {
    mockMutateAsync.mockResolvedValue({});
    renderCard(deliveredOrder);

    fireEvent.click(screen.getByText("Rate"));
    await waitFor(() => {
      expect(screen.getByText("Rate & Review")).toBeInTheDocument();
    });

    // Click 4th star for rating
    const stars = screen.getAllByRole("button").filter(b => b.getAttribute("aria-label")?.includes("Rate"));
    // Submit without rating first
    fireEvent.click(screen.getByText("Submit Review"));
    expect(toast.error).toHaveBeenCalledWith("Please select a rating");
  });

  it("shows existing review if already reviewed", () => {
    mockExistingReview = { rating: 4, review_text: "Great product" };
    renderCard(deliveredOrder);
    expect(screen.getByText("Reviewed (4/5)")).toBeInTheDocument();
  });
});
