import type { VariantProps } from "class-variance-authority"
import { cva } from "class-variance-authority"

export { default as Button } from "./Button.vue"

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-elevation-2 hover:bg-primary/90 hover:shadow-primary-glow/50",
        destructive:
          "bg-destructive text-destructive-foreground shadow-elevation-2 hover:bg-destructive/90 hover:shadow-danger-glow/50",
        outline:
          "border border-border bg-background shadow-sm hover:bg-muted hover:text-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-muted hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        glass: "backdrop-blur-xl bg-white/10 dark:bg-black/20 border border-white/20 dark:border-white/10 shadow-glass hover:bg-white/20 dark:hover:bg-black/30 text-foreground",
        success: "bg-success text-success-foreground shadow-elevation-2 hover:bg-success/90 hover:shadow-success-glow/50",
        warning: "bg-warning text-warning-foreground shadow-elevation-2 hover:bg-warning/90 hover:shadow-warning-glow/50",
        info: "bg-info text-info-foreground shadow-elevation-2 hover:bg-info/90 hover:shadow-info-glow/50",
      },
      size: {
        "default": "h-10 px-4 py-2",
        "xs": "h-8 rounded-md px-2.5 text-xs",
        "sm": "h-9 rounded-lg px-3 text-xs",
        "lg": "h-11 rounded-lg px-8",
        "icon": "h-10 w-10",
        "icon-sm": "size-9",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export type ButtonVariants = VariantProps<typeof buttonVariants>
