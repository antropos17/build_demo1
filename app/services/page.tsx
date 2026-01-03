"use client";

import Link from "next/link";
import Image from "next/image";
import { popularServices } from "@/lib/placeholder-data";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/utils";

export default function ServicesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Services</h1>
        <p className="text-muted-foreground">
          Find professional contractors and service providers
        </p>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="search"
            placeholder="Search services..."
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {popularServices.map((service) => (
          <Link
            key={service.id}
            href={`/services/${service.category.toLowerCase()}/${service.id}`}
          >
            <Card className="hover:shadow-lg transition-shadow overflow-hidden h-full">
              <div className="relative w-full h-48 bg-muted">
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
                  <h3 className="font-semibold text-lg line-clamp-2">
                    {service.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {service.provider}
                  </p>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{service.rating}</span>
                    <span className="text-sm text-muted-foreground">
                      ({service.reviews} reviews)
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
        ))}
      </div>
    </div>
  );
}




