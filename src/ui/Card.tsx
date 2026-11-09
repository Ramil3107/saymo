import type { ReactNode } from "react";

type CardProps = { label?: string; children: ReactNode; className?: string };

export function Card({ label, children, className = "" }: CardProps) {
  return (
    <section
      className={`flex flex-col gap-12 rounded-panel border border-line bg-surface p-24 ${className}`.trim()}
    >
      {label ? <h2 className="text-label text-muted">{label}</h2> : null}
      {children}
    </section>
  );
}
