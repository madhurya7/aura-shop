import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const { mockNavigate, mockUpdateUser } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockUpdateUser: vi.fn(),
}));

let authStateCallback: any;

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn((cb: any) => {
        authStateCallback = cb;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      }),
      updateUser: mockUpdateUser,
    },
  },
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

import ResetPasswordPage from "@/pages/ResetPasswordPage";
import { toast } from "sonner";

describe("ResetPasswordPage", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockUpdateUser.mockClear();
    vi.mocked(toast.error).mockClear();
    vi.mocked(toast.success).mockClear();
    Object.defineProperty(window, "location", {
      value: { ...window.location, hash: "", origin: "http://localhost" },
      writable: true,
    });
  });

  it("shows verifying message when not ready", () => {
    render(<MemoryRouter><ResetPasswordPage /></MemoryRouter>);
    expect(screen.getByText("Verifying reset link...")).toBeInTheDocument();
  });

  it("shows form when recovery hash is present", () => {
    Object.defineProperty(window, "location", {
      value: { ...window.location, hash: "#type=recovery" },
      writable: true,
    });
    render(<MemoryRouter><ResetPasswordPage /></MemoryRouter>);
    expect(screen.getByText("Set new password")).toBeInTheDocument();
  });

  it("submits new password successfully", async () => {
    Object.defineProperty(window, "location", {
      value: { ...window.location, hash: "#type=recovery" },
      writable: true,
    });
    mockUpdateUser.mockResolvedValue({ error: null });
    render(<MemoryRouter><ResetPasswordPage /></MemoryRouter>);
    fireEvent.change(screen.getByPlaceholderText("••••••••"), { target: { value: "newpass123" } });
    fireEvent.click(screen.getByText("Update Password"));
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Password updated successfully!");
    });
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  it("shows error on update failure", async () => {
    Object.defineProperty(window, "location", {
      value: { ...window.location, hash: "#type=recovery" },
      writable: true,
    });
    mockUpdateUser.mockResolvedValue({ error: { message: "Weak password" } });
    render(<MemoryRouter><ResetPasswordPage /></MemoryRouter>);
    fireEvent.change(screen.getByPlaceholderText("••••••••"), { target: { value: "123" } });
    fireEvent.click(screen.getByText("Update Password"));
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Weak password");
    });
  });
});
