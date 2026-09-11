/**
 * Built-in sample games for the landing page.
 *
 * Shown as pickable cards (2 random at a time) so visitors can try a review
 * without hunting down a PGN. Each entry carries display metadata plus the
 * full PGN text loaded into the form on pick.
 */
export interface SampleGame {
  id: string;
  event: string;
  white: string;
  black: string;
  result: string;
  pgn: string;
}

export const SAMPLE_GAMES: SampleGame[] = [
  {
    id: "morphy-thompson-1857",
    event: "Morphy vs Thompson · New York 1857",
    white: "Paul Morphy",
    black: "Thompson",
    result: "1-0",
    pgn: `[Event "Paul Morphy - Thompson (1857.??.??)"]
[Site "New York (USA)"]
[Date "1857.??.??"]
[Round "?"]
[White "Paul Morphy"]
[Black "Thompson"]
[Result "1-0"]
[TimeControl ""]
[Link "https://www.chess.com/games/view/635"]

1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 e6 5. Be3 Be7 6. Nc3 h6 7. Bd3 d5 8. Bb5
Bd7 9. exd5 exd5 10. Nxd5 Nf6 11. Nxf6+ Bxf6 12. c3 O-O 13. O-O Qc7 14. Qa4 Rfe8
15. Rad1 Re4 16. Bxc6 Bxc6 17. Qc2 Be5 18. g3 Bxd4 19. cxd4 Qe7 20. d5 Bd7 21.
Bc5 Rc8 22. Bxe7 Rxc2 23. Ba3 b5 24. Rfe1 f5 25. f3 Rxe1+ 26. Rxe1 Rd2 27. d6 a5
28. Bc5 b4 29. Re7 Rd5 30. Bxb4 axb4 31. Rxd7 Kf8 32. Rb7 Rd4 33. Kf2 Rxd6 34.
Rxb4 Rd2+ 35. Ke3 Rxh2 36. a4 Rc2 37. a5 Rc5 38. Ra4 Ke7 39. b4 Rc8 40. b5 Rb8
41. a6 Kd7 42. b6 Kc6 43. b7 Kb6 44. a7 Re8+ 45. Kf4 Kxb7 46. a8=Q+ Rxa8 47.
Rxa8 Kxa8 48. Kxf5 1-0`,
  },
  {
    id: "anderssen-morphy-1858",
    event: "Anderssen vs Morphy · Paris 1858",
    white: "Adolf Anderssen",
    black: "Paul Morphy",
    result: "0-1",
    pgn: `[Event "Anderssen - Morphy"]
[Site "Paris FRA"]
[Date "1858.12.20"]
[EventDate "1858.12.20"]
[Round "1"]
[Result "0-1"]
[White "Adolf Anderssen"]
[Black "Paul Morphy"]
[ECO "C52"]
[WhiteElo "?"]
[BlackElo "?"]
[Source "Illustrated London News, 1859.01.01, p.19"]
[PlyCount "144"]

1.e4 e5 2.Nf3 Nc6 3.Bc4 Bc5 4.b4 Bxb4 5.c3 Ba5 6.d4 exd4 7.O-O
Nf6 8.e5 d5 9.Bb5 Ne4 10.cxd4 O-O 11.Bxc6 bxc6 12.Qa4 Bb6
13.Qxc6 Bg4 14.Bb2 Bxf3 15.gxf3 Ng5 16.Nd2 Re8 17.Kh1 Nh3
18.f4 Qh4 19.Qxd5 Nxf2+ 20.Kg1 Nd3 21.Bc3 Nxf4 22.Qf3 Nh3+
23.Kh1 Ng5 24.Qg2 Rad8 25.Rg1 h6 26.Raf1 Qh3 27.Qc6 Qd7 28.Qg2
Bxd4 29.Bxd4 Qxd4 30.Nf3 Qd5 31.h4 Ne6 32.Qg4 Qc6 33.Rg2 Rd3
34.Qf5 Red8 35.Qf6 Qd5 36.Qf5 Rd1 37.Rxd1 Qxd1+ 38.Kh2 Rd3
39.Rf2 Re3 40.Nd2 Re2 41.Qxf7+ Kh8 42.Ne4 Rxf2+ 43.Nxf2 Qd5
44.Ng4 Qxa2+ 45.Kg3 Qb3+ 46.Kh2 Qc2+ 47.Kg3 Qc3+ 48.Kh2 Qc6
49.h5 a5 50.Nf6 gxf6 51.Qxf6+ Kg8 52.Qg6+ Kf8 53.Qxh6+ Ke8
54.Qg6+ Kd7 55.h6 Qd5 56.h7 Qxe5+ 57.Kg1 Ng5 58.h8=Q Qxh8
59.Qxg5 Qd4+ 60.Kf1 a4 61.Qf5+ Kc6 62.Qc8 Kb5 63.Ke1 c5
64.Qb7+ Kc4 65.Qf7+ Kc3 66.Qf3+ Qd3 67.Qf6+ Kb3 68.Qb6+ Kc2
69.Qa7 Qc3+ 70.Ke2 a3 71.Qa4+ Kb2 72.Qb5+ Qb3 0-1`,
  },
  {
    id: "tolosa-carbo-1898",
    event: "Tolosa vs Carbo · Barcelona 1898",
    white: "Jose Tolosa Carreras",
    black: "Joan Carbo i Batlle",
    result: "1-0",
    pgn: `[Event "Barcelona"]
[Site "Barcelona ESP"]
[Date "1898.??.??"]
[EventDate "?"]
[Round "?"]
[Result "1-0"]
[White "Jose Tolosa Carreras"]
[Black "Joan Carbo i Batlle"]
[ECO "C28"]
[WhiteElo "?"]
[BlackElo "?"]
[PlyCount "37"]

1.e4 e5 2.Nc3 Nf6 3.f4 Bb4 4.Bc4 Bxc3 5.bxc3 d5 6.exd5 Nxd5 7.Qf3 Nxf4 8.Ba3
Nxg2+ 9.Qxg2 Qh4+ 10.Qg3 Qxc4 11.Qxg7 Qe4+ 12.Kf2 Qxh1 13.Nf3 Qxa1 14.Qxh8+ Kd7 15.Nxe5+ Ke6
16.Qe8+ Kd5 17.Qxf7+ Be6 18.Qf3+ Kxe5 19.d4# 1-0`,
  },
  {
    id: "mcroitor-chinagr-2026",
    event: "mcroitor vs chinagr · Chess.com 2026",
    white: "mcroitor (1765)",
    black: "chinagr (1765)",
    result: "0-1",
    pgn: `[Event "Live Chess"]
[Site "Chess.com"]
[Date "2026.09.11"]
[Round "?"]
[White "mcroitor"]
[Black "chinagr"]
[Result "0-1"]
[TimeControl "120+1"]
[WhiteElo "1765"]
[BlackElo "1765"]
[Termination "chinagr won by resignation"]
[ECO "A28"]
[EndTime "10:15:03 GMT+0000"]
[Link "https://chess.com"]

1. c4 e5 2. Nc3 Nf6 3. Nf3 Nc6 4. d4 exd4 5. Nxd4 Bc5 6. Nxc6 bxc6 7. e4 d6 8. Be2 O-O 9. O-O Be6 10. b3 Bb4 11. Bb2 Bxc3 12. Bxc3 Nxe4 13. Bb2 Qg5 14. Bf3 d5 15. Bxe4 dxe4 16. Kh1 Rfd8 17. Qe2 Qh4 18. Rae1 Bf5 19. f3 exf3 20. Rxf3 Bg4`,
  },
];

/** Draw `count` distinct random samples from the built-in list. */
export function pickRandomSamples(count: number): SampleGame[] {
  const pool = [...SAMPLE_GAMES];
  const out: SampleGame[] = [];
  while (out.length < Math.min(count, pool.length)) {
    out.push(...pool.splice(Math.floor(Math.random() * pool.length), 1));
  }
  return out;
}
