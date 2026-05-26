import { useRef, useState } from "react";
import { motion } from "motion/react";
import { FileText, Upload, X, Save, Trash2 } from "lucide-react";
import { supabase } from "../../../lib/supabase";

interface SchedulePdfManagerProps {
  schedulePdfUrl: string | null;
  onSetSchedulePdfUrl: (url: string | null) => void;
}

export default function SchedulePdfManager({ schedulePdfUrl, onSetSchedulePdfUrl }: SchedulePdfManagerProps) {
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (!uploadFile) {
      alert("Пожалуйста, выберите PDF-файл для загрузки.");
      return;
    }

    setUploading(true);

    try {
      // 1. Delete existing PDF from storage if it exists
      if (schedulePdfUrl) {
        const path = schedulePdfUrl.split('public/').pop();
        if (path) {
          const { error: deleteError } = await supabase.storage.from('schedule').remove([path]);
          if (deleteError) {
            console.error("Error deleting old schedule PDF from storage:", deleteError);
          }
        }
      }

      // 2. Upload new PDF to Supabase Storage
      const sanitizedFileName = uploadFile.name.replace(/[^a-zA-Z0-9.]/g, "-").toLowerCase();
      const storagePath = `public/${sanitizedFileName}-${Date.now()}`;

      const { data: storageData, error: storageError } = await supabase.storage
        .from('schedule')
        .upload(storagePath, uploadFile, { cacheControl: '3600', upsert: false });

      if (storageError) {
        throw new Error("Ошибка при загрузке PDF-файла расписания: " + storageError.message);
      }

      const { data: publicUrlData } = supabase.storage
        .from('schedule')
        .getPublicUrl(storageData.path);

      if (!publicUrlData.publicUrl) {
        throw new Error("Не удалось получить публичный URL для PDF-файла расписания.");
      }

      // 3. Update pdf_url in schedule_config table
      const { error: updateError } = await supabase
        .from('schedule_config')
        .update({ pdf_url: publicUrlData.publicUrl })
        .eq('id', 1);

      if (updateError) {
        throw new Error("Ошибка при обновлении URL расписания в базе данных: " + updateError.message);
      }

      onSetSchedulePdfUrl(publicUrlData.publicUrl);
      setUploadFile(null);
      alert("PDF-файл расписания успешно обновлен!");
    } catch (error: any) {
      console.error("Error uploading schedule PDF:", error);
      alert("Ошибка при загрузке PDF-файла расписания: " + (error.message || "Неизвестная ошибка"));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Вы уверены, что хотите удалить текущий PDF-файл расписания?")) return;

    try {
      // 1. Delete PDF from storage
      if (schedulePdfUrl) {
        const path = schedulePdfUrl.split('public/').pop();
        if (path) {
          const { error: deleteError } = await supabase.storage.from('schedule').remove([path]);
          if (deleteError) {
            throw new Error("Ошибка при удалении PDF-файла расписания из хранилища: " + deleteError.message);
          }
        }
      }

      // 2. Clear pdf_url in schedule_config table
      const { error: updateError } = await supabase
        .from('schedule_config')
        .update({ pdf_url: null })
        .eq('id', 1);

      if (updateError) {
        throw new Error("Ошибка при удалении URL расписания из базы данных: " + updateError.message);
      }

      onSetSchedulePdfUrl(null);
      alert("PDF-файл расписания успешно удален!");
    } catch (error: any) {
      console.error("Error deleting schedule PDF:", error);
      alert("Ошибка при удалении PDF-файла расписания: " + (error.message || "Неизвестная ошибка"));
    }
  };

  return (
    <motion.div
      layout
      className="bg-card border border-border p-5 rounded-2xl flex flex-col items-start gap-4"
    >
      <h3 className="font-bold text-brand-blue-dark">Управление PDF-файлом расписания</h3>
      <p className="text-xs text-muted-foreground">Загрузите новый PDF-файл, чтобы обновить расписание на публичной странице. Будет храниться только один файл.</p>
      
      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(false);
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            setUploadFile(e.dataTransfer.files[0]);
          }
        }}
        className={`border-2 border-dashed rounded p-6 text-center cursor-pointer transition-colors w-full ${ 
          isDragging ? "border-foreground/70 bg-secondary" : "border-border hover:border-brand-blue-dark/30"
        }`}
      >
        {uploadFile ? (
          <div className="flex items-center justify-center gap-2 text-sm">
            <FileText className="w-4 h-4" />
            <span className="font-medium truncate max-w-[200px]">{uploadFile.name}</span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setUploadFile(null); }}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (schedulePdfUrl ? (
          <div className="flex items-center justify-center gap-2 text-sm">
            <FileText className="w-4 h-4" />
            <span className="font-medium truncate max-w-[200px]">Текущий файл: {schedulePdfUrl.split('/').pop()}</span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setUploadFile(null); onSetSchedulePdfUrl(null); }}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <>
            <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Нажмите или перетащите PDF файл сюда</p>
            <p className="text-xs text-muted-foreground mt-1">Только PDF до 10 МБ</p>
          </>
        ))}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && file.size > 5 * 1024 * 1024) {
            alert("Файл слишком большой. Максимальный размер: 5 МБ");
            e.target.value = "";
            return;
          }
          setUploadFile(file || null);
        }}
      />
      {uploadFile && (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={uploading}
          className="bg-brand-blue-dark text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:shadow-lg hover:-translate-y-0.5 transition-all w-fit disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Загрузка...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Загрузить новый PDF
            </>
          )}
        </button>
      )}
      {!uploadFile && schedulePdfUrl && (
        <button
          type="button"
          onClick={handleDelete}
          className="bg-destructive text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:shadow-lg hover:-translate-y-0.5 transition-all w-fit"
        >
          <Trash2 className="w-5 h-5" />
          Удалить текущий PDF
        </button>
      )}
    </motion.div>
  );
}
