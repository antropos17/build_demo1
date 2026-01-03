"use client";

import Image from "next/image";
import { notFound } from "next/navigation";
import { popularServices } from "@/lib/placeholder-data";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Phone, Mail, MapPin, Calendar } from "lucide-react";
import { formatPrice } from "@/lib/utils";

export default function ServiceDetailPage({
  params,
}: {
  params: { category: string; slug: string };
}) {
  const { slug } = params;
  const service = popularServices.find((s) => s.id === slug);

  if (!service) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="relative w-full h-96 bg-muted rounded-lg overflow-hidden mb-6">
            <Image
              src={service.image}
              alt={service.title}
              fill
              className="object-cover"
            />
          </div>

          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <Badge variant="secondary" className="mb-2">
                    {service.category}
                  </Badge>
                  <h1 className="text-3xl font-bold mb-2">{service.title}</h1>
                  <p className="text-muted-foreground mb-4">{service.provider}</p>
                  <div className="flex items-center gap-1">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <span className="text-lg font-medium">{service.rating}</span>
                    <span className="text-muted-foreground">
                      ({service.reviews} reviews)
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold mb-4">Service Description</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Professional {service.title.toLowerCase()} services provided by{" "}
                {service.provider}. We offer high-quality workmanship and
                reliable service throughout Mauritius.
              </p>
              <div className="space-y-2">
                <h3 className="font-semibold">Service Area:</h3>
                <p className="text-muted-foreground">
                  {service.serviceArea?.join(", ") || "All of Mauritius"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Pricing</h3>
                  {service.priceType === "negotiable" ? (
                    <p className="text-lg font-medium text-primary">
                      Negotiable
                    </p>
                  ) : service.priceType === "hourly" && service.priceRange ? (
                    <div>
                      <p className="text-lg font-medium">
                        {formatPrice(service.priceRange.min)} -{" "}
                        {formatPrice(service.priceRange.max)}
                      </p>
                      <p className="text-sm text-muted-foreground">per hour</p>
                    </div>
                  ) : service.priceRange ? (
                    <div>
                      <p className="text-lg font-medium">
                        From {formatPrice(service.priceRange.min)}
                      </p>
                      {service.priceRange.max && (
                        <p className="text-sm text-muted-foreground">
                          Up to {formatPrice(service.priceRange.max)}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Contact for pricing</p>
                  )}
                </div>
                <Button className="w-full" size="lg">
                  <Calendar className="h-5 w-5 mr-2" />
                  Book Service
                </Button>
                <Button variant="outline" className="w-full">
                  <Phone className="h-4 w-4 mr-2" />
                  Contact Provider
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Contact Information</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm">+230 XXX XXXX</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm">contact@{service.provider.toLowerCase().replace(/\s+/g, "")}.mu</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm">Mauritius</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

