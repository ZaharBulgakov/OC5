import { motion, AnimatePresence } from "motion/react";
import { X, Save } from "lucide-react";
import ReactCrop, { type Crop as RicCrop, type PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import PreviewCanvas from "./PreviewCanvas";
import { initCropForAspect } from "./cropUtils";

interface ImageCropperModalProps {
  show: "news" | "gallery" | null;
  cropImage: string | null;
  crop: RicCrop | undefined;
  completedCrop: PixelCrop | undefined;
  completedCropRef: React.RefObject<PixelCrop | undefined>;
  imgRef: React.RefObject<HTMLImageElement | null>;
  cropAspect: number | undefined;
  isSquareMax: boolean;
  imgNaturalSize: { w: number; h: number };
  onSetCrop: (crop: RicCrop | undefined) => void;
  onSetCompletedCrop: (crop: PixelCrop | undefined) => void;
  onSetCropAspect: (aspect: number | undefined) => void;
  onSetIsSquareMax: (isSquareMax: boolean) => void;
  onSetImgNaturalSize: (size: { w: number; h: number }) => void;
  onClose: () => void;
  onApplyCrop: () => Promise<void>;
}

export default function ImageCropperModal({
  show,
  cropImage,
  crop,
  completedCrop,
  completedCropRef,
  imgRef,
  cropAspect,
  isSquareMax,
  imgNaturalSize,
  onSetCrop,
  onSetCompletedCrop,
  onSetCropAspect,
  onSetIsSquareMax,
  onSetImgNaturalSize,
  onClose,
  onApplyCrop,
}: ImageCropperModalProps) {
  return (
    <AnimatePresence>
      {show !== null && cropImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-6xl bg-card border border-border rounded-3xl overflow-hidden h-[90vh] flex flex-col"
          >
            <div className="p-6 border-b border-border flex items-center justify-between bg-card relative z-10">
              <div>
                <h2 className="text-xl font-black text-brand-blue-dark">Настройка области изображения</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  {show === "news" ? "Выберите область для новости" : "Выберите область для галереи"}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-secondary rounded-xl"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-neutral-900">
              <div className="flex-1 flex flex-col min-h-0">
                {/* Пресеты соотношений */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 flex-wrap shrink-0">
                  <span className="text-xs text-white/40 uppercase font-bold mr-1">Формат:</span>
                  {([
                    { label: "16:9",     value: 16 / 9 },
                    { label: "4:3",      value: 4 / 3 },
                    { label: "3:2",      value: 3 / 2 },
                    { label: "1:1",      value: 1 },
                    { label: "3:4",      value: 3 / 4 },
                    { label: "9:16",     value: 9 / 16 },
                    { label: "Свободно", value: undefined as number | undefined },
                  ] as { label: string; value: number | undefined }[]).map(({ label, value }) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => {
                          onSetCropAspect(value);
                          initCropForAspect(value, imgRef, onSetCrop);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                          cropAspect === value
                            ? "bg-brand-blue-dark text-white border-brand-blue-dark"
                            : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10"
                        }`}
                      >
                        {label}
                        {label === "Свободно" && cropAspect === undefined && completedCrop && completedCrop.width > 0 && completedCrop.height > 0 && (
                          <span className="ml-1 opacity-70">
                            {(() => {
                              const scaleX = imgNaturalSize.w / (imgRef.current?.width ?? imgNaturalSize.w);
                              const scaleY = imgNaturalSize.h / (imgRef.current?.height ?? imgNaturalSize.h);
                              const pw = Math.round(completedCrop.width * scaleX);
                              const ph = Math.round(completedCrop.height * scaleY);
                              const g = (a: number, b: number): number => b === 0 ? a : g(b, a % b);
                              const d = g(pw, ph);
                              return `(${pw/d}:${ph/d})`;
                            })()}
                          </span>
                        )}
                      </button>
                    ))}
                </div>

                {/* Кроппер */}
                <div className="flex-1 min-h-0 overflow-auto flex items-center justify-center" style={{ padding: "24px 32px" }}>
                  <ReactCrop
                    crop={crop}
                    onChange={(c) => onSetCrop(c)}
                    onComplete={(c) => { completedCropRef.current = c; onSetCompletedCrop(c); }}
                    aspect={cropAspect}
                  >
                    <img
                      ref={imgRef}
                      src={cropImage}
                      alt="Crop source"
                      style={{ display: "block", maxWidth: "100%", maxHeight: "calc(90vh - 240px)", width: "auto", height: "auto", objectFit: "contain" }}
                      onLoad={(e) => {
                        const el = e.currentTarget;
                        onSetImgNaturalSize({ w: el.naturalWidth, h: el.naturalHeight });
                        const { width, height } = el;
                        const aspect = cropAspect;
                        let newCrop: RicCrop;
                        if (aspect) {
                          newCrop = centerCrop(makeAspectCrop({ unit: "%", width: 90 }, aspect, width, height), width, height);
                        } else {
                          newCrop = { unit: "%", x: 5, y: 5, width: 90, height: 90 };
                        }
                        onSetCrop(newCrop);
                        const pxX = (newCrop.x / 100) * width;
                        const pxY = (newCrop.y / 100) * height;
                        const pxW = (newCrop.width / 100) * width;
                        const pxH = (newCrop.height / 100) * height;
                        const initialPixelCrop: PixelCrop = { unit: "px", x: pxX, y: pxY, width: pxW, height: pxH };
                        completedCropRef.current = initialPixelCrop;
                        onSetCompletedCrop(initialPixelCrop);
                      }}
                    />
                  </ReactCrop>
                </div>
              </div>

              {/* Preview Sidebar — только для новостей */}
              {show === "news" && (
                <div className="w-full lg:w-80 bg-card p-6 overflow-y-auto border-l border-border flex flex-col gap-8">
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Предпросмотр</h3>
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-neutral-900 border border-border shadow-inner">
                      {completedCrop && imgRef.current && (
                        <PreviewCanvas
                          imgRef={imgRef}
                          crop={completedCrop}
                          aspect={cropAspect ?? (completedCrop.width / completedCrop.height)}
                        />
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-relaxed italic text-center">Так новость будет выглядеть при полном открытии.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Миниатюра (1:1)</h3>
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={isSquareMax}
                            onChange={(e) => onSetIsSquareMax(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-8 h-4 bg-secondary border border-border rounded-full peer peer-checked:bg-brand-blue-dark transition-colors"></div>
                          <div className="absolute left-1 top-1 w-2 h-2 bg-muted-foreground rounded-full peer-checked:translate-x-4 peer-checked:bg-white transition-transform"></div>
                        </div>
                        <span className="text-[10px] font-bold text-muted-foreground group-hover:text-brand-blue-dark transition-colors uppercase">Макс. область</span>
                      </label>
                    </div>
                    <div className="flex justify-center">
                      <div className="relative w-32 h-32 rounded-2xl overflow-hidden bg-neutral-900 border border-border shadow-md">
                        {completedCrop && imgRef.current && (
                          <PreviewCanvas
                            imgRef={imgRef}
                            crop={completedCrop}
                            aspect={1}
                            isSquareMax={isSquareMax}
                          />
                        )}
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-relaxed italic text-center px-2">
                      {isSquareMax ? "Максимально возможная область по центру." : "Центрируется автоматически."}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-border bg-card relative z-10">
              <div className="flex items-center gap-6">
                <div className="flex gap-3 ml-auto">
                  <button
                    onClick={onClose}
                    className="px-6 py-3 rounded-xl font-bold border border-border hover:bg-secondary transition-all"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={onApplyCrop}
                    className="px-8 py-3 bg-brand-blue-dark text-white rounded-xl font-bold shadow-lg hover:shadow-brand-blue-dark/20 transition-all flex items-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    Сохранить результат
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
