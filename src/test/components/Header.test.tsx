import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
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

  it("shows user dropdown with name when logged in", async () => {
    renderHeader();
    const userBtn = screen.getAllByRole("button").find(b => b.querySelector(".lucide-user"));
    if (userBtn) fireEvent.click(userBtn);
    await waitFor(() => {
      const menuItems = document.querySelectorAll('[role="menuitem"]');
      const nameItem = Array.from(menuItems).find(el => el.textContent?.includes("John Doe"));
      expect(nameItem).toBeTruthy();
    });
  });

  it("shows admin dashboard link for admin users", async () => {
    mockIsAdmin = true;
    renderHeader();
    const userBtn = screen.getAllByRole("button").find(b => b.querySelector(".lucide-user"));
    if (userBtn) fireEvent.click(userBtn);
    await waitFor(() => {
      const menuItems = document.querySelectorAll('[role="menuitem"]');
      const adminItem = Array.from(menuItems).find(el => el.textContent?.includes("Admin Dashboard"));
      expect(adminItem).toBeTruthy();
    });
  });

  it("does not show admin link for non-admin users", async () => {
    mockIsAdmin = false;
    renderHeader();
    const userBtn = screen.getAllByRole("button").find(b => b.querySelector(".lucide-user"));
    if (userBtn) fireEvent.click(userBtn);
    await waitFor(() => {
      const menuItems = document.querySelectorAll('[role="menuitem"]');
      const adminItem = Array.from(menuItems).find(el => el.textContent?.includes("Admin Dashboard"));
      expect(adminItem).toBeFalsy();
    });
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

  it("shows email when user has no first name", async () => {
    mockUser = { id: "u1", email: "test@test.com", user_metadata: {} };
    renderHeader();
    const userBtn = screen.getAllByRole("button").find(b => b.querySelector(".lucide-user"));
    if (userBtn) fireEvent.click(userBtn);
    await waitFor(() => {
      const menuItems = document.querySelectorAll('[role="menuitem"]');
      const emailItem = Array.from(menuItems).find(el => el.textContent?.includes("test@test.com"));
      expect(emailItem).toBeTruthy();
    });
  });

  it("sign out calls signOut and navigates home", async () => {
    renderHeader();
    const userBtn = screen.getAllByRole("button").find(b => b.querySelector(".lucide-user"));
    if (userBtn) fireEvent.click(userBtn);
    await waitFor(() => {
      const menuItems = document.querySelectorAll('[role="menuitem"]');
      const signOutItem = Array.from(menuItems).find(el => el.textContent?.includes("Sign out"));
      expect(signOutItem).toBeTruthy();
      if (signOutItem) fireEvent.click(signOutItem);
    });
    expect(mockSignOut).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });
});
