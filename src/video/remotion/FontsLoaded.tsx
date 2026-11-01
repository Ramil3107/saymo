import { type ReactNode, useEffect, useState } from "react";
import { cancelRender, continueRender, delayRender } from "remotion";
import type { LibraryFont } from "../fonts/manifest";
import { loadFonts } from "./fonts";

// Text is measured on the page and the measurement is cached, so nothing is drawn before its faces have loaded:
// a title measured in the fallback face would keep the wrong size for the whole render.
export function FontsLoaded({ fonts, children }: { fonts: LibraryFont[]; children: ReactNode }) {
  const [handle] = useState(() => delayRender("Loading fonts"));
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadFonts(fonts).then(() => setLoaded(true), cancelRender);
  }, [fonts]);
  useEffect(() => {
    if (loaded) continueRender(handle);
  }, [loaded, handle]);

  return loaded ? children : null;
}
