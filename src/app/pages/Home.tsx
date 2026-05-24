import { Award, Users, TrendingUp, Calendar, ArrowRight, ChevronRight, X } from "lucide-react";
import { Link } from "react-router";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "../lib/supabase";

const movements = [
  // {
  //   id: 1,
  //   title: "Движение Первых",
  //   tag: "Всероссийское",
  //   icon: Award,
  //   color: "bg-brand-blue-dark",
  //   tagColor: "border-brand-blue-dark/20 text-brand-blue-dark bg-brand-blue-dark/5",
  //   desc: "Мы — участники Российского движения детей и молодёжи. Наши ученики участвуют в волонтёрских акциях, конкурсах и образовательных проектах федерального уровня.",
  // },
  // {
  //   id: 2,
  //   title: "Школьный совет",
  //   tag: "Самоуправление",
  //   icon: Users,
  //   color: "bg-brand-pink",
  //   tagColor: "border-brand-pink/20 text-brand-pink bg-brand-pink/5",
  //   desc: "Органы ученического самоуправления работают в каждой параллели. Совет участвует в организации мероприятий, защищает интересы учеников и развивает лидерские качества.",
  // },
  // {
  //   id: 3,
  //   title: "Академический клуб",
  //   tag: "Достижения",
  //   icon: TrendingUp,
  //   color: "bg-brand-orange",
  //   tagColor: "border-brand-orange/20 text-brand-orange bg-brand-orange/5",
  //   desc: "Объединение победителей олимпиад и научных конкурсов. В 2025 году наши ученики заняли призовые места на 38 всероссийских и региональных соревнованиях.",
  // },
];

interface HeroConfig {
  image_url: string;
  aspect: "16:9" | "9:16";
}

const DEFAULT_HERO: HeroConfig = {
  image_url: "/school.jpg",
  aspect: "16:9",
};

interface DirectorInfo {
  image_url: string;
  quotes: string[];
  name: string;
}

const DEFAULT_DIRECTOR: DirectorInfo = {
  image_url: "Director.jpg",
  quotes: [
    "Мы рады приветствовать вас на официальном сайте нашего центра!",
    "Надеемся на то, что знакомство с нашим образовательным центром будет для вас полезным и интересным!",
    "МАОУ \"Образовательный центр № 5 г. Челябинска\" – это новые достижения, возможности, перспективы для каждого ученика. Мы развиваем способности всех наших детей и считаем важным, чтобы каждый наш ученик почувствовал себя успешным.",
  ],
  name: "Евгений Марченко Геннадьевич",
};

export default function Home() {
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNews, setSelectedNews] = useState<any | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [newsOffset, setNewsOffset] = useState(0);
  const [hasMoreNews, setHasMoreNews] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [director, setDirector] = useState<DirectorInfo>(DEFAULT_DIRECTOR);
  const [hero, setHero] = useState<HeroConfig>(DEFAULT_HERO);
  const NEWS_PER_PAGE = 4;

  useEffect(() => {
    fetchNews(true);
    fetchDirector();
    fetchHero();
  }, []);

  const fetchHero = async () => {
    const { data, error } = await supabase
      .from("site_config")
      .select("*")
      .eq("id", 1)
      .single();
    if (!error && data) {
      setHero({
        image_url: data.hero_image_url || DEFAULT_HERO.image_url,
        aspect: data.hero_aspect === "9:16" ? "9:16" : "16:9",
      });
    }
  };

  const fetchDirector = async () => {
    const { data, error } = await supabase
      .from("director_info")
      .select("*")
      .eq("id", 1)
      .single();
    if (!error && data) {
      setDirector({
        image_url: data.image_url || DEFAULT_DIRECTOR.image_url,
        quotes: Array.isArray(data.quotes) ? data.quotes : DEFAULT_DIRECTOR.quotes,
        name: data.name || DEFAULT_DIRECTOR.name,
      });
    }
  };

  const fetchNews = async (reset = false) => {
    setLoading(true);
    const currentOffset = reset ? 0 : newsOffset;
    const { data, error } = await supabase
      .from("news")
      .select("*")
      .order("created_at", { ascending: false })
      .range(currentOffset, currentOffset + NEWS_PER_PAGE - 1);

    if (error) {
      console.error("Error fetching news:", error);
      setLoading(false);
      return;
    }

    if (data) {
      setNews((prevNews) => (reset ? data : [...prevNews, ...data]));
      setNewsOffset(currentOffset + data.length);
      setHasMoreNews(data.length === NEWS_PER_PAGE);
    }
    setLoading(false);
  };

  const handleShowMoreNews = () => {
    fetchNews();
  };
  return (
    <div>
      {/* ─── HERO ─── */}
      <section className="border-b border-border overflow-hidden relative" style={{ background: "#FFFDF0" }}>
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-1/3 h-full -skew-x-12 translate-x-1/2 pointer-events-none" style={{ background: "#F5C200", opacity: 0.08 }} />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full -translate-x-1/2 translate-y-1/2 pointer-events-none" style={{ background: "#F5C200", opacity: 0.15, filter: "blur(48px)" }} />

        {hero.aspect === "16:9" ? (
          /* ── 16:9 layout: full-width image top / text bottom ── */
          <div className="flex flex-col relative z-10">
            {/* Top – image 16:9 full width */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="w-full overflow-hidden relative group"
            >
              <div className="absolute inset-0 mix-blend-multiply group-hover:opacity-0 transition-opacity duration-500 z-10" style={{ background: "#1A2B4A", opacity: 0.15 }} />
              <img
                src={hero.image_url}
                alt="Образовательный центр №5"
                className="w-full h-auto block transition-all duration-500 scale-105 group-hover:scale-100"
                style={{ aspectRatio: "16/9", objectFit: "cover" }}
              />
              <div className="absolute bottom-6 right-6 flex gap-2 z-20">
                <div className="w-3 h-3 rounded-full" style={{ background: "#F5C200" }} />
                <div className="w-3 h-3 rounded-full" style={{ background: "#E8450A" }} />
                <div className="w-3 h-3 rounded-full" style={{ background: "#1A2B4A" }} />
              </div>
            </motion.div>

            {/* Bottom – text */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.15 }}
              className="flex flex-col justify-center items-center text-center px-8 py-14 border-t border-border"
            >
              <div className="inline-flex items-center gap-2 mb-5 px-4 py-1.5 rounded-full text-ui font-bold uppercase tracking-widest" style={{ background: "#F5C200", color: "#1A2B4A" }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#1A2B4A" }} />
                Официальный сайт
              </div>
              <h1 className="text-heading font-bold leading-[1.05] mb-6" style={{ color: "#1A2B4A" }}>
                МАОУ "Образовательный центр №5 г. Челябинска"
              </h1>
              <p className="mb-8 max-w-xl leading-relaxed" style={{ color: "#1A2B4A", opacity: 0.65 }}>
                Более 1 200 учеников, 87 педагогов, 30+ кружков и секций. Мы создаём условия
                для всестороннего развития каждого ребёнка — от первого класса до выпускного
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link
                  to="/about"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-full transition-all hover:shadow-lg hover:-translate-y-0.5 text-body font-bold uppercase tracking-wider"
                  style={{ background: "#1A2B4A", color: "#F5C200" }}
                >
                  Узнать больше <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/parents"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-full transition-all text-body font-bold uppercase tracking-wider hover:-translate-y-0.5"
                  style={{ border: "2px solid #F5C200", color: "#1A2B4A", background: "transparent" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#F5C200" }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent" }}
                >
                  Подать заявку
                </Link>
              </div>
            </motion.div>
          </div>
        ) : (
          /* ── 9:16 layout: text left / image right ── */
          <div className="grid lg:grid-cols-[1fr_1fr] min-h-[520px] relative z-10">
            {/* Left – text */}
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.55 }}
              className="flex flex-col justify-center items-center text-center px-8 py-14 lg:py-20 border-r border-border"
            >
              <div className="inline-flex items-center gap-2 mb-5 px-4 py-1.5 rounded-full text-ui font-bold uppercase tracking-widest" style={{ background: "#F5C200", color: "#1A2B4A" }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#1A2B4A" }} />
                Официальный сайт
              </div>
              <h1 className="text-heading font-bold leading-[1.05] mb-6" style={{ color: "#1A2B4A" }}>
                МАОУ "Образовательный центр №5 г. Челябинска"
              </h1>
              <p className="mb-8 max-w-sm leading-relaxed" style={{ color: "#1A2B4A", opacity: 0.65 }}>
                Более 1 200 учеников, 87 педагогов, 30+ кружков и секций. Мы создаём условия
                для всестороннего развития каждого ребёнка — от первого класса до выпускного
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link
                  to="/about"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-full transition-all hover:shadow-lg hover:-translate-y-0.5 text-body font-bold uppercase tracking-wider"
                  style={{ background: "#1A2B4A", color: "#F5C200" }}
                >
                  Узнать больше <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/parents"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-full transition-all text-body font-bold uppercase tracking-wider hover:-translate-y-0.5"
                  style={{ border: "2px solid #F5C200", color: "#1A2B4A", background: "transparent" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#F5C200" }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent" }}
                >
                  Подать заявку
                </Link>
              </div>
            </motion.div>

            {/* Right – image 9:16 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="min-h-[320px] lg:min-h-0 overflow-hidden relative group"
            >
              <div className="absolute inset-0 mix-blend-multiply group-hover:opacity-0 transition-opacity duration-500 z-10" style={{ background: "#1A2B4A", opacity: 0.15 }} />
              <img
                src={hero.image_url}
                alt="Образовательный центр №5"
                className="w-full h-full object-cover transition-all duration-500 scale-105 group-hover:scale-100"
              />
              <div className="absolute bottom-6 right-6 flex gap-2 z-20">
                <div className="w-3 h-3 rounded-full" style={{ background: "#F5C200" }} />
                <div className="w-3 h-3 rounded-full" style={{ background: "#E8450A" }} />
                <div className="w-3 h-3 rounded-full" style={{ background: "#1A2B4A" }} />
              </div>
            </motion.div>
          </div>
        )}
      </section>

      {/* ─── DIRECTOR QUOTE ─── */}
      <section className="py-16 px-6 lg:px-10 border-t border-border" style={{ background: "#ffffff" }}>
        <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-10 items-center">
          <div className="rounded overflow-hidden border border-border">
            <img
              src={director.image_url}
              alt="Директор ОЦ №5"
              className="w-full h-auto block"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-heading font-bold mt-3 mb-6" style={{ color: "#1A2B4A" }}>Слово директора</h2>
            <blockquote className="pl-5 space-y-3" style={{ borderLeft: "3px solid #F5C200", color: "#1A2B4A", opacity: 0.75 }}>
              {director.quotes.map((quote, i) => (
                <p key={i}>«{quote}»</p>
              ))}
            </blockquote>
            <p className="mt-5 font-semibold" style={{ color: "#1A2B4A" }}>— {director.name}</p>
          </motion.div>
        </div>
      </section>

      {/* ─── НОВОСТИ ─── */}
      <section className="py-16 px-6 lg:px-10 border-t border-border" style={{ background: "#FFFDF0" }}>
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-10 gap-4">
            <div>
              <h2 className="text-heading font-bold" style={{ color: "#1A2B4A" }}>Новости центра</h2>
            </div>
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                placeholder="Поиск новостей..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 pl-10 border border-border rounded-lg bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-blue-dark"
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {news
              .filter((n) => {
                const query = searchQuery.toLowerCase();
                return (
                  n.title?.toLowerCase().includes(query) ||
                  n.text?.toLowerCase().includes(query) ||
                  n.category?.toLowerCase().includes(query) ||
                  n.date?.toLowerCase().includes(query)
                );
              })
              .map((n, i) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, scale: 0.98 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                onClick={() => setSelectedNews(n)}
                className="group flex flex-col sm:flex-row gap-5 p-4 bg-card border border-border rounded hover:shadow-lg transition-all cursor-pointer"
              >
                <div className="w-full sm:w-40 h-40 shrink-0 overflow-hidden rounded relative">
                  {n.category && (
                    <div className="absolute top-2 left-2 z-10 bg-brand-blue-dark text-white text-ui font-bold uppercase px-2 py-1 rounded shadow-sm">
                      {n.category}
                    </div>
                  )}
                  <ImageWithFallback
                    src={n.preview_image || n.image}
                    alt={n.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="flex flex-col justify-center">
                  <div className="text-ui font-mono text-muted-foreground mb-2 flex items-center gap-2">
                    <Calendar className="w-3 h-3" /> {n.date}
                  </div>
                  <h3 className="text-body font-bold mb-2 group-hover:text-brand-blue-dark transition-colors line-clamp-2 leading-snug">
                    {n.title}
                  </h3>
                  <p className="text-ui text-muted-foreground line-clamp-2 leading-relaxed mb-4">
                    {n.text}
                  </p>
                  <div className="flex items-center gap-1 text-ui font-bold uppercase tracking-wider text-muted-foreground group-hover:text-brand-blue-dark transition-colors">
                    Читать далее <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {news.filter((n) => {
            const query = searchQuery.toLowerCase();
            return (
              n.title?.toLowerCase().includes(query) ||
              n.text?.toLowerCase().includes(query) ||
              n.category?.toLowerCase().includes(query) ||
              n.date?.toLowerCase().includes(query)
            );
          }).length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg">По вашему запросу ничего не найдено</p>
            </div>
          )}

          {hasMoreNews && !loading && searchQuery === "" && (
            <div className="flex justify-center mt-8">
              <button
                onClick={handleShowMoreNews}
                className="px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:shadow-lg hover:-translate-y-0.5 transition-all w-fit"
                style={{ background: "#F5C200", color: "#1A2B4A" }}
              >
                Показать все
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ─── ШКОЛЬНЫЕ ДВИЖЕНИЯ ───
      <section className="py-16 px-6 lg:px-10" >
        <div className="max-w-5xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-heading font-bold" style={{ color: "#1A2B4A" }}>Школьные движения</h2>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {movements.map((m, i) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group border border-border p-6 rounded hover:shadow-xl transition-all duration-300 cursor-pointer bg-card hover:-translate-y-1 relative overflow-hidden"
              >
                <div className={`absolute top-0 right-0 w-24 h-24 ${m.color}/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500`} />
                <div className="flex items-center justify-between mb-5 relative z-10">
                  <div className={`w-12 h-12 ${m.color} text-white rounded-xl flex items-center justify-center group-hover:rotate-6 transition-transform shadow-lg`}>
                    <m.icon className="w-6 h-6" />
                  </div>
                  <span className={`text-ui font-mono uppercase tracking-widest border px-2 py-0.5 rounded ${m.tagColor}`}>
                    {m.tag}
                  </span>
                </div>
                <h3 className="text-body font-bold mb-3 relative z-10">{m.title}</h3>
                <p className="text-body text-muted-foreground mb-6 leading-relaxed relative z-10">{m.desc}</p>
                <div className="flex items-center gap-1 text-ui font-bold text-muted-foreground group-hover:text-foreground transition-colors relative z-10">
                  Подробнее <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            ))}
          </div>

          {hasMoreNews && !loading && (
            <div className="flex justify-center mt-8">
              <button
                onClick={handleShowMoreNews}
                className="px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:shadow-lg hover:-translate-y-0.5 transition-all w-fit"
                style={{ background: "#F5C200", color: "#1A2B4A" }}
              >
                Показать еще
              </button>
            </div>
          )}
        </div>
      </section> */}

      

      {/* ─── NEWS MODAL ─── */}
      <AnimatePresence>
        {selectedNews && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedNews(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              layoutId={`news-${selectedNews.id}`}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-card border border-border rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <button
                onClick={() => setSelectedNews(null)}
                className="absolute top-4 right-4 z-20 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="overflow-y-auto">
                <div className="relative w-full bg-secondary/30">
                  <button
                    onClick={() => setSelectedImage(selectedNews.image)}
                    className="w-full cursor-pointer"
                  >
                    <ImageWithFallback
                      src={selectedNews.image}
                      alt={selectedNews.title}
                      className="w-full h-auto max-h-[500px] object-contain mx-auto block hover:opacity-90 transition-opacity"
                    />
                  </button>
                  {selectedNews.category && (
                    <div className="absolute bottom-6 left-6 bg-brand-blue-dark text-white text-ui font-black uppercase px-4 py-2 rounded-xl shadow-xl">
                      {selectedNews.category}
                    </div>
                  )}
                </div>

                <div className="p-8 sm:p-10">
                  <div className="flex items-center gap-3 text-ui font-mono text-muted-foreground mb-6 bg-secondary/50 w-fit px-3 py-1.5 rounded-full">
                    <Calendar className="w-4 h-4 text-brand-blue-dark" />
                    <span className="font-bold uppercase tracking-widest">{selectedNews.date}</span>
                  </div>
                  
                  <h2 className="text-body font-black text-brand-blue-dark leading-tight mb-8">
                    {selectedNews.title}
                  </h2>
                  
                  <div className="space-y-6">
                    {selectedNews.text?.split('\n').map((paragraph: string, idx: number) => (
                      <p key={idx} className="text-muted-foreground leading-relaxed text-body">
                        {paragraph}
                      </p>
                    ))}
                  </div>

                  {/* Дополнительные фотографии */}
                  {selectedNews.additional_images && selectedNews.additional_images.length > 0 && (
                    <div className="mt-8">
                      <h3 className="text-ui font-bold text-brand-blue-dark mb-4">Дополнительные фотографии</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {selectedNews.additional_images.map((imgUrl: string, idx: number) => (
                          <button
                            key={idx}
                            onClick={() => setSelectedImage(imgUrl)}
                            className="relative rounded-xl overflow-hidden border border-border cursor-pointer hover:opacity-90 transition-opacity"
                          >
                            <ImageWithFallback
                              src={imgUrl}
                              alt={`Дополнительное фото ${idx + 1}`}
                              className="w-full h-auto object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-12 pt-8 border-t border-border flex items-center justify-between">
                    <div className="flex gap-2">
                      <div className="w-2 h-2 bg-brand-yellow rounded-full" />
                      <div className="w-2 h-2 bg-brand-pink rounded-full" />
                      <div className="w-2 h-2 bg-brand-blue-dark rounded-full" />
                    </div>
                    <button
                      onClick={() => setSelectedNews(null)}
                      className="text-ui font-black uppercase tracking-widest text-brand-blue-dark hover:underline"
                    >
                      Закрыть новость
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── IMAGE LIGHTBOX ─── */}
      <AnimatePresence>
        {selectedImage && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedImage(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-full max-h-full flex items-center justify-center"
            >
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 z-20 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-md transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              <img
                src={selectedImage}
                alt="Полный размер"
                className="max-w-full max-h-full object-contain"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      
    </div>
  );
}
