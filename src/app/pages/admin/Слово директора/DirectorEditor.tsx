import { useState, useRef } from "react";
import { motion } from "motion/react";
import { Upload, Plus, X, Save } from "lucide-react";
import { supabase } from "../../../lib/supabase";

interface DirectorForm {
  name: string;
  quotes: string[];
  image_url: string;
}

interface DirectorEditorProps {
  initialForm: DirectorForm;
  onSetForm: (form: DirectorForm) => void;
}

export default function DirectorEditor({ initialForm, onSetForm }: DirectorEditorProps) {
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initialForm.image_url || null);
  const [success, setSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    try {
      let imageUrl = form.image_url;
      if (imageFile) {
        const ext = imageFile.name.split(".").pop();
        const path = `director/director-${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("news")
          .upload(path, imageFile, { upsert: true });
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from("news").getPublicUrl(path);
        imageUrl = urlData.publicUrl;
      }
      const { error } = await supabase
        .from("director_info")
        .upsert({ id: 1, name: form.name, quotes: form.quotes.filter(q => q.trim()), image_url: imageUrl });
      if (error) throw error;
      setForm((f) => ({ ...f, image_url: imageUrl }));
      onSetForm({ ...form, image_url: imageUrl });
      setImageFile(null);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      alert("Ошибка при сохранении: " + err.message);
    }
    setSaving(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Image upload */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="font-black text-brand-blue-dark mb-4 text-lg">Фото директора</h2>
        <div className="flex items-start gap-6">
          <div className="w-40 rounded-xl overflow-hidden border border-border bg-secondary/30 flex-shrink-0 flex items-center justify-center min-h-[60px]">
            {imagePreview ? (
              <img src={imagePreview} alt="Директор" className="w-full h-auto block" />
            ) : (
              <div className="w-full h-24 flex items-center justify-center text-muted-foreground text-sm">Нет фото</div>
            )}
          </div>
          <div className="flex-1">
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
                  setImageFile(file);
                  setImagePreview(URL.createObjectURL(file));
                }
              }}
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 px-5 py-3 border-2 border-dashed border-border rounded-xl text-sm font-bold text-muted-foreground hover:border-brand-blue-dark hover:text-brand-blue-dark transition-all"
            >
              <Upload className="w-4 h-4" />
              Загрузить новое фото
            </button>
            <p className="text-xs text-muted-foreground mt-2">PNG, JPG до 5 МБ. Рекомендуемое соотношение 4:3.</p>
          </div>
        </div>
      </div>

      {/* Name */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="font-black text-brand-blue-dark mb-4 text-lg">ФИО директора</h2>
        <input
          type="text"
          value={form.name}
          maxLength={10000}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="Фамилия Имя Отчество"
          className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-dark/20 focus:border-brand-blue-dark"
        />
      </div>

      {/* Quotes */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="font-black text-brand-blue-dark mb-4 text-lg">Текст директора</h2>
        <div className="space-y-3">
          {form.quotes.map((q, i) => (
            <div key={i} className="flex gap-2 items-start">
              <span className="mt-3 text-xs font-bold text-muted-foreground w-5 flex-shrink-0">{i + 1}.</span>
              <textarea
                value={q}
                maxLength={10000}
                onChange={(e) => {
                  const updated = [...form.quotes];
                  updated[i] = e.target.value;
                  setForm((f) => ({ ...f, quotes: updated }));
                }}
                rows={3}
                placeholder={`Абзац ${i + 1}...`}
                className="flex-1 bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-dark/20 focus:border-brand-blue-dark resize-none"
              />
              {form.quotes.length > 1 && (
                <button
                  onClick={() => setForm((f) => ({ ...f, quotes: f.quotes.filter((_, idx) => idx !== i) }))}
                  className="mt-2 p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={() => setForm((f) => ({ ...f, quotes: [...f.quotes, ""] }))}
          className="mt-3 flex items-center gap-2 text-sm font-bold text-brand-blue-dark hover:underline"
        >
          <Plus className="w-4 h-4" />
          Добавить абзац
        </button>
      </div>

      {/* Save */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-brand-blue-dark text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {saving ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Сохранить изменения
        </button>
        {success && (
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
