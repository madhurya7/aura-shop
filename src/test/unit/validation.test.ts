import { describe, it, expect } from "vitest";

// Validation logic extracted from components
function validateCheckoutForm(form: {
  email: string;
  name: string;
  address_line1: string;
  city: string;
  postal_code: string;
  country: string;
}) {
  const errors: string[] = [];
  if (!form.email || !form.email.includes("@")) errors.push("Valid email required");
  if (!form.name) errors.push("Name required");
  if (!form.address_line1) errors.push("Address required");
  if (!form.city) errors.push("City required");
  if (!form.postal_code) errors.push("Postal code required");
  if (!form.country) errors.push("Country required");
  return errors;
}

function validateProductForm(form: { name: string; price: string }) {
  const errors: string[] = [];
  if (!form.name) errors.push("Name is required");
  if (!form.price || isNaN(parseFloat(form.price)) || parseFloat(form.price) <= 0) {
    errors.push("Valid price is required");
  }
  return errors;
}

function validateSignUpForm(form: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}) {
  const errors: string[] = [];
  if (!form.email || !form.email.includes("@")) errors.push("Valid email required");
  if (!form.password || form.password.length < 6) errors.push("Password must be at least 6 characters");
  if (!form.firstName) errors.push("First name required");
  if (!form.lastName) errors.push("Last name required");
  return errors;
}

describe("Checkout Form Validation", () => {
  const validForm = {
    email: "test@example.com",
    name: "John Doe",
    address_line1: "123 Main St",
    city: "New York",
    postal_code: "10001",
    country: "US",
  };

  it("passes with valid data", () => {
    expect(validateCheckoutForm(validForm)).toHaveLength(0);
  });

  it("fails without email", () => {
    const errors = validateCheckoutForm({ ...validForm, email: "" });
    expect(errors).toContain("Valid email required");
  });

  it("fails with invalid email", () => {
    const errors = validateCheckoutForm({ ...validForm, email: "notanemail" });
    expect(errors).toContain("Valid email required");
  });

  it("fails without name", () => {
    const errors = validateCheckoutForm({ ...validForm, name: "" });
    expect(errors).toContain("Name required");
  });

  it("fails without address", () => {
    const errors = validateCheckoutForm({ ...validForm, address_line1: "" });
    expect(errors).toContain("Address required");
  });

  it("fails with multiple missing fields", () => {
    const errors = validateCheckoutForm({
      email: "",
      name: "",
      address_line1: "",
      city: "",
      postal_code: "",
      country: "",
    });
    expect(errors.length).toBeGreaterThanOrEqual(5);
  });
});

describe("Product Form Validation", () => {
  it("passes with valid data", () => {
    expect(validateProductForm({ name: "Test Product", price: "29.99" })).toHaveLength(0);
  });

  it("fails without name", () => {
    const errors = validateProductForm({ name: "", price: "29.99" });
    expect(errors).toContain("Name is required");
  });

  it("fails without price", () => {
    const errors = validateProductForm({ name: "Test", price: "" });
    expect(errors).toContain("Valid price is required");
  });

  it("fails with invalid price", () => {
    const errors = validateProductForm({ name: "Test", price: "abc" });
    expect(errors).toContain("Valid price is required");
  });

  it("fails with zero price", () => {
    const errors = validateProductForm({ name: "Test", price: "0" });
    expect(errors).toContain("Valid price is required");
  });

  it("fails with negative price", () => {
    const errors = validateProductForm({ name: "Test", price: "-10" });
    expect(errors).toContain("Valid price is required");
  });
});

describe("Sign Up Form Validation", () => {
  const validForm = {
    email: "test@example.com",
    password: "test123",
    firstName: "John",
    lastName: "Doe",
  };

  it("passes with valid data", () => {
    expect(validateSignUpForm(validForm)).toHaveLength(0);
  });

  it("fails with short password", () => {
    const errors = validateSignUpForm({ ...validForm, password: "123" });
    expect(errors).toContain("Password must be at least 6 characters");
  });

  it("fails without first name", () => {
    const errors = validateSignUpForm({ ...validForm, firstName: "" });
    expect(errors).toContain("First name required");
  });

  it("fails without last name", () => {
    const errors = validateSignUpForm({ ...validForm, lastName: "" });
    expect(errors).toContain("Last name required");
  });
});
