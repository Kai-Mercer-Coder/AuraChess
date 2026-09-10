/** Square-list helpers shared by the heatmap kind modules. */
export const FILES = "abcdefgh";

export const ALL_SQUARES: string[] = [];
for (let rank = 1; rank <= 8; rank++) {
  for (const file of FILES) ALL_SQUARES.push(`${file}${rank}`);
}
