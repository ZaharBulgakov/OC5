import { useEffect } from "react";
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

interface DocumentSection {
  id: string;
  title: string;
  section_id?: string;
  created_at: string;
}

interface UseDashboardDataProps {
  activeTab: string;
  setLoading: (loading: boolean) => void;
  setCollectionsData: (data: GalleryCollection[]) => void;
  setGalleryData: (data: GalleryItem[]) => void;
  setNewsData: (data: NewsItem[]) => void;
  setDocumentsData: (data: DocumentItem[]) => void;
  setDocumentSections: (data: DocumentSection[]) => void;
  setDocumentSubsections: (data: DocumentSection[]) => void;
  setParentsDocumentsData: (data: ParentsDocumentItem[]) => void;
}

export function useDashboardData({
  activeTab,
  setLoading,
  setCollectionsData,
  setGalleryData,
  setNewsData,
  setDocumentsData,
  setDocumentSections,
  setDocumentSubsections,
  setParentsDocumentsData,
}: UseDashboardDataProps) {
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

    setLoading(false);
  };

  useEffect(() => {
    fetchDataInternal();
  }, [activeTab]);

  return { fetchDataInternal };
}
