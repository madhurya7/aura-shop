import { useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

export default function OrderConfirmationPage() {
  const [searchParams] = useSearchParams();
  const { clearCart } = useCart();
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    if (sessionId) {
      clearCart();
    }
  }, [sessionId]);

  return (
    <div className="container py-20 text-center animate-fade-in">
      <CheckCircle className="h-16 w-16 mx-auto text-green-500" />
      <h1 className="font-heading text-3xl font-bold mt-4">Order Confirmed!</h1>
      <p className="text-muted-foreground mt-2 max-w-md mx-auto">
        Thank you for your purchase. You'll receive an email confirmation shortly.
      </p>
      <Button asChild className="mt-8 bg-accent text-accent-foreground hover:bg-accent/90">
        <Link to="/">Continue Shopping</Link>
      </Button>
    </div>
  );
}
