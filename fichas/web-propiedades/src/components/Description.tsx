import React from 'react';
import { Property } from '../types/property';

interface DescriptionProps {
  property: Property;
}

const Description: React.FC<DescriptionProps> = ({ property }) => {
  return (
    <section className="py-12 bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8">
            <h2 className="text-2xl font-serif text-white mb-8 border-l-4 border-amber-500 pl-4 uppercase tracking-widest">
              Descripción
            </h2>
            <div className="prose prose-invert max-w-none text-white/70 leading-relaxed whitespace-pre-line">
              {property.description}
            </div>
          </div>
          
          <div className="lg:col-span-4">
            <div className="bg-amber-500/5 p-8 rounded-2xl border border-amber-500/10 sticky top-24">
              <h3 className="text-amber-500 font-serif mb-4 uppercase tracking-widest text-sm">Resumen de Propiedad</h3>
              <ul className="space-y-3 text-white/60 text-sm">
                <li className="flex justify-between border-b border-white/5 pb-2">
                  <span>Tipo</span> <span className="text-white font-medium">{property.type}</span>
                </li>
                <li className="flex justify-between border-b border-white/5 pb-2">
                  <span>Estado</span> <span className="text-white font-medium">{property.operation}</span>
                </li>
                <li className="flex justify-between border-b border-white/5 pb-2">
                  <span>Ambientes</span> <span className="text-white font-medium">{property.rooms}</span>
                </li>
                <li className="flex justify-between border-b border-white/5 pb-2">
                  <span>Dormitorios</span> <span className="text-white font-medium">{property.bedrooms || '-'}</span>
                </li>
                <li className="flex justify-between border-b border-white/5 pb-2">
                  <span>Superficie</span> <span className="text-white font-medium">{property.total_area} m²</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Description;
