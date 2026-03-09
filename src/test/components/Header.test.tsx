import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const mockNavigate = vi.fn();
const mockSignOut = vi.fn();
let mockUser: any = { id: "u1", email: "test@test.com", user_metadata: { first_name: "John", last_name: "Doe" } };
let mockIsAdmin = false;

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("@/context/CartContext", () => ({
  useCart: () => ({ totalItems: 3 }),
}));

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ user: mockUser, signOut: mockSignOut, loading: false }),
}));

vi.mock("@/context/CurrencyContext", () => ({
  useCurrency: () => ({
    countryCode: "US",
    setCountryCode: vi.fn(),
    currencySymbol: "$",
    currencyCode: "USD",
    formatPrice: (p: number) => `$${p.toFixed(2)}`,
    convertPrice: (p: number) => p,
    zone: null,
    zones: [],
    isLoading: false,
  }),
}));

vi.mock("@/hooks/useAdminCheck", () => ({
  useAdminCheck: () => ({ isAdmin: mockIsAdmin }),
}));

vi.mock("@/lib/countries", () => ({
  countries: [
    { code: "US", name: "United States" },
    { code: "IN", name: "India" },
  ],
}));

import Header from "@/components/Header";

const renderHeader = () =>
  render(
    <MemoryRouter>
      <Header />
    </MemoryRouter>
  );

describe("Header", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockSignOut.mockClear();
    mockUser = { id: "u1", email: "test@test.com", user_metadata: { first_name: "John", last_name: "Doe" } };
    mockIsAdmin = false;
  });

  it("renders brand name", () => {
    renderHeader();
    expect(screen.getByText("ARTISAN")).toBeInTheDocument();
  });

  it("shows cart badge with item count", () => {
    renderHeader();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("shows currency info", () => {
    renderHeader();
    expect(screen.getByText("$USD")).toBeInTheDocument();
  });

  it("shows user dropdown with name when logged in", () => {
    renderHeader();
    // Click user icon to open dropdown
    const userButtons = screen.getAllByRole("button");
    const userBtn = userButtons.find(b => b.querySelector(".lucide-user"));
    if (userBtn) fireEvent.click(userBtn);
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  it("shows admin dashboard link for admin users", () => {
    mockIsAdmin = true;
    renderHeader();
    const userBtn = screen.getAllByRole("button").find(b => b.querySelector(".lucide-user"));
    if (userBtn) fireEvent.click(userBtn);
    expect(screen.getByText("Admin Dashboard")).toBeInTheDocument();
  });

  it("does not show admin link for non-admin users", () => {
    mockIsAdmin = false;
    renderHeader();
    const userBtn = screen.getAllByRole("button").find(b => b.querySelector(".lucide-user"));
    if (userBtn) fireEvent.click(userBtn);
    expect(screen.queryByText("Admin Dashboard")).not.toBeInTheDocument();
  });

  it("shows login link when not authenticated", () => {
    mockUser = null;
    renderHeader();
    const authLink = screen.getByRole("link", { name: "" });
    // Should have a link to /auth
    const links = document.querySelectorAll('a[href="/auth"]');
    expect(links.length).toBeGreaterThan(0);
  });

  it("shows favorites link when logged in", () => {
    renderHeader();
    const favLinks = document.querySelectorAll('a[href="/favorites"]');
    expect(favLinks.length).toBeGreaterThan(0);
  });

  it("submits search form and navigates", () => {
    renderHeader();
    const input = screen.getByPlaceholderText("Search products...");
    fireEvent.change(input, { target: { value: "scarf" } });
    fireEvent.submit(input.closest("form")!);
    expect(mockNavigate).toHaveBeenCalledWith("/?search=scarf");
  });

  it("does not navigate on empty search", () => {
    renderHeader();
    const input = screen.getByPlaceholderText("Search products...");
    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.submit(input.closest("form")!);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("shows email when user has no first name", () => {
    mockUser = { id: "u1", email: "test@test.com", user_metadata: {} };
    renderHeader();
    const userBtn = screen.getAllByRole("button").find(b => b.querySelector(".lucide-user"));
    if (userBtn) fireEvent.click(userBtn);
    expect(screen.getByText("test@test.com")).toBeInTheDocument();
  });

  it("sign out calls signOut and navigates home", () => {
    renderHeader();
    const userBtn = screen.getAllByRole("button").find(b => b.querySelector(".lucide-user"));
    if (userBtn) fireEvent.click(userBtn);
    fireEvent.click(screen.getByText("Sign out"));
    expect(mockSignOut).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });
});
