"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface FavoriteItem {
  id: string;
  type: "product" | "store" | "service";
  title: string;
  slug: string;
  image?: string;
  price?: number;
  currency?: string;
}

interface FavoritesContextType {
  items: FavoriteItem[];
  addToFavorites: (item: FavoriteItem) => void;
  removeFromFavorites: (id: string) => void;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (item: FavoriteItem) => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(
  undefined
);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<FavoriteItem[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const savedFavorites = localStorage.getItem("findbuild-favorites");
    if (savedFavorites) {
      try {
        setItems(JSON.parse(savedFavorites));
      } catch (error) {
        console.error("Error loading favorites:", error);
      }
    }
  }, []);

  // Save to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem("findbuild-favorites", JSON.stringify(items));
  }, [items]);

  const addToFavorites = (item: FavoriteItem) => {
    setItems((prevItems) => {
      if (prevItems.find((i) => i.id === item.id)) {
        return prevItems;
      }
      return [...prevItems, item];
    });
  };

  const removeFromFavorites = (id: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== id));
  };

  const isFavorite = (id: string) => {
    return items.some((item) => item.id === id);
  };

  const toggleFavorite = (item: FavoriteItem) => {
    if (isFavorite(item.id)) {
      removeFromFavorites(item.id);
    } else {
      addToFavorites(item);
    }
  };

  return (
    <FavoritesContext.Provider
      value={{
        items,
        addToFavorites,
        removeFromFavorites,
        isFavorite,
        toggleFavorite,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return context;
}




