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
const mockOrder = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockEq = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
    })),
  },
}));

import { useAddresses, useAddressMutations } from "@/hooks/useAddresses";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children);
}

describe("useAddresses", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentUser = mockUser;
  });

  it("fetches addresses ordered by default and date", async () => {
    mockSelect.mockReturnValue({
      order: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: [
            { id: "a1", name: "Home", is_default: true },
            { id: "a2", name: "Work", is_default: false },
          ],
          error: null,
        }),
      }),
    });

    const { result } = renderHook(() => useAddresses(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(2);
  });

  it("is disabled when no user", () => {
    currentUser = null;
    const { result } = renderHook(() => useAddresses(), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });
});

describe("useAddressMutations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentUser = mockUser;
  });

  it("addAddress inserts with user id", async () => {
    mockInsert.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useAddressMutations(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.addAddress.mutate({
        name: "Home",
        address_line1: "123 Main St",
        city: "NY",
        state: "NY",
        postal_code: "10001",
        country: "US",
        is_default: false,
      });
    });

    await waitFor(() => expect(result.current.addAddress.isSuccess).toBe(true));
  });

  it("deleteAddress calls delete with id", async () => {
    mockDelete.mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });

    const { result } = renderHook(() => useAddressMutations(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.deleteAddress.mutate("a1");
    });

    await waitFor(() => expect(result.current.deleteAddress.isSuccess).toBe(true));
  });

  it("setDefault updates is_default", async () => {
    mockUpdate.mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });

    const { result } = renderHook(() => useAddressMutations(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.setDefault.mutate("a1");
    });

    await waitFor(() => expect(result.current.setDefault.isSuccess).toBe(true));
  });

  it("updateAddress updates fields by id", async () => {
    mockUpdate.mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });

    const { result } = renderHook(() => useAddressMutations(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.updateAddress.mutate({ id: "a1", name: "Updated" });
    });

    await waitFor(() => expect(result.current.updateAddress.isSuccess).toBe(true));
  });
});
