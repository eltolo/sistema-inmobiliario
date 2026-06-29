import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Maximize2, Home, ChevronLeft, ChevronRight } from 'lucide-react';
import { Property } from '../types/property';
import { thumbUrl } from '../lib/utils';

interface HeroProps {
  property: Property;
}

const Hero: React.FC<HeroProps> = ({ property }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Reset index when property changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [property.id]);

  const images = property.images.length > 0 ? property.images : ['/images/placeholder.jpg'];

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <section className="pt-24 pb-12 bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6"
        >
          {/* Main Gallery / Carousel */}
          <div className="lg:col-span-8 space-y-4">
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-white/10 group bg-zinc-900">
              {property.status !== "Disponible" && (
                <div className="absolute top-4 left-4 z-20 bg-black/80 backdrop-blur-md px-5 py-2 rounded-full text-xs font-bold border uppercase tracking-[0.2em] border-amber-500/30 text-amber-500">
                  {property.status}
                </div>
              )}
              <AnimatePresence mode="wait">
                  <motion.img
                    key={`${property.id}-${currentIndex}`}
                    src={images[currentIndex]}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3 }}
                    className={`w-full h-full object-cover ${property.status !== "Disponible" && property.status !== "Pausado" ? 'grayscale opacity-50' : ''}`}
                    alt={`${property.title} - Foto ${currentIndex + 1}`}
                    loading="lazy"
                  />
              </AnimatePresence>

              {images.length > 1 && (
                <>
                  <div className="absolute inset-0 flex items-center justify-between p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={prevImage}
                      className="p-2 rounded-full bg-black/50 text-white hover:bg-amber-500 hover:text-black transition-all"
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <button 
                      onClick={nextImage}
                      className="p-2 rounded-full bg-black/50 text-white hover:bg-amber-500 hover:text-black transition-all"
                    >
                      <ChevronRight size={24} />
                    </button>
                  </div>

                  <div className="absolute bottom-4 right-4 bg-black/60 px-3 py-1 rounded-full text-white text-xs font-medium border border-white/10">
                    {currentIndex + 1} / {images.length}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnails Slider */}
            {images.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`flex-shrink-0 w-24 aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                      currentIndex === index ? 'border-amber-500 scale-105' : 'border-transparent opacity-50 hover:opacity-100'
                    }`}
                  >
                    <img src={thumbUrl(img)} className={`w-full h-full object-cover ${property.status !== "Disponible" && property.status !== "Pausado" ? 'grayscale opacity-50' : ''}`} alt={`Thumbnail ${index + 1}`} loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Info */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-zinc-900 p-8 rounded-2xl border border-white/10 h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-amber-500 text-sm font-medium mb-4">
                  <span className="px-2 py-1 bg-amber-500/10 rounded uppercase tracking-wider">
                    En {property.operation}
                  </span>
                </div>
                <h1 className="text-4xl font-serif text-white mb-2 leading-tight">{property.address}</h1>
                <div className="flex items-center gap-2 text-white/50 mb-8">
                  <MapPin size={16} />
                  <span>{property.neighborhood}, CABA</span>
                </div>
                
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between items-end">
                    <span className="text-white/40 uppercase tracking-tighter text-xs">Precio</span>
                    <span className="text-3xl text-white font-serif">{property.price}</span>
                  </div>
                  <div className="flex justify-between items-end border-t border-white/5 pt-4">
                    <span className="text-white/40 uppercase tracking-tighter text-xs">Expensas</span>
                    <span className="text-lg text-white/80">{property.expenses}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                    <div className="text-white/40 mb-1 flex items-center gap-2">
                      <Maximize2 size={14} />
                      <span className="text-[10px] uppercase tracking-wider">Totales</span>
                    </div>
                    <div className="text-white font-medium">{property.total_area}</div>
                  </div>
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                    <div className="text-white/40 mb-1 flex items-center gap-2">
                      <Home size={14} />
                      <span className="text-[10px] uppercase tracking-wider">Ambientes</span>
                    </div>
                    <div className="text-white font-medium">{property.rooms} Amb.</div>
                  </div>
                </div>
              </div>

              <button className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-xl transition-all mt-8 uppercase tracking-widest text-sm shadow-lg shadow-amber-500/10">
                Solicitar Visita
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
