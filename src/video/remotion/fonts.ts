import { loadFont } from "@remotion/google-fonts/Onest";

const onest = loadFont("normal", {
  weights: ["500", "700", "800"],
  subsets: ["latin", "cyrillic"],
});

export function loadBrandFont(_family: string): { fontFamily: string } {
  return { fontFamily: onest.fontFamily };
}
