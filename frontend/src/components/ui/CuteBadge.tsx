import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  tone?: "pink" | "lavender" | "mint" | "peach" | "blue" | "neutral";
  title?: string;
};

export function CuteBadge({ children, className = "", tone = "neutral", title }: Props) {
  return <span title={title} className={`cute-badge cute-badge-${tone} ${className}`}>{children}</span>;
}
