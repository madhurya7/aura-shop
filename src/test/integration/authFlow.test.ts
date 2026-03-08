import { describe, it, expect } from "vitest";

/**
 * Tests for authentication flow logic.
 */

function extractUserDisplayName(user: {
  email?: string;
  user_metadata?: { first_name?: string; last_name?: string };
} | null): string {
  if (!user) return "";
  if (user.user_metadata?.first_name) {
    return `${user.user_metadata.first_name} ${user.user_metadata.last_name || ""}`.trim();
  }
  return user.email || "";
}

function buildSignUpOptions(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  origin: string
) {
  return {
    email,
    password,
    options: {
      emailRedirectTo: origin,
      data: { first_name: firstName, last_name: lastName },
    },
  };
}

describe("User Display Name", () => {
  it("returns full name when available", () => {
    expect(
      extractUserDisplayName({
        email: "test@example.com",
        user_metadata: { first_name: "John", last_name: "Doe" },
      })
    ).toBe("John Doe");
  });

  it("returns first name only when last name missing", () => {
    expect(
      extractUserDisplayName({
        email: "test@example.com",
        user_metadata: { first_name: "John" },
      })
    ).toBe("John");
  });

  it("falls back to email when no name", () => {
    expect(
      extractUserDisplayName({
        email: "test@example.com",
        user_metadata: {},
      })
    ).toBe("test@example.com");
  });

  it("returns empty string for null user", () => {
    expect(extractUserDisplayName(null)).toBe("");
  });

  it("handles undefined metadata", () => {
    expect(extractUserDisplayName({ email: "a@b.com" })).toBe("a@b.com");
  });
});

describe("Sign Up Options Builder", () => {
  it("builds correct signup payload", () => {
    const opts = buildSignUpOptions(
      "test@example.com",
      "password123",
      "Jane",
      "Smith",
      "https://example.com"
    );

    expect(opts.email).toBe("test@example.com");
    expect(opts.password).toBe("password123");
    expect(opts.options.data.first_name).toBe("Jane");
    expect(opts.options.data.last_name).toBe("Smith");
    expect(opts.options.emailRedirectTo).toBe("https://example.com");
  });
});
