"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="w-full bg-gradient-to-br from-primary/5 via-background to-background py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
            Find Everything You Need for
            <span className="text-primary"> Construction</span>
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            Your trusted marketplace for construction materials, tools, and
            services in Mauritius
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                type="search"
                placeholder="Search products, stores, services..."
                className="pl-12 h-12 text-base"
              />
            </div>
            <Button size="lg" className="h-12 px-8">
              Search
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
