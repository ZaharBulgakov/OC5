import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Save, Plus, Search, Trash2 } from "lucide-react";
import { supabase } from "../../../lib/supabase";

interface ActivitySectionManagerProps {
  isOpen: boolean;
  onClose: () => void;
  activitySections: any[];
  onSetActivitySections: (sections: any[]) => void;
}

export default function ActivitySectionManager({ isOpen, onClose, activitySections, onSetActivitySections }: ActivitySectionManagerProps) {
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [newTitle, setNewTitle] = useState("");

  const handleSave = async () => {
    const title = editId ? editTitle : newTitle;
    if (!title.trim()) return;
    
    if (editId) {
      const { error } = await supabase.from("activity_sections").update({ title: title.trim() }).eq("id", editId);
      if (!error) {
        onSetActivitySections(activitySections.map((s) => s.id === editId ? { ...s, title: title.trim() } : s));
        setEditId(null);
        setEditTitle("");
      } else if (error) { alert("Ошибка: " + error.message); }
    } else {
      const { data, error } = await supabase.from("activity_sections").insert([{ title: title.trim(), sort_order: 0 }]).select();
      if (!error && data) {
        onSetActivitySections([...activitySections, data[0]].sort((a, b) => a.title.localeCompare(b.title, "ru")));
        setNewTitle("");
      } else if (error) { alert("Ошибка: " + error.message); }
    }
  };

  const handleDelete = async (item: any) => {
    if (!confirm(`Удалить раздел "${item.title}"? Все кружки в этом разделе также будут удалены.`)) return;
    await supabase.from("activity_sections").delete().eq("id", item.id);
    onSetActivitySections(activitySections.filter((s) => s.id !== item.id));
  };

  const handleClose = () => {
    onClose();
    setSearch("");
    setEditId(null);
    setEditTitle("");
    setNewTitle("");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl p-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-brand-blue-dark">Разделы</h2>
              <button onClick={handleClose} className="p-2 hover:bg-secondary rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Create/Edit input */}
            <div className="space-y-2 mb-4">
              <div className="flex gap-2">
                <input
                  value={editId ? editTitle : newTitle}
                  onChange={(e) => {
                    if (editId) {
                      setEditTitle(e.target.value);
                    } else {
                      setNewTitle(e.target.value);
                    }
                  }}
                  placeholder={editId ? "Редактирование раздела..." : "Название нового раздела..."}
                  className="flex-1 bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-dark/20 focus:border-brand-blue-dark"
                  onKeyDown={async (e) => {
                    if (e.key === "Enter") {
                      await handleSave();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-4 py-2.5 bg-brand-blue-dark text-white rounded-xl font-bold hover:bg-brand-blue-dark/80 transition-all flex items-center gap-1"
                >
                  {editId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  {editId ? "Сохранить" : "Создать"}
                </button>
                {editId && (
                  <button
                    type="button"
                    onClick={() => { setEditId(null); setEditTitle(""); }}
                    className="px-4 py-2.5 border border-border rounded-xl font-bold hover:bg-secondary transition-all"
                  >
                    Отмена
                  </button>
                )}
              </div>
            </div>

            {/* Search */}
            {activitySections.length > 0 && (
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Поиск по разделам..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-dark/20 focus:border-brand-blue-dark"
                />
              </div>
            )}

            {/* List */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {activitySections.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Разделов пока нет. Создайте первый!</p>
              ) : (
                (() => {
                  const filteredList = search
                    ? activitySections.filter((s: any) => s.title.toLowerCase().includes(search.toLowerCase()))
                    : activitySections;
                  if (filteredList.length === 0) return <p className="text-sm text-muted-foreground text-center py-6">Ничего не найдено</p>;
                  return filteredList.map((item: any) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between bg-secondary/50 border border-border rounded-xl px-4 py-3 group hover:bg-brand-blue-dark/5 hover:border-brand-blue-dark/30 transition-all"
                    >
                      <span className="text-sm font-bold text-brand-blue-dark block truncate">{item.title}</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDelete(item)}
                          className="p-1.5 opacity-0 group-hover:opacity-100 bg-transparent hover:bg-destructive/10 text-destructive rounded-lg transition-all ml-2 shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ));
                })()
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
