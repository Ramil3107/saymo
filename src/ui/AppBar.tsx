import type { ReactNode } from "react";

type AppBarProps = { logo: ReactNode; children: ReactNode };

export function AppBar({ logo, children }: AppBarProps) {
  return (
    <header className="flex items-center justify-between px-16 py-20 sm:px-32">
      {logo}
      <nav className="flex items-center gap-8">{children}</nav>
    </header>
  );
}
