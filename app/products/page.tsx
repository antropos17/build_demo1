"use client";

import { useState, useMemo } from "react";
import { ProductFilters } from "@/components/products/ProductFilters";
import { ProductGrid } from "@/components/products/ProductGrid";
import { ProductList } from "@/components/products/ProductList";
import { LayoutGrid, List, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { featuredProducts } from "@/lib/placeholder-data";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ViewMode = "grid" | "list";

export default function ProductsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    category: "",
    priceRange: { min: 0, max: 10000 },
    location: "",
    rating: 0,
    sortBy: "newest",
  });

  // Apply filters and sorting
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = [...featuredProducts];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query) ||
          p.store.toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (filters.category) {
      filtered = filtered.filter(
        (p) => p.category.toLowerCase() === filters.category.toLowerCase()
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
      // Placeholder: filter by store location
      filtered = filtered.filter((p) => {
        const storeLocations: Record<string, string> = {
          "Mauritius Builders Supply": "port-louis",
          "Island Construction Materials": "curepipe",
          "Steel & Metal Works": "vacoas",
          "Tile Masters Mauritius": "quatre-bornes",
        };
        return storeLocations[p.store] === filters.location;
      });
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
      case "newest":
      default:
        // Keep original order for newest
        break;
    }

    return filtered;
  }, [filters, searchQuery]);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-1">All Products</h1>
        <p className="text-sm text-muted-foreground mb-4">
          Browse our complete catalog of construction materials
        </p>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="search"
            placeholder="Search products..."
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
