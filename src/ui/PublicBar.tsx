import type { ReactNode } from "react";

type PublicBarProps = { logo: ReactNode; children?: ReactNode };

export function PublicBar({ logo, children }: PublicBarProps) {
  return (
    <header className="flex items-center justify-between px-16 py-20 sm:px-32">
      {logo}
      {children ? <div className="flex items-center gap-8">{children}</div> : null}
    </header>
  );
}
