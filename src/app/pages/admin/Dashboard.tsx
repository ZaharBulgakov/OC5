import { useState, useRef } from "react";
import { useNavigate } from "react-router";
import "react-image-crop/dist/ReactCrop.css";
import { getCroppedImg } from "./Работа с изображениями/cropUtils";
import StudentsAdmin from "./Учебники и форма/StudentsAdmin";
import ContactsManager from "./Контакты/ContactsManager";
import FAQEditor from "./Вопросы и ответы/FAQEditor";
import GalleryManager from "./Галерея/GalleryManager";
import DocumentsManager from "./Документы/DocumentsManager";
import NewsEditor from "./Новости/NewsEditor";
import DocumentSectionManager from "./Документы/DocumentSectionManager";
import TextbookModal from "./Учебники и форма/TextbookModal";
import UniformModal from "./Учебники и форма/UniformModal";
import ActivityModal from "./Кружки и секции/ActivityModal";
import ActivitySectionManager from "./Кружки и секции/ActivitySectionManager";
import SchedulePdfManager from "./Расписание/SchedulePdfManager";
import DirectorEditor from "./Слово директора/DirectorEditor";
import HomeHeroEditor from "./Главная страница/HomeHeroEditor";
import DashboardSidebar from "./DashboardSidebar";
import HeroCropperModal from "./Работа с изображениями/HeroCropperModal";
import ImageCropperModal from "./Работа с изображениями/ImageCropperModal";
import NewsEditModal from "./Новости/NewsEditModal";
import GalleryCollectionEditModal from "./Галерея/GalleryCollectionEditModal";
import GalleryPhotoEditModal from "./Галерея/GalleryPhotoEditModal";
import DocumentsEditModal from "./Документы/DocumentsEditModal";
import EditModalWrapper from "./EditModalWrapper";
import { useDashboardData } from "./Состояния и данные/useDashboardData";
import { useSubmitHandler } from "./Состояния и данные/useSubmitHandler";
import { useDashboardState } from "./Состояния и данные/useDashboardState";
import { useStudentsState } from "./Учебники и форма/useStudentsState";
import { useActivitiesState } from "./Кружки и секции/useActivitiesState";
import { useDirectorState } from "./Слово директора/useDirectorState";
import { useHeroState } from "./Главная страница/useHeroState";
import { useCropperState } from "./Состояния и данные/useCropperState";
import { useUploadForm } from "./Состояния и данные/useUploadForm";
import { useSchedulePdf } from "./Расписание/useSchedulePdf";
import { useAuthHandlers } from "./Состояния и данные/useAuthHandlers";
import { useDeleteHandlers } from "./Состояния и данные/useDeleteHandlers";
import { useGalleryHandlers } from "./Галерея/useGalleryHandlers";
import {
  Folders,
  Plus,
  Search
} from "lucide-react";

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

export default function Dashboard() {
  const validTabs = ["news", "gallery", "documents", "parents_documents", "schedule-pdf", "director", "home", "students_books", "students_activities", "faqs", "contacts"] as const;
  type TabType = typeof validTabs[number];
  const savedTab = localStorage.getItem("adminActiveTab") as TabType | null;
  const [activeTab, setActiveTab] = useState<TabType>(savedTab && validTabs.includes(savedTab) ? savedTab : "news");
  const setActiveTabPersisted = (tab: TabType) => { setActiveTab(tab); localStorage.setItem("adminActiveTab", tab); };

  const {
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
  } = useDashboardState();

  const {
    textbookModalOpen,
    setTextbookModalOpen,
    textbookForm,
    setTextbookForm,
    textbookEditId,
    setTextbookEditId,
    uniformModalOpen,
    setUniformModalOpen,
    uniformForm,
    setUniformForm,
    uniformEditId,
    setUniformEditId,
    studentsSection,
    setStudentsSection,
    handleEditTextbook,
    handleEditUniform,
  } = useStudentsState();

  const {
    activityModalOpen,
    setActivityModalOpen,
    activityForm,
    setActivityForm,
    activityEditId,
    setActivityEditId,
    activitySections,
    setActivitySections,
    showActivitySectionManager,
    setShowActivitySectionManager,
    handleEditActivity,
  } = useActivitiesState(activeTab);

  const { directorForm, setDirectorForm } = useDirectorState(activeTab);

  const fileRef = useRef<HTMLInputElement>(null);
  const newsFileRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const {
    heroFileRef,
    heroAspect,
    setHeroAspect,
    heroImageFile,
    setHeroImageFile,
    heroImagePreview,
    setHeroImagePreview,
    heroCurrentUrl,
    setHeroCurrentUrl,
    heroSaving,
    setHeroSaving,
    heroSuccess,
    setHeroSuccess,
    showHeroCropper,
    setShowHeroCropper,
    heroCropImage,
    setHeroCropImage,
    heroCrop,
    setHeroCrop,
    heroCompletedCrop,
    setHeroCompletedCrop,
    heroCompletedCropRef,
    heroImgRef,
  } = useHeroState(activeTab);

  const {
    cropImage,
    setCropImage,
    crop,
    setCrop,
    completedCrop,
    setCompletedCrop,
    completedCropRef,
    imgRef,
    showCropper,
    setShowCropper,
    isSquareMax,
    setIsSquareMax,
    cropAspect,
    setCropAspect,
    imgNaturalSize,
    setImgNaturalSize,
  } = useCropperState();

  useUploadForm({ uploadFile, setUploadForm });

  useSchedulePdf({ activeTab, setSchedulePdfUrl });

  useDashboardData({
    activeTab,
    setLoading,
    setCollectionsData,
    setGalleryData,
    setNewsData,
    setDocumentsData,
    setDocumentSections,
    setDocumentSubsections,
    setParentsDocumentsData,
  });

  const { handleSubmit } = useSubmitHandler({
    activeTab,
    editingItem,
    uploadFile,
    originalFile,
    newsAdditionalImages,
    existingAdditionalImages,
    selectedCollection,
    uploadForm,
    onSetCollectionsData: setCollectionsData,
    onSetGalleryData: setGalleryData,
    onSetNewsData: setNewsData,
    onSetDocumentsData: setDocumentsData,
    onSetParentsDocumentsData: setParentsDocumentsData,
    onSetIsModalOpen: setIsModalOpen,
    onSetEditingItem: setEditingItem,
    onSetSubmitting: setSubmitting,
    onSetUploadFile: setUploadFile,
    onSetOriginalFile: setOriginalFile,
    onSetNewsAdditionalImages: setNewsAdditionalImages,
    onSetNewsAdditionalImagePreviews: setNewsAdditionalImagePreviews,
    onSetExistingAdditionalImages: setExistingAdditionalImages,
    onSetUploadForm: setUploadForm,
  });

  const { handleLogout } = useAuthHandlers();
  const { handleDelete } = useDeleteHandlers({
    activeTab,
    setNewsData,
    setGalleryData,
    setDocumentsData,
    setParentsDocumentsData,
  });
  const { handleDeleteCollection } = useGalleryHandlers({
    setCollectionsData,
    selectedCollection,
    setSelectedCollection,
  });

  const handleLogoutWrapper = () => handleLogout(navigate);

  return (
    <div className="min-h-screen bg-secondary/20 flex flex-col lg:flex-row">
      <DashboardSidebar
        activeTab={activeTab}
        onSetActiveTab={(tab) => setActiveTabPersisted(tab as any)}
        onLogout={handleLogoutWrapper}
      />

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-black text-brand-blue-dark">
              {activeTab === "news" ? "Новости" : activeTab === "gallery" ? "Галерея" : activeTab === "documents" ? "Документы" : activeTab === "parents_documents" ? "Родителям" : activeTab === "contacts" ? "Контакты" : activeTab === "director" ? "Слово директора" : activeTab === "home" ? "Главная страница" : activeTab === "students_books" ? "Учебники и форма" : activeTab === "students_activities" ? "Кружки и секции" : activeTab === "faqs" ? "Вопросы и ответы" : "Расписание PDF"}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">Управление содержимым раздела</p>
          </div>
          <div className="relative w-full sm:w-auto">
            {activeTab !== "director" && activeTab !== "home" && activeTab !== "faqs" && (
              <>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Поиск..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-[300px] pl-11 pr-4 py-3 border border-border rounded-xl bg-card outline-none focus:ring-1 focus:ring-brand-blue-dark/20 transition-all text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors text-lg leading-none"
              >
                ×
              </button>
            )}
              </>
            )}
          </div>
          <div className="flex items-center gap-2 w-fit">
            {activeTab === "documents" && (
              <button
                onClick={() => setShowSectionManager(true)}
                className="border border-border bg-card text-brand-blue-dark px-5 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-secondary transition-all"
              >
                <Folders className="w-5 h-5" />
                Разделы
              </button>
            )}
            {activeTab === "students_activities" && (
              <button
                onClick={() => setShowActivitySectionManager(true)}
                className="border border-border bg-card text-brand-blue-dark px-5 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-secondary transition-all"
              >
                <Folders className="w-5 h-5" />
                Разделы
              </button>
            )}
            {activeTab !== "director" && activeTab !== "home" && activeTab !== "faqs" && activeTab !== "contacts" && activeTab !== "schedule-pdf" && (
            <button
              onClick={() => {
                if (activeTab === "students_books") {
                  if (studentsSection === "textbooks") {
                    setTextbookForm({ subject: "", author: "", year: new Date().getFullYear(), grade_label: "1 класс" });
                    setTextbookEditId(null);
                    setTextbookModalOpen(true);
                  } else {
                    setUniformForm({ grade_label: "", description: "" });
                    setUniformEditId(null);
                    setUniformModalOpen(true);
                  }
                } else if (activeTab === "students_activities") {
                  setActivityForm({ section_id: "", title: "", scheduleDays: [], scheduleTime: "15:00" });
                  setActivityEditId(null);
                  setActivityModalOpen(true);
                } else if (activeTab === "gallery" && !selectedCollection) {
                  setEditingItem({ id: 'new-collection' } as any);
                } else {
                  setEditingItem(null);
                }
                setUploadFile(null);
                setOriginalFile(null);
                setFormSelectedSection("");
                if (activeTab !== "students_books" && activeTab !== "students_activities") setIsModalOpen(true);
              }}
              className="bg-brand-blue-dark text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:shadow-lg hover:-translate-y-0.5 transition-all w-fit"
            >
              <Plus className="w-5 h-5" />
              {activeTab === "students_books" ? "Добавить учебник" : activeTab === "students_activities" ? "Добавить кружок" : activeTab === "gallery" ? (selectedCollection ? "Добавить фото" : "Создать коллекцию") : activeTab === "parents_documents" || activeTab === "documents" ? "Добавить документ" : "Добавить новость"}
            </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue-dark"></div>
          </div>
        ) : (
          <div className="grid gap-4">
            {activeTab === "news" && (
              <NewsEditor
                newsData={newsData}
                searchQuery={searchQuery}
                onEditItem={(item) => {
                  setEditingItem(item);
                  setUploadFile(null);
                  setOriginalFile(null);
                  setExistingAdditionalImages((item as any).additional_images || []);
                  setNewsAdditionalImages([]);
                  setNewsAdditionalImagePreviews([]);
                  setIsModalOpen(true);
                }}
                onDeleteItem={handleDelete}
              />
            )}

            {activeTab === "gallery" && (
              <GalleryManager
                galleryData={galleryData}
                collectionsData={collectionsData}
                searchQuery={searchQuery}
                selectedCollection={selectedCollection}
                onSetSelectedCollection={setSelectedCollection}
                onEditItem={(item) => {
                  setEditingItem(item as any);
                  setUploadFile(null);
                  setOriginalFile(null);
                  setIsModalOpen(true);
                }}
                onDeleteItem={handleDelete}
                onDeleteCollection={handleDeleteCollection}
              />
            )}

            {activeTab === "documents" && (
              <DocumentsManager
                documentsData={documentsData}
                parentsDocumentsData={[]}
                searchQuery={searchQuery}
                onEditItem={(item) => {
                  setEditingItem(item);
                  setUploadFile(null);
                  setIsModalOpen(true);
                }}
                onDeleteItem={handleDelete}
              />
            )}

            {activeTab === "parents_documents" && (
              <DocumentsManager
                documentsData={[]}
                parentsDocumentsData={parentsDocumentsData}
                searchQuery={searchQuery}
                onEditItem={(item) => {
                  setEditingItem(item);
                  setUploadFile(null);
                  setIsModalOpen(true);
                }}
                onDeleteItem={handleDelete}
              />
            )}

            {activeTab === "schedule-pdf" && (
              <SchedulePdfManager
                schedulePdfUrl={schedulePdfUrl}
                onSetSchedulePdfUrl={setSchedulePdfUrl}
              />
            )}
          </div>
        )}

        {/* ─── DIRECTOR EDITOR ─── */}
        {activeTab === "director" && (
          <DirectorEditor
            initialForm={directorForm}
            onSetForm={setDirectorForm}
          />
        )}

        {/* ─── HOME HERO EDITOR ─── */}
        {activeTab === "home" && (
          <HomeHeroEditor
            heroAspect={heroAspect}
            heroImageFile={heroImageFile}
            heroImagePreview={heroImagePreview}
            heroCurrentUrl={heroCurrentUrl}
            heroSaving={heroSaving}
            heroSuccess={heroSuccess}
            heroFileRef={heroFileRef}
            onSetHeroAspect={setHeroAspect}
            onSetHeroImageFile={setHeroImageFile}
            onSetHeroImagePreview={setHeroImagePreview}
            onSetHeroCropImage={setHeroCropImage}
            onSetShowHeroCropper={setShowHeroCropper}
            onSetHeroCrop={setHeroCrop}
            onSetHeroCompletedCrop={setHeroCompletedCrop}
            heroCompletedCropRef={heroCompletedCropRef}
            onSetHeroCurrentUrl={setHeroCurrentUrl}
            onSetHeroSaving={setHeroSaving}
            onSetHeroSuccess={setHeroSuccess}
          />
        )}

        {activeTab === "students_books" && (
          <StudentsAdmin 
            initialSubTab="books" 
            onSectionChange={setStudentsSection} 
            onEditTextbook={handleEditTextbook}
            onEditUniform={handleEditUniform}
          />
        )}

        {activeTab === "students_activities" && (
          <StudentsAdmin 
            initialSubTab="activities" 
            onEditActivity={handleEditActivity}
          />
        )}

        {/* ─── FAQ EDITOR ─── */}
        {activeTab === "faqs" && <FAQEditor searchQuery={searchQuery} />}

        {/* ─── CONTACTS EDITOR ─── */}
        {activeTab === "contacts" && <ContactsManager searchQuery={searchQuery} />}

      </main>

      {/* ─── HERO CROPPER MODAL ─── */}
      <HeroCropperModal
        show={showHeroCropper}
        cropImage={heroCropImage}
        aspect={heroAspect}
        crop={heroCrop}
        completedCrop={heroCompletedCrop}
        completedCropRef={heroCompletedCropRef}
        imgRef={heroImgRef}
        onSetCrop={setHeroCrop}
        onSetCompletedCrop={setHeroCompletedCrop}
        onClose={() => { setShowHeroCropper(false); setHeroCropImage(null); setHeroImageFile(null); }}
        onApplyCrop={async () => {
          try {
            const crop = heroCompletedCropRef.current;
            if (!crop || !heroImgRef.current) throw new Error("Выберите область");
            const croppedBlob = await getCroppedImg(heroImgRef.current, crop, false);
            const file = new File([croppedBlob], `hero-${heroAspect.replace(":", "x")}.jpg`, { type: "image/jpeg" });
            setHeroImageFile(file);
            setHeroImagePreview(URL.createObjectURL(croppedBlob));
            setShowHeroCropper(false);
            setHeroCropImage(null);
          } catch (err: any) {
            alert("Ошибка при обрезке: " + err.message);
          }
        }}
      />
      {/* Edit Modal */}
      <EditModalWrapper
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        submitting={submitting}
        title={editingItem ? "Редактировать" : "Добавить"}
      >
        {/* ГАЛЕРЕЯ: СОЗДАНИЕ/РЕДАКТИРОВАНИЕ КОЛЛЕКЦИИ */}
        {activeTab === "gallery" && (editingItem?.id === 'new-collection' || (editingItem && !('url' in editingItem))) && (
          <GalleryCollectionEditModal editingItem={editingItem as any} />
        )}

        {/* ГАЛЕРЕЯ: ДОБАВЛЕНИЕ/РЕДАКТИРОВАНИЕ ФОТО */}
        {activeTab === "gallery" && (editingItem === null || (editingItem && 'url' in editingItem)) && (
          <GalleryPhotoEditModal
            editingItem={editingItem as any}
            uploadFile={uploadFile}
            originalFile={originalFile}
            fileRef={fileRef}
            onSetOriginalFile={setOriginalFile}
            onSetCropImage={setCropImage}
            onSetCropAspect={setCropAspect}
            onSetShowCropper={setShowCropper}
          />
        )}

        {/* НОВОСТИ */}
        {activeTab === "news" && (
          <NewsEditModal
            editingItem={editingItem as NewsItem | null}
            uploadFile={uploadFile}
            originalFile={originalFile}
            newsAdditionalImages={newsAdditionalImages}
            newsAdditionalImagePreviews={newsAdditionalImagePreviews}
            existingAdditionalImages={existingAdditionalImages}
            newsFileRef={newsFileRef}
            onSetOriginalFile={setOriginalFile}
            onSetCropImage={setCropImage}
            onSetCropAspect={setCropAspect}
            onSetShowCropper={setShowCropper}
            onSetNewsAdditionalImages={setNewsAdditionalImages}
            onSetNewsAdditionalImagePreviews={setNewsAdditionalImagePreviews}
            onSetExistingAdditionalImages={setExistingAdditionalImages}
          />
        )}

        {/* ДОКУМЕНТЫ */}
        <DocumentsEditModal
          activeTab={activeTab as "documents" | "parents_documents"}
          editingItem={editingItem as any}
          documentSections={documentSections}
          documentSubsections={documentSubsections}
          formSelectedSection={formSelectedSection}
          uploadFile={uploadFile}
          isDragging={isDragging}
          fileRef={fileRef}
          onSetFormSelectedSection={setFormSelectedSection}
          onSetEditingItem={(item) => setEditingItem(item as any)}
          onSetIsModalOpen={setIsModalOpen}
          onSetShowSectionManager={setShowSectionManager}
          onSetUploadFile={setUploadFile}
          onSetIsDragging={setIsDragging}
        />
      </EditModalWrapper>

      {/* Crop Modal */}
      <ImageCropperModal
        show={showCropper}
        cropImage={cropImage}
        crop={crop}
        completedCrop={completedCrop}
        completedCropRef={completedCropRef}
        imgRef={imgRef}
        cropAspect={cropAspect}
        isSquareMax={isSquareMax}
        imgNaturalSize={imgNaturalSize}
        onSetCrop={setCrop}
        onSetCompletedCrop={setCompletedCrop}
        onSetCropAspect={setCropAspect}
        onSetIsSquareMax={setIsSquareMax}
        onSetImgNaturalSize={setImgNaturalSize}
        onClose={() => { setShowCropper(null); setCropImage(null); }}
        onApplyCrop={async () => {
          try {
            const crop = completedCropRef.current;
            if (!crop || !imgRef.current) throw new Error("Выберите область");
            if (showCropper === "gallery") {
              const croppedBlob = await getCroppedImg(imgRef.current, crop, false);
              const file = new File([croppedBlob], "gallery-image.jpg", { type: "image/jpeg" });
              setUploadFile(file);
            } else {
              const mainBlob = await getCroppedImg(imgRef.current, crop, false);
              const mainFile = new File([mainBlob], "news-main.jpg", { type: "image/jpeg" });

              const previewBlob = await getCroppedImg(imgRef.current, crop, isSquareMax);
              const previewFile = new File([previewBlob], "news-preview.jpg", { type: "image/jpeg" });

              setUploadFile(mainFile);
              (window as any)._pendingPreviewFile = previewFile;
            }
            setShowCropper(null);
            setCropImage(null);
          } catch (e: any) {
            console.error(e);
            alert("Ошибка при обработке изображения: " + (e.message || e));
          }
        }}
      />

      {/* Section Manager Modal */}
      <DocumentSectionManager
        isOpen={showSectionManager}
        onClose={() => setShowSectionManager(false)}
        documentSections={documentSections}
        documentSubsections={documentSubsections}
        documentsData={documentsData}
        onSetDocumentSections={setDocumentSections}
        onSetDocumentSubsections={setDocumentSubsections}
      />

      <TextbookModal
        isOpen={textbookModalOpen}
        onClose={() => {
          setTextbookModalOpen(false);
          setTextbookForm({ subject: "", author: "", year: new Date().getFullYear(), grade_label: "1 класс" });
          setTextbookEditId(null);
        }}
        editId={textbookEditId}
        initialForm={textbookForm}
      />

      <UniformModal
        isOpen={uniformModalOpen}
        onClose={() => {
          setUniformModalOpen(false);
          setUniformForm({ grade_label: "", description: "" });
          setUniformEditId(null);
        }}
        editId={uniformEditId}
        initialForm={uniformForm}
      />

      <ActivityModal
        isOpen={activityModalOpen}
        onClose={() => {
          setActivityModalOpen(false);
          setActivityForm({ section_id: "", title: "", scheduleDays: [], scheduleTime: "15:00" });
          setActivityEditId(null);
        }}
        editId={activityEditId}
        initialForm={activityForm}
        activitySections={activitySections}
      />

      <ActivitySectionManager
        isOpen={showActivitySectionManager}
        onClose={() => setShowActivitySectionManager(false)}
        activitySections={activitySections}
        onSetActivitySections={setActivitySections}
      />
    </div>
  );
}