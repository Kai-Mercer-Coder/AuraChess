import type { LocalEvalResult } from "./types";

/**
 * Standalone single-worker WASM Stockfish for the review pipeline.
 *
 * Unlike `StockfishEngine` (play bot) this one is driven imperatively:
 * call `evaluateToDepth(fen, d)` or `evaluatePosition(fen, ms)` and await the
 * result for that exact position. Runs `MultiPV` lines, optionally reporting
 * incremental updates via `onUpdate` as the search deepens, and auto-restarts
 * the worker with backoff if the WASM binary crashes.
 */
export class LocalStockfishEvalEngine {
  private worker: Worker | null = null;
  private ready = false;
  private evalResolve: ((result: LocalEvalResult) => void) | null = null;
  private evalUpdate: ((result: LocalEvalResult) => void) | null = null;
  private currentFen = "";
  private multiPvCount = 1;
  private maxDepth = 18;
  private minReportDepth = 8;
  private lines: Map<
    number,
    { eval: number; mate: number | null; pv: string[]; depth: number }
  > = new Map();
  private lastCp = 0;
  private lastMate: number | null = null;
  private lastDepth = 0;
  private lastPv: string[] = [];
  private restartBackoff = 0;

  constructor() {
    this.startWorker();
  }

  private startWorker() {
    try {
      this.restartBackoff = Math.min(this.restartBackoff + 1, 5);
      this.worker?.terminate();
      this.ready = false;
      this.worker = new Worker("/stockfish/stockfish-18-lite-single.js");
      this.worker.onmessage = this.handleMessage.bind(this);
      this.worker.onerror = (ev) => {
        const msg = ev.message || ev.error?.message || "unknown";
        console.error("Stockfish worker error:", msg);
        if (this.restartBackoff < 5) {
          setTimeout(() => this.startWorker(), this.restartBackoff * 2000);
        }
      };
      this.worker.postMessage("uci");
    } catch (err) {
      console.error("Failed to load local Stockfish:", err);
    }
  }

  setMultiPV(n: number) {
    this.multiPvCount = Math.max(1, Math.min(10, n));
    if (this.ready) {
      this.worker?.postMessage(
        "setoption name MultiPV value " + this.multiPvCount,
      );
    }
  }

  setMaxDepth(d: number) {
    this.maxDepth = d;
  }

  private report() {
    if (!this.evalUpdate) return;
    const sorted = Array.from(this.lines.entries())
      .sort(([a], [b]) => a - b)
      .map(([, v]) => v);
    this.evalUpdate({
      fen: this.currentFen,
      eval:
        this.lastMate !== null
          ? this.lastMate > 0
            ? 100
            : -100
          : this.lastCp / 100,
      mate: this.lastMate,
      bestmove: this.lastPv[0] ?? "",
      depth: this.lastDepth,
      pv: this.lastPv,
      multiPv: sorted,
    });
  }

  private handleMessage(e: MessageEvent) {
    const msg = e.data as string;
    if (!msg) return;

    if (msg === "uciok" && !this.ready) {
      this.ready = true;
      this.worker?.postMessage(
        "setoption name MultiPV value " + this.multiPvCount,
      );
      this.worker?.postMessage("isready");
      return;
    }

    if (msg === "readyok") {
      this.ready = true;
      this.restartBackoff = 0;
      return;
    }

    if (msg.startsWith("info")) {
      const parts = msg.split(" ");
      let cp = 0;
      let mate: number | null = null;
      let depth = 0;
      let pvLine: string[] = [];
      let multiPvIndex = 1;
      let hasScore = false;

      for (let i = 0; i < parts.length; i++) {
        if (parts[i] === "multipv" && i + 1 < parts.length) {
          multiPvIndex = parseInt(parts[i + 1], 10) || 1;
        }
        if (parts[i] === "depth" && i + 1 < parts.length) {
          depth = parseInt(parts[i + 1], 10) || 0;
        }
        if (parts[i] === "score" && i + 2 < parts.length) {
          hasScore = true;
          if (parts[i + 1] === "cp" && i + 2 < parts.length) {
            cp = parseInt(parts[i + 2], 10) || 0;
            mate = null;
          } else if (parts[i + 1] === "mate" && i + 2 < parts.length) {
            mate = parseInt(parts[i + 2], 10) || 0;
          }
        }
        if (parts[i] === "pv") {
          pvLine = parts
            .slice(i + 1)
            .filter((m: string) => m.length >= 4 && m.length <= 5);
        }
      }

      if (hasScore) {
        if (multiPvIndex === 1) {
          this.lastCp = cp;
          this.lastMate = mate;
          this.lastDepth = depth;
          this.lastPv = pvLine;
        }
        this.lines.set(multiPvIndex, {
          eval: mate !== null ? (mate > 0 ? 100 : -100) : cp / 100,
          mate,
          pv: pvLine,
          depth,
        });
        if (depth >= this.minReportDepth && this.evalUpdate) {
          this.report();
        }
        if (depth >= this.maxDepth && this.evalResolve) {
          this.worker?.postMessage("stop");
        }
      }
    }

    if (msg.startsWith("bestmove")) {
      const parts = msg.split(" ");
      const bestMove = parts.length >= 2 ? parts[1] : "";
      const sorted = Array.from(this.lines.entries())
        .sort(([a], [b]) => a - b)
        .map(([, v]) => v);

      if (this.evalResolve) {
        this.evalResolve({
          fen: this.currentFen,
          eval:
            this.lastMate !== null
              ? this.lastMate > 0
                ? 100
                : -100
              : this.lastCp / 100,
          mate: this.lastMate,
          bestmove: bestMove || (this.lastPv[0] ?? ""),
          depth: this.lastDepth,
          pv: this.lastPv,
          multiPv: sorted,
        });
        this.evalResolve = null;
        this.evalUpdate = null;
      }
      this.lines.clear();
    }
  }

  async evaluatePosition(
    fen: string,
    timeMs = 10000,
    onUpdate?: (result: LocalEvalResult) => void,
  ): Promise<LocalEvalResult> {
    return this.evaluateWithLimit(fen, { timeMs }, onUpdate);
  }

  async evaluateToDepth(
    fen: string,
    depth: number,
    onUpdate?: (result: LocalEvalResult) => void,
  ): Promise<LocalEvalResult> {
    return this.evaluateWithLimit(fen, { depth }, onUpdate);
  }

  private async evaluateWithLimit(
    fen: string,
    limit: { timeMs?: number; depth?: number },
    onUpdate?: (result: LocalEvalResult) => void,
  ): Promise<LocalEvalResult> {
    if (!this.worker) {
      return {
        fen,
        eval: 0,
        mate: null,
        bestmove: "",
        depth: 0,
        pv: [],
        multiPv: [],
      };
    }
    if (!this.ready) {
      let waited = 0;
      await new Promise<void>((r) => {
        const check = () => {
          if (this.ready || waited >= 5000) return r();
          waited += 100;
          setTimeout(check, 100);
        };
        check();
      });
      if (!this.ready) {
        return {
          fen,
          eval: 0,
          mate: null,
          bestmove: "",
          depth: 0,
          pv: [],
          multiPv: [],
        };
      }
    }

    this.currentFen = fen;
    this.lines.clear();
    this.evalUpdate = onUpdate ?? null;
    return new Promise((resolve) => {
      this.evalResolve = resolve;
      this.worker?.postMessage("position fen " + fen);
      if (limit.depth) {
        this.maxDepth = limit.depth;
        this.worker?.postMessage("go depth " + limit.depth);
      } else {
        this.worker?.postMessage("go movetime " + (limit.timeMs ?? 10000));
      }
    });
  }

  async evaluatePositions(
    fens: { fen: string; index: number }[],
    timeMs = 3000,
    onResult?: (result: LocalEvalResult, index: number) => void,
  ): Promise<LocalEvalResult[]> {
    const results: LocalEvalResult[] = [];
    for (const { fen, index } of fens) {
      const result = await this.evaluatePosition(fen, timeMs);
      result.fen = fen;
      results.push(result);
      onResult?.(result, index);
    }
    return results;
  }

  terminate() {
    this.restartBackoff = 10;
    this.worker?.terminate();
    this.worker = null;
    this.ready = false;
  }
}
