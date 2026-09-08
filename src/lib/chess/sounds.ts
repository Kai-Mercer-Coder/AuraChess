/**
 * Sound effects module.
 *
 * Global (non-React) state for whether sounds are on, plus a set of helpers to
 * play the right sound after a move. Works in play mode and review mode alike.
 * NOTE: browsers block autoplay, so call `unlockAudio()` from a user gesture.
 */
import type { Chess } from "chess.js";

let soundsEnabled = true;
let audioUnlocked = false;

const SOUND_FILES = {
  move: "/SwiftMove.mp3",
  capture: "/SwiftCapture.mp3",
  check: "/Check.mp3",
  castle: "/Castle.mp3",
  gameOver: "/GameOver.mp3",
} as const;

export function setSoundsEnabled(enabled: boolean) {
  soundsEnabled = enabled;
}

export function isSoundsEnabled() {
  return soundsEnabled;
}

/**
 * Browsers block autoplay until the user has interacted with the page.
 * Call this from a click/keydown handler (or early in a component) so that
 * subsequent move sounds are allowed to play. Safe to call repeatedly.
 */
export function unlockAudio() {
  if (audioUnlocked) return;
  audioUnlocked = true;
  try {
    const ctx = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    // A silent, empty buffer "wakes" the context so it becomes allowed.
    ctx.resume?.();
    const buffer = ctx.createBuffer(1, 1, 22050);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(ctx.destination);
    src.start(0);
  } catch {
    /* ignore */
  }
}

function playFile(path: string) {
  if (!soundsEnabled || !audioUnlocked) return;
  try {
    // A fresh element per play avoids reusing a stale/blocked one.
    const audio = new Audio(path);
    void audio.play().catch(() => {});
  } catch {
    /* ignore */
  }
}

export function playMoveSound(opts?: { isCapture?: boolean; isCheck?: boolean; isGameOver?: boolean }) {
  if (!soundsEnabled) return;
  if (opts?.isGameOver) return playFile(SOUND_FILES.gameOver);
  if (opts?.isCheck) return playFile(SOUND_FILES.check);
  if (opts?.isCapture) return playFile(SOUND_FILES.capture);
  playFile(SOUND_FILES.move);
}

export function playCaptureSound() {
  if (!soundsEnabled) return;
  playFile(SOUND_FILES.capture);
}

export function playSoundForMove(game: Chess) {
  if (!soundsEnabled) return;
  try {
    const last = game.history({ verbose: true }).at(-1);
    playMoveSound({
      isCapture: last?.captured !== undefined,
      isCheck: game.isCheck(),
      isGameOver: game.isGameOver(),
    });
  } catch {
    /* ignore */
  }
}
