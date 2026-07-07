import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

// Verdara button. CTAs (primary/secondary) are full-pill moss/ochre per the
// design system; outline/ghost stay rounded-md because dense dashboard
// controls (table rows, forms) read as controls, not CTAs — a deliberate
// adaptation of Verdara's "everything is a pill" rule to a working app.
// Focus halo is the ochre 3px bloom (Verdara focus ring).
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-semibold tracking-wide transition-colors duration-100 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:[box-shadow:0_0_0_3px_rgba(242,178,51,0.55)]",
  {
    variants: {
      variant: {
        primary: "rounded-full bg-moss text-parchment hover:bg-deep-loam",
        secondary: "rounded-full bg-ochre text-moss hover:brightness-95",
        outline:
          "rounded-md border border-hairline bg-surface text-foreground hover:bg-surface-hover hover:border-moss/40",
        ghost: "rounded-md text-moss hover:bg-moss/5 hover:text-deep-loam",
      },
      size: {
        sm: "h-9 px-3 text-xs",
        icon: "size-9 p-0",
        default: "h-11 px-5 text-sm",
        lg: "h-12 px-6 text-sm",
      },
    },
    defaultVariants: { variant: "primary", size: "default" },
  },
);

export function Button({
  variant,
  size,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export type ButtonVariants = VariantProps<typeof buttonVariants>;
