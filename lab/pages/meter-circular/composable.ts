import type { ComputedRef, Ref, ShallowRef } from "vue";
import { computed, onMounted, onScopeDispose, shallowReactive, shallowRef } from "vue";

export interface UseCircularAnimateReturn {
  animation: ShallowRef<Animation | undefined>;

  pending: ComputedRef<boolean>;
  playState: ComputedRef<AnimationPlayState>;
  currentTimeCtx: {
    value: ComputedRef<CSSNumberish | null>;
    set: (value: CSSNumberish | null) => void;
  };
  playbackRateCtx: { value: ComputedRef<number>; set: (value: number) => void };

  play: () => void;
  pause: () => void;
  resume: () => void;

  finish: () => void;
  cancel: () => void;
}

export function useCircularAnimate(
  el: Readonly<ShallowRef<SVGCircleElement | null>>,
  circumference: number,
  percentage: ComputedRef<number>,
  duration: Ref<number>,
  easing: Ref<string>,
  options: { immediate?: boolean } = {},
): UseCircularAnimateReturn {
  const { immediate = true } = options;
  const animation = shallowRef<Animation>();

  const store = shallowReactive({
    pending: false,
    playState: "idle" as AnimationPlayState,
    currentTime: null as CSSNumberish | null,
    playbackRate: 1,
  });

  /* ============================================================
   * RAF Sync
   * ========================================================= */

  let rafId: number | null = null;

  function syncLoop() {
    if (!animation.value) return;
    store.pending = animation.value.pending;
    store.playState = animation.value.playState;
    store.currentTime = animation.value.currentTime;
    store.playbackRate = animation.value.playbackRate;
    rafId = requestAnimationFrame(syncLoop);
  }

  function syncResume() {
    if (rafId == null) rafId = requestAnimationFrame(syncLoop);
  }

  function syncPause() {
    if (rafId != null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    if (animation.value) {
      store.pending = animation.value.pending;
      store.playState = animation.value.playState;
      store.currentTime = animation.value.currentTime;
      store.playbackRate = animation.value.playbackRate;
    }
  }

  /* ============================================================
   * Core
   * ========================================================= */

  function createAnimation() {
    if (!el.value) return;
    animation.value?.cancel();

    const offsetEnd = circumference * (1 - percentage.value / 100);

    const anim = el.value.animate(
      [{ strokeDashoffset: String(circumference) }, { strokeDashoffset: String(offsetEnd) }],
      {
        duration: duration.value,
        easing: easing.value,
      },
    );

    anim.addEventListener("finish", syncPause);
    anim.addEventListener("cancel", syncPause);

    animation.value = anim;
    syncResume();
  }

  /* ============================================================
   * Controls
   * ========================================================= */

  const play = () => createAnimation();

  const pause = () => {
    animation.value?.pause();
    syncPause();
  };

  const resume = () => {
    animation.value?.play();
    syncResume();
  };

  const finish = () => {
    animation.value?.finish();
    syncPause();
  };

  const cancel = () => {
    animation.value?.cancel();
    syncPause();
  };

  /* ============================================================
   * Reactive State
   * ========================================================= */

  const pending = computed(() => store.pending);
  const playState = computed(() => store.playState);

  const currentTimeCtx = (() => {
    const value = computed(() => store.currentTime);
    const set = (v: CSSNumberish | null) => {
      store.currentTime = v;
      if (animation.value) {
        animation.value.currentTime = v;
        syncResume();
      }
    };
    return { value, set };
  })();

  const playbackRateCtx = (() => {
    const value = computed(() => store.playbackRate);
    const set = (v: number) => {
      store.playbackRate = v;
      if (animation.value) animation.value.playbackRate = v;
    };
    return { value, set };
  })();

  /* ============================================================
   * Lifecycle
   * ========================================================= */

  onMounted(() => {
    if (immediate) play();
  });
  onScopeDispose(() => {
    syncPause();
    animation.value?.cancel();
  });

  return {
    animation,

    pending,
    playState,
    currentTimeCtx,
    playbackRateCtx,

    play,
    pause,
    resume,
    finish,
    cancel,
  };
}
