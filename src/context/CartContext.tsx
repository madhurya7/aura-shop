import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  image_url: string;
  category: string;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: { id: string; name: string; price: number; image_url: string; category: string; stock_quantity: number }, quantity?: number) => boolean;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number, stockLimit?: number) => boolean;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem("cart");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(items));
  }, [items]);

  const addItem = (product: { id: string; name: string; price: number; image_url: string; category: string; stock_quantity: number }, quantity = 1): boolean => {
    const existing = items.find((i) => i.productId === product.id);
    const currentQty = existing ? existing.quantity : 0;
    
    if (product.stock_quantity <= 0) return false;
    if (currentQty + quantity > product.stock_quantity) return false;

    setItems((prev) => {
      const ex = prev.find((i) => i.productId === product.id);
      if (ex) {
        return prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prev, { productId: product.id, name: product.name, price: product.price, image_url: product.image_url, category: product.category, quantity }];
    });
    return true;
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const updateQuantity = (productId: string, quantity: number, stockLimit?: number): boolean => {
    if (quantity < 1) { removeItem(productId); return true; }
    if (stockLimit !== undefined && quantity > stockLimit) return false;
    setItems((prev) => prev.map((i) => (i.productId === productId ? { ...i, quantity } : i)));
    return true;
  };

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
