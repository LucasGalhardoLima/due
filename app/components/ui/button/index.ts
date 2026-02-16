import type { VariantProps } from "class-variance-authority"
import { cva } from "class-variance-authority"

export { default as Button } from "./Button.vue"

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[1.25rem] text-sm font-semibold border border-transparent transform-gpu transition-[transform,box-shadow,background-color,color,border-color,opacity] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:transform-none motion-safe:hover:-translate-y-0.5 motion-safe:hover:[&_svg]:scale-105 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:transition-transform [&_svg]:duration-200 active:scale-[0.98] active:translate-y-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-elevation-2 hover:bg-primary/95 hover:shadow-elevation-3",
        destructive:
          "bg-destructive text-destructive-foreground shadow-elevation-2 hover:bg-destructive/90 hover:shadow-danger-glow/50",
        outline:
          "border-border bg-background shadow-sm hover:bg-secondary hover:text-secondary-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-elevation-1 hover:bg-secondary/90",
        ghost: "hover:bg-muted hover:text-foreground",
        link: "text-primary-accent underline-offset-4 hover:underline",
        glass: "backdrop-blur-xl bg-background/40 border border-border/60 shadow-glass hover:bg-background/60 text-foreground",
        success: "bg-success text-success-foreground shadow-elevation-2 hover:bg-success/90 hover:shadow-success-glow/50",
        warning: "bg-warning text-warning-foreground shadow-elevation-2 hover:bg-warning/90 hover:shadow-warning-glow/50",
        info: "bg-info text-info-foreground shadow-elevation-2 hover:bg-info/90 hover:shadow-info-glow/50",
      },
      size: {
        "default": "h-10 px-4 py-2",
        "xs": "h-8 rounded-2xl px-2.5 text-xs",
        "sm": "h-9 rounded-2xl px-3 text-xs",
        "lg": "h-11 rounded-[1.5rem] px-8",
        "icon": "h-10 w-10 rounded-2xl",
        "icon-sm": "size-9 rounded-2xl",
        "icon-lg": "size-11 rounded-[1.5rem]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export type ButtonVariants = VariantProps<typeof buttonVariants>
