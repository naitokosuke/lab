import type { Amplitude, Bin, Dbfs, DbfsSpectrum, Hz, Waveform } from "./units";
import { amplitude, bin, dbfs, dbfsSpectrum, hz, waveform } from "./units";

export const binFrequency = (index: Bin, sampleRate: Hz, fftSize: number): Hz =>
  hz((index * sampleRate) / fftSize);

/** The loudest bin; `null` when no bin is above -Infinity */
export const peakBin = (spectrum: DbfsSpectrum): Bin | null => {
  let peak: Bin | null = null;
  let loudest = -Infinity;
  for (let i = 0; i < spectrum.length; i++) {
    const db = spectrum[i]!;
    if (db > loudest) {
      loudest = db;
      peak = bin(i);
    }
  }
  return peak;
};

export const rms = (samples: Waveform): Amplitude => {
  if (samples.length === 0) return amplitude(0);
  let sum = 0;
  for (const s of samples) sum += s * s;
  return amplitude(Math.sqrt(sum / samples.length));
};

/** Anything at or below `floor` (silence, negatives, NaN included) reads as `floor` */
export const toDecibels = (linear: Amplitude, floor = dbfs(-100)): Dbfs => {
  const db = 20 * Math.log10(linear);
  return db > floor ? dbfs(db) : floor;
};

/** `level` mapped onto 0..1 between `min` and `max`, clamped; NaN and an empty range give 0 */
export const normalize = (level: Dbfs, min: Dbfs, max: Dbfs): number => {
  if (!(max > min)) return 0;
  const t = (level - min) / (max - min);
  return t > 0 ? Math.min(1, t) : 0;
};

/**
 * Spectrum folded into `count` log-spaced bands from `minHz` up to Nyquist.
 * Each band shows its loudest bin; a band narrower than a bin shows the bin nearest its centre.
 */
export const logBands = (
  spectrum: DbfsSpectrum,
  count: number,
  sampleRate: Hz,
  fftSize: number,
  minHz = hz(20),
): Dbfs[] => {
  const nyquist = sampleRate / 2;
  if (!(minHz > 0 && minHz < nyquist)) {
    throw new RangeError(`minHz must be between 0 and ${nyquist} Hz, got ${minHz}`);
  }
  if (spectrum.length === 0 || count <= 0) return [];

  const binWidth = sampleRate / fftSize;
  const edge = (band: number) => minHz * (nyquist / minHz) ** (band / count);
  // bin k is in band b when edge(b) <= k * binWidth < edge(b + 1); DC (bin 0) never is
  const firstBin = Math.max(1, Math.ceil(minHz / binWidth));
  const lastBin = spectrum.length - 1;
  const startOf = (band: number) =>
    band === 0 ? firstBin : Math.min(spectrum.length, Math.ceil(edge(band) / binWidth));

  return Array.from({ length: count }, (_, band) => {
    const lo = startOf(band);
    const hi = band === count - 1 ? spectrum.length : startOf(band + 1);
    if (lo >= hi) {
      const nearest = Math.round(edge(band + 0.5) / binWidth);
      return dbfs(spectrum[Math.min(lastBin, Math.max(firstBin, nearest))]!);
    }
    let loudest = -Infinity;
    for (let k = lo; k < hi; k++) if (spectrum[k]! > loudest) loudest = spectrum[k]!;
    return dbfs(loudest);
  });
};

if (import.meta.vitest) {
  const { describe, expect, expectTypeOf, test } = import.meta.vitest;

  //   f_s      = 48,000 Hz         (sample rate)
  //   N        = 2,048             (fftSize)
  //   bins     = N / 2            = 1,024
  //   df       = f_s / N          = 48,000 / 2,048 = 23.4375 Hz      (bin k sits at k * df)
  //   Nyquist  = f_s / 2          = 24,000 Hz      = (N / 2) * df
  //   last bin = (N / 2 - 1) * df = Nyquist - df   = 23,976.5625 Hz
  const SAMPLE_RATE = hz(48_000);
  const FFT_SIZE = 2_048;
  const BINS = FFT_SIZE / 2;
  const QUIET = dbfs(-100);
  const LOUD = dbfs(-10);

  const spectrumOf = (...db: number[]) => dbfsSpectrum(Float32Array.from(db));
  const waveformOf = (...samples: number[]) => waveform(Float32Array.from(samples));
  /** A spectrum that is quiet everywhere except the given bins */
  const spectrumWith = (loud: Record<number, number>, bins = BINS) => {
    const s = dbfsSpectrum(new Float32Array(bins).fill(QUIET));
    for (const [i, db] of Object.entries(loud)) s[Number(i)] = db;
    return s;
  };
  /** Indices of the bands showing anything above the quiet floor */
  const lit = (bands: number[]) => bands.flatMap((db, i) => (db > QUIET ? [i] : []));

  describe("binFrequency", () => {
    test("bin 0 is DC, 0 Hz", () => {
      expectTypeOf(binFrequency).parameters.toEqualTypeOf<[Bin, Hz, number]>();
      const dc = binFrequency(bin(0), SAMPLE_RATE, FFT_SIZE);
      expectTypeOf(dc).toEqualTypeOf<Hz>();
      expect(dc).toBe(0);
    });

    test("neighbouring bins are sampleRate / fftSize apart", () => {
      expect(binFrequency(bin(1), SAMPLE_RATE, FFT_SIZE)).toBe(23.4375);
      expect(
        binFrequency(bin(101), SAMPLE_RATE, FFT_SIZE) -
          binFrequency(bin(100), SAMPLE_RATE, FFT_SIZE),
      ).toBe(23.4375);
    });

    test("the last bin sits one step below Nyquist", () => {
      expect(binFrequency(bin(BINS - 1), SAMPLE_RATE, FFT_SIZE)).toBe(24_000 - 23.4375);
    });
  });

  describe("peakBin", () => {
    test("the loudest bin is the peak", () => {
      expectTypeOf(peakBin).parameters.toEqualTypeOf<[DbfsSpectrum]>();
      const peak = peakBin(spectrumOf(-90, -40, -60));
      expectTypeOf(peak).toEqualTypeOf<Bin | null>();
      expect(peak).toBe(1);
    });

    test("of equally loud bins, the first is the peak", () => {
      expect(peakBin(spectrumOf(-50, -20, -20))).toBe(1);
    });

    test("NaN bins are never the peak", () => {
      expect(peakBin(spectrumOf(NaN, -60, -30))).toBe(2);
    });

    test("an empty spectrum has no peak, while a single bin is its own peak", () => {
      expect(peakBin(spectrumOf())).toBeNull();
      expect(peakBin(spectrumOf(-50))).toBe(0);
    });

    test("silence (-Infinity everywhere) has no peak, while one audible bin is the peak", () => {
      expect(peakBin(spectrumOf(-Infinity, -Infinity))).toBeNull();
      expect(peakBin(spectrumOf(-Infinity, -90))).toBe(1);
    });
  });

  describe("rms", () => {
    test("a full-scale square wave is 1", () => {
      expectTypeOf(rms).parameters.toEqualTypeOf<[Waveform]>();
      const level = rms(waveformOf(1, -1, 1, -1));
      expectTypeOf(level).toEqualTypeOf<Amplitude>();
      expect(level).toBe(1);
    });

    test("a full-scale sine is 1/√2", () => {
      const sine = Array.from({ length: 1_000 }, (_, i) => Math.sin((2 * Math.PI * i) / 100));
      expect(rms(waveformOf(...sine))).toBeCloseTo(Math.SQRT1_2, 5);
    });

    test("a constant offset counts by its size, whatever its sign", () => {
      expect(rms(waveformOf(-0.5, -0.5, -0.5))).toBe(0.5);
    });

    test("silence is 0", () => {
      expect(rms(waveform(new Float32Array(8)))).toBe(0);
    });

    test("no samples is 0", () => {
      expect(rms(waveformOf())).toBe(0);
    });
  });

  describe("toDecibels", () => {
    test("full scale (1) is 0 dBFS", () => {
      expectTypeOf(toDecibels).parameters.toEqualTypeOf<[Amplitude, Dbfs?]>();
      const level = toDecibels(amplitude(1));
      expectTypeOf(level).toEqualTypeOf<Dbfs>();
      expect(level).toBe(0);
    });

    test("half is about -6 dBFS, ten times is +20 dBFS", () => {
      expect(toDecibels(amplitude(0.5))).toBeCloseTo(-6.0206, 4);
      expect(toDecibels(amplitude(10))).toBeCloseTo(20, 10);
    });

    test("silence, negatives and NaN read as the floor (-100 dBFS by default)", () => {
      expect(toDecibels(amplitude(0))).toBe(-100);
      expect(toDecibels(amplitude(-1))).toBe(-100);
      expect(toDecibels(amplitude(NaN))).toBe(-100);
    });

    test("anything quieter than the floor reads as the floor; the floor can be chosen", () => {
      expect(toDecibels(amplitude(1e-9))).toBe(-100);
      expect(toDecibels(amplitude(0.001), dbfs(-40))).toBe(-40);
    });
  });

  describe("normalize", () => {
    const MIN = dbfs(-100);
    const MAX = dbfs(-30);

    test("min is 0, max is 1, halfway is 0.5", () => {
      expectTypeOf(normalize).parameters.toEqualTypeOf<[Dbfs, Dbfs, Dbfs]>();
      const middle = normalize(dbfs(-65), MIN, MAX);
      expectTypeOf(middle).toEqualTypeOf<number>();
      expect(middle).toBe(0.5);
      expect(normalize(MIN, MIN, MAX)).toBe(0);
      expect(normalize(MAX, MIN, MAX)).toBe(1);
    });

    test("below min is 0, above max is 1, infinities included", () => {
      expect(normalize(dbfs(-200), MIN, MAX)).toBe(0);
      expect(normalize(dbfs(0), MIN, MAX)).toBe(1);
      expect(normalize(dbfs(-Infinity), MIN, MAX)).toBe(0);
      expect(normalize(dbfs(Infinity), MIN, MAX)).toBe(1);
    });

    test("NaN is 0", () => {
      expect(normalize(dbfs(NaN), MIN, MAX)).toBe(0);
    });

    test("an empty or inverted range gives 0", () => {
      expect(normalize(dbfs(-50), MAX, MAX)).toBe(0);
      expect(normalize(dbfs(-50), MAX, MIN)).toBe(0);
    });
  });

  describe("logBands", () => {
    test("a flat spectrum gives every band the same level", () => {
      expectTypeOf(logBands).parameters.toEqualTypeOf<[DbfsSpectrum, number, Hz, number, Hz?]>();
      const flat = dbfsSpectrum(new Float32Array(BINS).fill(-80));
      const bands = logBands(flat, 32, SAMPLE_RATE, FFT_SIZE);
      expectTypeOf(bands).toEqualTypeOf<Dbfs[]>();
      expect(bands).toEqual(Array(32).fill(-80));
    });

    test("a band shows its loudest bin, not an average", () => {
      const s = dbfsSpectrum(new Float32Array(BINS).fill(-80));
      s[600] = -20;
      const bands = logBands(s, 10, SAMPLE_RATE, FFT_SIZE);
      expect(bands.filter((db) => db === -20)).toHaveLength(1);
      expect(bands.filter((db) => db === -80)).toHaveLength(9);
    });

    test("with bands wider than bins, every bin from minHz up shows in exactly one band", () => {
      for (let i = 1; i < BINS; i++) {
        const bands = logBands(spectrumWith({ [i]: LOUD }), 10, SAMPLE_RATE, FFT_SIZE);
        expect(lit(bands), `bin ${i}`).toHaveLength(1);
      }
    });

    test("DC never shows, while bin 1 next to it does", () => {
      for (const count of [10, 64, 256]) {
        const dc = lit(logBands(spectrumWith({ 0: LOUD }), count, SAMPLE_RATE, FFT_SIZE));
        const next = lit(logBands(spectrumWith({ 1: LOUD }), count, SAMPLE_RATE, FFT_SIZE));
        expect(dc, `${count} bands`).toEqual([]);
        expect(next.length, `${count} bands`).toBeGreaterThan(0);
      }
    });

    test("bins below minHz do not show; the first bin above it shows in the first band", () => {
      // minHz 100: bin 4 is 93.75 Hz, bin 5 is 117.1875 Hz
      const minHz = hz(100);
      expect(lit(logBands(spectrumWith({ 4: LOUD }), 8, SAMPLE_RATE, FFT_SIZE, minHz))).toEqual([]);
      expect(lit(logBands(spectrumWith({ 5: LOUD }), 8, SAMPLE_RATE, FFT_SIZE, minHz))).toEqual([
        0,
      ]);
    });

    test("the last bin shows in the last band", () => {
      expect(lit(logBands(spectrumWith({ [BINS - 1]: LOUD }), 10, SAMPLE_RATE, FFT_SIZE))).toEqual([
        9,
      ]);
    });

    test("each decade gets the same number of bands", () => {
      // fftSize 32,768 so even 100 Hz is many bins wide
      const fft = 32_768;
      const bandOf = (freq: number) => {
        const s = spectrumWith({ [Math.round((freq * fft) / SAMPLE_RATE)]: LOUD }, fft / 2);
        return lit(logBands(s, 120, SAMPLE_RATE, fft))[0]!;
      };
      const low = bandOf(1_000) - bandOf(100);
      const high = bandOf(10_000) - bandOf(1_000);
      expect(Math.abs(low - high)).toBeLessThanOrEqual(1);
      expect(low).toBeGreaterThan(30);
    });

    test("with more bands than low bins, every band still shows a level", () => {
      const ramp = dbfsSpectrum(Float32Array.from({ length: BINS }, (_, i) => -100 + i * 0.01));
      const bands = logBands(ramp, 256, SAMPLE_RATE, FFT_SIZE);
      expect(bands).toHaveLength(256);
      for (const band of bands) expect(Number.isFinite(band)).toBe(true);
    });

    test("gives as many bands as asked for; an empty spectrum, or zero bands, gives none", () => {
      expect(logBands(spectrumWith({}), 8, SAMPLE_RATE, FFT_SIZE)).toHaveLength(8);
      expect(logBands(spectrumOf(), 8, SAMPLE_RATE, FFT_SIZE)).toEqual([]);
      expect(logBands(spectrumWith({}), 0, SAMPLE_RATE, FFT_SIZE)).toEqual([]);
    });

    test("minHz outside 0 < minHz < Nyquist is a RangeError", () => {
      const s = spectrumWith({});
      expect(() => logBands(s, 8, SAMPLE_RATE, FFT_SIZE, hz(0))).toThrow(RangeError);
      expect(() => logBands(s, 8, SAMPLE_RATE, FFT_SIZE, hz(-20))).toThrow(RangeError);
      expect(() => logBands(s, 8, SAMPLE_RATE, FFT_SIZE, hz(24_000))).toThrow(RangeError);
    });
  });
}
