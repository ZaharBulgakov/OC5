import { FileText, Upload, X } from "lucide-react";

interface DocumentItem {
  id: string;
  title: string;
  url: string;
  section?: string;
  subsection?: string;
}

interface DocumentSection {
  id: string;
  title: string;
  section_id?: string;
}

interface DocumentsEditModalProps {
  activeTab: "documents" | "parents_documents";
  editingItem: DocumentItem | null;
  documentSections: DocumentSection[];
  documentSubsections: DocumentSection[];
  formSelectedSection: string;
  uploadFile: File | null;
  isDragging: boolean;
  fileRef: React.RefObject<HTMLInputElement | null>;
  onSetFormSelectedSection: (section: string) => void;
  onSetEditingItem: (item: DocumentItem) => void;
  onSetIsModalOpen: (open: boolean) => void;
  onSetShowSectionManager: (show: boolean) => void;
  onSetUploadFile: (file: File | null) => void;
  onSetIsDragging: (dragging: boolean) => void;
}

export default function DocumentsEditModal({
  activeTab,
  editingItem,
  documentSections,
  documentSubsections,
  formSelectedSection,
  uploadFile,
  isDragging,
  fileRef,
  onSetFormSelectedSection,
  onSetEditingItem,
  onSetIsModalOpen,
  onSetShowSectionManager,
  onSetUploadFile,
  onSetIsDragging,
}: DocumentsEditModalProps) {
  const selectedSectionObj = documentSections.find(s => s.title === formSelectedSection);
  const filteredSubsections = selectedSectionObj
    ? documentSubsections.filter(sub => sub.section_id === selectedSectionObj.id)
    : [];

  const editSection = editingItem ? (editingItem as DocumentItem).section || "" : "";
  const editSectionObj = documentSections.find(s => s.title === editSection);
  const editFilteredSubsections = editSectionObj
    ? documentSubsections.filter(sub => sub.section_id === editSectionObj.id)
    : [];

  return (
    <>
      {/* Разделы и подразделы для создания */}
      {(activeTab === "documents" || activeTab === "parents_documents") && editingItem === null && (
        <>
          {activeTab === "documents" && (
            <>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Раздел <span className="normal-case text-muted-foreground/60 font-normal">(для группировки)</span>
                </label>
                <select
                  name="section"
                  value={formSelectedSection}
                  onChange={(e) => onSetFormSelectedSection(e.target.value)}
                  className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-blue-dark/20 focus:border-brand-blue-dark"
                >
                  <option value="">— Без раздела —</option>
                  {documentSections.map((sec) => (
                    <option key={sec.id} value={sec.title}>{sec.title}</option>
                  ))}
                </select>
                {documentSections.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Нет разделов.{" "}
                    <button
                      type="button"
                      onClick={() => { onSetIsModalOpen(false); onSetShowSectionManager(true); }}
                      className="text-brand-blue-dark font-bold hover:underline"
                    >
                      Создайте раздел
                    </button>{" "}
                    перед добавлением документа.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Подраздел <span className="normal-case text-muted-foreground/60 font-normal">(необязательно)</span>
                </label>
                <select
                  name="subsection"
                  disabled={!formSelectedSection}
                  className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-blue-dark/20 focus:border-brand-blue-dark disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <option value="">— Без подраздела —</option>
                  {filteredSubsections.map((sub) => (
                    <option key={sub.id} value={sub.title}>{sub.title}</option>
                  ))}
                </select>
                {formSelectedSection && filteredSubsections.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    У этого раздела нет подразделов.{" "}
                    <button
                      type="button"
                      onClick={() => { onSetIsModalOpen(false); onSetShowSectionManager(true); }}
                      className="text-brand-blue-dark font-bold hover:underline"
                    >
                      Создайте подраздел
                    </button>
                  </p>
                )}
              </div>
            </>
          )}
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider">
              Файл
            </label>
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSetIsDragging(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSetIsDragging(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSetIsDragging(false);
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  onSetUploadFile(e.dataTransfer.files[0]);
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
                    onClick={(e) => { e.stopPropagation(); onSetUploadFile(null); }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Нажмите или перетащите файл сюда</p>
                  <p className="text-xs text-muted-foreground mt-1">PDF, DOC, XLS до 15 МБ</p>
                </>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file && file.size > 15 * 1024 * 1024) {
                  alert("Файл слишком большой. Максимальный размер: 15 МБ");
                  e.target.value = "";
                  return;
                }
                onSetUploadFile(file || null);
              }}
            />
          </div>
        </>
      )}

      {/* Разделы и подразделы для редактирования */}
      {activeTab === "documents" && editingItem !== null && (
        <>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Раздел <span className="normal-case text-muted-foreground/60 font-normal">(для группировки)</span>
            </label>
            <select
              name="section"
              defaultValue={(editingItem as DocumentItem).section || ""}
              onChange={(e) => {
                onSetEditingItem({ ...(editingItem as DocumentItem), section: e.target.value, subsection: "" });
              }}
              className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-blue-dark/20 focus:border-brand-blue-dark"
            >
              <option value="">— Без раздела —</option>
              {documentSections.map((sec) => (
                <option key={sec.id} value={sec.title}>{sec.title}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Подраздел <span className="normal-case text-muted-foreground/60 font-normal">(необязательно)</span>
            </label>
            <select
              name="subsection"
              defaultValue={(editingItem as DocumentItem).subsection || ""}
              disabled={!editSection}
              className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-blue-dark/20 focus:border-brand-blue-dark disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <option value="">— Без подраздела —</option>
              {editFilteredSubsections.map((sub) => (
                <option key={sub.id} value={sub.title}>{sub.title}</option>
              ))}
            </select>
            {editSection && editFilteredSubsections.length === 0 && (
              <p className="text-xs text-muted-foreground">
                У этого раздела нет подразделов.{" "}
                <button
                  type="button"
                  onClick={() => { onSetIsModalOpen(false); onSetShowSectionManager(true); }}
                  className="text-brand-blue-dark font-bold hover:underline"
                >
                  Создайте подраздел
                </button>
              </p>
            )}
          </div>
        </>
      )}
    </>
  );
}
