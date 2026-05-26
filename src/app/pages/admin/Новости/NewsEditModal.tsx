import { X, ImageIcon, Upload, Edit3 } from "lucide-react";
import { fetchAsBlobUrl } from "../Работа с изображениями/cropUtils";

interface NewsItem {
  id: string;
  title: string;
  text: string;
  image: string;
  preview_image?: string;
  original_image?: string;
  additional_images?: string[];
}

interface NewsEditModalProps {
  editingItem: NewsItem | null;
  uploadFile: File | null;
  originalFile: File | null;
  newsAdditionalImages: File[];
  newsAdditionalImagePreviews: string[];
  existingAdditionalImages: string[];
  newsFileRef: React.RefObject<HTMLInputElement | null>;
  onSetOriginalFile: (file: File | null) => void;
  onSetCropImage: (image: string | null) => void;
  onSetCropAspect: (aspect: number) => void;
  onSetShowCropper: (type: "news" | "gallery") => void;
  onSetNewsAdditionalImages: (images: File[]) => void;
  onSetNewsAdditionalImagePreviews: (previews: string[]) => void;
  onSetExistingAdditionalImages: (images: string[]) => void;
}

export default function NewsEditModal({
  editingItem,
  uploadFile,
  originalFile,
  newsAdditionalImages,
  newsAdditionalImagePreviews,
  existingAdditionalImages,
  newsFileRef,
  onSetOriginalFile,
  onSetCropImage,
  onSetCropAspect,
  onSetShowCropper,
  onSetNewsAdditionalImages,
  onSetNewsAdditionalImagePreviews,
  onSetExistingAdditionalImages,
}: NewsEditModalProps) {
  return (
    <>
      {/* Заголовок */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Заголовок</label>
        <input 
          name="title" 
          defaultValue={editingItem?.title} 
          required 
          className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-blue-dark/20 focus:border-brand-blue-dark"
        />
      </div>

      {/* Текст новости */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Текст новости</label>
        <textarea
          name="text"
          maxLength={10000}
          defaultValue={editingItem?.text}
          required
          rows={4}
          className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-blue-dark/20 focus:border-brand-blue-dark"
        />
      </div>

      {/* Изображение новости */}
      <div className="space-y-4">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Изображение новости (для превью)</label>
        {editingItem ? (
          <div className="relative group rounded-2xl overflow-hidden border border-border aspect-video bg-secondary/30">
            <img 
              src={uploadFile ? URL.createObjectURL(uploadFile) : editingItem.image} 
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={async () => {
                const originalUrl = editingItem.original_image || editingItem.image;
                const imgSrc = originalFile ? URL.createObjectURL(originalFile) : await fetchAsBlobUrl(originalUrl);
                onSetCropImage(imgSrc);
                onSetCropAspect(16 / 9);
                onSetShowCropper("news");
              }}
              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-bold text-sm"
            >
              <Edit3 className="w-5 h-5" />
              Изменить область
            </button>
          </div>
        ) : (
          <>
            <div
              onClick={() => newsFileRef.current?.click()}
              className="border-2 border-dashed border-border rounded p-6 text-center cursor-pointer hover:border-brand-blue-dark/30 transition-colors"
            >
              {uploadFile ? (
                <div className="flex items-center justify-center gap-2 text-sm">
                  <ImageIcon className="w-4 h-4" />
                  <span className="font-medium truncate max-w-[200px]">{uploadFile.name}</span>
                </div>
              ) : (
                <>
                  <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Нажмите или перетащите изображение</p>
                </>
              )}
            </div>
            <input
              ref={newsFileRef}
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
                  onSetCropAspect(16 / 9);
                  onSetShowCropper("news");
                }
              }}
            />
          </>
        )}
      </div>

      {/* Дополнительные фотографии */}
      <div className="space-y-4">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Дополнительные фотографии</label>
        <div className="border-2 border-dashed border-border rounded-xl p-4">
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            id="news-additional-images"
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              if (files.length > 0) {
                const validFiles = files.filter(file => {
                  if (file.size > 10 * 1024 * 1024) {
                    alert(`Файл ${file.name} слишком большой. Максимальный размер: 5 МБ`);
                    return false;
                  }
                  return true;
                });
                onSetNewsAdditionalImages([...newsAdditionalImages, ...validFiles]);
                const previews = validFiles.map(file => URL.createObjectURL(file));
                onSetNewsAdditionalImagePreviews([...newsAdditionalImagePreviews, ...previews]);
              }
              e.target.value = "";
            }}
          />
          <label
            htmlFor="news-additional-images"
            className="cursor-pointer flex flex-col items-center justify-center gap-2 py-4 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Upload className="w-6 h-6" />
            <p className="text-sm">Нажмите для выбора дополнительных фотографий</p>
          </label>
        </div>

        {/* Уже сохранённые дополнительные фотографии */}
        {editingItem && existingAdditionalImages.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Текущие доп. фото ({existingAdditionalImages.length})</p>
            <div className="grid grid-cols-3 gap-2">
              {existingAdditionalImages.map((url: string, index: number) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-border group/img">
                  <img src={url} alt={`Доп. фото ${index + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => onSetExistingAdditionalImages(existingAdditionalImages.filter((_, i) => i !== index))}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors opacity-0 group-hover/img:opacity-100"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground italic">Нажмите ✕ на фото, чтобы удалить. Добавьте новые фото ниже.</p>
          </div>
        )}

        {/* Превью дополнительных фотографий */}
        {newsAdditionalImagePreviews.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {newsAdditionalImagePreviews.map((preview, index) => (
              <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-border">
                <img src={preview} alt={`Доп. фото ${index + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    onSetNewsAdditionalImages(newsAdditionalImages.filter((_, i) => i !== index));
                    onSetNewsAdditionalImagePreviews(newsAdditionalImagePreviews.filter((_, i) => i !== index));
                  }}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
