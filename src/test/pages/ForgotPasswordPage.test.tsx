import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const mockNavigate = vi.fn();
const mockResetPasswordForEmail = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      resetPasswordForEmail: mockResetPasswordForEmail,
    },
  },
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import { toast } from "sonner";

describe("ForgotPasswordPage", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockResetPasswordForEmail.mockClear();
    vi.mocked(toast.error).mockClear();
  });

  it("renders the form", () => {
    render(<MemoryRouter><ForgotPasswordPage /></MemoryRouter>);
    expect(screen.getByText("Reset password")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();
    expect(screen.getByText("Send Reset Link")).toBeInTheDocument();
  });

  it("submits email and shows success state", async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: null });
    render(<MemoryRouter><ForgotPasswordPage /></MemoryRouter>);
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "test@test.com" } });
    fireEvent.click(screen.getByText("Send Reset Link"));
    await waitFor(() => {
      expect(screen.getByText("Check your email")).toBeInTheDocument();
    });
    expect(screen.getByText(/test@test.com/)).toBeInTheDocument();
  });

  it("shows error on failure", async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: { message: "User not found" } });
    render(<MemoryRouter><ForgotPasswordPage /></MemoryRouter>);
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "bad@test.com" } });
    fireEvent.click(screen.getByText("Send Reset Link"));
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("User not found");
    });
  });

  it("back button navigates to auth", () => {
    render(<MemoryRouter><ForgotPasswordPage /></MemoryRouter>);
    fireEvent.click(screen.getByText("Back to sign in"));
    expect(mockNavigate).toHaveBeenCalledWith("/auth");
  });
});
