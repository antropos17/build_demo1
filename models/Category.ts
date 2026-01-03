import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICategory extends Document {
  name: {
    en: string;
    fr: string;
    cr: string;
  };
  slug: string;
  icon?: string;
  parentId?: mongoose.Types.ObjectId;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: {
      en: { type: String, required: true },
      fr: { type: String, required: true },
      cr: { type: String, required: true },
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    icon: String,
    parentId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

CategorySchema.index({ slug: 1 });
CategorySchema.index({ parentId: 1 });

export const Category: Model<ICategory> =
  mongoose.models.Category ||
  mongoose.model<ICategory>("Category", CategorySchema);

