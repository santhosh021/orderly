/** Formats a number as Indian rupees, e.g. 15999 -> "₹15,999". */
export function money(value: number): string {
  return `₹${value.toLocaleString('en-IN')}`;
}
