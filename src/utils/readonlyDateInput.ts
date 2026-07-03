import type { Directive } from 'vue';

/**
 * Forces the native input rendered by VueDatePicker to be readonly so users
 * can only pick a date from the calendar, never type one in. Setting this on
 * the DOM node (rather than the component's own `readonly` prop) avoids also
 * disabling the component's click-to-open-calendar behavior, which is gated
 * on the prop rather than the native attribute.
 */
function applyReadonly(el: HTMLElement) {
  const input = el.querySelector('input');
  if (input) input.readOnly = true;
}

export const vReadonlyDate: Directive<HTMLElement> = {
  mounted: applyReadonly,
  updated: applyReadonly
};
