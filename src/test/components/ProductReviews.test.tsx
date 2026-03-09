import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

let mockData: any = null;
let mockLoading = false;

vi.mock("@/hooks/useReviews", () => ({
  useProductReviews: () => ({ data: mockData, isLoading: mockLoading }),
}));

import ProductReviews from "@/components/ProductReviews";

const mockReviews = [
  { id: "r1", rating: 5, review_text: "Excellent product!", created_at: "2026-02-15T10:00:00Z" },
  { id: "r2", rating: 3, review_text: "", created_at: "2026-02-10T10:00:00Z" },
  { id: "r3", rating: 4, review_text: "Good quality", created_at: "2026-01-20T10:00:00Z" },
];

describe("ProductReviews", () => {
  beforeEach(() => {
    mockData = null;
    mockLoading = false;
  });

  it("renders nothing when no reviews exist", () => {
    mockData = { reviews: [], total: 0 };
    const { container } = render(<ProductReviews productId="p1" />);
    expect(container.innerHTML).toBe("");
  });

  it("renders nothing when data is null", () => {
    mockData = null;
    const { container } = render(<ProductReviews productId="p1" />);
    expect(container.innerHTML).toBe("");
  });

  it("shows loading skeletons when loading", () => {
    mockLoading = true;
    const { container } = render(<ProductReviews productId="p1" />);
    const skeletons = container.querySelectorAll('[class*="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders review count heading", () => {
    mockData = { reviews: mockReviews, total: 3 };
    render(<ProductReviews productId="p1" />);
    expect(screen.getByText("Customer Reviews (3)")).toBeInTheDocument();
  });

  it("renders review text content", () => {
    mockData = { reviews: mockReviews, total: 3 };
    render(<ProductReviews productId="p1" />);
    expect(screen.getByText("Excellent product!")).toBeInTheDocument();
    expect(screen.getByText("Good quality")).toBeInTheDocument();
  });

  it("renders Verified Buyer labels", () => {
    mockData = { reviews: mockReviews, total: 3 };
    render(<ProductReviews productId="p1" />);
    const buyers = screen.getAllByText("Verified Buyer");
    expect(buyers).toHaveLength(3);
  });

  it("renders review dates", () => {
    mockData = { reviews: mockReviews, total: 3 };
    render(<ProductReviews productId="p1" />);
    expect(screen.getByText("2/15/2026")).toBeInTheDocument();
  });

  it("does not render review text when empty", () => {
    mockData = { reviews: [mockReviews[1]], total: 1 };
    render(<ProductReviews productId="p1" />);
    // r2 has empty review_text, so no <p> with review content
    expect(screen.queryByText("Excellent product!")).not.toBeInTheDocument();
  });

  it("shows Show More button when total exceeds visible count", () => {
    mockData = { reviews: mockReviews, total: 8 };
    render(<ProductReviews productId="p1" />);
    expect(screen.getByText("Show More Reviews (3 remaining)")).toBeInTheDocument();
  });

  it("does not show Show More when all reviews are visible", () => {
    mockData = { reviews: mockReviews, total: 3 };
    render(<ProductReviews productId="p1" />);
    expect(screen.queryByText(/Show More/)).not.toBeInTheDocument();
  });

  it("updates remaining count on Show More click", () => {
    mockData = { reviews: mockReviews, total: 12 };
    render(<ProductReviews productId="p1" />);
    expect(screen.getByText("Show More Reviews (7 remaining)")).toBeInTheDocument();
    fireEvent.click(screen.getByText(/Show More/));
    // After click, visibleCount goes from 5 to 10, so 12-10 = 2 remaining
    expect(screen.getByText("Show More Reviews (2 remaining)")).toBeInTheDocument();
  });
});
