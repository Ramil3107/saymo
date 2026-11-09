import Image from "next/image";

type AvatarProps = { name: string; image: string | null; size: "large" | "small" };

const SIZES = {
  large: "size-[64px] text-card-title",
  small: "size-[36px] text-small",
};

const AVATAR_SIZES = { large: "64px", small: "36px" };

export function Avatar({ name, image, size }: AvatarProps) {
  const classes = `inline-flex shrink-0 items-center justify-center overflow-hidden rounded-pill bg-raised font-semibold text-white ${SIZES[size]}`;

  if (image) {
    return (
      <span className={`relative ${classes}`}>
        <Image src={image} alt="" fill unoptimized sizes={AVATAR_SIZES[size]} className="object-cover" />
      </span>
    );
  }
  return (
    <span aria-hidden="true" className={classes}>
      {name.charAt(0).toUpperCase()}
    </span>
  );
}
