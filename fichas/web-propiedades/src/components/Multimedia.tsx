import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Headphones, Film } from 'lucide-react';
import { Property } from '../types/property';

interface MultimediaProps {
  property: Property;
}

const Multimedia: React.FC<MultimediaProps> = ({ property }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Reset audio when property changes
  useEffect(() => {
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.load();
    }
  }, [property.id]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <section className="py-12 bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Audio Narración */}
          {property.audio ? (
            <div className="bg-zinc-900 p-8 rounded-2xl border border-white/10 flex items-center gap-6">
              <div 
                className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer hover:scale-105 transition-transform shadow-lg shadow-amber-500/20" 
                onClick={togglePlay}
              >
                {isPlaying ? <Pause size={24} className="text-black fill-black" /> : <Play size={24} className="text-black fill-black ml-1" />}
              </div>
              <div>
                <div className="flex items-center gap-2 text-amber-500 mb-1">
                  <Headphones size={14} />
                  <span className="text-[10px] uppercase tracking-[0.2em] font-bold">Audio Tour</span>
                </div>
                <h3 className="text-white font-serif text-lg">Narración de la propiedad</h3>
                <p className="text-white/40 text-xs">Escucha los detalles más importantes mientras recorres las fotos.</p>
                <audio 
                  ref={audioRef}
                  src={property.audio}
                  onEnded={() => setIsPlaying(false)}
                />
              </div>
            </div>
          ) : (
            <div className="bg-zinc-900/30 p-8 rounded-2xl border border-white/5 flex items-center gap-6 opacity-40">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center flex-shrink-0">
                <Headphones size={24} className="text-white/20" />
              </div>
              <div>
                <h3 className="text-white/40 font-serif text-lg">Sin narración</h3>
                <p className="text-white/20 text-xs">Esta propiedad no cuenta con audio tour todavía.</p>
              </div>
            </div>
          )}

          {/* Video Tour (Placeholder) */}
          <div className="bg-zinc-900/30 p-8 rounded-2xl border border-white/5 flex items-center gap-6 opacity-40">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center flex-shrink-0">
              <Film size={24} className="text-white/20" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-white/40 mb-1">
                <Film size={14} />
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold">Video Tour</span>
              </div>
              <h3 className="text-white/40 font-serif text-lg">Video no disponible</h3>
              <p className="text-white/20 text-xs">Estamos preparando un recorrido en video.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Multimedia;
