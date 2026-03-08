import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import CategoryFilter from "@/components/CategoryFilter";

describe("CategoryFilter", () => {
  const categories = ["Audio", "Peripherals", "Accessories"];
  const mockOnSelect = vi.fn();

  it("renders All button and all categories", () => {
    render(<CategoryFilter selected={null} onSelect={mockOnSelect} categories={categories} />);
    expect(screen.getByText("All")).toBeInTheDocument();
    for (const cat of categories) {
      expect(screen.getByText(cat)).toBeInTheDocument();
    }
  });

  it("calls onSelect with null when All is clicked", () => {
    render(<CategoryFilter selected="Audio" onSelect={mockOnSelect} categories={categories} />);
    fireEvent.click(screen.getByText("All"));
    expect(mockOnSelect).toHaveBeenCalledWith(null);
  });

  it("calls onSelect with category when category is clicked", () => {
    render(<CategoryFilter selected={null} onSelect={mockOnSelect} categories={categories} />);
    fireEvent.click(screen.getByText("Audio"));
    expect(mockOnSelect).toHaveBeenCalledWith("Audio");
  });

  it("renders with no categories", () => {
    render(<CategoryFilter selected={null} onSelect={mockOnSelect} categories={[]} />);
    expect(screen.getByText("All")).toBeInTheDocument();
  });
});
