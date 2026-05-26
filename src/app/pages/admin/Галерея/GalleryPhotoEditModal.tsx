import { ImageIcon, Upload, Edit3 } from "lucide-react";
import { fetchAsBlobUrl } from "../Работа с изображениями/cropUtils";

interface GalleryPhoto {
  id: string;
  url: string;
  title?: string;
  description?: string;
  original_image?: string;
}

interface GalleryPhotoEditModalProps {
  editingItem: GalleryPhoto | null;
  uploadFile: File | null;
  originalFile: File | null;
  fileRef: React.RefObject<HTMLInputElement | null>;
  onSetOriginalFile: (file: File | null) => void;
  onSetCropImage: (image: string | null) => void;
  onSetCropAspect: (aspect: number | undefined) => void;
  onSetShowCropper: (type: "news" | "gallery") => void;
}

export default function GalleryPhotoEditModal({
  editingItem,
  uploadFile,
  originalFile,
  fileRef,
  onSetOriginalFile,
  onSetCropImage,
  onSetCropAspect,
  onSetShowCropper,
}: GalleryPhotoEditModalProps) {
  return (
    <>
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Название фото (необязательно)</label>
        <input 
          name="title" 
          defaultValue={editingItem?.title}
          className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-blue-dark/20 focus:border-brand-blue-dark"
        />
      </div>
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Описание (необязательно)</label>
        <input 
          name="description" 
          defaultValue={editingItem?.description}
          className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-blue-dark/20 focus:border-brand-blue-dark"
        />
      </div>
      <div className="space-y-4">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Изображение</label>
        {editingItem ? (
          <div className="relative group rounded-2xl overflow-hidden border border-border bg-secondary/30">
            <img 
              src={uploadFile ? URL.createObjectURL(uploadFile) : editingItem.url} 
              className="w-full h-auto object-contain max-h-64"
            />
            <button
              type="button"
              onClick={async () => {
                const originalUrl = editingItem.original_image || editingItem.url;
                try {
                  const imgSrc = originalFile ? URL.createObjectURL(originalFile) : await fetchAsBlobUrl(originalUrl);
                  onSetCropImage(imgSrc);
                  onSetCropAspect(undefined);
                  onSetShowCropper("gallery");
                } catch (e) {
                  alert("Не удалось загрузить изображение для кадрирования");
                }
              }}
              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-bold text-sm"
            >
              <Edit3 className="w-5 h-5" />
              Изменить область
            </button>
          </div>
        ) : (
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-border rounded-2xl p-10 text-center cursor-pointer hover:border-brand-blue-dark/30 transition-colors"
          >
            {uploadFile ? (
              <div className="flex flex-col items-center gap-2">
                <ImageIcon className="w-8 h-8 text-brand-blue-dark" />
                <span className="text-sm font-bold text-brand-blue-dark truncate max-w-[200px]">{uploadFile.name}</span>
              </div>
            ) : (
              <>
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-bold text-muted-foreground">Нажмите или перетащите фото</p>
              </>
            )}
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              if (file.size > 5 * 1024 * 1024) {
                alert("Файл слишком большой. Максимальный размер: 5 МБ");
                e.target.value = "";
                return;
              }
              onSetOriginalFile(file);
              onSetCropImage(URL.createObjectURL(file));
              onSetCropAspect(undefined);
              onSetShowCropper("gallery");
            }
          }}
        />
      </div>
    </>
  );
}
