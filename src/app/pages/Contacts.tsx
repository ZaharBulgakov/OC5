import { motion } from "motion/react";
import { useState } from "react";
import { MapPin, Phone, Mail, Clock, Send } from "lucide-react";
import { VKIcon, OKIcon } from "../components/SocialIcons";

const departments = [
  { name: "Приёмная директора", phone: "+7 (351) 200-00-05", email: "director@oc5-chel.ru" },
  { name: "Приёмная комиссия", phone: "+7 (351) 200-00-06", email: "priem@oc5-chel.ru" },
  { name: "Учебная часть", phone: "+7 (351) 200-00-07", email: "uch@oc5-chel.ru" },
  { name: "Педагог-психолог", phone: "+7 (351) 200-00-08", email: "psych@oc5-chel.ru" },
  { name: "Бухгалтерия", phone: "+7 (351) 200-00-09", email: "fin@oc5-chel.ru" },
  { name: "Дежурный администратор", phone: "+7 (351) 200-00-10", email: "admin@oc5-chel.ru" },
];

export default function Contacts() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => setSent(false), 5000);
    setForm({ name: "", email: "", subject: "", message: "" });
  };

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
            Свяжитесь с нами любым удобным способом — мы ответим в течение одного рабочего дня.
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
                <span className="text-ui font-semibold">ОЦ №5, г. Челябинск</span>
              </div>
            </div>

            {/* Hours below map */}
            <div className="mt-4 border border-border rounded p-4 bg-card grid sm:grid-cols-3 gap-3 text-body">
              {[
                { day: "Пн–Пт", time: "8:00 – 18:00" },
                { day: "Суббота", time: "9:00 – 14:00" },
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

            {/* Route button */}
            <a
              href="https://yandex.ru/maps/56/chelyabinsk/?ll=61.4368%2C55.1644&z=15"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center justify-center gap-2 border border-border rounded px-5 py-2.5 text-body hover:bg-secondary transition-colors"
            >
              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#1ABCB0" }}>
                <MapPin className="w-3 h-3" style={{ color: "#ffffff" }} />
              </div> Проложить маршрут на Яндекс.Картах
            </a>
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
                  <p className="font-semibold">454000, г. Челябинск</p>
                  <p className="text-muted-foreground text-body">ул. Образовательная, д. 5</p>
                  <p className="text-muted-foreground text-body">ост. «Школьная площадь»</p>
                  <p className="text-ui text-muted-foreground mt-1">Ближайшее метро: нет / трамвай №1, 3, автобус №47, 92</p>
                </div>
              </div>
            </div>

            {/* Phone card */}
            <div className="border border-border rounded p-5 bg-card">
              <h3 className="font-bold mb-4 text-body uppercase tracking-wider text-muted-foreground">Телефоны</h3>
              <div className="space-y-2.5">
                {[
                  { label: "Приёмная директора", phone: "+7 (351) 200-00-05" },
                  { label: "Приёмная комиссия", phone: "+7 (351) 200-00-06" },
                  { label: "Дежурный администратор", phone: "+7 (351) 200-00-10" },
                ].map((p) => (
                  <div key={p.phone} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#1ABCB0" }}>
                      <Phone className="w-4 h-4" style={{ color: "#ffffff" }} />
                    </div>
                    <div>
                      <p className="text-ui text-muted-foreground">{p.label}</p>
                      <a href={`tel:${p.phone.replace(/\s/g, "")}`} className="font-semibold text-body hover:underline">
                        {p.phone}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Email card */}
            <div className="border border-border rounded p-5 bg-card">
              <h3 className="font-bold mb-4 text-body uppercase tracking-wider text-muted-foreground">Электронная почта</h3>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#1ABCB0" }}>
                  <Mail className="w-4 h-4" style={{ color: "#ffffff" }} />
                </div>
                <a href="mailto:info@oc5-chel.ru" className="font-semibold text-body hover:underline">
                  info@oc5-chel.ru
                </a>
              </div>
            </div>

            {/* Social links */}
            <div className="border border-border rounded p-5 bg-card">
              <h3 className="font-bold mb-4 text-body uppercase tracking-wider text-muted-foreground">Мы в социальных сетях</h3>
              <div className="flex flex-col gap-2">
                <a
                  href="https://vk.com"
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
                    <p className="text-ui" style={{ color: "rgba(255,255,255,0.7)" }}>vk.com/oc5_chelyabinsk</p>
                  </div>
                </a>
                <a
                  href="https://ok.ru"
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
                    <p className="text-ui" style={{ color: "rgba(255,255,255,0.7)" }}>ok.ru/group/oc5chelyabinsk</p>
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
            <h2 className="text-heading font-bold mb-4" style={{ color: "#1A2B4A" }}>Контакты отделов</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {departments.map((d, i) => (
              <motion.div
                key={d.name}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="border border-border bg-card rounded p-5 hover:shadow-sm transition-all"
              >
                <h3 className="font-bold mb-3 text-body">{d.name}</h3>
                <div className="space-y-2 text-body">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#1ABCB0" }}>
                      <Phone className="w-3 h-3" style={{ color: "#ffffff" }} />
                    </div>
                    <a href={`tel:${d.phone}`} className="hover:text-foreground transition-colors">{d.phone}</a>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#1ABCB0" }}>
                      <Mail className="w-3 h-3" style={{ color: "#ffffff" }} />
                    </div>
                    <a href={`mailto:${d.email}`} className="hover:text-foreground transition-colors">{d.email}</a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CONTACT FORM ─── */}
      <section className="py-16 px-6 lg:px-10 border-t border-border">
        <div className="max-w-5xl mx-auto grid lg:grid-cols-1 gap-12 items-start">
          <div>
            <h2 className="text-heading font-bold mb-4" style={{ color: "#1A2B4A" }}>Форма обратной связи</h2>
            <p className="text-muted-foreground text-body leading-relaxed">
              Задайте вопрос, оставьте предложение или запишитесь на приём к директору.
              Мы ответим по электронной почте в течение 24 часов в рабочие дни.
              Для срочных вопросов рекомендуем звонить напрямую в приёмную.
            </p>
            <div className="mt-6 space-y-3">
              {[
                { label: "Вопрос по поступлению", email: "priem@oc5-chel.ru" },
                { label: "Вопрос по учёбе", email: "uch@oc5-chel.ru" },
                { label: "Общий вопрос", email: "info@oc5-chel.ru" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3 text-body">
                  <span className="text-muted-foreground">{item.label}:</span>
                  <a href={`mailto:${item.email}`} className="font-medium hover:underline underline-offset-2">{item.email}</a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
