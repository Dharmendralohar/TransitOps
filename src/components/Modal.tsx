import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  isDirty?: boolean;
  closeOnOutsideClick?: boolean;
  children: React.ReactNode;
  themeType?: 'fleet' | 'drivers' | 'trips' | 'maintenance' | 'fuel' | 'settings' | 'auth' | 'default';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  size = 'md',
  isDirty = false,
  closeOnOutsideClick = true,
  children,
  themeType = 'default',
}) => {
  const [showUnsavedConfirm, setShowUnsavedConfirm] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Theme mapping
  const themeClasses = {
    fleet: 'border-teal-500/20 shadow-[0_0_50px_-12px_rgba(20,184,166,0.25)] bg-slate-900/98',
    drivers: 'border-emerald-500/20 shadow-[0_0_50px_-12px_rgba(16,185,129,0.25)] bg-slate-900/98',
    trips: 'border-blue-500/20 shadow-[0_0_50px_-12px_rgba(59,130,246,0.25)] bg-slate-900/98',
    maintenance: 'border-amber-500/20 shadow-[0_0_50px_-12px_rgba(245,158,11,0.25)] bg-slate-900/98',
    fuel: 'border-rose-500/20 shadow-[0_0_50px_-12px_rgba(244,63,94,0.25)] bg-slate-900/98',
    settings: 'border-indigo-500/20 shadow-[0_0_50px_-12px_rgba(99,102,241,0.25)] bg-slate-900/98',
    auth: 'border-violet-500/20 shadow-[0_0_50px_-12px_rgba(139,92,246,0.25)] bg-slate-900/98',
    default: 'border-slate-800 shadow-premium bg-slate-900/95',
  };

  // Size mapping
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-6xl',
    full: 'max-w-[95vw] h-[95vh]',
  };

  // Track active elements for focus trap
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      // Focus modal container
      setTimeout(() => {
        modalRef.current?.focus();
      }, 50);

      // Disable body scroll
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
      setShowUnsavedConfirm(false);
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle escape press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        handleCloseRequest();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDirty]);

  const handleCloseRequest = () => {
    if (isDirty) {
      setShowUnsavedConfirm(true);
    } else {
      onClose();
    }
  };

  const handleOutsideClick = (e: React.MouseEvent) => {
    if (closeOnOutsideClick && modalRef.current && !modalRef.current.contains(e.target as Node)) {
      handleCloseRequest();
    }
  };

  // Focus trap
  const handleTabTrap = (e: React.KeyboardEvent) => {
    if (!modalRef.current) return;
    const focusableElements = modalRef.current.querySelectorAll(
      'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex="0"], [contenteditable]'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          {/* Backdrop blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
            onClick={handleOutsideClick}
          />

          {/* Modal Container */}
          <motion.div
            ref={modalRef}
            tabIndex={-1}
            onKeyDown={handleTabTrap}
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className={`relative w-full ${sizeClasses[size]} flex flex-col border rounded-2xl overflow-hidden focus:outline-none max-h-[90vh] transition-all duration-300 ${themeClasses[themeType]}`}
          >
            {/* Ambient Background Glow */}
            {themeType && themeType !== 'default' && (
              <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-20 -mr-32 -mt-32 transition-all duration-300 ${
                themeType === 'fleet' ? 'bg-teal-500' :
                themeType === 'drivers' ? 'bg-emerald-500' :
                themeType === 'trips' ? 'bg-blue-500' :
                themeType === 'maintenance' ? 'bg-amber-500' :
                themeType === 'fuel' ? 'bg-rose-500' :
                themeType === 'settings' ? 'bg-indigo-500' :
                themeType === 'auth' ? 'bg-violet-500' : ''
              }`} />
            )}

            {/* Modal Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-slate-900/90 border-b border-slate-800/80 backdrop-blur-sm">
              <h2 id="modal-title" className="text-lg font-bold text-slate-100 flex items-center gap-2">
                {title}
              </h2>
              <button
                onClick={handleCloseRequest}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-all"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 custom-scrollbar text-slate-300">
              {children}
            </div>

            {/* Nested Unsaved Changes Alert Box */}
            <AnimatePresence>
              {showUnsavedConfirm && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute inset-0 z-20 flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-sm"
                >
                  <div className="bg-slate-900 border border-amber-500/30 rounded-xl p-6 max-w-sm shadow-premium flex flex-col items-center text-center">
                    <div className="p-3 bg-amber-500/10 text-amber-500 rounded-full mb-4">
                      <AlertTriangle size={32} className="animate-pulse" />
                    </div>
                    <h3 className="text-base font-bold text-slate-100 mb-1">Unsaved Changes</h3>
                    <p className="text-sm text-slate-400 mb-6">
                      You have modified form fields. Are you sure you want to discard your edits and close this window?
                    </p>
                    <div className="flex w-full gap-3">
                      <button
                        onClick={() => setShowUnsavedConfirm(false)}
                        className="flex-1 px-4 py-2 text-sm font-medium bg-slate-800 text-slate-200 hover:bg-slate-700 rounded-xl transition"
                      >
                        Keep Editing
                      </button>
                      <button
                        onClick={() => {
                          setShowUnsavedConfirm(false);
                          onClose();
                        }}
                        className="flex-1 px-4 py-2 text-sm font-medium bg-rose-600 text-white hover:bg-rose-500 rounded-xl transition"
                      >
                        Discard
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export const ModalHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="text-lg font-bold text-slate-100 mb-4">{children}</div>
);

export const ModalBody: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="space-y-4">{children}</div>
);

export const ModalFooter: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="sticky bottom-0 z-10 flex items-center justify-end gap-3 px-6 py-4 bg-slate-900/90 border-t border-slate-800/80 backdrop-blur-sm mt-5">
    {children}
  </div>
);
