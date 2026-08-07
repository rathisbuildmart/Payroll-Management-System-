import { useEffect, useRef } from 'react';

/**
 * Custom hook to handle browser/device back button for modals, drawers, and menus.
 * When `isOpen` is true, it pushes a entry into window.history.
 * If the user presses the Back button, it triggers `onClose()`.
 * If the user closes the modal via UI (e.g. 'X' button), it automatically pops the history entry to keep history clean.
 */
export function useModalBackHandler(isOpen: boolean, onClose: () => void, modalId: string = 'modal') {
  const isPoppedByBackButton = useRef(false);
  const onCloseRef = useRef(onClose);

  // Keep onClose ref current without causing effect cleanup
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!isOpen) return;

    isPoppedByBackButton.current = false;
    const currentState = { isAppModal: true, modalId, time: Date.now() };

    // Push history state when modal opens
    window.history.pushState(currentState, '');

    const handlePopState = (e: PopStateEvent) => {
      // Set flag so cleanup doesn't call history.back() again
      isPoppedByBackButton.current = true;
      onCloseRef.current();
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);

      // If closed programmatically (e.g., via 'X' button or overlay click),
      // pop the history entry that we pushed when the modal opened.
      if (!isPoppedByBackButton.current && window.history.state?.isAppModal) {
        window.history.back();
      }
    };
  }, [isOpen, modalId]);
}
