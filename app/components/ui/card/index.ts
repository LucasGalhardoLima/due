import type { VariantProps } from "class-variance-authority"
import { cva } from "class-variance-authority"

export { default as Card } from "./Card.vue"
export { default as CardContent } from "./CardContent.vue"
export { default as CardDescription } from "./CardDescription.vue"
export { default as CardFooter } from "./CardFooter.vue"
export { default as CardHeader } from "./CardHeader.vue"
export { default as CardTitle } from "./CardTitle.vue"

export const cardVariants = cva(
  "text-card-foreground transform-gpu transition-[transform,box-shadow,border-color,background-color,opacity] duration-300 ease-out",
  {
    variants: {
      variant: {
        // Solid variants (default for most use cases)
        default: "bg-card border border-border/80 rounded-[1.75rem] shadow-elevation-1",
        elevated: "bg-card border border-border/80 rounded-[1.75rem] shadow-elevation-3",
        // Status variants with solid tinted backgrounds
        success: "bg-success-muted border border-success/20 rounded-[1.75rem] shadow-elevation-1",
        warning: "bg-warning-muted border border-warning/20 rounded-[1.75rem] shadow-elevation-1",
        danger: "bg-danger-muted border border-danger/20 rounded-[1.75rem] shadow-elevation-1",
        info: "bg-info-muted border border-info/20 rounded-[1.75rem] shadow-elevation-1",
      },
      size: {
        sm: "p-4 rounded-3xl",
        default: "p-6 rounded-[1.75rem]",
        lg: "p-8 rounded-[2.25rem]",
      },
      interactive: {
        true: "cursor-pointer motion-safe:hover:-translate-y-0.5 hover:scale-[1.01] hover:shadow-elevation-4 hover:border-primary/35 active:scale-[0.99]",
        false: "",
      },
      glow: {
        none: "",
        success: "shadow-success-glow",
        warning: "shadow-warning-glow",
        danger: "shadow-danger-glow",
        primary: "shadow-primary-glow",
        info: "shadow-info-glow",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      interactive: false,
      glow: "none",
    },
  }
)

export type CardVariants = VariantProps<typeof cardVariants>
