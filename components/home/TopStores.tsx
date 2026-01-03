"use client";

import Link from "next/link";
import Image from "next/image";
import { topStores } from "@/lib/placeholder-data";
import { Card, CardContent } from "@/components/ui/card";
import { Star, MapPin, CheckCircle2, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/contexts/FavoritesContext";

export function TopStores() {
  const { isFavorite, toggleFavorite } = useFavorites();

  const handleToggleFavorite = (
    e: React.MouseEvent,
    store: (typeof topStores)[0]
  ) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite({
      id: store.id,
      type: "store",
      title: store.name,
      slug: store.slug,
    });
    if ((window as any).showToast) {
      (window as any).showToast(
        isFavorite(store.id)
          ? "Removed from favorites"
          : "Added to favorites",
        "success"
      );
    }
  };

  return (
    <section>
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-1">Top Stores</h2>
        <p className="text-sm text-muted-foreground">
          Verified sellers with excellent ratings
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {topStores.map((store) => (
          <div key={store.id} className="relative">
            <Link href={`/stores/${store.slug}`}>
              <Card className="hover:shadow-lg transition-shadow h-full">
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
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg truncate">
                          {store.name}
                        </h3>
                        {store.isVerified && (
                          <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                        <MapPin className="h-3 w-3" />
                        <span>{store.city}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{store.rating}</span>
                        <span className="text-sm text-muted-foreground">
                          ({store.reviewCount})
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8 bg-white/90 hover:bg-white"
              onClick={(e) => handleToggleFavorite(e, store)}
            >
              <Heart
                className={`h-4 w-4 ${
                  isFavorite(store.id)
                    ? "fill-red-500 text-red-500"
                    : "text-gray-400"
                }`}
              />
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}
