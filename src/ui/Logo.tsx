import Link from "next/link";

type LogoProps = { href: string; name: string };

export function Logo({ href, name }: LogoProps) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-[44px] items-center gap-8 text-[17px] font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <span aria-hidden="true" className="size-[22px] rounded-pill bg-accent" />
      {name}
    </Link>
  );
}
