import { useState, useRef } from "react";

interface ImageMagnifierProps {
  src: string;
  alt: string;
  magnifierSize?: number;
  zoomLevel?: number;
  className?: string;
}

export const ImageMagnifier = ({
  src,
  alt,
  magnifierSize = 150,
  zoomLevel = 2.5,
  className = "",
}: ImageMagnifierProps) => {
  const [showMagnifier, setShowMagnifier] = useState(false);
  const [magnifierPos, setMagnifierPos] = useState({ x: 0, y: 0 });
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const imgRef = useRef<HTMLImageElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imgRef.current) return;

    const rect = imgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Calculate percentage position
    const xPercent = (x / rect.width) * 100;
    const yPercent = (y / rect.height) * 100;

    setCursorPos({ x, y });
    setMagnifierPos({ x: xPercent, y: yPercent });
  };

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      onMouseEnter={() => setShowMagnifier(true)}
      onMouseLeave={() => setShowMagnifier(false)}
      onMouseMove={handleMouseMove}
    >
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className="w-full h-full object-cover cursor-none"
      />

      {showMagnifier && (
        <div
          className="pointer-events-none absolute rounded-full border-4 border-white/80 shadow-2xl"
          style={{
            width: magnifierSize,
            height: magnifierSize,
            left: cursorPos.x - magnifierSize / 2,
            top: cursorPos.y - magnifierSize / 2,
            backgroundImage: `url(${src})`,
            backgroundSize: `${zoomLevel * 100}%`,
            backgroundPosition: `${magnifierPos.x}% ${magnifierPos.y}%`,
            backgroundRepeat: "no-repeat",
            boxShadow: `
              0 0 0 3px rgba(0, 0, 0, 0.1),
              0 10px 40px rgba(0, 0, 0, 0.3),
              inset 0 0 30px rgba(255, 255, 255, 0.1)
            `,
          }}
        />
      )}
    </div>
  );
};
