import * as React from "react";
import { cn } from "@/lib/utils";

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  size?: "default" | "lg";
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, size = "default", ...props }, ref) => (
    <input
      type="checkbox"
      ref={ref}
      className={cn(
        "shrink-0 cursor-pointer appearance-none rounded-md border border-input bg-card accent-primary transition-colors checked:border-primary checked:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        size === "default" ? "size-4" : "size-5",
        className,
      )}
      {...props}
    />
  ),
);
Checkbox.displayName = "Checkbox";

export { Checkbox };