import type { Palette } from "../../style/palette";
import type { Frame } from "../theme";

// What every backdrop look draws from: the palette, the frame it fills and the video's time.
export type LookProps = { palette: Palette; frame: Frame; ms: number };
