"use client";

import Link from "next/link";
import Image from "next/image";
import { topStores } from "@/lib/placeholder-data";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, CheckCircle2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function StoresPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">All Stores</h1>
        <p className="text-muted-foreground">
          Browse verified stores and sellers in Mauritius
        </p>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="search"
            placeholder="Search stores..."
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {topStores.map((store) => (
          <Link key={store.id} href={`/stores/${store.slug}`}>
            <Card className="hover:shadow-lg transition-shadow h-full">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    <Image
                      src={store.logo}
                      alt={store.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg truncate">
                        {store.name}
                      </h3>
                      {store.isVerified && (
                        <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                      <MapPin className="h-4 w-4" />
                      <span>{store.city}</span>
                    </div>
                    <div className="flex items-center gap-1 mb-3">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{store.rating}</span>
                      <span className="text-sm text-muted-foreground">
                        ({store.reviewCount} reviews)
                      </span>
                    </div>
                    <Button variant="outline" size="sm" className="w-full">
                      View Store
                    </Button>
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




