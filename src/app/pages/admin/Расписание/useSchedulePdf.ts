import { useEffect } from "react";
import { supabase } from "../../../lib/supabase";

interface UseSchedulePdfProps {
  activeTab: string;
  setSchedulePdfUrl: (url: string | null) => void;
}

export function useSchedulePdf({ activeTab, setSchedulePdfUrl }: UseSchedulePdfProps) {
  useEffect(() => {
    if (activeTab === "schedule-pdf") {
      const fetchSchedulePdf = async () => {
        const { data, error } = await supabase
          .from('schedule_config')
          .select('pdf_url')
          .eq('id', 1)
          .single();
        
        if (error) {
          console.error('Error fetching schedule PDF:', error);
          setSchedulePdfUrl(null);
        } else if (data) {
          setSchedulePdfUrl(data.pdf_url);
        }
      };
      fetchSchedulePdf();
    }
  }, [activeTab, setSchedulePdfUrl]);
}
