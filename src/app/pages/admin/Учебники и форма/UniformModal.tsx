import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Save } from "lucide-react";
import { supabase } from "../../../lib/supabase";

interface UniformModalProps {
  isOpen: boolean;
  onClose: () => void;
  editId: string | null;
  initialForm: { grade_label: string; description: string };
}

export default function UniformModal({ isOpen, onClose, editId, initialForm }: UniformModalProps) {
  const [form, setForm] = useState(initialForm);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.grade_label.trim() || !form.description.trim()) return;
    
    const { data: cardsData } = await supabase.from("uniform_cards").select("*").order("sort_order");
    const cards = (cardsData as any[]) || [];
    
    if (editId) {
      await supabase.from("uniform_cards").update(form).eq("id", editId);
    } else {
      const maxOrder = cards.reduce((m, c) => Math.max(m, c.sort_order), -1);
      await supabase.from("uniform_cards").insert([{ ...form, sort_order: maxOrder + 1 }]);
    }
    
    setForm({ grade_label: "", description: "" });
    onClose();
    window.location.reload();
  };

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
          >
            <div className="flex items-center justify-between px-8 pt-8 pb-4 flex-shrink-0">
              <h2 className="text-2xl font-black text-brand-blue-dark">
                {editId ? "Редактировать карточку" : "Добавить карточку"}
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-secondary rounded-xl">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 overflow-y-auto px-8 pb-8 flex-1">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Заголовок</label>
                <input
                  type="text"
                  value={form.grade_label}
                  onChange={(e) => setForm({ ...form, grade_label: e.target.value })}
                  placeholder="Например: 1–4 классы"
                  required
                  className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-blue-dark/20 focus:border-brand-blue-dark"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Описание формы</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Описание школьной формы..."
                  required
                  rows={3}
                  className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-blue-dark/20 focus:border-brand-blue-dark resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-3 rounded-xl font-bold border border-border hover:bg-secondary transition-all"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-brand-blue-dark text-white rounded-xl font-bold shadow-lg hover:shadow-brand-blue-dark/20 transition-all flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  {editId ? "Сохранить" : "Добавить"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
