"use client";

import Link from "next/link";
import { categories } from "@/lib/placeholder-data";

export function CategoryGrid() {
  return (
    <section>
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-1">Browse Categories</h2>
        <p className="text-sm text-muted-foreground">
          Find exactly what you need for your construction project
        </p>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-3">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/products/${category.slug}`}
            className="group"
          >
            <div className="bg-white border border-gray-200 rounded-lg p-4 text-center hover:border-primary hover:shadow-sm transition-all duration-200">
              <div className="text-3xl mb-2">{category.icon}</div>
              <h3 className="text-xs font-medium text-gray-700 group-hover:text-primary transition-colors line-clamp-2">
                {category.name.en}
              </h3>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
