import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { MapPin, Phone, Mail, Clock, Send, Search } from "lucide-react";
import { VKIcon, OKIcon } from "../components/SocialIcons";
import { supabase } from "../lib/supabase";

interface Contact {
  id: string;
  name: string;
  position?: string;
  phone: string;
  email?: string;
  image_url?: string;
  reception_days?: number[];
  reception_start?: string;
  reception_end?: string;
  order_num: number;
}

export default function Contacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    const { data, error } = await supabase
      .from("contacts")
      .select("*")
      .order("order_num", { ascending: true });
    
    if (error) {
      console.error("Error fetching contacts:", error);
    } else {
      setContacts(data as Contact[] || []);
    }
    setLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => setSent(false), 5000);
    setForm({ name: "", email: "", subject: "", message: "" });
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (contact.position && contact.position.toLowerCase().includes(searchQuery.toLowerCase())) ||
    contact.phone.includes(searchQuery) ||
    (contact.email && contact.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );


  return (
    <div>
      {/* ─── PAGE HEADER ─── */}
      <section className="py-14 px-6 lg:px-10 border-b border-border" style={{ background: "#F0FAFA" }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-5xl mx-auto"
        >
          <h1 className="text-heading font-bold mb-4" style={{ color: "#1A2B4A" }}>Контакты</h1>
          <p className="max-w-md" style={{ color: "#1ABCB0", opacity: 0.9 }}>
            Свяжитесь с нами любым удобным способом!
          </p>
        </motion.div>
      </section>

      {/* ─── MAP + CONTACT INFO ─── */}
      <section className="py-16 px-6 lg:px-10">
        <div className="max-w-5xl mx-auto grid lg:grid-cols-[1fr_380px] gap-8">
          {/* LEFT – MAP */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex flex-col"
          >
            {/* 2GIS / OpenStreetMap embed */}
            <div className="flex-1 min-h-[320px] lg:min-h-[460px] rounded border border-border overflow-hidden relative bg-secondary">
              <iframe
                src="https://yandex.ru/map-widget/v1/?ll=61.4368%2C55.1644&z=15&l=map&pt=61.4368%2C55.1644%2Cpm2rdl&text=%D0%9E%D0%B1%D1%80%D0%B0%D0%B7%D0%BE%D0%B2%D0%B0%D1%82%D0%B5%D0%BB%D1%8C%D0%BD%D1%8B%D0%B9%20%D1%86%D0%B5%D0%BD%D1%82%D1%80%20%E2%84%955"
                width="100%"
                height="100%"
                frameBorder="0"
                title="Карта: Образовательный центр №5, г. Челябинск"
                style={{ minHeight: "100%", display: "block" }}
                allow="fullscreen"
              />
              {/* Overlay badge */}
              <div className="absolute top-3 left-3 bg-card border border-border rounded px-3 py-1.5 flex items-center gap-2 shadow-sm pointer-events-none">
                <MapPin className="w-4 h-4 text-foreground" />
                <span className="text-ui font-semibold">МАОУ «ОЦ № 5 г. Челябинска»</span>
              </div>
            </div>

            {/* Hours below map */}
            <div className="mt-4 border border-border rounded p-4 bg-card grid sm:grid-cols-3 gap-3 text-body">
              {[
                { day: "Пн–Пт", time: "8:00 – 20:00" },
                { day: "Суббота", time: "Выходной" },
                { day: "Воскресенье", time: "Выходной" },
              ].map((h) => (
                <div key={h.day} className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#1ABCB0" }}>
                    <Clock className="w-3.5 h-3.5" style={{ color: "#ffffff" }} />
                  </div>
                  <div>
                    <p className="font-semibold text-ui">{h.day}</p>
                    <p className="text-muted-foreground text-ui">{h.time}</p>
                  </div>
                </div>
              ))}
            </div>

          </motion.div>

          {/* RIGHT – CONTACT INFO PANEL */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex flex-col gap-5"
          >
            {/* Address card */}
            <div className="border border-border rounded p-5 bg-card">
              <h3 className="font-bold mb-4 text-body uppercase tracking-wider text-muted-foreground">Адрес</h3>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "#1ABCB0" }}>
                  <MapPin className="w-4 h-4" style={{ color: "#ffffff" }} />
                </div>
                <div>
                  <p className="font-semibold">454030, г. Челябинск, ул. Скульптора Головницкого, д. 13</p>
                </div>
              </div>
            </div>

            {/* Email card */}
            <div className="border border-border rounded p-5 bg-card">
              <h3 className="font-bold mb-4 text-body uppercase tracking-wider text-muted-foreground">Электронная почта</h3>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#1ABCB0" }}>
                  <Mail className="w-4 h-4" style={{ color: "#ffffff" }} />
                </div>
                <a href="mailto:oc-5@bk.ru" className="font-semibold text-body hover:underline">
                  oc-5@bk.ru
                </a>
              </div>
            </div>

            {/* Social links */}
            <div className="border border-border rounded p-5 bg-card">
              <h3 className="font-bold mb-4 text-body uppercase tracking-wider text-muted-foreground">Мы в социальных сетях</h3>
              <div className="flex flex-col gap-2">
                <a
                  href="https://vk.com/educational_center_5"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-2.5 rounded text-body hover:opacity-90 transition-opacity"
                  style={{ background: "#4C75A3" }}
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-white/20">
                    <span className="text-white flex items-center"><VKIcon className="w-4 h-4" /></span>
                  </div>
                  <div>
                    <p className="font-medium text-white">ВКонтакте</p>
                    <p className="text-ui" style={{ color: "rgba(255,255,255,0.7)" }}>vk.com/educational_center_5</p>
                  </div>
                </a>
                <a
                  href="https://ok.ru/group/70000001206455"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-2.5 rounded text-body hover:opacity-90 transition-opacity"
                  style={{ background: "#ED812B" }}
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-white/20">
                    <span className="text-white flex items-center"><OKIcon className="w-4 h-4" /></span>
                  </div>
                  <div>
                    <p className="font-medium text-white">Одноклассники</p>
                    <p className="text-ui" style={{ color: "rgba(255,255,255,0.7)" }}>ok.ru/group/70000001206455</p>
                  </div>
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── DEPARTMENT CONTACTS ─── */}
      <section className="py-12 px-6 lg:px-10 border-t border-border bg-secondary" style={{ background: "#F0FAFA" }}>
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h2 className="text-heading font-bold mb-4" style={{ color: "#1A2B4A" }}>Справочник контактов</h2>
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Поиск по имени, должности, телефону..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border border-border rounded-xl bg-card outline-none focus:ring-2 focus:ring-brand-blue-dark/20 transition-all text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors text-lg leading-none"
                >
                  ×
                </button>
              )}
            </div>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue-dark"></div>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredContacts.map((contact, i) => (
                <motion.div
                  key={contact.id}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  className="border border-border bg-card rounded p-5 hover:shadow-sm transition-all relative"
                >
                  {contact.image_url && (
                    <div className="w-32 h-32 rounded-full mx-auto mb-3 overflow-hidden">
                      <img
                        src={contact.image_url}
                        alt={contact.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <h3 className="font-bold mb-1 text-body text-center">{contact.name}</h3>
                  {contact.position && (
                    <p className="text-sm text-muted-foreground text-center mb-3">{contact.position}</p>
                  )}
                  <div className="space-y-2 text-body">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#1ABCB0" }}>
                        <Phone className="w-3 h-3" style={{ color: "#ffffff" }} />
                      </div>
                      <a href={`tel:${contact.phone}`} className="hover:text-foreground transition-colors">{contact.phone}</a>
                    </div>
                    {contact.email && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#1ABCB0" }}>
                          <Mail className="w-3 h-3" style={{ color: "#ffffff" }} />
                        </div>
                        <a href={`mailto:${contact.email}`} className="hover:text-foreground transition-colors">{contact.email}</a>
                      </div>
                    )}
                    {contact.reception_days && contact.reception_days.length > 0 && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#1ABCB0" }}>
                          <Clock className="w-3 h-3" style={{ color: "#ffffff" }} />
                        </div>
                        <span className="text-sm">
                          {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].filter((_, i) => contact.reception_days?.includes(i)).join(", ")} {contact.reception_start && contact.reception_end ? `${contact.reception_start}-${contact.reception_end}` : ""}
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

    </div>
  );
}
