import { Outlet, Link, useLocation } from "react-router";
import { useState, useEffect } from "react";
import {
  Menu, X, Eye,
  Home, Info, FileText, GraduationCap, Users, Phone,
  Mail, MapPin, HelpCircle
} from "lucide-react";
import { VKIcon, OKIcon } from "./SocialIcons";
import { motion, AnimatePresence } from "motion/react";
import ChatBot from "./ChatBot";
import logoImg from "./logo.png";


const navItems = [
  { name: "Главная", path: "/", icon: Home, color: "bg-brand-blue-dark", text: "text-brand-blue-dark", activeStyle: { background: "#F5C200", color: "#1A2B4A" } },
  { name: "О центре", path: "/about", icon: Info, color: "bg-brand-pink", text: "text-brand-pink", activeStyle: null },
  { name: "Документы", path: "/documents", icon: FileText, color: "bg-brand-purple", text: "text-brand-purple", activeStyle: null },
  { name: "Школьникам", path: "/students", icon: GraduationCap, color: "bg-brand-blue-med", text: "text-brand-blue-med", activeStyle: null },
  { name: "Родителям", path: "/parents", icon: Users, color: "bg-brand-orange", text: "text-brand-orange", activeStyle: null },
  { name: "Контакты", path: "/contacts", icon: Phone, color: "bg-brand-maroon", text: "text-brand-maroon", activeStyle: null },
];

interface AuthUser {
  name: string;
  initials: string;
  provider: "vk" | "ok";
}

type ColorScheme = "white" | "black" | "blue";

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [supportModal, setSupportModal] = useState(false);
  const [visionPanel, setVisionPanel] = useState(false);
  const [fontSize, setFontSize] = useState(100);
  const [colorScheme, setColorScheme] = useState<ColorScheme>("white");
  const location = useLocation();

  // Apply vision settings — font size goes on <body>, not <html>, to avoid breaking rem
  useEffect(() => {
    const html = document.documentElement;
    document.body.style.fontSize = fontSize === 100 ? "" : `${fontSize}%`;
    html.classList.remove("vi-white", "vi-black", "vi-blue");
    if (colorScheme !== "white") html.classList.add(`vi-${colorScheme}`);
  }, [fontSize, colorScheme]);

  const resetVision = () => {
    setFontSize(100);
    setColorScheme("white");
    document.body.style.fontSize = "";
    document.documentElement.classList.remove("vi-white", "vi-black", "vi-blue");
  };

  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <style>{`
        html.vi-black { filter: invert(1) hue-rotate(180deg); }
        html.vi-blue  { background: #00005c !important; filter: sepia(1) saturate(3) hue-rotate(180deg); }
        @keyframes gradientMove {
          0%   { transform: translateX(-50%); }
          100% { transform: translateX(0%); }
        }
        .accent-line {
          overflow: hidden;
        }
        .accent-line::before {
          content: '';
          display: block;
          width: 200%;
          height: 100%;
          background: linear-gradient(90deg, #F5C200, #E8450A, #D91E6E, #7B2FBE, #2D6FD4, #1ABCB0, #F5C200, #E8450A, #D91E6E, #7B2FBE, #2D6FD4, #1ABCB0, #F5C200);
          animation: gradientMove 3s linear infinite;
        }
      `}</style>

      {/* Accent line — above header, shifts together with it */}
      <div className={`accent-line fixed left-0 right-0 h-1 z-50 transition-all duration-300 ${visionPanel ? "top-10" : "top-0"}`} />
      {/* ─── VISION PANEL (above header) ─── */}
      <AnimatePresence>
        {visionPanel && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            className="fixed top-0 left-0 right-0 z-[60] bg-gray-100 border-b border-border shadow-md px-4 py-2 flex items-center"
          >
            {/* Centered controls */}
            <div className="flex-1 flex items-center justify-center gap-4 flex-wrap">
              {/* Font size */}
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-600 font-medium">Размер шрифта:</span>
                <button onClick={() => setFontSize(f => Math.max(80, f - 10))} className="w-7 h-7 rounded border border-gray-400 bg-white flex items-center justify-center hover:bg-gray-200 font-bold text-base">−</button>
                <span className="w-10 text-center font-bold text-sm">{fontSize}%</span>
                <button onClick={() => setFontSize(f => Math.min(150, f + 10))} className="w-7 h-7 rounded border border-gray-400 bg-white flex items-center justify-center hover:bg-gray-200 font-bold text-base">+</button>
              </div>

              <div className="h-5 w-px bg-gray-300" />

              {/* Color scheme */}
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-600 font-medium">Цвет:</span>
                {([
                  { key: "white", label: "Белый",  bg: "bg-white",    border: "border-gray-400" },
                  { key: "black", label: "Чёрный", bg: "bg-black",    border: "border-gray-600" },
                  { key: "blue",  label: "Синий",  bg: "bg-blue-900", border: "border-blue-700" },
                ] as const).map(({ key, label, bg, border }) => (
                  <button
                    key={key}
                    onClick={() => setColorScheme(key)}
                    title={label}
                    className={`w-7 h-7 rounded border-2 ${bg} ${colorScheme === key ? "border-red-500 ring-2 ring-red-300" : border} transition-all`}
                  />
                ))}
              </div>

              <div className="h-5 w-px bg-gray-300" />

              {/* Reset */}
              <button onClick={resetVision} className="text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-gray-800 transition-colors border border-gray-300 rounded-full px-3 py-1 bg-white hover:bg-gray-200">
                Сбросить
              </button>
            </div>

            {/* Close — stays on the right */}
            <button onClick={() => setVisionPanel(false)} className="p-1 hover:bg-gray-200 rounded flex-shrink-0">
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── HEADER ─── */}
      <header className={`fixed left-0 right-0 z-50 h-16 bg-card border-b border-border flex items-center px-4 gap-3 transition-all duration-300 ${visionPanel ? "top-10" : "top-0"}`}>
        {/* Colorful accent line — animated, sits on top of header */}
        <div className={`accent-line absolute left-0 right-0 h-1 top-0`} />
        
        {/* Mobile hamburger */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden p-2 hover:bg-secondary rounded transition-colors"
          aria-label="Toggle menu"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Logo + school name */}
        <Link to="/" className="flex items-center gap-3 group flex-shrink-0">
          <div className="w-12 h-12 flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
            <img 
              src={logoImg} 
              alt="ОЦ5 Логотип" 
              className="w-full h-full object-contain"
            />
          </div>
          <div className="hidden sm:block">
            <p className="leading-tight font-black text-sm tracking-tight text-brand-blue-dark max-w-[220px]">
              МАОУ "Образовательный центр № 5 г. Челябинска"
            </p>
          </div>
        </Link>

        <div className="flex-1" />

        {/* Actions */}
        <div className="flex items-center gap-1">
          {/* Vision button */}
          <button
            onClick={() => setVisionPanel(!visionPanel)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold uppercase tracking-wider border rounded-full transition-all ${visionPanel ? "bg-brand-blue-dark text-white border-brand-blue-dark" : "bg-brand-blue-dark/5 text-brand-blue-dark border-brand-blue-dark/20 hover:bg-brand-blue-dark hover:text-white"}`}
            title="Версия для слабовидящих"
          >
            <Eye className="w-4 h-4" />
            <span className="hidden md:inline">Для слабовидящих</span>
          </button>

          {/* Support button */}
          <button
            onClick={() => setSupportModal(true)}
            className="hidden sm:flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider bg-brand-blue-dark/5 text-brand-blue-dark border border-brand-blue-dark/20 rounded-full hover:bg-brand-blue-dark hover:text-white transition-all"
            title="Поддержка"
          >
            <HelpCircle className="w-4 h-4" />
            <span className="hidden md:inline">Поддержка</span>
          </button>
        </div>
      </header>

      {/* ─── BODY BELOW HEADER ─── */}
      <div className={`flex flex-1 transition-all duration-300 ${visionPanel ? "pt-26" : "pt-16"}`}>
        {/* Overlay (mobile) */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ─── SIDEBAR ─── */}
        <aside
          className={`
            fixed left-0 bottom-0 w-64 z-40 flex flex-col
            bg-sidebar border-r border-sidebar-border overflow-y-auto
            transform transition-all duration-300 ease-in-out
            lg:translate-x-0
            ${visionPanel ? "top-26" : "top-16"}
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          `}
        >
          {/* Nav links */}
          <nav className="flex-1 p-4 space-y-0.5">
            {navItems.map((item) => {
              const isActive =
                item.path === "/"
                  ? location.pathname === "/"
                  : location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  style={isActive && item.activeStyle ? item.activeStyle : {}}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded transition-all duration-200
                    ${isActive
                      ? item.activeStyle ? "shadow-md scale-[1.02]" : `${item.color} text-white shadow-md scale-[1.02]`
                      : "text-foreground hover:bg-sidebar-accent"
                    }
                  `}
                >
                  <item.icon className={`w-4 h-4 flex-shrink-0`} style={isActive && item.activeStyle ? { color: "#1A2B4A" } : isActive ? { color: "white" } : {}} />
                  <span className="text-sm font-medium" style={isActive && item.activeStyle ? { color: "#1A2B4A" } : isActive ? { color: "white" } : {}}>{item.name}</span>
                  {isActive && (
                    <motion.span
                      layoutId="active-nav"
                      className="ml-auto w-1.5 h-1.5 rounded-full"
                      style={item.activeStyle ? { background: "#1A2B4A" } : { background: "white" }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Sidebar bottom info */}
          <div className="p-4 border-t border-sidebar-border text-xs text-muted-foreground space-y-1">
            <p className="font-semibold text-foreground text-xs">Режим работы:</p>
            <p>Пн–Пт: 8:00 – 18:00</p>
            <p>Сб: 9:00 – 14:00</p>
            <p className="pt-2 text-[10px] uppercase tracking-wider text-muted-foreground">
              Версия 2.1.0 · 2026
            </p>
          </div>
        </aside>

        {/* ─── MAIN CONTENT ─── */}
        <div className="flex-1 lg:ml-64 flex flex-col min-h-[calc(100vh-4rem)]">
          <main className="flex-1">
            <Outlet />
          </main>

          {/* ─── FOOTER ─── */}
          <footer className="bg-brand-blue-dark text-white relative overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-pink/10 rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-purple/10 rounded-full -translate-x-1/2 translate-y-1/2 blur-3xl" />
            
            <div className="max-w-6xl mx-auto px-6 py-16 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
                {/* Col 1 – Contacts */}
                <div>
                  <h3 className="text-white font-black mb-6 pb-2 border-b-2 border-brand-pink/30 text-xs uppercase tracking-[0.2em]">
                    Контакты
                  </h3>
                  <ul className="space-y-4 text-sm text-white/80">
                    <li className="flex items-start gap-3 group">
                      <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center group-hover:bg-brand-pink transition-colors">
                        <MapPin className="w-4 h-4 text-white" />
                      </div>
                      <span className="pt-1 leading-relaxed">454000, г. Челябинск, ул. Образовательная, д. 5</span>
                    </li>
                    <li className="flex items-center gap-3 group">
                      <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center group-hover:bg-brand-orange transition-colors">
                        <Phone className="w-4 h-4 text-white" />
                      </div>
                      <a href="tel:+73512000005" className="hover:text-white transition-colors">+7 (351) 200-00-05</a>
                    </li>
                    <li className="flex items-center gap-3 group">
                      <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center group-hover:bg-brand-blue-med transition-colors">
                        <Mail className="w-4 h-4 text-white" />
                      </div>
                      <a href="mailto:info@oc5-chel.ru" className="hover:text-white transition-colors">info@oc5-chel.ru</a>
                    </li>
                  </ul>
                </div>

                {/* Col 2 – Navigation */}
                <div>
                  <h3 className="text-white font-black mb-6 pb-2 border-b-2 border-brand-yellow/30 text-xs uppercase tracking-[0.2em]">
                    Навигация
                  </h3>
                  <ul className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm text-white/80">
                    {navItems.map((item) => (
                      <li key={item.path}>
                        <Link to={item.path} className="hover:text-white transition-colors flex items-center gap-2 group">
                          <span className={`w-1.5 h-1.5 rounded-full ${item.color} group-hover:scale-150 transition-transform`} />
                          {item.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Col 3 – Socials + info */}
                <div>
                  <h3 className="text-white font-black mb-6 pb-2 border-b-2 border-brand-purple/30 text-xs uppercase tracking-[0.2em]">
                    Мы в сети
                  </h3>
                  <div className="flex flex-wrap gap-3 mb-8">
                    <a
                      href="https://vk.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-[#4C75A3] px-5 py-2.5 rounded-full hover:scale-105 transition-all text-xs font-bold shadow-lg"
                    >
                      <VKIcon className="w-4 h-4" />
                      <span>ВКонтакте</span>
                    </a>
                    <a
                      href="https://ok.ru"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-[#ED812B] px-5 py-2.5 rounded-full hover:scale-105 transition-all text-xs font-bold shadow-lg"
                    >
                      <OKIcon className="w-4 h-4" />
                      <span>Одноклассники</span>
                    </a>
                  </div>
                  <ul className="space-y-3 text-[11px] text-white/50 font-bold uppercase tracking-wider">
                    <li><Link to="/documents" className="hover:text-white transition-colors">Устав учреждения</Link></li>
                    <li><Link to="/documents" className="hover:text-white transition-colors">Политика конфиденциальности</Link></li>
                  </ul>
                </div>
              </div>

              {/* Copyright */}
              <div className="border-t border-white/10 pt-10 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] uppercase tracking-[0.2em] text-white/40 text-center sm:text-left font-bold">
                <p>© 2026 Образовательный центр №5, г. Челябинск. Все права защищены.</p>
                <div className="flex gap-4">
                  <div className="w-2 h-2 bg-brand-yellow rounded-full" />
                  <div className="w-2 h-2 bg-brand-pink rounded-full" />
                  <div className="w-2 h-2 bg-brand-purple rounded-full" />
                  <div className="w-2 h-2 bg-brand-blue-med rounded-full" />
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>

      {/* ─── CHAT BOT ─── */}
      <ChatBot />

      {/* ─── SUPPORT MODAL ─── */}
      <AnimatePresence>
        {supportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setSupportModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="bg-card border border-border rounded-lg shadow-xl w-full max-w-sm p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Поддержка</h2>
                <button onClick={() => setSupportModal(false)} className="p-1 hover:bg-secondary rounded">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="border border-border rounded p-4 bg-secondary">
                  <p className="text-xs text-muted-foreground mb-1">Техническая поддержка сайта</p>
                  <a href="mailto:it@oc5-chel.ru" className="font-semibold text-sm hover:underline">it@oc5-chel.ru</a>
                </div>
                <div className="border border-border rounded p-4 bg-secondary">
                  <p className="text-xs text-muted-foreground mb-1">Вопросы по обучению</p>
                  <a href="tel:+73512000007" className="font-semibold text-sm hover:underline">+7 (351) 200-00-07</a>
                  <p className="text-xs text-muted-foreground mt-0.5">Пн–Пт, 9:00–16:00</p>
                </div>
                <div className="border border-border rounded p-4 bg-secondary">
                  <p className="text-xs text-muted-foreground mb-1">Психологическая поддержка</p>
                  <a href="tel:+73512000008" className="font-semibold text-sm hover:underline">+7 (351) 200-00-08</a>
                  <p className="text-xs text-muted-foreground mt-0.5">Анонимно и бесплатно</p>
                </div>
              </div>
              <Link
                to="/contacts"
                onClick={() => setSupportModal(false)}
                className="mt-5 w-full flex items-center justify-center gap-2 border border-border rounded px-5 py-2.5 text-sm hover:bg-secondary transition-colors"
              >
                Все контакты
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
