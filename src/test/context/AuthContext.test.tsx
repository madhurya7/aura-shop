import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { ReactNode } from "react";

const { mockUnsubscribe, mockGetSession, mockSignOut } = vi.hoisted(() => ({
  mockUnsubscribe: vi.fn(),
  mockGetSession: vi.fn(),
  mockSignOut: vi.fn(),
}));

let authStateCallback: any;

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn((cb: any) => {
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
  });

  it("updates user on auth state change", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    const fakeSession = { user: { id: "u1", email: "a@b.com" } };
    act(() => {
      authStateCallback("SIGNED_IN", fakeSession);
    });
    expect(result.current.user).toEqual(fakeSession.user);
  });

  it("calls signOut", async () => {
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
