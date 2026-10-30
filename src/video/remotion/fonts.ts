import { loadFont } from "@remotion/google-fonts/Onest";
import { loadFont as loadPlayfair } from "@remotion/google-fonts/PlayfairDisplay";

const onest = loadFont("normal", {
  weights: ["300", "400", "500", "600", "700", "800", "900"],
  subsets: ["latin", "cyrillic"],
});

const playfair = loadPlayfair("normal", { weights: ["500", "700"], subsets: ["latin", "cyrillic"] });

loadPlayfair("italic", { weights: ["500", "700"], subsets: ["latin", "cyrillic"] });

export const serifFamily = playfair.fontFamily;

export function loadBrandFont(_family: string): { fontFamily: string } {
  return { fontFamily: onest.fontFamily };
}
