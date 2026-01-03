import { Hero } from "@/components/home/Hero";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { TopStores } from "@/components/home/TopStores";
import { PopularServices } from "@/components/home/PopularServices";

export default function Home() {
  return (
    <div className="flex flex-col bg-gray-50">
      <Hero />
      <div className="container mx-auto px-4 py-8 space-y-12">
        <CategoryGrid />
        <FeaturedProducts />
        <TopStores />
        <PopularServices />
      </div>
    </div>
  );
}

