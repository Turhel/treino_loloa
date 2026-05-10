import type { ButtonHTMLAttributes, ReactNode } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

export function CuteButton({ children, className = "", variant = "secondary", ...props }: Props) {
  return <button className={`cute-button cute-button-${variant} ${className}`} {...props}>{children}</button>;
}
