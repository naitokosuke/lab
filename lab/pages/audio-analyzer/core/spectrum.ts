/** The frequency, in Hz, that FFT bin `index` stands for */
export function binFrequency(index: number, sampleRate: number, fftSize: number): number {
  return (index * sampleRate) / fftSize;
}

/** The index of the loudest bin, or -1 for an empty spectrum */
export function peakBin(spectrum: ArrayLike<number>): number {
  let peak = -1;
  let max = -Infinity;
  for (let i = 0; i < spectrum.length; i++) {
    if (spectrum[i]! > max) {
      max = spectrum[i]!;
      peak = i;
    }
  }
  return peak;
}

/** Root mean square of time-domain samples in -1..1 */
export function rms(samples: ArrayLike<number>): number {
  if (samples.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < samples.length; i++) sum += samples[i]! * samples[i]!;
  return Math.sqrt(sum / samples.length);
}

/** A linear amplitude in decibels (dBFS), never below `floor` */
export function toDecibels(linear: number, floor = -100): number {
  if (linear <= 0) return floor;
  return Math.max(floor, 20 * Math.log10(linear));
}

/** Where `db` sits between `min` and `max`, clamped to 0..1 */
export function normalize(db: number, min: number, max: number): number {
  if (!(max > min)) return 0;
  return Math.min(1, Math.max(0, (db - min) / (max - min)));
}

/**
 * Folds a linear spectrum (one value per bin, as `getFloatFrequencyData` gives) into `count`
 * bands spaced evenly on a log scale from `minHz` to Nyquist, the way an ear hears pitch.
 * Each band takes its loudest bin. Low bands narrower than one bin repeat that bin.
 */
export function logBands(
  spectrum: ArrayLike<number>,
  count: number,
  sampleRate: number,
  fftSize: number,
  minHz = 20,
): number[] {
  if (count <= 0 || spectrum.length === 0) return [];
  const binHz = sampleRate / fftSize;
  const ratio = sampleRate / 2 / minHz;
  const last = spectrum.length - 1;
  const edge = (i: number) => minHz * ratio ** (i / count);

  return Array.from({ length: count }, (_, i) => {
    const lo = Math.min(last, Math.floor(edge(i) / binHz));
    const hi = Math.min(last, Math.max(lo, Math.ceil(edge(i + 1) / binHz) - 1));
    let max = -Infinity;
    for (let b = lo; b <= hi; b++) max = Math.max(max, spectrum[b]!);
    return max;
  });
}

if (import.meta.vitest) {
  const { describe, expect, test } = import.meta.vitest;

  describe("binFrequency", () => {
    test("bin 0 is DC, the last bin edge is Nyquist", () => {
      expect(binFrequency(0, 48000, 2048)).toBe(0);
      expect(binFrequency(1024, 48000, 2048)).toBe(24000);
    });

    test("one bin is sampleRate / fftSize wide", () => {
      expect(binFrequency(1, 44100, 1024)).toBeCloseTo(43.066, 3);
    });
  });

  describe("peakBin", () => {
    test("the loudest bin wins", () => {
      expect(peakBin([-90, -40, -60])).toBe(1);
    });

    test("silence (-Infinity everywhere) and empty pick none", () => {
      expect(peakBin([-Infinity, -Infinity])).toBe(-1);
      expect(peakBin([])).toBe(-1);
    });
  });

  describe("rms", () => {
    test("silence is 0", () => {
      expect(rms(new Float32Array(8))).toBe(0);
      expect(rms([])).toBe(0);
    });

    test("a full-scale square wave is 1", () => {
      expect(rms([1, -1, 1, -1])).toBe(1);
    });

    test("a full-scale sine is 1/√2", () => {
      const sine = Array.from({ length: 1000 }, (_, i) => Math.sin((2 * Math.PI * i) / 100));
      expect(rms(sine)).toBeCloseTo(Math.SQRT1_2, 3);
    });
  });

  describe("toDecibels", () => {
    test("full scale is 0 dB, half is about -6 dB", () => {
      expect(toDecibels(1)).toBe(0);
      expect(toDecibels(0.5)).toBeCloseTo(-6.02, 2);
    });

    test("silence and tiny values stop at the floor", () => {
      expect(toDecibels(0)).toBe(-100);
      expect(toDecibels(1e-9)).toBe(-100);
      expect(toDecibels(0, -60)).toBe(-60);
    });
  });

  describe("normalize", () => {
    test("maps the range onto 0..1", () => {
      expect(normalize(-100, -100, -30)).toBe(0);
      expect(normalize(-65, -100, -30)).toBe(0.5);
      expect(normalize(-30, -100, -30)).toBe(1);
    });

    test("clamps outside the range, -Infinity included", () => {
      expect(normalize(-Infinity, -100, -30)).toBe(0);
      expect(normalize(0, -100, -30)).toBe(1);
    });

    test("an empty range is 0", () => {
      expect(normalize(-50, -30, -30)).toBe(0);
    });
  });

  describe("logBands", () => {
    const SAMPLE_RATE = 48000;
    const FFT_SIZE = 2048;
    const BIN_HZ = SAMPLE_RATE / FFT_SIZE;

    test("one value per band", () => {
      const spectrum = new Float32Array(FFT_SIZE / 2).fill(-80);
      expect(logBands(spectrum, 32, SAMPLE_RATE, FFT_SIZE)).toHaveLength(32);
    });

    test("a tone lands in the band that holds its frequency", () => {
      const spectrum = new Float32Array(FFT_SIZE / 2).fill(-100);
      const toneBin = Math.round(1000 / BIN_HZ);
      spectrum[toneBin] = -10;
      const bands = logBands(spectrum, 10, SAMPLE_RATE, FFT_SIZE);
      // 10 bands from 20 Hz to 24 kHz: 1 kHz falls in the 6th (index 5)
      expect(peakBin(bands)).toBe(5);
      expect(bands[5]).toBe(-10);
    });

    test("higher bands reach higher bins, the top one up to Nyquist", () => {
      const spectrum = Float32Array.from({ length: FFT_SIZE / 2 }, (_, i) => i);
      const bands = logBands(spectrum, 8, SAMPLE_RATE, FFT_SIZE);
      for (let i = 1; i < bands.length; i++) expect(bands[i]).toBeGreaterThanOrEqual(bands[i - 1]!);
      expect(bands.at(-1)).toBe(FFT_SIZE / 2 - 1);
    });

    test("nothing to fold, nothing out", () => {
      expect(logBands([], 8, SAMPLE_RATE, FFT_SIZE)).toEqual([]);
      expect(logBands([0, 0], 0, SAMPLE_RATE, FFT_SIZE)).toEqual([]);
    });
  });
}
