import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";

export function useDirectorState(activeTab: string) {
  const [directorForm, setDirectorForm] = useState({ name: "", quotes: ["", "", ""], image_url: "" });

  useEffect(() => {
    if (activeTab === "director") {
      const fetchDirector = async () => {
        const { data } = await supabase.from("director_info").select("*").eq("id", 1).single();
        if (data) {
          setDirectorForm({
            name: data.name || "",
            quotes: Array.isArray(data.quotes) && data.quotes.length > 0 ? data.quotes : ["", "", ""],
            image_url: data.image_url || "",
          });
        }
      };
      fetchDirector();
    }
  }, [activeTab]);

  return {
    directorForm,
    setDirectorForm,
  };
}
