import { useEffect } from "react";

interface UseUploadFormProps {
  uploadFile: File | null;
  setUploadForm: (setter: (prev: { title: string; type: string; size: string }) => { title: string; type: string; size: string }) => void;
}

export function useUploadForm({ uploadFile, setUploadForm }: UseUploadFormProps) {
  useEffect(() => {
    if (uploadFile) {
      const fileName = uploadFile.name.split(".").slice(0, -1).join(".");
      const fileExtension = uploadFile.name.split(".").pop()?.toUpperCase() || "";
      const fileSize = `${(uploadFile.size / 1024).toFixed(1)} КБ`;

      setUploadForm((prev) => ({
        ...prev,
        title: fileName,
        type: fileExtension,
        size: fileSize,
      }));
    } else {
      setUploadForm(() => ({ title: "", type: "", size: "" }));
    }
  }, [uploadFile, setUploadForm]);
}
