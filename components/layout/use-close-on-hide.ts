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
