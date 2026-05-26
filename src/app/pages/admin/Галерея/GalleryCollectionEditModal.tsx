interface GalleryCollection {
  id: string;
  title: string;
  description?: string;
}

interface GalleryCollectionEditModalProps {
  editingItem: GalleryCollection | null;
}

export default function GalleryCollectionEditModal({ editingItem }: GalleryCollectionEditModalProps) {
  return (
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
  );
}
