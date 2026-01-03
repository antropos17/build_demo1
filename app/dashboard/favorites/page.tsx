"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Trash2, ShoppingCart } from "lucide-react";
import { useFavorites } from "@/contexts/FavoritesContext";
import { useCart } from "@/contexts/CartContext";
import { formatPrice } from "@/lib/utils";

export default function FavoritesPage() {
  const { items, removeFromFavorites } = useFavorites();
  const { addToCart } = useCart();

  const handleRemove = (id: string) => {
    removeFromFavorites(id);
    if ((window as any).showToast) {
      (window as any).showToast("Removed from favorites", "info");
    }
  };

  const handleAddToCart = (item: (typeof items)[0]) => {
    if (item.type === "product" && item.price) {
      addToCart({
        id: item.id,
        title: item.title,
        slug: item.slug,
        price: item.price,
        currency: item.currency || "MUR",
        unit: "piece",
        image: item.image || "",
        category: "",
        store: "",
      });
      if ((window as any).showToast) {
        (window as any).showToast("Added to cart!", "success");
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-2">My Favorites</h1>
      <p className="text-muted-foreground mb-8">
        {items.length} {items.length === 1 ? "item" : "items"} saved
      </p>

      {items.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">No favorites yet</h2>
            <p className="text-muted-foreground mb-6">
              Start saving items you love
            </p>
            <Link href="/products">
              <Button>Browse Products</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            <Card key={item.id} className="hover:shadow-lg transition-shadow">
              {item.image && (
                <div className="relative w-full aspect-square bg-muted">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <CardContent className="p-4">
                <Link href={`/products/${item.slug}`}>
                  <h3 className="font-semibold mb-2 line-clamp-2 hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                </Link>
                {item.price && (
                  <p className="text-lg font-bold text-primary mb-4">
                    {formatPrice(item.price, item.currency || "MUR")}
                  </p>
                )}
                <div className="flex items-center gap-2">
                  {item.type === "product" && item.price && (
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => handleAddToCart(item)}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Add to Cart
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemove(item.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}




