import type { ReactNode } from "react";

type Props = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
};

export function CuteSectionHeader({ eyebrow, title, description, action }: Props) {
  return (
    <div className="cute-section-header">
      <div>
        {eyebrow && <p className="cute-eyebrow">{eyebrow}</p>}
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}
