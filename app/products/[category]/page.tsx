"use client";

import { useState, useMemo } from "react";
import { ProductFilters } from "@/components/products/ProductFilters";
import { ProductGrid } from "@/components/products/ProductGrid";
import { ProductList } from "@/components/products/ProductList";
import { LayoutGrid, List, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { featuredProducts, categories } from "@/lib/placeholder-data";
import { notFound } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ViewMode = "grid" | "list";

export default function CategoryPage({
  params,
}: {
  params: { category: string };
}) {
  const { category } = params;
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    category: category,
    priceRange: { min: 0, max: 10000 },
    location: "",
    rating: 0,
    sortBy: "newest",
  });

  const categoryData = categories.find(
    (cat) => cat.slug === category
  );

  if (!categoryData) {
    notFound();
  }

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = featuredProducts.filter(
      (p) => p.category.toLowerCase() === categoryData.name.en.toLowerCase()
    );

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.store.toLowerCase().includes(query)
      );
    }

    // Filter by price range
    filtered = filtered.filter(
      (p) =>
        p.price >= (filters.priceRange.min || 0) &&
        p.price <= (filters.priceRange.max || 10000)
    );

    // Filter by location
    if (filters.location) {
      const storeLocations: Record<string, string> = {
        "Mauritius Builders Supply": "port-louis",
        "Island Construction Materials": "curepipe",
        "Steel & Metal Works": "vacoas",
        "Tile Masters Mauritius": "quatre-bornes",
      };
      filtered = filtered.filter((p) => storeLocations[p.store] === filters.location);
    }

    // Filter by rating
    if (filters.rating > 0) {
      filtered = filtered.filter((p) => p.rating >= filters.rating);
    }

    // Sort products
    switch (filters.sortBy) {
      case "price-low":
        filtered.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        filtered.sort((a, b) => b.price - a.price);
        break;
      case "popular":
        filtered.sort((a, b) => b.reviews - a.reviews);
        break;
      case "rating":
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      default:
        break;
    }

    return filtered;
  }, [filters, categoryData, searchQuery]);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">{categoryData.icon}</span>
          <div>
            <h1 className="text-3xl font-bold">{categoryData.name.en}</h1>
            <p className="text-sm text-muted-foreground">
              {filteredAndSortedProducts.length} products available
            </p>
          </div>
        </div>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="search"
            placeholder="Search in this category..."
            className="pl-10 h-10 bg-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <aside className="lg:w-64 flex-shrink-0">
          <ProductFilters filters={filters} onFiltersChange={setFilters} />
        </aside>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-4 bg-white p-3 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">
              Showing <span className="font-semibold">{filteredAndSortedProducts.length}</span> products
            </p>
            <div className="flex items-center gap-3">
              <Select
                value={filters.sortBy}
                onValueChange={(value) =>
                  setFilters({ ...filters, sortBy: value })
                }
              >
                <SelectTrigger className="w-[180px] h-9">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-1">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  className="h-8 px-3"
                  onClick={() => setViewMode("grid")}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  className="h-8 px-3"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {filteredAndSortedProducts.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
              <p className="text-gray-500">No products found matching your filters.</p>
            </div>
          ) : viewMode === "grid" ? (
            <ProductGrid products={filteredAndSortedProducts} />
          ) : (
            <ProductList products={filteredAndSortedProducts} />
          )}
        </div>
      </div>
    </div>
  );
}
