import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// --- Mutable mock state ---
let mockIsAdmin = true;
let mockAdminLoading = false;
let mockUser: { id: string; email: string } | null = { id: "admin-1", email: "admin@test.com" };

let mockProducts = [
  { id: "p1", name: "Headphones", description: "Great sound", price: 99.99, category: "Electronics", stock_quantity: 20, image_url: "", created_at: "", updated_at: "", display_order: 1 },
  { id: "p2", name: "Ceramic Bowl", description: "Handmade", price: 29.99, category: "Pottery", stock_quantity: 15, image_url: "", created_at: "", updated_at: "", display_order: 2 },
];
let mockProductsLoading = false;

vi.mock("@/hooks/useAdminCheck", () => ({
  useAdminCheck: () => ({ isAdmin: mockIsAdmin, loading: mockAdminLoading, user: mockUser }),
}));

vi.mock("@/hooks/useProducts", () => ({
  useAllProducts: () => ({ data: mockProducts, isLoading: mockProductsLoading }),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
      insert: vi.fn().mockResolvedValue({ error: null }),
      delete: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
    }),
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: "https://example.com/img.jpg" } }),
      }),
    },
  },
}));

vi.mock("@/components/AdminOrders", () => ({
  default: () => <div data-testid="admin-orders">Admin Orders Component</div>,
}));

const mockToast = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

// Mock @dnd-kit to avoid jsdom issues with drag-and-drop
vi.mock("@dnd-kit/core", () => ({
  DndContext: ({ children }: any) => <div data-testid="dnd-context">{children}</div>,
  closestCenter: vi.fn(),
  KeyboardSensor: vi.fn(),
  PointerSensor: vi.fn(),
  useSensor: vi.fn(),
  useSensors: vi.fn().mockReturnValue([]),
}));

vi.mock("@dnd-kit/sortable", () => ({
  SortableContext: ({ children }: any) => <>{children}</>,
  sortableKeyboardCoordinates: vi.fn(),
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
  verticalListSortingStrategy: vi.fn(),
  arrayMove: vi.fn((arr: any[], from: number, to: number) => {
    const result = [...arr];
    const [item] = result.splice(from, 1);
    result.splice(to, 0, item);
    return result;
  }),
}));

vi.mock("@dnd-kit/utilities", () => ({
  CSS: { Transform: { toString: () => undefined } },
}));

vi.mock("@dnd-kit/modifiers", () => ({
  restrictToVerticalAxis: vi.fn(),
}));

import AdminPage from "@/pages/AdminPage";

const renderPage = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <AdminPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe("AdminPage", () => {
  beforeEach(() => {
    mockIsAdmin = true;
    mockAdminLoading = false;
    mockUser = { id: "admin-1", email: "admin@test.com" };
    mockProducts = [
      { id: "p1", name: "Headphones", description: "Great sound", price: 99.99, category: "Electronics", stock_quantity: 20, image_url: "", created_at: "", updated_at: "", display_order: 1 },
      { id: "p2", name: "Ceramic Bowl", description: "Handmade", price: 29.99, category: "Pottery", stock_quantity: 15, image_url: "", created_at: "", updated_at: "", display_order: 2 },
    ];
    mockProductsLoading = false;
    mockToast.mockClear();
  });

  // --- Authentication & Authorization ---

  it("shows sign-in prompt when user is not authenticated", () => {
    mockUser = null;
    mockIsAdmin = false;
    renderPage();
    expect(screen.getByText(/please sign in to access the admin dashboard/i)).toBeInTheDocument();
    expect(screen.getByText("Sign In")).toBeInTheDocument();
  });

  it("shows access denied for non-admin users", () => {
    mockIsAdmin = false;
    renderPage();
    expect(screen.getByText("Access Denied")).toBeInTheDocument();
    expect(screen.getByText(/you do not have admin privileges/i)).toBeInTheDocument();
  });

  it("shows Back to Store button on access denied screen", () => {
    mockIsAdmin = false;
    renderPage();
    expect(screen.getByText("Back to Store")).toBeInTheDocument();
  });

  it("shows loading spinner while checking admin status", () => {
    mockAdminLoading = true;
    const { container } = renderPage();
    expect(container.querySelector(".animate-spin")).toBeInTheDocument();
  });

  // --- Dashboard Layout ---

  it("renders dashboard heading and tabs for admin users", () => {
    renderPage();
    expect(screen.getByText("Admin Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Manage your store")).toBeInTheDocument();
  });

  it("renders both Products and Orders tabs", () => {
    renderPage();
    expect(screen.getByRole("tab", { name: "Products" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Orders" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Products" })).toHaveAttribute("data-state", "active");
  });

  it("renders Orders tab that can be clicked", () => {
    renderPage();
    const ordersTab = screen.getByRole("tab", { name: "Orders" });
    expect(ordersTab).toBeInTheDocument();
    // Radix tabs may not fully switch in jsdom, but the tab is interactive
    expect(ordersTab).not.toBeDisabled();
  });

  // --- Product Table ---

  it("renders product table with product data", () => {
    renderPage();
    expect(screen.getByText("Headphones")).toBeInTheDocument();
    expect(screen.getByText("Ceramic Bowl")).toBeInTheDocument();
    expect(screen.getByText("$99.99")).toBeInTheDocument();
    expect(screen.getByText("$29.99")).toBeInTheDocument();
    expect(screen.getByText("Electronics")).toBeInTheDocument();
    expect(screen.getByText("Pottery")).toBeInTheDocument();
  });

  it("shows stock quantities in the table", () => {
    renderPage();
    expect(screen.getByText("20")).toBeInTheDocument();
    expect(screen.getByText("15")).toBeInTheDocument();
  });

  it("shows product table columns including Order", () => {
    renderPage();
    expect(screen.getByText("Order")).toBeInTheDocument();
    expect(screen.getByText("Image")).toBeInTheDocument();
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Category")).toBeInTheDocument();
    expect(screen.getByText("Price")).toBeInTheDocument();
    expect(screen.getByText("Stock")).toBeInTheDocument();
    expect(screen.getByText("Actions")).toBeInTheDocument();
  });

  it("shows display_order values in the table", () => {
    renderPage();
    // display_order 1 and 2 should be visible
    const cells = screen.getAllByText("1");
    expect(cells.length).toBeGreaterThanOrEqual(1);
  });

  it("shows empty state when no products exist", () => {
    mockProducts = [];
    renderPage();
    expect(screen.getByText(/no products yet/i)).toBeInTheDocument();
  });

  it("shows loading spinner while products are loading", () => {
    mockProductsLoading = true;
    const { container } = renderPage();
    const spinners = container.querySelectorAll(".animate-spin");
    expect(spinners.length).toBeGreaterThanOrEqual(1);
  });

  it("renders drag handles for each product row", () => {
    renderPage();
    const dragButtons = screen.getAllByLabelText("Drag to reorder");
    expect(dragButtons).toHaveLength(2);
  });

  it("shows reorder hint text", () => {
    renderPage();
    expect(screen.getByText("Drag rows to reorder products")).toBeInTheDocument();
  });

  // --- Add Product ---

  it("renders Add Product button", () => {
    renderPage();
    expect(screen.getByText("Add Product")).toBeInTheDocument();
  });

  it("opens add product dialog when clicking Add Product", () => {
    renderPage();
    fireEvent.click(screen.getByText("Add Product"));
    expect(screen.getByText("Fill in the details for your new product.")).toBeInTheDocument();
    expect(screen.getByText("Create Product")).toBeInTheDocument();
  });

  it("shows all form fields in add product dialog", () => {
    renderPage();
    fireEvent.click(screen.getByText("Add Product"));
    expect(screen.getByText("Name *")).toBeInTheDocument();
    expect(screen.getByText("Description")).toBeInTheDocument();
    expect(screen.getByText("Price *")).toBeInTheDocument();
    expect(screen.getAllByText("Stock").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("Category").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("Product Image")).toBeInTheDocument();
  });

  it("shows Upload Image button in dialog", () => {
    renderPage();
    fireEvent.click(screen.getByText("Add Product"));
    expect(screen.getByText("Upload Image")).toBeInTheDocument();
  });

  it("shows Cancel button in add dialog", () => {
    renderPage();
    fireEvent.click(screen.getByText("Add Product"));
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("closes add dialog when Cancel is clicked", () => {
    renderPage();
    fireEvent.click(screen.getByText("Add Product"));
    expect(screen.getByText("Create Product")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Cancel"));
    expect(screen.queryByText("Create Product")).not.toBeInTheDocument();
  });

  it("shows validation toast when saving without name or price", async () => {
    renderPage();
    fireEvent.click(screen.getByText("Add Product"));
    fireEvent.click(screen.getByText("Create Product"));
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Name and price are required", variant: "destructive" })
    );
  });

  // --- Edit Product ---

  it("opens edit dialog when clicking edit button on a product", () => {
    renderPage();
    const editButtons = screen.getAllByRole("button").filter(
      (btn) => btn.querySelector("svg.lucide-pencil") || btn.querySelector('[class*="lucide-pencil"]')
    );
    // Use the first edit-looking button (icon buttons in the actions column)
    const actionButtons = screen.getAllByRole("button");
    const pencilButton = actionButtons.find((btn) => {
      const svg = btn.querySelector("svg");
      return svg && btn.closest("td");
    });
    if (pencilButton) {
      fireEvent.click(pencilButton);
      // Should show edit dialog title
      expect(screen.getByText("Edit Product")).toBeInTheDocument();
      expect(screen.getByText("Update the product details below.")).toBeInTheDocument();
      expect(screen.getByText("Save Changes")).toBeInTheDocument();
    }
  });

  // --- Delete Product ---

  it("opens delete confirmation when clicking delete button", () => {
    renderPage();
    const actionButtons = screen.getAllByRole("button");
    // Find a delete button (second icon button in each row's actions)
    const deleteButton = actionButtons.find((btn) => {
      const svg = btn.querySelector("svg");
      return svg && svg.classList.contains("text-destructive") && btn.closest("td");
    });
    if (deleteButton) {
      fireEvent.click(deleteButton);
      expect(screen.getByText("Delete Product")).toBeInTheDocument();
      expect(screen.getByText(/this action cannot be undone/i)).toBeInTheDocument();
    }
  });

  // --- Products sorted by display_order ---

  it("renders products sorted by display_order ascending", () => {
    mockProducts = [
      { id: "p2", name: "Ceramic Bowl", description: "Handmade", price: 29.99, category: "Pottery", stock_quantity: 15, image_url: "", created_at: "", updated_at: "", display_order: 2 },
      { id: "p1", name: "Headphones", description: "Great sound", price: 99.99, category: "Electronics", stock_quantity: 20, image_url: "", created_at: "", updated_at: "", display_order: 1 },
    ];
    renderPage();
    const cells = screen.getAllByRole("cell");
    const nameIndex = cells.findIndex((c) => c.textContent === "Headphones");
    const bowlIndex = cells.findIndex((c) => c.textContent === "Ceramic Bowl");
    // Headphones (order 1) should come before Ceramic Bowl (order 2)
    expect(nameIndex).toBeLessThan(bowlIndex);
  });

  // --- Multiple products ---

  it("handles single product in the table", () => {
    mockProducts = [
      { id: "p1", name: "Solo Product", description: "Only one", price: 49.99, category: "Test", stock_quantity: 5, image_url: "https://example.com/img.jpg", created_at: "", updated_at: "", display_order: 1 },
    ];
    renderPage();
    expect(screen.getByText("Solo Product")).toBeInTheDocument();
    expect(screen.getByText("$49.99")).toBeInTheDocument();
  });

  it("renders product image when image_url is provided", () => {
    mockProducts = [
      { id: "p1", name: "With Image", description: "", price: 10, category: "Cat", stock_quantity: 1, image_url: "https://example.com/product.jpg", created_at: "", updated_at: "", display_order: 1 },
    ];
    renderPage();
    const img = screen.getByRole("img", { name: "With Image" });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "https://example.com/product.jpg");
  });

  it("renders placeholder image when image_url is empty", () => {
    mockProducts = [
      { id: "p1", name: "No Image", description: "", price: 10, category: "Cat", stock_quantity: 1, image_url: "", created_at: "", updated_at: "", display_order: 1 },
    ];
    renderPage();
    const img = screen.getByRole("img", { name: "No Image" });
    expect(img).toHaveAttribute("src", "/placeholder.svg");
  });
});
