import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont } from "@remotion/google-fonts/Onest";
import { loadFont as loadPlayfair } from "@remotion/google-fonts/PlayfairDisplay";
import { loadFont as loadUnbounded } from "@remotion/google-fonts/Unbounded";
import type { DisplayFont } from "../styles";

const onest = loadFont("normal", {
  weights: ["300", "400", "500", "600", "700", "800", "900"],
  subsets: ["latin", "cyrillic"],
});

const playfair = loadPlayfair("normal", { weights: ["500", "700"], subsets: ["latin", "cyrillic"] });
const playfairItalic = loadPlayfair("italic", { weights: ["500", "700"], subsets: ["latin", "cyrillic"] });

const unbounded = loadUnbounded("normal", { weights: ["500", "700", "900"], subsets: ["latin", "cyrillic"] });
const inter = loadInter("normal", { weights: ["500", "700", "800", "900"], subsets: ["latin", "cyrillic"] });
const faces = [onest, playfair, playfairItalic, unbounded, inter];

const displayFamilies: Record<DisplayFont, string> = {
  unbounded: unbounded.fontFamily,
  inter: inter.fontFamily,
};

export const serifFamily = playfair.fontFamily;

export async function fontsLoaded(): Promise<void> {
  await Promise.all(faces.map((face) => face.waitUntilDone()));
}

export function displayFamily(font: DisplayFont): string {
  return displayFamilies[font];
}

export function loadBrandFont(_family: string): { fontFamily: string } {
  return { fontFamily: onest.fontFamily };
}
