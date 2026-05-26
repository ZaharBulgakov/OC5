import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import { Calendar, BookOpen, Music,
  X, Download, ChevronRight, CheckCircle2, Image as ImageIcon, ZoomIn, ChevronLeft, ChevronRight as ChevronRightIcon } from "lucide-react";
import { supabase } from "../lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Textbook {
  id: string;
  subject: string;
  author: string;
  year: number;
  grade_label: string;
}

const GRADES_LIST = [
  "1 класс", "2 класс", "3 класс", "4 класс",
  "5 класс", "6 класс", "7 класс", "8 класс",
  "9 класс", "10 класс", "11 класс",
];

interface UniformCard {
  id: string;
  grade_label: string;
  description: string;
  note: string;
  sort_order: number;
}

interface UniformRef {
  id: string;
  card_id: string | null;
  url: string;
  caption: string;
}

interface ActivitySection {
  id: string;
  title: string;
  sort_order: number;
}

interface Activity {
  id: string;
  section_id: string;
  title: string;
  sort_order: number;
}

interface ActivitySchedule {
  id: string;
  activity_id: string;
  day_of_week: number;
  time: string;
}

const DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

// ─── Section interface ────────────────────────────────────────────────────────

interface Section {
  id: string;
  tab: string;
  icon: React.ElementType;
  color: string;
  title: string;
  desc: string;
}

const sections: Section[] = [
  {
    id: "schedule",
    tab: "Расписание",
    icon: Calendar,
    color: "bg-brand-blue-dark",
    title: "Расписание занятий",
    desc: "Актуальное расписание для всех классов на текущую учебную неделю.",
  },
  {
    id: "books",
    tab: "Учебники и форма",
    icon: BookOpen,
    color: "bg-brand-pink",
    title: "Учебники и форма",
    desc: "Перечень учебников и требования к школьной форме на текущий учебный год.",
  },
  {
    id: "extracurricular",
    tab: "Внеурочная деятельность",
    icon: Music,
    color: "bg-brand-maroon",
    title: "Кружки и секции",
    desc: "Направления внеурочной деятельности для всестороннего развития.",
  },
];

// ─── Main component ───────────────────────────────────────────────────────────

export default function Students() {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [schedulePdfUrl, setSchedulePdfUrl] = useState<string | null>(null);
  const [textbookYearLabel, setTextbookYearLabel] = useState<string>("");

  // Учебники и форма
  const [textbooks, setTextbooks] = useState<Textbook[]>([]);
  const [uniformCards, setUniformCards] = useState<UniformCard[]>([]);
  const [uniformRefs, setUniformRefs] = useState<UniformRef[]>([]);
  const [booksLoading, setBooksLoading] = useState(false);

  // Кружки и секции
  const [actSections, setActSections] = useState<ActivitySection[]>([]);
  const [actActivities, setActActivities] = useState<Activity[]>([]);
  const [actSchedules, setActSchedules] = useState<ActivitySchedule[]>([]);
  const [actLoading, setActLoading] = useState(false);

  useEffect(() => {
    supabase.from("schedule_config").select("pdf_url, textbook_year_label").eq("id", 1).single().then(({ data }) => {
      if (data) {
        setSchedulePdfUrl(data.pdf_url);
        setTextbookYearLabel(data.textbook_year_label || "");
      }
    });
  }, []);

  // Загрузка данных учебников при открытии модального окна
  useEffect(() => {
    if (activeModal === "books" && textbooks.length === 0 && !booksLoading) {
      setBooksLoading(true);
      Promise.all([
        supabase.from("textbooks").select("*").order("subject"),
        supabase.from("uniform_cards").select("*").order("sort_order"),
        supabase.from("uniform_refs").select("*").order("created_at", { ascending: false }),
      ]).then(([t, u, r]) => {
        setTextbooks((t.data as Textbook[]) || []);
        setUniformCards((u.data as UniformCard[]) || []);
        setUniformRefs((r.data as UniformRef[]) || []);
        setBooksLoading(false);
      });
    }
  }, [activeModal]);

  // Загрузка данных кружков при открытии модального окна
  useEffect(() => {
    if (activeModal === "extracurricular" && actSections.length === 0 && !actLoading) {
      setActLoading(true);
      Promise.all([
        supabase.from("activity_sections").select("*").order("sort_order"),
        supabase.from("activities").select("*").order("sort_order"),
        supabase.from("activity_schedules").select("*").order("day_of_week"),
      ]).then(([s, a, sc]) => {
        setActSections((s.data as ActivitySection[]) || []);
        setActActivities((a.data as Activity[]) || []);
        setActSchedules((sc.data as ActivitySchedule[]) || []);
        setActLoading(false);
      });
    }
  }, [activeModal]);

  const activeSection = sections.find((s) => s.id === activeModal);

  const handleDownloadSchedule = async () => {
    if (!schedulePdfUrl) return;

    try {
      const response = await fetch(schedulePdfUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'расписание.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      // Fallback to opening in new tab if download fails
      window.open(schedulePdfUrl, '_blank');
    }
  };

  return (
    <div>
      {/* ─── PAGE HEADER ─── */}
      <section className="py-14 px-6 lg:px-10 border-b border-border" style={{ background: "#EFF5FF" }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-5xl mx-auto flex flex-col gap-4"
        >
          <div>
            <h1 className="text-heading font-bold mb-4" style={{ color: "#1A2B4A" }}>Школьникам</h1>
            <p className="max-w-md text-body" style={{ color: "#2D6FD4", opacity: 0.85 }}>
              Расписание, учебники, кружки и секции — всё в одном месте
            </p>
          </div>
        </motion.div>
      </section>

      {/* ─── QUICK CARDS ─── */}
      <section className="py-20 px-6 lg:px-12 bg-card">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {sections.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setActiveModal(s.id)}
                className="group bg-card border border-border p-8 rounded-2xl hover:shadow-2xl transition-all cursor-pointer hover:-translate-y-2 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" style={{ background: "#2D6FD410" }} />
                <div className="w-14 h-14 text-white rounded-2xl flex items-center justify-center mb-8 shadow-lg group-hover:rotate-6 transition-transform relative z-10" style={{ background: "#2D6FD4" }}>
                  <s.icon className="w-7 h-7" />
                </div>
                <h3 className="text-body font-black mb-4 transition-colors relative z-10 group-hover:text-[#2D6FD4]">{s.title}</h3>
                <p className="text-muted-foreground text-body leading-relaxed mb-8 relative z-10">{s.desc}</p>
                <div className="flex items-center gap-2 text-ui font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all relative z-10" style={{ color: "#2D6FD4" }}>
                  Открыть раздел <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── MODAL ─── */}
      <AnimatePresence>
        {activeModal && activeSection && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setActiveModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="bg-card border border-border rounded-lg shadow-xl w-full max-w-3xl flex flex-col"
              style={{ maxHeight: "90vh" }}
            >
              {/* Header */}
              <div className="flex-none flex items-center justify-between px-6 py-5 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded flex items-center justify-center" style={{ background: "#2D6FD4", color: "#fff" }}>
                    <activeSection.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="font-bold">{activeSection.title}</h2>
                  </div>
                </div>
                <button onClick={() => setActiveModal(null)} className="p-2 hover:bg-secondary rounded transition-colors" aria-label="Закрыть">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="px-6 py-6 overflow-y-auto flex-1">
                {activeModal === "schedule" && (
                  <div className="space-y-6">
                    {schedulePdfUrl ? (
                      <button
                        onClick={handleDownloadSchedule}
                        className="inline-flex items-center gap-2 bg-brand-blue-dark text-white px-5 py-2.5 rounded-full text-body hover:shadow-lg transition-all font-bold uppercase tracking-wider"
                      >
                        <Download className="w-4 h-4" /> Скачать расписание (PDF)
                      </button>
                    ) : (
                      <p className="text-muted-foreground text-body">PDF-файл расписания пока не загружен.</p>
                    )}
                  </div>
                )}

                {activeModal === "books" && (
                  <BooksModal
                    textbooks={textbooks}
                    uniformCards={uniformCards}
                    uniformRefs={uniformRefs}
                    loading={booksLoading}
                    yearLabel={textbookYearLabel}
                  />
                )}

                {activeModal === "extracurricular" && (
                  <ActivitiesModal
                    sections={actSections}
                    activities={actActivities}
                    schedules={actSchedules}
                    loading={actLoading}
                  />
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Books modal content ──────────────────────────────────────────────────────

function BooksModal({
  textbooks, uniformCards, uniformRefs, loading, yearLabel,
}: {
  textbooks: Textbook[];
  uniformCards: UniformCard[];
  uniformRefs: UniformRef[];
  loading: boolean;
  yearLabel: string;
}) {
  const [openCardId, setOpenCardId] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<{ refs: UniformRef[]; index: number } | null>(null);

  // Определение классов, у которых есть учебники
  const gradesWithBooks = GRADES_LIST.filter((g) =>
    textbooks.some((t) => (t.grade_label || "1 класс") === g)
  );
  const [activeGrade, setActiveGrade] = useState<string | null>(null);

  // Автоматический выбор первого доступного класса
  const selectedGrade = activeGrade ?? gradesWithBooks[0] ?? null;

  if (loading) return <p className="text-muted-foreground text-body">Загрузка...</p>;

  const years = yearLabel || "текущий год";

  const openLightbox = (refs: UniformRef[], index: number) => setLightbox({ refs, index });
  const closeLightbox = () => setLightbox(null);
  const prevImage = () => setLightbox((l) => l ? { ...l, index: (l.index - 1 + l.refs.length) % l.refs.length } : null);
  const nextImage = () => setLightbox((l) => l ? { ...l, index: (l.index + 1) % l.refs.length } : null);

  const filteredTextbooks = selectedGrade
    ? textbooks.filter((t) => (t.grade_label || "1 класс") === selectedGrade)
    : textbooks;

  return (
    <div className="space-y-6">
      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4"
            onClick={closeLightbox}
          >
            {/* Close */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Prev */}
            {lightbox.refs.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); prevImage(); }}
                className="absolute left-4 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
              >
                <ChevronLeft className="w-7 h-7" />
              </button>
            )}

            {/* Image */}
            <motion.img
              key={lightbox.index}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              src={lightbox.refs[lightbox.index].url}
              alt={lightbox.refs[lightbox.index].caption || "Референс"}
              className="max-h-[85vh] max-w-[90vw] object-contain rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />

            {/* Caption */}
            {lightbox.refs[lightbox.index].caption && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 text-white text-sm px-4 py-1.5 rounded-full">
                {lightbox.refs[lightbox.index].caption}
              </div>
            )}

            {/* Counter */}
            {lightbox.refs.length > 1 && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 text-white/80 text-xs px-3 py-1 rounded-full">
                {lightbox.index + 1} / {lightbox.refs.length}
              </div>
            )}

            {/* Next */}
            {lightbox.refs.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); nextImage(); }}
                className="absolute right-4 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
              >
                <ChevronRightIcon className="w-7 h-7" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Школьная форма */}
      <div>
        <h3 className="font-bold mb-3" style={{ color: "#1A2B4A" }}>Школьная форма</h3>

        {uniformCards.length === 0 ? (
          <p className="text-muted-foreground text-body">Информация о форме не добавлена.</p>
        ) : (
          <div className={uniformCards.length === 1 ? "flex justify-center" : "flex gap-3 overflow-x-auto pb-2 pr-4"}>
            {[...uniformCards].sort((a, b) => a.sort_order - b.sort_order).map((card) => {
              const cardRefs = uniformRefs.filter((r) => r.card_id === card.id);
              const isOpen = openCardId === card.id;

              return (
                <div
                  key={card.id}
                  className="border border-border rounded-xl overflow-hidden bg-secondary flex-none"
                  style={{ width: uniformCards.length === 1 ? "100%" : "calc(50% - 6px)", minWidth: 240 }}
                >
                  <div className="p-4 flex flex-col" style={{ maxHeight: 320 }}>
                    <p className="font-semibold text-body mb-2 flex-none" style={{ color: "#2D6FD4" }}>{card.grade_label}</p>
                    <div className="overflow-y-auto flex-1 pr-1" style={{ scrollbarWidth: "thin" }}>
                      <p className="text-body text-muted-foreground leading-relaxed">{card.description}</p>
                      {card.note && <p className="text-body text-muted-foreground mt-1 italic">{card.note}</p>}
                    </div>

                    {cardRefs.length > 0 && (
                      <button
                        onClick={() => setOpenCardId(isOpen ? null : card.id)}
                        className="mt-3 flex-none inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border transition-all"
                        style={
                          isOpen
                            ? { background: "#2D6FD4", color: "#fff", borderColor: "#2D6FD4" }
                            : { color: "#2D6FD4", borderColor: "#2D6FD4" }
                        }
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        {isOpen ? "Скрыть" : "Показать"} ({cardRefs.length})
                      </button>
                    )}
                  </div>

                  {isOpen && cardRefs.length > 0 && (
                    <div className="border-t border-border grid grid-cols-2 gap-2 p-3">
                      {cardRefs.map((r, idx) => (
                        <div
                          key={r.id}
                          className="group relative rounded-lg overflow-hidden aspect-[3/4] bg-muted cursor-zoom-in"
                          onClick={() => openLightbox(cardRefs, idx)}
                        >
                          <img src={r.url} alt={r.caption || "Референс"} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                          {/* Hover overlay */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                            <ZoomIn className="w-7 h-7 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                          </div>
                          {r.caption && (
                            <div className="absolute bottom-0 inset-x-0 bg-black/60 px-2 py-1">
                              <p className="text-white text-xs truncate">{r.caption}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Учебники */}
      <div>
        <h3 className="font-bold mb-3" style={{ color: "#1A2B4A" }}>Учебники {years}</h3>

        {textbooks.length === 0 ? (
          <p className="text-muted-foreground text-body">Список учебников не добавлен.</p>
        ) : (
          <div className="space-y-4">
            {/* Grade filter buttons */}
            {gradesWithBooks.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {gradesWithBooks.map((g) => (
                  <button
                    key={g}
                    onClick={() => setActiveGrade(g)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      selectedGrade === g
                        ? "bg-[#2D6FD4] text-white border-[#2D6FD4] shadow"
                        : "border-border hover:border-[#2D6FD4] hover:text-[#2D6FD4]"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            )}

            {filteredTextbooks.length === 0 ? (
              <p className="text-muted-foreground text-body">Учебников для {selectedGrade} нет.</p>
            ) : (
              <div className="border border-border rounded-xl overflow-hidden">
                <div className="px-4 divide-y divide-border">
                  {filteredTextbooks.map((t) => (
                    <div key={t.id} className="flex items-center justify-between py-2.5">
                      <span className="text-body font-medium" style={{ color: "#1A2B4A" }}>{t.subject}</span>
                      <span className="text-body text-right ml-3 shrink-0" style={{ color: "#2D6FD4", opacity: 0.75 }}>{t.author}, {t.year}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


// ─── Activities modal content ─────────────────────────────────────────────────

function ActivitiesModal({
  sections, activities, schedules, loading,
}: {
  sections: ActivitySection[];
  activities: Activity[];
  schedules: ActivitySchedule[];
  loading: boolean;
}) {
  if (loading) return <p className="text-muted-foreground text-body">Загрузка...</p>;

  if (sections.length === 0) {
    return (
      <p className="text-muted-foreground text-body">
        Внеурочная деятельность включена в образовательную программу и проводится бесплатно для всех учеников.
        Запись осуществляется в начале каждого учебного года через классного руководителя.
      </p>
    );
  }

  return (
    <div className="space-y-5">

      <div className="grid sm:grid-cols-2 gap-3">
        {sections.sort((a, b) => a.sort_order - b.sort_order).map((sec) => {
          const sectionActivities = activities
            .filter((a) => a.section_id === sec.id)
            .sort((a, b) => a.sort_order - b.sort_order);

          return (
            <div key={sec.id} className="border border-border rounded p-4 bg-secondary">
              <p className="font-semibold text-body mb-3" style={{ color: "#2D6FD4" }}>{sec.title}</p>
              <ul className="space-y-1.5">
                {sectionActivities.map((act) => {
                  const actSchedules = schedules
                    .filter((s) => s.activity_id === act.id)
                    .sort((a, b) => a.day_of_week - b.day_of_week);
                  const scheduleStr = actSchedules.length > 0
                    ? ` (${actSchedules.map((s) => DAYS[s.day_of_week]).join(", ")} ${actSchedules[0].time})`
                    : "";
                  return (
                    <li key={act.id} className="flex items-start gap-2 text-ui text-muted-foreground">
                      <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: "#2D6FD4" }} />
                      {act.title}{scheduleStr}
                    </li>
                  );
                })}
                {sectionActivities.length === 0 && (
                  <li className="text-xs text-muted-foreground italic">Кружков пока нет</li>
                )}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
