import { HTMLAttributes, forwardRef } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "bordered";
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = "", variant = "default", ...props }, ref) => {
    const baseStyles = "rounded-xl p-6";
    const variants = {
      default: "bg-[#161616]",
      bordered: "bg-[#161616] border border-[#262626]",
    };

    return (
      <div ref={ref} className={`${baseStyles} ${variants[variant]} ${className}`} {...props} />
    );
  }
);

Card.displayName = "Card";
