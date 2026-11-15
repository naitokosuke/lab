declare const unit: unique symbol;

/** A number that carries its unit in its type; at runtime it is the plain number */
type Unit<U extends string> = number & { readonly [unit]: U };

/** Frequency, in hertz */
export type Hz = Unit<"Hz">;
/** Ratio between two levels, in decibels; relative, with no reference level */
export type Db = Unit<"dB">;
/** Level, in decibels relative to digital full scale */
export type Dbfs = Unit<"dBFS">;
/** Linear sample value; 1 is full scale */
export type Amplitude = Unit<"amplitude">;
/** Index of an FFT bin */
export type Bin = Unit<"bin">;
/** Time on the audio clock, as Web Audio takes it (`currentTime`, scheduling) */
export type Seconds = Unit<"s">;
/** Time as `DOMHighResTimeStamp` gives it (`performance.now()`, `requestAnimationFrame`) */
export type Milliseconds = Unit<"ms">;

export const hz = (value: number): Hz => value as Hz;
export const db = (value: number): Db => value as Db;
export const dbfs = (value: number): Dbfs => value as Dbfs;
export const amplitude = (value: number): Amplitude => value as Amplitude;
export const bin = (value: number): Bin => value as Bin;
export const seconds = (value: number): Seconds => value as Seconds;
export const milliseconds = (value: number): Milliseconds => value as Milliseconds;

export const toMilliseconds = (time: Seconds): Milliseconds => milliseconds(time * 1_000);
export const toSeconds = (time: Milliseconds): Seconds => seconds(time / 1_000);

/** dBFS per FFT bin, as `AnalyserNode.getFloatFrequencyData` fills it */
export type DbfsSpectrum = Float32Array<ArrayBuffer> & { readonly [unit]: "dBFS spectrum" };
/** Time-domain samples, as `AnalyserNode.getFloatTimeDomainData` fills it */
export type Waveform = Float32Array<ArrayBuffer> & { readonly [unit]: "waveform" };

/** Marks a buffer as a dBFS spectrum; the same buffer, not a copy */
export const dbfsSpectrum = (buffer: Float32Array<ArrayBuffer>): DbfsSpectrum =>
  buffer as DbfsSpectrum;
/** Marks a buffer as a waveform; the same buffer, not a copy */
export const waveform = (buffer: Float32Array<ArrayBuffer>): Waveform => buffer as Waveform;

if (import.meta.vitest) {
  const { expect, expectTypeOf, test } = import.meta.vitest;

  test("seconds convert to milliseconds: 1 s is 1000 ms", () => {
    const time = toMilliseconds(seconds(1));
    expectTypeOf(toMilliseconds).parameters.toEqualTypeOf<[Seconds]>();
    expectTypeOf(time).toEqualTypeOf<Milliseconds>();
    expect(time).toBe(1_000);
  });

  test("milliseconds convert to seconds: 1000 ms is 1 s", () => {
    const time = toSeconds(milliseconds(1_000));
    expectTypeOf(toSeconds).parameters.toEqualTypeOf<[Milliseconds]>();
    expectTypeOf(time).toEqualTypeOf<Seconds>();
    expect(time).toBe(1);
  });

  test("fractions below a millisecond survive: one sample at 48 kHz is about 0.0208 ms", () => {
    expect(toMilliseconds(seconds(1 / 48_000))).toBeCloseTo(0.0208333, 7);
    expect(toSeconds(milliseconds(0.5))).toBe(0.0005);
  });
}
