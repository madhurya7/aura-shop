import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { ReactNode } from "react";

const mockUnsubscribe = vi.fn();
let authStateCallback: any;
const mockGetSession = vi.fn();
const mockSignOut = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn((cb) => {
        authStateCallback = cb;
        return { data: { subscription: { unsubscribe: mockUnsubscribe } } };
      }),
      getSession: mockGetSession,
      signOut: mockSignOut,
    },
  },
}));

import { AuthProvider, useAuth } from "@/context/AuthContext";

const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe("AuthContext", () => {
  beforeEach(() => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    mockSignOut.mockResolvedValue({});
    mockUnsubscribe.mockClear();
  });

  it("provides null user initially", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBeNull();
    expect(result.current.session).toBeNull();
  });

  it("updates user on auth state change", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    const fakeSession = { user: { id: "u1", email: "a@b.com" } };
    act(() => {
      authStateCallback("SIGNED_IN", fakeSession);
    });
    expect(result.current.user).toEqual(fakeSession.user);
    expect(result.current.session).toEqual(fakeSession);
  });

  it("calls signOut on supabase", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.signOut();
    });
    expect(mockSignOut).toHaveBeenCalled();
  });

  it("throws when used outside provider", () => {
    expect(() => renderHook(() => useAuth())).toThrow("useAuth must be used within AuthProvider");
  });

  it("loads session from getSession", async () => {
    const fakeSession = { user: { id: "u2", email: "b@c.com" } };
    mockGetSession.mockResolvedValue({ data: { session: fakeSession } });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toEqual(fakeSession.user);
  });
});
