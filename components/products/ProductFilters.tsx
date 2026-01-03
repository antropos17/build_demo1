"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { categories } from "@/lib/placeholder-data";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";

interface ProductFiltersProps {
  filters: {
    category: string;
    priceRange: { min: number; max: number };
    location: string;
    rating: number;
    sortBy: string;
  };
  onFiltersChange: (filters: any) => void;
}

export function ProductFilters({ filters, onFiltersChange }: ProductFiltersProps) {
  const hasActiveFilters =
    filters.category ||
    filters.priceRange.min > 0 ||
    filters.priceRange.max < 10000 ||
    filters.location ||
    filters.rating > 0;

  const clearFilters = () => {
    onFiltersChange({
      category: "",
      priceRange: { min: 0, max: 10000 },
      location: "",
      rating: 0,
      sortBy: filters.sortBy,
    });
  };

  return (
    <Card className="sticky top-20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Filters</CardTitle>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-7 px-2 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Category</Label>
          <Select
            value={filters.category || "all"}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, category: value === "all" ? "" : value })
            }
          >
            <SelectTrigger className="h-10">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.slug}>
                  {cat.name.en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Price Range (MUR)</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={filters.priceRange.min || ""}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  priceRange: {
                    ...filters.priceRange,
                    min: Number(e.target.value) || 0,
                  },
                })
              }
              className="h-10"
            />
            <Input
              type="number"
              placeholder="Max"
              value={filters.priceRange.max || ""}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  priceRange: {
                    ...filters.priceRange,
                    max: Number(e.target.value) || 10000,
                  },
                })
              }
              className="h-10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Location</Label>
          <Select
            value={filters.location || "all"}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, location: value === "all" ? "" : value })
            }
          >
            <SelectTrigger className="h-10">
              <SelectValue placeholder="All Locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              <SelectItem value="port-louis">Port Louis</SelectItem>
              <SelectItem value="curepipe">Curepipe</SelectItem>
              <SelectItem value="vacoas">Vacoas</SelectItem>
              <SelectItem value="quatre-bornes">Quatre Bornes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Minimum Rating</Label>
          <Select
            value={filters.rating.toString()}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, rating: Number(value) })
            }
          >
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Any Rating" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Any Rating</SelectItem>
              <SelectItem value="4">4+ Stars</SelectItem>
              <SelectItem value="4.5">4.5+ Stars</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
