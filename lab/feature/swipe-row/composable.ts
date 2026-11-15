import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  toValue,
  watch,
  type MaybeRefOrGetter,
  type Ref,
} from "vue";

import { axisOf, resist, settlesOpen } from "./core/swipe";

/**
 * A row a finger slides left to show its actions behind it. `root` is the row, `set` the
 * actions at their own width, `content` what slides over them. `open` is kept by the owner;
 * `toggle` asks it to change. Only a finger slides the row (mouse, keyboard and screen reader
 * reach the actions some other way the owner provides). While open, a tap on the row, a touch
 * anywhere else or a scroll closes it.
 */
export function useSwipeRow(
  root: Readonly<Ref<HTMLElement | null>>,
  set: Readonly<Ref<HTMLElement | null>>,
  content: Readonly<Ref<HTMLElement | null>>,
  options: { open: MaybeRefOrGetter<boolean>; toggle: (open: boolean) => void },
) {
  const isOpen = () => toValue(options.open);

  /** The actions' own width: how far the row goes to show them, measured when a finger lands */
  const width = ref(0);
  /** Where a finger holds the row; null when it is not */
  const drag = ref<number | null>(null);
  const offset = computed(() => drag.value ?? (isOpen() ? -width.value : 0));

  let start: { id: number; x: number; y: number; from: number } | null = null;
  let axis: "x" | "y" | null = null;
  let last = { x: 0, t: 0 };
  let velocity = 0;
  /** A slide ends in a click on whatever was under the finger, which is not a tap */
  let swallow = false;

  function down(e: PointerEvent) {
    swallow = false;
    if (e.pointerType !== "touch" || !e.isPrimary || set.value === null) return;
    width.value = set.value.offsetWidth;
    start = { id: e.pointerId, x: e.clientX, y: e.clientY, from: isOpen() ? -width.value : 0 };
    axis = null;
    last = { x: e.clientX, t: e.timeStamp };
    velocity = 0;
  }

  function move(e: PointerEvent) {
    if (start === null || e.pointerId !== start.id) return;
    const dx = e.clientX - start.x;
    if (axis === null) {
      axis = axisOf(dx, e.clientY - start.y);
      if (axis === null) return;
      // an upright move is the list scrolling: the browser has it (touch-action), and an open row shuts
      if (axis === "y") {
        start = null;
        if (isOpen()) options.toggle(false);
        return;
      }
      root.value?.setPointerCapture(e.pointerId);
    }
    const dt = e.timeStamp - last.t;
    if (dt > 0) velocity = (e.clientX - last.x) / dt;
    last = { x: e.clientX, t: e.timeStamp };
    drag.value = resist(start.from + dx, width.value);
  }

  function up(e: PointerEvent) {
    if (start === null || e.pointerId !== start.id) return;
    start = null;
    if (drag.value === null) return;
    swallow = true;
    options.toggle(settlesOpen(drag.value, width.value, velocity));
    drag.value = null;
  }

  function cancel() {
    start = null;
    drag.value = null;
  }

  /** Native and capturing, so the row's own links and buttons never see a click it takes */
  function click(e: MouseEvent) {
    const onContent = content.value?.contains(e.target as Node) ?? false;
    if (!swallow && !(isOpen() && onContent)) return;
    e.preventDefault();
    e.stopPropagation();
    if (!swallow) options.toggle(false);
    swallow = false;
  }

  /** A touch outside the row while it is open */
  function outside(e: PointerEvent) {
    if (!(root.value?.contains(e.target as Node) ?? false)) options.toggle(false);
  }

  watch(
    isOpen,
    (open) => {
      if (open) document.addEventListener("pointerdown", outside, true);
      else document.removeEventListener("pointerdown", outside, true);
    },
    { immediate: true },
  );
  onMounted(() => root.value?.addEventListener("click", click, true));
  onBeforeUnmount(() => {
    root.value?.removeEventListener("click", click, true);
    document.removeEventListener("pointerdown", outside, true);
  });

  return { drag, offset, handlers: { down, move, up, cancel } };
}
