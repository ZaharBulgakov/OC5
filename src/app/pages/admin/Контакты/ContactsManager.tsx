import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Phone, Edit3, Trash2, X, Upload } from "lucide-react";
import { supabase } from "../../../lib/supabase";

export interface Contact {
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

export default function ContactsManager({ searchQuery }: { searchQuery: string }) {
  const [contactsData, setContactsData] = useState<Contact[]>([]);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactSaving, setContactSaving] = useState(false);
  const [contactForm, setContactForm] = useState({ name: "", position: "", phone: "", email: "", image_url: "", reception_days: [] as number[], reception_start: "", reception_end: "" });
  const [contactUploadFile, setContactUploadFile] = useState<File | null>(null);
  const [contactImagePreview, setContactImagePreview] = useState<string | null>(null);

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
      setContactsData(data as Contact[] || []);
    }
  };

  const filteredContactsData = useMemo(() => {
    if (!searchQuery) return contactsData;
    return contactsData.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.position && item.position.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.phone.includes(searchQuery) ||
      (item.email && item.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [contactsData, searchQuery]);

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact);
    setContactForm({
      name: contact.name,
      position: contact.position || "",
      phone: contact.phone,
      email: contact.email || "",
      image_url: contact.image_url || "",
      reception_days: contact.reception_days || [],
      reception_start: contact.reception_start || "",
      reception_end: contact.reception_end || ""
    });
    setContactImagePreview(contact.image_url || null);
    setContactUploadFile(null);
    setContactModalOpen(true);
  };

  const handleAddContact = () => {
    setEditingContact(null);
    setContactForm({ name: "", position: "", phone: "", email: "", image_url: "", reception_days: [], reception_start: "", reception_end: "" });
    setContactImagePreview(null);
    setContactUploadFile(null);
    setContactModalOpen(true);
  };

  const handleDeleteContact = async (id: string) => {
    if (!confirm("Вы уверены, что хотите удалить этот контакт?")) return;
    
    const { error } = await supabase.from("contacts").delete().eq("id", id);
    if (!error) {
      setContactsData((prev) => prev.filter((c) => c.id !== id));
    }
  };

  const handleContactImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setContactUploadFile(file);
      setContactImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactSaving(true);

    try {
      let imageUrl = contactForm.image_url;

      if (contactUploadFile) {
        const timestamp = Date.now();
        const sanitizedFileName = `contact-${timestamp}-${contactUploadFile.name.replace(/[^a-zA-Z0-9.]/g, "-").toLowerCase()}`;
        
        const { data: storageData, error: storageError } = await supabase.storage
          .from("contacts")
          .upload(`public/${sanitizedFileName}`, contactUploadFile, { cacheControl: '3600', upsert: false });

        if (storageError) throw storageError;

        const { data: publicUrlData } = supabase.storage.from("contacts").getPublicUrl(storageData.path);
        imageUrl = publicUrlData.publicUrl;
      }

      const contactData = {
        name: contactForm.name,
        position: contactForm.position || null,
        phone: contactForm.phone,
        email: contactForm.email || null,
        image_url: imageUrl || null,
        reception_days: contactForm.reception_days.length > 0 ? contactForm.reception_days : null,
        reception_start: contactForm.reception_start || null,
        reception_end: contactForm.reception_end || null,
        order_num: editingContact ? editingContact.order_num : contactsData.length + 1
      };

      if (editingContact) {
        const { data, error } = await supabase
          .from("contacts")
          .update(contactData)
          .eq("id", editingContact.id)
          .select();

        if (error) throw error;
        setContactsData((prev) => prev.map((c) => c.id === editingContact.id ? data[0] as Contact : c));
      } else {
        const { data, error } = await supabase
          .from("contacts")
          .insert([contactData])
          .select();

        if (error) throw error;
        setContactsData((prev) => [...prev, data[0] as Contact]);
      }

      setContactModalOpen(false);
      setEditingContact(null);
      setContactForm({ name: "", position: "", phone: "", email: "", image_url: "", reception_days: [], reception_start: "", reception_end: "" });
      setContactUploadFile(null);
      setContactImagePreview(null);
    } catch (error: any) {
      console.error("Error saving contact:", error);
      alert("Ошибка при сохранении контакта: " + error.message);
    } finally {
      setContactSaving(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="bg-card border border-border rounded-2xl p-6 flex items-center justify-between">
          <div>
            <h2 className="font-black text-brand-blue-dark text-lg">Справочник контактов</h2>
            <p className="text-xs text-muted-foreground mt-1">Управляйте контактами для страницы «Контакты»</p>
          </div>
          <button
            onClick={handleAddContact}
            className="bg-brand-blue-dark text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:shadow-lg hover:-translate-y-0.5 transition-all"
          >
            <Phone className="w-5 h-5" />
            Добавить контакт
          </button>
        </div>

        <div className="grid gap-4">
          {filteredContactsData.map((contact) => (
            <motion.div
              layout
              key={contact.id}
              className="bg-card border border-border rounded-2xl p-5 group hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  {contact.image_url && (
                    <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                      <img
                        src={contact.image_url}
                        alt={contact.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-brand-blue-dark text-sm">{contact.name}</h3>
                    {contact.position && (
                      <p className="text-xs text-muted-foreground">{contact.position}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">{contact.phone}</p>
                    {contact.email && (
                      <p className="text-xs text-muted-foreground">{contact.email}</p>
                    )}
                    {contact.reception_days && contact.reception_days.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].filter((_, i) => contact.reception_days?.includes(i)).join(", ")} {contact.reception_start && contact.reception_end ? `${contact.reception_start}-${contact.reception_end}` : ""}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button
                    onClick={() => handleEditContact(contact)}
                    className="p-2 hover:bg-brand-blue-dark/10 text-brand-blue-dark rounded-lg transition-colors"
                  >
                    <Edit3 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteContact(contact.id)}
                    className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
          {contactsData.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Phone className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="font-bold">Контакты пока не добавлены</p>
              <p className="text-sm mt-1">Нажмите «Добавить контакт», чтобы создать первый</p>
            </div>
          )}
        </div>
      </div>

      {/* CONTACT MODAL */}
      <AnimatePresence>
        {contactModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setContactModalOpen(false); setEditingContact(null); }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl flex flex-col"
              style={{ maxHeight: "90vh" }}
            >
              <div className="flex items-center justify-between p-6 border-b border-border">
                <h2 className="text-xl font-black text-brand-blue-dark">
                  {editingContact ? "Редактировать контакт" : "Добавить контакт"}
                </h2>
                <button
                  onClick={() => { setContactModalOpen(false); setEditingContact(null); }}
                  className="p-2 hover:bg-secondary rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveContact} className="flex-1 overflow-y-auto p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-brand-blue-dark mb-2">Имя контакта *</label>
                  <input
                    type="text"
                    value={contactForm.name}
                    maxLength={10000}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    className="w-full px-4 py-3 border border-border rounded-xl bg-secondary/50 outline-none focus:ring-2 focus:ring-brand-blue-dark/20 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-brand-blue-dark mb-2">Должность / Описание</label>
                  <input
                    type="text"
                    value={contactForm.position}
                    maxLength={10000}
                    onChange={(e) => setContactForm({ ...contactForm, position: e.target.value })}
                    className="w-full px-4 py-3 border border-border rounded-xl bg-secondary/50 outline-none focus:ring-2 focus:ring-brand-blue-dark/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-brand-blue-dark mb-2">Телефон *</label>
                  <input
                    type="tel"
                    value={contactForm.phone}
                    maxLength={10000}
                    onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-border rounded-xl bg-secondary/50 outline-none focus:ring-2 focus:ring-brand-blue-dark/20 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-brand-blue-dark mb-2">Email</label>
                  <input
                    type="email"
                    value={contactForm.email}
                    maxLength={10000}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    className="w-full px-4 py-3 border border-border rounded-xl bg-secondary/50 outline-none focus:ring-2 focus:ring-brand-blue-dark/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-brand-blue-dark mb-2">Дни приема</label>
                  <div className="flex gap-2 flex-wrap">
                    {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((day, idx) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => {
                          const days = contactForm.reception_days.includes(idx)
                            ? contactForm.reception_days.filter((d) => d !== idx)
                            : [...contactForm.reception_days, idx];
                          setContactForm({ ...contactForm, reception_days: days });
                        }}
                        className={`w-11 h-11 rounded-xl text-sm font-bold transition-all border ${
                          contactForm.reception_days.includes(idx)
                            ? "bg-[#2D6FD4] text-white border-[#2D6FD4] shadow-lg"
                            : "bg-card border-border text-muted-foreground hover:border-[#2D6FD4]"
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-brand-blue-dark mb-2">Время начала</label>
                    <input
                      type="time"
                      value={contactForm.reception_start}
                      onChange={(e) => setContactForm({ ...contactForm, reception_start: e.target.value })}
                      className="w-full px-4 py-3 border border-border rounded-xl bg-secondary/50 outline-none focus:ring-2 focus:ring-brand-blue-dark/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-brand-blue-dark mb-2">Время окончания</label>
                    <input
                      type="time"
                      value={contactForm.reception_end}
                      onChange={(e) => setContactForm({ ...contactForm, reception_end: e.target.value })}
                      className="w-full px-4 py-3 border border-border rounded-xl bg-secondary/50 outline-none focus:ring-2 focus:ring-brand-blue-dark/20 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-brand-blue-dark mb-2">Изображение</label>
                  <div className="space-y-3">
                    {contactImagePreview && (
                      <div className="w-20 h-20 rounded-full mx-auto overflow-hidden border border-border">
                        <img src={contactImagePreview} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <label className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-brand-blue-dark transition-all w-full justify-center">
                      <Upload className="w-4 h-4" />
                      <span className="text-sm">{contactUploadFile ? contactUploadFile.name : "Выбрать файл"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleContactImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => { setContactModalOpen(false); setEditingContact(null); }}
                    className="flex-1 px-4 py-3 border border-border rounded-xl hover:bg-secondary transition-all font-bold"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={contactSaving}
                    className="flex-1 px-4 py-3 bg-brand-blue-dark text-white rounded-xl hover:bg-brand-blue-dark/90 transition-all disabled:opacity-50 font-bold flex items-center justify-center gap-2"
                  >
                    {contactSaving ? "Сохранение..." : "Сохранить"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
