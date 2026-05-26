import { supabase } from "../../../lib/supabase";

interface UseDeleteHandlersProps {
  activeTab: string;
  setNewsData: React.Dispatch<React.SetStateAction<any[]>>;
  setGalleryData: React.Dispatch<React.SetStateAction<any[]>>;
  setDocumentsData: React.Dispatch<React.SetStateAction<any[]>>;
  setParentsDocumentsData: React.Dispatch<React.SetStateAction<any[]>>;
}

export function useDeleteHandlers({
  activeTab,
  setNewsData,
  setGalleryData,
  setDocumentsData,
  setParentsDocumentsData,
}: UseDeleteHandlersProps) {
  const handleDelete = async (id: string) => {
    if (!confirm("Вы уверены, что хотите удалить этот элемент?")) return;
    const { error } = await supabase.from(activeTab).delete().eq("id", id);
    if (!error) {
      if (activeTab === "news") {
        setNewsData((prev) => prev.filter((item: any) => item.id !== id));
      } else if (activeTab === "gallery") {
        setGalleryData((prev) => prev.filter((item: any) => item.id !== id));
      } else if (activeTab === "documents") {
        setDocumentsData((prev) => prev.filter((item: any) => item.id !== id));
      } else if (activeTab === "parents_documents") {
        setParentsDocumentsData((prev) => prev.filter((item: any) => item.id !== id));
      }
    }
  };

  return { handleDelete };
}
