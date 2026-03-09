import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

let mockUser: { id: string } | null = null;
let mockAuthLoading = false;
const mockRpc = vi.fn();

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ user: mockUser, session: null, loading: mockAuthLoading, signOut: vi.fn() }),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: (...args: any[]) => mockRpc(...args),
  },
}));

import { useAdminCheck } from "@/hooks/useAdminCheck";

describe("useAdminCheck", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = null;
    mockAuthLoading = false;
  });

  it("returns isAdmin false when no user", async () => {
    const { result } = renderHook(() => useAdminCheck());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isAdmin).toBe(false);
  });

  it("returns isAdmin true when rpc confirms admin role", async () => {
    mockUser = { id: "user-1" };
    mockRpc.mockResolvedValue({ data: true, error: null });

    const { result } = renderHook(() => useAdminCheck());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isAdmin).toBe(true);
    expect(mockRpc).toHaveBeenCalledWith("has_role", { _user_id: "user-1", _role: "admin" });
  });

  it("returns isAdmin false when rpc returns false", async () => {
    mockUser = { id: "user-2" };
    mockRpc.mockResolvedValue({ data: false, error: null });

    const { result } = renderHook(() => useAdminCheck());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isAdmin).toBe(false);
  });

  it("returns isAdmin false on rpc error", async () => {
    mockUser = { id: "user-3" };
    mockRpc.mockResolvedValue({ data: null, error: { message: "fail" } });

    const { result } = renderHook(() => useAdminCheck());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isAdmin).toBe(false);
  });

  it("loading is true while auth is loading", () => {
    mockAuthLoading = true;
    const { result } = renderHook(() => useAdminCheck());
    expect(result.current.loading).toBe(true);
  });
});
