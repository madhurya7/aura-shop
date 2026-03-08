import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AuthPage from "@/pages/AuthPage";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockSignInWithPassword = vi.fn();
const mockSignUp = vi.fn();
const mockSignInWithOAuth = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      signInWithPassword: (...args: any[]) => mockSignInWithPassword(...args),
      signUp: (...args: any[]) => mockSignUp(...args),
    },
  },
}));

vi.mock("@/integrations/lovable/index", () => ({
  lovable: {
    auth: {
      signInWithOAuth: (...args: any[]) => mockSignInWithOAuth(...args),
    },
  },
}));

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ user: null, session: null, loading: false, signOut: vi.fn() }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

function renderAuth() {
  return render(
    <MemoryRouter>
      <AuthPage />
    </MemoryRouter>
  );
}

describe("AuthPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders login form by default", () => {
    renderAuth();
    expect(screen.getByText("Welcome back")).toBeInTheDocument();
    expect(screen.getByText("Sign in to your account")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByText("Sign In")).toBeInTheDocument();
  });

  it("switches to signup form", () => {
    renderAuth();
    fireEvent.click(screen.getByText("Sign up"));
    expect(screen.getByText("Create account")).toBeInTheDocument();
    expect(screen.getByLabelText("First Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Last Name")).toBeInTheDocument();
    expect(screen.getByText("Create Account")).toBeInTheDocument();
  });

  it("switches back to login", () => {
    renderAuth();
    fireEvent.click(screen.getByText("Sign up"));
    fireEvent.click(screen.getByText("Sign in"));
    expect(screen.getByText("Welcome back")).toBeInTheDocument();
  });

  it("shows Google sign-in button", () => {
    renderAuth();
    expect(screen.getByText("Continue with Google")).toBeInTheDocument();
  });

  it("shows forgot password link on login", () => {
    renderAuth();
    expect(screen.getByText("Forgot password?")).toBeInTheDocument();
  });

  it("shows back to shop button", () => {
    renderAuth();
    expect(screen.getByText("Back to shop")).toBeInTheDocument();
  });

  it("calls signInWithPassword on login submit", async () => {
    mockSignInWithPassword.mockResolvedValue({ error: null });
    renderAuth();

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByText("Sign In"));

    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
    });
  });

  it("calls signUp with user metadata on signup submit", async () => {
    mockSignUp.mockResolvedValue({ error: null });
    renderAuth();

    fireEvent.click(screen.getByText("Sign up"));

    fireEvent.change(screen.getByLabelText("First Name"), {
      target: { value: "John" },
    });
    fireEvent.change(screen.getByLabelText("Last Name"), {
      target: { value: "Doe" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "john@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "pass123" },
    });
    fireEvent.click(screen.getByText("Create Account"));

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "john@example.com",
          password: "pass123",
          options: expect.objectContaining({
            data: { first_name: "John", last_name: "Doe" },
          }),
        })
      );
    });
  });

  it("calls Google OAuth on button click", () => {
    mockSignInWithOAuth.mockResolvedValue({ error: null });
    renderAuth();
    fireEvent.click(screen.getByText("Continue with Google"));
    expect(mockSignInWithOAuth).toHaveBeenCalledWith("google", expect.any(Object));
  });
});
