type Props = {
  value: number;
  className?: string;
};

export function CuteProgressBar({ value, className = "" }: Props) {
  const percent = Math.max(0, Math.min(100, value));
  return (
    <div className={`cute-progress ${className}`}>
      <div className="cute-progress-fill" style={{ width: `${percent}%` }} />
    </div>
  );
}
