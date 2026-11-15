import { computed, ref, type ComputedRef } from "vue";
import { treeVariants, type TreeVariant, type TreeVariantId } from "./variants";

export type VariantSlotCtx = {
  variant: ComputedRef<TreeVariant>;
  /** id of the variant the *other* slot has — must be disabled in this slot's selector. */
  excluded: ComputedRef<TreeVariantId>;
  set: (id: TreeVariantId) => void;
};

const byId = new Map(treeVariants.map((v) => [v.id, v]));

/**
 * Pair of variant slots that stay mutually exclusive by *exclusion*: each side
 * exposes the other side's current id as `excluded`, so the UI can disable that
 * option in its selector. `set` rejects the excluded id defensively. No swap,
 * no surprise reshuffling.
 */
export function useExclusiveVariantPair(
  initialLeft: TreeVariantId,
  initialRight: TreeVariantId,
): {
  leftCtx: VariantSlotCtx;
  rightCtx: VariantSlotCtx;
} {
  if (initialLeft === initialRight) {
    throw new Error("useExclusiveVariantPair: initial values must differ");
  }

  const leftId = ref<TreeVariantId>(initialLeft);
  const rightId = ref<TreeVariantId>(initialRight);

  const makeCtx = (self: typeof leftId, other: typeof rightId): VariantSlotCtx => ({
    variant: computed(() => byId.get(self.value)!),
    excluded: computed(() => other.value),
    set: (id) => {
      if (id === other.value) return;
      self.value = id;
    },
  });

  return {
    leftCtx: makeCtx(leftId, rightId),
    rightCtx: makeCtx(rightId, leftId),
  };
}

/** The variants as select options, with the slot's excluded one disabled */
export const variantOptions = (ctx: VariantSlotCtx) =>
  computed(() =>
    treeVariants.map((v) => ({
      value: v.id,
      label: v.label,
      disabled: v.id === ctx.excluded.value,
    })),
  );
