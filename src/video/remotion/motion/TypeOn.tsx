import type { Tempo } from "../../motion/tempo";
import { blink, lettersShown } from "../../motion/timeline";
import { useMs } from "./Move";

type Props = { text: string; atMs: number; tempo: Tempo; caretColor?: string };

const caretWidthEm = 0.07;

export function TypeOn({ text, atMs, tempo, caretColor }: Props) {
  const ms = useMs();
  const shown = lettersShown(ms, atMs, text.length, tempo.letterMs);
  const typing = shown < text.length;

  return (
    <span style={{ whiteSpace: "pre" }}>
      {text.slice(0, shown)}
      {caretColor ? <Caret color={caretColor} visible={typing || blink(ms, tempo.blinkMs)} /> : null}
      <span style={{ color: "transparent" }}>{text.slice(shown)}</span>
    </span>
  );
}

function Caret({ color, visible }: { color: string; visible: boolean }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: `${caretWidthEm}em`,
        height: "0.9em",
        marginRight: `-${caretWidthEm}em`,
        verticalAlign: "-0.08em",
        backgroundColor: visible ? color : "transparent",
      }}
    />
  );
}
