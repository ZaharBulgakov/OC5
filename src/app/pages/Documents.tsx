import { motion, AnimatePresence } from "motion/react";
import { Search, FileText, Download, ArrowDownToLine, Upload, Plus, X } from "lucide-react";
import { useState, useMemo, useRef, useEffect } from "react";
import { supabase } from "../lib/supabase";

interface Document {
  id: number;
  title: string;
  // category: string; // Категория удалена
  type: string;
  size: string;
  date: string;
  url?: string; // Добавляем URL для ссылки на файл
}

export default function Documents() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  // const [cat, setCat] = useState("Все"); // Категория удалена


  useEffect(() => {
    const fetchDocuments = async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .order("title", { ascending: true });
      
      if (!error && data && data.length > 0) {
        setDocuments(data);
      } else {
        setDocuments([]);
      }
      setLoading(false);
    };

    fetchDocuments();
  }, []);

  // const allCategories = useMemo(
  //   () => ["Все", ...Array.from(new Set(documents.map((d) => d.category))).sort()],
  //   [documents]
  // );

  const filtered = useMemo(() => {
    return documents
      .filter((d) => {
        const matchQ = d.title.toLowerCase().includes(query.toLowerCase());
        // const matchC = cat === "Все" || d.category === cat; // Категория удалена
        return matchQ; // matchC удалена
      })
      .sort((a, b) => a.title.localeCompare(b.title, "ru"));
  }, [query, documents]); // cat удалена из зависимостей

  const grouped = useMemo(() => {
    const g: Record<string, Document[]> = {};
    filtered.forEach((d) => {
      const letter = d.title[0].toUpperCase();
      if (!g[letter]) g[letter] = [];
      g[letter].push(d);
    });
    return Object.entries(g).sort(([a], [b]) => a.localeCompare(b, "ru"));
  }, [filtered]);

  const handleDownload = async (doc: Document) => {
    if (!doc.url) {
      // Fallback for documents without a URL (e.g., static data or old entries)
      const content = `Документ: ${doc.title}\nТип: ${doc.type}\nРазмер: ${doc.size}\nДата: ${doc.date}\n\nОбразовательный центр №5\n454000, г. Челябинск, ул. Образовательная, д. 5\n\n[Демонстрационный файл — реальный файл будет доступен после публикации администрацией]`;
      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${doc.title}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return;
    }

    try {
      const response = await fetch(doc.url);
      if (!response.ok) {
        throw new Error(`Failed to fetch document: ${response.statusText}`);
      }
      const blob = await response.blob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${doc.title}.${doc.type.toLowerCase()}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading document:", error);
      alert("Не удалось скачать документ. Пожалуйста, попробуйте еще раз.");
    }
  };

  return (
    <div>
      {/* ─── PAGE HEADER ─── */}
      <section className="py-14 px-6 lg:px-10 border-b border-border" style={{ background: "#FFF8F5" }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-end justify-between gap-4"
        >
          <div>
            <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest" style={{ background: "#E8450A", color: "#fff" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
              Документация
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold mb-4" style={{ color: "#1A2B4A" }}>Документы</h1>
            <p className="max-w-md" style={{ color: "#E8450A", opacity: 0.85 }}>
              Нормативные акты, формы и шаблоны образовательного учреждения
            </p>
          </div>
        </motion.div>
      </section>

      {/* ─── SEARCH ─── */}
      <section className="py-8 px-6 lg:px-10 border-b border-border bg-card sticky top-16 z-20">
        <div className="max-w-5xl mx-auto">
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Поиск по названию документа..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 border border-border rounded bg-secondary outline-none focus:ring-1 focus:ring-foreground transition-all text-sm"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors text-lg leading-none"
              >
                ×
              </button>
            )}
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            Найдено документов: <strong>{filtered.length}</strong> из {documents.length}
          </p>
        </div>
      </section>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue-dark"></div>
        </div>
      ) : (
        /* ─── DOCUMENTS LIST ─── */
        <section className="py-10 px-6 lg:px-10">
          <div className="max-w-5xl mx-auto">
            {grouped.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>По вашему запросу ничего не найдено</p>
              </div>
            ) : (
              <div className="space-y-10">
                {grouped.map(([letter, docs]) => (
                  <motion.div
                    key={letter}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                  >
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-10 h-10 text-white rounded-xl flex items-center justify-center font-black text-xl shadow-lg" style={{ background: "#E8450A" }}>
                        {letter}
                      </div>
                      <div className="h-px flex-1 bg-border" />
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {docs.map((doc) => (
                        <motion.div
                          key={doc.id}
                          whileHover={{ y: -2 }}
                          className="group bg-card border border-border p-5 rounded-2xl hover:shadow-xl transition-all cursor-pointer relative overflow-hidden"
                          onClick={() => handleDownload(doc)}
                        >
                          <div className="absolute top-0 right-0 w-16 h-16 bg-brand-blue-dark/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                          
                          <div className="flex items-start justify-between mb-4 relative z-10">
                            <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center group-hover:text-white transition-colors" style={{}} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#E8450A"; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ""; }}>
                              <FileText className="w-5 h-5" style={{ color: "#E8450A" }} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-secondary px-2 py-1 rounded">
                              {doc.type}
                            </span>
                          </div>

                          <h3 className="font-bold text-sm leading-tight mb-4 group-hover:text-[#E8450A] transition-colors line-clamp-2">
                            {doc.title}
                          </h3>

                          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground pt-4 border-t border-border/50">
                            <span>{doc.size}</span>
                            <span>{doc.date}</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}


    </div>
  );
}
