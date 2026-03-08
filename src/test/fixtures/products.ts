export const mockProducts = [
  {
    id: "prod-1",
    name: "Wireless Headphones",
    description: "Premium noise-cancelling over-ear headphones",
    price: 249.99,
    image_url: "/products/headphones.jpg",
    stock_quantity: 24,
    category: "Audio",
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "prod-2",
    name: "Mechanical Keyboard",
    description: "RGB backlit mechanical keyboard with hot-swap switches",
    price: 179.99,
    image_url: "/products/keyboard.jpg",
    stock_quantity: 35,
    category: "Peripherals",
    created_at: "2026-01-02T00:00:00Z",
  },
  {
    id: "prod-3",
    name: "Gaming Mouse",
    description: "Precision ergonomic gaming mouse with 16K DPI",
    price: 79.99,
    image_url: "/products/mouse.jpg",
    stock_quantity: 0,
    category: "Peripherals",
    created_at: "2026-01-03T00:00:00Z",
  },
];

export const mockCartItems = [
  {
    productId: "prod-1",
    name: "Wireless Headphones",
    price: 249.99,
    image_url: "/products/headphones.jpg",
    category: "Audio",
    quantity: 2,
  },
  {
    productId: "prod-2",
    name: "Mechanical Keyboard",
    price: 179.99,
    image_url: "/products/keyboard.jpg",
    category: "Peripherals",
    quantity: 1,
  },
];

export const mockUser = {
  id: "user-123",
  email: "test@example.com",
  user_metadata: { first_name: "John", last_name: "Doe" },
  app_metadata: {},
  aud: "authenticated",
  created_at: "2026-01-01T00:00:00Z",
} as any;

export const mockOrder = {
  id: "order-1",
  email: "test@example.com",
  total_price: 679.97,
  order_status: "pending" as const,
  shipping_address: {
    name: "John Doe",
    address_line1: "123 Main St",
    city: "New York",
    state: "NY",
    postal_code: "10001",
    country: "US",
  },
  stripe_payment_id: "cs_test_123",
  created_at: "2026-03-01T00:00:00Z",
  updated_at: "2026-03-01T00:00:00Z",
  order_items: [
    {
      id: "item-1",
      product_id: "prod-1",
      quantity: 2,
      price_at_purchase: 249.99,
      product: {
        id: "prod-1",
        name: "Wireless Headphones",
        image_url: "/products/headphones.jpg",
        category: "Audio",
      },
    },
    {
      id: "item-2",
      product_id: "prod-2",
      quantity: 1,
      price_at_purchase: 179.99,
      product: {
        id: "prod-2",
        name: "Mechanical Keyboard",
        image_url: "/products/keyboard.jpg",
        category: "Peripherals",
      },
    },
  ],
};

export const mockAddress = {
  id: "addr-1",
  user_id: "user-123",
  name: "John Doe",
  address_line1: "123 Main St",
  city: "New York",
  state: "NY",
  postal_code: "10001",
  country: "US",
  is_default: true,
  created_at: "2026-01-01T00:00:00Z",
};

export const mockReview = {
  id: "review-1",
  product_id: "prod-1",
  user_id: "user-123",
  order_id: "order-1",
  rating: 4,
  review_text: "Great product!",
  created_at: "2026-03-05T00:00:00Z",
};
