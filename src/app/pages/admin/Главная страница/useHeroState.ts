import { useState, useEffect, useRef } from "react";
import { supabase } from "../../../lib/supabase";
import { type Crop as RicCrop, type PixelCrop } from "react-image-crop";

export function useHeroState(activeTab: string) {
  const heroFileRef = useRef<HTMLInputElement>(null);
  const [heroAspect, setHeroAspect] = useState<"16:9" | "9:16">("16:9");
  const [heroImageFile, setHeroImageFile] = useState<File | null>(null);
  const [heroImagePreview, setHeroImagePreview] = useState<string | null>(null);
  const [heroCurrentUrl, setHeroCurrentUrl] = useState<string | null>(null);
  const [heroSaving, setHeroSaving] = useState(false);
  const [heroSuccess, setHeroSuccess] = useState(false);
  const [showHeroCropper, setShowHeroCropper] = useState(false);
  const [heroCropImage, setHeroCropImage] = useState<string | null>(null);
  const [heroCrop, setHeroCrop] = useState<RicCrop>();
  const [heroCompletedCrop, setHeroCompletedCrop] = useState<PixelCrop>();
  const heroCompletedCropRef = useRef<PixelCrop | undefined>(undefined);
  const heroImgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (activeTab === "home") {
      const fetchHero = async () => {
        const { data } = await supabase.from("site_config").select("*").eq("id", 1).single();
        if (data) {
          setHeroAspect(data.hero_aspect === "9:16" ? "9:16" : "16:9");
          setHeroCurrentUrl(data.hero_image_url || null);
          setHeroImagePreview(data.hero_image_url || null);
        }
      };
      fetchHero();
    }
  }, [activeTab]);

  return {
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
  };
}
