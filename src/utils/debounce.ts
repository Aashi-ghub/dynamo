export function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): (...args: Parameters<T>) => void {
  let timeoutID: ReturnType<typeof setTimeout> | undefined;

  return function(this: any, ...args: Parameters<T>) {
    clearTimeout(timeoutID);
    timeoutID = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}
