import { motion, AnimatePresence } from "motion/react";
import { Search, FileText, Download, ArrowDownToLine, Upload, Plus, X } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { supabase } from "../lib/supabase";

interface Document {
  id: number;
  title: string;
  type: string;
  size: string;
  date: string;
  section?: string;
  subsection?: string;
  url?: string;
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
        const q = query.toLowerCase();
        return (
          d.title.toLowerCase().includes(q) ||
          (d.section || "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.title.localeCompare(b.title, "ru"));
  }, [query, documents]);

  const grouped = useMemo(() => {
    const g: Record<string, Record<string, Document[]>> = {};
    filtered.forEach((d) => {
      const sec = d.section?.trim() || "Без раздела";
      const sub = d.subsection?.trim() || "";
      if (!g[sec]) g[sec] = {};
      if (!g[sec][sub]) g[sec][sub] = [];
      g[sec][sub].push(d);
    });
    return Object.entries(g)
      .sort(([a], [b]) => a.localeCompare(b, "ru"))
      .map(([sec, subMap]) => ({
        section: sec,
        subs: Object.entries(subMap).sort(([a], [b]) => {
          if (a === "") return -1;
          if (b === "") return 1;
          return a.localeCompare(b, "ru");
        }),
        total: Object.values(subMap).flat().length,
      }));
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
            <h1 className="text-heading font-bold mb-4" style={{ color: "#1A2B4A" }}>Документы</h1>
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
              className="w-full pl-11 pr-4 py-3 border border-border rounded bg-secondary outline-none focus:ring-1 focus:ring-foreground transition-all text-body"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors text-body leading-none"
              >
                ×
              </button>
            )}
          </div>

          <p className="mt-3 text-ui text-muted-foreground">
            Найдено документов: <strong>{filtered.length}</strong> из {documents.length}
          </p>
        </div>
      </section>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue-dark"></div>
        </div>
      ) : (
        /* ─── DOCUMENTS LIST + SIDEBAR ─── */
        <div className="px-6 lg:px-10 py-10">
          <div className="max-w-5xl mx-auto flex gap-8 items-start">

            {/* ─── SIDEBAR NAVIGATION ─── */}
            {grouped.length > 0 && (
              <aside className="hidden lg:block w-56 shrink-0 self-start">
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3">Разделы</p>
                <nav className="flex flex-col gap-1 border-r border-border pr-4">
                  {grouped.map(({ section, subs, total }) => {
                    const hasRealSubs = subs.some(([sub]) => sub !== "");
                    return (
                      <div key={section}>
                        {/* Section link */}
                        <a
                          href={`#section-${encodeURIComponent(section)}`}
                          className="group flex items-start justify-between py-2 rounded-lg text-sm font-black transition-all hover:text-[#E8450A] text-foreground"
                          onClick={(e) => {
                            e.preventDefault();
                            document.getElementById(`section-${encodeURIComponent(section)}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                          }}
                        >
                          <span className="leading-snug break-words">{section}</span>
                          <span className="ml-2 mt-0.5 text-xs font-black tabular-nums opacity-40 group-hover:opacity-100 shrink-0">{total}</span>
                        </a>

                        {/* Subsection links */}
                        {hasRealSubs && (
                          <div className="flex flex-col gap-0.5 ml-3 mb-1 border-l border-border/60 pl-3">
                            {subs
                              .filter(([sub]) => sub !== "")
                              .map(([sub, docs]) => (
                                <a
                                  key={sub}
                                  href={`#section-${encodeURIComponent(section)}`}
                                  className="group flex items-start justify-between py-1 text-xs font-bold transition-all hover:text-[#E8450A] text-muted-foreground"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    document.getElementById(`section-${encodeURIComponent(section)}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                                  }}
                                >
                                  <span className="leading-snug break-words">{sub}</span>
                                  <span className="ml-1 mt-0.5 tabular-nums opacity-40 group-hover:opacity-100 shrink-0">{docs.length}</span>
                                </a>
                              ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </nav>
              </aside>
            )}

            {/* ─── DOCUMENTS ─── */}
            <div className="flex-1 min-w-0">
              {grouped.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">
                  <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>По вашему запросу ничего не найдено</p>
                </div>
              ) : (
                <div className="space-y-10">
                  {grouped.map(({ section, subs, total }) => (
                    <motion.div
                      key={section}
                      id={`section-${encodeURIComponent(section)}`}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                    >
                      <div className="flex items-center gap-4 mb-6">
                        <div className="text-white rounded-xl flex items-center justify-center font-black text-body shadow-lg px-4 py-2 text-sm" style={{ background: "#E8450A" }}>
                          {section}
                        </div>
                        <div className="h-px flex-1 bg-border" />
                        <span className="text-xs text-muted-foreground font-bold shrink-0">{total} doc.</span>
                      </div>

                      <div className="space-y-6">
                        {subs.map(([sub, docs]) => (
                          <div key={sub || "__no_sub__"}>
                            {sub && (
                              <div className="flex items-center gap-3 mb-4">
                                <div className="w-1 h-5 rounded-full shrink-0" style={{ background: "#E8450A", opacity: 0.5 }} />
                                <span className="text-sm font-black uppercase tracking-wider" style={{ color: "#E8450A", opacity: 0.8 }}>{sub}</span>
                                <div className="h-px flex-1 bg-border/60" />
                              </div>
                            )}
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
                                    <span className="text-ui font-black uppercase tracking-widest text-muted-foreground bg-secondary px-2 py-1 rounded">
                                      {doc.type}
                                    </span>
                                  </div>

                                  <h3 className="font-bold text-body leading-tight mb-4 group-hover:text-[#E8450A] transition-colors">
                                    {doc.title}
                                  </h3>

                                  <div className="flex items-center justify-between text-ui font-bold uppercase tracking-wider text-muted-foreground pt-4 border-t border-border/50">
                                    <span>{doc.size}</span>
                                    <span>{doc.date}</span>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}


    </div>
  );
}
