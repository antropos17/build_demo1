"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, CheckCircle2, Clock, XCircle } from "lucide-react";
import { formatPrice } from "@/lib/utils";

// Mock orders data
const mockOrders = [
  {
    id: "ORD-001",
    date: "2024-01-15",
    status: "delivered",
    total: 1250,
    items: 3,
  },
  {
    id: "ORD-002",
    date: "2024-01-20",
    status: "processing",
    total: 850,
    items: 2,
  },
  {
    id: "ORD-003",
    date: "2024-01-22",
    status: "pending",
    total: 450,
    items: 1,
  },
];

export default function OrdersPage() {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "delivered":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Delivered
          </Badge>
        );
      case "processing":
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <Clock className="h-3 w-3 mr-1" />
            Processing
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      default:
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Cancelled
          </Badge>
        );
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-2">My Orders</h1>
      <p className="text-muted-foreground mb-8">
        Track and manage your orders
      </p>

      {mockOrders.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">No orders yet</h2>
            <p className="text-muted-foreground">
              Your order history will appear here
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {mockOrders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Order {order.id}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Placed on {new Date(order.date).toLocaleDateString()}
                    </p>
                  </div>
                  {getStatusBadge(order.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {order.items} {order.items === 1 ? "item" : "items"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">
                      {formatPrice(order.total, "MUR")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}




