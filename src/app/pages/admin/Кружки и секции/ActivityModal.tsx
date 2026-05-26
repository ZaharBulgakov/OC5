import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Save } from "lucide-react";
import { supabase } from "../../../lib/supabase";

interface ActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  editId: string | null;
  initialForm: { section_id: string; title: string; scheduleDays: number[]; scheduleTime: string };
  activitySections: any[];
}

export default function ActivityModal({ isOpen, onClose, editId, initialForm, activitySections }: ActivityModalProps) {
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.section_id) return;
    setSaving(true);
    
    try {
      let activityId: string | null = null;
      if (editId) {
        await supabase.from("activities").update({ title: form.title, section_id: form.section_id }).eq("id", editId);
        activityId = editId;
      } else {
        const maxOrder = (await supabase.from("activities").select("sort_order").eq("section_id", form.section_id)).data?.reduce((m: number, a: any) => Math.max(m, a.sort_order), -1) || -1;
        const { data } = await supabase.from("activities").insert([{ section_id: form.section_id, title: form.title, sort_order: maxOrder + 1 }]).select();
        activityId = data?.[0]?.id || null;
      }

      if (activityId && form.scheduleDays.length > 0) {
        await supabase.from("activity_schedules").delete().eq("activity_id", activityId);
        const rows = form.scheduleDays.map((d) => ({ activity_id: activityId, day_of_week: d, time: form.scheduleTime }));
        await supabase.from("activity_schedules").insert(rows);
      }

      setForm({ section_id: "", title: "", scheduleDays: [], scheduleTime: "15:00" });
      onClose();
      window.location.reload();
    } catch (error) {
      alert("Ошибка при сохранении кружка");
      setSaving(false);
    }
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
                {editId ? "Редактировать кружок" : "Добавить кружок"}
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-secondary rounded-xl">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 overflow-y-auto px-8 pb-8 flex-1">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Раздел</label>
                <select
                  value={form.section_id}
                  onChange={(e) => setForm({ ...form, section_id: e.target.value })}
                  required
                  className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-blue-dark/20 focus:border-brand-blue-dark"
                >
                  <option value="">Выберите раздел</option>
                  {activitySections.map((section) => (
                    <option key={section.id} value={section.id}>{section.title}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Название кружка или секции</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Например: Футбол"
                  required
                  className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-blue-dark/20 focus:border-brand-blue-dark"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Дни недели</label>
                <div className="flex gap-2 flex-wrap">
                  {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((day, idx) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => {
                        const days = form.scheduleDays.includes(idx)
                          ? form.scheduleDays.filter((d) => d !== idx)
                          : [...form.scheduleDays, idx];
                        setForm({ ...form, scheduleDays: days });
                      }}
                      className={`w-11 h-11 rounded-xl text-sm font-bold transition-all border ${
                        form.scheduleDays.includes(idx)
                          ? "bg-[#2D6FD4] text-white border-[#2D6FD4] shadow-lg"
                          : "bg-card border-border text-muted-foreground hover:border-[#2D6FD4]"
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Время начала</label>
                <input
                  type="time"
                  value={form.scheduleTime}
                  onChange={(e) => setForm({ ...form, scheduleTime: e.target.value })}
                  className="bg-card border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6FD4]/20 focus:border-[#2D6FD4]"
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
                  disabled={saving}
                  className="flex-1 px-6 py-3 bg-brand-blue-dark text-white rounded-xl font-bold shadow-lg hover:shadow-brand-blue-dark/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-5 h-5" />
                  {saving ? "Сохранение..." : editId ? "Сохранить" : "Добавить"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
