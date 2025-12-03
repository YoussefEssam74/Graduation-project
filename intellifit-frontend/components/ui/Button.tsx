import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-[#0b4fd4] text-white shadow-sm hover:bg-[#0b4fd4]/90 dark:bg-[#18cef2] dark:text-[#0a0c14] dark:hover:bg-[#18cef2]/90",
        destructive:
          "bg-red-500 text-white shadow-sm hover:bg-red-600 dark:bg-red-600/80 dark:hover:bg-red-600",
        outline:
          "border-2 border-[#0b4fd4] text-[#0b4fd4] bg-transparent hover:bg-[#0b4fd4]/10 dark:border-[#18cef2] dark:text-[#18cef2] dark:hover:bg-[#18cef2]/10",
        secondary:
          "bg-[#a3e221] text-gray-900 shadow-sm hover:bg-[#a3e221]/90 dark:bg-[#a3e221]/80 dark:hover:bg-[#a3e221]/70",
        ghost:
          "hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-100",
        link: "text-[#0b4fd4] underline-offset-4 hover:underline dark:text-[#18cef2]",
        primary: "bg-[#0b4fd4] text-white hover:bg-blue-600 dark:bg-[#18cef2] dark:text-[#0a0c14]",
        danger: "bg-red-500 text-white hover:bg-red-600",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        md: "h-10 px-4 py-2 text-base",
        lg: "h-12 rounded-md px-8 text-base",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
export default Button
