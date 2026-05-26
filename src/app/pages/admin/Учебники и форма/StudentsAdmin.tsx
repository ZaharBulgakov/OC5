import { useState, useEffect, useRef } from "react";
import { supabase } from "../../../lib/supabase";
import {
  Trash2, ChevronDown, ChevronUp,
  Upload, Edit3, Image as ImageIcon, BookOpen, Shirt, Music
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Textbook {
  id: string;
  subject: string;
  author: string;
  year: number;
  grade_label: string;
}

const GRADES = [
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
  day_of_week: number; // 0=Пн … 6=Вс
  time: string;
}

const DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const btn =
  "px-4 py-2 rounded-xl font-bold text-sm transition-all flex items-center gap-2";
const primaryBtn =
  btn + " bg-[#2D6FD4] text-white hover:bg-[#2558b0] shadow hover:shadow-lg";
const dangerBtn =
  btn + " text-destructive hover:bg-destructive/10";
const inputCls =
  "w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6FD4]/20 focus:border-[#2D6FD4]";

// ─── Main component ───────────────────────────────────────────────────────────

export default function StudentsAdmin({ initialSubTab = "books", onSectionChange, onEditTextbook, onEditUniform, onEditActivity }: { initialSubTab?: "books" | "activities"; onSectionChange?: (section: "textbooks" | "uniform") => void; onEditTextbook?: (textbook: Textbook) => void; onEditUniform?: (uniform: UniformCard) => void; onEditActivity?: (activity: Activity) => void }) {
  return (
    <div className="space-y-6">
      {initialSubTab === "books" ? <BooksAndUniformTab onSectionChange={onSectionChange || (() => {})} onEditTextbook={onEditTextbook} onEditUniform={onEditUniform} /> : <ActivitiesTab onEditActivity={onEditActivity} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 1: Учебники и форма
// ═══════════════════════════════════════════════════════════════════════════════

function BooksAndUniformTab({ onSectionChange, onEditTextbook, onEditUniform }: { onSectionChange: (section: "textbooks" | "uniform") => void; onEditTextbook?: (textbook: Textbook) => void; onEditUniform?: (uniform: UniformCard) => void }) {
  const [section, setSection] = useState<"textbooks" | "uniform">("textbooks");

  const handleSectionChange = (s: "textbooks" | "uniform") => {
    setSection(s);
    onSectionChange(s);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(["textbooks", "uniform"] as const).map((s) => {
          const labels = { textbooks: "Учебники", uniform: "Школьная форма" };
          const icons = { textbooks: <BookOpen className="w-3.5 h-3.5" />, uniform: <Shirt className="w-3.5 h-3.5" /> };
          return (
            <button
              key={s}
              onClick={() => handleSectionChange(s)}
              className={`${btn} text-xs ${section === s ? "bg-brand-blue-dark text-white shadow" : "border border-border hover:bg-brand-blue-dark/10 hover:text-brand-blue-dark"}`}
            >
              {icons[s]} {labels[s]}
            </button>
          );
        })}
      </div>

      {section === "textbooks" && <TextbooksSection onEditTextbook={onEditTextbook} />}
      {section === "uniform" && <UniformSection onEditUniform={onEditUniform} />}
    </div>
  );
}

// ── Учебники ─────────────────────────────────────────────────────────────────

function TextbooksSection({ onEditTextbook }: { onEditTextbook?: (textbook: Textbook) => void }) {
  const [items, setItems] = useState<Textbook[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeGrade, setActiveGrade] = useState<string>("1 класс");

  useEffect(() => { fetch(); }, []);

  const fetch = async () => {
    setLoading(true);
    const { data } = await supabase.from("textbooks").select("*").order("subject");
    setItems((data as Textbook[]) || []);
    setLoading(false);
  };

  const del = async (id: string) => {
    if (!confirm("Удалить учебник?")) return;
    await supabase.from("textbooks").delete().eq("id", id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const filteredItems = items.filter((t) => (t.grade_label || "1 класс") === activeGrade);

  return (
    <div className="space-y-5">
      {/* Grade selector */}
      <div>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Учебники {new Date().getFullYear()} — выберите класс</p>
        <div className="flex flex-wrap gap-2">
          {GRADES.map((g) => {
            return (
              <button
                key={g}
                onClick={() => { setActiveGrade(g); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  activeGrade === g
                    ? "bg-brand-blue-dark text-white border-brand-blue-dark shadow"
                    : "border-border hover:bg-brand-blue-dark/10 hover:text-brand-blue-dark"
                }`}
              >
                {g}
              </button>
            );
          })}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <p className="text-sm text-muted-foreground">Загрузка...</p>
      ) : filteredItems.length === 0 ? (
        <p className="text-sm text-muted-foreground">Учебников для {activeGrade} пока нет.</p>
      ) : (
        <div className="space-y-2">
          {filteredItems.map((t) => (
            <div key={t.id} className="flex items-center justify-between bg-card border border-border rounded-xl px-4 py-3 group">
              <div>
                <span className="font-medium text-sm text-[#1A2B4A]">{t.subject}</span>
                <span className="text-xs text-muted-foreground ml-3">{t.author}, {t.year}</span>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {onEditTextbook && (
                  <button onClick={() => onEditTextbook(t)} className="p-2 hover:bg-brand-blue-dark/10 text-brand-blue-dark rounded-lg transition-colors">
                    <Edit3 className="w-5 h-5" />
                  </button>
                )}
                <button onClick={() => del(t.id)} className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Школьная форма (карточки + референсы) ────────────────────────────────────

function UniformSection({ onEditUniform }: { onEditUniform?: (uniform: UniformCard) => void }) {
  const [cards, setCards] = useState<UniformCard[]>([]);
  const [refs, setRefs] = useState<UniformRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const [{ data: cardsData }, { data: refsData }] = await Promise.all([
      supabase.from("uniform_cards").select("*").order("sort_order"),
      supabase.from("uniform_refs").select("*").order("created_at", { ascending: false }),
    ]);
    setCards((cardsData as UniformCard[]) || []);
    setRefs((refsData as UniformRef[]) || []);
    setLoading(false);
  };

  const del = async (id: string) => {
    if (!confirm("Удалить карточку и все её референсы?")) return;
    await supabase.from("uniform_cards").delete().eq("id", id);
    setCards((prev) => prev.filter((c) => c.id !== id));
    setRefs((prev) => prev.filter((r) => r.card_id !== id));
  };

  const moveCard = async (id: string, dir: -1 | 1) => {
    const sorted = [...cards].sort((a, b) => a.sort_order - b.sort_order);
    const idx = sorted.findIndex((c) => c.id === id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const tmp = sorted[idx].sort_order;
    sorted[idx] = { ...sorted[idx], sort_order: sorted[swapIdx].sort_order };
    sorted[swapIdx] = { ...sorted[swapIdx], sort_order: tmp };
    await supabase.from("uniform_cards").update({ sort_order: sorted[idx].sort_order }).eq("id", sorted[idx].id);
    await supabase.from("uniform_cards").update({ sort_order: sorted[swapIdx].sort_order }).eq("id", sorted[swapIdx].id);
    load();
  };

  const onRefUploaded = (newRef: UniformRef) => {
    setRefs((prev) => [newRef, ...prev]);
  };

  const delRef = async (r: UniformRef) => {
    if (!confirm("Удалить референс?")) return;
    await supabase.from("uniform_refs").delete().eq("id", r.id);
    setRefs((prev) => prev.filter((x) => x.id !== r.id));
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{cards.length} карточек</p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Загрузка...</p>
      ) : cards.length === 0 ? (
        <p className="text-sm text-muted-foreground">Карточек пока нет.</p>
      ) : (
        <div className="space-y-3">
          {[...cards].sort((a, b) => a.sort_order - b.sort_order).map((c, i) => {
            const cardRefs = refs.filter((r) => r.card_id === c.id);
            const isExpanded = expandedCardId === c.id;

            return (
              <div key={c.id} className="border border-border rounded-2xl overflow-hidden">
                {/* Card header row */}
                <div className="flex items-start gap-3 bg-card px-4 py-3 group">
                  <div className="flex flex-col gap-0.5 mt-1">
                    <button onClick={() => moveCard(c.id, -1)} disabled={i === 0} className="p-0.5 hover:bg-secondary rounded disabled:opacity-20">
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => moveCard(c.id, 1)} disabled={i === cards.length - 1} className="p-0.5 hover:bg-secondary rounded disabled:opacity-20">
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-[#2D6FD4]">{c.grade_label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{c.description}</p>
                    <button
                      onClick={() => setExpandedCardId(isExpanded ? null : c.id)}
                      className={`mt-2 inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border transition-all ${
                        isExpanded
                          ? "bg-[#2D6FD4] text-white border-[#2D6FD4]"
                          : "text-[#2D6FD4] border-[#2D6FD4] hover:bg-[#2D6FD4]/10"
                      }`}
                    >
                      <ImageIcon className="w-3 h-3" />
                      Референсы ({cardRefs.length})
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onEditUniform && (
                      <button onClick={() => onEditUniform(c)} className="p-2 hover:bg-brand-blue-dark/10 text-brand-blue-dark rounded-lg transition-colors">
                        <Edit3 className="w-5 h-5" />
                      </button>
                    )}
                    <button onClick={() => del(c.id)} className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Refs panel */}
                {isExpanded && (
                  <div className="border-t border-border bg-secondary/20 px-4 py-4 space-y-4">
                    {/* Upload */}
                    <CardRefUpload cardId={c.id} onUploaded={onRefUploaded} />

                    {/* Grid */}
                    {cardRefs.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {cardRefs.map((r) => (
                          <div key={r.id} className="group relative rounded-xl overflow-hidden border border-border aspect-[3/4]">
                            <img src={r.url} alt={r.caption || ""} className="w-full h-full object-cover" />
                            {r.caption && (
                              <div className="absolute bottom-0 inset-x-0 bg-black/60 px-2 py-1.5">
                                <p className="text-white text-xs truncate">{r.caption}</p>
                              </div>
                            )}
                            <button
                              onClick={() => delRef(r)}
                              className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-destructive"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {cardRefs.length === 0 && (
                      <p className="text-xs text-muted-foreground">Референсов пока нет — загрузите первый.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Загрузчик референса для конкретной карточки ───────────────────────────────

function CardRefUpload({ cardId, onUploaded }: { cardId: string; onUploaded: (r: UniformRef) => void }) {
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState("");
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = (f: File) => {
    setPreviewFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const upload = async () => {
    if (!previewFile) return;
    setUploading(true);
    const name = `ref-${Date.now()}-${previewFile.name.replace(/[^a-zA-Z0-9.]/g, "-")}`;
    const { data: storageData, error } = await supabase.storage
      .from("uniform-refs")
      .upload(`public/${name}`, previewFile, { cacheControl: "3600", upsert: false });
    if (error) { alert("Ошибка загрузки: " + error.message); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("uniform-refs").getPublicUrl(storageData.path);
    const { data: inserted } = await supabase
      .from("uniform_refs")
      .insert([{ card_id: cardId, url: urlData.publicUrl, caption: caption.trim() || null }])
      .select()
      .single();
    if (inserted) onUploaded(inserted as UniformRef);
    setPreviewFile(null);
    setPreviewUrl(null);
    setCaption("");
    setUploading(false);
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Добавить референс</p>
      <div
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-border rounded-xl p-4 text-center cursor-pointer hover:border-[#2D6FD4] transition-colors"
      >
        {previewUrl ? (
          <img src={previewUrl} alt="preview" className="max-h-36 mx-auto rounded-lg object-contain" />
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
            <Upload className="w-6 h-6" />
            <span className="text-xs">Нажмите или перетащите изображение</span>
          </div>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
      <div className="flex gap-2">
        <input
          className={inputCls}
          placeholder="Подпись (необязательно)"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
        />
        <button onClick={upload} disabled={!previewFile || uploading} className={primaryBtn + " whitespace-nowrap disabled:opacity-50"}>
          <Upload className="w-4 h-4" /> {uploading ? "Загрузка..." : "Загрузить"}
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 2: Кружки и секции
// ═══════════════════════════════════════════════════════════════════════════════

function ActivitiesTab({ onEditActivity }: { onEditActivity?: (activity: Activity) => void }) {
  const [sections, setSections] = useState<ActivitySection[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [schedules, setSchedules] = useState<ActivitySchedule[]>([]);
  const [loading, setLoading] = useState(true);

  // UI state
  // (removed expandedActivity and scheduleEditor as schedule is now handled in Dashboard)

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const [s, a, sc] = await Promise.all([
      supabase.from("activity_sections").select("*").order("sort_order"),
      supabase.from("activities").select("*").order("sort_order"),
      supabase.from("activity_schedules").select("*").order("day_of_week"),
    ]);
    setSections((s.data as ActivitySection[]) || []);
    setActivities((a.data as Activity[]) || []);
    setSchedules((sc.data as ActivitySchedule[]) || []);
    setLoading(false);
  };

  // ── Section CRUD ────────────────────────────────────────────────────────────

  const deleteSection = async (id: string) => {
    if (!confirm("Удалить раздел вместе с кружками?")) return;
    await supabase.from("activity_sections").delete().eq("id", id);
    setSections((prev) => prev.filter((s) => s.id !== id));
    setActivities((prev) => prev.filter((a) => a.section_id !== id));
  };

  // ── Activity CRUD ───────────────────────────────────────────────────────────

  const deleteActivity = async (id: string) => {
    if (!confirm("Удалить кружок/секцию?")) return;
    await supabase.from("activities").delete().eq("id", id);
    setActivities((prev) => prev.filter((a) => a.id !== id));
    setSchedules((prev) => prev.filter((s) => s.activity_id !== id));
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  if (loading) return <p className="text-sm text-muted-foreground">Загрузка...</p>;

  return (
    <div className="space-y-5">
      {sections.length === 0 && (
        <p className="text-sm text-muted-foreground">Разделов пока нет. Создайте первый!</p>
      )}

      {/* Sections */}
      {sections.map((sec) => {
        const sectionActivities = activities.filter((a) => a.section_id === sec.id);

        return (
          <div key={sec.id}>
            {/* Section header - styled like documents */}
            <div className="flex items-center gap-3 mb-3">
              <div className="px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider text-white" style={{ background: "#1A2B4A" }}>
                {sec.title}
              </div>
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground font-bold">{sectionActivities.length} кружк.</span>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => deleteSection(sec.id)}
                  className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Activities */}
            <div className="space-y-2">
              {sectionActivities.length === 0 && (
                <p className="text-xs text-muted-foreground px-1">Кружков пока нет.</p>
              )}

              {sectionActivities.map((act) => {
                const actSchedules = schedules.filter((s) => s.activity_id === act.id).sort((a, b) => a.day_of_week - b.day_of_week);

                return (
                  <div key={act.id} className="border border-border rounded-xl overflow-hidden">
                    {/* Activity row - styled like documents */}
                    <div className="flex items-center justify-between px-4 py-3 bg-card group hover:shadow-md transition-all">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="text-sm font-medium text-[#1A2B4A]">{act.title}</span>
                        {actSchedules.length > 0 && (
                          <span className="text-xs text-muted-foreground hidden sm:block">
                            {actSchedules.map((s) => DAYS[s.day_of_week]).join(", ")} · {actSchedules[0].time}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {onEditActivity && (
                          <button onClick={() => onEditActivity(act)} className="p-2 hover:bg-brand-blue-dark/10 text-brand-blue-dark rounded-lg transition-colors">
                            <Edit3 className="w-5 h-5" />
                          </button>
                        )}
                        <button onClick={() => deleteActivity(act.id)} className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              </div>
            </div>
        );
      })}
    </div>
  );
}
