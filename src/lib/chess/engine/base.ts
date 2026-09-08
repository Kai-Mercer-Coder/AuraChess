/**
 * Shared WASM Stockfish worker plumbing.
 *
 * Handles worker construction + the UCI protocol handshake and exposes
 * `postCommand`. Subclasses override `handleMessage` to interpret engine
 * output. NOTE: `getNextMove` types recurse through each subclass's promise,
 * so this intentionally has no generic return type.
 */
abstract class BaseStockfishEngine {
  protected worker: Worker | null = null;
  protected isReady = false;

  constructor(workerPath: string) {
    try {
      this.worker = new Worker(workerPath);
      this.worker.onmessage = this.handleMessage.bind(this);
      this.postCommand("uci");
    } catch (error) {
      console.error(`Failed to load Stockfish worker at ${workerPath}:`, error);
    }
  }

  /** Parse engine output; must be implemented by concrete engines. */
  protected abstract handleMessage(event: MessageEvent): void;

  protected postCommand(command: string) {
    if (this.worker) {
      this.worker.postMessage(command);
    } else {
      console.error("Stockfish worker not initialized");
    }
  }

  public terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.isReady = false;
    }
  }
}

export default BaseStockfishEngine;
