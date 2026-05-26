import { useState, useRef } from "react";
import { type Crop as RicCrop, type PixelCrop } from "react-image-crop";

export function useCropperState() {
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [crop, setCrop] = useState<RicCrop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const completedCropRef = useRef<PixelCrop | undefined>(undefined);
  const imgRef = useRef<HTMLImageElement>(null);
  const [showCropper, setShowCropper] = useState<"news" | "gallery" | null>(null);
  const [isSquareMax, setIsSquareMax] = useState(false);
  const [cropAspect, setCropAspect] = useState<number | undefined>(16 / 9);
  const [imgNaturalSize, setImgNaturalSize] = useState({ w: 1, h: 1 });

  return {
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
  };
}
