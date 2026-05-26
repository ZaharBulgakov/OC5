import { useState } from "react";

export function useStudentsState() {
  const [textbookModalOpen, setTextbookModalOpen] = useState(false);
  const [textbookForm, setTextbookForm] = useState({ subject: "", author: "", year: new Date().getFullYear(), grade_label: "1 класс" });
  const [textbookEditId, setTextbookEditId] = useState<string | null>(null);
  const [uniformModalOpen, setUniformModalOpen] = useState(false);
  const [uniformForm, setUniformForm] = useState({ grade_label: "", description: "" });
  const [uniformEditId, setUniformEditId] = useState<string | null>(null);
  const [studentsSection, setStudentsSection] = useState<"textbooks" | "uniform">("textbooks");

  const handleEditTextbook = (textbook: any) => {
    setTextbookForm({
      subject: textbook.subject,
      author: textbook.author,
      year: textbook.year,
      grade_label: textbook.grade_label || "1 класс"
    });
    setTextbookEditId(textbook.id);
    setTextbookModalOpen(true);
  };

  const handleEditUniform = (uniform: any) => {
    setUniformForm({
      grade_label: uniform.grade_label,
      description: uniform.description
    });
    setUniformEditId(uniform.id);
    setUniformModalOpen(true);
  };

  return {
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
  };
}
