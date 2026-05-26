import { motion, AnimatePresence } from "motion/react";
import { X, Save } from "lucide-react";
import ReactCrop, { type PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import PreviewCanvas from "./PreviewCanvas.tsx";

interface HeroCropperModalProps {
  show: boolean;
  cropImage: string | null;
  aspect: "16:9" | "9:16";
  crop: any;
  completedCrop: any;
  completedCropRef: React.RefObject<PixelCrop | undefined>;
  imgRef: React.RefObject<HTMLImageElement | null>;
  onSetCrop: (crop: any) => void;
  onSetCompletedCrop: (crop: any) => void;
  onClose: () => void;
  onApplyCrop: () => Promise<void>;
}

export default function HeroCropperModal({
  show,
  cropImage,
  aspect,
  crop,
  completedCrop,
  completedCropRef,
  imgRef,
  onSetCrop,
  onSetCompletedCrop,
  onClose,
  onApplyCrop,
}: HeroCropperModalProps) {
  return (
    <AnimatePresence>
      {show && cropImage && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-4xl bg-card border border-border rounded-3xl overflow-hidden flex flex-col"
            style={{ maxHeight: "90vh" }}
          >
            {/* Header */}
            <div className="p-5 border-b border-border flex items-center justify-between bg-card shrink-0">
              <div>
                <h2 className="text-lg font-black text-brand-blue-dark">Обрезка изображения</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Формат {aspect} — выберите нужную область</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-secondary rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cropper area */}
            <div className="flex-1 min-h-0 overflow-auto flex items-center justify-center bg-neutral-900 p-6">
              <ReactCrop
                crop={crop}
                onChange={(c) => onSetCrop(c)}
                onComplete={(c) => { completedCropRef.current = c; onSetCompletedCrop(c); }}
                aspect={aspect === "16:9" ? 16 / 9 : 9 / 16}
              >
                <img
                  ref={imgRef}
                  src={cropImage}
                  alt="Crop source"
                  style={{ display: "block", maxWidth: "100%", maxHeight: "calc(90vh - 220px)", width: "auto", height: "auto" }}
                  onLoad={(e) => {
                    const el = e.currentTarget;
                    const aspectRatio = aspect === "16:9" ? 16 / 9 : 9 / 16;
                    const { width, height } = el;
                    const newCrop = centerCrop(makeAspectCrop({ unit: "%", width: 90 }, aspectRatio, width, height), width, height);
                    onSetCrop(newCrop);
                    const pxX = (newCrop.x / 100) * width;
                    const pxY = (newCrop.y / 100) * height;
                    const pxW = (newCrop.width / 100) * width;
                    const pxH = (newCrop.height / 100) * height;
                    const initial: PixelCrop = { unit: "px", x: pxX, y: pxY, width: pxW, height: pxH };
                    completedCropRef.current = initial;
                    onSetCompletedCrop(initial);
                  }}
                />
              </ReactCrop>
            </div>

            {/* Preview + Actions */}
            <div className="p-5 border-t border-border bg-card flex flex-col sm:flex-row items-center gap-5 shrink-0">
              {/* Inline preview */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-xs font-bold text-muted-foreground uppercase shrink-0">Превью:</span>
                <div
                  className="rounded-lg overflow-hidden border border-border bg-neutral-900 shrink-0"
                  style={aspect === "16:9"
                    ? { width: 160, height: 90 }
                    : { width: 56, height: 100 }
                  }
                >
                  {completedCrop && imgRef.current && (
                    <PreviewCanvas
                      imgRef={imgRef}
                      crop={completedCrop}
                      aspect={aspect === "16:9" ? 16 / 9 : 9 / 16}
                    />
                  )}
                </div>
              </div>
              <div className="flex gap-3 ml-auto">
                <button
                  onClick={onClose}
                  className="px-5 py-3 rounded-xl font-bold border border-border hover:bg-secondary transition-all text-sm"
                >
                  Отмена
                </button>
                <button
                  onClick={onApplyCrop}
                  className="px-6 py-3 bg-brand-blue-dark text-white rounded-xl font-bold flex items-center gap-2 hover:shadow-lg transition-all text-sm"
                >
                  <Save className="w-4 h-4" />
                  Применить обрезку
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
