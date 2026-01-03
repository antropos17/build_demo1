import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartProvider } from "@/contexts/CartContext";
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import { ToastProvider } from "@/components/ui/toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FindBuild - Construction Materials Marketplace Mauritius",
  description: "Find construction materials, tools, and services in Mauritius",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <CartProvider>
          <FavoritesProvider>
            <ToastProvider>
              <Header />
              <main className="min-h-screen">{children}</main>
              <Footer />
            </ToastProvider>
          </FavoritesProvider>
        </CartProvider>
      </body>
    </html>
  );
}

