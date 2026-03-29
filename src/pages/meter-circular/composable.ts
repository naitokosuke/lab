import type { ComputedRef, Ref, ShallowRef, WritableComputedRef } from "vue";
import { computed, onMounted, onScopeDispose, shallowReactive, shallowRef } from "vue";

export interface UseCircularAnimateOptions {
  duration?: number;
  easing?: string;
  immediate?: boolean;
}

export interface UseCircularAnimateReturn {
  animation: ShallowRef<Animation | undefined>;

  play: () => void;
  pause: () => void;
  resume: () => void;
  reverse: () => void;
  finish: () => void;
  cancel: () => void;

  pending: ComputedRef<boolean>;
  playState: ComputedRef<AnimationPlayState>;
  currentTime: WritableComputedRef<CSSNumberish | null>;
  playbackRate: WritableComputedRef<number>;
}

export function useCircularAnimate(
  el: Readonly<ShallowRef<SVGCircleElement | null>> | Ref<SVGCircleElement | null>,
  circumference: () => number,
  percentage: () => number,
  options: UseCircularAnimateOptions = {},
): UseCircularAnimateReturn {
  const { immediate = true } = options;
  const animation = shallowRef<Animation>();

  const store = shallowReactive({
    pending: false,
    playState: "idle" as AnimationPlayState,
    currentTime: null as CSSNumberish | null,
    playbackRate: 1,
  });

  // --- raf sync ---

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

  // --- core ---

  function createAnimation() {
    if (!el.value) return;
    animation.value?.cancel();

    const c = circumference();
    const offsetEnd = c * (1 - percentage() / 100);

    const anim = el.value.animate(
      [{ strokeDashoffset: String(c) }, { strokeDashoffset: String(offsetEnd) }],
      {
        duration: options.duration ?? 600,
        easing: options.easing ?? "ease",
        fill: "forwards",
      },
    );

    anim.addEventListener("finish", syncPause);
    anim.addEventListener("cancel", syncPause);

    animation.value = anim;
    syncResume();
  }

  // --- controls ---

  const play = () => createAnimation();

  const pause = () => {
    animation.value?.pause();
    syncPause();
  };

  const resume = () => {
    animation.value?.play();
    syncResume();
  };

  const reverse = () => {
    if (!animation.value) createAnimation();
    animation.value?.reverse();
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

  // --- reactive state ---

  const pending = computed(() => store.pending);
  const playState = computed(() => store.playState);

  const currentTime = computed<CSSNumberish | null>({
    get: () => store.currentTime,
    set: (value) => {
      store.currentTime = value;
      if (animation.value) {
        animation.value.currentTime = value;
        syncResume();
      }
    },
  });

  const playbackRate = computed<number>({
    get: () => store.playbackRate,
    set: (value) => {
      store.playbackRate = value;
      if (animation.value) animation.value.playbackRate = value;
    },
  });

  // --- lifecycle ---

  onMounted(() => {
    if (immediate) play();
  });

  onScopeDispose(() => {
    syncPause();
    animation.value?.cancel();
  });

  return {
    animation,
    play,
    pause,
    resume,
    reverse,
    finish,
    cancel,
    pending,
    playState,
    currentTime,
    playbackRate,
  };
}
