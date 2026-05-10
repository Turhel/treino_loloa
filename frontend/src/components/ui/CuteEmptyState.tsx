import type { ReactNode } from "react";

type Props = {
  icon?: ReactNode;
  title: string;
  description?: string;
  className?: string;
};

export function CuteEmptyState({ icon, title, description, className = "" }: Props) {
  return (
    <div className={`cute-empty ${className}`}>
      {icon && <div className="cute-empty-icon">{icon}</div>}
      <h3>{title}</h3>
      {description && <p>{description}</p>}
    </div>
  );
}
