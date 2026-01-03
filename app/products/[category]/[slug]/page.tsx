"use client";

import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { featuredProducts, topStores } from "@/lib/placeholder-data";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, ShoppingCart, Heart, Share2, MapPin } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/contexts/CartContext";
import { useFavorites } from "@/contexts/FavoritesContext";

export default function ProductDetailPage({
  params,
}: {
  params: { category: string; slug: string };
}) {
  const { category, slug } = params;
  const product = featuredProducts.find((p) => p.slug === slug);
  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();

  if (!product) {
    notFound();
  }

  const store = topStores[0]; // Placeholder store data

  const handleAddToCart = () => {
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

  const handleToggleFavorite = () => {
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

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.title,
          text: product.description || product.title,
          url: window.location.href,
        });
      } catch (error) {
        // User cancelled or error occurred
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      if ((window as any).showToast) {
        (window as any).showToast("Link copied to clipboard!", "success");
      }
    }
  };

  const similarProducts = featuredProducts
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Product Images */}
        <div className="space-y-4">
          <div className="relative w-full h-96 bg-muted rounded-lg overflow-hidden">
            <Image
              src={product.image}
              alt={product.title}
              fill
              className="object-cover"
            />
          </div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="relative w-full h-24 bg-muted rounded-lg overflow-hidden"
              >
                <Image
                  src={product.image}
                  alt={`${product.title} ${i}`}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <Badge variant="secondary" className="mb-2">
              {product.category}
            </Badge>
            <h1 className="text-3xl font-bold mb-4">{product.title}</h1>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-1">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <span className="text-lg font-medium">{product.rating}</span>
                <span className="text-muted-foreground">
                  ({product.reviews} reviews)
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-b py-6">
            <div className="flex items-baseline gap-4 mb-4">
              <p className="text-4xl font-bold text-primary">
                {formatPrice(product.price, product.currency)}
              </p>
              <p className="text-muted-foreground">per {product.unit}</p>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              In stock • Min order: 1 {product.unit}
            </p>
          </div>

          <div className="flex gap-4">
            <Button size="lg" className="flex-1" onClick={handleAddToCart}>
              <ShoppingCart className="h-5 w-5 mr-2" />
              Add to Cart
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12"
              onClick={handleToggleFavorite}
            >
              <Heart
                className={`h-5 w-5 ${
                  isFavorite(product.id)
                    ? "fill-red-500 text-red-500"
                    : ""
                }`}
              />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12"
              onClick={handleShare}
            >
              <Share2 className="h-5 w-5" />
            </Button>
          </div>

          {/* Store Info */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  <Image
                    src={store.logo}
                    alt={store.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">{product.store}</h3>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                    <MapPin className="h-4 w-4" />
                    <span>{store.city}</span>
                  </div>
                  <div className="flex items-center gap-1 mb-4">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{store.rating}</span>
                    <span className="text-sm text-muted-foreground">
                      ({store.reviewCount} reviews)
                    </span>
                  </div>
                  <Link href={`/stores/${store.slug}`}>
                    <Button variant="outline" size="sm">
                      View Store
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Product Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold mb-4">Product Description</h2>
              <p className="text-muted-foreground leading-relaxed">
                {product.description ||
                  `High-quality ${product.title.toLowerCase()} perfect for your construction needs. This product meets industry standards and is trusted by professionals across Mauritius.`}
              </p>
            </CardContent>
          </Card>
        </div>
        <div>
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Specifications</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Category</span>
                  <span className="font-medium">{product.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Unit</span>
                  <span className="font-medium">{product.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Stock</span>
                  <span className="font-medium">Available</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Similar Products */}
      {similarProducts.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-6">Similar Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {similarProducts.map((p) => (
              <Card key={p.id} className="hover:shadow-lg transition-shadow">
                <div className="relative w-full h-48 bg-muted">
                  <Image
                    src={p.image}
                    alt={p.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold line-clamp-2 mb-2">{p.title}</h3>
                  <p className="text-xl font-bold text-primary mb-4">
                    {formatPrice(p.price, p.currency)}
                  </p>
                  <Link href={`/products/${p.category.toLowerCase()}/${p.slug}`}>
                    <Button size="sm" className="w-full">
                      View Details
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

