import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  phone?: string;
  avatar?: string;
  role: "buyer" | "seller" | "service_provider" | "admin";
  location: {
    city?: string;
    address?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  preferredLanguage: "en" | "fr" | "cr";
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    phone: String,
    avatar: String,
    role: {
      type: String,
      enum: ["buyer", "seller", "service_provider", "admin"],
      default: "buyer",
    },
    location: {
      city: String,
      address: String,
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },
    preferredLanguage: {
      type: String,
      enum: ["en", "fr", "cr"],
      default: "en",
    },
  },
  {
    timestamps: true,
  }
);

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

