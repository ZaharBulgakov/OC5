import { useMemo } from "react";
import { motion } from "motion/react";
import { Edit3, Trash2, ImageIcon, ArrowRight } from "lucide-react";

export interface GalleryItem {
  id: string;
  title: string;
  url: string;
  collection: string;
  collection_id?: string;
  description: string;
  original_image?: string;
  created_at: string;
}

export interface GalleryCollection {
  id: string;
  title: string;
  description?: string;
  created_at: string;
}

interface GalleryManagerProps {
  galleryData: GalleryItem[];
  collectionsData: GalleryCollection[];
  searchQuery: string;
  selectedCollection: GalleryCollection | null;
  onSetSelectedCollection: (collection: GalleryCollection | null) => void;
  onEditItem: (item: GalleryItem | GalleryCollection) => void;
  onDeleteItem: (id: string) => void;
  onDeleteCollection: (id: string) => void;
}

export default function GalleryManager({
  galleryData,
  collectionsData,
  searchQuery,
  selectedCollection,
  onSetSelectedCollection,
  onEditItem,
  onDeleteItem,
  onDeleteCollection
}: GalleryManagerProps) {
  const filteredCollectionsData = useMemo(() => {
    if (!searchQuery) return collectionsData;
    return collectionsData.filter(item => 
      item.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [collectionsData, searchQuery]);

  const filteredGalleryData = useMemo(() => {
    if (!selectedCollection) return galleryData;
    return galleryData.filter(item => item.collection_id === selectedCollection.id);
  }, [galleryData, selectedCollection]);

  if (selectedCollection) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => onSetSelectedCollection(null)}
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
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2 pointer-events-none">
                <p className="text-white truncate" style={{ fontFamily: "Arial, sans-serif", fontWeight: 700, fontSize: "16px" }}>{item.title}</p>
              </div>
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button 
                  onClick={() => onEditItem(item)}
                  className="p-2 bg-white/20 hover:bg-white/40 text-white rounded-lg backdrop-blur-md transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => onDeleteItem(item.id)}
                  className="p-2 bg-destructive/20 hover:bg-destructive/40 text-white rounded-lg backdrop-blur-md transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredCollectionsData.map((coll) => (
        <motion.div
          layout
          key={coll.id}
          onClick={() => onSetSelectedCollection(coll)}
          className="bg-card border border-border rounded-3xl cursor-pointer group hover:border-brand-blue-dark transition-all hover:shadow-xl relative overflow-hidden"
        >
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
                    onEditItem(coll);
                  }}
                  className="p-2 hover:bg-brand-blue-dark/10 text-brand-blue-dark rounded-lg transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteCollection(coll.id);
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
  );
}
