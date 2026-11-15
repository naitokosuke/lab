export interface Session<K> {
  readonly source: K | null;
  readonly error: string | null;
  readonly start: (kind: K, open: () => Promise<() => void>) => Promise<void>;
  readonly stop: () => void;
}

/**
 * One audio source at a time. Starting or stopping invalidates any start still pending;
 * a pending start that resolves late is torn down, and one that fails late reports nothing.
 */
export const createSession = <K>(onChange?: () => void): Session<K> => {
  let source: K | null = null;
  let error: string | null = null;
  let teardown: (() => void) | null = null;
  let generation = 0;

  const update = (nextSource: K | null, nextError: string | null) => {
    if (nextSource === source && nextError === error) return;
    source = nextSource;
    error = nextError;
    onChange?.();
  };

  /** Tears the playing source down and invalidates any pending start */
  const release = () => {
    generation++;
    teardown?.();
    teardown = null;
  };

  const start = async (kind: K, open: () => Promise<() => void>) => {
    release();
    update(null, error);
    const id = generation;
    try {
      const opened = await open();
      if (id !== generation) return opened();
      teardown = opened;
      update(kind, null);
    } catch (e) {
      if (id !== generation) return;
      update(null, e instanceof Error ? e.message : String(e));
    }
  };

  const stop = () => {
    release();
    update(null, null);
  };

  return {
    get source() {
      return source;
    },
    get error() {
      return error;
    },
    start,
    stop,
  };
};

if (import.meta.vitest) {
  const { describe, expect, expectTypeOf, test, vi } = import.meta.vitest;

  type Kind = "tone" | "microphone";

  /** An opener whose resolution the test controls, and the teardown it hands back */
  const deferredOpener = () => {
    const teardown = vi.fn();
    let resolve!: (teardown: () => void) => void;
    let reject!: (e: unknown) => void;
    const opened = new Promise<() => void>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    // whether the opener is awaited at all is the session's business, not the helper's
    void opened.catch(() => {});
    return { open: vi.fn(() => opened), teardown, resolve: () => resolve(teardown), reject };
  };

  /** An opener that succeeds straight away */
  const readyOpener = () => {
    const teardown = vi.fn();
    return { open: vi.fn(async () => teardown), teardown };
  };

  describe("createSession", () => {
    test("a source plays once its opener resolves, not before", async () => {
      const session = createSession<Kind>();
      expectTypeOf<Pick<typeof session, "source" | "error">>().toEqualTypeOf<{
        readonly source: Kind | null;
        readonly error: string | null;
      }>();
      expectTypeOf(session.start).parameters.toEqualTypeOf<[Kind, () => Promise<() => void>]>();
      const tone = deferredOpener();
      const started = session.start("tone", tone.open);
      expect(session.source).toBeNull();

      tone.resolve();
      await started;

      expect(session.source).toBe("tone");
    });

    test("stop tears the playing source down once, even when called again", async () => {
      const session = createSession<Kind>();
      const tone = readyOpener();
      await session.start("tone", tone.open);
      session.stop();
      session.stop();
      expect(tone.teardown).toHaveBeenCalledTimes(1);
      expect(session.source).toBeNull();
    });

    test("starting another source tears the playing one down before opening the next", async () => {
      const session = createSession<Kind>();
      const tone = readyOpener();
      await session.start("tone", tone.open);
      const mic = readyOpener();
      mic.open.mockImplementation(async () => {
        expect(tone.teardown).toHaveBeenCalledTimes(1);
        return mic.teardown;
      });
      await session.start("microphone", mic.open);
      expect(session.source).toBe("microphone");
    });

    test("a start overtaken while pending is torn down when it resolves; the newer one plays", async () => {
      const session = createSession<Kind>();
      const mic = deferredOpener();
      const pendingMic = session.start("microphone", mic.open);
      const tone = readyOpener();
      await session.start("tone", tone.open);

      mic.resolve();
      await pendingMic;

      expect(mic.teardown).toHaveBeenCalledTimes(1);
      expect(tone.teardown).not.toHaveBeenCalled();
      expect(session.source).toBe("tone");
    });

    test("stop while a start is pending: it is torn down when it resolves, and nothing plays", async () => {
      const session = createSession<Kind>();
      const mic = deferredOpener();
      const pendingMic = session.start("microphone", mic.open);
      session.stop();

      mic.resolve();
      await pendingMic;

      expect(mic.teardown).toHaveBeenCalledTimes(1);
      expect(session.source).toBeNull();
    });

    test("a failing opener reports its error instead of rejecting, and nothing plays", async () => {
      const session = createSession<Kind>();
      expectTypeOf(session.start).returns.toEqualTypeOf<Promise<void>>();
      await expect(
        session.start("microphone", async () => {
          throw new Error("Permission denied");
        }),
      ).resolves.toBeUndefined();
      expect(session.error).toBe("Permission denied");
      expect(session.source).toBeNull();
    });

    test("a thrown non-Error is reported as text", async () => {
      const session = createSession<Kind>();
      await session.start("microphone", () => Promise.reject("nope"));
      expect(session.error).toBe("nope");
    });

    test("an overtaken start that fails reports nothing; the newer one plays", async () => {
      const session = createSession<Kind>();
      const mic = deferredOpener();
      const pendingMic = session.start("microphone", mic.open);
      await session.start("tone", readyOpener().open);

      mic.reject(new Error("Permission denied"));
      await pendingMic;

      expect(session.error).toBeNull();
      expect(session.source).toBe("tone");
    });

    test("a source that starts clears the previous error", async () => {
      const session = createSession<Kind>();
      await session.start("microphone", () => Promise.reject(new Error("Permission denied")));
      expect(session.error).toBe("Permission denied");
      await session.start("tone", readyOpener().open);
      expect(session.error).toBeNull();
    });

    test("a listener hears every change of source or error", async () => {
      const seen: Array<[Kind | null, string | null]> = [];
      const session = createSession<Kind>(() => seen.push([session.source, session.error]));

      await session.start("microphone", () => Promise.reject(new Error("denied")));
      await session.start("tone", readyOpener().open);
      session.stop();

      expect(seen).toEqual([
        [null, "denied"],
        ["tone", null],
        [null, null],
      ]);
    });
  });
}
