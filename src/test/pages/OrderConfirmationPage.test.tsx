import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const mockClearCart = vi.fn();

vi.mock("@/context/CartContext", () => ({
  useCart: () => ({ clearCart: mockClearCart }),
}));

import OrderConfirmationPage from "@/pages/OrderConfirmationPage";

describe("OrderConfirmationPage", () => {
  beforeEach(() => {
    mockClearCart.mockClear();
  });

  it("renders confirmation message", () => {
    render(
      <MemoryRouter initialEntries={["/order-confirmation?session_id=abc"]}>
        <OrderConfirmationPage />
      </MemoryRouter>
    );
    expect(screen.getByText("Order Confirmed!")).toBeInTheDocument();
    expect(screen.getByText(/Thank you for your purchase/)).toBeInTheDocument();
  });

  it("clears cart when session_id is present", () => {
    render(
      <MemoryRouter initialEntries={["/order-confirmation?session_id=abc"]}>
        <OrderConfirmationPage />
      </MemoryRouter>
    );
    expect(mockClearCart).toHaveBeenCalled();
  });

  it("does not clear cart when session_id is absent", () => {
    render(
      <MemoryRouter initialEntries={["/order-confirmation"]}>
        <OrderConfirmationPage />
      </MemoryRouter>
    );
    expect(mockClearCart).not.toHaveBeenCalled();
  });

  it("has continue shopping link", () => {
    render(
      <MemoryRouter initialEntries={["/order-confirmation"]}>
        <OrderConfirmationPage />
      </MemoryRouter>
    );
    expect(screen.getByText("Continue Shopping")).toBeInTheDocument();
  });
});
