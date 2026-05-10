import type { InputHTMLAttributes } from "react";

export function CuteInput({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`cute-input ${className}`} {...props} />;
}
