import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AdminShippingZones from "@/components/AdminShippingZones";

const mockZones = [
  {
    id: "z1",
    name: "North America",
    countries: ["US", "CA"],
    currency_code: "USD",
    currency_symbol: "$",
    exchange_rate: 1,
    standard_rate: 5,
    express_rate: 15,
    standard_days: "7-14 days",
    express_days: "3-5 days",
    free_delivery_above: 200,
    created_at: "2025-01-01",
    updated_at: "2025-01-01",
  },
  {
    id: "z2",
    name: "India",
    countries: ["IN"],
    currency_code: "INR",
    currency_symbol: "₹",
    exchange_rate: 85,
    standard_rate: 200,
    express_rate: 500,
    standard_days: "5-7 days",
    express_days: "2-3 days",
    free_delivery_above: 0,
    created_at: "2025-01-01",
    updated_at: "2025-01-01",
  },
];

const mockAddZone = { mutateAsync: vi.fn(), isPending: false };
const mockUpdateZone = { mutateAsync: vi.fn(), isPending: false };
const mockDeleteZone = { mutateAsync: vi.fn(), isPending: false };

vi.mock("@/hooks/useShippingZones", () => ({
  useShippingZones: () => ({ data: mockZones, isLoading: false }),
  useShippingZoneMutations: () => ({
    addZone: mockAddZone,
    updateZone: mockUpdateZone,
    deleteZone: mockDeleteZone,
  }),
}));

vi.mock("@/lib/countries", () => ({
  getCountryName: (code: string) => code === "US" ? "United States" : code === "CA" ? "Canada" : code === "IN" ? "India" : code,
  countries: [],
}));

function renderComponent() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <AdminShippingZones />
    </QueryClientProvider>
  );
}

describe("AdminShippingZones", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders zone table with correct data", () => {
    renderComponent();
    expect(screen.getByText("North America")).toBeInTheDocument();
    expect(screen.getAllByText("India").length).toBeGreaterThanOrEqual(1);
  });

  it("shows Free Above column with dollar values", () => {
    renderComponent();
    expect(screen.getByText("$200")).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument(); // India has 0
  });

  it("shows exchange rate column", () => {
    renderComponent();
    expect(screen.getByText("1x")).toBeInTheDocument();
    expect(screen.getByText("85x")).toBeInTheDocument();
  });

  it("shows country names", () => {
    renderComponent();
    expect(screen.getByText(/United States/)).toBeInTheDocument();
    expect(screen.getByText(/India/)).toBeInTheDocument();
  });

  it("opens add zone dialog", () => {
    renderComponent();
    fireEvent.click(screen.getByText("Add Zone"));
    expect(screen.getByText("Add Shipping Zone")).toBeInTheDocument();
    expect(screen.getByText("Zone Name *")).toBeInTheDocument();
    expect(screen.getByText(/Free Delivery Above/)).toBeInTheDocument();
  });

  it("opens edit dialog with pre-filled data", () => {
    renderComponent();
    const editButtons = screen.getAllByRole("button", { name: "" });
    // Find pencil button (first icon button in first row)
    const pencilButtons = editButtons.filter((btn) => btn.querySelector(".lucide-pencil"));
    fireEvent.click(pencilButtons[0]);
    expect(screen.getByText("Edit Shipping Zone")).toBeInTheDocument();
    expect(screen.getByDisplayValue("North America")).toBeInTheDocument();
    expect(screen.getByDisplayValue("200")).toBeInTheDocument();
  });

  it("opens delete confirmation dialog", () => {
    renderComponent();
    const deleteButtons = screen.getAllByRole("button").filter((btn) => btn.querySelector(".lucide-trash-2"));
    fireEvent.click(deleteButtons[0]);
    expect(screen.getByText("Delete Shipping Zone")).toBeInTheDocument();
    expect(screen.getByText(/North America/)).toBeInTheDocument();
  });

  it("shows Add Zone button", () => {
    renderComponent();
    expect(screen.getByText("Add Zone")).toBeInTheDocument();
  });

  it("shows currency badges", () => {
    renderComponent();
    expect(screen.getByText("$ USD")).toBeInTheDocument();
    expect(screen.getByText("₹ INR")).toBeInTheDocument();
  });
});
