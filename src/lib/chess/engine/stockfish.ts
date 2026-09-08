import { Chess } from "chess.js";
import type { EngineClient } from "@/lib/types/Engine";
import BaseStockfishEngine from "./base";

/**
 * Play-mode bot engine (WASM Stockfish).
 *
 * Runs a single worker with limited strength (UCI_LimitStrength) and returns
 * its chosen move for the current position. `getNextMove` resolves with the
 * best move SAN once the worker reports `bestmove`.
 */
export class StockfishEngine extends BaseStockfishEngine implements EngineClient {
  private bestMove: string | null = null;
  private moveResolver: ((move: string | null) => void) | null = null;
  private elo: number;

  constructor(
    stockfishPath = "/stockfish/stockfish-18-lite-single.js",
    elo = 1350,
  ) {
    super(stockfishPath);
    this.elo = elo;
  }

  protected handleMessage(event: MessageEvent) {
    const message = event.data;

    if (message === "uciok") {
      this.isReady = true;
      this.updateConfiguration();
    }

    if (message === "readyok") {
      this.isReady = true;
    }

    if (message.startsWith("bestmove")) {
      const parts = message.split(" ");
      this.bestMove = parts[1] || null;
      if (this.moveResolver) {
        this.moveResolver(this.bestMove);
        this.moveResolver = null;
      }
    }
  }

  private updateConfiguration() {
    this.postCommand("setoption name UCI_LimitStrength value true");
    this.postCommand(
      `setoption name UCI_Elo value ${Math.max(250, Math.min(3190, this.elo))}`,
    );
  }

  async getNextMove(
    chessGame: Chess,
    moveTime?: number,
  ): Promise<string | null> {
    if (!this.worker || chessGame.isGameOver()) return null;

    const moves = chessGame.moves({ verbose: true });
    if (moves.length === 0) return null;
    if (moves.length === 1) return moves[0].san;

    return new Promise((resolve) => {
      this.moveResolver = resolve;
      this.bestMove = null;
      const tme = moveTime ?? Math.ceil(Math.random() * 3000);
      this.postCommand(`position fen ${chessGame.fen()}`);
      this.postCommand(`go movetime ${tme}`);
    });
  }

  setElo(elo: number) {
    this.elo = Math.max(250, Math.min(3190, elo));
    this.updateConfiguration();
  }

  getElo(): number {
    return this.elo;
  }
}
