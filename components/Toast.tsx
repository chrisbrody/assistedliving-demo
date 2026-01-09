"use client";

interface ToastProps {
  title: string;
  message: string;
  variant?: "success" | "info" | "warning";
  onDismiss: () => void;
}

const variantStyles = {
  success: "bg-emerald-700",
  info: "bg-slate-700",
  warning: "bg-amber-600",
};

export function Toast({ title, message, variant = "info", onDismiss }: ToastProps) {
  return (
    <button
      type="button"
      onClick={onDismiss}
      className={`
        fixed bottom-4 right-4 z-50
        ${variantStyles[variant]} text-white
        px-6 py-4 rounded-xl shadow-2xl
        cursor-pointer hover:opacity-90 transition-opacity
        text-left max-w-sm
      `}
    >
      <p className="font-bold">{title}</p>
      <p className="text-sm opacity-90">{message}</p>
      <p className="text-xs opacity-70 mt-1">Click to dismiss</p>
    </button>
  );
}
