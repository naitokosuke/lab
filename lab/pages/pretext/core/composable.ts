import { computed, toValue, type MaybeRefOrGetter } from "vue";
import { prepareWithSegments, type PrepareOptions } from "./index";

export function usePretext(
  text: MaybeRefOrGetter<string>,
  font: MaybeRefOrGetter<string>,
  options?: MaybeRefOrGetter<PrepareOptions | undefined>,
) {
  const prepared = computed(() =>
    prepareWithSegments(toValue(text), toValue(font), toValue(options)),
  );
  return { prepared };
}
