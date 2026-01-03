"use client";

import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { topStores, featuredProducts } from "@/lib/placeholder-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, MapPin, CheckCircle2, Clock, Phone, Mail } from "lucide-react";
import { ProductGrid } from "@/components/products/ProductGrid";

export default function StorePage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;
  const store = topStores.find((s) => s.slug === slug);

  if (!store) {
    notFound();
  }

  const storeProducts = featuredProducts.filter(
    (p) => p.store === store.name
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Store Header */}
      <div className="mb-8">
        <div className="relative w-full h-64 bg-muted rounded-lg overflow-hidden mb-6">
          <Image
            src={store.logo}
            alt={store.name}
            fill
            className="object-cover"
          />
        </div>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
            <Image
              src={store.logo}
              alt={store.name}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{store.name}</h1>
              {store.isVerified && (
                <CheckCircle2 className="h-6 w-6 text-primary" />
              )}
            </div>
            <div className="flex items-center gap-1 text-muted-foreground mb-4">
              <MapPin className="h-4 w-4" />
              <span>{store.city}</span>
            </div>
            <div className="flex items-center gap-1 mb-4">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              <span className="text-lg font-medium">{store.rating}</span>
              <span className="text-muted-foreground">
                ({store.reviewCount} reviews)
              </span>
            </div>
            <div className="flex gap-3">
              <Button>Contact Store</Button>
              <Button variant="outline">Follow</Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {store.name} is a trusted supplier of construction materials
                in Mauritius. We offer a wide range of high-quality products
                for all your building needs.
              </p>
            </CardContent>
          </Card>

          <div>
            <h2 className="text-2xl font-bold mb-6">Products ({storeProducts.length})</h2>
            {storeProducts.length > 0 ? (
              <ProductGrid products={storeProducts} />
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">
                    No products available yet.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Store Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Location</p>
                  <p className="text-sm text-muted-foreground">{store.city}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Working Hours</p>
                  <p className="text-sm text-muted-foreground">
                    Mon-Sat: 8:00 AM - 6:00 PM
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Phone</p>
                  <p className="text-sm text-muted-foreground">
                    +230 XXX XXXX
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">
                    contact@{store.slug}.mu
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Rating Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[5, 4, 3, 2, 1].map((rating) => (
                  <div key={rating} className="flex items-center gap-3">
                    <span className="text-sm w-8">{rating}</span>
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${Math.random() * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

