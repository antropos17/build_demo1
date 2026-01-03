import mongoose, { Schema, Document, Model } from "mongoose";

export interface IProduct extends Document {
  storeId: mongoose.Types.ObjectId;
  sellerId: mongoose.Types.ObjectId;
  title: string;
  slug: string;
  description: string;
  category: string;
  subcategory?: string;
  price: number;
  currency: string;
  unit: string;
  images: string[];
  specifications: Record<string, any>;
  stock: number;
  minOrder: number;
  isActive: boolean;
  isFeatured: boolean;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    storeId: {
      type: Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    subcategory: String,
    price: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "MUR",
    },
    unit: {
      type: String,
      required: true,
    },
    images: [String],
    specifications: {
      type: Map,
      of: Schema.Types.Mixed,
    },
    stock: {
      type: Number,
      default: 0,
    },
    minOrder: {
      type: Number,
      default: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

ProductSchema.index({ slug: 1, storeId: 1 });
ProductSchema.index({ category: 1 });
ProductSchema.index({ storeId: 1 });
ProductSchema.index({ isFeatured: 1 });
ProductSchema.index({ isActive: 1 });

export const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);

