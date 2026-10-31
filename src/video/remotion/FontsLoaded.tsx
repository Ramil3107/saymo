import { type ReactNode, useEffect, useState } from "react";
import { continueRender, delayRender } from "remotion";
import { fontsLoaded } from "./fonts";

// Text is measured on the page and the measurement is cached, so nothing is drawn before every face has loaded:
// a title measured in the fallback face would keep the wrong size for the whole render.
export function FontsLoaded({ children }: { children: ReactNode }) {
  const [handle] = useState(() => delayRender("Loading fonts"));
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fontsLoaded().then(() => setLoaded(true));
  }, []);
  useEffect(() => {
    if (loaded) continueRender(handle);
  }, [loaded, handle]);

  return loaded ? children : null;
}
