import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";

const mockGetUser = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: (...args: any[]) => mockGetUser(...args),
    },
    from: vi.fn(() => ({ select: mockSelect })),
  },
}));

mockSelect.mockReturnValue({ eq: mockEq });
mockEq.mockReturnValue({ order: mockOrder });

import { useUserOrders } from "@/hooks/useOrders";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children);
}

describe("useUserOrders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelect.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ order: mockOrder });
  });

  it("fetches orders for authenticated user", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    mockOrder.mockResolvedValue({
      data: [
        {
          id: "order-1",
          email: "a@b.com",
          total_price: 100,
          order_status: "paid",
          created_at: "2024-01-01",
          updated_at: "2024-01-01",
          order_items: [
            { id: "item-1", product_id: "p1", quantity: 2, price_at_purchase: 50, products: { id: "p1", name: "X", image_url: "", category: "A" } },
          ],
        },
      ],
      error: null,
    });

    const { result } = renderHook(() => useUserOrders(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data![0].order_items[0].product?.name).toBe("X");
  });

  it("throws when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { result } = renderHook(() => useUserOrders(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Not authenticated");
  });

  it("maps products to product field in order items", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    mockOrder.mockResolvedValue({
      data: [
        {
          id: "o1",
          email: "t@t.com",
          total_price: 50,
          order_status: "pending",
          created_at: "2024-01-01",
          updated_at: "2024-01-01",
          order_items: [
            { id: "i1", product_id: "p1", quantity: 1, price_at_purchase: 50, products: null },
          ],
        },
      ],
      error: null,
    });

    const { result } = renderHook(() => useUserOrders(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data![0].order_items[0].product).toBeNull();
  });
});
