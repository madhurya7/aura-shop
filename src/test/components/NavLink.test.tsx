import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { NavLink } from "@/components/NavLink";

describe("NavLink", () => {
  it("renders a link with correct text and href", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <NavLink to="/about">About</NavLink>
      </MemoryRouter>
    );
    const link = screen.getByText("About");
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/about");
  });

  it("applies className", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <NavLink to="/about" className="custom-class">About</NavLink>
      </MemoryRouter>
    );
    expect(screen.getByText("About")).toHaveClass("custom-class");
  });

  it("applies activeClassName when route is active", () => {
    render(
      <MemoryRouter initialEntries={["/about"]}>
        <NavLink to="/about" activeClassName="active-link">About</NavLink>
      </MemoryRouter>
    );
    expect(screen.getByText("About")).toHaveClass("active-link");
  });

  it("does not apply activeClassName when route is not active", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <NavLink to="/about" activeClassName="active-link">About</NavLink>
      </MemoryRouter>
    );
    expect(screen.getByText("About")).not.toHaveClass("active-link");
  });
});
