import { motion, AnimatePresence } from "motion/react";
import { Trophy, Star, Medal, Zap, BookOpen, Globe, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

const achievements = [
  { icon: Trophy, title: "Победители олимпиад", value: "142 учеников", desc: "По итогам 2025 года" },
  { icon: Star, title: "Рейтинг школ РФ", value: "Топ 100", desc: "По версии Минпросвещения" },
  { icon: Medal, title: "Всероссийские конкурсы", value: "38 наград", desc: "За последние 3 года" },
  { icon: Zap, title: "STEM-проекты", value: "24 проекта", desc: "Реализованных в 2025" },
  { icon: BookOpen, title: "Публикации учеников", value: "17 работ", desc: "В научных изданиях" },
  { icon: Globe, title: "Международные обмены", value: "5 стран", desc: "Программы партнёрства" },
];

const historyItems = [
  {
    year: "1985",
    title: "Основание",
    side: "left",
    text: "В 1985 году в Ленинском районе Челябинска была открыта школа №5, рассчитанная на 800 учеников. Первым директором стала Зинаида Петровна Морозова. С первых лет работы учреждение отличалась сильным педагогическим составом и высокими результатами учеников на городских олимпиадах.",
  },
  {
    year: "1998",
    title: "Расширение корпусов",
    side: "right",
    text: "В 1998 году было возведено новое учебное крыло с современными кабинетами физики, химии и биологии. Библиотечный фонд пополнился более чем 12 000 томами. Школа получила статус базовой по математике и естественным наукам в Ленинском районе города.",
  },
  {
    year: "2010",
    title: "Цифровизация",
    side: "left",
    text: "Программа «Цифровая школа» позволила оснастить все кабинеты интерактивными досками и подключить учреждение к высокоскоростному интернету. Введён электронный журнал. По итогам 2010 года школа вошла в топ-10 образовательных учреждений Челябинска по качеству подготовки выпускников.",
  },
  {
    year: "2020",
    title: "Центр инноваций",
    side: "right",
    text: "На базе школы открылся Центр технологического образования: появились кабинет робототехники с оборудованием Arduino и LEGO Education, 3D-принтер, лазерный гравёр. Учреждение переименовано в «Образовательный центр №5». В 2021 году центр стал опорной площадкой Минпросвещения по STEM-образованию.",
  },
  {
    year: "2026",
    title: "Сегодня",
    side: "left",
    text: "Сегодня Образовательный центр №5 — одно из ведущих образовательных учреждений Челябинска: 1 247 учеников, 87 педагогов, более 30 кружков и секций, собственный IT-класс, школьный совет и активное участие в городских и федеральных проектах. Продолжается работа по развитию инклюзивной среды и цифровых сервисов.",
  },
];

interface Photo {
  url: string;
  caption: string;
}

interface Collection {
  id: number;
  title: string;
  description: string;
  cover: string;
  count: number;
  photos: Photo[];
}

export default function About() {
  const [openCollection, setOpenCollection] = useState<Collection | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [dbCollections, setDbCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMoreCollections, setHasMoreCollections] = useState(true);
  const [collectionOffset, setCollectionOffset] = useState(0);
  const COLLECTIONS_PER_PAGE = 4;

  useEffect(() => {
    fetchGalleryCollections(true);
  }, []);

  const fetchGalleryCollections = async (reset = false) => {
    setLoading(true);
    const currentOffset = reset ? 0 : collectionOffset;
    const { data, error } = await supabase
      .from('gallery')
      .select('*')
      .range(currentOffset, currentOffset + COLLECTIONS_PER_PAGE - 1);

    if (error) {
      console.error("Error fetching gallery:", error);
      setLoading(false);
      return;
    }

    if (data) {
      const newCollections = data.reduce((acc: { [key: string]: Collection }, item: any) => {
        const collectionName = item.collection || "Без коллекции";
        if (!acc[collectionName]) {
          acc[collectionName] = {
            id: Math.random(),
            title: collectionName,
            description: "",
            cover: item.url,
            count: 0,
            photos: [],
          };
        }
        acc[collectionName].photos.push({ url: item.url, caption: item.title });
        acc[collectionName].count = acc[collectionName].photos.length;
        return acc;
      }, {});

      setDbCollections((prevCollections) => {
        const combined = reset
          ? { ...newCollections }
          : { ...prevCollections.reduce((acc, col) => ({ ...acc, [col.title]: col }), {}), ...newCollections };
        return Object.values(combined);
      });
      setCollectionOffset(currentOffset + data.length);
      setHasMoreCollections(data.length === COLLECTIONS_PER_PAGE);
    }
    setLoading(false);
  };

  const handleShowMoreCollections = () => {
    fetchGalleryCollections();
  };

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);

  const prevPhoto = () => {
    if (lightboxIndex === null || !openCollection) return;
    setLightboxIndex((lightboxIndex - 1 + openCollection.photos.length) % openCollection.photos.length);
  };

  const nextPhoto = () => {
    if (lightboxIndex === null || !openCollection) return;
    setLightboxIndex((lightboxIndex + 1) % openCollection.photos.length);
  };

  return (
    <div>
      {/* ─── PAGE HEADER ─── */}
      <section className="py-14 px-6 lg:px-10 border-b border-border bg-secondary">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-5xl mx-auto"
        >
          <h1 className="text-5xl lg:text-6xl font-bold mb-4">О центре</h1>
          <p className="text-muted-foreground max-w-xl">
            Образовательный центр №5 города Челябинска — учреждение с богатой историей,
            современной инфраструктурой и сильным педагогическим коллективом с 1985 года.
          </p>
        </motion.div>
      </section>

      {/* ─── ДОСТИЖЕНИЯ ───
      <section className="py-16 px-6 lg:px-10">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-2">
              Результаты работы
            </p>
            <h2 className="text-3xl lg:text-4xl font-bold">Достижения</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {achievements.map((a, i) => (
              <motion.div
                key={a.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-card border border-border rounded p-6 hover:shadow-lg transition-all duration-200 group cursor-default"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-11 h-11 bg-secondary border border-border rounded flex items-center justify-center group-hover:bg-foreground group-hover:text-background transition-colors duration-200">
                    <a.icon className="w-5 h-5" />
                  </div>
                  <span className="text-2xl font-bold">{a.value}</span>
                </div>
                <h3 className="font-bold mb-1">{a.title}</h3>
                <p className="text-xs text-muted-foreground">{a.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section> */}

      {/* ─── ГАЛЕРЕЯ КОЛЛЕКЦИЙ ─── */}
      <section className="py-16 px-6 lg:px-10 bg-secondary border-t border-border">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10">
            <h2 className="text-3xl lg:text-4xl font-bold">Галерея</h2>
            <p className="text-muted-foreground mt-2">Нажмите на коллекцию, чтобы посмотреть фотографии</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue-dark"></div>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-5">
              {dbCollections.map((col, i) => (
                <motion.div
                  key={col.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => setOpenCollection(col)}
                  className="group relative rounded overflow-hidden border border-border cursor-pointer hover:shadow-lg transition-all duration-300"
                  style={{ aspectRatio: "1/1" }}
                >
                  <ImageWithFallback
                    src={col.cover}
                    alt={col.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-white font-bold text-lg leading-tight">{col.title}</p>
                        <p className="text-white/70 text-xs mt-1">{col.description}</p>
                      </div>
                      <span className="text-white/60 text-sm font-mono bg-black/30 px-2 py-0.5 rounded">
                        {col.count} фото
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {hasMoreCollections && !loading && (
            <div className="flex justify-center mt-8">
              <button
                onClick={handleShowMoreCollections}
                className="bg-brand-blue-dark text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:shadow-lg hover:-translate-y-0.5 transition-all w-fit"
              >
                Показать еще
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ─── ИСТОРИЯ ШКОЛЫ ───
      <section className="py-16 px-6 lg:px-10 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-2">
              Хроника событий
            </p>
            <h2 className="text-3xl lg:text-4xl font-bold">История центра</h2>
          </div>

          <div className="space-y-16">
            {historyItems.map((item, i) => (
              <motion.div
                key={item.year}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className={`grid lg:grid-cols-2 gap-8 items-center ${
                  item.side === "right" ? "lg:[&>*:first-child]:order-2" : ""
                }`}
              >
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-4xl font-bold text-foreground/20">{item.year}</span>
                    <div className="w-px h-8 bg-border" />
                    <h3 className="text-xl font-bold">{item.title}</h3>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">{item.text}</p>
                </div>

                <div className="aspect-[4/3] rounded overflow-hidden border border-border bg-secondary">
                  <ImageWithFallback
                    src={dbCollections[i % dbCollections.length]?.photos[0]?.url || ""} // Use dbCollections here
                    alt={`${item.year} — ${item.title}`}
                    className="w-full h-full object-cover grayscale"
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section> */}

      {/* ─── COLLECTION MODAL ─── */}
      <AnimatePresence>
        {openCollection && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 flex items-start justify-center p-4 pt-16 overflow-y-auto"
            onClick={(e) => e.target === e.currentTarget && setOpenCollection(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="bg-card border border-border rounded-lg shadow-xl w-full max-w-3xl mb-8"
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-border">
                <div>
                  <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider">Коллекция</p>
                  <h2 className="font-bold text-lg">{openCollection.title}</h2>
                  <p className="text-sm text-muted-foreground">{openCollection.description}</p>
                </div>
                <button
                  onClick={() => setOpenCollection(null)}
                  className="p-2 hover:bg-secondary rounded transition-colors"
                  aria-label="Закрыть"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 grid sm:grid-cols-2 gap-4">
                {openCollection.photos.map((photo, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    onClick={() => openLightbox(idx)}
                    className="group relative aspect-square rounded overflow-hidden cursor-pointer border border-border"
                  >
                    <ImageWithFallback
                      src={photo.url}
                      alt={photo.caption}
                      className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200 flex items-end">
                      <p className="text-white text-xs px-3 pb-2 translate-y-full group-hover:translate-y-0 transition-transform duration-200">
                        {photo.caption}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── LIGHTBOX ─── */}
      <AnimatePresence>
        {lightboxIndex !== null && openCollection && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4"
            onClick={closeLightbox}
          >
            <button
              onClick={(e) => { e.stopPropagation(); prevPhoto(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors z-10"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>

            <motion.div
              key={lightboxIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative max-w-4xl max-h-[80vh] w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <ImageWithFallback
                src={openCollection.photos[lightboxIndex].url}
                alt={openCollection.photos[lightboxIndex].caption}
                className="w-full max-h-[75vh] object-contain rounded"
              />
              <div className="mt-3 text-center">
                <p className="text-white/80 text-sm">{openCollection.photos[lightboxIndex].caption}</p>
                <p className="text-white/40 text-xs mt-1">{lightboxIndex + 1} / {openCollection.photos.length}</p>
              </div>
            </motion.div>

            <button
              onClick={(e) => { e.stopPropagation(); nextPhoto(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors z-10"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>

            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 w-9 h-9 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
