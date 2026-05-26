import { supabase } from "../../../lib/supabase";

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

interface UseSubmitHandlerProps {
  activeTab: string;
  editingItem: NewsItem | GalleryItem | DocumentItem | ParentsDocumentItem | null;
  uploadFile: File | null;
  originalFile: File | null;
  newsAdditionalImages: File[];
  existingAdditionalImages: string[];
  selectedCollection: GalleryCollection | null;
  uploadForm: { title: string; type: string; size: string };
  onSetCollectionsData: (setter: (prev: GalleryCollection[]) => GalleryCollection[]) => void;
  onSetGalleryData: (setter: (prev: GalleryItem[]) => GalleryItem[]) => void;
  onSetNewsData: (setter: (prev: NewsItem[]) => NewsItem[]) => void;
  onSetDocumentsData: (setter: (prev: DocumentItem[]) => DocumentItem[]) => void;
  onSetParentsDocumentsData: (setter: (prev: ParentsDocumentItem[]) => ParentsDocumentItem[]) => void;
  onSetIsModalOpen: (open: boolean) => void;
  onSetEditingItem: (item: any) => void;
  onSetSubmitting: (submitting: boolean) => void;
  onSetUploadFile: (file: File | null) => void;
  onSetOriginalFile: (file: File | null) => void;
  onSetNewsAdditionalImages: (images: File[]) => void;
  onSetNewsAdditionalImagePreviews: (previews: string[]) => void;
  onSetExistingAdditionalImages: (images: string[]) => void;
  onSetUploadForm: (form: { title: string; type: string; size: string }) => void;
}

export function useSubmitHandler({
  activeTab,
  editingItem,
  uploadFile,
  originalFile,
  newsAdditionalImages,
  existingAdditionalImages,
  selectedCollection,
  uploadForm,
  onSetCollectionsData,
  onSetGalleryData,
  onSetNewsData,
  onSetDocumentsData,
  onSetParentsDocumentsData,
  onSetIsModalOpen,
  onSetEditingItem,
  onSetSubmitting,
  onSetUploadFile,
  onSetOriginalFile,
  onSetNewsAdditionalImages,
  onSetNewsAdditionalImagePreviews,
  onSetExistingAdditionalImages,
  onSetUploadForm,
}: UseSubmitHandlerProps) {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSetSubmitting(true);
    const formData = new FormData(e.currentTarget);
    let itemData: any = Object.fromEntries(formData.entries());

    if (activeTab === "gallery" && editingItem?.id === 'new-collection') {
      try {
        const { data, error } = await supabase
          .from("gallery_collections")
          .insert([{ title: itemData.title, description: itemData.description }])
          .select();
        if (error) throw error;
        if (data) onSetCollectionsData((prev: GalleryCollection[]) => [data[0], ...prev]);
        onSetIsModalOpen(false);
        onSetEditingItem(null);
        onSetSubmitting(false);
        return;
      } catch (err: any) {
        alert("Ошибка при создании коллекции: " + err.message);
        onSetSubmitting(false);
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
        if (data) onSetCollectionsData((prev: GalleryCollection[]) => prev.map((c: GalleryCollection) => c.id === editingItem.id ? data[0] : c));
        onSetIsModalOpen(false);
        onSetEditingItem(null);
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
            if (orgStorageError) throw orgStorageError;
            const { data: orgUrlData } = supabase.storage.from('gallery').getPublicUrl(orgStorageData.path);
            finalOriginalUrl = orgUrlData.publicUrl;
          }
        }

        itemData = {
          ...itemData,
          url: finalImageUrl,
          original_image: finalOriginalUrl,
          collection_id: selectedCollection?.id || null,
          collection: selectedCollection?.title || "",
        };

        const { data: response, error } = await supabase
          .from("gallery")
          .update(itemData)
          .eq("id", editingItem!.id)
          .select();

        if (error) throw error;
        const updatedItem = response ? response[0] : null;
        onSetGalleryData((prev: GalleryItem[]) => prev.map((item: GalleryItem) => (item.id === editingItem!.id ? updatedItem as GalleryItem : item)));
        onSetIsModalOpen(false);
        onSetEditingItem(null);
        onSetUploadFile(null);
        onSetOriginalFile(null);
      } catch (err: any) {
        alert("Ошибка при сохранении: " + err.message);
      } finally {
        onSetSubmitting(false);
      }
      return;
    }

    if (activeTab === "news" && (uploadFile || editingItem)) {
      try {
        const timestamp = Date.now();
        let mainUrlData: any;
        let previewUrl: any;
        let originalUrl: any;

        if (uploadFile) {
          const sanitizedMainName = `news-main-${timestamp}-${uploadFile.name.replace(/[^a-zA-Z0-9.]/g, "-").toLowerCase()}`;
          const { data: mainStorageData, error: mainStorageError } = await supabase.storage
            .from('news')
            .upload(`public/${sanitizedMainName}`, uploadFile, { cacheControl: '3600', upsert: false });
          if (mainStorageError) throw mainStorageError;
          mainUrlData = supabase.storage.from('news').getPublicUrl(mainStorageData.path);

          const sanitizedPreviewName = `news-preview-${timestamp}-${uploadFile.name.replace(/[^a-zA-Z0-9.]/g, "-").toLowerCase()}`;
          const { data: previewStorageData, error: previewStorageError } = await supabase.storage
            .from('news')
            .upload(`public/${sanitizedPreviewName}`, uploadFile, { cacheControl: '3600', upsert: false });
          if (!previewStorageError) {
            previewUrl = supabase.storage.from('news').getPublicUrl(previewStorageData.path);
          }

          if (originalFile) {
            const sanitizedOrgName = `news-org-${timestamp}-${originalFile.name.replace(/[^a-zA-Z0-9.]/g, "-").toLowerCase()}`;
            const { data: orgStorageData, error: orgStorageError } = await supabase.storage
              .from('news')
              .upload(`public/${sanitizedOrgName}`, originalFile, { cacheControl: '3600', upsert: false });
            if (!orgStorageError) {
              originalUrl = supabase.storage.from('news').getPublicUrl(orgStorageData.path);
            }
          }
        }

        let additionalImageUrls: string[] = [];
        if (newsAdditionalImages.length > 0) {
          for (const file of newsAdditionalImages) {
            const sanitizedAdditionalName = `news-additional-${timestamp}-${file.name.replace(/[^a-zA-Z0-9.]/g, "-").toLowerCase()}`;
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
          additionalImageUrls = [...existingAdditionalImages, ...additionalImageUrls];
        } else {
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
      
      const sanitizedFileName = uploadFile.name.replace(/[^a-zA-Z0-9.]/g, "-").toLowerCase();

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
          .select();
        
        if (error) throw error;
        updatedItem = response ? response[0] : null;

        if (activeTab === "news") {
          onSetNewsData((prev: NewsItem[]) => prev.map((item: NewsItem) => (item.id === editingItem.id ? updatedItem as NewsItem : item)));
        } else if (activeTab === "gallery") {
          onSetGalleryData((prev: GalleryItem[]) => prev.map((item: GalleryItem) => (item.id === editingItem.id ? updatedItem as GalleryItem : item)));
        } else if (activeTab === "documents") {
          onSetDocumentsData((prev: DocumentItem[]) => prev.map((item: DocumentItem) => (item.id === editingItem.id ? updatedItem as DocumentItem : item)));
        } else if (activeTab === "parents_documents") {
          onSetParentsDocumentsData((prev: ParentsDocumentItem[]) => prev.map((item: ParentsDocumentItem) => (item.id === editingItem.id ? updatedItem as ParentsDocumentItem : item)));
        }

      } else {
        const { data: response, error } = await supabase
          .from(activeTab)
          .insert([itemData])
          .select();
        
        if (error) throw error;
        updatedItem = response ? response[0] : null;

        if (updatedItem) {
          if (activeTab === "news") {
            onSetNewsData((prev: NewsItem[]) => [updatedItem as NewsItem, ...prev]);
          } else if (activeTab === "gallery") {
            onSetGalleryData((prev: GalleryItem[]) => [updatedItem as GalleryItem, ...prev]);
          } else if (activeTab === "documents") {
            onSetDocumentsData((prev: DocumentItem[]) => [updatedItem as DocumentItem, ...prev]);
          } else if (activeTab === "parents_documents") {
            onSetParentsDocumentsData((prev: ParentsDocumentItem[]) => [updatedItem as ParentsDocumentItem, ...prev]);
          }
        }
      }
      onSetIsModalOpen(false);
      onSetEditingItem(null);
      onSetUploadFile(null);
      onSetOriginalFile(null);
      onSetNewsAdditionalImages([]);
      onSetNewsAdditionalImagePreviews([]);
      onSetExistingAdditionalImages([]);
      onSetUploadForm({ title: "", type: "", size: "" });
    } catch (error: any) {
      console.error("Supabase error:", error);
      alert("Ошибка при сохранении: " + (error.message || "Неизвестная ошибка"));
    } finally {
      onSetSubmitting(false);
    }
  };

  return { handleSubmit };
}
