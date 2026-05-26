import { type Crop as RicCrop, type PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";

export const getCroppedImg = async (imgEl: HTMLImageElement, pixelCrop: PixelCrop, isSquare: boolean = false): Promise<Blob> => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No 2d context");

  const scaleX = imgEl.naturalWidth / imgEl.width;
  const scaleY = imgEl.naturalHeight / imgEl.height;

  let sx = pixelCrop.x * scaleX;
  let sy = pixelCrop.y * scaleY;
  let sw = pixelCrop.width * scaleX;
  let sh = pixelCrop.height * scaleY;

  if (isSquare) {
    const side = Math.min(imgEl.naturalWidth, imgEl.naturalHeight);
    const centerX = sx + sw / 2;
    const centerY = sy + sh / 2;
    sx = Math.max(0, Math.min(centerX - side / 2, imgEl.naturalWidth - side));
    sy = Math.max(0, Math.min(centerY - side / 2, imgEl.naturalHeight - side));
    sw = side;
    sh = side;
  }

  canvas.width = sw;
  canvas.height = sh;
  ctx.drawImage(imgEl, sx, sy, sw, sh, 0, 0, sw, sh);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Canvas is empty"));
    }, "image/jpeg", 0.9);
  });
};

export const initCropForAspect = (
  aspect: number | undefined,
  imgRef: React.RefObject<HTMLImageElement | null>,
  setCrop: (crop: RicCrop) => void
) => {
  if (!imgRef.current) return;
  const { width, height } = imgRef.current;
  if (aspect) {
    setCrop(centerCrop(makeAspectCrop({ unit: "%", width: 90 }, aspect, width, height), width, height));
  } else {
    setCrop({ unit: "%", x: 5, y: 5, width: 90, height: 90 });
  }
};

export const fetchAsBlobUrl = async (url: string): Promise<string> => {
  const res = await fetch(url);
  const blob = await res.blob();
  return URL.createObjectURL(blob);
};
