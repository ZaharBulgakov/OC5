import { useMemo } from "react";
import { motion } from "motion/react";
import { Edit3, Trash2 } from "lucide-react";

export interface NewsItem {
  id: string;
  title: string;
  text: string;
  image: string;
  preview_image?: string;
  original_image?: string;
  additional_images?: string[];
  created_at: string;
}

interface NewsEditorProps {
  newsData: NewsItem[];
  searchQuery: string;
  onEditItem: (item: NewsItem) => void;
  onDeleteItem: (id: string) => void;
}

export default function NewsEditor({
  newsData,
  searchQuery,
  onEditItem,
  onDeleteItem
}: NewsEditorProps) {
  const filteredNewsData = useMemo(() => {
    if (!searchQuery) return newsData;
    return newsData.filter(item => 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.text.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [newsData, searchQuery]);

  return (
    <>
      {filteredNewsData.map((item: NewsItem) => (
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
              onClick={() => onEditItem(item)} 
              className="p-2 hover:bg-brand-blue-dark/10 text-brand-blue-dark rounded-lg transition-colors"
            >
              <Edit3 className="w-5 h-5" />
            </button>
            <button 
              onClick={() => onDeleteItem(item.id)}
              className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      ))}
    </>
  );
}
