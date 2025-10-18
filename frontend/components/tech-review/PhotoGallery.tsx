// @ts-nocheck
import React from "react";
const useState = (React as any).useState;
import type { ComponentPhoto } from "~backend/tech-review/types";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface PhotoGalleryProps {
  photos: ComponentPhoto[];
  compact?: boolean;
}

export function PhotoGallery({ photos, compact = false }: PhotoGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (!photos || photos.length === 0) {
    return null;
  }

  const handlePrevious = () => {
    if (selectedIndex === null) return;
    setSelectedIndex((selectedIndex - 1 + photos.length) % photos.length);
  };

  const handleNext = () => {
    if (selectedIndex === null) return;
    setSelectedIndex((selectedIndex + 1) % photos.length);
  };

  const handleKeyDown = (e: any) => {
    if (e.key === "ArrowLeft") handlePrevious();
    if (e.key === "ArrowRight") handleNext();
    if (e.key === "Escape") setSelectedIndex(null);
  };

  if (compact) {
    return (
      <>
        <div className="flex gap-2 flex-wrap">
          {photos.slice(0, 3).map((photo, index) => (
            <div
              key={photo.id}
              className="relative w-16 h-16 border rounded overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setSelectedIndex(index)}
            >
              <img
                src={photo.photoUrl}
                alt={`Photo ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
          {photos.length > 3 && (
            <div
              className="w-16 h-16 border rounded flex items-center justify-center bg-muted cursor-pointer hover:bg-muted/80 transition-colors"
              onClick={() => setSelectedIndex(3)}
            >
              <span className="text-sm font-medium">+{photos.length - 3}</span>
            </div>
          )}
        </div>

        <Dialog open={selectedIndex !== null} onOpenChange={(open: any) => !open && setSelectedIndex(null)}>
          <DialogContent className="max-w-4xl" onKeyDown={handleKeyDown as any}>
            {selectedIndex !== null && (
              <div className="relative">
                <img
                  src={photos[selectedIndex].photoUrl}
                  alt={`Photo ${selectedIndex + 1}`}
                  className="w-full max-h-[80vh] object-contain"
                />
                
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-background/90 backdrop-blur px-3 py-2 rounded-lg">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handlePrevious}
                    disabled={photos.length <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">
                    {selectedIndex + 1} / {photos.length}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleNext}
                    disabled={photos.length <= 1}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <div className="grid grid-cols-4 gap-3">
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            className="relative aspect-square border rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => setSelectedIndex(index)}
          >
            <img
              src={photo.photoUrl}
              alt={`Photo ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>

      <Dialog open={selectedIndex !== null} onOpenChange={(open: any) => !open && setSelectedIndex(null)}>
        <DialogContent className="max-w-4xl" onKeyDown={handleKeyDown as any}>
          {selectedIndex !== null && (
            <div className="relative">
              <img
                src={photos[selectedIndex].photoUrl}
                alt={`Photo ${selectedIndex + 1}`}
                className="w-full max-h-[80vh] object-contain"
              />
              
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-background/90 backdrop-blur px-3 py-2 rounded-lg">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePrevious}
                  disabled={photos.length <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  {selectedIndex + 1} / {photos.length}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNext}
                  disabled={photos.length <= 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
