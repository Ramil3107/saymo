import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadUnbounded } from "@remotion/google-fonts/Unbounded";
import type { CSSProperties } from "react";
import { type Tempo, tempos } from "../../motion/tempo";

export type Palette = {
  background: string;
  ink: string;
  accent: string;
  accentAlt: string;
  highlight: string;
  surface: string;
  muted: string;
};

export type Look = {
  name: string;
  tempo: Tempo;
  palette: Palette;
  fontFamily: string;
  backdrop: CSSProperties;
};

export type DemoProps = { look: Look; width: number; height: number };

const unbounded = loadUnbounded("normal", { weights: ["500", "700", "900"], subsets: ["latin", "cyrillic"] });
const inter = loadInter("normal", { weights: ["500", "700", "800", "900"], subsets: ["latin", "cyrillic"] });

export const snapLook: Look = {
  name: "SNAP · fast, like Higgsfield",
  tempo: tempos.snap,
  fontFamily: unbounded.fontFamily,
  palette: {
    background: "#F6F4EF",
    ink: "#0A0A0D",
    accent: "#FF1E78",
    accentAlt: "#2340FF",
    highlight: "#C8FF2E",
    surface: "#FFFFFF",
    muted: "#ECE6EC",
  },
  backdrop: {
    backgroundColor: "#F6F4EF",
    backgroundImage:
      "radial-gradient(circle at 88% 8%, rgba(200,255,46,0.45), transparent 32%), radial-gradient(circle at 8% 92%, rgba(255,30,120,0.18), transparent 38%)",
  },
};

export const glideLook: Look = {
  name: "GLIDE · smooth, like motionvid",
  tempo: tempos.glide,
  fontFamily: inter.fontFamily,
  palette: {
    background: "#F1F1F4",
    ink: "#15151A",
    accent: "#4B40F0",
    accentAlt: "#1E8E4E",
    highlight: "#FF7A2F",
    surface: "#FFFFFF",
    muted: "#DCDCE4",
  },
  backdrop: {
    backgroundColor: "#F1F1F4",
    backgroundImage:
      "linear-gradient(rgba(21,21,26,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(21,21,26,0.05) 1px, transparent 1px)",
    backgroundSize: "36px 36px",
  },
};
