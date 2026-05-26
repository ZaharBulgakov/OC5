import { motion } from "motion/react";
import { Upload, Save } from "lucide-react";
import { supabase } from "../../../lib/supabase";

interface HomeHeroEditorProps {
  heroAspect: "16:9" | "9:16";
  heroImageFile: File | null;
  heroImagePreview: string | null;
  heroCurrentUrl: string | null;
  heroSaving: boolean;
  heroSuccess: boolean;
  heroFileRef: React.RefObject<HTMLInputElement | null>;
  onSetHeroAspect: (aspect: "16:9" | "9:16") => void;
  onSetHeroImageFile: (file: File | null) => void;
  onSetHeroImagePreview: (preview: string | null) => void;
  onSetHeroCropImage: (image: string | null) => void;
  onSetShowHeroCropper: (show: boolean) => void;
  onSetHeroCrop: (crop: any) => void;
  onSetHeroCompletedCrop: (crop: any) => void;
  heroCompletedCropRef: React.RefObject<any>;
  onSetHeroCurrentUrl: (url: string | null) => void;
  onSetHeroSaving: (saving: boolean) => void;
  onSetHeroSuccess: (success: boolean) => void;
}

export default function HomeHeroEditor({
  heroAspect,
  heroImageFile,
  heroImagePreview,
  heroCurrentUrl,
  heroSaving,
  heroSuccess,
  heroFileRef,
  onSetHeroAspect,
  onSetHeroImageFile,
  onSetHeroImagePreview,
  onSetHeroCropImage,
  onSetShowHeroCropper,
  onSetHeroCrop,
  onSetHeroCompletedCrop,
  heroCompletedCropRef,
  onSetHeroCurrentUrl,
  onSetHeroSaving,
  onSetHeroSuccess,
}: HomeHeroEditorProps) {
  const handleSave = async () => {
    if (!heroImageFile && !heroCurrentUrl) {
      alert("Сначала загрузите изображение");
      return;
    }
    onSetHeroSaving(true);
    onSetHeroSuccess(false);
    try {
      let imageUrl = heroCurrentUrl || "";
      if (heroImageFile) {
        const ext = heroImageFile.name.split(".").pop();
        const path = `hero/hero-${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("news")
          .upload(path, heroImageFile, { upsert: true });
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from("news").getPublicUrl(path);
        imageUrl = urlData.publicUrl;
      }
      const { data: updateData, error: updateError } = await supabase
        .from("site_config")
        .update({ hero_image_url: imageUrl, hero_aspect: heroAspect })
        .eq("id", 1)
        .select();
      if (updateError) throw updateError;
      if (!updateData || updateData.length === 0) {
        const { error: insertError } = await supabase
          .from("site_config")
          .insert({ id: 1, hero_image_url: imageUrl, hero_aspect: heroAspect });
        if (insertError) throw insertError;
      }
      onSetHeroCurrentUrl(imageUrl);
      onSetHeroImageFile(null);
      onSetHeroSuccess(true);
      setTimeout(() => onSetHeroSuccess(false), 3000);
    } catch (err: any) {
      alert("Ошибка при сохранении: " + err.message);
    }
    onSetHeroSaving(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Aspect selector */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="font-black text-brand-blue-dark mb-1 text-lg">Формат изображения</h2>
        <p className="text-xs text-muted-foreground mb-4">Определяет, как картинка будет расположена на главной странице</p>
        <div className="grid grid-cols-2 gap-3">
          {(["16:9", "9:16"] as const).map((asp) => (
            <button
              key={asp}
              onClick={() => {
                if (asp !== heroAspect) {
                  onSetHeroAspect(asp);
                  onSetHeroImageFile(null);
                  onSetHeroImagePreview(heroCurrentUrl);
                }
              }}
              className={`relative flex flex-col items-center justify-center gap-3 p-5 rounded-xl border-2 transition-all ${
                heroAspect === asp
                  ? "border-brand-blue-dark bg-brand-blue-dark/5"
                  : "border-border hover:border-brand-blue-dark/40"
              }`}
            >
              <div className="flex items-center justify-center" style={{ height: 56 }}>
                {asp === "16:9" ? (
                  <div className="rounded" style={{ width: 80, height: 45, background: heroAspect === asp ? "#1A2B4A" : "#e2e8f0" }} />
                ) : (
                  <div className="rounded" style={{ width: 32, height: 56, background: heroAspect === asp ? "#1A2B4A" : "#e2e8f0" }} />
                )}
              </div>
              <div>
                <p className={`font-black text-base ${heroAspect === asp ? "text-brand-blue-dark" : "text-foreground"}`}>{asp}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {asp === "16:9" ? "Горизонтальное — фото сверху, текст снизу" : "Вертикальное — текст слева, фото справа"}
                </p>
              </div>
              {heroAspect === asp && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-brand-blue-dark flex items-center justify-center">
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Image upload */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="font-black text-brand-blue-dark mb-1 text-lg">Фотография</h2>
        <p className="text-xs text-muted-foreground mb-4">
          Будет обрезана по выбранному формату {heroAspect}
        </p>
        {heroCurrentUrl && !heroImageFile && (
          <div className="mb-3 px-3 py-2 rounded-lg bg-yellow-50 border border-yellow-200 text-xs text-yellow-800 font-medium">
            ⚠ При смене формата загрузите фото заново, чтобы обрезать под {heroAspect}
          </div>
        )}
        <input
          ref={heroFileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            if (file.size > 5 * 1024 * 1024) {
              alert("Файл слишком большой. Максимальный размер: 5 МБ");
              e.target.value = "";
              return;
            }
            const blobUrl = URL.createObjectURL(file);
            onSetHeroImageFile(file);
            onSetHeroCropImage(blobUrl);
            onSetShowHeroCropper(true);
            onSetHeroCrop(undefined);
            onSetHeroCompletedCrop(undefined);
            heroCompletedCropRef.current = undefined;
            if (heroFileRef.current) heroFileRef.current.value = "";
          }}
        />

        {heroImagePreview && (
          <div className="mb-4 rounded-xl overflow-hidden border border-border bg-secondary/20">
            <img
              src={heroImagePreview}
              alt="Превью главной"
              className="w-full h-auto block"
              style={{ maxHeight: 260, objectFit: "cover" }}
            />
          </div>
        )}

        <button
          onClick={() => heroFileRef.current?.click()}
          className="flex items-center gap-2 px-5 py-3 border-2 border-dashed border-border rounded-xl text-sm font-bold text-muted-foreground hover:border-brand-blue-dark hover:text-brand-blue-dark transition-all w-full justify-center"
        >
          <Upload className="w-4 h-4" />
          {heroImagePreview ? "Заменить фотографию" : "Загрузить фотографию"}
        </button>
        <p className="text-xs text-muted-foreground mt-2 text-center">PNG, JPG. Рекомендуется высокое разрешение.</p>
      </div>

      {/* Save */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={heroSaving}
          className="bg-brand-blue-dark text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {heroSaving ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Сохранить изменения
        </button>
        {heroSuccess && (
          <motion.span
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-sm font-bold text-green-600"
          >
            ✓ Сохранено успешно!
          </motion.span>
        )}
      </div>
    </div>
  );
}
