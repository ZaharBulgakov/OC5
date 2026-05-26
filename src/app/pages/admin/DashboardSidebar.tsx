import {
  LayoutDashboard,
  Newspaper,
  Image as ImageIcon,
  FileText,
  Users,
  LogOut,
  Edit3,
  Calendar,
  BookOpen,
  Music,
  Phone
} from "lucide-react";

type TabType = "news" | "gallery" | "documents" | "parents_documents" | "schedule-pdf" | "director" | "home" | "students_books" | "students_activities" | "faqs" | "contacts";

interface DashboardSidebarProps {
  activeTab: TabType;
  onSetActiveTab: (tab: TabType) => void;
  onLogout: () => void;
}

export default function DashboardSidebar({ activeTab, onSetActiveTab, onLogout }: DashboardSidebarProps) {
  return (
    <aside className="w-full lg:w-64 bg-card border-r border-border p-6 flex flex-col">
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="w-8 h-8 bg-brand-blue-dark rounded-lg flex items-center justify-center text-white">
          <LayoutDashboard className="w-5 h-5" />
        </div>
        <span className="font-black text-brand-blue-dark uppercase tracking-wider text-sm">Админ-панель</span>
      </div>

      <nav className="flex-1 space-y-4">
        {/* Главная */}
        <div className="rounded-2xl p-3" style={{ backgroundColor: "rgba(245, 194, 0, 0.1)" }}>
          <h3 className="text-xs font-bold uppercase tracking-wider mb-2 px-2" style={{ color: "#F5C200" }}>Главная</h3>
          <div className="space-y-1">
            {[
              { id: "home", label: "Главная страница", icon: LayoutDashboard },
              { id: "director", label: "Слово директора", icon: Edit3 },
              { id: "news", label: "Новости", icon: Newspaper },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => onSetActiveTab(tab.id as TabType)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all`}
                style={activeTab === tab.id
                  ? { backgroundColor: "#F5C200", color: "#1A2B4A", boxShadow: "0 4px 15px rgba(245, 194, 0, 0.3)" }
                  : { color: "var(--muted-foreground)" }}
                onMouseEnter={e => { if (activeTab !== tab.id) (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(245, 194, 0, 0.15)"; }}
                onMouseLeave={e => { if (activeTab !== tab.id) (e.currentTarget as HTMLElement).style.backgroundColor = ""; }}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* О центре */}
        <div className="rounded-2xl p-3" style={{ backgroundColor: "rgba(123, 47, 190, 0.08)" }}>
          <h3 className="text-xs font-bold uppercase tracking-wider mb-2 px-2" style={{ color: "#7B2FBE" }}>О центре</h3>
          <div className="space-y-1">
            {[
              { id: "gallery", label: "Галерея", icon: ImageIcon },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => onSetActiveTab(tab.id as TabType)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all`}
                style={activeTab === tab.id
                  ? { backgroundColor: "#7B2FBE", color: "white", boxShadow: "0 4px 15px rgba(123, 47, 190, 0.3)" }
                  : { color: "var(--muted-foreground)" }}
                onMouseEnter={e => { if (activeTab !== tab.id) (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(123, 47, 190, 0.12)"; }}
                onMouseLeave={e => { if (activeTab !== tab.id) (e.currentTarget as HTMLElement).style.backgroundColor = ""; }}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Документы */}
        <div className="rounded-2xl p-3" style={{ backgroundColor: "rgba(232, 69, 10, 0.08)" }}>
          <h3 className="text-xs font-bold uppercase tracking-wider mb-2 px-2" style={{ color: "#E8450A" }}>Документы</h3>
          <div className="space-y-1">
            {[
              { id: "documents", label: "Документы", icon: FileText },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => onSetActiveTab(tab.id as TabType)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all`}
                style={activeTab === tab.id
                  ? { backgroundColor: "#E8450A", color: "white", boxShadow: "0 4px 15px rgba(232, 69, 10, 0.3)" }
                  : { color: "var(--muted-foreground)" }}
                onMouseEnter={e => { if (activeTab !== tab.id) (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(232, 69, 10, 0.12)"; }}
                onMouseLeave={e => { if (activeTab !== tab.id) (e.currentTarget as HTMLElement).style.backgroundColor = ""; }}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Школьникам */}
        <div className="rounded-2xl p-3" style={{ backgroundColor: "rgba(45, 111, 212, 0.08)" }}>
          <h3 className="text-xs font-bold uppercase tracking-wider mb-2 px-2" style={{ color: "#2D6FD4" }}>Школьникам</h3>
          <div className="space-y-1">
            {[
              { id: "schedule-pdf", label: "Расписание PDF", icon: Calendar },
              { id: "students_books", label: "Учебники и форма", icon: BookOpen },
              { id: "students_activities", label: "Кружки и секции", icon: Music },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => onSetActiveTab(tab.id as TabType)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all`}
                style={activeTab === tab.id
                  ? { backgroundColor: "#2D6FD4", color: "white", boxShadow: "0 4px 15px rgba(45, 111, 212, 0.3)" }
                  : { color: "var(--muted-foreground)" }}
                onMouseEnter={e => { if (activeTab !== tab.id) (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(45, 111, 212, 0.12)"; }}
                onMouseLeave={e => { if (activeTab !== tab.id) (e.currentTarget as HTMLElement).style.backgroundColor = ""; }}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Родителям */}
        <div className="rounded-2xl p-3" style={{ backgroundColor: "rgba(217, 30, 110, 0.08)" }}>
          <h3 className="text-xs font-bold uppercase tracking-wider mb-2 px-2" style={{ color: "#D91E6E" }}>Родителям</h3>
          <div className="space-y-1">
            {[
              { id: "faqs", label: "Вопросы и ответы", icon: BookOpen },
              { id: "parents_documents", label: "Родителям", icon: Users },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => onSetActiveTab(tab.id as TabType)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all`}
                style={activeTab === tab.id
                  ? { backgroundColor: "#D91E6E", color: "white", boxShadow: "0 4px 15px rgba(217, 30, 110, 0.3)" }
                  : { color: "var(--muted-foreground)" }}
                onMouseEnter={e => { if (activeTab !== tab.id) (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(217, 30, 110, 0.12)"; }}
                onMouseLeave={e => { if (activeTab !== tab.id) (e.currentTarget as HTMLElement).style.backgroundColor = ""; }}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Контакты */}
        <div className="rounded-2xl p-3" style={{ backgroundColor: "rgba(26, 188, 176, 0.08)" }}>
          <h3 className="text-xs font-bold uppercase tracking-wider mb-2 px-2" style={{ color: "#1ABCB0" }}>Контакты</h3>
          <div className="space-y-1">
            {[
              { id: "contacts", label: "Контакты", icon: Phone },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => onSetActiveTab(tab.id as TabType)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all`}
                style={activeTab === tab.id
                  ? { backgroundColor: "#1ABCB0", color: "white", boxShadow: "0 4px 15px rgba(26, 188, 176, 0.3)" }
                  : { color: "var(--muted-foreground)" }}
                onMouseEnter={e => { if (activeTab !== tab.id) (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(26, 188, 176, 0.12)"; }}
                onMouseLeave={e => { if (activeTab !== tab.id) (e.currentTarget as HTMLElement).style.backgroundColor = ""; }}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <button 
        onClick={onLogout}
        className="mt-10 flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-destructive hover:bg-destructive/10 transition-all"
      >
        <LogOut className="w-5 h-5" />
        Выйти
      </button>
    </aside>
  );
}
