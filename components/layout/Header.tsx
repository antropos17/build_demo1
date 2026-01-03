"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, ShoppingCart, User, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/contexts/CartContext";
import { Badge } from "@/components/ui/badge";

export function Header() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const { getTotalItems } = useCart();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery)}`);
    }
  };
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-primary">FindBuild</span>
            </Link>
            <nav className="hidden md:flex items-center gap-8">
              <Link
                href="/products"
                className="text-sm font-medium text-gray-700 transition-colors hover:text-primary"
              >
                Products
              </Link>
              <Link
                href="/stores"
                className="text-sm font-medium text-gray-700 transition-colors hover:text-primary"
              >
                Stores
              </Link>
              <Link
                href="/services"
                className="text-sm font-medium text-gray-700 transition-colors hover:text-primary"
              >
                Services
              </Link>
            </nav>
          </div>

          <form
            onSubmit={handleSearch}
            className="flex items-center gap-3 flex-1 max-w-lg mx-4"
          >
            <div className="relative flex-1 hidden sm:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="search"
                placeholder="Search products, stores, services..."
                className="pl-10 w-full h-10 bg-gray-50 border-gray-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              variant="ghost"
              size="icon"
              className="md:hidden h-10 w-10"
            >
              <Search className="h-5 w-5" />
            </Button>
          </form>

          <div className="flex items-center gap-1">
            <Link href="/cart">
              <Button variant="ghost" size="icon" className="h-10 w-10 relative">
                <ShoppingCart className="h-5 w-5" />
                {getTotalItems() > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                    {getTotalItems()}
                  </Badge>
                )}
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="ghost" size="icon" className="h-10 w-10">
                <User className="h-5 w-5" />
              </Button>
            </Link>
            <Button variant="ghost" size="icon" className="md:hidden h-10 w-10">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

