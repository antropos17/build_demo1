"use client";

import * as React from "react";
import { X, CheckCircle2, Info, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "info";
  onClose: () => void;
}

export function Toast({ message, type = "success", onClose }: ToastProps) {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: CheckCircle2,
    error: AlertCircle,
    info: Info,
  };

  const Icon = icons[type];

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-lg border bg-white p-4 shadow-lg animate-in slide-in-from-bottom-5",
        type === "success" && "border-green-200 bg-green-50",
        type === "error" && "border-red-200 bg-red-50",
        type === "info" && "border-blue-200 bg-blue-50"
      )}
    >
      <Icon
        className={cn(
          "h-5 w-5",
          type === "success" && "text-green-600",
          type === "error" && "text-red-600",
          type === "info" && "text-blue-600"
        )}
      />
      <p
        className={cn(
          "text-sm font-medium",
          type === "success" && "text-green-800",
          type === "error" && "text-red-800",
          type === "info" && "text-blue-800"
        )}
      >
        {message}
      </p>
      <button
        onClick={onClose}
        className="ml-2 text-gray-400 hover:text-gray-600"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<
    Array<{ id: string; message: string; type: "success" | "error" | "info" }>
  >([]);

  const showToast = (
    message: string,
    type: "success" | "error" | "info" = "success"
  ) => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  React.useEffect(() => {
    (window as any).showToast = showToast;
    return () => {
      delete (window as any).showToast;
    };
  }, []);

  return (
    <>
      {children}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </>
  );
}




