export interface Motif {
  id: string;
  phrase: string;
  priority: number;
}

export interface AnalysisMoveResult {
  san: string;
  fen_after: string;
  motifs: Motif[];
  terminal?: string | null;
}

export interface EvalSideBreakdown {
  material: { mg: number; eg: number };
  psqt: { mg: number; eg: number };
  mobility: { mg: number; eg: number };
  pawns: { mg: number; eg: number };
  king_safety: { mg: number; eg: number };
  threats: { mg: number; eg: number };
  imbalance: { mg: number; eg: number };
}

export interface PieceContribution {
  square: string;
  color: string;
  role: string;
  value_cp: number;
  material: number;
  psqt: number;
  mobility: number;
  pawns: number;
  king_safety: number;
  threats: number;
  imbalance: number;
}

export interface HangingRef {
  square: string;
  role: string;
  loss_cp: number;
}

export interface PinnedRef {
  square: string;
  role: string;
  pinned_to_role: string;
  pinned_to_square: string;
  absolute: boolean;
}

export interface KingSideAnalysis {
  king_square: string;
  castled: boolean;
  castling_rights_kingside: boolean;
  castling_rights_queenside: boolean;
  pawn_shield_score: number;
  attacker_count: number;
  attackers: { square: string; role: string }[];
  open_files_to_king: string[];
  half_open_files_to_king: string[];
  weak_diagonals_to_king: string[];
  escape_squares_count: number;
  danger_score: number;
}

export interface ExplanationBlob {
  fen: string;
  side_to_move: string;
  move_number: number;
  phase: string;
  eval_cp: number;
  eval_pawns: number;
  verdict: string;
  eval_breakdown: {
    material_cp: number;
    psqt_cp: number;
    mobility_cp: number;
    pawns_cp: number;
    king_safety_cp: number;
    threats_cp: number;
    imbalance_cp: number;
  };
  material: {
    white: { pawns: number; knights: number; bishops: number; rooks: number; queens: number };
    black: { pawns: number; knights: number; bishops: number; rooks: number; queens: number };
    material_delta_cp: number;
    bishop_pair_white: boolean;
    bishop_pair_black: boolean;
    same_color_bishops: boolean;
    opposite_color_bishops: boolean;
    minor_pieces_white: number;
    minor_pieces_black: number;
    heavy_pieces_white: number;
    heavy_pieces_black: number;
    summary: string;
  };
  pawn_structure: {
    white: PawnSideAnalysis;
    black: PawnSideAnalysis;
    light_complex_weak: string | null;
    dark_complex_weak: string | null;
    iqp_white: boolean;
    iqp_black: boolean;
    hanging_pawns_white: boolean;
    hanging_pawns_black: boolean;
    summary: string;
  };
  king_safety: {
    white: KingSideAnalysis;
    black: KingSideAnalysis;
    summary: string;
  };
  activity: {
    white: ActivitySideAnalysis;
    black: ActivitySideAnalysis;
    summary: string;
  };
  line_control: {
    open_files: { file: string; controlling_side: string | null }[];
    half_open_files_white: string[];
    half_open_files_black: string[];
    long_diagonal_a1h8: string | null;
    long_diagonal_h1a8: string | null;
    rook_seventh_white: string[];
    rook_seventh_black: string[];
    seventh_rank_dominant: string | null;
  };
  tactics: {
    hanging_white: HangingRef[];
    hanging_black: HangingRef[];
    pinned_pieces: PinnedRef[];
    pieces_in_check: string | null;
  };
  endgame: {
    is_endgame: boolean;
    is_king_pawn_endgame: boolean;
    opposition: unknown;
    key_squares: unknown[];
    square_of_pawn: unknown[];
    summary: string;
  };
  themes: {
    id: string;
    side: string;
    strength: number;
    description: string;
  }[];
}

export interface PawnSideAnalysis {
  islands: number;
  doubled_files: string[];
  isolated: string[];
  backward: string[];
  passed: string[];
  supported: string[];
  holes: string[];
  majority_side: string | null;
  pawn_chains: number;
}

export interface ActivitySideAnalysis {
  total_mobility: number;
  squares_in_enemy_half: number;
  central_minor_pieces: number;
  outposts: { square: string; piece: string }[];
  bad_bishop: string | null;
  passive_pieces: string[];
  long_diagonals_controlled: string[];
}

export interface PositionAnalysis {
  fen: string;
  explanation: ExplanationBlob | null;
  pieceValues: Record<string, number>;
  hangingWhite: HangingRef[];
  hangingBlack: HangingRef[];
  kingSafety: { white: KingSideAnalysis; black: KingSideAnalysis };
}