import { supabase } from "../../../lib/supabase";

export function useAuthHandlers() {
  const handleLogout = async (navigate: (path: string) => void) => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  return { handleLogout };
}
