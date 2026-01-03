"use client";

import Link from "next/link";
import Image from "next/image";
import { Star, MapPin, ShoppingCart, Heart } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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

interface ProductGridProps {
  products: Product[];
}

export function ProductGrid({ products }: ProductGridProps) {
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {products.map((product) => (
        <Link
          key={product.id}
          href={`/products/${product.category.toLowerCase()}/${product.slug}`}
          className="group"
        >
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-all duration-200 h-full flex flex-col">
            {/* Image */}
            <div className="relative w-full aspect-square bg-gray-100">
              <Image
                src={product.image}
                alt={product.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-200"
              />
            </div>
            
            {/* Content */}
            <div className="p-4 flex flex-col flex-1">
              <h3 className="font-medium text-base mb-2 line-clamp-2 text-gray-900 group-hover:text-primary transition-colors">
                {product.title}
              </h3>
              
              <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                <MapPin className="h-3 w-3" />
                <span className="truncate">{product.store}</span>
              </div>
              
              <div className="flex items-center gap-1 mb-3">
                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                <span className="text-xs font-medium text-gray-700">{product.rating}</span>
                <span className="text-xs text-gray-500">({product.reviews})</span>
              </div>
              
              <div className="mt-auto pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-lg font-bold text-primary">
                      {formatPrice(product.price, product.currency)}
                    </p>
                    <p className="text-xs text-gray-500">per {product.unit}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
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
                    <Button
                      size="sm"
                      className="h-8 px-3"
                      onClick={(e) => handleAddToCart(e, product)}
                    >
                      <ShoppingCart className="h-3.5 w-3.5 mr-1" />
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
