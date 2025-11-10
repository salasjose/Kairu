export const GRID_TEXT = `
S O S T E N I B I L I D A D #
# # # R E U T I L I Z A R # #
D E S A R R O L L O # # # C #
# C # N # # # # # # # R # O #
# O # S # # # # # # # E # N R
# N # F # # # # # # # S # C E
# O # O # # # # # # # I # I C
# M # R # # # # # # # L # E I
# I # M # # # # # # # I # N C
# A # A # # # # # # # E # C L
# # E C O E F I C I E N C I A
# # # I # # # # # # # C # A J
# # # O # # # # # # # I # # E
# R E N O V A B L E # A # # #
# # # # # # # # # # # # # # #
`.trim();

export function parseGrid(text: string): string[][] {
  const rows = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const grid = rows.map(r =>
    r.split(/\s+/).map(s => (s === "#" ? "#" : s.toUpperCase()))
  );
  // normaliza a 15x15
  const R = 15, C = 15;
  for (let i = 0; i < grid.length; i++) {
    if (grid[i].length < C) grid[i].push(...Array(C - grid[i].length).fill("#"));
    if (grid[i].length > C) grid[i] = grid[i].slice(0, C);
  }
  while (grid.length < R) grid.push(Array(C).fill("#"));
  if (grid.length > R) grid.length = R;
  return grid;
}
