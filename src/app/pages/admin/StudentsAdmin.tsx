/**
 * StudentsAdmin.tsx
 * Вставить в Dashboard.tsx как новый таб "students".
 *
 * Supabase таблицы (создать через SQL Editor):
 *
 * -- Учебники
 * create table textbooks (
 *   id uuid primary key default gen_random_uuid(),
 *   subject text not null,
 *   author text not null,
 *   year int not null,
 *   created_at timestamptz default now()
 * );
 *
 * -- Карточки школьной формы
 * create table uniform_cards (
 *   id uuid primary key default gen_random_uuid(),
 *   grade_label text not null,
 *   description text not null,
 *   note text,
 *   sort_order int default 0,
 *   created_at timestamptz default now()
 * );
 *
 * -- Референсы одежды (изображения)
 * create table uniform_refs (
 *   id uuid primary key default gen_random_uuid(),
 *   card_id uuid references uniform_cards(id) on delete cascade,
 *   url text not null,
 *   caption text,
 *   created_at timestamptz default now()
 * );
 * -- МИГРАЦИЯ (если таблица уже существует):
 * ALTER TABLE uniform_refs ADD COLUMN IF NOT EXISTS card_id uuid references uniform_cards(id) on delete cascade;
 *
 * -- Разделы кружков
 * create table activity_sections (
 *   id uuid primary key default gen_random_uuid(),
 *   title text not null,
 *   sort_order int default 0,
 *   created_at timestamptz default now()
 * );
 *
 * -- Кружки/секции
 * create table activities (
 *   id uuid primary key default gen_random_uuid(),
 *   section_id uuid references activity_sections(id) on delete cascade,
 *   title text not null,
 *   sort_order int default 0,
 *   created_at timestamptz default now()
 * );
 *
 * -- Расписание кружка (дни и время)
 * create table activity_schedules (
 *   id uuid primary key default gen_random_uuid(),
 *   activity_id uuid references activities(id) on delete cascade,
 *   day_of_week int not null, -- 0=Пн, 1=Вт, ... 6=Вс
 *   time text not null,       -- "15:30"
 *   created_at timestamptz default now()
 * );
 *
 * Storage bucket "uniform-refs" (public).
 */

import { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabase";
import {
  Plus, Trash2, Save, X, ChevronDown, ChevronUp,
  Upload, Edit3, Clock, Image as ImageIcon, BookOpen, Shirt, Music
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Textbook {
  id: string;
  subject: string;
  author: string;
  year: number;
}

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
const ghostBtn =
  btn + " border border-border hover:bg-secondary";
const dangerBtn =
  btn + " text-destructive hover:bg-destructive/10";
const inputCls =
  "w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6FD4]/20 focus:border-[#2D6FD4]";

// ─── Main component ───────────────────────────────────────────────────────────

export default function StudentsAdmin({ initialSubTab = "books" }: { initialSubTab?: "books" | "activities" }) {
  return (
    <div className="space-y-6">
      {initialSubTab === "books" ? <BooksAndUniformTab /> : <ActivitiesTab />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 1: Учебники и форма
// ═══════════════════════════════════════════════════════════════════════════════

function BooksAndUniformTab() {
  const [section, setSection] = useState<"textbooks" | "uniform">("textbooks");

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(["textbooks", "uniform"] as const).map((s) => {
          const labels = { textbooks: "Учебники", uniform: "Школьная форма" };
          const icons = { textbooks: <BookOpen className="w-3.5 h-3.5" />, uniform: <Shirt className="w-3.5 h-3.5" /> };
          return (
            <button
              key={s}
              onClick={() => setSection(s)}
              className={`${btn} text-xs ${section === s ? "bg-[#1A2B4A] text-white" : "border border-border hover:bg-secondary"}`}
            >
              {icons[s]} {labels[s]}
            </button>
          );
        })}
      </div>

      {section === "textbooks" && <TextbooksSection />}
      {section === "uniform" && <UniformSection />}
    </div>
  );
}

// ── Учебники ─────────────────────────────────────────────────────────────────

function TextbooksSection() {
  const [items, setItems] = useState<Textbook[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ subject: "", author: "", year: new Date().getFullYear() });
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetch(); }, []);

  const fetch = async () => {
    setLoading(true);
    const { data } = await supabase.from("textbooks").select("*").order("subject");
    setItems((data as Textbook[]) || []);
    setLoading(false);
  };

  const save = async () => {
    if (!form.subject.trim() || !form.author.trim()) return;
    setSaving(true);
    if (editId) {
      await supabase.from("textbooks").update(form).eq("id", editId);
    } else {
      await supabase.from("textbooks").insert([form]);
    }
    setForm({ subject: "", author: "", year: new Date().getFullYear() });
    setEditId(null);
    setSaving(false);
    fetch();
  };

  const del = async (id: string) => {
    if (!confirm("Удалить учебник?")) return;
    await supabase.from("textbooks").delete().eq("id", id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const startEdit = (t: Textbook) => {
    setForm({ subject: t.subject, author: t.author, year: t.year });
    setEditId(t.id);
  };

  return (
    <div className="space-y-5">
      {/* Form */}
      <div className="bg-secondary/40 border border-border rounded-2xl p-5 space-y-3">
        <h3 className="font-bold text-sm text-[#1A2B4A]">{editId ? "Редактировать учебник" : "Добавить учебник"}</h3>
        <div className="grid sm:grid-cols-3 gap-3">
          <input
            className={inputCls}
            placeholder="Предмет"
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
          />
          <input
            className={inputCls}
            placeholder="Автор / издательство"
            value={form.author}
            onChange={(e) => setForm({ ...form, author: e.target.value })}
          />
          <input
            className={inputCls}
            type="number"
            placeholder="Год"
            value={form.year}
            onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
          />
        </div>
        <div className="flex gap-2">
          <button onClick={save} disabled={saving} className={primaryBtn}>
            <Save className="w-4 h-4" /> {saving ? "Сохранение..." : editId ? "Сохранить" : "Добавить"}
          </button>
          {editId && (
            <button onClick={() => { setEditId(null); setForm({ subject: "", author: "", year: new Date().getFullYear() }); }} className={ghostBtn}>
              <X className="w-4 h-4" /> Отмена
            </button>
          )}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <p className="text-sm text-muted-foreground">Загрузка...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Учебников пока нет.</p>
      ) : (
        <div className="space-y-2">
          {items.map((t) => (
            <div key={t.id} className="flex items-center justify-between bg-card border border-border rounded-xl px-4 py-3 group">
              <div>
                <span className="font-medium text-sm text-[#1A2B4A]">{t.subject}</span>
                <span className="text-xs text-muted-foreground ml-3">{t.author}, {t.year}</span>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <button onClick={() => startEdit(t)} className={ghostBtn + " !px-2 !py-1.5"}><Edit3 className="w-3.5 h-3.5" /></button>
                <button onClick={() => del(t.id)} className={dangerBtn + " !px-2 !py-1.5"}><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Школьная форма (карточки + референсы) ────────────────────────────────────

function UniformSection() {
  const [cards, setCards] = useState<UniformCard[]>([]);
  const [refs, setRefs] = useState<UniformRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ grade_label: "", description: "", note: "" });
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
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

  const save = async () => {
    if (!form.grade_label.trim() || !form.description.trim()) return;
    setSaving(true);
    if (editId) {
      await supabase.from("uniform_cards").update(form).eq("id", editId);
    } else {
      const maxOrder = cards.reduce((m, c) => Math.max(m, c.sort_order), -1);
      await supabase.from("uniform_cards").insert([{ ...form, sort_order: maxOrder + 1 }]);
    }
    setForm({ grade_label: "", description: "", note: "" });
    setEditId(null);
    setShowForm(false);
    setSaving(false);
    load();
  };

  const del = async (id: string) => {
    if (!confirm("Удалить карточку и все её референсы?")) return;
    await supabase.from("uniform_cards").delete().eq("id", id);
    setCards((prev) => prev.filter((c) => c.id !== id));
    setRefs((prev) => prev.filter((r) => r.card_id !== id));
  };

  const startEdit = (c: UniformCard) => {
    setForm({ grade_label: c.grade_label, description: c.description, note: c.note || "" });
    setEditId(c.id);
    setShowForm(true);
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
        <button
          onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ grade_label: "", description: "", note: "" }); }}
          className={primaryBtn}
        >
          <Plus className="w-4 h-4" /> Добавить карточку
        </button>
      </div>

      {showForm && (
        <div className="bg-secondary/40 border border-border rounded-2xl p-5 space-y-3">
          <h3 className="font-bold text-sm text-[#1A2B4A]">{editId ? "Редактировать" : "Новая карточка"}</h3>
          <input
            className={inputCls}
            placeholder="Заголовок (напр. 1–4 классы)"
            value={form.grade_label}
            onChange={(e) => setForm({ ...form, grade_label: e.target.value })}
          />
          <textarea
            className={inputCls + " resize-none h-20"}
            placeholder="Описание формы"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <input
            className={inputCls}
            placeholder="Примечание (курсив, необязательно)"
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
          />
          <div className="flex gap-2">
            <button onClick={save} disabled={saving} className={primaryBtn}>
              <Save className="w-4 h-4" /> {saving ? "Сохранение..." : editId ? "Сохранить" : "Добавить"}
            </button>
            <button onClick={() => { setShowForm(false); setEditId(null); }} className={ghostBtn}>
              <X className="w-4 h-4" /> Отмена
            </button>
          </div>
        </div>
      )}

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
                    {c.note && <p className="text-xs text-muted-foreground italic mt-0.5">{c.note}</p>}
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
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => startEdit(c)} className={ghostBtn + " !px-2 !py-1.5"}>
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => del(c.id)} className={dangerBtn + " !px-2 !py-1.5"}>
                      <Trash2 className="w-3.5 h-3.5" />
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

function ActivitiesTab() {
  const [sections, setSections] = useState<ActivitySection[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [schedules, setSchedules] = useState<ActivitySchedule[]>([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [expandedActivity, setExpandedActivity] = useState<string | null>(null);

  // New section form
  const [newSectionTitle, setNewSectionTitle] = useState("");

  // New activity form (per section)
  const [newActivityTitle, setNewActivityTitle] = useState<Record<string, string>>({});

  // Schedule editor
  const [scheduleEditor, setScheduleEditor] = useState<Record<string, { days: number[]; time: string }>>({});

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

  const addSection = async () => {
    const title = newSectionTitle.trim();
    if (!title) return;
    const maxOrder = sections.reduce((m, s) => Math.max(m, s.sort_order), -1);
    const { data } = await supabase.from("activity_sections").insert([{ title, sort_order: maxOrder + 1 }]).select();
    if (data) setSections((prev) => [...prev, data[0] as ActivitySection]);
    setNewSectionTitle("");
  };

  const deleteSection = async (id: string) => {
    if (!confirm("Удалить раздел вместе с кружками?")) return;
    await supabase.from("activity_sections").delete().eq("id", id);
    setSections((prev) => prev.filter((s) => s.id !== id));
    setActivities((prev) => prev.filter((a) => a.section_id !== id));
  };

  // ── Activity CRUD ───────────────────────────────────────────────────────────

  const addActivity = async (sectionId: string) => {
    const title = (newActivityTitle[sectionId] || "").trim();
    if (!title) return;
    const maxOrder = activities.filter((a) => a.section_id === sectionId).reduce((m, a) => Math.max(m, a.sort_order), -1);
    const { data } = await supabase.from("activities").insert([{ section_id: sectionId, title, sort_order: maxOrder + 1 }]).select();
    if (data) setActivities((prev) => [...prev, data[0] as Activity]);
    setNewActivityTitle((prev) => ({ ...prev, [sectionId]: "" }));
  };

  const deleteActivity = async (id: string) => {
    if (!confirm("Удалить кружок/секцию?")) return;
    await supabase.from("activities").delete().eq("id", id);
    setActivities((prev) => prev.filter((a) => a.id !== id));
    setSchedules((prev) => prev.filter((s) => s.activity_id !== id));
  };

  // ── Schedule CRUD ───────────────────────────────────────────────────────────

  const openScheduleEditor = (activityId: string) => {
    const existing = schedules.filter((s) => s.activity_id === activityId);
    const days = existing.map((s) => s.day_of_week);
    const time = existing[0]?.time || "15:00";
    setScheduleEditor((prev) => ({ ...prev, [activityId]: { days, time } }));
    setExpandedActivity(activityId);
  };

  const toggleDay = (activityId: string, day: number) => {
    setScheduleEditor((prev) => {
      const cur = prev[activityId] || { days: [], time: "15:00" };
      const days = cur.days.includes(day) ? cur.days.filter((d) => d !== day) : [...cur.days, day];
      return { ...prev, [activityId]: { ...cur, days } };
    });
  };

  const saveSchedule = async (activityId: string) => {
    const { days, time } = scheduleEditor[activityId] || { days: [], time: "15:00" };
    // Delete old
    await supabase.from("activity_schedules").delete().eq("activity_id", activityId);
    // Insert new
    if (days.length > 0) {
      const rows = days.map((d) => ({ activity_id: activityId, day_of_week: d, time }));
      const { data } = await supabase.from("activity_schedules").insert(rows).select();
      setSchedules((prev) => [
        ...prev.filter((s) => s.activity_id !== activityId),
        ...((data as ActivitySchedule[]) || []),
      ]);
    } else {
      setSchedules((prev) => prev.filter((s) => s.activity_id !== activityId));
    }
    setExpandedActivity(null);
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  if (loading) return <p className="text-sm text-muted-foreground">Загрузка...</p>;

  return (
    <div className="space-y-5">
      {/* Add section */}
      <div className="flex gap-2">
        <input
          className={inputCls}
          placeholder="Название нового раздела (напр. Спорт)"
          value={newSectionTitle}
          onChange={(e) => setNewSectionTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addSection()}
        />
        <button onClick={addSection} className={primaryBtn + " whitespace-nowrap"}>
          <Plus className="w-4 h-4" /> Раздел
        </button>
      </div>

      {sections.length === 0 && (
        <p className="text-sm text-muted-foreground">Разделов пока нет. Создайте первый!</p>
      )}

      {/* Sections */}
      {sections.map((sec) => {
        const sectionActivities = activities.filter((a) => a.section_id === sec.id);
        const isExpanded = expandedSection === sec.id;

        return (
          <div key={sec.id} className="border border-border rounded-2xl overflow-hidden">
            {/* Section header */}
            <div
              className="flex items-center justify-between px-5 py-4 bg-secondary/40 cursor-pointer hover:bg-secondary/70 transition-colors"
              onClick={() => setExpandedSection(isExpanded ? null : sec.id)}
            >
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[#2D6FD4]" />
                <span className="font-bold text-[#1A2B4A]">{sec.title}</span>
                <span className="text-xs text-muted-foreground">{sectionActivities.length} кружков</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); deleteSection(sec.id); }}
                  className={dangerBtn + " !px-2 !py-1.5 text-xs"}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </div>
            </div>

            {/* Activities */}
            {isExpanded && (
              <div className="p-4 space-y-3">
                {/* Add activity */}
                <div className="flex gap-2">
                  <input
                    className={inputCls}
                    placeholder="Название кружка или секции"
                    value={newActivityTitle[sec.id] || ""}
                    onChange={(e) => setNewActivityTitle((prev) => ({ ...prev, [sec.id]: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && addActivity(sec.id)}
                  />
                  <button onClick={() => addActivity(sec.id)} className={primaryBtn + " whitespace-nowrap"}>
                    <Plus className="w-4 h-4" /> Добавить
                  </button>
                </div>

                {sectionActivities.length === 0 && (
                  <p className="text-xs text-muted-foreground px-1">Кружков пока нет.</p>
                )}

                {sectionActivities.map((act) => {
                  const actSchedules = schedules.filter((s) => s.activity_id === act.id).sort((a, b) => a.day_of_week - b.day_of_week);
                  const isEditingSchedule = expandedActivity === act.id;
                  const editor = scheduleEditor[act.id] || { days: actSchedules.map((s) => s.day_of_week), time: actSchedules[0]?.time || "15:00" };

                  return (
                    <div key={act.id} className="border border-border rounded-xl overflow-hidden">
                      {/* Activity row */}
                      <div className="flex items-center justify-between px-4 py-3 bg-card">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="text-sm font-medium text-[#1A2B4A]">{act.title}</span>
                          {actSchedules.length > 0 && (
                            <span className="text-xs text-muted-foreground hidden sm:block">
                              {actSchedules.map((s) => DAYS[s.day_of_week]).join(", ")} · {actSchedules[0].time}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => isEditingSchedule ? setExpandedActivity(null) : openScheduleEditor(act.id)}
                            className={`${btn} text-xs ${isEditingSchedule ? "bg-[#2D6FD4] text-white" : "border border-border hover:bg-secondary"}`}
                          >
                            <Clock className="w-3.5 h-3.5" /> Расписание
                          </button>
                          <button onClick={() => deleteActivity(act.id)} className={dangerBtn + " !px-2 !py-1.5"}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Schedule editor */}
                      {isEditingSchedule && (
                        <div className="border-t border-border bg-secondary/30 px-4 py-4 space-y-4">
                          {/* Day picker */}
                          <div>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Дни недели</p>
                            <div className="flex gap-2 flex-wrap">
                              {DAYS.map((day, idx) => (
                                <button
                                  key={day}
                                  onClick={() => toggleDay(act.id, idx)}
                                  className={`w-11 h-11 rounded-xl text-sm font-bold transition-all border ${
                                    editor.days.includes(idx)
                                      ? "bg-[#2D6FD4] text-white border-[#2D6FD4] shadow-lg"
                                      : "bg-card border-border text-muted-foreground hover:border-[#2D6FD4]"
                                  }`}
                                >
                                  {day}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Time picker */}
                          <div>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Время начала</p>
                            <input
                              type="time"
                              value={editor.time}
                              onChange={(e) =>
                                setScheduleEditor((prev) => ({
                                  ...prev,
                                  [act.id]: { ...editor, time: e.target.value },
                                }))
                              }
                              className="bg-card border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6FD4]/20 focus:border-[#2D6FD4]"
                            />
                          </div>

                          <div className="flex gap-2">
                            <button onClick={() => saveSchedule(act.id)} className={primaryBtn}>
                              <Save className="w-4 h-4" /> Сохранить расписание
                            </button>
                            <button onClick={() => setExpandedActivity(null)} className={ghostBtn}>
                              <X className="w-4 h-4" /> Отмена
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
