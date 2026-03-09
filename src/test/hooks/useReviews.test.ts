import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";

const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockRange = vi.fn();
const mockIn = vi.fn();
const mockMaybeSingle = vi.fn();
const mockInsert = vi.fn();
const mockSingle = vi.fn();
const mockRpc = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: mockSelect,
      insert: mockInsert,
    })),
    rpc: mockRpc,
  },
}));

import { useProductReviews, useProductRating, useProductRatings, useUserReviewForProduct } from "@/hooks/useReviews";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children);
}

describe("useProductReviews", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches reviews with count", async () => {
    // First call: count query
    mockSelect.mockReturnValueOnce({ eq: vi.fn().mockResolvedValue({ count: 3 }) });
    // Second call: data query
    mockSelect.mockReturnValueOnce({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          range: vi.fn().mockResolvedValue({
            data: [{ id: "r1", rating: 5, review_text: "Great" }],
            error: null,
          }),
        }),
      }),
    });

    const { result } = renderHook(() => useProductReviews("prod-1"), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.total).toBe(3);
    expect(result.current.data?.reviews).toHaveLength(1);
  });

  it("is disabled when productId is empty", () => {
    const { result } = renderHook(() => useProductReviews(""), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });
});

describe("useProductRating", () => {
  beforeEach(() => vi.clearAllMocks());

  it("fetches rating via rpc", async () => {
    mockRpc.mockResolvedValue({
      data: [{ avg_rating: 4.5, review_count: 10 }],
      error: null,
    });

    const { result } = renderHook(() => useProductRating("prod-1"), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.avg_rating).toBe(4.5);
    expect(result.current.data?.review_count).toBe(10);
  });

  it("defaults to 0 when no data", async () => {
    mockRpc.mockResolvedValue({ data: [{}], error: null });

    const { result } = renderHook(() => useProductRating("prod-1"), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.avg_rating).toBe(0);
    expect(result.current.data?.review_count).toBe(0);
  });
});

describe("useProductRatings (bulk)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("groups ratings by product", async () => {
    mockSelect.mockReturnValue({
      in: vi.fn().mockResolvedValue({
        data: [
          { product_id: "p1", rating: 5 },
          { product_id: "p1", rating: 3 },
          { product_id: "p2", rating: 4 },
        ],
        error: null,
      }),
    });

    const { result } = renderHook(() => useProductRatings(["p1", "p2"]), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.["p1"]?.avg_rating).toBe(4);
    expect(result.current.data?.["p1"]?.review_count).toBe(2);
    expect(result.current.data?.["p2"]?.avg_rating).toBe(4);
  });

  it("is disabled for empty array", () => {
    const { result } = renderHook(() => useProductRatings([]), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });
});

describe("useUserReviewForProduct", () => {
  beforeEach(() => vi.clearAllMocks());

  it("fetches user review for specific product and order", async () => {
    mockSelect.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { id: "r1", rating: 5, review_text: "Excellent" },
              error: null,
            }),
          }),
        }),
      }),
    });

    const { result } = renderHook(
      () => useUserReviewForProduct("user-1", "prod-1", "order-1"),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.rating).toBe(5);
  });

  it("is disabled when userId is undefined", () => {
    const { result } = renderHook(
      () => useUserReviewForProduct(undefined, "prod-1", "order-1"),
      { wrapper: createWrapper() }
    );
    expect(result.current.fetchStatus).toBe("idle");
  });
});
