import { ButtonHTMLAttributes, forwardRef, ElementType } from "react";
import { cln } from "../utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  as?: ElementType;
  variant?: "primary" | "secondary" | "accent" | "danger" | "ghost" | "outline";
  size?: "sm" | "md" | "lg" | "xl";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  href?: string;
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      as: Component = "button",
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      href,
      fullWidth = false,
      ...props
    },
    ref
  ) => {
    const baseClasses =
      "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]";

    const variantClasses = {
      primary:
        "bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 shadow-md hover:shadow-lg",
      secondary:
        "bg-secondary-600 text-white hover:bg-secondary-700 active:bg-secondary-800 shadow-md hover:shadow-lg",
      accent:
        "bg-accent-500 text-white hover:bg-accent-600 active:bg-accent-700 shadow-md hover:shadow-lg",
      danger:
        "bg-red-500 text-white hover:bg-red-600 active:bg-red-700 shadow-md hover:shadow-lg",
      outline:
        "border-2 border-primary-600 text-primary-600 hover:bg-primary-50 active:bg-primary-100",
      ghost: "text-neutral-600 hover:bg-neutral-100 active:bg-neutral-200",
    };

    const sizeClasses = {
      sm: "px-3 py-2 text-sm min-h-[2rem]",
      md: "px-4 py-2.5 text-base min-h-[2.5rem]",
      lg: "px-6 py-3 text-lg min-h-[3rem]",
      xl: "px-8 py-4 text-xl min-h-[3.5rem]",
    };

    const widthClasses = fullWidth ? "w-full" : "";

    const classes = cln(
      baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      widthClasses,
      className
    );

    // Handle Link component or external links
    if (href && Component === "button") {
      Component = "a";
    }

    const buttonProps = href ? { href, ...props } : props;

    return (
      <Component
        ref={ref}
        className={classes}
        disabled={disabled || isLoading}
        {...buttonProps}
      >
        {isLoading ? (
          <div className="w-5 h-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
          </>
        )}
      </Component>
    );
  }
);

Button.displayName = "Button";

export default Button;
