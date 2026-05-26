import { useState } from "react";

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

export function useDashboardState() {
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
  const [formSelectedSection, setFormSelectedSection] = useState<string>("");
  const [parentsDocumentsData, setParentsDocumentsData] = useState<ParentsDocumentItem[]>([]);
  const [schedulePdfUrl, setSchedulePdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<NewsItem | GalleryItem | DocumentItem | ParentsDocumentItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [uploadForm, setUploadForm] = useState({ title: "", type: "", size: "" });
  const [isDragging, setIsDragging] = useState(false);

  return {
    newsData,
    setNewsData,
    newsAdditionalImages,
    setNewsAdditionalImages,
    newsAdditionalImagePreviews,
    setNewsAdditionalImagePreviews,
    existingAdditionalImages,
    setExistingAdditionalImages,
    submitting,
    setSubmitting,
    galleryData,
    setGalleryData,
    collectionsData,
    setCollectionsData,
    selectedCollection,
    setSelectedCollection,
    documentsData,
    setDocumentsData,
    documentSections,
    setDocumentSections,
    documentSubsections,
    setDocumentSubsections,
    showSectionManager,
    setShowSectionManager,
    formSelectedSection,
    setFormSelectedSection,
    parentsDocumentsData,
    setParentsDocumentsData,
    schedulePdfUrl,
    setSchedulePdfUrl,
    loading,
    setLoading,
    isModalOpen,
    setIsModalOpen,
    editingItem,
    setEditingItem,
    searchQuery,
    setSearchQuery,
    uploadFile,
    setUploadFile,
    originalFile,
    setOriginalFile,
    uploadForm,
    setUploadForm,
    isDragging,
    setIsDragging,
  };
}
