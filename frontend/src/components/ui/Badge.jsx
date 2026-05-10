import { cn } from "@/lib/utils"

const badgeVariants = {
  variant: {
    default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
    secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
    destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
    outline: "text-foreground",
    success: "border-transparent bg-green-100 text-green-800 hover:bg-green-100/80",
    warning: "border-transparent bg-amber-100 text-amber-800 hover:bg-amber-100/80",
    danger: "border-transparent bg-red-100 text-red-800 hover:bg-red-100/80",
  },
}

function Badge({ className, variant = "default", ...props }) {
  const variantClass = badgeVariants.variant[variant] || badgeVariants.variant.default
  
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        variantClass,
        className
      )}
      {...props}
    />
  )
}

export { Badge }
