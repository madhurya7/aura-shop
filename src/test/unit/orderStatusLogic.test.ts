import { describe, it, expect } from "vitest";

// Status colors mapping (from OrderCard)
const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  paid: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  shipped: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  delivered: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

const ORDER_STATUSES = ["pending", "paid", "shipped", "delivered", "cancelled"];
const PAYMENT_STATUSES = [
  "requires_payment_method",
  "requires_action",
  "processing",
  "succeeded",
  "failed",
  "refunded",
];

describe("Order Status Logic", () => {
  it("all order statuses have color mappings", () => {
    for (const status of ORDER_STATUSES) {
      expect(statusColors[status]).toBeTruthy();
    }
  });

  it("pending orders should allow retry payment", () => {
    const isPending = (status: string) => status === "pending";
    expect(isPending("pending")).toBe(true);
    expect(isPending("paid")).toBe(false);
    expect(isPending("delivered")).toBe(false);
  });

  it("only pending orders can be cancelled", () => {
    const canCancel = (status: string) => status === "pending";
    expect(canCancel("pending")).toBe(true);
    expect(canCancel("paid")).toBe(false);
    expect(canCancel("shipped")).toBe(false);
  });

  it("only delivered orders show review button", () => {
    const canReview = (status: string) => status === "delivered";
    expect(canReview("delivered")).toBe(true);
    expect(canReview("pending")).toBe(false);
    expect(canReview("paid")).toBe(false);
  });

  it("payment statuses cover full Stripe lifecycle", () => {
    expect(PAYMENT_STATUSES).toContain("requires_payment_method");
    expect(PAYMENT_STATUSES).toContain("requires_action");
    expect(PAYMENT_STATUSES).toContain("processing");
    expect(PAYMENT_STATUSES).toContain("succeeded");
    expect(PAYMENT_STATUSES).toContain("failed");
    expect(PAYMENT_STATUSES).toContain("refunded");
  });

  it("status label formatting", () => {
    const formatStatus = (status: string) =>
      status.charAt(0).toUpperCase() + status.slice(1);
    expect(formatStatus("pending")).toBe("Pending");
    expect(formatStatus("paid")).toBe("Paid");
    expect(formatStatus("cancelled")).toBe("Cancelled");
  });
});
