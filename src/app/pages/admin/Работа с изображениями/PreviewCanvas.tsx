import { useEffect, useRef } from "react";
import { type PixelCrop } from "react-image-crop";

interface PreviewCanvasProps {
  imgRef: React.RefObject<HTMLImageElement | null>;
  crop: PixelCrop;
  aspect: number;
  isSquareMax?: boolean;
}

export default function PreviewCanvas({
  imgRef,
  crop,
  aspect,
  isSquareMax,
}: PreviewCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas || !crop.width || !crop.height) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const scaleX = img.naturalWidth / img.width;
    const scaleY = img.naturalHeight / img.height;

    let sx = crop.x * scaleX;
    let sy = crop.y * scaleY;
    let sw = crop.width * scaleX;
    let sh = crop.height * scaleY;

    if (isSquareMax) {
      const side = Math.min(img.naturalWidth, img.naturalHeight);
      const centerX = sx + sw / 2;
      const centerY = sy + sh / 2;
      sx = Math.max(0, Math.min(centerX - side / 2, img.naturalWidth - side));
      sy = Math.max(0, Math.min(centerY - side / 2, img.naturalHeight - side));
      sw = side;
      sh = side;
    }

    // Определение размеров канваса для соответствия соотношению сторон
    const outW = 320;
    const outH = Math.round(outW / aspect);
    canvas.width = outW;
    canvas.height = outH;

    // Заполнение чёрным фоном
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, outW, outH);

    // Отрисовка обрезанной области с масштабированием для правильного соотношения
    const srcAspect = sw / sh;
    let drawW = outW, drawH = outH, drawX = 0, drawY = 0;
    if (srcAspect > aspect) {
      drawH = outH;
      drawW = drawH * srcAspect;
      drawX = (outW - drawW) / 2;
    } else {
      drawW = outW;
      drawH = drawW / srcAspect;
      drawY = (outH - drawH) / 2;
    }

    ctx.drawImage(img, sx, sy, sw, sh, drawX, drawY, drawW, drawH);
  }, [imgRef, crop, aspect, isSquareMax]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
    />
  );
}
