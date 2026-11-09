type DividerProps = { label: string };

export function Divider({ label }: DividerProps) {
  return (
    <div className="flex items-center gap-14 text-label font-normal text-muted">
      <span className="h-px flex-1 bg-line" />
      {label}
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}
