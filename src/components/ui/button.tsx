import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-foreground text-background hover:bg-accent hover:text-accent-foreground",
        gold:
          "bg-foreground text-background uppercase tracking-[0.18em] font-semibold hover:bg-accent gold-button-glow",
        rose:
          "bg-accent text-accent-foreground uppercase tracking-[0.18em] font-semibold hover:bg-accent/90 gold-button-glow",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-border bg-transparent hover:border-accent hover:text-accent",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/70",
        ghost:
          "hover:bg-secondary",
        link:
          "text-foreground underline-offset-4 hover:underline hover:text-accent",
      },
      size: {
        default: "h-10 px-5 rounded-full",
        sm: "h-9 px-4 rounded-full text-xs",
        lg: "h-12 px-8 rounded-full text-sm",
        xl: "h-14 px-10 rounded-full text-sm",
        icon: "h-10 w-10 rounded-full",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
