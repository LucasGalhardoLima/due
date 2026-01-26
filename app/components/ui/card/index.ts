import type { VariantProps } from "class-variance-authority"
import { cva } from "class-variance-authority"

export { default as Card } from "./Card.vue"
export { default as CardContent } from "./CardContent.vue"
export { default as CardDescription } from "./CardDescription.vue"
export { default as CardFooter } from "./CardFooter.vue"
export { default as CardHeader } from "./CardHeader.vue"
export { default as CardTitle } from "./CardTitle.vue"

export const cardVariants = cva(
  "text-card-foreground transition-all",
  {
    variants: {
      variant: {
        default: "backdrop-blur-2xl bg-white/5 dark:bg-black/10 border border-white/20 dark:border-white/10 rounded-2xl shadow-glass",
        elevated: "backdrop-blur-2xl bg-white/10 dark:bg-black/20 border border-white/20 dark:border-white/10 rounded-2xl shadow-elevation-4 hover:shadow-elevation-5",
        glass: "backdrop-blur-2xl bg-white/5 dark:bg-black/10 border border-white/20 dark:border-white/10 rounded-2xl shadow-glass",
        "glass-success": "backdrop-blur-2xl bg-success-muted/30 dark:bg-success-muted/10 border border-success/20 rounded-2xl shadow-glass",
        "glass-warning": "backdrop-blur-2xl bg-warning-muted/30 dark:bg-warning-muted/10 border border-warning/20 rounded-2xl shadow-glass",
        "glass-danger": "backdrop-blur-2xl bg-danger-muted/30 dark:bg-danger-muted/10 border border-danger/20 rounded-2xl shadow-glass",
        "glass-info": "backdrop-blur-2xl bg-info-muted/30 dark:bg-info-muted/10 border border-info/20 rounded-2xl shadow-glass",
        success: "bg-success-muted/20 backdrop-blur-2xl border border-success/20 rounded-2xl shadow-elevation-2",
        warning: "bg-warning-muted/20 backdrop-blur-2xl border border-warning/20 rounded-2xl shadow-elevation-2",
        danger: "bg-danger-muted/20 backdrop-blur-2xl border border-danger/20 rounded-2xl shadow-elevation-2",
        info: "bg-info-muted/20 backdrop-blur-2xl border border-info/20 rounded-2xl shadow-elevation-2",
      },
      size: {
        sm: "p-4 rounded-xl",
        default: "p-6 rounded-2xl",
        lg: "p-8 rounded-2xl",
      },
      interactive: {
        true: "cursor-pointer hover:scale-[1.02] active:scale-[0.98]",
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
