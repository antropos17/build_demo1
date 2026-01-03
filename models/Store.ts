import mongoose, { Schema, Document, Model } from "mongoose";

export interface IStore extends Document {
  ownerId: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  banner?: string;
  contactInfo: {
    phone?: string;
    email?: string;
    website?: string;
  };
  address: string;
  city: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  isActive: boolean;
  workingHours?: {
    [key: string]: {
      open: string;
      close: string;
      closed?: boolean;
    };
  };
  deliveryOptions?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const StoreSchema = new Schema<IStore>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    description: String,
    logo: String,
    banner: String,
    contactInfo: {
      phone: String,
      email: String,
      website: String,
    },
    address: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    coordinates: {
      lat: Number,
      lng: Number,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    workingHours: {
      type: Map,
      of: {
        open: String,
        close: String,
        closed: Boolean,
      },
    },
    deliveryOptions: [String],
  },
  {
    timestamps: true,
  }
);

StoreSchema.index({ slug: 1 });
StoreSchema.index({ ownerId: 1 });
StoreSchema.index({ city: 1 });

export const Store: Model<IStore> =
  mongoose.models.Store || mongoose.model<IStore>("Store", StoreSchema);

