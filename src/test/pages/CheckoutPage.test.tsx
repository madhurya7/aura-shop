import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import CheckoutPage from "@/pages/CheckoutPage";
import { CartProvider } from "@/context/CartContext";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "user-1", email: "test@example.com" },
    session: {},
    loading: false,
    signOut: vi.fn(),
  }),
}));

vi.mock("@/context/CurrencyContext", () => ({
  useCurrency: () => ({
    zone: { name: "North America", currency_symbol: "$", currency_code: "USD", exchange_rate: 1, standard_rate: 5, express_rate: 15, standard_days: "7-14 days", express_days: "3-5 days", free_delivery_above: 200 },
    formatPrice: (p: number) => `$${p.toFixed(2)}`,
    convertPrice: (p: number) => p,
    currencySymbol: "$",
    currencyCode: "USD",
    countryCode: "US",
    setCountryCode: vi.fn(),
  }),
}));

vi.mock("@/hooks/useAddresses", () => ({
  useAddresses: () => ({
    data: [
      {
        id: "addr-1",
        name: "John Doe",
        address_line1: "123 Main St",
        city: "New York",
        state: "NY",
        postal_code: "10001",
        country: "US",
        is_default: true,
      },
    ],
    isLoading: false,
  }),
  useAddressMutations: () => ({
    addAddress: { mutateAsync: vi.fn(), isPending: false },
  }),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    functions: { invoke: vi.fn() },
  },
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

function renderCheckout(cartItems: any[] = []) {
  localStorage.setItem("cart", JSON.stringify(cartItems));
  return render(
    <MemoryRouter>
      <CartProvider>
        <CheckoutPage />
      </CartProvider>
    </MemoryRouter>
  );
}

describe("CheckoutPage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("shows empty state when cart is empty", () => {
    renderCheckout([]);
    expect(screen.getByText("Nothing to checkout")).toBeInTheDocument();
  });

  it("renders checkout form with cart items", () => {
    renderCheckout([
      { productId: "prod-1", name: "Headphones", price: 249.99, image_url: "", category: "Audio", quantity: 1 },
    ]);
    expect(screen.getByText("Checkout")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Full Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Address")).toBeInTheDocument();
    expect(screen.getByLabelText("City")).toBeInTheDocument();
    expect(screen.getByText("Order Summary")).toBeInTheDocument();
  });

  it("shows order summary with correct total", () => {
    renderCheckout([
      { productId: "prod-1", name: "Headphones", price: 249.99, image_url: "", category: "Audio", quantity: 2 },
    ]);
    const totals = screen.getAllByText("$499.98");
    expect(totals.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Headphones × 2/)).toBeInTheDocument();
  });

  it("shows saved addresses for authenticated user", () => {
    renderCheckout([
      { productId: "prod-1", name: "Item", price: 10, image_url: "", category: "Test", quantity: 1 },
    ]);
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText(/123 Main St/)).toBeInTheDocument();
  });

  it("pre-fills email for authenticated user", () => {
    renderCheckout([
      { productId: "prod-1", name: "Item", price: 10, image_url: "", category: "Test", quantity: 1 },
    ]);
    const emailInput = screen.getByLabelText("Email") as HTMLInputElement;
    expect(emailInput.value).toBe("test@example.com");
  });

  it("shows payment button with total", () => {
    renderCheckout([
      { productId: "prod-1", name: "Item", price: 99.99, image_url: "", category: "Test", quantity: 1 },
    ]);
    expect(screen.getByText("Pay $99.99")).toBeInTheDocument();
  });

  it("shows Stripe redirect notice", () => {
    renderCheckout([
      { productId: "prod-1", name: "Item", price: 10, image_url: "", category: "Test", quantity: 1 },
    ]);
    expect(screen.getByText(/redirected to Stripe/)).toBeInTheDocument();
  });

  it("shows Save New address button", () => {
    renderCheckout([
      { productId: "prod-1", name: "Item", price: 10, image_url: "", category: "Test", quantity: 1 },
    ]);
    expect(screen.getByText("Save New")).toBeInTheDocument();
  });
});
