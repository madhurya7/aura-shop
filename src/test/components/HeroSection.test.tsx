import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import HeroSection from "@/components/HeroSection";

describe("HeroSection", () => {
  it("renders heading text", () => {
    render(<HeroSection />);
    expect(screen.getByText(/Handcrafted with/)).toBeInTheDocument();
    expect(screen.getByText("Heart")).toBeInTheDocument();
    expect(screen.getByText(/& Soul/)).toBeInTheDocument();
  });

  it("renders Shop Now button", () => {
    render(<HeroSection />);
    expect(screen.getByText("Shop Now")).toBeInTheDocument();
  });

  it("renders description text", () => {
    render(<HeroSection />);
    expect(screen.getByText(/curated collection/)).toBeInTheDocument();
  });

  it("scrolls to products section on button click", () => {
    const scrollMock = vi.fn();
    const mockElement = { scrollIntoView: scrollMock };
    vi.spyOn(document, "getElementById").mockReturnValue(mockElement as any);

    render(<HeroSection />);
    fireEvent.click(screen.getByText("Shop Now"));
    expect(scrollMock).toHaveBeenCalledWith({ behavior: "smooth" });
  });

  it("renders hero banner image with alt text", () => {
    render(<HeroSection />);
    const img = screen.getByAltText("Artisan handcrafted goods collection");
    expect(img).toBeInTheDocument();
  });
});
