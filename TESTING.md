# Automated Testing Suite

## Overview

This project includes a comprehensive automated testing suite built with **Vitest** and **React Testing Library**. The suite covers unit tests, component tests, integration tests, and business logic validation.

## Technology Stack

| Tool | Purpose |
|------|---------|
| **Vitest** | Test runner (Vite-native, Jest-compatible API) |
| **React Testing Library** | Component rendering and interaction testing |
| **jsdom** | DOM environment for testing |
| **@testing-library/jest-dom** | DOM assertion matchers |

> **Note:** This is a Vite + React frontend project with Supabase Edge Functions backend. Jest, Supertest, and Playwright are not compatible with this stack. Vitest provides equivalent functionality with better Vite integration.

## Test Structure

```
src/test/
├── setup.ts                          # Test environment setup
├── fixtures/
│   ├── products.ts                   # Mock product, cart, user, order data
│   └── mocks.ts                      # Supabase client & router mocks
├── unit/
│   ├── utils.test.ts                 # cn() utility function
│   ├── productImages.test.ts         # Image path mapping
│   ├── productData.test.ts           # Static product data validation
│   ├── priceFormatting.test.ts       # Price formatting & cart calculations
│   ├── cartContext.test.tsx          # Cart state management (add/remove/update/clear)
│   ├── validation.test.ts           # Form validation (checkout, product, signup)
│   └── orderStatusLogic.test.ts     # Order status transitions & permissions
├── components/
│   ├── StarRating.test.tsx           # Star rating rendering & interaction
│   ├── CategoryFilter.test.tsx       # Category filter buttons
│   └── HeroSection.test.tsx          # Hero section rendering
├── integration/
│   ├── paymentFlow.test.ts           # Stripe payment lifecycle simulation
│   ├── webhookLogic.test.ts          # Webhook event processing
│   ├── stockManagement.test.ts       # Stock validation & decrement logic
│   ├── authFlow.test.ts              # Auth display name & signup payload
│   ├── adminLogic.test.ts            # Admin product/order management
│   └── reviewLogic.test.ts           # Rating calculations & aggregation
└── example.test.ts                   # Smoke test
```

## Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test -- --watch

# Run with coverage report
npm run test -- --coverage

# Run specific test file
npm run test -- src/test/unit/cartContext.test.tsx

# Run tests matching a pattern
npm run test -- --grep "CartContext"
```

## Test Categories

### 1. Unit Tests (`src/test/unit/`)

Pure function and context tests with no external dependencies.

- **utils.test.ts** — Tailwind class merging utility
- **productImages.test.ts** — Image URL mapping and fallback
- **productData.test.ts** — Static product data integrity
- **priceFormatting.test.ts** — Price display, line totals, cart totals
- **cartContext.test.tsx** — Full cart lifecycle: add, remove, update, clear, stock limits, localStorage persistence
- **validation.test.ts** — Checkout, product, and signup form validation
- **orderStatusLogic.test.ts** — Status colors, permissions (cancel, retry, review)

### 2. Component Tests (`src/test/components/`)

React component rendering and user interaction tests.

- **StarRating.test.tsx** — Renders correct stars, handles clicks, sizes
- **CategoryFilter.test.tsx** — Renders categories, handles selection
- **HeroSection.test.tsx** — Renders content, scroll behavior

### 3. Integration Tests (`src/test/integration/`)

Business logic that spans multiple concerns.

- **paymentFlow.test.ts** — Simulates Stripe test cards (success `4242...4242`, failure `4000...0002`, 3D Secure `4000...3155`), webhook processing, retry and cancellation flows
- **webhookLogic.test.ts** — Payment record construction, line item building with cent conversion
- **stockManagement.test.ts** — Stock decrement, cart addition validation, checkout stock verification
- **authFlow.test.ts** — User display name resolution, signup options building
- **adminLogic.test.ts** — Order status transitions, product payload construction
- **reviewLogic.test.ts** — Average rating calculation, bulk ratings aggregation

### 4. Test Fixtures (`src/test/fixtures/`)

Reusable mock data:

- **products.ts** — Mock products (Wireless Headphones, Mechanical Keyboard, Gaming Mouse), cart items, users, orders, addresses, reviews
- **mocks.ts** — Supabase client mock with chainable query builder, router mocks

## Coverage Goals

| Metric | Target |
|--------|--------|
| Statements | 80%+ |
| Branches | 75%+ |
| Functions | 80%+ |
| Lines | 80%+ |

## Key Scenarios Covered

- ✅ Cart total calculation with multiple items and quantities
- ✅ Product price formatting (whole dollars, cents, edge cases)
- ✅ Stock validation (out-of-stock, exceeding limits, exact limits)
- ✅ Order status transitions and permissions
- ✅ Payment lifecycle (success, failure, 3D Secure, retry)
- ✅ Webhook event processing and payment record creation
- ✅ Form validation (missing fields, invalid data)
- ✅ User display name with metadata fallback
- ✅ Admin product CRUD payload building
- ✅ Review rating aggregation and averaging
- ✅ Category filtering
- ✅ Interactive star rating
- ✅ Cart persistence via localStorage

## Edge Function Testing

Edge Functions (Deno runtime) are tested via extracted business logic in the integration tests. The actual HTTP handler testing requires Deno test infrastructure which is separate from the frontend test suite.

For live testing of edge functions:
1. Use the Stripe test mode dashboard to trigger webhook events
2. Use Stripe CLI: `stripe trigger checkout.session.completed`
3. Test cards: `4242 4242 4242 4242` (success), `4000 0000 0000 0002` (decline)
