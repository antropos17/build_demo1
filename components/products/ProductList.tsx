"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, ShoppingCart, Heart } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/contexts/CartContext";
import { useFavorites } from "@/contexts/FavoritesContext";

interface Product {
  id: string;
  title: string;
  slug: string;
  price: number;
  currency: string;
  unit: string;
  image: string;
  category: string;
  store: string;
  rating: number;
  reviews: number;
}

interface ProductListProps {
  products: Product[];
}

export function ProductList({ products }: ProductListProps) {
  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({
      id: product.id,
      title: product.title,
      slug: product.slug,
      price: product.price,
      currency: product.currency,
      unit: product.unit,
      image: product.image,
      category: product.category,
      store: product.store,
    });
    if ((window as any).showToast) {
      (window as any).showToast("Product added to cart!", "success");
    }
  };

  const handleToggleFavorite = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite({
      id: product.id,
      type: "product",
      title: product.title,
      slug: product.slug,
      image: product.image,
      price: product.price,
      currency: product.currency,
    });
    if ((window as any).showToast) {
      (window as any).showToast(
        isFavorite(product.id)
          ? "Removed from favorites"
          : "Added to favorites",
        "success"
      );
    }
  };
  return (
    <div className="space-y-4">
      {products.map((product) => (
        <Link
          key={product.id}
          href={`/products/${product.category.toLowerCase()}/${product.slug}`}
        >
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="relative w-32 h-32 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                  <Image
                    src={product.image}
                    alt={product.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className="text-xs">
                          {product.category}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-lg mb-1">
                        {product.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {product.store}
                      </p>
                      <div className="flex items-center gap-1 mb-2">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">
                          {product.rating}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          ({product.reviews} reviews)
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">
                          {formatPrice(product.price, product.currency)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          per {product.unit}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9"
                          onClick={(e) => handleToggleFavorite(e, product)}
                        >
                          <Heart
                            className={`h-4 w-4 ${
                              isFavorite(product.id)
                                ? "fill-red-500 text-red-500"
                                : "text-gray-400"
                            }`}
                          />
                        </Button>
                        <Button onClick={(e) => handleAddToCart(e, product)}>
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Add to Cart
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

