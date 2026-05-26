import { useMemo } from "react";
import { motion } from "motion/react";
import { Edit3, Trash2 } from "lucide-react";

export interface DocumentItem {
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

export interface ParentsDocumentItem {
  id: string;
  title: string;
  description: string;
  type: string;
  size: string;
  url: string;
  created_at: string;
}

interface DocumentsManagerProps {
  documentsData: DocumentItem[];
  parentsDocumentsData: ParentsDocumentItem[];
  searchQuery: string;
  onEditItem: (item: DocumentItem | ParentsDocumentItem) => void;
  onDeleteItem: (id: string) => void;
}

export default function DocumentsManager({
  documentsData,
  parentsDocumentsData,
  searchQuery,
  onEditItem,
  onDeleteItem
}: DocumentsManagerProps) {
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
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [parentsDocumentsData, searchQuery]);

  return (
    <>
      {/* Documents Section */}
      {(() => {
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

      {/* Parents Documents Section */}
      {filteredParentsDocumentsData.map((item: ParentsDocumentItem) => (
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
