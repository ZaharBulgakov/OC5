import { useState, useEffect, useMemo, useRef } from "react";
import { supabase } from "../../lib/supabase";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard,
  Newspaper,
  Image as ImageIcon,
  FileText,
  Users,
  LogOut,
  Plus,
  Trash2,
  Edit3,
  Save,
  X,
  Search,
  Upload,
  Calendar,
  ArrowRight,
  Folders,
  BookOpen,
  Music,
  Phone
} from "lucide-react";
import { useNavigate } from "react-router";
import ReactCrop, { type Crop as RicCrop, type PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import StudentsAdmin from "./StudentsAdmin";


interface NewsItem {
  id: string;
  title: string;
  text: string;
  image: string;
  preview_image?: string;
  original_image?: string;
  additional_images?: string[];
  created_at: string;
}

interface GalleryItem {
  id: string;
  title: string;
  url: string;
  collection: string;
  collection_id?: string;
  description: string;
  original_image?: string;
  created_at: string;
}

interface GalleryCollection {
  id: string;
  title: string;
  description?: string;
  created_at: string;
}

interface DocumentItem {
  id: string;
  title: string;
  category?: string;
  section?: string;
  subsection?: string;
  type: string;
  size: string;
  date: string;
  url?: string;
  created_at: string;
}

interface ParentsDocumentItem {
  id: string;
  title: string;
  description: string;
  type: string;
  size: string;
  url: string;
  created_at: string;
}

interface DocumentSection {
  id: string;
  title: string;
  section_id?: string;
  created_at: string;
}


function PreviewCanvas({
  imgRef,
  crop,
  aspect,
  isSquareMax,
}: {
  imgRef: React.RefObject<HTMLImageElement | null>;
  crop: PixelCrop;
  aspect: number;
  isSquareMax?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas || !crop.width || !crop.height) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const scaleX = img.naturalWidth / img.width;
    const scaleY = img.naturalHeight / img.height;

    let sx = crop.x * scaleX;
    let sy = crop.y * scaleY;
    let sw = crop.width * scaleX;
    let sh = crop.height * scaleY;

    if (isSquareMax) {
      const side = Math.min(img.naturalWidth, img.naturalHeight);
      const centerX = sx + sw / 2;
      const centerY = sy + sh / 2;
      sx = Math.max(0, Math.min(centerX - side / 2, img.naturalWidth - side));
      sy = Math.max(0, Math.min(centerY - side / 2, img.naturalHeight - side));
      sw = side;
      sh = side;
    }

    // Determine canvas output dimensions to match aspect ratio
    const outW = 320;
    const outH = Math.round(outW / aspect);
    canvas.width = outW;
    canvas.height = outH;

    // Fill with black background
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, outW, outH);

    // Draw cropped area scaled to fit with correct aspect
    const srcAspect = sw / sh;
    let drawW = outW, drawH = outH, drawX = 0, drawY = 0;
    if (srcAspect > aspect) {
      drawH = outH;
      drawW = drawH * srcAspect;
      drawX = (outW - drawW) / 2;
    } else {
      drawW = outW;
      drawH = drawW / srcAspect;
      drawY = (outH - drawH) / 2;
    }

    ctx.drawImage(img, sx, sy, sw, sh, drawX, drawY, drawW, drawH);
  }, [imgRef, crop, aspect, isSquareMax]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
    />
  );
}

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  order_num: number;
}

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

export default function Dashboard() {
  const validTabs = ["news", "gallery", "documents", "parents_documents", "schedule-pdf", "director", "home", "students_books", "students_activities", "faqs", "contacts"] as const;
  type TabType = typeof validTabs[number];
  const savedTab = localStorage.getItem("adminActiveTab") as TabType | null;
  const [activeTab, setActiveTab] = useState<TabType>(savedTab && validTabs.includes(savedTab) ? savedTab : "news");
  const setActiveTabPersisted = (tab: TabType) => { setActiveTab(tab); localStorage.setItem("adminActiveTab", tab); };
  const [faqsData, setFaqsData] = useState<FaqItem[]>([]);
  const [editingFaq, setEditingFaq] = useState<FaqItem | null>(null);
  const [faqModalOpen, setFaqModalOpen] = useState(false);
  const [faqSaving, setFaqSaving] = useState(false);
  const [contactsData, setContactsData] = useState<Contact[]>([]);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactSaving, setContactSaving] = useState(false);
  const [contactForm, setContactForm] = useState({ name: "", position: "", phone: "", email: "", image_url: "", reception_days: [] as number[], reception_start: "", reception_end: "" });
  const [contactUploadFile, setContactUploadFile] = useState<File | null>(null);
  const [contactImagePreview, setContactImagePreview] = useState<string | null>(null);
  const [newsData, setNewsData] = useState<NewsItem[]>([]);
  const [newsAdditionalImages, setNewsAdditionalImages] = useState<File[]>([]);
  const [newsAdditionalImagePreviews, setNewsAdditionalImagePreviews] = useState<string[]>([]);
  const [existingAdditionalImages, setExistingAdditionalImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [galleryData, setGalleryData] = useState<GalleryItem[]>([]);
  const [collectionsData, setCollectionsData] = useState<GalleryCollection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<GalleryCollection | null>(null);
  const [documentsData, setDocumentsData] = useState<DocumentItem[]>([]);
  const [documentSections, setDocumentSections] = useState<DocumentSection[]>([]);
  const [documentSubsections, setDocumentSubsections] = useState<DocumentSection[]>([]);
  const [showSectionManager, setShowSectionManager] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [newSubSectionId, setNewSubSectionId] = useState<string>("");
  const [sectionSearch, setSectionSearch] = useState("");
  const [formSelectedSection, setFormSelectedSection] = useState<string>("");
  const [parentsDocumentsData, setParentsDocumentsData] = useState<ParentsDocumentItem[]>([]);
  const [schedulePdfUrl, setSchedulePdfUrl] = useState<string | null>(null);
  const [scheduleUploading, setScheduleUploading] = useState(false);
  const [scheduleUploadFile, setScheduleUploadFile] = useState<File | null>(null);
  const [scheduleIsDragging, setScheduleIsDragging] = useState(false);
  const scheduleFileRef = useRef<HTMLInputElement>(null);
  const [textbookModalOpen, setTextbookModalOpen] = useState(false);
  const [textbookForm, setTextbookForm] = useState({ subject: "", author: "", year: new Date().getFullYear(), grade_label: "1 класс" });
  const [textbookEditId, setTextbookEditId] = useState<string | null>(null);
  const [uniformModalOpen, setUniformModalOpen] = useState(false);
  const [uniformForm, setUniformForm] = useState({ grade_label: "", description: "" });
  const [uniformEditId, setUniformEditId] = useState<string | null>(null);
  const [studentsSection, setStudentsSection] = useState<"textbooks" | "uniform">("textbooks");
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [activityForm, setActivityForm] = useState({ section_id: "", title: "", scheduleDays: [] as number[], scheduleTime: "15:00" });
  const [activityEditId, setActivityEditId] = useState<string | null>(null);
  const [activitySections, setActivitySections] = useState<any[]>([]);
  const [activitySaving, setActivitySaving] = useState(false);
  const [showActivitySectionManager, setShowActivitySectionManager] = useState(false);
  const [newActivitySectionTitle, setNewActivitySectionTitle] = useState("");
  const [activitySectionSearch, setActivitySectionSearch] = useState("");
  const [activitySectionEditId, setActivitySectionEditId] = useState<string | null>(null);
  const [activitySectionEditTitle, setActivitySectionEditTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<NewsItem | GalleryItem | DocumentItem | ParentsDocumentItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [uploadForm, setUploadForm] = useState({ title: "", type: "", size: "" });
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const newsFileRef = useRef<HTMLInputElement>(null);
  const directorFileRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Director state
  const [directorForm, setDirectorForm] = useState({ name: "", quotes: ["", "", ""], image_url: "" });
  const [directorSaving, setDirectorSaving] = useState(false);
  const [directorImageFile, setDirectorImageFile] = useState<File | null>(null);
  const [directorImagePreview, setDirectorImagePreview] = useState<string | null>(null);
  const [directorSuccess, setDirectorSuccess] = useState(false);

  // Home hero state
  const heroFileRef = useRef<HTMLInputElement>(null);
  const [heroAspect, setHeroAspect] = useState<"16:9" | "9:16">("16:9");
  const [heroImageFile, setHeroImageFile] = useState<File | null>(null);
  const [heroImagePreview, setHeroImagePreview] = useState<string | null>(null);
  const [heroCurrentUrl, setHeroCurrentUrl] = useState<string | null>(null);
  const [heroSaving, setHeroSaving] = useState(false);
  const [heroSuccess, setHeroSuccess] = useState(false);
  const [showHeroCropper, setShowHeroCropper] = useState(false);
  const [heroCropImage, setHeroCropImage] = useState<string | null>(null);
  const [heroCrop, setHeroCrop] = useState<RicCrop>();
  const [heroCompletedCrop, setHeroCompletedCrop] = useState<PixelCrop>();
  const heroCompletedCropRef = useRef<PixelCrop | undefined>(undefined);
  const heroImgRef = useRef<HTMLImageElement>(null);

  // Cropper states
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [crop, setCrop] = useState<RicCrop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const completedCropRef = useRef<PixelCrop | undefined>(undefined);
  const [zoom, setZoom] = useState(1);
  const imgRef = useRef<HTMLImageElement>(null);
  const [showCropper, setShowCropper] = useState<"news" | "gallery" | null>(null);
  const [isSquareMax, setIsSquareMax] = useState(false);
  const [cropAspect, setCropAspect] = useState<number | undefined>(16 / 9);
  const [imgNaturalSize, setImgNaturalSize] = useState({ w: 1, h: 1 });

  const getCroppedImg = async (imgEl: HTMLImageElement, pixelCrop: PixelCrop, isSquare: boolean = false): Promise<Blob> => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No 2d context");

    const scaleX = imgEl.naturalWidth / imgEl.width;
    const scaleY = imgEl.naturalHeight / imgEl.height;

    let sx = pixelCrop.x * scaleX;
    let sy = pixelCrop.y * scaleY;
    let sw = pixelCrop.width * scaleX;
    let sh = pixelCrop.height * scaleY;

    if (isSquare) {
      const side = Math.min(imgEl.naturalWidth, imgEl.naturalHeight);
      const centerX = sx + sw / 2;
      const centerY = sy + sh / 2;
      sx = Math.max(0, Math.min(centerX - side / 2, imgEl.naturalWidth - side));
      sy = Math.max(0, Math.min(centerY - side / 2, imgEl.naturalHeight - side));
      sw = side;
      sh = side;
    }

    canvas.width = sw;
    canvas.height = sh;
    ctx.drawImage(imgEl, sx, sy, sw, sh, 0, 0, sw, sh);

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas is empty"));
      }, "image/jpeg", 0.9);
    });
  };


  const initCropForAspect = (aspect: number | undefined) => {
    if (!imgRef.current) return;
    const { width, height } = imgRef.current;
    if (aspect) {
      setCrop(centerCrop(makeAspectCrop({ unit: "%", width: 90 }, aspect, width, height), width, height));
    } else {
      setCrop({ unit: "%", x: 5, y: 5, width: 90, height: 90 });
    }
  };

  // Fetches an external URL as a blob URL to avoid "tainted canvas" CORS error
  const fetchAsBlobUrl = async (url: string): Promise<string> => {
    const res = await fetch(url);
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  };


  useEffect(() => {
    if (uploadFile) {
      const fileName = uploadFile.name.split(".").slice(0, -1).join(".");
      const fileExtension = uploadFile.name.split(".").pop()?.toUpperCase() || "";
      const fileSize = `${(uploadFile.size / 1024).toFixed(1)} КБ`;

      setUploadForm((prev) => ({
        ...prev,
        title: fileName,
        type: fileExtension,
        size: fileSize,
      }));
    } else {
      setUploadForm({ title: "", type: "", size: "" });
    }
  }, [uploadFile]);

  const filteredNewsData = useMemo(() => {
    if (!searchQuery) return newsData;
    return newsData.filter(item => 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.text.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [newsData, searchQuery]);

  const filteredGalleryData = useMemo(() => {
    let baseData = galleryData;
    if (selectedCollection) {
      baseData = galleryData.filter(item => item.collection_id === selectedCollection.id);
    }
    if (!searchQuery) return baseData;
    return baseData.filter(item => 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [galleryData, searchQuery, selectedCollection]);

  const filteredCollectionsData = useMemo(() => {
    if (!searchQuery) return collectionsData;
    return collectionsData.filter(item => 
      item.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [collectionsData, searchQuery]);

  const filteredContactsData = useMemo(() => {
    if (!searchQuery) return contactsData;
    return contactsData.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.position && item.position.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.phone.includes(searchQuery) ||
      (item.email && item.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [contactsData, searchQuery]);

  const filteredDocumentsData = useMemo(() => {
    if (!searchQuery) return documentsData;
    return documentsData.filter(item => 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.section || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [documentsData, searchQuery]);

  const filteredParentsDocumentsData = useMemo(() => {
    if (!searchQuery) return parentsDocumentsData;
    return parentsDocumentsData.filter(item => 
      item.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [parentsDocumentsData, searchQuery]);

  const fetchDataInternal = async () => {
    setLoading(true);

    if (activeTab === "gallery") {
      const [collRes, itemRes] = await Promise.all([
        supabase.from("gallery_collections").select("*").order("created_at", { ascending: false }),
        supabase.from("gallery").select("*").order("created_at", { ascending: false })
      ]);
      
      if (collRes.error) console.error("Error fetching collections:", collRes.error);
      else setCollectionsData(collRes.data as GalleryCollection[] || []);
      
      if (itemRes.error) console.error("Error fetching gallery items:", itemRes.error);
      else setGalleryData(itemRes.data as GalleryItem[] || []);
      
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from(activeTab)
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("Error fetching data for " + activeTab + ":", error);
    } else {
      if (activeTab === "news") {
        setNewsData(data as NewsItem[] || []);
      } else if (activeTab === "documents") {
        setDocumentsData(data as DocumentItem[] || []);
        const [sectionsRes, subsectionsRes] = await Promise.all([
          supabase.from("document_sections").select("*").order("title", { ascending: true }),
          supabase.from("document_subsections").select("*").order("title", { ascending: true }),
        ]);
        setDocumentSections(sectionsRes.data as DocumentSection[] || []);
        setDocumentSubsections(subsectionsRes.data as DocumentSection[] || []);
      } else if (activeTab === "parents_documents") {
        setParentsDocumentsData(data as ParentsDocumentItem[] || []);
      }
    }

    if (activeTab === "faqs") {
      const { data: faqData, error: faqError } = await supabase
        .from("faqs")
        .select("*")
        .order("order_num", { ascending: true });
      if (!faqError) setFaqsData(faqData as FaqItem[] || []);
      setLoading(false);
      return;
    }

    if (activeTab === "contacts") {
      const { data: contactsData, error: contactsError } = await supabase
        .from("contacts")
        .select("*")
        .order("order_num", { ascending: true });
      if (!contactsError) setContactsData(contactsData as Contact[] || []);
      setLoading(false);
      return;
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchDataInternal();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "director") {
      const fetchDirector = async () => {
        const { data } = await supabase.from("director_info").select("*").eq("id", 1).single();
        if (data) {
          setDirectorForm({
            name: data.name || "",
            quotes: Array.isArray(data.quotes) && data.quotes.length > 0 ? data.quotes : ["", "", ""],
            image_url: data.image_url || "",
          });
          setDirectorImagePreview(data.image_url || null);
        }
      };
      fetchDirector();
    }
    if (activeTab === "home") {
      const fetchHero = async () => {
        const { data } = await supabase.from("site_config").select("*").eq("id", 1).single();
        if (data) {
          setHeroAspect(data.hero_aspect === "9:16" ? "9:16" : "16:9");
          setHeroCurrentUrl(data.hero_image_url || null);
          setHeroImagePreview(data.hero_image_url || null);
        }
      };
      fetchHero();
    }
    if (activeTab === "students_activities") {
      const fetchActivitySections = async () => {
        const { data } = await supabase.from("activity_sections").select("*").order("sort_order");
        setActivitySections(data || []);
      };
      fetchActivitySections();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "schedule-pdf") {
      const fetchSchedulePdf = async () => {
        const { data, error } = await supabase
          .from('schedule_config')
          .select('pdf_url')
          .eq('id', 1)
          .single();
        
        if (error) {
          console.error('Error fetching schedule PDF:', error);
          setSchedulePdfUrl(null);
        } else if (data) {
          setSchedulePdfUrl(data.pdf_url);
        }
      };
      fetchSchedulePdf();
    }
  }, [activeTab]);

  const fetchData = async () => {
    // This function is now used to trigger a refresh of the data for the current tab.
    // It clears the current data state and then calls fetchDataInternal to refetch.
    if (activeTab === "news") setNewsData([]);
    else if (activeTab === "gallery") setGalleryData([]);
    else if (activeTab === "documents") setDocumentsData([]);
    else if (activeTab === "parents_documents") setParentsDocumentsData([]);
    else if (activeTab === "contacts") setContactsData([]);
    fetchDataInternal();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Вы уверены, что хотите удалить этот элемент?")) return;
    const { error } = await supabase.from(activeTab).delete().eq("id", id);
    if (!error) {
      if (activeTab === "news") {
        setNewsData((prev) => prev.filter((item) => item.id !== id));
      } else if (activeTab === "gallery") {
        setGalleryData((prev) => prev.filter((item) => item.id !== id));
      } else if (activeTab === "documents") {
        setDocumentsData((prev) => prev.filter((item) => item.id !== id));
      } else if (activeTab === "parents_documents") {
        setParentsDocumentsData((prev) => prev.filter((item) => item.id !== id));
      }
    }
  };

  const handleDeleteCollection = async (id: string) => {
    if (!confirm("Вы уверены, что хотите удалить эту коллекцию? Все фотографии внутри также будут удалены.")) return;
    
    // 1. Delete all images in this collection
    await supabase.from("gallery").delete().eq("collection_id", id);
    
    // 2. Delete collection itself
    const { error } = await supabase.from("gallery_collections").delete().eq("id", id);
    
    if (!error) {
      setCollectionsData(prev => prev.filter(c => c.id !== id));
      if (selectedCollection?.id === id) setSelectedCollection(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setSubmitting(true);
      const formData = new FormData(e.currentTarget);
      let itemData: any = Object.fromEntries(formData.entries());

      if (activeTab === "gallery" && editingItem?.id === 'new-collection') {
        try {
          const { data, error } = await supabase
            .from("gallery_collections")
            .insert([{ title: itemData.title, description: itemData.description }])
            .select();
          if (error) throw error;
          if (data) setCollectionsData(prev => [data[0], ...prev]);
          setIsModalOpen(false);
          setEditingItem(null);
          setSubmitting(false);
          return;
        } catch (err: any) {
          alert("Ошибка при создании коллекции: " + err.message);
          setSubmitting(false);
          return;
        }
      }

      if (activeTab === "gallery" && editingItem && !('url' in editingItem)) {
        try {
          const { data, error } = await supabase
            .from("gallery_collections")
            .update({ title: itemData.title, description: itemData.description })
            .eq("id", editingItem.id)
            .select();
          if (error) throw error;
          if (data) setCollectionsData(prev => prev.map(c => c.id === editingItem.id ? data[0] : c));
          setIsModalOpen(false);
          setEditingItem(null);
          return;
        } catch (err: any) {
          alert("Ошибка при обновлении коллекции: " + err.message);
          return;
        }
      }

      if (activeTab === "gallery" && (uploadFile || editingItem)) {
        try {
          const timestamp = Date.now();
          let finalImageUrl = (editingItem as any)?.url;
          let finalOriginalUrl = (editingItem as any)?.original_image;

          if (uploadFile) {
            const sanitizedMainName = `gallery-main-${timestamp}-${uploadFile.name.replace(/[^a-zA-Z0-9.]/g, "-").toLowerCase()}`;
            const { data: mainStorageData, error: mainStorageError } = await supabase.storage
              .from('gallery')
              .upload(`public/${sanitizedMainName}`, uploadFile, { cacheControl: '3600', upsert: false });
            if (mainStorageError) throw mainStorageError;
            const { data: mainUrlData } = supabase.storage.from('gallery').getPublicUrl(mainStorageData.path);
            finalImageUrl = mainUrlData.publicUrl;

            if (originalFile) {
              const sanitizedOrgName = `gallery-org-${timestamp}-${originalFile.name.replace(/[^a-zA-Z0-9.]/g, "-").toLowerCase()}`;
              const { data: orgStorageData, error: orgStorageError } = await supabase.storage
                .from('gallery')
                .upload(`public/${sanitizedOrgName}`, originalFile, { cacheControl: '3600', upsert: false });
              if (!orgStorageError) {
                const { data: orgUrlData } = supabase.storage.from('gallery').getPublicUrl(orgStorageData.path);
                finalOriginalUrl = orgUrlData.publicUrl;
              }
            }
          }

          itemData = {
            title: itemData.title,
            description: itemData.description || "",
            url: finalImageUrl,
            original_image: finalOriginalUrl,
            collection_id: selectedCollection?.id,
            collection: selectedCollection?.title
          };
        } catch (err: any) {
          alert("Ошибка при обработке фото: " + err.message);
          return;
        }
      } else if (activeTab === "gallery" && !uploadFile && !editingItem) {
        alert("Пожалуйста, выберите фото.");
        return;
      }
  
      if (activeTab === "news" && uploadFile) {
        try {
          const timestamp = Date.now();
          const sanitizedMainName = `main-${timestamp}-${uploadFile.name.replace(/[^a-zA-Z0-9.]/g, "-").toLowerCase()}`;
          
          // 1. Upload Main Image
          const { data: mainStorageData, error: mainStorageError } = await supabase.storage
            .from('news') 
            .upload(`public/${sanitizedMainName}`, uploadFile, { cacheControl: '3600', upsert: false });

          if (mainStorageError) throw new Error("Ошибка при загрузке основного изображения: " + mainStorageError.message);

          const { data: mainUrlData } = supabase.storage
            .from('news')
            .getPublicUrl(mainStorageData.path);

          let previewUrl = mainUrlData.publicUrl;
          let originalUrl = mainUrlData.publicUrl;

          // 2. Upload Preview Image if exists
          const pendingPreview = (window as any)._pendingPreviewFile;
          if (pendingPreview) {
            const sanitizedPreviewName = `preview-${timestamp}-${pendingPreview.name.replace(/[^a-zA-Z0-9.]/g, "-").toLowerCase()}`;
            const { data: previewStorageData, error: previewStorageError } = await supabase.storage
              .from('news')
              .upload(`public/${sanitizedPreviewName}`, pendingPreview, { cacheControl: '3600', upsert: false });

            if (!previewStorageError) {
              const { data: previewUrlData } = supabase.storage
                .from('news')
                .getPublicUrl(previewStorageData.path);
              previewUrl = previewUrlData.publicUrl;
            }
            delete (window as any)._pendingPreviewFile;
          }

          // 3. Upload Original Image if exists
          if (originalFile) {
            const sanitizedOriginalName = `original-${timestamp}-${originalFile.name.replace(/[^a-zA-Z0-9.]/g, "-").toLowerCase()}`;
            const { data: originalStorageData, error: originalStorageError } = await supabase.storage
              .from('news')
              .upload(`public/${sanitizedOriginalName}`, originalFile, { cacheControl: '3600', upsert: false });

            if (!originalStorageError) {
              const { data: originalUrlData } = supabase.storage
                .from('news')
                .getPublicUrl(originalStorageData.path);
              originalUrl = originalUrlData.publicUrl;
            }
          } else if (editingItem && (editingItem as any).original_image) {
            originalUrl = (editingItem as any).original_image;
          }

          // 4. Upload Additional Images if exist
          let additionalImageUrls: string[] = [];
          // Upload new additional images
          if (newsAdditionalImages.length > 0) {
            for (let i = 0; i < newsAdditionalImages.length; i++) {
              const file = newsAdditionalImages[i];
              const sanitizedAdditionalName = `additional-${timestamp}-${i}-${file.name.replace(/[^a-zA-Z0-9.]/g, "-").toLowerCase()}`;
              const { data: additionalStorageData, error: additionalStorageError } = await supabase.storage
                .from('news')
                .upload(`public/${sanitizedAdditionalName}`, file, { cacheControl: '3600', upsert: false });

              if (!additionalStorageError) {
                const { data: additionalUrlData } = supabase.storage
                  .from('news')
                  .getPublicUrl(additionalStorageData.path);
                additionalImageUrls.push(additionalUrlData.publicUrl);
              }
            }
            // Merge with kept existing images
            additionalImageUrls = [...existingAdditionalImages, ...additionalImageUrls];
          } else {
            // No new uploads — use whatever existing images remain (may have been deleted by user)
            additionalImageUrls = existingAdditionalImages;
          }

          itemData = {
            ...itemData,
            image: mainUrlData.publicUrl,
            preview_image: previewUrl,
            original_image: originalUrl,
            additional_images: additionalImageUrls
          };
        } catch (err: any) {
          alert("Ошибка при обработке изображения: " + err.message);
          return;
        }
      } else if (activeTab === "news" && !uploadFile && !editingItem) {
        alert("Пожалуйста, выберите изображение для новости.");
        return;
      }

      if ((activeTab === "documents" || activeTab === "parents_documents") && uploadFile) {
        const today = new Date();
        const dateStr = `${String(today.getDate()).padStart(2, "0")}.${String(today.getMonth() + 1).padStart(2, "0")}.${today.getFullYear()}`;
        
        // Sanitize file name for Supabase Storage key
        const sanitizedFileName = uploadFile.name.replace(/[^a-zA-Z0-9.]/g, "-").toLowerCase();

        // Upload file to Supabase Storage
        const bucketName = activeTab === "documents" ? 'documents' : 'parents_documents';
        const { data: storageData, error: storageError } = await supabase.storage
          .from(bucketName) 
          .upload(`public/${sanitizedFileName}-${Date.now()}`, uploadFile, { cacheControl: '3600', upsert: false });

        if (storageError) {
          throw new Error("Ошибка при загрузке файла: " + storageError.message);
        }

        const { data: publicUrlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(storageData.path);

        if (!publicUrlData.publicUrl) {
          throw new Error("Не удалось получить публичный URL файла.");
        }

        if (activeTab === "documents") {
          itemData = {
            ...itemData,
            title: uploadForm.title.trim(),
            type: uploadForm.type,
            size: uploadForm.size,
            date: dateStr,
            url: publicUrlData.publicUrl,
            section: (itemData.section || "").trim() || null,
            subsection: (itemData.subsection || "").trim() || null,
          };
        } else {
          itemData = {
            ...itemData,
            title: uploadForm.title.trim(),
            type: uploadForm.type,
            size: uploadForm.size,
            url: publicUrlData.publicUrl,
          };
        }
      } else if ((activeTab === "documents" || activeTab === "parents_documents") && !uploadFile && !editingItem) {
        alert("Пожалуйста, выберите файл для загрузки.");
        return;
      }
  
      try {
        let updatedItem: NewsItem | GalleryItem | DocumentItem | ParentsDocumentItem | null = null;
        if (editingItem) {
          const { data: response, error } = await supabase
            .from(activeTab)
            .update(itemData)
            .eq("id", editingItem.id)
            .select(); // Select the updated item
          
          if (error) throw error;
          updatedItem = response ? response[0] : null;
  
          if (activeTab === "news") {
            setNewsData((prev) => prev.map((item) => (item.id === editingItem.id ? updatedItem as NewsItem : item)));
          } else if (activeTab === "gallery") {
            setGalleryData((prev) => prev.map((item) => (item.id === editingItem.id ? updatedItem as GalleryItem : item)));
          } else if (activeTab === "documents") {
            setDocumentsData((prev) => prev.map((item) => (item.id === editingItem.id ? updatedItem as DocumentItem : item)));
          } else if (activeTab === "parents_documents") {
            setParentsDocumentsData((prev) => prev.map((item) => (item.id === editingItem.id ? updatedItem as ParentsDocumentItem : item)));
          }
  
        } else {
          const { data: response, error } = await supabase
            .from(activeTab)
            .insert([itemData])
            .select(); // Select the inserted item
          
          if (error) throw error;
          updatedItem = response ? response[0] : null;
  
          if (updatedItem) {
            if (activeTab === "news") {
              setNewsData((prev) => [updatedItem as NewsItem, ...prev]);
            } else if (activeTab === "gallery") {
              setGalleryData((prev) => [updatedItem as GalleryItem, ...prev]);
            } else if (activeTab === "documents") {
              setDocumentsData((prev) => [updatedItem as DocumentItem, ...prev]);
            } else if (activeTab === "parents_documents") {
              setParentsDocumentsData((prev) => [updatedItem as ParentsDocumentItem, ...prev]);
            }
          }
        }
        setIsModalOpen(false);
        setEditingItem(null);
        setUploadFile(null);
        setOriginalFile(null);
        setNewsAdditionalImages([]);
        setNewsAdditionalImagePreviews([]);
        setExistingAdditionalImages([]);
        setUploadForm({ title: "", type: "", size: "" });
      } catch (error: any) {
        console.error("Supabase error:", error);
        alert("Ошибка при сохранении: " + (error.message || "Неизвестная ошибка"));
      } finally {
        setSubmitting(false);
      }
    };

  const handleSubmitSchedulePdf = async () => {
    if (!scheduleUploadFile) {
      alert("Пожалуйста, выберите PDF-файл для загрузки.");
      return;
    }

    setScheduleUploading(true);

    try {
      // 1. Delete existing PDF from storage if it exists
      if (schedulePdfUrl) {
        const path = schedulePdfUrl.split('public/').pop(); // Extract path from URL
        if (path) {
          const { error: deleteError } = await supabase.storage.from('schedule').remove([path]);
          if (deleteError) {
            console.error("Error deleting old schedule PDF from storage:", deleteError);
            // Don't throw error here, try to upload new file anyway
          }
        }
      }

      // 2. Upload new PDF to Supabase Storage
      const sanitizedFileName = scheduleUploadFile.name.replace(/[^a-zA-Z0-9.]/g, "-").toLowerCase();
      const storagePath = `public/${sanitizedFileName}-${Date.now()}`;

      const { data: storageData, error: storageError } = await supabase.storage
        .from('schedule') // Assuming a 'schedule' bucket for schedule PDFs
        .upload(storagePath, scheduleUploadFile, { cacheControl: '3600', upsert: false });

      if (storageError) {
        throw new Error("Ошибка при загрузке PDF-файла расписания: " + storageError.message);
      }

      const { data: publicUrlData } = supabase.storage
        .from('schedule')
        .getPublicUrl(storageData.path);

      if (!publicUrlData.publicUrl) {
        throw new Error("Не удалось получить публичный URL для PDF-файла расписания.");
      }

      // 3. Update pdf_url in schedule_config table
      const { error: updateError } = await supabase
        .from('schedule_config')
        .update({ pdf_url: publicUrlData.publicUrl })
        .eq('id', 1); // Assuming we always update the entry with id=1

      if (updateError) {
        throw new Error("Ошибка при обновлении URL расписания в базе данных: " + updateError.message);
      }

      setSchedulePdfUrl(publicUrlData.publicUrl);
      setScheduleUploadFile(null);
      alert("PDF-файл расписания успешно обновлен!");
    } catch (error: any) {
      console.error("Error uploading schedule PDF:", error);
      alert("Ошибка при загрузке PDF-файла расписания: " + (error.message || "Неизвестная ошибка"));
    } finally {
      setScheduleUploading(false);
    }
  };

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

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactSaving(true);

    try {
      let imageUrl = contactForm.image_url;

      if (contactUploadFile) {
        const timestamp = Date.now();
        const sanitizedName = contactUploadFile.name.replace(/[^a-zA-Z0-9.]/g, "-").toLowerCase();
        const { data: storageData, error: storageError } = await supabase.storage
          .from("contacts")
          .upload(`public/${timestamp}-${sanitizedName}`, contactUploadFile, { cacheControl: "3600", upsert: false });

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

  const handleContactImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("Файл слишком большой. Максимальный размер: 5 МБ");
        e.target.value = "";
        return;
      }
      setContactUploadFile(file);
      setContactImagePreview(URL.createObjectURL(file));
    }
  };

  const handleDeleteSchedulePdf = async () => {
    if (!confirm("Вы уверены, что хотите удалить текущий PDF-файл расписания?")) return;

    try {
      // 1. Delete PDF from storage
      if (schedulePdfUrl) {
        const path = schedulePdfUrl.split('public/').pop(); // Extract path from URL
        if (path) {
          const { error: deleteError } = await supabase.storage.from('schedule').remove([path]);
          if (deleteError) {
            throw new Error("Ошибка при удалении PDF-файла расписания из хранилища: " + deleteError.message);
          }
        }
      }

      // 2. Clear pdf_url in schedule_config table
      const { error: updateError } = await supabase
        .from('schedule_config')
        .update({ pdf_url: null })
        .eq('id', 1);

      if (updateError) {
        throw new Error("Ошибка при удалении URL расписания из базы данных: " + updateError.message);
      }

      setSchedulePdfUrl(null);
      alert("PDF-файл расписания успешно удален!");
    } catch (error: any) {
      console.error("Error deleting schedule PDF:", error);
      alert("Ошибка при удалении PDF-файла расписания: " + (error.message || "Неизвестная ошибка"));
    }
  };

  // Edit handlers for textbooks, uniforms, activity sections, and activities
  const handleEditTextbook = (textbook: any) => {
    setTextbookForm({
      subject: textbook.subject,
      author: textbook.author,
      year: textbook.year,
      grade_label: textbook.grade_label || "1 класс"
    });
    setTextbookEditId(textbook.id);
    setTextbookModalOpen(true);
  };

  const handleEditUniform = (uniform: any) => {
    setUniformForm({
      grade_label: uniform.grade_label,
      description: uniform.description
    });
    setUniformEditId(uniform.id);
    setUniformModalOpen(true);
  };

  const handleEditActivity = async (activity: any) => {
    // Fetch activity schedules
    const { data: schedules } = await supabase
      .from("activity_schedules")
      .select("*")
      .eq("activity_id", activity.id);
    
    setActivityForm({
      section_id: activity.section_id,
      title: activity.title,
      scheduleDays: schedules?.map((s: any) => s.day_of_week) || [],
      scheduleTime: schedules?.[0]?.time || "15:00"
    });
    setActivityEditId(activity.id);
    setActivityModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-secondary/20 flex flex-col lg:flex-row">
      {/* Sidebar */}
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
                  onClick={() => setActiveTabPersisted(tab.id as any)}
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
                  onClick={() => setActiveTabPersisted(tab.id as any)}
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
                  onClick={() => setActiveTabPersisted(tab.id as any)}
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
                  onClick={() => setActiveTabPersisted(tab.id as any)}
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
                  onClick={() => setActiveTabPersisted(tab.id as any)}
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
                  onClick={() => setActiveTabPersisted(tab.id as any)}
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
          onClick={handleLogout}
          className="mt-10 flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-destructive hover:bg-destructive/10 transition-all"
        >
          <LogOut className="w-5 h-5" />
          Выйти
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-black text-brand-blue-dark">
              {activeTab === "news" ? "Новости" : activeTab === "gallery" ? "Галерея" : activeTab === "documents" ? "Документы" : activeTab === "parents_documents" ? "Родителям" : activeTab === "contacts" ? "Контакты" : activeTab === "director" ? "Слово директора" : activeTab === "home" ? "Главная страница" : activeTab === "students_books" ? "Учебники и форма" : activeTab === "students_activities" ? "Кружки и секции" : activeTab === "faqs" ? "Вопросы и ответы" : "Расписание PDF"}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">Управление содержимым раздела</p>
          </div>
          <div className="relative w-full sm:w-auto">
            {activeTab !== "director" && activeTab !== "home" && activeTab !== "faqs" && (
              <>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Поиск..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-[300px] pl-11 pr-4 py-3 border border-border rounded-xl bg-card outline-none focus:ring-1 focus:ring-brand-blue-dark/20 transition-all text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors text-lg leading-none"
              >
                ×
              </button>
            )}
              </>
            )}
          </div>
          <div className="flex items-center gap-2 w-fit">
            {activeTab === "documents" && (
              <button
                onClick={() => setShowSectionManager(true)}
                className="border border-border bg-card text-brand-blue-dark px-5 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-secondary transition-all"
              >
                <Folders className="w-5 h-5" />
                Разделы
              </button>
            )}
            {activeTab === "students_activities" && (
              <button
                onClick={() => setShowActivitySectionManager(true)}
                className="border border-border bg-card text-brand-blue-dark px-5 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-secondary transition-all"
              >
                <Folders className="w-5 h-5" />
                Разделы
              </button>
            )}
            {activeTab === "contacts" && (
              <button
                onClick={handleAddContact}
                className="bg-brand-blue-dark text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:shadow-lg hover:-translate-y-0.5 transition-all w-fit"
              >
                <Plus className="w-5 h-5" />
                Добавить контакт
              </button>
            )}
            {activeTab !== "director" && activeTab !== "home" && activeTab !== "faqs" && activeTab !== "contacts" && activeTab !== "schedule-pdf" && (
            <button
              onClick={() => {
                if (activeTab === "students_books") {
                  if (studentsSection === "textbooks") {
                    setTextbookForm({ subject: "", author: "", year: new Date().getFullYear(), grade_label: "1 класс" });
                    setTextbookEditId(null);
                    setTextbookModalOpen(true);
                  } else {
                    setUniformForm({ grade_label: "", description: "" });
                    setUniformEditId(null);
                    setUniformModalOpen(true);
                  }
                } else if (activeTab === "students_activities") {
                  setActivityForm({ section_id: "", title: "", scheduleDays: [], scheduleTime: "15:00" });
                  setActivityEditId(null);
                  setActivityModalOpen(true);
                } else if (activeTab === "gallery" && !selectedCollection) {
                  setEditingItem({ id: 'new-collection' } as any);
                } else {
                  setEditingItem(null);
                }
                setUploadFile(null);
                setOriginalFile(null);
                setFormSelectedSection("");
                if (activeTab !== "students_books" && activeTab !== "students_activities") setIsModalOpen(true);
              }}
              className="bg-brand-blue-dark text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:shadow-lg hover:-translate-y-0.5 transition-all w-fit"
            >
              <Plus className="w-5 h-5" />
              {activeTab === "students_books" ? "Добавить учебник" : activeTab === "students_activities" ? "Добавить кружок" : activeTab === "gallery" ? (selectedCollection ? "Добавить фото" : "Создать коллекцию") : activeTab === "parents_documents" || activeTab === "documents" ? "Добавить документ" : "Добавить новость"}
            </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue-dark"></div>
          </div>
        ) : (
          <div className="grid gap-4">
            {activeTab === "news" && filteredNewsData.map((item: NewsItem) => (
              <motion.div 
                layout
                key={item.id}
                className="bg-card border border-border p-5 rounded-2xl flex items-center justify-between group hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-4">
                  {(item.preview_image || item.image) && (
                    <img
                      src={item.preview_image || item.image}
                      alt={item.title}
                      className="w-16 h-16 rounded-xl object-cover flex-shrink-0 bg-secondary"
                    />
                  )}
                  <div>
                    <h3 className="font-bold text-brand-blue-dark">{item.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-1">{item.text}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => { 
                      setEditingItem(item); 
                      setUploadFile(null);
                      setOriginalFile(null);
                      setExistingAdditionalImages((item as any).additional_images || []);
                      setNewsAdditionalImages([]);
                      setNewsAdditionalImagePreviews([]);
                      setIsModalOpen(true); 
                    }}
                    className="p-2 hover:bg-brand-blue-dark/10 text-brand-blue-dark rounded-lg transition-colors"
                  >
                    <Edit3 className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            ))}

            {activeTab === "gallery" && !selectedCollection && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCollectionsData.map((coll) => (
                  <motion.div
                    layout
                    key={coll.id}
                    onClick={() => setSelectedCollection(coll)}
                    className="bg-card border border-border rounded-3xl cursor-pointer group hover:border-brand-blue-dark transition-all hover:shadow-xl relative overflow-hidden"
                  >
                    {/* Cover image */}
                    {(() => {
                      const cover = galleryData.find(i => i.collection_id === coll.id);
                      return cover ? (
                        <div className="w-full h-40 overflow-hidden">
                          <img src={cover.url} alt={coll.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        </div>
                      ) : (
                        <div className="w-full h-40 bg-brand-blue-dark/5 flex items-center justify-center">
                          <ImageIcon className="w-10 h-10 text-brand-blue-dark/30" />
                        </div>
                      );
                    })()}
                    <div className="p-5">
                      <h3 className="text-base font-black text-brand-blue-dark mb-1 line-clamp-2">{coll.title}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-1 mb-3">
                        {coll.description || "Нет описания"}
                      </p>
                      <div className="flex items-center justify-between pt-3 border-t border-border/50">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground">
                          {galleryData.filter(i => i.collection_id === coll.id).length} фото
                        </span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingItem(coll as any);
                              setIsModalOpen(true);
                            }}
                            className="p-2 hover:bg-brand-blue-dark/10 text-brand-blue-dark rounded-lg transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCollection(coll.id);
                            }}
                            className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {activeTab === "gallery" && selectedCollection && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setSelectedCollection(null)}
                    className="p-2 hover:bg-secondary rounded-xl text-muted-foreground hover:text-brand-blue-dark transition-all"
                  >
                    <ArrowRight className="w-5 h-5 rotate-180" />
                  </button>
                  <h2 className="text-xl font-bold text-brand-blue-dark">Коллекция: {selectedCollection.title}</h2>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {filteredGalleryData.map((item) => (
                    <motion.div 
                      layout
                      key={item.id}
                      className="bg-card border border-border rounded-2xl overflow-hidden relative group"
                    >
                      <img src={item.url} className="w-full h-auto object-contain transition-transform group-hover:scale-105 duration-500" />
                      {/* Название фото */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2 pointer-events-none">
                        <p className="text-white truncate" style={{ fontFamily: "Arial, sans-serif", fontWeight: 700, fontSize: "16px" }}>{item.title}</p>
                      </div>
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button 
                          onClick={() => { 
                            setEditingItem(item); 
                            setUploadFile(null);
                            setOriginalFile(null);
                            setIsModalOpen(true); 
                          }}
                          className="p-2 bg-white/20 hover:bg-white/40 text-white rounded-lg backdrop-blur-md transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="p-2 bg-destructive/20 hover:bg-destructive/40 text-white rounded-lg backdrop-blur-md transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "documents" && (() => {
              // Group by section → subsection
              const grouped: Record<string, Record<string, DocumentItem[]>> = {};
              filteredDocumentsData.forEach(item => {
                const sec = item.section?.trim() || "Без раздела";
                const sub = item.subsection?.trim() || "";
                if (!grouped[sec]) grouped[sec] = {};
                if (!grouped[sec][sub]) grouped[sec][sub] = [];
                grouped[sec][sub].push(item);
              });
              const sortedSections = Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b, "ru"));
              return (
                <div className="space-y-8">
                  {sortedSections.map(([section, subMap]) => {
                    const totalDocs = Object.values(subMap).flat().length;
                    const sortedSubs = Object.entries(subMap).sort(([a], [b]) => {
                      if (a === "") return -1;
                      if (b === "") return 1;
                      return a.localeCompare(b, "ru");
                    });
                    return (
                      <div key={section}>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider text-white" style={{ background: "#1A2B4A" }}>
                            {section}
                          </div>
                          <div className="h-px flex-1 bg-border" />
                          <span className="text-xs text-muted-foreground font-bold">{totalDocs} док.</span>
                        </div>
                        <div className="space-y-4">
                          {sortedSubs.map(([sub, docs]) => (
                            <div key={sub || "__no_sub__"}>
                              {sub && (
                                <div className="flex items-center gap-2 mb-2 ml-2">
                                  <div className="w-1 h-4 rounded-full bg-brand-blue-dark/30" />
                                  <span className="text-xs font-bold text-brand-blue-dark/70 uppercase tracking-wider">{sub}</span>
                                  <span className="text-xs text-muted-foreground">— {docs.length} док.</span>
                                </div>
                              )}
                              <div className="grid gap-2 ml-2">
                                {docs.sort((a, b) => a.title.localeCompare(b.title, "ru")).map((item: DocumentItem) => (
                                  <motion.div
                                    layout
                                    key={item.id}
                                    className="bg-card border border-border p-5 rounded-2xl flex items-center justify-between group hover:shadow-md transition-all"
                                  >
                                    <div className="flex items-center gap-4">
                                      <div>
                                        <h3 className="font-bold text-brand-blue-dark">{item.title}</h3>
                                        <p className="text-xs text-muted-foreground line-clamp-1">{item.type} ({item.size})</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button
                                        onClick={() => {
                                          setEditingItem(item);
                                          setUploadFile(null);
                                          setIsModalOpen(true);
                                        }}
                                        className="p-2 hover:bg-brand-blue-dark/10 text-brand-blue-dark rounded-lg transition-colors"
                                      >
                                        <Edit3 className="w-5 h-5" />
                                      </button>
                                      <button
                                        onClick={() => handleDelete(item.id)}
                                        className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                                      >
                                        <Trash2 className="w-5 h-5" />
                                      </button>
                                    </div>
                                  </motion.div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {activeTab === "parents_documents" && filteredParentsDocumentsData.map((item: ParentsDocumentItem) => (
              <motion.div 
                layout
                key={item.id}
                className="bg-card border border-border p-5 rounded-2xl flex items-center justify-between group hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-4">
                  <div>
                    <h3 className="font-bold text-brand-blue-dark">{item.title}</h3>
                    <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold">{item.type} • {item.size}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => { 
                      setEditingItem(item); 
                      setUploadFile(null);
                      setIsModalOpen(true); 
                    }}
                    className="p-2 hover:bg-brand-blue-dark/10 text-brand-blue-dark rounded-lg transition-colors"
                  >
                    <Edit3 className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            ))}

            {activeTab === "schedule-pdf" && (
              <motion.div
                layout
                className="bg-card border border-border p-5 rounded-2xl flex flex-col items-start gap-4"
              >
                <h3 className="font-bold text-brand-blue-dark">Управление PDF-файлом расписания</h3>
                <p className="text-xs text-muted-foreground">Загрузите новый PDF-файл, чтобы обновить расписание на публичной странице. Будет храниться только один файл.</p>
                
                <div
                  onClick={() => scheduleFileRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setScheduleIsDragging(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setScheduleIsDragging(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setScheduleIsDragging(false);
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                      setScheduleUploadFile(e.dataTransfer.files[0]);
                    }
                  }}
                  className={`border-2 border-dashed rounded p-6 text-center cursor-pointer transition-colors w-full ${ 
                    scheduleIsDragging ? "border-foreground/70 bg-secondary" : "border-border hover:border-brand-blue-dark/30"
                  }`}
                >
                  {scheduleUploadFile ? (
                    <div className="flex items-center justify-center gap-2 text-sm">
                      <FileText className="w-4 h-4" />
                      <span className="font-medium truncate max-w-[200px]">{scheduleUploadFile.name}</span>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setScheduleUploadFile(null); }}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (schedulePdfUrl ? (
                    <div className="flex items-center justify-center gap-2 text-sm">
                      <FileText className="w-4 h-4" />
                      <span className="font-medium truncate max-w-[200px]">Текущий файл: {schedulePdfUrl.split('/').pop()}</span>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setScheduleUploadFile(null); setSchedulePdfUrl(null); /* Need to also delete from storage/db */ }}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Нажмите или перетащите PDF файл сюда</p>
                      <p className="text-xs text-muted-foreground mt-1">Только PDF до 10 МБ</p>
                    </>
                  ))}
                </div>
                <input
                  ref={scheduleFileRef}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && file.size > 5 * 1024 * 1024) {
                      alert("Файл слишком большой. Максимальный размер: 5 МБ");
                      e.target.value = "";
                      return;
                    }
                    setScheduleUploadFile(file || null);
                  }}
                />
                {scheduleUploadFile && (
                  <button
                    type="button"
                    onClick={() => handleSubmitSchedulePdf()}
                    disabled={scheduleUploading}
                    className="bg-brand-blue-dark text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:shadow-lg hover:-translate-y-0.5 transition-all w-fit disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {scheduleUploading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Загрузка...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        Загрузить новый PDF
                      </>
                    )}
                  </button>
                )}
                {!scheduleUploadFile && schedulePdfUrl && (
                  <button
                    type="button"
                    onClick={() => handleDeleteSchedulePdf()}
                    className="bg-destructive text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:shadow-lg hover:-translate-y-0.5 transition-all w-fit"
                  >
                    <Trash2 className="w-5 h-5" />
                    Удалить текущий PDF
                  </button>
                )}
              </motion.div>
            )}
          </div>
        )}

        {/* ─── DIRECTOR EDITOR ─── */}
        {activeTab === "director" && (
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Image upload */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="font-black text-brand-blue-dark mb-4 text-lg">Фото директора</h2>
              <div className="flex items-start gap-6">
                <div className="w-40 rounded-xl overflow-hidden border border-border bg-secondary/30 flex-shrink-0 flex items-center justify-center min-h-[60px]">
                  {directorImagePreview ? (
                    <img src={directorImagePreview} alt="Директор" className="w-full h-auto block" />
                  ) : (
                    <div className="w-full h-24 flex items-center justify-center text-muted-foreground text-sm">Нет фото</div>
                  )}
                </div>
                <div className="flex-1">
                  <input
                    ref={directorFileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                          alert("Файл слишком большой. Максимальный размер: 5 МБ");
                          e.target.value = "";
                          return;
                        }
                        setDirectorImageFile(file);
                        setDirectorImagePreview(URL.createObjectURL(file));
                      }
                    }}
                  />
                  <button
                    onClick={() => directorFileRef.current?.click()}
                    className="flex items-center gap-2 px-5 py-3 border-2 border-dashed border-border rounded-xl text-sm font-bold text-muted-foreground hover:border-brand-blue-dark hover:text-brand-blue-dark transition-all"
                  >
                    <Upload className="w-4 h-4" />
                    Загрузить новое фото
                  </button>
                  <p className="text-xs text-muted-foreground mt-2">PNG, JPG до 5 МБ. Рекомендуемое соотношение 4:3.</p>
                </div>
              </div>
            </div>

            {/* Name */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="font-black text-brand-blue-dark mb-4 text-lg">ФИО директора</h2>
              <input
                type="text"
                value={directorForm.name}
                maxLength={10000}
                onChange={(e) => setDirectorForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Фамилия Имя Отчество"
                className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-dark/20 focus:border-brand-blue-dark"
              />
            </div>

            {/* Quotes */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="font-black text-brand-blue-dark mb-4 text-lg">Текст директора</h2>
              <div className="space-y-3">
                {directorForm.quotes.map((q, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <span className="mt-3 text-xs font-bold text-muted-foreground w-5 flex-shrink-0">{i + 1}.</span>
                    <textarea
                      value={q}
                      maxLength={10000}
                      onChange={(e) => {
                        const updated = [...directorForm.quotes];
                        updated[i] = e.target.value;
                        setDirectorForm((f) => ({ ...f, quotes: updated }));
                      }}
                      rows={3}
                      placeholder={`Абзац ${i + 1}...`}
                      className="flex-1 bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-dark/20 focus:border-brand-blue-dark resize-none"
                    />
                    {directorForm.quotes.length > 1 && (
                      <button
                        onClick={() => setDirectorForm((f) => ({ ...f, quotes: f.quotes.filter((_, idx) => idx !== i) }))}
                        className="mt-2 p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-all"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={() => setDirectorForm((f) => ({ ...f, quotes: [...f.quotes, ""] }))}
                className="mt-3 flex items-center gap-2 text-sm font-bold text-brand-blue-dark hover:underline"
              >
                <Plus className="w-4 h-4" />
                Добавить абзац
              </button>
            </div>

            {/* Save */}
            <div className="flex items-center gap-4">
              <button
                onClick={async () => {
                  setDirectorSaving(true);
                  setDirectorSuccess(false);
                  try {
                    let imageUrl = directorForm.image_url;
                    if (directorImageFile) {
                      const ext = directorImageFile.name.split(".").pop();
                      const path = `director/director-${Date.now()}.${ext}`;
                      const { error: upErr } = await supabase.storage
                        .from("news")
                        .upload(path, directorImageFile, { upsert: true });
                      if (upErr) throw upErr;
                      const { data: urlData } = supabase.storage.from("news").getPublicUrl(path);
                      imageUrl = urlData.publicUrl;
                    }
                    const { error } = await supabase
                      .from("director_info")
                      .upsert({ id: 1, name: directorForm.name, quotes: directorForm.quotes.filter(q => q.trim()), image_url: imageUrl });
                    if (error) throw error;
                    setDirectorForm((f) => ({ ...f, image_url: imageUrl }));
                    setDirectorImageFile(null);
                    setDirectorSuccess(true);
                    setTimeout(() => setDirectorSuccess(false), 3000);
                  } catch (err: any) {
                    alert("Ошибка при сохранении: " + err.message);
                  }
                  setDirectorSaving(false);
                }}
                disabled={directorSaving}
                className="bg-brand-blue-dark text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {directorSaving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Сохранить изменения
              </button>
              {directorSuccess && (
                <motion.span
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-sm font-bold text-green-600"
                >
                  ✓ Сохранено успешно!
                </motion.span>
              )}
            </div>
          </div>
        )}

        {/* ─── HOME HERO EDITOR ─── */}
        {activeTab === "home" && (
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Aspect selector */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="font-black text-brand-blue-dark mb-1 text-lg">Формат изображения</h2>
              <p className="text-xs text-muted-foreground mb-4">Определяет, как картинка будет расположена на главной странице</p>
              <div className="grid grid-cols-2 gap-3">
                {(["16:9", "9:16"] as const).map((asp) => (
                  <button
                    key={asp}
                    onClick={() => {
                      if (asp !== heroAspect) {
                        setHeroAspect(asp);
                        // Сбрасываем обрезанный файл — нужно перезагрузить фото под новый формат
                        setHeroImageFile(null);
                        setHeroImagePreview(heroCurrentUrl);
                      }
                    }}
                    className={`relative flex flex-col items-center justify-center gap-3 p-5 rounded-xl border-2 transition-all ${
                      heroAspect === asp
                        ? "border-brand-blue-dark bg-brand-blue-dark/5"
                        : "border-border hover:border-brand-blue-dark/40"
                    }`}
                  >
                    {/* Visual ratio preview */}
                    <div className="flex items-center justify-center" style={{ height: 56 }}>
                      {asp === "16:9" ? (
                        <div className="rounded" style={{ width: 80, height: 45, background: heroAspect === asp ? "#1A2B4A" : "#e2e8f0" }} />
                      ) : (
                        <div className="rounded" style={{ width: 32, height: 56, background: heroAspect === asp ? "#1A2B4A" : "#e2e8f0" }} />
                      )}
                    </div>
                    <div>
                      <p className={`font-black text-base ${heroAspect === asp ? "text-brand-blue-dark" : "text-foreground"}`}>{asp}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {asp === "16:9" ? "Горизонтальное — фото сверху, текст снизу" : "Вертикальное — текст слева, фото справа"}
                      </p>
                    </div>
                    {heroAspect === asp && (
                      <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-brand-blue-dark flex items-center justify-center">
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Image upload */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="font-black text-brand-blue-dark mb-1 text-lg">Фотография</h2>
              <p className="text-xs text-muted-foreground mb-4">
                Будет обрезана по выбранному формату {heroAspect}
              </p>
              {/* Warn if current preview is from old format */}
              {heroCurrentUrl && !heroImageFile && (
                <div className="mb-3 px-3 py-2 rounded-lg bg-yellow-50 border border-yellow-200 text-xs text-yellow-800 font-medium">
                  ⚠ При смене формата загрузите фото заново, чтобы обрезать под {heroAspect}
                </div>
              )}
              <input
                ref={heroFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 5 * 1024 * 1024) {
                    alert("Файл слишком большой. Максимальный размер: 5 МБ");
                    e.target.value = "";
                    return;
                  }
                  // Load as blob URL for cropper
                  const blobUrl = URL.createObjectURL(file);
                  setHeroImageFile(file);
                  setHeroCropImage(blobUrl);
                  setShowHeroCropper(true);
                  // Reset crop
                  setHeroCrop(undefined);
                  setHeroCompletedCrop(undefined);
                  heroCompletedCropRef.current = undefined;
                  if (heroFileRef.current) heroFileRef.current.value = "";
                }}
              />

              {/* Current preview */}
              {heroImagePreview && (
                <div className="mb-4 rounded-xl overflow-hidden border border-border bg-secondary/20">
                  <img
                    src={heroImagePreview}
                    alt="Превью главной"
                    className="w-full h-auto block"
                    style={{ maxHeight: 260, objectFit: "cover" }}
                  />
                </div>
              )}

              <button
                onClick={() => heroFileRef.current?.click()}
                className="flex items-center gap-2 px-5 py-3 border-2 border-dashed border-border rounded-xl text-sm font-bold text-muted-foreground hover:border-brand-blue-dark hover:text-brand-blue-dark transition-all w-full justify-center"
              >
                <Upload className="w-4 h-4" />
                {heroImagePreview ? "Заменить фотографию" : "Загрузить фотографию"}
              </button>
              <p className="text-xs text-muted-foreground mt-2 text-center">PNG, JPG. Рекомендуется высокое разрешение.</p>
            </div>

            {/* Save */}
            <div className="flex items-center gap-4">
              <button
                onClick={async () => {
                  if (!heroImageFile && !heroCurrentUrl) {
                    alert("Сначала загрузите изображение");
                    return;
                  }
                  setHeroSaving(true);
                  setHeroSuccess(false);
                  try {
                    let imageUrl = heroCurrentUrl || "";
                    if (heroImageFile) {
                      const ext = heroImageFile.name.split(".").pop();
                      const path = `hero/hero-${Date.now()}.${ext}`;
                      const { error: upErr } = await supabase.storage
                        .from("news")
                        .upload(path, heroImageFile, { upsert: true });
                      if (upErr) throw upErr;
                      const { data: urlData } = supabase.storage.from("news").getPublicUrl(path);
                      imageUrl = urlData.publicUrl;
                    }
                    // Try update first, then insert if no row exists
                    const { data: updateData, error: updateError } = await supabase
                      .from("site_config")
                      .update({ hero_image_url: imageUrl, hero_aspect: heroAspect })
                      .eq("id", 1)
                      .select();
                    if (updateError) throw updateError;
                    if (!updateData || updateData.length === 0) {
                      const { error: insertError } = await supabase
                        .from("site_config")
                        .insert({ id: 1, hero_image_url: imageUrl, hero_aspect: heroAspect });
                      if (insertError) throw insertError;
                    }
                    setHeroCurrentUrl(imageUrl);
                    setHeroImageFile(null);
                    setHeroSuccess(true);
                    setTimeout(() => setHeroSuccess(false), 3000);
                  } catch (err: any) {
                    alert("Ошибка при сохранении: " + err.message);
                  }
                  setHeroSaving(false);
                }}
                disabled={heroSaving}
                className="bg-brand-blue-dark text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {heroSaving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Сохранить изменения
              </button>
              {heroSuccess && (
                <motion.span
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-sm font-bold text-green-600"
                >
                  ✓ Сохранено успешно!
                </motion.span>
              )}
            </div>
          </div>
        )}

        {activeTab === "students_books" && (
          <StudentsAdmin 
            initialSubTab="books" 
            onSectionChange={setStudentsSection} 
            onEditTextbook={handleEditTextbook}
            onEditUniform={handleEditUniform}
          />
        )}

        {activeTab === "students_activities" && (
          <StudentsAdmin 
            initialSubTab="activities" 
            onEditActivity={handleEditActivity}
          />
        )}

        {/* ─── FAQ EDITOR ─── */}
        {activeTab === "faqs" && (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="font-black text-brand-blue-dark text-lg">Часто задаваемые вопросы</h2>
                  <p className="text-xs text-muted-foreground mt-1">Редактируйте вопросы и ответы для страницы «Родителям»</p>
                </div>
                <button
                  onClick={() => {
                    const maxOrder = faqsData.length > 0 ? Math.max(...faqsData.map(f => f.order_num)) + 1 : 1;
                    setEditingFaq({ id: "new", question: "", answer: "", order_num: maxOrder });
                    setFaqModalOpen(true);
                  }}
                  className="bg-brand-blue-dark text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:shadow-lg hover:-translate-y-0.5 transition-all text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Добавить вопрос
                </button>
              </div>
            </div>

            <div className="grid gap-3">
              {faqsData.map((faq, i) => (
                <motion.div
                  layout
                  key={faq.id}
                  className="bg-card border border-border rounded-2xl p-5 group hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <span className="w-7 h-7 rounded-full bg-brand-blue-dark/10 text-brand-blue-dark text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                        {faq.order_num}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-black text-brand-blue-dark text-sm mb-1">{faq.question}</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{faq.answer}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button
                        onClick={() => { setEditingFaq(faq); setFaqModalOpen(true); }}
                        className="p-2 hover:bg-brand-blue-dark/10 text-brand-blue-dark rounded-lg transition-colors"
                      >
                        <Edit3 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={async () => {
                          if (!confirm(`Удалить вопрос «${faq.question}»?`)) return;
                          const { error } = await supabase.from("faqs").delete().eq("id", faq.id);
                          if (!error) setFaqsData(prev => prev.filter(f => f.id !== faq.id));
                          else alert("Ошибка при удалении: " + error.message);
                        }}
                        className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
              {faqsData.length === 0 && (
                <div className="text-center py-16 text-muted-foreground">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p className="font-bold">Вопросы пока не добавлены</p>
                  <p className="text-sm mt-1">Нажмите «Добавить вопрос», чтобы создать первый</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── CONTACTS EDITOR ─── */}
        {activeTab === "contacts" && (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-2xl p-6">
              <div>
                <h2 className="font-black text-brand-blue-dark text-lg">Справочник контактов</h2>
                <p className="text-xs text-muted-foreground mt-1">Управляйте контактами для страницы «Контакты»</p>
              </div>
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
        )}

      </main>

      {/* ─── CONTACT MODAL ─── */}
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
                    {contactSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Сохранение...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Сохранить
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── FAQ MODAL ─── */}
      <AnimatePresence>
        {faqModalOpen && editingFaq && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setFaqModalOpen(false); setEditingFaq(null); }}
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
                  {editingFaq.id === "new" ? "Новый вопрос" : "Редактировать вопрос"}
                </h2>
                <button onClick={() => { setFaqModalOpen(false); setEditingFaq(null); }} className="p-2 hover:bg-secondary rounded-xl">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-y-auto p-6 space-y-4 flex-1">
                <div>
                  <label className="text-xs font-black text-muted-foreground uppercase tracking-wider mb-1.5 block">Вопрос</label>
                  <input
                    type="text"
                    value={editingFaq.question}
                    maxLength={10000}
                    onChange={(e) => setEditingFaq(f => f ? { ...f, question: e.target.value } : f)}
                    placeholder="Как записаться в школу?..."
                    className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-dark/20 focus:border-brand-blue-dark"
                  />
                </div>

                <div>
                  <label className="text-xs font-black text-muted-foreground uppercase tracking-wider mb-1.5 block">Ответ</label>
                  <textarea
                    value={editingFaq.answer}
                    maxLength={10000}
                    onChange={(e) => setEditingFaq(f => f ? { ...f, answer: e.target.value } : f)}
                    rows={6}
                    placeholder="Подробный ответ на вопрос..."
                    className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-dark/20 focus:border-brand-blue-dark resize-none"
                  />
                </div>
              </div>

              <div className="p-6 border-t border-border flex gap-3 justify-end">
                <button
                  onClick={() => { setFaqModalOpen(false); setEditingFaq(null); }}
                  className="px-5 py-2.5 rounded-xl font-bold border border-border hover:bg-secondary transition-all text-sm"
                >
                  Отмена
                </button>
                <button
                  disabled={faqSaving}
                  onClick={async () => {
                    if (!editingFaq.question.trim()) { alert("Введите вопрос"); return; }
                    if (!editingFaq.answer.trim()) { alert("Введите ответ"); return; }
                    setFaqSaving(true);
                    try {
                      if (editingFaq.id === "new") {
                        const { data, error } = await supabase
                          .from("faqs")
                          .insert([{ question: editingFaq.question.trim(), answer: editingFaq.answer.trim(), order_num: editingFaq.order_num }])
                          .select();
                        if (error) throw error;
                        if (data) setFaqsData(prev => [...prev, data[0] as FaqItem].sort((a, b) => a.order_num - b.order_num));
                      } else {
                        const { data, error } = await supabase
                          .from("faqs")
                          .update({ question: editingFaq.question.trim(), answer: editingFaq.answer.trim(), order_num: editingFaq.order_num })
                          .eq("id", editingFaq.id)
                          .select();
                        if (error) throw error;
                        if (data) setFaqsData(prev => prev.map(f => f.id === editingFaq.id ? data[0] as FaqItem : f).sort((a, b) => a.order_num - b.order_num));
                      }
                      setFaqModalOpen(false);
                      setEditingFaq(null);
                    } catch (err: any) {
                      alert("Ошибка при сохранении: " + err.message);
                    }
                    setFaqSaving(false);
                  }}
                  className="px-8 py-2.5 bg-brand-blue-dark text-white rounded-xl font-bold flex items-center gap-2 hover:shadow-lg transition-all text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {faqSaving ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : <Save className="w-4 h-4" />}
                  Сохранить
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── HERO CROPPER MODAL ─── */}
      <AnimatePresence>
        {showHeroCropper && heroCropImage && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setShowHeroCropper(false); setHeroCropImage(null); setHeroImageFile(null); }}
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-4xl bg-card border border-border rounded-3xl overflow-hidden flex flex-col"
              style={{ maxHeight: "90vh" }}
            >
              {/* Header */}
              <div className="p-5 border-b border-border flex items-center justify-between bg-card shrink-0">
                <div>
                  <h2 className="text-lg font-black text-brand-blue-dark">Обрезка изображения</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Формат {heroAspect} — выберите нужную область</p>
                </div>
                <button onClick={() => { setShowHeroCropper(false); setHeroCropImage(null); setHeroImageFile(null); }} className="p-2 hover:bg-secondary rounded-xl">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Cropper area */}
              <div className="flex-1 min-h-0 overflow-auto flex items-center justify-center bg-neutral-900 p-6">
                <ReactCrop
                  crop={heroCrop}
                  onChange={(c) => setHeroCrop(c)}
                  onComplete={(c) => { heroCompletedCropRef.current = c; setHeroCompletedCrop(c); }}
                  aspect={heroAspect === "16:9" ? 16 / 9 : 9 / 16}
                >
                  <img
                    ref={heroImgRef}
                    src={heroCropImage}
                    alt="Crop source"
                    style={{ display: "block", maxWidth: "100%", maxHeight: "calc(90vh - 220px)", width: "auto", height: "auto" }}
                    onLoad={(e) => {
                      const el = e.currentTarget;
                      const aspect = heroAspect === "16:9" ? 16 / 9 : 9 / 16;
                      const { width, height } = el;
                      const newCrop = centerCrop(makeAspectCrop({ unit: "%", width: 90 }, aspect, width, height), width, height);
                      setHeroCrop(newCrop);
                      const pxX = (newCrop.x / 100) * width;
                      const pxY = (newCrop.y / 100) * height;
                      const pxW = (newCrop.width / 100) * width;
                      const pxH = (newCrop.height / 100) * height;
                      const initial: PixelCrop = { unit: "px", x: pxX, y: pxY, width: pxW, height: pxH };
                      heroCompletedCropRef.current = initial;
                      setHeroCompletedCrop(initial);
                    }}
                  />
                </ReactCrop>
              </div>

              {/* Preview + Actions */}
              <div className="p-5 border-t border-border bg-card flex flex-col sm:flex-row items-center gap-5 shrink-0">
                {/* Inline preview */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-xs font-bold text-muted-foreground uppercase shrink-0">Превью:</span>
                  <div
                    className="rounded-lg overflow-hidden border border-border bg-neutral-900 shrink-0"
                    style={heroAspect === "16:9"
                      ? { width: 160, height: 90 }
                      : { width: 56, height: 100 }
                    }
                  >
                    {heroCompletedCrop && heroImgRef.current && (
                      <PreviewCanvas
                        imgRef={heroImgRef}
                        crop={heroCompletedCrop}
                        aspect={heroAspect === "16:9" ? 16 / 9 : 9 / 16}
                      />
                    )}
                  </div>
                </div>
                <div className="flex gap-3 ml-auto">
                  <button
                    onClick={() => { setShowHeroCropper(false); setHeroCropImage(null); setHeroImageFile(null); }}
                    className="px-5 py-3 rounded-xl font-bold border border-border hover:bg-secondary transition-all text-sm"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        const crop = heroCompletedCropRef.current;
                        if (!crop || !heroImgRef.current) throw new Error("Выберите область");
                        const croppedBlob = await getCroppedImg(heroImgRef.current, crop, false);
                        const file = new File([croppedBlob], `hero-${heroAspect.replace(":", "x")}.jpg`, { type: "image/jpeg" });
                        setHeroImageFile(file);
                        setHeroImagePreview(URL.createObjectURL(croppedBlob));
                        setShowHeroCropper(false);
                        setHeroCropImage(null);
                      } catch (err: any) {
                        alert("Ошибка при обрезке: " + err.message);
                      }
                    }}
                    className="px-6 py-3 bg-brand-blue-dark text-white rounded-xl font-bold flex items-center gap-2 hover:shadow-lg transition-all text-sm"
                  >
                    <Save className="w-4 h-4" />
                    Применить обрезку
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl flex flex-col"
              style={{ maxHeight: "90vh" }}
            >
              <div className="flex items-center justify-between px-8 pt-8 pb-4 flex-shrink-0">
                <h2 className="text-2xl font-black text-brand-blue-dark">
                  {editingItem ? "Редактировать" : "Добавить"}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-secondary rounded-xl">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6 overflow-y-auto px-8 pb-8 flex-1">
                {/* 1. ГАЛЕРЕЯ: СОЗДАНИЕ/РЕДАКТИРОВАНИЕ КОЛЛЕКЦИИ */}
                {activeTab === "gallery" && (editingItem?.id === 'new-collection' || (editingItem && !('url' in editingItem))) && (
                  <>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Название коллекции</label>
                      <input 
                        name="title" 
                        defaultValue={editingItem?.id !== 'new-collection' ? editingItem?.title : ""}
                        placeholder="Например: День Победы 2024"
                        required 
                        className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-blue-dark/20 focus:border-brand-blue-dark"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Описание</label>
                      <textarea
                        name="description"
                        maxLength={10000}
                        defaultValue={editingItem?.id !== 'new-collection' ? (editingItem as any).description : ""}
                        rows={3}
                        placeholder="Краткое описание события..."
                        className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-blue-dark/20 focus:border-brand-blue-dark"
                      />
                    </div>
                  </>
                )}

                {/* 2. ГАЛЕРЕЯ: ДОБАВЛЕНИЕ/РЕДАКТИРОВАНИЕ ФОТО */}
                {activeTab === "gallery" && (editingItem === null || (editingItem && 'url' in editingItem)) && (
                  <>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Название фото (необязательно)</label>
                      <input 
                        name="title" 
                        defaultValue={editingItem?.title}
                        className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-blue-dark/20 focus:border-brand-blue-dark"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Описание (необязательно)</label>
                      <input 
                        name="description" 
                        defaultValue={(editingItem as any)?.description}
                        className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-blue-dark/20 focus:border-brand-blue-dark"
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Изображение</label>
                      {editingItem ? (
                        <div className="relative group rounded-2xl overflow-hidden border border-border bg-secondary/30">
                          <img 
                            src={uploadFile ? URL.createObjectURL(uploadFile) : (editingItem as any).url} 
                            className="w-full h-auto object-contain max-h-64"
                          />
                          <button
                            type="button"
                            onClick={async () => {
                              const originalUrl = (editingItem as any).original_image || (editingItem as any).url;
                              try {
                                const imgSrc = originalFile ? URL.createObjectURL(originalFile) : await fetchAsBlobUrl(originalUrl);
                                setCropImage(imgSrc);
                                setCropAspect(undefined);
                                setShowCropper("gallery");
                              } catch (e) {
                                alert("Не удалось загрузить изображение для кадрирования");
                              }
                            }}
                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-bold text-sm"
                          >
                            <Edit3 className="w-5 h-5" />
                            Изменить область
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => fileRef.current?.click()}
                          className="border-2 border-dashed border-border rounded-2xl p-10 text-center cursor-pointer hover:border-brand-blue-dark/30 transition-colors"
                        >
                          {uploadFile ? (
                            <div className="flex flex-col items-center gap-2">
                              <ImageIcon className="w-8 h-8 text-brand-blue-dark" />
                              <span className="text-sm font-bold text-brand-blue-dark truncate max-w-[200px]">{uploadFile.name}</span>
                            </div>
                          ) : (
                            <>
                              <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                              <p className="text-sm font-bold text-muted-foreground">Нажмите или перетащите фото</p>
                            </>
                          )}
                        </div>
                      )}
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 5 * 1024 * 1024) {
                              alert("Файл слишком большой. Максимальный размер: 5 МБ");
                              e.target.value = "";
                              return;
                            }
                            setOriginalFile(file);
                            setCropImage(URL.createObjectURL(file));
                            setCropAspect(undefined);
                            setShowCropper("gallery");
                          }
                        }}
                      />
                    </div>
                  </>
                )}

                {/* 3. НОВОСТИ: ОБЩИЙ ЗАГОЛОВОК (ТОЛЬКО ДЛЯ НОВОСТЕЙ) */}
                { activeTab === "news" && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Заголовок</label>
                    <input 
                      name="title" 
                      defaultValue={editingItem?.title} 
                      required 
                      className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-blue-dark/20 focus:border-brand-blue-dark"
                    />
                  </div>
                )}

                {/* 4. НОВОСТИ: СОДЕРЖАНИЕ И ФОТО */}
                {activeTab === "news" && (
                  <>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Текст новости</label>
                      <textarea
                        name="text"
                        maxLength={10000}
                        defaultValue={(editingItem as any)?.text}
                        required
                        rows={4}
                        className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-blue-dark/20 focus:border-brand-blue-dark"
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Изображение новости (для превью)</label>
                      {editingItem ? (
                        <div className="relative group rounded-2xl overflow-hidden border border-border aspect-video bg-secondary/30">
                          <img 
                            src={uploadFile ? URL.createObjectURL(uploadFile) : (editingItem as any).image} 
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={async () => {
                              const originalUrl = (editingItem as any).original_image || (editingItem as any).image;
                              const imgSrc = originalFile ? URL.createObjectURL(originalFile) : await fetchAsBlobUrl(originalUrl);
                              setCropImage(imgSrc);
                              setCropAspect(16 / 9);
                              setShowCropper("news");
                            }}
                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-bold text-sm"
                          >
                            <Edit3 className="w-5 h-5" />
                            Изменить область
                          </button>
                        </div>
                      ) : (
                        <>
                          <div
                            onClick={() => newsFileRef.current?.click()}
                            className="border-2 border-dashed border-border rounded p-6 text-center cursor-pointer hover:border-brand-blue-dark/30 transition-colors"
                          >
                            {uploadFile ? (
                              <div className="flex items-center justify-center gap-2 text-sm">
                                <ImageIcon className="w-4 h-4" />
                                <span className="font-medium truncate max-w-[200px]">{uploadFile.name}</span>
                              </div>
                            ) : (
                              <>
                                <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                                <p className="text-sm text-muted-foreground">Нажмите или перетащите изображение</p>
                              </>
                            )}
                          </div>
                          <input
                            ref={newsFileRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                if (file.size > 5 * 1024 * 1024) {
                                  alert("Файл слишком большой. Максимальный размер: 5 МБ");
                                  e.target.value = "";
                                  return;
                                }
                                setOriginalFile(file);
                                setCropImage(URL.createObjectURL(file));
                                setCropAspect(16 / 9);
                                setShowCropper("news");
                              }
                            }}
                          />
                        </>
                      )}
                    </div>

                    {/* Дополнительные фотографии новости */}
                    <div className="space-y-4">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Дополнительные фотографии</label>
                      <div className="border-2 border-dashed border-border rounded-xl p-4">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          id="news-additional-images"
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            if (files.length > 0) {
                              const validFiles = files.filter(file => {
                                if (file.size > 10 * 1024 * 1024) {
                                  alert(`Файл ${file.name} слишком большой. Максимальный размер: 5 МБ`);
                                  return false;
                                }
                                return true;
                              });
                              setNewsAdditionalImages(prev => [...prev, ...validFiles]);
                              const previews = validFiles.map(file => URL.createObjectURL(file));
                              setNewsAdditionalImagePreviews(prev => [...prev, ...previews]);
                            }
                            e.target.value = "";
                          }}
                        />
                        <label
                          htmlFor="news-additional-images"
                          className="cursor-pointer flex flex-col items-center justify-center gap-2 py-4 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Upload className="w-6 h-6" />
                          <p className="text-sm">Нажмите для выбора дополнительных фотографий</p>
                        </label>
                      </div>

                      {/* Уже сохранённые дополнительные фотографии */}
                      {editingItem && existingAdditionalImages.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Текущие доп. фото ({existingAdditionalImages.length})</p>
                          <div className="grid grid-cols-3 gap-2">
                            {existingAdditionalImages.map((url: string, index: number) => (
                              <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-border group/img">
                                <img src={url} alt={`Доп. фото ${index + 1}`} className="w-full h-full object-cover" />
                                <button
                                  type="button"
                                  onClick={() => setExistingAdditionalImages(prev => prev.filter((_, i) => i !== index))}
                                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors opacity-0 group-hover/img:opacity-100"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground italic">Нажмите ✕ на фото, чтобы удалить. Добавьте новые фото ниже.</p>
                        </div>
                      )}

                      {/* Превью дополнительных фотографий */}
                      {newsAdditionalImagePreviews.length > 0 && (
                        <div className="grid grid-cols-3 gap-2">
                          {newsAdditionalImagePreviews.map((preview, index) => (
                            <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-border">
                              <img src={preview} alt={`Доп. фото ${index + 1}`} className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => {
                                  setNewsAdditionalImages(prev => prev.filter((_, i) => i !== index));
                                  setNewsAdditionalImagePreviews(prev => prev.filter((_, i) => i !== index));
                                }}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}



                {(activeTab === "documents" || activeTab === "parents_documents") && editingItem === null && (
                  <>
                    {activeTab === "documents" && (() => {
                      const selectedSectionObj = documentSections.find(s => s.title === formSelectedSection);
                      const filteredSubsections = selectedSectionObj
                        ? documentSubsections.filter(sub => sub.section_id === selectedSectionObj.id)
                        : [];
                      return (
                        <>
                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                              Раздел <span className="normal-case text-muted-foreground/60 font-normal">(для группировки)</span>
                            </label>
                            <select
                              name="section"
                              value={formSelectedSection}
                              onChange={(e) => setFormSelectedSection(e.target.value)}
                              className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-blue-dark/20 focus:border-brand-blue-dark"
                            >
                              <option value="">— Без раздела —</option>
                              {documentSections.map((sec) => (
                                <option key={sec.id} value={sec.title}>{sec.title}</option>
                              ))}
                            </select>
                            {documentSections.length === 0 && (
                              <p className="text-xs text-muted-foreground">
                                Нет разделов.{" "}
                                <button
                                  type="button"
                                  onClick={() => { setIsModalOpen(false); setShowSectionManager(true); }}
                                  className="text-brand-blue-dark font-bold hover:underline"
                                >
                                  Создайте раздел
                                </button>{" "}
                                перед добавлением документа.
                              </p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                              Подраздел <span className="normal-case text-muted-foreground/60 font-normal">(необязательно)</span>
                            </label>
                            <select
                              name="subsection"
                              disabled={!formSelectedSection}
                              className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-blue-dark/20 focus:border-brand-blue-dark disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <option value="">— Без подраздела —</option>
                              {filteredSubsections.map((sub) => (
                                <option key={sub.id} value={sub.title}>{sub.title}</option>
                              ))}
                            </select>
                            {formSelectedSection && filteredSubsections.length === 0 && (
                              <p className="text-xs text-muted-foreground">
                                У этого раздела нет подразделов.{" "}
                                <button
                                  type="button"
                                  onClick={() => { setIsModalOpen(false); setShowSectionManager(true); }}
                                  className="text-brand-blue-dark font-bold hover:underline"
                                >
                                  Создайте подраздел
                                </button>
                              </p>
                            )}
                          </div>
                        </>
                      );
                    })()}
                    <div>
                      <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider">
                        Файл
                      </label>
                      <div
                        onClick={() => fileRef.current?.click()}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsDragging(true);
                        }}
                        onDragLeave={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsDragging(false);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsDragging(false);
                          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                            setUploadFile(e.dataTransfer.files[0]);
                          }
                        }}
                        className={`border-2 border-dashed rounded p-6 text-center cursor-pointer transition-colors ${
                          isDragging ? "border-foreground/70 bg-secondary" : "border-border hover:border-brand-blue-dark/30"
                        }`}
                      >
                        {uploadFile ? (
                          <div className="flex items-center justify-center gap-2 text-sm">
                            <FileText className="w-4 h-4" />
                            <span className="font-medium truncate max-w-[200px]">{uploadFile.name}</span>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setUploadFile(null); }}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">Нажмите или перетащите файл сюда</p>
                            <p className="text-xs text-muted-foreground mt-1">PDF, DOC, XLS до 15 МБ</p>
                          </>
                        )}
                      </div>
                      <input
                        ref={fileRef}
                        type="file"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file && file.size > 15 * 1024 * 1024) {
                            alert("Файл слишком большой. Максимальный размер: 15 МБ");
                            e.target.value = "";
                            return;
                          }
                          setUploadFile(file || null);
                        }}
                      />
                    </div>
                  </>
                )}
                {activeTab === "documents" && editingItem !== null && (() => {
                  const editSection = (editingItem as DocumentItem).section || "";
                  const editSectionObj = documentSections.find(s => s.title === editSection);
                  const filteredSubsections = editSectionObj
                    ? documentSubsections.filter(sub => sub.section_id === editSectionObj.id)
                    : [];
                  return (
                    <>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Раздел <span className="normal-case text-muted-foreground/60 font-normal">(для группировки)</span>
                        </label>
                        <select
                          name="section"
                          defaultValue={(editingItem as DocumentItem).section || ""}
                          onChange={(e) => {
                            setEditingItem({ ...(editingItem as DocumentItem), section: e.target.value, subsection: "" });
                          }}
                          className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-blue-dark/20 focus:border-brand-blue-dark"
                        >
                          <option value="">— Без раздела —</option>
                          {documentSections.map((sec) => (
                            <option key={sec.id} value={sec.title}>{sec.title}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Подраздел <span className="normal-case text-muted-foreground/60 font-normal">(необязательно)</span>
                        </label>
                        <select
                          name="subsection"
                          defaultValue={(editingItem as DocumentItem).subsection || ""}
                          disabled={!editSection}
                          className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-blue-dark/20 focus:border-brand-blue-dark disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <option value="">— Без подраздела —</option>
                          {filteredSubsections.map((sub) => (
                            <option key={sub.id} value={sub.title}>{sub.title}</option>
                          ))}
                        </select>
                        {editSection && filteredSubsections.length === 0 && (
                          <p className="text-xs text-muted-foreground">
                            У этого раздела нет подразделов.{" "}
                            <button
                              type="button"
                              onClick={() => { setIsModalOpen(false); setShowSectionManager(true); }}
                              className="text-brand-blue-dark font-bold hover:underline"
                            >
                              Создайте подраздел
                            </button>
                          </p>
                        )}
                      </div>
                    </>
                  );
                })()}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-brand-blue-dark text-white font-bold py-4 rounded-2xl shadow-lg hover:shadow-brand-blue-dark/20 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Сохранение...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Сохранить
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Crop Modal */}
      <AnimatePresence>
        {showCropper !== null && cropImage && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-6xl bg-card border border-border rounded-3xl overflow-hidden h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b border-border flex items-center justify-between bg-card relative z-10">
                <div>
                  <h2 className="text-xl font-black text-brand-blue-dark">Настройка области изображения</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    {showCropper === "news" ? "Выберите область для новости" : "Выберите область для галереи"}
                  </p>
                </div>
                <button
                  onClick={() => { setShowCropper(null); setCropImage(null); }}
                  className="p-2 hover:bg-secondary rounded-xl"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-neutral-900">
                <div className="flex-1 flex flex-col min-h-0">
                  {/* Пресеты соотношений */}
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 flex-wrap shrink-0">
                    <span className="text-xs text-white/40 uppercase font-bold mr-1">Формат:</span>
                    {([
                      { label: "16:9",     value: 16 / 9 },
                      { label: "4:3",      value: 4 / 3 },
                      { label: "3:2",      value: 3 / 2 },
                      { label: "1:1",      value: 1 },
                      { label: "3:4",      value: 3 / 4 },
                      { label: "9:16",     value: 9 / 16 },
                      { label: "Свободно", value: undefined as number | undefined },
                    ] as { label: string; value: number | undefined }[]).map(({ label, value }) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => {
                          setCropAspect(value);
                          initCropForAspect(value);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                          cropAspect === value
                            ? "bg-brand-blue-dark text-white border-brand-blue-dark"
                            : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10"
                        }`}
                      >
                        {label}
                        {label === "Свободно" && cropAspect === undefined && completedCrop && completedCrop.width > 0 && completedCrop.height > 0 && (
                          <span className="ml-1 opacity-70">
                            {(() => {
                              const scaleX = imgNaturalSize.w / (imgRef.current?.width ?? imgNaturalSize.w);
                              const scaleY = imgNaturalSize.h / (imgRef.current?.height ?? imgNaturalSize.h);
                              const pw = Math.round(completedCrop.width * scaleX);
                              const ph = Math.round(completedCrop.height * scaleY);
                              const g = (a: number, b: number): number => b === 0 ? a : g(b, a % b);
                              const d = g(pw, ph);
                              return `(${pw/d}:${ph/d})`;
                            })()}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Кроппер */}
                  <div className="flex-1 min-h-0 overflow-auto flex items-center justify-center" style={{ padding: "24px 32px" }}>
                    <ReactCrop
                      crop={crop}
                      onChange={(c) => setCrop(c)}
                      onComplete={(c) => { completedCropRef.current = c; setCompletedCrop(c); }}
                      aspect={cropAspect}
                    >
                      <img
                        ref={imgRef}
                        src={cropImage}
                        alt="Crop source"
                        style={{ display: "block", maxWidth: "100%", maxHeight: "calc(90vh - 240px)", width: "auto", height: "auto", objectFit: "contain" }}
                        onLoad={(e) => {
                          const el = e.currentTarget;
                          setImgNaturalSize({ w: el.naturalWidth, h: el.naturalHeight });
                          const { width, height } = el;
                          const aspect = cropAspect;
                          let newCrop: RicCrop;
                          if (aspect) {
                            newCrop = centerCrop(makeAspectCrop({ unit: "%", width: 90 }, aspect, width, height), width, height);
                          } else {
                            newCrop = { unit: "%", x: 5, y: 5, width: 90, height: 90 };
                          }
                          setCrop(newCrop);
                          // Сразу вычисляем пиксельный completedCrop, чтобы сохранение работало без движения рамки
                          const pxX = (newCrop.x / 100) * width;
                          const pxY = (newCrop.y / 100) * height;
                          const pxW = (newCrop.width / 100) * width;
                          const pxH = (newCrop.height / 100) * height;
                          const initialPixelCrop: PixelCrop = { unit: "px", x: pxX, y: pxY, width: pxW, height: pxH };
                          completedCropRef.current = initialPixelCrop;
                          setCompletedCrop(initialPixelCrop);
                        }}
                      />
                    </ReactCrop>
                  </div>
                </div>

                {/* Preview Sidebar — только для новостей */}
                {showCropper === "news" && (
                  <div className="w-full lg:w-80 bg-card p-6 overflow-y-auto border-l border-border flex flex-col gap-8">
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Предпросмотр</h3>
                      <div className="relative aspect-video rounded-xl overflow-hidden bg-neutral-900 border border-border shadow-inner">
                        {completedCrop && imgRef.current && (
                          <PreviewCanvas
                            imgRef={imgRef}
                            crop={completedCrop}
                            aspect={cropAspect ?? (completedCrop.width / completedCrop.height)}
                          />
                        )}

                      </div>
                      <p className="text-[10px] text-muted-foreground leading-relaxed italic text-center">Так новость будет выглядеть при полном открытии.</p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Миниатюра (1:1)</h3>
                        <label className="flex items-center gap-2 cursor-pointer group">
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={isSquareMax}
                              onChange={(e) => setIsSquareMax(e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-8 h-4 bg-secondary border border-border rounded-full peer peer-checked:bg-brand-blue-dark transition-colors"></div>
                            <div className="absolute left-1 top-1 w-2 h-2 bg-muted-foreground rounded-full peer-checked:translate-x-4 peer-checked:bg-white transition-transform"></div>
                          </div>
                          <span className="text-[10px] font-bold text-muted-foreground group-hover:text-brand-blue-dark transition-colors uppercase">Макс. область</span>
                        </label>
                      </div>
                      <div className="flex justify-center">
                        <div className="relative w-32 h-32 rounded-2xl overflow-hidden bg-neutral-900 border border-border shadow-md">
                          {completedCrop && imgRef.current && (
                            <PreviewCanvas
                              imgRef={imgRef}
                              crop={completedCrop}
                              aspect={1}
                              isSquareMax={isSquareMax}
                            />
                          )}
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-relaxed italic text-center px-2">
                        {isSquareMax ? "Максимально возможная область по центру." : "Центрируется автоматически."}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-border bg-card relative z-10">
                <div className="flex items-center gap-6">
                  <div className="flex gap-3 ml-auto">
                    <button
                      onClick={() => { setShowCropper(null); setCropImage(null); }}
                      className="px-6 py-3 rounded-xl font-bold border border-border hover:bg-secondary transition-all"
                    >
                      Отмена
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          const crop = completedCropRef.current;
                          if (!crop || !imgRef.current) throw new Error("Выберите область");
                          if (showCropper === "gallery") {
                            const croppedBlob = await getCroppedImg(imgRef.current, crop, false);
                            const file = new File([croppedBlob], "gallery-image.jpg", { type: "image/jpeg" });
                            setUploadFile(file);
                          } else {
                            const mainBlob = await getCroppedImg(imgRef.current, crop, false);
                            const mainFile = new File([mainBlob], "news-main.jpg", { type: "image/jpeg" });

                            const previewBlob = await getCroppedImg(imgRef.current, crop, isSquareMax);
                            const previewFile = new File([previewBlob], "news-preview.jpg", { type: "image/jpeg" });

                            setUploadFile(mainFile);
                            (window as any)._pendingPreviewFile = previewFile;
                          }
                          setShowCropper(null);
                          setCropImage(null);
                        } catch (e: any) {
                          console.error(e);
                          alert("Ошибка при обработке изображения: " + (e.message || e));
                        }
                      }}
                      className="px-8 py-3 bg-brand-blue-dark text-white rounded-xl font-bold shadow-lg hover:shadow-brand-blue-dark/20 transition-all flex items-center gap-2"
                    >
                      <Save className="w-5 h-5" />
                      Сохранить результат
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Section Manager Modal */}
      <AnimatePresence>
        {showSectionManager && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setShowSectionManager(false); setSectionSearch(""); }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-brand-blue-dark">Разделы и подразделы</h2>
                <button onClick={() => { setShowSectionManager(false); setSectionSearch(""); }} className="p-2 hover:bg-secondary rounded-xl">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tab switcher: Разделы / Подразделы */}
              {(() => {
                const isSectionTab = !(sectionSearch.startsWith("__sub__"));
                const activeList = isSectionTab ? documentSections : documentSubsections;
                const setActiveList = isSectionTab
                  ? (fn: (prev: DocumentSection[]) => DocumentSection[]) => setDocumentSections(fn)
                  : (fn: (prev: DocumentSection[]) => DocumentSection[]) => setDocumentSubsections(fn);
                const dbTable = isSectionTab ? "document_sections" : "document_subsections";
                const rawSearch = isSectionTab ? sectionSearch : sectionSearch.replace("__sub__", "");

                return (
                  <>
                    <div className="flex gap-2 mb-5 bg-secondary/50 rounded-xl p-1">
                      <button
                        type="button"
                        onClick={() => { setSectionSearch(""); setNewSubSectionId(""); setNewSectionTitle(""); }}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${isSectionTab ? "bg-card shadow text-brand-blue-dark" : "text-muted-foreground hover:text-foreground"}`}
                      >
                        Разделы
                      </button>
                      <button
                        type="button"
                        onClick={() => { setSectionSearch("__sub__"); setNewSectionTitle(""); }}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${!isSectionTab ? "bg-card shadow text-brand-blue-dark" : "text-muted-foreground hover:text-foreground"}`}
                      >
                        Подразделы
                      </button>
                    </div>

                    {/* Create input */}
                    <div className="space-y-2 mb-4">
                      {!isSectionTab && (
                        <select
                          value={newSubSectionId}
                          onChange={(e) => setNewSubSectionId(e.target.value)}
                          className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-dark/20 focus:border-brand-blue-dark"
                        >
                          <option value="">— Выберите раздел —</option>
                          {documentSections.map((sec) => (
                            <option key={sec.id} value={sec.id}>{sec.title}</option>
                          ))}
                        </select>
                      )}
                      <div className="flex gap-2">
                        <input
                          value={newSectionTitle}
                          onChange={(e) => setNewSectionTitle(e.target.value)}
                          placeholder={isSectionTab ? "Название нового раздела..." : "Название нового подраздела..."}
                          className="flex-1 bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-dark/20 focus:border-brand-blue-dark"
                          onKeyDown={async (e) => {
                            if (e.key === "Enter" && newSectionTitle.trim()) {
                              if (!isSectionTab && !newSubSectionId) { alert("Выберите раздел для подраздела"); return; }
                              const payload = isSectionTab
                                ? { title: newSectionTitle.trim() }
                                : { title: newSectionTitle.trim(), section_id: newSubSectionId };
                              const { data, error } = await supabase.from(dbTable).insert([payload]).select();
                              if (!error && data) {
                                setActiveList((prev) => [...prev, data[0] as DocumentSection].sort((a, b) => a.title.localeCompare(b.title, "ru")));
                                setNewSectionTitle("");
                              } else if (error) { alert("Ошибка: " + error.message); }
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            if (!newSectionTitle.trim()) return;
                            if (!isSectionTab && !newSubSectionId) { alert("Выберите раздел для подраздела"); return; }
                            const payload = isSectionTab
                              ? { title: newSectionTitle.trim() }
                              : { title: newSectionTitle.trim(), section_id: newSubSectionId };
                            const { data, error } = await supabase.from(dbTable).insert([payload]).select();
                            if (!error && data) {
                              setActiveList((prev) => [...prev, data[0] as DocumentSection].sort((a, b) => a.title.localeCompare(b.title, "ru")));
                              setNewSectionTitle("");
                            } else if (error) { alert("Ошибка: " + error.message); }
                          }}
                          className="px-4 py-2.5 bg-brand-blue-dark text-white rounded-xl font-bold hover:bg-brand-blue-dark/80 transition-all flex items-center gap-1"
                        >
                          <Plus className="w-4 h-4" />
                          Создать
                        </button>
                      </div>
                    </div>

                    {/* Search */}
                    {activeList.length > 0 && (
                      <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          type="text"
                          placeholder={isSectionTab ? "Поиск по разделам..." : "Поиск по подразделам..."}
                          value={rawSearch}
                          onChange={(e) => setSectionSearch(isSectionTab ? e.target.value : "__sub__" + e.target.value)}
                          className="w-full pl-9 pr-4 py-2.5 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-dark/20 focus:border-brand-blue-dark"
                        />
                      </div>
                    )}

                    {/* List */}
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {activeList.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          {isSectionTab ? "Разделов пока нет. Создайте первый!" : "Подразделов пока нет. Создайте первый!"}
                        </p>
                      ) : (
                        (() => {
                          const filteredList = rawSearch
                            ? activeList.filter((s) => s.title.toLowerCase().includes(rawSearch.toLowerCase()))
                            : activeList;
                          if (filteredList.length === 0) return <p className="text-sm text-muted-foreground text-center py-6">Ничего не найдено</p>;
                          return filteredList.map((item) => {
                            const parentSection = !isSectionTab && item.section_id
                              ? documentSections.find(s => s.id === item.section_id)
                              : null;
                            return (
                              <div
                                key={item.id}
                                className="flex items-center justify-between bg-secondary/50 border border-border rounded-xl px-4 py-3 group hover:bg-brand-blue-dark/5 hover:border-brand-blue-dark/30 transition-all"
                              >
                                <div className="min-w-0">
                                  <span className="text-sm font-bold text-brand-blue-dark block truncate">{item.title}</span>
                                  {parentSection && (
                                    <span className="text-xs text-muted-foreground truncate block">в разделе: {parentSection.title}</span>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (isSectionTab) {
                                      const docsInSection = documentsData.filter((d) => (d.section || "").trim() === item.title.trim());
                                      if (docsInSection.length > 0) {
                                        if (!confirm(`В разделе "${item.title}" есть ${docsInSection.length} документ(ов). Продолжить?`)) return;
                                      } else {
                                        if (!confirm(`Удалить раздел "${item.title}"?`)) return;
                                      }
                                    } else {
                                      const docsInSub = documentsData.filter((d) => (d.subsection || "").trim() === item.title.trim());
                                      if (docsInSub.length > 0) {
                                        if (!confirm(`В подразделе "${item.title}" есть ${docsInSub.length} документ(ов). Продолжить?`)) return;
                                      } else {
                                        if (!confirm(`Удалить подраздел "${item.title}"?`)) return;
                                      }
                                    }
                                    const { error } = await supabase.from(dbTable).delete().eq("id", item.id);
                                    if (!error) {
                                      setActiveList((prev) => prev.filter((s) => s.id !== item.id));
                                    } else { alert("Ошибка при удалении: " + error.message); }
                                  }}
                                  className="p-1.5 opacity-0 group-hover:opacity-100 bg-transparent hover:bg-destructive/10 text-destructive rounded-lg transition-all ml-2 shrink-0"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            );
                          });
                        })()
                      )}
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Textbook Modal */}
      <AnimatePresence>
        {textbookModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setTextbookModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between px-8 pt-8 pb-4 flex-shrink-0">
                <h2 className="text-2xl font-black text-brand-blue-dark">
                  {textbookEditId ? "Редактировать учебник" : "Добавить учебник"}
                </h2>
                <button onClick={() => setTextbookModalOpen(false)} className="p-2 hover:bg-secondary rounded-xl">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!textbookForm.subject.trim() || !textbookForm.author.trim()) return;
                if (textbookEditId) {
                  await supabase.from("textbooks").update(textbookForm).eq("id", textbookEditId);
                } else {
                  await supabase.from("textbooks").insert([textbookForm]);
                }
                setTextbookForm({ subject: "", author: "", year: new Date().getFullYear(), grade_label: "1 класс" });
                setTextbookEditId(null);
                setTextbookModalOpen(false);
                window.location.reload();
              }} className="space-y-6 overflow-y-auto px-8 pb-8 flex-1">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Класс</label>
                  <select
                    value={textbookForm.grade_label}
                    onChange={(e) => setTextbookForm({ ...textbookForm, grade_label: e.target.value })}
                    className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-blue-dark/20 focus:border-brand-blue-dark"
                  >
                    {["1 класс", "2 класс", "3 класс", "4 класс", "5 класс", "6 класс", "7 класс", "8 класс", "9 класс", "10 класс", "11 класс"].map((grade) => (
                      <option key={grade} value={grade}>{grade}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Предмет</label>
                  <input
                    type="text"
                    value={textbookForm.subject}
                    onChange={(e) => setTextbookForm({ ...textbookForm, subject: e.target.value })}
                    placeholder="Например: Математика"
                    required
                    className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-blue-dark/20 focus:border-brand-blue-dark"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Автор / издательство</label>
                  <input
                    type="text"
                    value={textbookForm.author}
                    onChange={(e) => setTextbookForm({ ...textbookForm, author: e.target.value })}
                    placeholder="Например: Моро М.И."
                    required
                    className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-blue-dark/20 focus:border-brand-blue-dark"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Год издания</label>
                  <input
                    type="number"
                    value={textbookForm.year}
                    onChange={(e) => setTextbookForm({ ...textbookForm, year: Number(e.target.value) })}
                    placeholder="2024"
                    required
                    className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-blue-dark/20 focus:border-brand-blue-dark"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setTextbookModalOpen(false)}
                    className="flex-1 px-6 py-3 rounded-xl font-bold border border-border hover:bg-secondary transition-all"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-brand-blue-dark text-white rounded-xl font-bold shadow-lg hover:shadow-brand-blue-dark/20 transition-all flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    {textbookEditId ? "Сохранить" : "Добавить"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Uniform Modal */}
      <AnimatePresence>
        {uniformModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setUniformModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between px-8 pt-8 pb-4 flex-shrink-0">
                <h2 className="text-2xl font-black text-brand-blue-dark">
                  {uniformEditId ? "Редактировать карточку" : "Добавить карточку"}
                </h2>
                <button onClick={() => setUniformModalOpen(false)} className="p-2 hover:bg-secondary rounded-xl">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!uniformForm.grade_label.trim() || !uniformForm.description.trim()) return;
                const { data: cardsData } = await supabase.from("uniform_cards").select("*").order("sort_order");
                const cards = (cardsData as any[]) || [];
                if (uniformEditId) {
                  await supabase.from("uniform_cards").update(uniformForm).eq("id", uniformEditId);
                } else {
                  const maxOrder = cards.reduce((m, c) => Math.max(m, c.sort_order), -1);
                  await supabase.from("uniform_cards").insert([{ ...uniformForm, sort_order: maxOrder + 1 }]);
                }
                setUniformForm({ grade_label: "", description: "" });
                setUniformEditId(null);
                setUniformModalOpen(false);
                window.location.reload();
              }} className="space-y-6 overflow-y-auto px-8 pb-8 flex-1">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Заголовок</label>
                  <input
                    type="text"
                    value={uniformForm.grade_label}
                    onChange={(e) => setUniformForm({ ...uniformForm, grade_label: e.target.value })}
                    placeholder="Например: 1–4 классы"
                    required
                    className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-blue-dark/20 focus:border-brand-blue-dark"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Описание формы</label>
                  <textarea
                    value={uniformForm.description}
                    onChange={(e) => setUniformForm({ ...uniformForm, description: e.target.value })}
                    placeholder="Описание школьной формы..."
                    required
                    rows={3}
                    className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-blue-dark/20 focus:border-brand-blue-dark resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setUniformModalOpen(false)}
                    className="flex-1 px-6 py-3 rounded-xl font-bold border border-border hover:bg-secondary transition-all"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-brand-blue-dark text-white rounded-xl font-bold shadow-lg hover:shadow-brand-blue-dark/20 transition-all flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    {uniformEditId ? "Сохранить" : "Добавить"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Activity Modal */}
      <AnimatePresence>
        {activityModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActivityModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between px-8 pt-8 pb-4 flex-shrink-0">
                <h2 className="text-2xl font-black text-brand-blue-dark">
                  {activityEditId ? "Редактировать кружок" : "Добавить кружок"}
                </h2>
                <button onClick={() => setActivityModalOpen(false)} className="p-2 hover:bg-secondary rounded-xl">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!activityForm.title.trim() || !activityForm.section_id) return;
                setActivitySaving(true);
                try {
                  let activityId: string | null = null;
                  if (activityEditId) {
                    await supabase.from("activities").update({ title: activityForm.title, section_id: activityForm.section_id }).eq("id", activityEditId);
                    activityId = activityEditId;
                  } else {
                    const maxOrder = (await supabase.from("activities").select("sort_order").eq("section_id", activityForm.section_id)).data?.reduce((m: number, a: any) => Math.max(m, a.sort_order), -1) || -1;
                    const { data } = await supabase.from("activities").insert([{ section_id: activityForm.section_id, title: activityForm.title, sort_order: maxOrder + 1 }]).select();
                    activityId = data?.[0]?.id || null;
                  }

                  // Save schedule
                  if (activityId && activityForm.scheduleDays.length > 0) {
                    await supabase.from("activity_schedules").delete().eq("activity_id", activityId);
                    const rows = activityForm.scheduleDays.map((d) => ({ activity_id: activityId, day_of_week: d, time: activityForm.scheduleTime }));
                    await supabase.from("activity_schedules").insert(rows);
                  }

                  setActivityForm({ section_id: "", title: "", scheduleDays: [], scheduleTime: "15:00" });
                  setActivityEditId(null);
                  setActivityModalOpen(false);
                  window.location.reload();
                } catch (error) {
                  alert("Ошибка при сохранении кружка");
                  setActivitySaving(false);
                }
              }} className="space-y-6 overflow-y-auto px-8 pb-8 flex-1">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Раздел</label>
                  <select
                    value={activityForm.section_id}
                    onChange={(e) => setActivityForm({ ...activityForm, section_id: e.target.value })}
                    required
                    className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-blue-dark/20 focus:border-brand-blue-dark"
                  >
                    <option value="">Выберите раздел</option>
                    {activitySections.map((section) => (
                      <option key={section.id} value={section.id}>{section.title}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Название кружка или секции</label>
                  <input
                    type="text"
                    value={activityForm.title}
                    onChange={(e) => setActivityForm({ ...activityForm, title: e.target.value })}
                    placeholder="Например: Футбол"
                    required
                    className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-blue-dark/20 focus:border-brand-blue-dark"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Дни недели</label>
                  <div className="flex gap-2 flex-wrap">
                    {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((day, idx) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => {
                          const days = activityForm.scheduleDays.includes(idx)
                            ? activityForm.scheduleDays.filter((d) => d !== idx)
                            : [...activityForm.scheduleDays, idx];
                          setActivityForm({ ...activityForm, scheduleDays: days });
                        }}
                        className={`w-11 h-11 rounded-xl text-sm font-bold transition-all border ${
                          activityForm.scheduleDays.includes(idx)
                            ? "bg-[#2D6FD4] text-white border-[#2D6FD4] shadow-lg"
                            : "bg-card border-border text-muted-foreground hover:border-[#2D6FD4]"
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Время начала</label>
                  <input
                    type="time"
                    value={activityForm.scheduleTime}
                    onChange={(e) => setActivityForm({ ...activityForm, scheduleTime: e.target.value })}
                    className="bg-card border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6FD4]/20 focus:border-[#2D6FD4]"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setActivityModalOpen(false)}
                    className="flex-1 px-6 py-3 rounded-xl font-bold border border-border hover:bg-secondary transition-all"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={activitySaving}
                    className="flex-1 px-6 py-3 bg-brand-blue-dark text-white rounded-xl font-bold shadow-lg hover:shadow-brand-blue-dark/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Save className="w-5 h-5" />
                    {activitySaving ? "Сохранение..." : activityEditId ? "Сохранить" : "Добавить"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Activity Section Manager Modal */}
      <AnimatePresence>
        {showActivitySectionManager && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setShowActivitySectionManager(false); setActivitySectionSearch(""); setActivitySectionEditId(null); setActivitySectionEditTitle(""); }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-brand-blue-dark">Разделы</h2>
                <button onClick={() => { setShowActivitySectionManager(false); setActivitySectionSearch(""); setActivitySectionEditId(null); setActivitySectionEditTitle(""); }} className="p-2 hover:bg-secondary rounded-xl">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Create/Edit input */}
              <div className="space-y-2 mb-4">
                <div className="flex gap-2">
                  <input
                    value={activitySectionEditId ? activitySectionEditTitle : newActivitySectionTitle}
                    onChange={(e) => {
                      if (activitySectionEditId) {
                        setActivitySectionEditTitle(e.target.value);
                      } else {
                        setNewActivitySectionTitle(e.target.value);
                      }
                    }}
                    placeholder={activitySectionEditId ? "Редактирование раздела..." : "Название нового раздела..."}
                    className="flex-1 bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-dark/20 focus:border-brand-blue-dark"
                    onKeyDown={async (e) => {
                      const title = activitySectionEditId ? activitySectionEditTitle : newActivitySectionTitle;
                      if (e.key === "Enter" && title.trim()) {
                        if (activitySectionEditId) {
                          const { error } = await supabase.from("activity_sections").update({ title: title.trim() }).eq("id", activitySectionEditId);
                          if (!error) {
                            setActivitySections((prev: any[]) => prev.map((s) => s.id === activitySectionEditId ? { ...s, title: title.trim() } : s));
                            setActivitySectionEditId(null);
                            setActivitySectionEditTitle("");
                          } else if (error) { alert("Ошибка: " + error.message); }
                        } else {
                          const { data, error } = await supabase.from("activity_sections").insert([{ title: title.trim(), sort_order: 0 }]).select();
                          if (!error && data) {
                            setActivitySections((prev: any[]) => [...prev, data[0]].sort((a, b) => a.title.localeCompare(b.title, "ru")));
                            setNewActivitySectionTitle("");
                          } else if (error) { alert("Ошибка: " + error.message); }
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      const title = activitySectionEditId ? activitySectionEditTitle : newActivitySectionTitle;
                      if (!title.trim()) return;
                      if (activitySectionEditId) {
                        const { error } = await supabase.from("activity_sections").update({ title: title.trim() }).eq("id", activitySectionEditId);
                        if (!error) {
                          setActivitySections((prev: any[]) => prev.map((s) => s.id === activitySectionEditId ? { ...s, title: title.trim() } : s));
                          setActivitySectionEditId(null);
                          setActivitySectionEditTitle("");
                        } else if (error) { alert("Ошибка: " + error.message); }
                      } else {
                        const { data, error } = await supabase.from("activity_sections").insert([{ title: title.trim(), sort_order: 0 }]).select();
                        if (!error && data) {
                          setActivitySections((prev: any[]) => [...prev, data[0]].sort((a, b) => a.title.localeCompare(b.title, "ru")));
                          setNewActivitySectionTitle("");
                        } else if (error) { alert("Ошибка: " + error.message); }
                      }
                    }}
                    className="px-4 py-2.5 bg-brand-blue-dark text-white rounded-xl font-bold hover:bg-brand-blue-dark/80 transition-all flex items-center gap-1"
                  >
                    {activitySectionEditId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {activitySectionEditId ? "Сохранить" : "Создать"}
                  </button>
                  {activitySectionEditId && (
                    <button
                      type="button"
                      onClick={() => { setActivitySectionEditId(null); setActivitySectionEditTitle(""); }}
                      className="px-4 py-2.5 border border-border rounded-xl font-bold hover:bg-secondary transition-all"
                    >
                      Отмена
                    </button>
                  )}
                </div>
              </div>

              {/* Search */}
              {activitySections.length > 0 && (
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Поиск по разделам..."
                    value={activitySectionSearch}
                    onChange={(e) => setActivitySectionSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-dark/20 focus:border-brand-blue-dark"
                  />
                </div>
              )}

              {/* List */}
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {activitySections.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Разделов пока нет. Создайте первый!</p>
                ) : (
                  (() => {
                    const filteredList = activitySectionSearch
                      ? activitySections.filter((s: any) => s.title.toLowerCase().includes(activitySectionSearch.toLowerCase()))
                      : activitySections;
                    if (filteredList.length === 0) return <p className="text-sm text-muted-foreground text-center py-6">Ничего не найдено</p>;
                    return filteredList.map((item: any) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between bg-secondary/50 border border-border rounded-xl px-4 py-3 group hover:bg-brand-blue-dark/5 hover:border-brand-blue-dark/30 transition-all"
                      >
                        <span className="text-sm font-bold text-brand-blue-dark block truncate">{item.title}</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={async () => {
                              if (!confirm(`Удалить раздел "${item.title}"? Все кружки в этом разделе также будут удалены.`)) return;
                              await supabase.from("activity_sections").delete().eq("id", item.id);
                              setActivitySections((prev: any[]) => prev.filter((s) => s.id !== item.id));
                            }}
                            className="p-1.5 opacity-0 group-hover:opacity-100 bg-transparent hover:bg-destructive/10 text-destructive rounded-lg transition-all ml-2 shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ));
                  })()
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}