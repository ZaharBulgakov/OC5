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
  ArrowRight
} from "lucide-react";
import { useNavigate } from "react-router";
import ReactCrop, { type Crop as RicCrop, type PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

interface NewsItem {
  id: string;
  title: string;
  text: string;
  image: string;
  preview_image?: string;
  original_image?: string;
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
  category?: string; // Категория теперь опциональна, так как мы ее удалили из UI
  type: string;
  size: string;
  date: string;
  url?: string; // Добавляем URL для ссылки на файл
  created_at: string;
}

interface ParentsDocumentItem {
  id: string;
  title: string;
  desc?: string;
  type: string;
  size: string;
  url: string;
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

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<"news" | "gallery" | "documents" | "parents_documents" | "schedule-pdf">("news");
  const [newsData, setNewsData] = useState<NewsItem[]>([]);
  const [galleryData, setGalleryData] = useState<GalleryItem[]>([]);
  const [collectionsData, setCollectionsData] = useState<GalleryCollection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<GalleryCollection | null>(null);
  const [documentsData, setDocumentsData] = useState<DocumentItem[]>([]);
  const [parentsDocumentsData, setParentsDocumentsData] = useState<ParentsDocumentItem[]>([]);
  const [schedulePdfUrl, setSchedulePdfUrl] = useState<string | null>(null);
  const [scheduleUploadFile, setScheduleUploadFile] = useState<File | null>(null);
  const [scheduleIsDragging, setScheduleIsDragging] = useState(false);
  const scheduleFileRef = useRef<HTMLInputElement>(null);
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
  const navigate = useNavigate();

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

  const addWatermark = async (file: Blob): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject("Could not get canvas context");

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const fontSize = Math.max(20, img.width / 20);
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
        ctx.textAlign = "left";
        ctx.textBaseline = "bottom";

        const padding = 20;
        const line1 = "ОЦ";
        const line2 = "№5";
        
        ctx.fillText(line1, padding, canvas.height - padding - fontSize);
        ctx.fillText(line2, padding, canvas.height - padding);

        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject("Canvas to Blob failed");
        }, "image/jpeg");
      };
      img.onerror = reject;
    });
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

  const filteredDocumentsData = useMemo(() => {
    if (!searchQuery) return documentsData;
    return documentsData.filter(item => 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.type.toLowerCase().includes(searchQuery.toLowerCase())
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
      } else if (activeTab === "parents_documents") {
        setParentsDocumentsData(data as ParentsDocumentItem[] || []);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDataInternal();
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
          return;
        } catch (err: any) {
          alert("Ошибка при создании коллекции: " + err.message);
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

          itemData = {
            ...itemData,
            image: mainUrlData.publicUrl,
            preview_image: previewUrl,
            original_image: originalUrl
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
        setUploadForm({ title: "", type: "", size: "" });
      } catch (error: any) {
        console.error("Supabase error:", error);
        alert("Ошибка при сохранении: " + (error.message || "Неизвестная ошибка"));
      }
    };

  const handleSubmitSchedulePdf = async () => {
    if (!scheduleUploadFile) {
      alert("Пожалуйста, выберите PDF-файл для загрузки.");
      return;
    }

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

        <nav className="flex-1 space-y-2">
          {[
            { id: "news", label: "Новости", icon: Newspaper },
            { id: "gallery", label: "Галерея", icon: ImageIcon },
            { id: "documents", label: "Документы", icon: FileText },
            { id: "parents_documents", label: "Родителям", icon: Users },
            { id: "schedule-pdf", label: "Расписание PDF", icon: Calendar },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab.id 
                  ? "bg-brand-blue-dark text-white shadow-lg shadow-brand-blue-dark/20" 
                  : "text-muted-foreground hover:bg-secondary"
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
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
              {activeTab === "news" ? "Новости" : activeTab === "gallery" ? "Галерея" : activeTab === "documents" ? "Документы" : activeTab === "parents_documents" ? "Родителям" : "Расписание PDF"}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">Управление содержимым раздела</p>
          </div>
          <div className="relative w-full sm:w-auto">
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
          </div>
          <button 
            onClick={() => { 
              if (activeTab === "gallery" && !selectedCollection) {
                setEditingItem({ id: 'new-collection' } as any);
              } else {
                setEditingItem(null); 
              }
              setUploadFile(null);
              setOriginalFile(null);
              setIsModalOpen(true); 
            }}
            className="bg-brand-blue-dark text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:shadow-lg hover:-translate-y-0.5 transition-all w-fit"
          >
            <Plus className="w-5 h-5" />
            {activeTab === "gallery" ? (selectedCollection ? "Добавить фото" : "Создать коллекцию") : "Добавить запись"}
          </button>
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
                    className="bg-card border border-border p-6 rounded-3xl cursor-pointer group hover:border-brand-blue-dark transition-all hover:shadow-xl relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-blue-dark/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform" />
                    <div className="relative z-10">
                      <div className="w-12 h-12 bg-brand-blue-dark/10 text-brand-blue-dark rounded-2xl flex items-center justify-center mb-4 group-hover:bg-brand-blue-dark group-hover:text-white transition-colors">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                      <h3 className="text-lg font-black text-brand-blue-dark mb-1">{coll.title}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-4">
                        {coll.description || "Нет описания"}
                      </p>
                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/50">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground">
                          {galleryData.filter(i => i.collection_id === coll.id).length} фото
                        </span>
                        <div className="flex gap-1">
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

            {activeTab === "documents" && filteredDocumentsData.map((item: DocumentItem) => (
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
                  onChange={(e) => setScheduleUploadFile(e.target.files?.[0] || null)}
                />
                {scheduleUploadFile && (
                  <button
                    type="button"
                    onClick={() => handleSubmitSchedulePdf()}
                    className="bg-brand-blue-dark text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:shadow-lg hover:-translate-y-0.5 transition-all w-fit"
                  >
                    <Save className="w-5 h-5" />
                    Загрузить новый PDF
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
      </main>

      {/* Modal */}
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
              className="relative w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl p-8"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black text-brand-blue-dark">
                  {editingItem ? "Редактировать" : "Добавить"}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-secondary rounded-xl">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
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
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Название фото</label>
                      <input 
                        name="title" 
                        defaultValue={editingItem?.title}
                        required 
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

                {/* 3. НОВОСТИ: ОБЩИЙ ЗАГОЛОВОК (ТОЛЬКО ДЛЯ НОВОСТЕЙ И ДОКУМЕНТОВ) */}
                { (activeTab === "news" || ((activeTab === "documents" || activeTab === "parents_documents") && editingItem !== null)) && (
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
                        defaultValue={(editingItem as any)?.text}
                        required 
                        rows={4}
                        className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-blue-dark/20 focus:border-brand-blue-dark"
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Изображение новости</label>
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
                  </>
                )}



                {(activeTab === "documents" || activeTab === "parents_documents") && editingItem === null && (
                  <>
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
                            <p className="text-xs text-muted-foreground mt-1">PDF, DOC, XLS до 20 МБ</p>
                          </>
                        )}
                      </div>
                      <input
                        ref={fileRef}
                        type="file"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png"
                        className="hidden"
                        onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                      />
                    </div>
                  </>
                )}
                {(activeTab === "documents" || activeTab === "parents_documents") && editingItem !== null && (
                  <>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Заголовок</label>
                      <input
                        name="title"
                        defaultValue={(editingItem as any).title}
                        required
                        className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-blue-dark/20 focus:border-brand-blue-dark"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Тип (PDF/DOC)</label>
                      <input
                        name="type"
                        defaultValue={(editingItem as any).type || "PDF"}
                        required
                        className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-blue-dark/20 focus:border-brand-blue-dark"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Размер</label>
                      <input
                        name="size"
                        defaultValue={(editingItem as any).size}
                        required
                        className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-blue-dark/20 focus:border-brand-blue-dark"
                      />
                    </div>
                  </>
                )}

                <button 
                  type="submit" 
                  className="w-full bg-brand-blue-dark text-white font-bold py-4 rounded-2xl shadow-lg hover:shadow-brand-blue-dark/20 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  Сохранить
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
                        <div className="absolute bottom-2 left-2 flex flex-col text-[10px] font-black text-white/80 leading-none drop-shadow-md pointer-events-none">
                          <span>ОЦ</span>
                          <span>№5</span>
                        </div>
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
                            const watermarkedBlob = await addWatermark(croppedBlob);
                            const file = new File([watermarkedBlob], "gallery-image.jpg", { type: "image/jpeg" });
                            setUploadFile(file);
                          } else {
                            const mainBlob = await getCroppedImg(imgRef.current, crop, false);
                            const watermarkedMainBlob = await addWatermark(mainBlob);
                            const mainFile = new File([watermarkedMainBlob], "news-main.jpg", { type: "image/jpeg" });

                            const previewBlob = await getCroppedImg(imgRef.current, crop, isSquareMax);
                            const watermarkedPreviewBlob = await addWatermark(previewBlob);
                            const previewFile = new File([watermarkedPreviewBlob], "news-preview.jpg", { type: "image/jpeg" });

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
    </div>
  );
}