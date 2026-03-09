import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";

const mockUser = { id: "user-1", email: "test@test.com" };
let currentUser: typeof mockUser | null = mockUser;

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ user: currentUser, session: null, loading: false, signOut: vi.fn() }),
}));

const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockInsert = vi.fn();
const mockDelete = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: mockSelect,
      insert: mockInsert,
      delete: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }) }),
    })),
  },
}));

import { useFavorites, useFavoriteProducts, useToggleFavorite } from "@/hooks/useFavorites";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children);
}

describe("useFavorites", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentUser = mockUser;
  });

  it("fetches favorite product ids as a Set", async () => {
    mockSelect.mockReturnValue({
      eq: vi.fn().mockResolvedValue({
        data: [{ product_id: "p1" }, { product_id: "p2" }],
        error: null,
      }),
    });

    const { result } = renderHook(() => useFavorites(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeInstanceOf(Set);
    expect(result.current.data?.has("p1")).toBe(true);
    expect(result.current.data?.has("p2")).toBe(true);
  });

  it("is disabled when no user", () => {
    currentUser = null;
    const { result } = renderHook(() => useFavorites(), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });
});

describe("useFavoriteProducts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentUser = mockUser;
  });

  it("fetches full product objects", async () => {
    mockSelect.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: [
            { product_id: "p1", products: { id: "p1", name: "Widget" } },
          ],
          error: null,
        }),
      }),
    });

    const { result } = renderHook(() => useFavoriteProducts(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data![0].name).toBe("Widget");
  });

  it("filters out null products", async () => {
    mockSelect.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: [
            { product_id: "p1", products: null },
            { product_id: "p2", products: { id: "p2", name: "Gadget" } },
          ],
          error: null,
        }),
      }),
    });

    const { result } = renderHook(() => useFavoriteProducts(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
  });
});

describe("useToggleFavorite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentUser = mockUser;
  });

  it("inserts when not favorited", async () => {
    mockInsert.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useToggleFavorite(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.mutate({ productId: "p1", isFavorited: false });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("throws when no user", async () => {
    currentUser = null;

    const { result } = renderHook(() => useToggleFavorite(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.mutate({ productId: "p1", isFavorited: false });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Must be logged in");
  });
});
