import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";

export function useActivitiesState(activeTab: string) {
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [activityForm, setActivityForm] = useState({ section_id: "", title: "", scheduleDays: [] as number[], scheduleTime: "15:00" });
  const [activityEditId, setActivityEditId] = useState<string | null>(null);
  const [activitySections, setActivitySections] = useState<any[]>([]);
  const [showActivitySectionManager, setShowActivitySectionManager] = useState(false);

  useEffect(() => {
    if (activeTab === "students_activities") {
      const fetchActivitySections = async () => {
        const { data } = await supabase.from("activity_sections").select("*").order("sort_order");
        setActivitySections(data || []);
      };
      fetchActivitySections();
    }
  }, [activeTab]);

  const handleEditActivity = async (activity: any) => {
    // Загрузка расписания кружков
    const { data: schedules } = await supabase
      .from("activity_schedules")
      .select("*")
      .eq("activity_id", activity.id);
    
    setActivityForm({
      section_id: activity.section_id,
      title: activity.title,
      scheduleDays: schedules?.map((s: any) => s.day_of_week) || [],
      scheduleTime: schedules?.[0]?.time || "15:00"
    });
    setActivityEditId(activity.id);
    setActivityModalOpen(true);
  };

  return {
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
  };
}
