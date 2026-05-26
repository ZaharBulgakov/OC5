import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Edit3, Trash2, X, Save, BookOpen } from "lucide-react";
import { supabase } from "../../../lib/supabase";

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  order_num: number;
}

export default function FAQEditor({ searchQuery }: { searchQuery: string }) {
  const [faqsData, setFaqsData] = useState<FaqItem[]>([]);
  const [editingFaq, setEditingFaq] = useState<FaqItem | null>(null);
  const [faqModalOpen, setFaqModalOpen] = useState(false);
  const [faqSaving, setFaqSaving] = useState(false);
  const [faqForm, setFaqForm] = useState({ question: "", answer: "" });

  useEffect(() => {
    fetchFaqs();
  }, []);

  const fetchFaqs = async () => {
    const { data, error } = await supabase
      .from("faqs")
      .select("*")
      .order("order_num", { ascending: true });
    
    if (error) {
      console.error("Error fetching FAQs:", error);
    } else {
      setFaqsData(data as FaqItem[] || []);
    }
  };

  const filteredFaqsData = useMemo(() => {
    if (!searchQuery) return faqsData;
    return faqsData.filter(item =>
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [faqsData, searchQuery]);

  const handleEditFaq = (faq: FaqItem) => {
    setEditingFaq(faq);
    setFaqForm({ question: faq.question, answer: faq.answer });
    setFaqModalOpen(true);
  };

  const handleAddFaq = () => {
    setEditingFaq(null);
    setFaqForm({ question: "", answer: "" });
    setFaqModalOpen(true);
  };

  const handleDeleteFaq = async (id: string) => {
    if (!confirm("Вы уверены, что хотите удалить этот вопрос?")) return;
    
    const { error } = await supabase.from("faqs").delete().eq("id", id);
    if (!error) {
      setFaqsData((prev) => prev.filter((f) => f.id !== id));
    }
  };

  const handleSaveFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    setFaqSaving(true);

    try {
      const faqData = {
        question: faqForm.question,
        answer: faqForm.answer,
        order_num: editingFaq ? editingFaq.order_num : faqsData.length + 1
      };

      if (editingFaq) {
        const { data, error } = await supabase
          .from("faqs")
          .update(faqData)
          .eq("id", editingFaq.id)
          .select();

        if (error) throw error;
        setFaqsData((prev) => prev.map((f) => f.id === editingFaq.id ? data[0] as FaqItem : f));
      } else {
        const { data, error } = await supabase
          .from("faqs")
          .insert([faqData])
          .select();

        if (error) throw error;
        setFaqsData((prev) => [...prev, data[0] as FaqItem]);
      }

      setFaqModalOpen(false);
      setEditingFaq(null);
      setFaqForm({ question: "", answer: "" });
    } catch (error: any) {
      console.error("Error saving FAQ:", error);
      alert("Ошибка при сохранении вопроса: " + error.message);
    } finally {
      setFaqSaving(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="bg-card border border-border rounded-2xl p-6 flex items-center justify-between">
          <div>
            <h2 className="font-black text-brand-blue-dark text-lg">Часто задаваемые вопросы</h2>
            <p className="text-xs text-muted-foreground mt-1">Управляйте вопросами и ответами для страницы FAQ</p>
          </div>
          <button
            onClick={handleAddFaq}
            className="bg-brand-blue-dark text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:shadow-lg hover:-translate-y-0.5 transition-all"
          >
            <Plus className="w-5 h-5" />
            Добавить вопрос
          </button>
        </div>

        <div className="grid gap-4">
          {filteredFaqsData.map((faq, i) => (
            <motion.div
              layout
              key={faq.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="bg-card border border-border rounded-2xl p-5 group hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-brand-blue-dark text-sm mb-2">{faq.question}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-3">{faq.answer}</p>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button
                    onClick={() => handleEditFaq(faq)}
                    className="p-2 hover:bg-brand-blue-dark/10 text-brand-blue-dark rounded-lg transition-colors"
                  >
                    <Edit3 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteFaq(faq.id)}
                    className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
          {faqsData.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="font-bold">Вопросы пока не добавлены</p>
              <p className="text-sm mt-1">Нажмите «Добавить вопрос», чтобы создать первый</p>
            </div>
          )}
        </div>
      </div>

      {/* FAQ MODAL */}
      <AnimatePresence>
        {faqModalOpen && editingFaq && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setFaqModalOpen(false); setEditingFaq(null); }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl flex flex-col"
              style={{ maxHeight: "90vh" }}
            >
              <div className="flex items-center justify-between p-6 border-b border-border">
                <h2 className="text-xl font-black text-brand-blue-dark">
                  {editingFaq ? "Редактировать вопрос" : "Добавить вопрос"}
                </h2>
                <button
                  onClick={() => { setFaqModalOpen(false); setEditingFaq(null); }}
                  className="p-2 hover:bg-secondary rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveFaq} className="flex-1 overflow-y-auto p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-brand-blue-dark mb-2">Вопрос *</label>
                  <input
                    type="text"
                    value={faqForm.question}
                    onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
                    className="w-full px-4 py-3 border border-border rounded-xl bg-secondary/50 outline-none focus:ring-2 focus:ring-brand-blue-dark/20 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-brand-blue-dark mb-2">Ответ *</label>
                  <textarea
                    value={faqForm.answer}
                    onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
                    rows={5}
                    className="w-full px-4 py-3 border border-border rounded-xl bg-secondary/50 outline-none focus:ring-2 focus:ring-brand-blue-dark/20 transition-all resize-none"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => { setFaqModalOpen(false); setEditingFaq(null); }}
                    className="flex-1 px-4 py-3 border border-border rounded-xl hover:bg-secondary transition-all font-bold"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={faqSaving}
                    className="flex-1 px-4 py-3 bg-brand-blue-dark text-white rounded-xl hover:bg-brand-blue-dark/90 transition-all disabled:opacity-50 font-bold flex items-center justify-center gap-2"
                  >
                    {faqSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Сохранение...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Сохранить
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
