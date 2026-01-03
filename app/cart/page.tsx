"use client";

import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus, Minus, ShoppingCart, ArrowRight } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/contexts/CartContext";

export default function CartPage() {
  const {
    items,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalPrice,
    getTotalItems,
  } = useCart();

  const shipping = 200;
  const total = getTotalPrice() + shipping;

  const handleQuantityChange = (id: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromCart(id);
      if ((window as any).showToast) {
        (window as any).showToast("Item removed from cart", "info");
      }
    } else {
      updateQuantity(id, newQuantity);
    }
  };

  const handleRemove = (id: string) => {
    removeFromCart(id);
    if ((window as any).showToast) {
      (window as any).showToast("Item removed from cart", "info");
    }
  };

  const handleClearCart = () => {
    clearCart();
    if ((window as any).showToast) {
      (window as any).showToast("Cart cleared", "info");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-2">Shopping Cart</h1>
      <p className="text-muted-foreground mb-8">
        {getTotalItems()} {getTotalItems() === 1 ? "item" : "items"} in your cart
      </p>

      {items.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6">
              Start adding products to your cart
            </p>
            <Link href="/products">
              <Button size="lg">
                Browse Products
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Cart Items</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearCart}
                className="text-destructive hover:text-destructive"
              >
                Clear Cart
              </Button>
            </div>
            {items.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <Link
                      href={`/products/${item.category.toLowerCase()}/${item.slug}`}
                      className="relative w-24 h-24 bg-muted rounded-lg overflow-hidden flex-shrink-0"
                    >
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        className="object-cover"
                      />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/products/${item.category.toLowerCase()}/${item.slug}`}
                      >
                        <h3 className="font-semibold mb-1 hover:text-primary transition-colors">
                          {item.title}
                        </h3>
                      </Link>
                      <p className="text-sm text-muted-foreground mb-2">
                        {item.store}
                      </p>
                      <p className="text-lg font-bold text-primary mb-4">
                        {formatPrice(item.price, item.currency)} per {item.unit}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9"
                            onClick={() =>
                              handleQuantityChange(item.id, item.quantity - 1)
                            }
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-12 text-center font-medium text-lg">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9"
                            onClick={() =>
                              handleQuantityChange(item.id, item.quantity + 1)
                            }
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-4">
                          <p className="text-xl font-bold">
                            {formatPrice(
                              item.price * item.quantity,
                              item.currency
                            )}
                          </p>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemove(item.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div>
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">
                      {formatPrice(getTotalPrice(), "MUR")}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="font-medium">
                      {formatPrice(shipping, "MUR")}
                    </span>
                  </div>
                  <div className="border-t pt-3 flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-primary">
                      {formatPrice(total, "MUR")}
                    </span>
                  </div>
                </div>
                <Link href="/checkout">
                  <Button className="w-full" size="lg">
                    Proceed to Checkout
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
                <Link href="/products">
                  <Button variant="outline" className="w-full">
                    Continue Shopping
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
