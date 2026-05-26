import { supabase } from "../../../lib/supabase";

interface UseGalleryHandlersProps {
  setCollectionsData: React.Dispatch<React.SetStateAction<any[]>>;
  selectedCollection: any;
  setSelectedCollection: React.Dispatch<React.SetStateAction<any>>;
}

export function useGalleryHandlers({
  setCollectionsData,
  selectedCollection,
  setSelectedCollection,
}: UseGalleryHandlersProps) {
  const handleDeleteCollection = async (id: string) => {
    if (!confirm("Вы уверены, что хотите удалить эту коллекцию? Все фотографии внутри также будут удалены.")) return;
    
    // 1. Delete all images in this collection
    await supabase.from("gallery").delete().eq("collection_id", id);
    
    // 2. Delete collection itself
    const { error } = await supabase.from("gallery_collections").delete().eq("id", id);
    
    if (!error) {
      setCollectionsData((prev: any[]) => prev.filter((c: any) => c.id !== id));
      if (selectedCollection?.id === id) setSelectedCollection(() => null);
    }
  };

  return { handleDeleteCollection };
}
