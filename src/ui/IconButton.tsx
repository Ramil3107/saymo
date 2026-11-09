import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type IconButtonProps = {
  label: string;
  icon: ReactNode;
  href?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>;

const CLASSES =
  "inline-flex size-[44px] shrink-0 items-center justify-center rounded-pill border border-line bg-surface text-white hover:bg-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent [&_svg]:size-[18px]";

export function IconButton({ label, icon, href, type = "button", className = "", ...rest }: IconButtonProps) {
  if (href) {
    return (
      <Link href={href} aria-label={label} className={`${CLASSES} ${className}`.trim()}>
        {icon}
      </Link>
    );
  }
  return (
    <button type={type} aria-label={label} className={`${CLASSES} ${className}`.trim()} {...rest}>
      {icon}
    </button>
  );
}
