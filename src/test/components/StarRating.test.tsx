import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import StarRating from "@/components/StarRating";

describe("StarRating", () => {
  it("renders 5 stars by default", () => {
    const { container } = render(<StarRating rating={3} />);
    const stars = container.querySelectorAll("svg");
    expect(stars).toHaveLength(5);
  });

  it("renders custom number of stars", () => {
    const { container } = render(<StarRating rating={3} maxStars={10} />);
    const stars = container.querySelectorAll("svg");
    expect(stars).toHaveLength(10);
  });

  it("fills correct number of stars", () => {
    const { container } = render(<StarRating rating={3} />);
    const filledStars = container.querySelectorAll(".fill-amber-400");
    expect(filledStars).toHaveLength(3);
  });

  it("shows rating value when showValue is true", () => {
    render(<StarRating rating={4.5} showValue />);
    expect(screen.getByText("4.5")).toBeInTheDocument();
  });

  it("shows review count when provided", () => {
    render(<StarRating rating={4.5} showValue reviewCount={42} />);
    expect(screen.getByText("4.5 (42)")).toBeInTheDocument();
  });

  it("does not show value when rating is 0", () => {
    const { container } = render(<StarRating rating={0} showValue />);
    expect(container.querySelector("span")).toBeNull();
  });

  it("calls onRate when interactive and clicked", () => {
    const onRate = vi.fn();
    const { container } = render(<StarRating rating={0} interactive onRate={onRate} />);
    const stars = container.querySelectorAll("svg");
    fireEvent.click(stars[2]); // Click 3rd star
    expect(onRate).toHaveBeenCalledWith(3);
  });

  it("does not call onRate when not interactive", () => {
    const onRate = vi.fn();
    const { container } = render(<StarRating rating={0} onRate={onRate} />);
    const stars = container.querySelectorAll("svg");
    fireEvent.click(stars[2]);
    expect(onRate).not.toHaveBeenCalled();
  });

  it("applies size classes correctly", () => {
    const { container: sm } = render(<StarRating rating={1} size="sm" />);
    expect(sm.querySelector(".h-3\\.5")).toBeTruthy();

    const { container: lg } = render(<StarRating rating={1} size="lg" />);
    expect(lg.querySelector(".h-5")).toBeTruthy();
  });
});
