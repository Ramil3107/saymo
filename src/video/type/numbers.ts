// How many digits follow the decimal separator in the first number of a text: "$2.50" has two.
export function fractionDigits(text: string): number {
  return /\d[.,](\d+)/.exec(text)?.[1]?.length ?? 0;
}
