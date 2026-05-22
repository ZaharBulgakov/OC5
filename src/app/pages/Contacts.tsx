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
          <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest" style={{ background: "#1ABCB0", color: "#fff" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
            Обратная связь
          </div>
          <h1 className="text-5xl lg:text-6xl font-bold mb-4" style={{ color: "#1A2B4A" }}>Контакты</h1>
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
                <span className="text-xs font-semibold">ОЦ №5, г. Челябинск</span>
              </div>
            </div>

            {/* Hours below map */}
            <div className="mt-4 border border-border rounded p-4 bg-card grid sm:grid-cols-3 gap-3 text-sm">
              {[
                { day: "Пн–Пт", time: "8:00 – 18:00" },
                { day: "Суббота", time: "9:00 – 14:00" },
                { day: "Воскресенье", time: "Выходной" },
              ].map((h) => (
                <div key={h.day} className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-xs">{h.day}</p>
                    <p className="text-muted-foreground text-xs">{h.time}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Route button */}
            <a
              href="https://yandex.ru/maps/56/chelyabinsk/?ll=61.4368%2C55.1644&z=15"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center justify-center gap-2 border border-border rounded px-5 py-2.5 text-sm hover:bg-secondary transition-colors"
            >
              <MapPin className="w-4 h-4" /> Проложить маршрут на Яндекс.Картах
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
              <h3 className="font-bold mb-4 text-sm uppercase tracking-wider text-muted-foreground">Адрес</h3>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">454000, г. Челябинск</p>
                  <p className="text-muted-foreground text-sm">ул. Образовательная, д. 5</p>
                  <p className="text-muted-foreground text-sm">ост. «Школьная площадь»</p>
                  <p className="text-xs text-muted-foreground mt-1">Ближайшее метро: нет / трамвай №1, 3, автобус №47, 92</p>
                </div>
              </div>
            </div>

            {/* Phone card */}
            <div className="border border-border rounded p-5 bg-card">
              <h3 className="font-bold mb-4 text-sm uppercase tracking-wider text-muted-foreground">Телефоны</h3>
              <div className="space-y-2.5">
                {[
                  { label: "Приёмная директора", phone: "+7 (351) 200-00-05" },
                  { label: "Приёмная комиссия", phone: "+7 (351) 200-00-06" },
                  { label: "Дежурный администратор", phone: "+7 (351) 200-00-10" },
                ].map((p) => (
                  <div key={p.phone} className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">{p.label}</p>
                      <a href={`tel:${p.phone.replace(/\s/g, "")}`} className="font-semibold text-sm hover:underline">
                        {p.phone}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Email card */}
            <div className="border border-border rounded p-5 bg-card">
              <h3 className="font-bold mb-4 text-sm uppercase tracking-wider text-muted-foreground">Электронная почта</h3>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <a href="mailto:info@oc5-chel.ru" className="font-semibold text-sm hover:underline">
                  info@oc5-chel.ru
                </a>
              </div>
            </div>

            {/* Social links */}
            <div className="border border-border rounded p-5 bg-card">
              <h3 className="font-bold mb-4 text-sm uppercase tracking-wider text-muted-foreground">Мы в социальных сетях</h3>
              <div className="flex flex-col gap-2">
                <a
                  href="https://vk.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 border border-border px-4 py-2.5 rounded text-sm hover:bg-secondary transition-colors"
                >
                  <VKIcon className="w-4 h-4 flex-shrink-0" />
                  <div>
                    <p className="font-medium">ВКонтакте</p>
                    <p className="text-xs text-muted-foreground">vk.com/oc5_chelyabinsk</p>
                  </div>
                </a>
                <a
                  href="https://ok.ru"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 border border-border px-4 py-2.5 rounded text-sm hover:bg-secondary transition-colors"
                >
                  <OKIcon className="w-4 h-4 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Одноклассники</p>
                    <p className="text-xs text-muted-foreground">ok.ru/group/oc5chelyabinsk</p>
                  </div>
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── DEPARTMENT CONTACTS ─── */}
      <section className="py-12 px-6 lg:px-10 border-t border-border bg-secondary">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-2">
              Структура
            </p>
            <h2 className="text-2xl font-bold">Контакты отделов</h2>
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
                <h3 className="font-bold mb-3 text-sm">{d.name}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                    <a href={`tel:${d.phone}`} className="hover:text-foreground transition-colors">{d.phone}</a>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-3.5 h-3.5 flex-shrink-0" />
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
        <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-12 items-start">
          <div>
            <p className="text-xs font-mono uppercase tracking-[0.2em] mb-2" style={{ color: "#1ABCB0" }}>
              Написать нам
            </p>
            <h2 className="text-3xl font-bold mb-4">Форма обратной связи</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
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
                <div key={item.label} className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground">{item.label}:</span>
                  <a href={`mailto:${item.email}`} className="font-medium hover:underline underline-offset-2">{item.email}</a>
                </div>
              ))}
            </div>
          </div>

          <motion.form
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            onSubmit={handleSubmit}
            className="space-y-4 bg-card border border-border rounded p-6"
          >
            {sent && (
              <div className="bg-foreground text-background text-sm px-4 py-3 rounded text-center">
                ✓ Сообщение отправлено. Мы ответим в течение 24 часов.
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider">Имя *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Иванова Мария Ивановна"
                  className="w-full px-3 py-2.5 border border-border rounded bg-secondary text-sm outline-none focus:ring-1 focus:ring-foreground transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider">Email *</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="ivanova@mail.ru"
                  className="w-full px-3 py-2.5 border border-border rounded bg-secondary text-sm outline-none focus:ring-1 focus:ring-foreground transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider">Тема *</label>
              <select
                required
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="w-full px-3 py-2.5 border border-border rounded bg-secondary text-sm outline-none focus:ring-1 focus:ring-foreground"
              >
                <option value="">Выберите тему...</option>
                <option>Поступление в 1 класс</option>
                <option>Поступление в 5–11 класс</option>
                <option>Вопрос по расписанию</option>
                <option>Вопрос по питанию</option>
                <option>Платные услуги</option>
                <option>Запись к директору</option>
                <option>Общий вопрос</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider">Сообщение *</label>
              <textarea
                required
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                rows={5}
                placeholder="Опишите ваш вопрос или обращение..."
                className="w-full px-3 py-2.5 border border-border rounded bg-secondary text-sm outline-none focus:ring-1 focus:ring-foreground transition-all resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 text-white py-3 rounded hover:opacity-80 transition-opacity text-sm font-semibold"
              style={{ background: "#1ABCB0" }}
            >
              <Send className="w-4 h-4" />
              Отправить сообщение
            </button>
          </motion.form>
        </div>
      </section>
    </div>
  );
}
