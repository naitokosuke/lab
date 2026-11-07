import type { ComputedRef, ShallowRef } from "vue";
import { computed, onScopeDispose, shallowReactive, shallowRef } from "vue";

import { binFrequency, peakBin, rms, toDecibels } from "./core/spectrum";

export type AudioSourceKind = "tone" | "microphone" | "file";

interface Ctx<T> {
  value: ComputedRef<T>;
  set: (value: T) => void;
}

export interface UseAudioAnalyserReturn {
  /** The analyser to draw from, created on the first `start*` (an AudioContext needs a gesture) */
  analyser: ShallowRef<AnalyserNode | null>;

  source: ComputedRef<AudioSourceKind | null>;
  error: ComputedRef<string | null>;
  /** Loudness of the latest frame, dBFS */
  levelDb: ComputedRef<number>;
  /** Frequency of the loudest bin in the latest frame, Hz */
  peakHz: ComputedRef<number>;
  sampleRate: ComputedRef<number | null>;

  fftSizeCtx: Ctx<number>;
  smoothingCtx: Ctx<number>;
  toneHzCtx: Ctx<number>;

  startTone: () => Promise<void>;
  startMicrophone: () => Promise<void>;
  startFile: (file: File) => Promise<void>;
  stop: () => void;
}

/**
 * Feeds one source at a time (a test tone, the microphone, or an audio file) through an
 * AnalyserNode and reads a level and a peak frequency off it each frame. Tone and file are
 * heard; the microphone is analysed only, so it does not feed back into itself.
 */
export function useAudioAnalyser(): UseAudioAnalyserReturn {
  const analyser = shallowRef<AnalyserNode | null>(null);

  const store = shallowReactive({
    source: null as AudioSourceKind | null,
    error: null as string | null,
    levelDb: -100,
    peakHz: 0,
    sampleRate: null as number | null,
    fftSize: 2048,
    smoothing: 0.8,
    toneHz: 440,
  });

  let context: AudioContext | null = null;
  /** Tears down whatever source is playing */
  let teardown: (() => void) | null = null;
  let tone: OscillatorNode | null = null;

  async function prepare(): Promise<{ ctx: AudioContext; node: AnalyserNode }> {
    stop();
    if (!context) {
      context = new AudioContext();
      const node = context.createAnalyser();
      node.fftSize = store.fftSize;
      node.smoothingTimeConstant = store.smoothing;
      analyser.value = node;
      store.sampleRate = context.sampleRate;
    }
    if (context.state === "suspended") await context.resume();
    store.error = null;
    return { ctx: context, node: analyser.value! };
  }

  function begin(kind: AudioSourceKind, end: () => void) {
    teardown = end;
    store.source = kind;
    loopStart();
  }

  /* ============================================================
   * Sources
   * ========================================================= */

  async function startTone() {
    const { ctx, node } = await prepare();
    const osc = ctx.createOscillator();
    osc.type = "sawtooth"; // harmonics, so the spectrum has more than one line
    osc.frequency.value = store.toneHz;
    const gain = ctx.createGain();
    gain.gain.value = 0.1;
    osc.connect(gain).connect(node);
    node.connect(ctx.destination);
    osc.start();
    tone = osc;
    begin("tone", () => {
      osc.stop();
      osc.disconnect();
      gain.disconnect();
      node.disconnect();
      tone = null;
    });
  }

  async function startMicrophone() {
    const { ctx, node } = await prepare();
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
      store.error = e instanceof Error ? e.message : String(e);
      return;
    }
    const mic = ctx.createMediaStreamSource(stream);
    mic.connect(node);
    begin("microphone", () => {
      mic.disconnect();
      stream.getTracks().forEach((t) => t.stop());
    });
  }

  async function startFile(file: File) {
    const { ctx, node } = await prepare();
    const url = URL.createObjectURL(file);
    const audio = new Audio(url);
    audio.loop = true;
    const media = ctx.createMediaElementSource(audio);
    media.connect(node);
    node.connect(ctx.destination);
    try {
      await audio.play();
    } catch (e) {
      media.disconnect();
      node.disconnect();
      URL.revokeObjectURL(url);
      store.error = e instanceof Error ? e.message : String(e);
      return;
    }
    begin("file", () => {
      audio.pause();
      media.disconnect();
      node.disconnect();
      URL.revokeObjectURL(url);
    });
  }

  function stop() {
    teardown?.();
    teardown = null;
    store.source = null;
    loopStop();
  }

  /* ============================================================
   * Frame loop: level and peak
   * ========================================================= */

  let rafId: number | null = null;
  let waveform = new Float32Array(0);
  let spectrum = new Float32Array(0);

  function frame() {
    const node = analyser.value;
    if (!node) return;
    if (waveform.length !== node.fftSize) waveform = new Float32Array(node.fftSize);
    if (spectrum.length !== node.frequencyBinCount) {
      spectrum = new Float32Array(node.frequencyBinCount);
    }
    node.getFloatTimeDomainData(waveform);
    node.getFloatFrequencyData(spectrum);
    store.levelDb = toDecibels(rms(waveform));
    store.peakHz = binFrequency(
      Math.max(0, peakBin(spectrum)),
      node.context.sampleRate,
      node.fftSize,
    );
    rafId = requestAnimationFrame(frame);
  }

  function loopStart() {
    if (rafId == null) rafId = requestAnimationFrame(frame);
  }

  function loopStop() {
    if (rafId != null) cancelAnimationFrame(rafId);
    rafId = null;
    store.levelDb = -100;
    store.peakHz = 0;
  }

  /* ============================================================
   * Reactive State
   * ========================================================= */

  const fftSizeCtx = (() => {
    const value = computed(() => store.fftSize);
    const set = (v: number) => {
      store.fftSize = v;
      if (analyser.value) analyser.value.fftSize = v;
    };
    return { value, set };
  })();

  const smoothingCtx = (() => {
    const value = computed(() => store.smoothing);
    const set = (v: number) => {
      store.smoothing = v;
      if (analyser.value) analyser.value.smoothingTimeConstant = v;
    };
    return { value, set };
  })();

  const toneHzCtx = (() => {
    const value = computed(() => store.toneHz);
    const set = (v: number) => {
      store.toneHz = v;
      tone?.frequency.setTargetAtTime(v, tone.context.currentTime, 0.02);
    };
    return { value, set };
  })();

  /* ============================================================
   * Lifecycle
   * ========================================================= */

  onScopeDispose(() => {
    stop();
    void context?.close();
    context = null;
    analyser.value = null;
  });

  return {
    analyser,

    source: computed(() => store.source),
    error: computed(() => store.error),
    levelDb: computed(() => store.levelDb),
    peakHz: computed(() => store.peakHz),
    sampleRate: computed(() => store.sampleRate),

    fftSizeCtx,
    smoothingCtx,
    toneHzCtx,

    startTone,
    startMicrophone,
    startFile,
    stop,
  };
}
