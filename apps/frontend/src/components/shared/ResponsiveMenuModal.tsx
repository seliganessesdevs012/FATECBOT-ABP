import { type ReactNode, type RefObject, useEffect, useRef } from "react";

import { X } from "lucide-react";

import { cn } from "@/lib/utils";

type ResponsiveMenuModalProps = {
      open: boolean;
      title: string;
      onClose: () => void;
      initialFocusRef?: RefObject<HTMLElement | null>;
      children: ReactNode;
};

export function ResponsiveMenuModal({
      open,
      title,
      onClose,
      initialFocusRef,
      children,
}: ResponsiveMenuModalProps) {
      const closeButtonRef = useRef<HTMLButtonElement | null>(null);

      useEffect(() => {
            if (!open) {
                  return undefined;
            }

            const previousOverflow = document.body.style.overflow;
            document.body.style.overflow = "hidden";

            const focusTarget = initialFocusRef?.current ?? closeButtonRef.current;
            focusTarget?.focus();

            const handleKeyDown = (event: KeyboardEvent) => {
                  if (event.key === "Escape") {
                        onClose();
                  }
            };

            window.addEventListener("keydown", handleKeyDown);

            return () => {
                  document.body.style.overflow = previousOverflow;
                  window.removeEventListener("keydown", handleKeyDown);
            };
      }, [initialFocusRef, onClose, open]);

      if (!open) {
            return null;
      }

      return (
            <div
                  role="dialog"
                  aria-modal="true"
                  aria-label={title}
                  className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
                  <button
                        type="button"
                        aria-label="Fechar menu"
                        className="absolute inset-0 cursor-default bg-black/40"
                        onClick={onClose}
                  />

                  <div
                        className={cn(
                              "relative w-full max-w-md rounded-2xl border border-[#E7DED0] bg-white p-5 shadow-2xl",
                        )}
                  >
                        <div className="flex items-center justify-between gap-3">
                              <div>
                                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#8C7E6C]">
                                          Menu
                                    </p>
                                    <h3 className="mt-1 text-xl font-black text-[#33383D]">{title}</h3>
                              </div>

                              <button
                                    ref={closeButtonRef}
                                    type="button"
                                    aria-label="Fechar menu"
                                    onClick={onClose}
                                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#F3EEE3] text-[#454545] transition-colors hover:bg-[#E9E1D4]"
                              >
                                    <X className="size-5" aria-hidden="true" />
                              </button>
                        </div>

                        <div className="mt-5">{children}</div>
                  </div>
            </div>
      );
}
