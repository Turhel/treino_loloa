export function RestControls({ onAdd, onSkip }: { onAdd: (seconds: number) => void; onSkip: () => void }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <button type="button" onClick={() => onAdd(30)} className="cute-button cute-button-secondary">+30s</button>
      <button type="button" onClick={() => onAdd(60)} className="cute-button cute-button-secondary">+1min</button>
      <button type="button" onClick={onSkip} className="cute-button cute-button-primary">Pular</button>
    </div>
  );
}
