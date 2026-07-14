import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium ring-focus transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary:
          "bg-cisco-500 text-white shadow-glow hover:bg-cisco-600",
        secondary:
          "glass text-[rgb(var(--fg))] hover:bg-white/90 dark:hover:bg-white/[0.08]",
        ghost:
          "text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--fg))] hover:bg-black/5 dark:hover:bg-white/5",
        outline:
          "border border-[rgb(var(--border))] bg-transparent hover:bg-black/5 dark:hover:bg-white/5"
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-5",
        lg: "h-12 px-7 text-base"
      }
    },
    defaultVariants: { variant: "primary", size: "md" }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
);
Button.displayName = "Button";
