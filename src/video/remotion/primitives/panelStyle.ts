// A panel is solid over most of its depth and fades out at the far edge, so the footage behind it shows through.
export function fadedPanel(color: string, direction: string, solidShare: number): string {
  return `linear-gradient(${direction}, ${color} 0%, ${color} ${solidShare}%, ${transparent(color)} 100%)`;
}

function transparent(color: string): string {
  return /^#[0-9a-f]{6}$/i.test(color) ? `${color}00` : "transparent";
}
