import React from 'react';
import { Ruler, Navigation, Clock, ShieldCheck, Sun, Building2 } from 'lucide-react';
import { Property } from '../types/property';

interface PropertyDetailsProps {
  property: Property;
}

const PropertyDetails: React.FC<PropertyDetailsProps> = ({ property }) => {
  const details = [
    { icon: <Ruler size={20} />, label: 'Metros Cubiertos', value: property.covered_area + ' m²' },
    { icon: <Navigation size={20} />, label: 'Ubicación', value: property.location },
    { icon: <Sun size={20} />, label: 'Orientación', value: property.orientation },
    { icon: <Clock size={20} />, label: 'Antigüedad', value: property.age },
    { icon: <Building2 size={20} />, label: 'Dormitorios', value: property.bedrooms || property.rooms },
    { icon: <ShieldCheck size={20} />, label: 'Baños', value: '1' },
  ];

  return (
    <section className="py-12 bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-2xl font-serif text-white mb-8 border-l-4 border-amber-500 pl-4 uppercase tracking-widest">
          Ficha Técnica
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {details.map((item, index) => (
            <div key={index} className="bg-zinc-900/50 p-6 rounded-2xl border border-white/5 hover:border-amber-500/30 transition-colors group">
              <div className="text-amber-500 mb-4 group-hover:scale-110 transition-transform">
                {item.icon}
              </div>
              <div className="text-white/40 text-[10px] uppercase tracking-wider mb-1">{item.label}</div>
              <div className="text-white font-medium">{item.value}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PropertyDetails;
