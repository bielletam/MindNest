import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "accent" | "ghost" | "outline" | "pill";
  size?: "sm" | "md";
  children: ReactNode;
}

const base =
  "inline-flex items-center justify-center gap-2 font-sans font-semibold cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed";

const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
  accent:
    "text-white rounded-xl border-none shadow-[0_3px_12px_var(--mn-accent-ring)]",
  ghost: "bg-transparent border-none text-[var(--mn-text-2)] rounded-xl hover:bg-[var(--mn-surface-2)]",
  outline:
    "bg-[var(--mn-surface-2)] border border-[var(--mn-border-2)] text-[var(--mn-text-2)] rounded-full hover:bg-[var(--mn-surface-3)]",
  pill: "bg-[var(--mn-surface-2)] border border-[var(--mn-border-2)] text-[#cbd5e1] rounded-full hover:bg-[var(--mn-surface-3)]",
};

const sizes: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "text-[12.5px] px-3 py-1.5",
  md: "text-[13.5px] px-4 py-2",
};

export function Button({
  variant = "ghost",
  size = "md",
  className = "",
  style,
  children,
  ...rest
}: ButtonProps) {
  const isAccent = variant === "accent";
  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      style={
        isAccent
          ? { background: "var(--mn-accent-grad)", ...style }
          : style
      }
      {...rest}
    >
      {children}
    </button>
  );
}
