import { motion, AnimatePresence } from "motion/react";
import { X, Save } from "lucide-react";

interface EditModalWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  submitting: boolean;
  title: string;
  children: React.ReactNode;
}

export default function EditModalWrapper({
  isOpen,
  onClose,
  onSubmit,
  submitting,
  title,
  children,
}: EditModalWrapperProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl flex flex-col"
            style={{ maxHeight: "90vh" }}
          >
            <div className="flex items-center justify-between px-8 pt-8 pb-4 flex-shrink-0">
              <h2 className="text-2xl font-black text-brand-blue-dark">
                {title}
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-secondary rounded-xl">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={onSubmit} className="space-y-6 overflow-y-auto px-8 pb-8 flex-1">
              {children}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-brand-blue-dark text-white font-bold py-4 rounded-2xl shadow-lg hover:shadow-brand-blue-dark/20 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Сохранение...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Сохранить
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
