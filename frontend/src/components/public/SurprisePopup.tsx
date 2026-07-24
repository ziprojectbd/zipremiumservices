import React, { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { devLog } from "../../utils/devLogger";
import { popupConfigManager, recordPopupView, recordPopupInteraction } from "../../lib/popupConfig";
import api from "../../lib/axios";

interface SurprisePopupProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function SurprisePopup({ isVisible, onClose }: SurprisePopupProps) {
  const [shouldRender, setShouldRender] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const autoSlideIntervalRef = useRef<NodeJS.Timeout>();

  // Load images from MongoDB API
  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await api.get('/public/popup-images');
        const data = response.data;
        if (data.success) {
          setImages(data.data);
        }
      } catch (error) {
        devLog('Error fetching popup images:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, []);

  // Popup visibility logic
  useEffect(() => {
    if (isVisible && images.length > 0) {
      setShouldRender(true);
      setCurrentImage(0);
      recordPopupView();
      setImagesLoaded(true);
      setShowContent(true);
    } else {
      setShowContent(false);
      setShouldRender(false);
      setImagesLoaded(false);
    }
  }, [isVisible, images]);

  // Auto-slide logic
  useEffect(() => {
    if (showContent && imagesLoaded && images.length > 1) {
      autoSlideIntervalRef.current = setInterval(() => {
        setCurrentImage(prev => (prev + 1) % images.length);
      }, 3000); // Default 3 seconds

      return () => {
        if (autoSlideIntervalRef.current) {
          clearInterval(autoSlideIntervalRef.current);
        }
      };
    }
  }, [showContent, imagesLoaded, images]);

  if (!shouldRender || images.length === 0) return null;

  const handleClose = () => {
    recordPopupInteraction('close');
    setShowContent(false);
    onClose();
  };

  const handleImageClick = (image: any, index: number) => {
    recordPopupInteraction('image_view', { imageIndex: index, imageUrl: image.imageUrl });

    if (image.offerUrl) {
      recordPopupInteraction('offer_click', {
        imageIndex: index,
        offerUrl: image.offerUrl,
        offerType: image.type === 'lottie' ? 'lottie_click' : 'external_link'
      });

      if (image.offerUrl.startsWith('/')) {
        window.location.href = image.offerUrl;
      } else {
        window.open(image.offerUrl, '_blank');
      }
      handleClose();
    } else if (index < images.length - 1) {
      setCurrentImage(index + 1);
    }
  };

  const currentImageObj = images[currentImage];

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[99998] flex items-center justify-center ${
          showContent
            ? 'bg-black/70'
            : 'bg-black/0'
        }`}
      >

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 sm:top-4 sm:right-4 z-50 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/20 flex items-center justify-center border border-white/20"
        >
          <X className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
        </button>

        {/* Popup Images Container */}
        <div className="relative flex items-center justify-center">

          {/* Current Image or Lottie */}
          {currentImageObj && imagesLoaded && (
            <div className="relative">
              {currentImageObj.type === 'lottie' ? (
                <div
                  className="w-[90vw] h-[80vh] sm:w-[85vw] sm:h-[75vh] cursor-pointer flex items-center justify-center"
                  onClick={() => handleImageClick(currentImageObj, currentImage)}
                  style={{ maxWidth: 'none', maxHeight: 'none' }}
                >
                  <DotLottieReact
                    src={currentImageObj.imageUrl}
                    loop
                    autoplay
                    className="w-full h-full"
                    style={{ width: '100%', height: '100%' }}
                  />
                </div>
              ) : (
                <img
                  src={currentImageObj.imageUrl}
                  alt={currentImageObj.altText}
                  className="max-w-[90vw] max-h-[70vh] sm:max-w-[80vw] sm:max-h-[60vh] w-full h-full object-contain cursor-pointer select-none rounded-lg"
                  draggable={false}
                  onDragStart={(e) => e.preventDefault()}
                  onClick={() => handleImageClick(currentImageObj, currentImage)}
                />
              )}
            </div>
          )}

          {/* Navigation Dots */}
          {images.length > 1 && imagesLoaded && (
            <div className="absolute bottom-4 sm:bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2 sm:gap-3 bg-black/30 px-3 py-2 sm:px-4 rounded-full">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImage(index)}
                  className={`rounded-full ${
                    currentImage === index
                      ? 'bg-white w-6 h-2 sm:w-8 h-2'
                      : 'bg-white/40 w-2 h-2 sm:w-2 h-2'
                  }`}
                  aria-label={`Go to image ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
