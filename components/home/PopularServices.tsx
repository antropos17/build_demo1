"use client";

import Link from "next/link";
import Image from "next/image";
import { popularServices } from "@/lib/placeholder-data";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { useFavorites } from "@/contexts/FavoritesContext";

export function PopularServices() {
  const { isFavorite, toggleFavorite } = useFavorites();

  const handleToggleFavorite = (
    e: React.MouseEvent,
    service: (typeof popularServices)[0]
  ) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite({
      id: service.id,
      type: "service",
      title: service.title,
      slug: service.id,
      image: service.image,
    });
    if ((window as any).showToast) {
      (window as any).showToast(
        isFavorite(service.id)
          ? "Removed from favorites"
          : "Added to favorites",
        "success"
      );
    }
  };

  return (
    <section>
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-1">Popular Services</h2>
        <p className="text-sm text-muted-foreground">
          Professional contractors and service providers
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {popularServices.map((service) => (
          <div key={service.id} className="relative">
            <Link
              href={`/services/${service.category.toLowerCase()}/${service.id}`}
            >
              <Card className="hover:shadow-lg transition-shadow overflow-hidden h-full">
                <div className="relative w-full h-40 bg-muted">
                  <Image
                    src={service.image}
                    alt={service.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <Badge variant="secondary" className="text-xs">
                      {service.category}
                    </Badge>
                    <h3 className="font-semibold line-clamp-2">{service.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {service.provider}
                    </p>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{service.rating}</span>
                      <span className="text-sm text-muted-foreground">
                        ({service.reviews})
                      </span>
                    </div>
                    <div className="pt-2">
                      {service.priceType === "negotiable" ? (
                        <p className="text-sm font-medium text-primary">
                          Price: Negotiable
                        </p>
                      ) : service.priceType === "hourly" && service.priceRange ? (
                        <p className="text-sm font-medium">
                          {formatPrice(service.priceRange.min)} -{" "}
                          {formatPrice(service.priceRange.max)}/hour
                        </p>
                      ) : service.priceRange ? (
                        <p className="text-sm font-medium">
                          From {formatPrice(service.priceRange.min)}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8 bg-white/90 hover:bg-white"
              onClick={(e) => handleToggleFavorite(e, service)}
            >
              <Heart
                className={`h-4 w-4 ${
                  isFavorite(service.id)
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
