import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, X, Search, Trash2 } from "lucide-react";
import { supabase } from "../../../lib/supabase";

export interface DocumentSection {
  id: string;
  title: string;
  section_id?: string;
  created_at: string;
}

interface DocumentSectionManagerProps {
  isOpen: boolean;
  onClose: () => void;
  documentSections: DocumentSection[];
  documentSubsections: DocumentSection[];
  documentsData: any[];
  onSetDocumentSections: (sections: DocumentSection[]) => void;
  onSetDocumentSubsections: (subsections: DocumentSection[]) => void;
}

export default function DocumentSectionManager({
  isOpen,
  onClose,
  documentSections,
  documentSubsections,
  documentsData,
  onSetDocumentSections,
  onSetDocumentSubsections
}: DocumentSectionManagerProps) {
  const [sectionSearch, setSectionSearch] = useState("");
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [newSubSectionId, setNewSubSectionId] = useState<string>("");

  const isSectionTab = !(sectionSearch.startsWith("__sub__"));
  const activeList = isSectionTab ? documentSections : documentSubsections;
  const dbTable = isSectionTab ? "document_sections" : "document_subsections";
  const rawSearch = isSectionTab ? sectionSearch : sectionSearch.replace("__sub__", "");

  const handleCreate = async () => {
    if (!newSectionTitle.trim()) return;
    if (!isSectionTab && !newSubSectionId) { alert("Выберите раздел для подраздела"); return; }
    const payload = isSectionTab
      ? { title: newSectionTitle.trim() }
      : { title: newSectionTitle.trim(), section_id: newSubSectionId };
    const { data, error } = await supabase.from(dbTable).insert([payload]).select();
    if (!error && data) {
      if (isSectionTab) {
        onSetDocumentSections([...documentSections, data[0] as DocumentSection].sort((a, b) => a.title.localeCompare(b.title, "ru")));
      } else {
        onSetDocumentSubsections([...documentSubsections, data[0] as DocumentSection].sort((a, b) => a.title.localeCompare(b.title, "ru")));
      }
      setNewSectionTitle("");
    } else if (error) { alert("Ошибка: " + error.message); }
  };

  const handleDelete = async (item: DocumentSection) => {
    if (isSectionTab) {
      const docsInSection = documentsData.filter((d: any) => (d.section || "").trim() === item.title.trim());
      if (docsInSection.length > 0) {
        if (!confirm(`В разделе "${item.title}" есть ${docsInSection.length} документ(ов). Продолжить?`)) return;
      } else {
        if (!confirm(`Удалить раздел "${item.title}"?`)) return;
      }
    } else {
      const docsInSub = documentsData.filter((d: any) => (d.subsection || "").trim() === item.title.trim());
      if (docsInSub.length > 0) {
        if (!confirm(`В подразделе "${item.title}" есть ${docsInSub.length} документ(ов). Продолжить?`)) return;
      } else {
        if (!confirm(`Удалить подраздел "${item.title}"?`)) return;
      }
    }
    const { error } = await supabase.from(dbTable).delete().eq("id", item.id);
    if (!error) {
      if (isSectionTab) {
        onSetDocumentSections(documentSections.filter((s) => s.id !== item.id));
      } else {
        onSetDocumentSubsections(documentSubsections.filter((s) => s.id !== item.id));
      }
    } else { alert("Ошибка при удалении: " + error.message); }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { onClose(); setSectionSearch(""); }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl p-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-brand-blue-dark">Разделы и подразделы</h2>
              <button onClick={() => { onClose(); setSectionSearch(""); }} className="p-2 hover:bg-secondary rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab switcher: Разделы / Подразделы */}
            <div className="flex gap-2 mb-5 bg-secondary/50 rounded-xl p-1">
              <button
                type="button"
                onClick={() => { setSectionSearch(""); setNewSubSectionId(""); setNewSectionTitle(""); }}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${isSectionTab ? "bg-card shadow text-brand-blue-dark" : "text-muted-foreground hover:text-foreground"}`}
              >
                Разделы
              </button>
              <button
                type="button"
                onClick={() => { setSectionSearch("__sub__"); setNewSectionTitle(""); }}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${!isSectionTab ? "bg-card shadow text-brand-blue-dark" : "text-muted-foreground hover:text-foreground"}`}
              >
                Подразделы
              </button>
            </div>

            {/* Create input */}
            <div className="space-y-2 mb-4">
              {!isSectionTab && (
                <select
                  value={newSubSectionId}
                  onChange={(e) => setNewSubSectionId(e.target.value)}
                  className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-dark/20 focus:border-brand-blue-dark"
                >
                  <option value="">— Выберите раздел —</option>
                  {documentSections.map((sec) => (
                    <option key={sec.id} value={sec.id}>{sec.title}</option>
                  ))}
                </select>
              )}
              <div className="flex gap-2">
                <input
                  value={newSectionTitle}
                  onChange={(e) => setNewSectionTitle(e.target.value)}
                  placeholder={isSectionTab ? "Название нового раздела..." : "Название нового подраздела..."}
                  className="flex-1 bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-dark/20 focus:border-brand-blue-dark"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newSectionTitle.trim()) {
                      handleCreate();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleCreate}
                  className="px-4 py-2.5 bg-brand-blue-dark text-white rounded-xl font-bold hover:bg-brand-blue-dark/80 transition-all flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Создать
                </button>
              </div>
            </div>

            {/* Search */}
            {activeList.length > 0 && (
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={isSectionTab ? "Поиск по разделам..." : "Поиск по подразделам..."}
                  value={rawSearch}
                  onChange={(e) => setSectionSearch(isSectionTab ? e.target.value : "__sub__" + e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-dark/20 focus:border-brand-blue-dark"
                />
              </div>
            )}

            {/* List */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {activeList.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {isSectionTab ? "Разделов пока нет. Создайте первый!" : "Подразделов пока нет. Создайте первый!"}
                </p>
              ) : (
                (() => {
                  const filteredList = rawSearch
                    ? activeList.filter((s) => s.title.toLowerCase().includes(rawSearch.toLowerCase()))
                    : activeList;
                  if (filteredList.length === 0) return <p className="text-sm text-muted-foreground text-center py-6">Ничего не найдено</p>;
                  return filteredList.map((item) => {
                    const parentSection = !isSectionTab && item.section_id
                      ? documentSections.find(s => s.id === item.section_id)
                      : null;
                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between bg-secondary/50 border border-border rounded-xl px-4 py-3 group hover:bg-brand-blue-dark/5 hover:border-brand-blue-dark/30 transition-all"
                      >
                        <div className="min-w-0">
                          <span className="text-sm font-bold text-brand-blue-dark block truncate">{item.title}</span>
                          {parentSection && (
                            <span className="text-xs text-muted-foreground truncate block">в разделе: {parentSection.title}</span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                          className="p-1.5 opacity-0 group-hover:opacity-100 bg-transparent hover:bg-destructive/10 text-destructive rounded-lg transition-all ml-2 shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  });
                })()
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
