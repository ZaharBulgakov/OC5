import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import { Calendar, BookOpen, Music,
  X, Download, ChevronRight, CheckCircle2 } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { supabase } from "../lib/supabase";

interface ScheduleConfig {
  id: number;
  pdf_url: string;
}

// Type definition for sections to make pdfUrl optional for modalContent
interface Section {
  id: string;
  tab: string;
  icon: React.ElementType; // Use React.ElementType for icon components
  color: string;
  title: string;
  desc: string;
  modalContent: React.ComponentType<{ pdfUrl?: string | null }>;
}

// ─── TAB / CARD DATA ───
const sections: Section[] = [
  {
    id: "schedule",
    tab: "Расписание",
    icon: Calendar,
    color: "bg-brand-blue-dark",
    title: "Расписание занятий",
    desc: "Актуальное расписание для всех классов на текущую учебную неделю.",
    modalContent: ({ pdfUrl }) => (
      <div className="space-y-6">
        {pdfUrl ? (
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-brand-blue-dark text-white px-5 py-2.5 rounded-full text-sm hover:shadow-lg transition-all font-bold uppercase tracking-wider"
          >
            <Download className="w-4 h-4" /> Скачать расписание (PDF)
          </a>
        ) : (
          <p className="text-muted-foreground text-sm">PDF-файл расписания пока не загружен.</p>
        )}
      </div>
    ),
  },

  {
    id: "books",
    tab: "Учебники и форма",
    icon: BookOpen,
    color: "bg-brand-pink",
    title: "Учебники и форма",
    desc: "Перечень учебников и требования к школьной форме на 2025–2026 учебный год.",
    modalContent: () => (
      <div className="space-y-6">
        <div>
          <h3 className="font-bold mb-3">Школьная форма</h3>
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { g: "1–4 классы", b: "Тёмно-синий пиджак, белая рубашка, тёмные брюки/юбка", g2: "Парадная: белая блузка, сарафан" },
              { g: "5–9 классы", b: "Деловой пиджак тёмно-синего цвета, рубашка/блузка, классические брюки/юбка", g2: "" },
              { g: "10–11 классы", b: "Деловой костюм тёмно-серого или чёрного цвета, белая рубашка/блузка", g2: "Торжественный вариант обязателен на 1 сентября" },
            ].map((item) => (
              <div key={item.g} className="border border-border rounded p-4 bg-secondary">
                <p className="font-semibold text-sm mb-2">{item.g}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.b}</p>
                {item.g2 && <p className="text-xs text-muted-foreground mt-1 italic">{item.g2}</p>}
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 className="font-bold mb-3">Учебники 2025–2026</h3>
          <div className="space-y-2">
            {[
              { sub: "Математика / Алгебра", publisher: "Просвещение, 2025" },
              { sub: "Русский язык", publisher: "Дрофа, 2024" },
              { sub: "Литература", publisher: "Просвещение, 2024" },
              { sub: "История России", publisher: "Просвещение, 2025" },
              { sub: "Физика (7–9 кл.)", publisher: "БИНОМ, 2024" },
              { sub: "Химия (8–11 кл.)", publisher: "Просвещение, 2024" },
              { sub: "Английский язык", publisher: "Pearson / Просвещение, 2025" },
            ].map((b) => (
              <div key={b.sub} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <span className="text-sm font-medium">{b.sub}</span>
                <span className="text-xs text-muted-foreground">{b.publisher}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },

  {
    id: "extracurricular",
    tab: "Внеурочная деятельность",
    icon: Music,
    color: "bg-brand-maroon",
    title: "Кружки и секции",
    desc: "Более 30 направлений внеурочной деятельности для всестороннего развития.",
    modalContent: () => (
      <div className="space-y-5">
        <p className="text-muted-foreground text-sm leading-relaxed">
          Внеурочная деятельность включена в образовательную программу и проводится бесплатно для всех учеников.
          Запись осуществляется в начале каждого учебного года через классного руководителя.
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { cat: "Спорт", items: ["Баскетбол (Пн, Ср, Пт 16:00)", "Волейбол (Вт, Чт 16:30)", "Лёгкая атлетика (Вт, Пт 15:30)", "Настольный теннис (Ср 14:30)"] },
            { cat: "Творчество", items: ["Театральная студия (Чт 15:00)", "Хор и вокал (Пн, Ср 14:30)", "Изостудия «Палитра» (Вт 15:00)", "Танцевальный ансамбль (Пт 15:30)"] },
            { cat: "Наука и технологии", items: ["Олимпиадная математика (Вт 15:30)", "Юный химик (Ср 14:00)", "Робототехника (Чт 15:00)", "Экология и природа (Пн 15:00)"] },
            { cat: "Общественная деятельность", items: ["Движение Первых (Пн 14:30)", "Школьный совет (Ср 15:30)", "Волонтёрский отряд (Пт 14:30)", "Дебатный клуб (Вт 16:00)"] },
          ].map((g) => (
            <div key={g.cat} className="border border-border rounded p-4 bg-secondary">
              <p className="font-semibold text-sm mb-3">{g.cat}</p>
              <ul className="space-y-1.5">
                {g.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="w-3.5 h-3.5 text-foreground flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    ),
  },

];

export default function Students() {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [schedulePdfUrl, setSchedulePdfUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchScheduleConfig = async () => {
      const { data, error } = await supabase
        .from('schedule_config')
        .select('pdf_url')
        .eq('id', 1)
        .single();

      if (error) {
        console.error('Error fetching schedule config:', error);
      } else if (data) {
        setSchedulePdfUrl(data.pdf_url);
      }
    };

    fetchScheduleConfig();
  }, []);

  const activeSection = sections.find((s) => s.id === activeModal);

  return (
    <div>
      {/* ─── HERO BANNER ─── */}
      <section className="border-b border-border overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-brand-blue-dark/5 -skew-x-12 translate-x-1/4 pointer-events-none" />
        <div className="grid lg:grid-cols-[60%_40%] min-h-[400px] relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col justify-center px-12 py-20 text-white"
            style={{ background: "#2D6FD4" }}
          >
            <span className="text-xs font-black uppercase tracking-[0.3em] mb-6" style={{ color: "#A8CFFF" }}>
              Учебный процесс
            </span>
            <h1 className="text-4xl lg:text-6xl font-black mb-8 leading-tight">
              ВСЁ ДЛЯ УСПЕШНОЙ<br />УЧЁБЫ
            </h1>
            <p className="text-white/70 text-lg max-w-md leading-relaxed mb-10">
              Расписание, меню, дополнительные занятия и электронные сервисы — 
              всё, что нужно школьнику каждый день, собрано в одном месте.
            </p>
            <div className="flex flex-wrap gap-4 mb-10">
              <a
                href="tel:+73512000007"
                className="px-6 py-3 rounded-full text-sm font-black uppercase tracking-widest hover:shadow-lg hover:-translate-y-0.5 transition-all"
                style={{ background: "#F5C200", color: "#1A2B4A" }}
              >
                Связаться с куратором
              </a>
              <a
                href="tel:+73512000008"
                className="px-6 py-3 border-2 border-white/30 text-white rounded-full text-sm font-black uppercase tracking-widest hover:bg-white/10 hover:border-white transition-all"
              >
                Психолог
              </a>
            </div>
            <div className="flex gap-4">
              <div className="w-12 h-1 rounded-full" style={{ background: "#A8CFFF" }} />
              <div className="w-12 h-1 rounded-full" style={{ background: "#F5C200" }} />
              <div className="w-12 h-1 bg-white/30 rounded-full" />
            </div>
          </motion.div>

          <div className="relative overflow-hidden group">
            <div className="absolute inset-0 bg-brand-blue-dark/20 mix-blend-multiply group-hover:bg-transparent transition-colors duration-500" />
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800"
              alt="Студенты ОЦ №5"
              className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 transition-all duration-700 scale-110 group-hover:scale-100"
            />
          </div>
        </div>
      </section>

      {/* ─── QUICK CARDS ─── */}
      <section className="py-20 px-6 lg:px-12" style={{ background: "#EFF5FF" }}>
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
                <h3 className="text-2xl font-black mb-4 transition-colors relative z-10 group-hover:text-[#2D6FD4]">{s.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-8 relative z-10">
                  {s.desc}
                </p>
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all relative z-10" style={{ color: "#2D6FD4" }}>
                  Открыть раздел <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SECTION MODAL ─── */}
      <AnimatePresence>
        {activeModal && activeSection && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/50 flex items-start justify-center p-4 pt-20 overflow-y-auto"
            onClick={(e) => e.target === e.currentTarget && setActiveModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="bg-card border border-border rounded-lg shadow-xl w-full max-w-3xl mb-8"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-foreground text-background rounded flex items-center justify-center">
                    <activeSection.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider">Школьникам</p>
                    <h2 className="font-bold">{activeSection.title}</h2>
                  </div>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="p-2 hover:bg-secondary rounded transition-colors"
                  aria-label="Закрыть"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal body */}
              <div className="px-6 py-6">
                {activeSection.id === "schedule" ? (
                  <activeSection.modalContent pdfUrl={schedulePdfUrl} />
                ) : (
                  <activeSection.modalContent />
                )}
              </div>

              {/* Navigation between sections */}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
