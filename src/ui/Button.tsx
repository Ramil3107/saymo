import { LoaderCircle } from "lucide-react";
import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "white" | "secondary" | "outline" | "suggestion";
type Size = "large" | "regular";
type IconSide = "start" | "end";

type LookProps = {
  variant: Variant;
  size?: Size;
  icon?: ReactNode;
  iconSide?: IconSide;
};

type ButtonProps = LookProps & { busy?: boolean } & ButtonHTMLAttributes<HTMLButtonElement>;
type ButtonLinkProps = LookProps & { href: string; children: ReactNode };

const BASE =
  "inline-flex shrink-0 items-center justify-center rounded-pill whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60";

const SOLID_SIZES: Record<Size, string> = {
  large: "h-[52px] px-[26px] text-body font-bold gap-[10px]",
  regular: "h-[44px] px-20 text-dense font-bold gap-8",
};

const LOOKS: Record<Variant, string> = {
  primary: "bg-accent text-ink hover:brightness-110",
  white: "bg-white text-ink hover:bg-muted",
  secondary:
    "h-[44px] px-[18px] gap-8 bg-raised border border-line text-dense font-normal text-white hover:bg-selected",
  outline: "h-[44px] px-16 gap-8 border border-line-strong text-small text-white hover:bg-raised",
  suggestion: "h-[44px] px-16 gap-8 bg-surface border border-line text-small text-white hover:bg-raised",
};

const STARTING_ICON_VARIANTS: Variant[] = ["secondary", "outline", "suggestion"];

const SECONDARY_ICON_SIZE = 17;
const DEFAULT_ICON_SIZE = 18;

export function Button({
  variant,
  size,
  icon,
  iconSide,
  busy,
  type = "button",
  disabled,
  className,
  children,
  ...rest
}: ButtonProps) {
  const shownIcon = busy ? <LoaderCircle className="animate-spin" size={iconSize(variant)} /> : icon;

  return (
    <button
      type={type}
      className={buttonClasses(variant, size, className)}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      {...rest}
    >
      {withIcon(children, shownIcon, iconSide ?? defaultIconSide(variant))}
    </button>
  );
}

export function ButtonLink({ variant, size, icon, iconSide, href, children }: ButtonLinkProps) {
  return (
    <Link href={href} className={buttonClasses(variant, size)}>
      {withIcon(children, icon, iconSide ?? defaultIconSide(variant))}
    </Link>
  );
}

function buttonClasses(variant: Variant, size: Size = "regular", className = "") {
  const sizing = variant === "primary" || variant === "white" ? SOLID_SIZES[size] : "";
  return `${BASE} ${sizing} ${LOOKS[variant]} ${className}`.trim();
}

function iconSize(variant: Variant) {
  return variant === "secondary" ? SECONDARY_ICON_SIZE : DEFAULT_ICON_SIZE;
}

function defaultIconSide(variant: Variant): IconSide {
  return STARTING_ICON_VARIANTS.includes(variant) ? "start" : "end";
}

function withIcon(children: ReactNode, icon: ReactNode, side: IconSide) {
  if (!icon) return children;
  if (side === "start") {
    return (
      <>
        {icon}
        {children}
      </>
    );
  }
  return (
    <>
      {children}
      {icon}
    </>
  );
}
