import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { ChevronDown, Download, Users, ArrowRight, FileText } from "lucide-react";
import { supabase } from "../lib/supabase";

// ─── ENROLLMENT STEPS ───
const steps = [
  {
    num: 1,
    title: "Выбор класса",
    desc: "Определите подходящую программу: 1 класс, 5 класс или профильное направление. Ознакомьтесь с учебным планом.",
    details: ["1 класс: для детей 6–7 лет (по состоянию на 1 сентября)", "5 класс: переход из начальной школы", "Профиль: углублённое изучение предметов (10–11 кл.)"],
  },
  {
    num: 2,
    title: "Сбор документов",
    desc: "Подготовьте полный пакет документов для подачи заявления на поступление.",
    details: ["Свидетельство о рождении (оригинал + копия)", "Документ, удостоверяющий личность родителя/опекуна", "Медицинская карта и прививочный сертификат", "Справка с места жительства (регистрация)"],
  },
  {
    num: 3,
    title: "Подача заявления",
    desc: "Заполните и подайте заявление онлайн через портал Госуслуги или лично в приёмной комиссии.",
    details: ["Онлайн: через портал Госуслуги (gosuslugi.ru)", "Лично: каб. 101, пн–пт 9:00–16:00", "Срок подачи заявлений: до 15 июня 2026 г.", "Для учащихся по прописке: приоритетный приём"],
  },
  {
    num: 4,
    title: "Зачисление",
    desc: "Пройдите вводное собеседование с администрацией и получите уведомление о зачислении.",
    details: ["Тестирование (1 кл.): определение готовности к школе", "Собеседование: с директором или завучем", "Уведомление о зачислении: в течение 2 рабочих недель", "Приказ о зачислении: до 31 августа"],
  },
];

// ─── FAQ ───
const faqs = [
  {
    q: "Каков режим работы школы?",
    a: "Образовательный центр №5 работает по следующему расписанию: понедельник–пятница с 8:00 до 18:00, суббота с 9:00 до 14:00. Уроки начинаются в 8:00 и заканчиваются не позднее 16:00. Группа продлённого дня (ГПД) работает до 18:00 на платной основе. В праздничные дни учреждение не работает согласно производственному календарю РФ."
  },
  {
    q: "Какова наполняемость классов?",
    a: "Согласно лицензии и санитарным нормам: в стандартных классах (1–9) наполняемость составляет не более 25 учеников, в профильных классах (10–11) — не более 20. Среднее соотношение ученик/учитель в нашем центре — 16:1, что обеспечивает высокое качество индивидуального взаимодействия. В 2025–2026 учебном году функционируют 48 классов-комплектов."
  },
  {
    q: "Предусмотрено ли питание в школе?",
    a: "Да, в школе работает собственная столовая с горячим питанием. Предусмотрен завтрак (7:45–8:00) и обед (11:40–13:10, по очереди для разных ступеней). Меню составляется школьным диетологом с учётом норм СанПиН и утверждается Роспотребнадзором. Возможны диетические и аллергические варианты питания по медицинским показаниям — необходима справка от педиатра. Стоимость питания: завтрак — около 65 ₽, обед — около 120 ₽."
  },
  {
    q: "Какие внеурочные занятия предлагаются?",
    a: "Образовательный центр предлагает более 30 бесплатных кружков и секций: спортивные (баскетбол, волейбол, лёгкая атлетика, настольный теннис), творческие (театральная студия, хор, изостудия, танцевальный ансамбль), научно-технические (робототехника, IT-клуб, олимпиадная математика, юный химик), общественные (Движение Первых, школьный совет, волонтёрский отряд). Расписание публикуется на сайте и в электронном журнале."
  },
  {
    q: "Есть ли школьный автобус?",
    a: "Да, для учащихся из отдалённых районов города функционируют несколько маршрутов школьного автобуса: маршрут №1 (Северо-запад — ул. Молодогвардейцев — школа), маршрут №2 (ЧМЗ — ул. Российская — школа), маршрут №3 (Ленинский район — школа). Отправление от школы: 13:15 и 16:10. Актуальное расписание и остановки опубликованы в разделе «Документы». Услуга бесплатная для всех учащихся."
  },
  {
    q: "Как связаться с классным руководителем?",
    a: "Существует несколько способов связи: через электронный журнал (раздел «Сообщения») — ответ в течение 24 часов в рабочие дни; по электронной почте — адреса указаны в профилях педагогов на сайте; лично во время приёмных часов — каждый вторник и четверг с 16:00 до 17:30 (уточняйте у конкретного учителя); через телефон учебной части: +7 (351) 200-00-07. Экстренная связь — через дежурного администратора: +7 (351) 200-00-10."
  },
  {
    q: "Как записаться в первый класс на 2026–2027 год?",
    a: "Приём заявлений на 2026–2027 учебный год начинается 1 апреля 2026 года. Для детей, проживающих на закреплённой территории, приём осуществляется с 1 апреля по 30 июня. Для иных — с 6 июля до заполнения свободных мест. Подать заявление можно через портал Госуслуги, через МФЦ или лично в канцелярии школы (каб. 101). Возраст ребёнка на 1 сентября 2026 г. — от 6 лет 6 месяцев до 7 лет 11 месяцев."
  },
  {
    q: "Предусмотр��на ли психологическая поддержка?",
    a: "Да, в штате образовательного центра работает педагог-психолог. Режим приёма: понедельник–пятница, 9:00–17:00, каб. 215. Консультации проводятся для учащихся, родителей и педагогов. Обращение строго конфиденциально. Психолог также ведёт групповые занятия по профилактике стресса, развитию эмоционального интеллекта и командной работы. Телефон: +7 (351) 200-00-08."
  },
];

// ─── DOWNLOADS ───

export default function Parents() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [downloads, setDownloads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchParentsDocuments = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('parents_documents')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setDownloads(data);
      }
      setLoading(false);
    };
    fetchParentsDocuments();
  }, []);

  const handleDownload = async (doc: any) => {
    if (!doc.url) {
      const content = `Документ: ${doc.title}\nТип: ${doc.type}\nРазмер: ${doc.size}\n\nОбразовательный центр №5, г. Челябинск\n454000, ул. Образовательная, д. 5\n\n[Это демонстрационный файл прототипа]`;
      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${doc.title}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return;
    }

    try {
      const response = await fetch(doc.url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${doc.title}.${doc.type.toLowerCase()}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
      window.open(doc.url, '_blank');
    }
  };

  return (
    <div>
      {/* ─── PAGE HEADER ─── */}
      <section className="py-14 px-6 lg:px-10 border-b border-border bg-secondary">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-5xl mx-auto"
        >
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-3">
            Для семьи
          </p>
          <h1 className="text-5xl lg:text-6xl font-bold mb-4">Родителям</h1>
          <p className="text-muted-foreground max-w-xl">
            Всё необходимое для родителей и законных представителей учащихся: порядок поступления,
            часто задаваемые вопросы, документы и контакты.
          </p>
        </motion.div>
      </section>

      {/* ─── АЛГОРИТМ ПОСТУПЛЕНИЯ ─── */}
      <section className="py-16 px-6 lg:px-10">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-2">
              Как поступить
            </p>
            <h2 className="text-3xl lg:text-4xl font-bold">Алгоритм поступления</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-0 relative">
            {steps.map((step, i) => (
              <div key={step.num} className="relative flex md:flex-col items-start md:items-center gap-4 md:gap-0">
                {i < steps.length - 1 && (
                  <div className="hidden md:flex absolute top-7 left-[calc(50%+2.5rem)] right-0 items-center z-10">
                    <div className="flex-1 h-px bg-border" />
                    <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0 -ml-1" />
                  </div>
                )}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.12 }}
                  className="flex-1 md:flex md:flex-col md:items-center md:text-center w-full"
                >
                  <div className="w-14 h-14 bg-foreground text-background rounded-full flex items-center justify-center text-xl font-bold mb-4 flex-shrink-0 mx-auto">
                    {step.num}
                  </div>
                  <div className="border border-border bg-card rounded p-5 w-full md:mx-2">
                    <h3 className="font-bold mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{step.desc}</p>
                    <ul className="space-y-1.5">
                      {step.details.map((d, di) => (
                        <li key={di} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <span className="w-3 h-3 border border-border rounded flex-shrink-0 mt-0.5" />
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <a
              href="https://gosuslugi.ru"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-foreground text-background px-6 py-3 rounded hover:opacity-80 transition-opacity text-sm"
            >
              Подать заявление через Госуслуги <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* ─── РОДИТЕЛЬСКИЙ КОМИТЕТ ─── */}
      <section className="py-12 px-6 lg:px-10 border-t border-border bg-secondary">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="border border-border bg-card rounded p-8 md:p-10 flex flex-col md:flex-row gap-8 items-start md:items-center"
          >
            <div className="w-16 h-16 bg-foreground text-background rounded flex items-center justify-center flex-shrink-0">
              <Users className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">Родительский комитет</h2>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-xl mb-5">
                Родительский комитет ОЦ №5 — выборный орган, представляющий интересы семей учащихся.
                Заседания проводятся ежемесячно. Комитет участвует в обсуждении учебных планов, организации
                мероприятий и решении текущих вопросов жизни школы. К участию приглашаются все желающие.
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="mailto:committee@oc5-chel.ru"
                  className="inline-flex items-center gap-2 bg-foreground text-background px-5 py-2.5 rounded text-sm hover:opacity-80 transition-opacity"
                >
                  Вступить в комитет
                </a>
                <button className="inline-flex items-center gap-2 border border-border px-5 py-2.5 rounded text-sm hover:bg-secondary transition-colors">
                  Расписание заседаний
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── FAQ АККОРДЕОН ─── */}
      <section className="py-16 px-6 lg:px-10 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-2">
              Вопросы и ответы
            </p>
            <h2 className="text-3xl lg:text-4xl font-bold">Часто задаваемые вопросы</h2>
          </div>

          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="border border-border rounded overflow-hidden bg-card"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-secondary transition-colors"
                >
                  <span className="font-semibold text-sm pr-4">{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform duration-200 ${
                      openFaq === i ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <div
                  className="overflow-hidden transition-all duration-300"
                  style={{ maxHeight: openFaq === i ? "600px" : "0", opacity: openFaq === i ? 1 : 0 }}
                >
                  <div className="px-6 pb-5 pt-1 text-sm text-muted-foreground leading-relaxed border-t border-border">
                    {faq.a}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 p-5 bg-secondary border border-border rounded">
            <p className="text-sm text-muted-foreground">
              Не нашли ответа на свой вопрос?{" "}
              <a href="mailto:info@oc5-chel.ru" className="text-foreground underline underline-offset-2 hover:no-underline">
                Напишите нам
              </a>{" "}
              или позвоните по тел.{" "}
              <a href="tel:+73512000005" className="text-foreground underline underline-offset-2 hover:no-underline">
                +7 (351) 200-00-05
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* ─── ДОКУМЕНТЫ ДЛЯ СКАЧИВАНИЯ ─── */}
      <section className="py-16 px-6 lg:px-10 border-t border-border bg-secondary">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-2">
              Полезные материалы
            </p>
            <h2 className="text-3xl lg:text-4xl font-bold">Документы для родителей</h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {loading ? (
              <div className="col-span-full flex justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue-dark"></div>
              </div>
            ) : downloads.length > 0 ? (
              downloads.map((doc, i) => (
                <motion.div
                  key={doc.id || doc.title}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  className="group flex items-center gap-4 px-5 py-4 bg-card border border-border rounded hover:border-foreground/30 hover:shadow-sm transition-all duration-150"
                >
                  <div className="w-9 h-9 bg-secondary border border-border rounded flex items-center justify-center flex-shrink-0 group-hover:bg-foreground transition-colors duration-150">
                    <FileText className="w-4 h-4 group-hover:text-background transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{doc.title}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                      <span className="border border-border px-1.5 py-0.5 rounded font-mono">{doc.type}</span>
                      <span>{doc.size}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownload(doc)}
                    aria-label={`Скачать: ${doc.title}`}
                    className="p-2 hover:bg-secondary rounded transition-colors flex-shrink-0"
                  >
                    <Download className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
                  </button>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full text-center py-10 text-muted-foreground">
                Документы пока не загружены.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
