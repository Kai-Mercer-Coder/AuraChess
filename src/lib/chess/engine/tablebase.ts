/**
 * Lichess endgame tablebase client.
 *
 * Perfect-play evaluation for positions with ≤7 pieces. Returns a synthetic
 * `eval`/`mate`-style result (win = +100, loss = -100, mate = DTM) so the rest
 * of the review pipeline can treat it like a normal Stockfish output.
 * Falls back to `null` for draws / unknown / unreachable positions.
 */
export async function fetchTablebase(fen: string): Promise<{
  eval: number;
  mate: number | null;
  bestmove: string;
  continuationArr: string[];
  winChance: number;
  category: string;
} | null> {
  try {
    const encoded = encodeURIComponent(fen);
    const response = await fetch(
      `https://tablebase.lichess.ovh/standard?fen=${encoded}`,
      {
        signal: AbortSignal.timeout(5000),
      },
    );

    if (!response.ok) return null;

    const data = await response.json();
    if (!data) return null;

    if (
      data.category === "draw" ||
      data.stalemate ||
      data.insufficient_material
    ) {
      return {
        eval: 0,
        mate: null,
        bestmove: "",
        continuationArr: [],
        winChance: 50,
        category: "draw",
      };
    }

    if (data.checkmate) {
      const side = fen.includes(" w ") ? -1 : 1;
      return {
        eval: side * 100,
        mate: 0,
        bestmove: "",
        continuationArr: [],
        winChance: side > 0 ? 100 : 0,
        category: "checkmate",
      };
    }

    // Pick a winning move (with a known mate distance) when possible, else the
    // first returned move. `dtm` = depth-to-mate in full moves.
    const bestMove =
      data.moves?.find((m: any) =>
        data.category === "win"
          ? m.category === "win" && m.dtm !== null
          : m.category === "loss" && m.dtm !== null,
      ) || data.moves?.[0];

    if (!bestMove || bestMove.dtm === null || bestMove.dtm === undefined)
      return null;

    const mateValue = data.category === "win" ? bestMove.dtm : -bestMove.dtm;
    const sign = data.category === "win" ? 1 : -1;

    return {
      eval: sign * 100,
      mate: mateValue,
      bestmove: bestMove.uci || "",
      continuationArr: [],
      winChance: data.category === "win" ? 100 : 0,
      category: data.category,
    };
  } catch {
    return null;
  }
}