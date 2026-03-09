import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Search, User, LogOut, Shield, Package, Heart, Globe } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useCurrency } from "@/context/CurrencyContext";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { countries } from "@/lib/countries";

export default function Header() {
  const { totalItems } = useCart();
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdminCheck();
  const { countryCode, setCountryCode, currencySymbol, currencyCode: cc } = useCurrency();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/?search=${encodeURIComponent(search.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
      <div className="container flex h-16 items-center gap-4">
        <Link to="/" className="font-heading text-xl font-bold tracking-tight shrink-0">
          ARTISAN<span className="text-accent">.</span>
        </Link>

        <form onSubmit={handleSearch} className="relative flex-1 max-w-md hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-secondary border-0"
          />
        </form>

        <div className="flex items-center gap-2 ml-auto">
          {/* Currency/Country selector */}
          <Select value={countryCode} onValueChange={setCountryCode}>
            <SelectTrigger className="w-auto gap-1 border-0 bg-transparent text-xs font-medium h-8 px-2">
              <Globe className="h-3.5 w-3.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {countries.map((c) => (
                <SelectItem key={c.code} value={c.code} className="text-xs">{c.code} - {c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground hidden sm:inline">{currencySymbol}{cc}</span>

          <Button variant="ghost" size="icon" className="sm:hidden" onClick={() => navigate("/?search=")}>
            <Search className="h-5 w-5" />
          </Button>

          {user && (
            <Button variant="ghost" size="icon" asChild>
              <Link to="/favorites" className="relative">
                <Heart className="h-5 w-5" />
              </Link>
            </Button>
          )}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="text-xs text-muted-foreground" disabled>
                  {user.user_metadata?.first_name
                    ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ""}`.trim()
                    : user.email}
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem onClick={() => navigate("/admin")}>
                    <Shield className="h-4 w-4 mr-2" /> Admin Dashboard
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => navigate("/orders")}>
                  <Package className="h-4 w-4 mr-2" /> Order History
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/favorites")}>
                  <Heart className="h-4 w-4 mr-2" /> Favorites
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { signOut(); navigate("/"); }}>
                  <LogOut className="h-4 w-4 mr-2" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="ghost" size="icon" asChild>
              <Link to="/auth">
                <User className="h-5 w-5" />
              </Link>
            </Button>
          )}

          <Button variant="ghost" size="icon" asChild>
            <Link to="/cart" className="relative">
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-accent text-accent-foreground text-xs flex items-center justify-center font-bold">
                  {totalItems}
                </span>
              )}
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
