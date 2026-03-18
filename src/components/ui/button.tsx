import { type ButtonHTMLAttributes, type ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "cta";

const variants: Record<Variant, string> = {
  primary:
    "bg-[#1B3C87] text-white font-semibold hover:bg-[#142D6B]",
  cta:
    "bg-[#E31B23] text-white font-semibold hover:bg-[#C8101E]",
  secondary:
    "bg-[#FFFFFF] text-[#374151] border border-[#CBD5E1] hover:bg-[#F5F7FA] hover:border-[#1B3C87]",
  ghost:
    "text-[#1B3C87] hover:bg-[rgba(27,60,135,0.08)]",
  danger:
    "bg-[rgba(239,68,68,0.2)] text-[#EF4444] hover:bg-[rgba(239,68,68,0.3)]",
};

export function Button({
  children,
  variant = "primary",
  className = "",
  loading = false,
  ...props
}: {
  children: ReactNode;
  variant?: Variant;
  className?: string;
  loading?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`rounded-full px-6 py-3 text-sm min-h-[44px] transition-all active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3C87] focus-visible:ring-offset-2 ${variants[variant]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
