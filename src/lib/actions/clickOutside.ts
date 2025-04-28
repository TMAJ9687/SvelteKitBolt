import type { Action } from 'svelte/action';

export const clickOutside: Action<HTMLElement, () => void> = (node, callback) => {
  const handleClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (node && !node.contains(target) && !event.defaultPrevented && target !== node) {
      callback();
    }
  };

  const handleEscape = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      callback();
    }
  };

  document.addEventListener('click', handleClick, true);
  document.addEventListener('keydown', handleEscape, true);

  return {
    destroy() {
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('keydown', handleEscape, true);
    }
  };
};