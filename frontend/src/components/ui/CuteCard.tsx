import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  elevated?: boolean;
};

export function CuteCard({ children, className = "", elevated = false }: Props) {
  return <section className={`${elevated ? "cute-card-elevated" : "cute-card"} ${className}`}>{children}</section>;
}
