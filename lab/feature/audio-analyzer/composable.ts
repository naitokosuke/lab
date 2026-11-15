import { computed, onScopeDispose, shallowReadonly, shallowRef } from "vue";

import { createSession } from "./core/session";
import { binFrequency, peakBin, rms, toDecibels } from "./core/spectrum";
import type { Dbfs, DbfsSpectrum, Hz, Waveform } from "./core/units";
import { bin, dbfs, dbfsSpectrum, hz, waveform as asWaveform } from "./core/units";

export type AudioSourceKind = "tone" | "microphone" | "file";

/** One frame read off the analyser */
export interface AnalysisFrame {
  /** dB per FFT bin (fftSize / 2 of them) */
  spectrum: DbfsSpectrum;
  /** Time-domain samples in -1..1 (fftSize of them) */
  waveform: Waveform;
}

/**
 * Feeds one source at a time (a test tone, the microphone, or an audio file) through an
 * AnalyserNode and reads a level and a peak frequency off it each frame. Tone and file are
 * heard; the microphone is analysed only, so it does not feed back into itself.
 */
export function useAudioAnalyser() {
  /* ============================================================
   * Graph: the AudioContext and its one AnalyserNode
   * ========================================================= */

  const graph = (() => {
    let context: AudioContext | null = null;
    const analyser = shallowRef<AnalyserNode | null>(null);
    const sampleRate = computed(() =>
      analyser.value === null ? null : hz(analyser.value.context.sampleRate),
    );

    /** Opened lazily: an AudioContext may only start from a user gesture */
    async function open(init: (node: AnalyserNode) => void) {
      if (context === null) {
        context = new AudioContext();
        const node = context.createAnalyser();
        init(node);
        analyser.value = node;
      }
      if (context.state === "suspended") await context.resume();
      return { context, node: analyser.value! };
    }

    function close() {
      void context?.close();
      context = null;
      analyser.value = null;
    }

    return { analyser, sampleRate, open, close };
  })();

  const fftSizeCtx = (() => {
    const fftSize = shallowRef(2_048);
    const set = (v: number) => {
      fftSize.value = v;
      if (graph.analyser.value !== null) graph.analyser.value.fftSize = v;
    };
    return { fftSize: shallowReadonly(fftSize), set };
  })();

  const smoothingCtx = (() => {
    const smoothing = shallowRef(0.8);
    const set = (v: number) => {
      smoothing.value = v;
      if (graph.analyser.value !== null) graph.analyser.value.smoothingTimeConstant = v;
    };
    return { smoothing: shallowReadonly(smoothing), set };
  })();

  /* ============================================================
   * Analysis: the one place that reads the analyser, once a frame
   * ========================================================= */

  const analysis = (() => {
    const SILENCE_DB = dbfs(-100);
    /** The latest frame, a new object each frame; null while nothing plays */
    const frame = shallowRef<AnalysisFrame | null>(null);
    const levelDb = shallowRef<Dbfs>(SILENCE_DB);
    const peakHz = shallowRef<Hz>(hz(0));

    // refilled in place, replaced only when the analyser's size changes
    let spectrum = dbfsSpectrum(new Float32Array(0));
    let waveform = asWaveform(new Float32Array(0));
    let rafId: number | null = null;

    function read() {
      const node = graph.analyser.value;
      if (node === null) return;
      if (spectrum.length !== node.frequencyBinCount) {
        spectrum = dbfsSpectrum(new Float32Array(node.frequencyBinCount));
      }
      if (waveform.length !== node.fftSize) waveform = asWaveform(new Float32Array(node.fftSize));
      node.getFloatFrequencyData(spectrum);
      node.getFloatTimeDomainData(waveform);
      levelDb.value = toDecibels(rms(waveform), SILENCE_DB);
      peakHz.value = binFrequency(
        peakBin(spectrum) ?? bin(0),
        hz(node.context.sampleRate),
        node.fftSize,
      );
      // a new wrapper around the same buffers, so the change is a reference Vue can see
      frame.value = { spectrum, waveform };
      rafId = requestAnimationFrame(read);
    }

    function start() {
      if (rafId === null) rafId = requestAnimationFrame(read);
    }

    function stop() {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = null;
      frame.value = null;
      levelDb.value = SILENCE_DB;
      peakHz.value = hz(0);
    }

    return {
      frame,
      levelDb,
      peakHz,

      start,
      stop,
    };
  })();

  /* ============================================================
   * Session: which source is playing, and how to tear it down
   * ========================================================= */

  const session = (() => {
    const source = shallowRef<AudioSourceKind | null>(null);
    const error = shallowRef<string | null>(null);
    // mirrors the framework-free session into refs, and reads the analyser only while a source plays
    const core = createSession<AudioSourceKind>(() => {
      source.value = core.source;
      error.value = core.error;
      if (core.source === null) analysis.stop();
      else analysis.start();
    });

    return {
      source: shallowReadonly(source),
      error: shallowReadonly(error),
      start: core.start,
      stop: core.stop,
    };
  })();

  /** A live graph to wire the next source into */
  function openGraph() {
    return graph.open((node) => {
      node.fftSize = fftSizeCtx.fftSize.value;
      node.smoothingTimeConstant = smoothingCtx.smoothing.value;
    });
  }

  /* ============================================================
   * Sources
   * ========================================================= */

  let tone: OscillatorNode | null = null;

  const toneHzCtx = (() => {
    const toneHz = shallowRef(440);
    const set = (v: number) => {
      toneHz.value = v;
      tone?.frequency.setTargetAtTime(v, tone.context.currentTime, 0.02);
    };
    return { toneHz: shallowReadonly(toneHz), set };
  })();

  // Each opener wires its own nodes into the analyser and, to be heard, straight to the
  // speakers too; the shared analyser never connects onward, so a teardown only touches
  // the nodes its own source made. An opener that fails undoes its own wiring and throws.

  const startTone = () =>
    session.start("tone", async () => {
      const { context: ctx, node } = await openGraph();
      const osc = ctx.createOscillator();
      osc.type = "sawtooth"; // harmonics, so the spectrum has more than one line
      osc.frequency.value = toneHzCtx.toneHz.value;
      const gain = ctx.createGain();
      gain.gain.value = 0.1;
      osc.connect(gain);
      gain.connect(node);
      gain.connect(ctx.destination);
      osc.start();
      tone = osc;
      return () => {
        osc.stop();
        osc.disconnect();
        gain.disconnect();
        if (tone === osc) tone = null;
      };
    });

  const startMicrophone = () =>
    session.start("microphone", async () => {
      const { context: ctx, node } = await openGraph();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mic = ctx.createMediaStreamSource(stream);
      mic.connect(node);
      return () => {
        mic.disconnect();
        stream.getTracks().forEach((t) => t.stop());
      };
    });

  const startFile = (file: File) =>
    session.start("file", async () => {
      const { context: ctx, node } = await openGraph();
      const url = URL.createObjectURL(file);
      const audio = new Audio(url);
      audio.loop = true;
      const media = ctx.createMediaElementSource(audio);
      media.connect(node);
      media.connect(ctx.destination);
      const teardown = () => {
        audio.pause();
        media.disconnect();
        URL.revokeObjectURL(url);
      };
      try {
        await audio.play();
      } catch (e) {
        teardown();
        throw e;
      }
      return teardown;
    });

  /* ============================================================
   * Lifecycle
   * ========================================================= */

  onScopeDispose(() => {
    session.stop();
    graph.close();
  });

  return {
    graph,
    analysis,
    session,

    fftSizeCtx,
    smoothingCtx,
    toneHzCtx,

    startTone,
    startMicrophone,
    startFile,
  };
}
