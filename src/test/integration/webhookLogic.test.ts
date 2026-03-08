import { describe, it, expect } from "vitest";

/**
 * Integration tests for webhook processing logic.
 * These test the business logic without calling actual Stripe/Supabase.
 */

interface CheckoutSession {
  id: string;
  payment_intent: string | null;
  currency: string | null;
}

interface PaymentRecord {
  order_id: string;
  stripe_payment_intent_id: string | null;
  stripe_charge_id: string | null;
  amount: number;
  currency: string;
  payment_status: string;
  payment_method: string | null;
}

function buildPaymentRecord(
  orderId: string,
  totalPrice: number,
  session: CheckoutSession,
  piDetails: { chargeId: string | null; paymentMethod: string | null } | null
): PaymentRecord {
  return {
    order_id: orderId,
    stripe_payment_intent_id: session.payment_intent,
    stripe_charge_id: piDetails?.chargeId || null,
    amount: totalPrice,
    currency: session.currency || "usd",
    payment_status: "succeeded",
    payment_method: piDetails?.paymentMethod || null,
  };
}

function buildLineItems(orderItems: { name: string; price: number; quantity: number }[]) {
  return orderItems.map((item) => ({
    price_data: {
      currency: "usd",
      product_data: { name: item.name },
      unit_amount: Math.round(item.price * 100),
    },
    quantity: item.quantity,
  }));
}

describe("Webhook Payment Record Building", () => {
  it("builds a complete payment record", () => {
    const record = buildPaymentRecord(
      "order-1",
      679.97,
      { id: "cs_test_123", payment_intent: "pi_test_456", currency: "usd" },
      { chargeId: "ch_test_789", paymentMethod: "pm_test_abc" }
    );

    expect(record).toEqual({
      order_id: "order-1",
      stripe_payment_intent_id: "pi_test_456",
      stripe_charge_id: "ch_test_789",
      amount: 679.97,
      currency: "usd",
      payment_status: "succeeded",
      payment_method: "pm_test_abc",
    });
  });

  it("handles null payment intent details", () => {
    const record = buildPaymentRecord(
      "order-1",
      100,
      { id: "cs_test_123", payment_intent: null, currency: null },
      null
    );

    expect(record.stripe_payment_intent_id).toBeNull();
    expect(record.stripe_charge_id).toBeNull();
    expect(record.payment_method).toBeNull();
    expect(record.currency).toBe("usd"); // defaults to usd
  });
});

describe("Checkout Line Items Building", () => {
  it("converts prices to cents", () => {
    const items = buildLineItems([
      { name: "Widget", price: 29.99, quantity: 1 },
    ]);
    expect(items[0].price_data.unit_amount).toBe(2999);
  });

  it("handles multiple items", () => {
    const items = buildLineItems([
      { name: "A", price: 10, quantity: 2 },
      { name: "B", price: 20, quantity: 1 },
    ]);
    expect(items).toHaveLength(2);
    expect(items[0].quantity).toBe(2);
    expect(items[1].price_data.unit_amount).toBe(2000);
  });

  it("rounds cents correctly for floating point", () => {
    const items = buildLineItems([
      { name: "Test", price: 19.97, quantity: 1 },
    ]);
    expect(items[0].price_data.unit_amount).toBe(1997);
  });
});
