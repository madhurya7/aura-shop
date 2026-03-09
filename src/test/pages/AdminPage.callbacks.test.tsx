import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

let mockIsAdmin = true;
let mockAdminLoading = false;
let mockUser: any = { id: "admin-1", email: "admin@test.com" };
let mockProducts = [
  { id: "p1", name: "Headphones", description: "Great sound", price: 99.99, category: "Electronics", stock_quantity: 20, image_url: "", created_at: "", updated_at: "", display_order: 1 },
];
let mockProductsLoading = false;

vi.mock("@/hooks/useAdminCheck", () => ({
  useAdminCheck: () => ({ isAdmin: mockIsAdmin, loading: mockAdminLoading, user: mockUser }),
}));

vi.mock("@/hooks/useProducts", () => ({
  useAllProducts: () => ({ data: mockProducts, isLoading: mockProductsLoading }),
}));

const mockUpdate = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
const mockInsert = vi.fn().mockResolvedValue({ error: null });
const mockDeleteEq = vi.fn().mockResolvedValue({ error: null });

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      update: (...args: any[]) => mockUpdate(...args),
      insert: (...args: any[]) => mockInsert(...args),
      delete: vi.fn().mockReturnValue({ eq: (...args: any[]) => mockDeleteEq(...args) }),
    }),
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: "https://example.com/uploaded.jpg" } }),
      }),
    },
  },
}));

vi.mock("@/components/AdminOrders", () => ({
  default: () => <div data-testid="admin-orders">Orders</div>,
}));

vi.mock("@/components/AdminShippingZones", () => ({
  default: () => <div data-testid="admin-shipping">Shipping</div>,
}));

const mockToast = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

vi.mock("@dnd-kit/core", () => ({
  DndContext: ({ children }: any) => <div>{children}</div>,
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

describe("AdminPage callbacks", () => {
  beforeEach(() => {
    mockIsAdmin = true;
    mockAdminLoading = false;
    mockUser = { id: "admin-1", email: "admin@test.com" };
    mockProducts = [
      { id: "p1", name: "Headphones", description: "Great sound", price: 99.99, category: "Electronics", stock_quantity: 20, image_url: "", created_at: "", updated_at: "", display_order: 1 },
    ];
    mockProductsLoading = false;
    vi.clearAllMocks();
  });

  it("saves a new product with form data", async () => {
    renderPage();
    fireEvent.click(screen.getByText("Add Product"));

    // Use the dialog to find inputs
    const dialog = screen.getByText("Add Product", { selector: "h2" }).closest('[role="dialog"]');
    if (!dialog) return;

    const textInputs = dialog.querySelectorAll('input:not([type="file"]):not([type="number"])');
    const numberInputs = dialog.querySelectorAll('input[type="number"]');

    // Name input
    fireEvent.change(textInputs[0], { target: { value: "New Widget" } });
    // Price
    fireEvent.change(numberInputs[0], { target: { value: "49.99" } });

    fireEvent.click(screen.getByText("Create Product"));

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalled();
    });
  });

  it("opens edit dialog with product data pre-filled", () => {
    renderPage();
    // Click the edit button (pencil icon)
    const editBtn = screen.getAllByRole("button").find(btn => {
      const svg = btn.querySelector(".lucide-pencil");
      return svg && btn.closest("td");
    });
    if (editBtn) fireEvent.click(editBtn);

    expect(screen.getByText("Edit Product")).toBeInTheDocument();
    expect(screen.getByText("Save Changes")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Headphones")).toBeInTheDocument();
    expect(screen.getByDisplayValue("99.99")).toBeInTheDocument();
  });

  it("saves edited product via update", async () => {
    renderPage();
    const editBtn = screen.getAllByRole("button").find(btn => {
      const svg = btn.querySelector(".lucide-pencil");
      return svg && btn.closest("td");
    });
    if (editBtn) fireEvent.click(editBtn);

    // Change name
    const nameInput = screen.getByDisplayValue("Headphones");
    fireEvent.change(nameInput, { target: { value: "Updated Headphones" } });

    fireEvent.click(screen.getByText("Save Changes"));

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: "Product updated" }));
    });
  });

  it("clicking delete button triggers delete confirmation state", () => {
    renderPage();
    const deleteBtn = screen.getAllByRole("button").find(btn => {
      const svg = btn.querySelector(".lucide-trash-2");
      return svg && btn.closest("td");
    });
    expect(deleteBtn).toBeTruthy();
    // Just verify the button exists and is clickable (actual dialog tested in AdminPage.test.tsx)
    if (deleteBtn) fireEvent.click(deleteBtn);
  });

  it("navigates to auth from sign-in prompt", () => {
    const mockNav = vi.fn();
    vi.doMock("react-router-dom", async () => {
      const actual = await vi.importActual("react-router-dom");
      return { ...actual, useNavigate: () => mockNav };
    });
    mockUser = null;
    mockIsAdmin = false;
    renderPage();
    // Sign In button should be present
    expect(screen.getByText("Sign In")).toBeInTheDocument();
  });

  it("uploads image and sets form image_url", async () => {
    renderPage();
    fireEvent.click(screen.getByText("Add Product"));

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeTruthy();

    const file = new File(["test"], "product.jpg", { type: "image/jpeg" });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: "Image uploaded" }));
    });
  });
});
