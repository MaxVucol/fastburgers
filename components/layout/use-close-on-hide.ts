import { useEffect, type RefObject } from "react";

/**
 * Closes a modal <dialog> when its part of the page is hidden or removed.
 *
 * After a language change the router keeps the previous page tree in the document, hidden, and shows the new
 * one. A modal dialog left open in the hidden tree stays in the browser's top layer: the whole document is then
 * blocked by it (nothing on the new page can be tapped, the menu button included) although the dialog itself
 * is no longer shown. React cleans effects up when a tree is hidden, so closing it here releases the page.
 */
export function useCloseOnHide(ref: RefObject<HTMLDialogElement | null>) {
  useEffect(() => {
    const dialog = ref.current;
    return () => {
      if (dialog?.open) dialog.close();
    };
  }, [ref]);
}

/** The exit animations (globals.css) a dialog may play while it has `data-closing`. */
const EXIT_ANIMATIONS = ["drawer-left-out", "sheet-out"];

/**
 * Closes a drawer or sheet <dialog> the way it opened: `data-closing` plays the exit animation (and the backdrop fade) from
 * globals.css, and the dialog is really closed when that animation ends. Visitors who ask for less motion get
 * an immediate close, and a timer closes it anyway should the animation never report back.
 */
export function closeWithAnimation(dialog: HTMLDialogElement | null) {
  if (!dialog?.open || dialog.hasAttribute("data-closing")) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    dialog.close();
    return;
  }
  const finish = () => {
    dialog.removeEventListener("animationend", onEnd);
    window.clearTimeout(timer);
    dialog.removeAttribute("data-closing");
    if (dialog.open) dialog.close();
  };
  const onEnd = (event: AnimationEvent) => {
    if (event.target === dialog && EXIT_ANIMATIONS.includes(event.animationName)) finish();
  };
  const timer = window.setTimeout(finish, 500);
  dialog.addEventListener("animationend", onEnd);
  dialog.setAttribute("data-closing", "");
}
