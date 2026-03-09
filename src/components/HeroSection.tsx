import heroBanner from "@/assets/hero-banner.jpg";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function HeroSection() {
  const scrollToProducts = () => {
    document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative overflow-hidden rounded-2xl mx-4 mt-4 lg:mx-0">
      <div className="absolute inset-0">
        <img src={heroBanner} alt="Artisan handcrafted goods collection" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/90 via-foreground/65 to-foreground/20" />
      </div>
      <div className="relative px-8 py-20 sm:px-12 sm:py-28 lg:py-36 max-w-xl">
        <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-primary-foreground leading-tight">
          Handcrafted with<br />
          <span className="text-accent">Heart</span> & Soul.
        </h1>
        <p className="mt-4 text-primary-foreground/80 text-base sm:text-lg max-w-md">
          Discover our curated collection of artisan goods — handloom fabrics, handmade jewelry, pottery, and more.
        </p>
        <Button
          onClick={scrollToProducts}
          size="lg"
          className="mt-6 bg-accent text-accent-foreground hover:bg-accent/90 gap-2"
        >
          Shop Now
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </section>
  );
}
