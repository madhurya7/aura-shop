import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";

// Mock supabase
const mockSelect = vi.fn();
const mockOrder = vi.fn();
const mockRange = vi.fn();
const mockOr = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: mockSelect,
    })),
  },
}));

// Chain mocks
mockSelect.mockReturnValue({ order: mockOrder, eq: mockEq, or: mockOr });
mockOrder.mockReturnValue({ range: mockRange, eq: mockEq, or: mockOr });
mockRange.mockReturnValue({ or: mockOr, eq: mockEq, data: [], error: null });
mockOr.mockReturnValue({ range: mockRange, eq: mockEq, data: [], error: null });
mockEq.mockReturnValue({ order: mockOrder, range: mockRange, single: mockSingle, data: [], error: null });

import { useProducts, useAllProducts, useProduct } from "@/hooks/useProducts";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children);
}

describe("useProducts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelect.mockReturnValue({ order: mockOrder });
    mockOrder.mockReturnValue({ range: mockRange });
    mockRange.mockReturnValue(Promise.resolve({ data: [{ id: "1", name: "Test" }], error: null }));
  });

  it("returns products data", async () => {
    mockRange.mockResolvedValue({ data: [{ id: "1", name: "Product 1", price: 10 }], error: null });

    const { result } = renderHook(() => useProducts(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.pages[0].products).toHaveLength(1);
  });

  it("handles search parameter", async () => {
    mockRange.mockReturnValue({ or: mockOr });
    mockOr.mockResolvedValue({ data: [], error: null });

    const { result } = renderHook(() => useProducts("test"), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("handles category filter", async () => {
    mockRange.mockReturnValue({ eq: mockEq });
    mockEq.mockResolvedValue({ data: [], error: null });

    const { result } = renderHook(() => useProducts(undefined, "Electronics"), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("handles error", async () => {
    mockRange.mockResolvedValue({ data: null, error: { message: "fail" } });

    const { result } = renderHook(() => useProducts(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useAllProducts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelect.mockReturnValue({ order: mockOrder });
  });

  it("fetches all products", async () => {
    mockOrder.mockResolvedValue({ data: [{ id: "1" }, { id: "2" }], error: null });

    const { result } = renderHook(() => useAllProducts(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(2);
  });
});

describe("useProduct", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelect.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ single: mockSingle });
  });

  it("fetches single product by id", async () => {
    mockSingle.mockResolvedValue({ data: { id: "abc", name: "Widget" }, error: null });

    const { result } = renderHook(() => useProduct("abc"), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.name).toBe("Widget");
  });

  it("is disabled when id is empty", () => {
    const { result } = renderHook(() => useProduct(""), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });
});
