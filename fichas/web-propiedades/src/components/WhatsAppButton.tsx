import React from 'react';
import { MessageCircle } from 'lucide-react';

interface WhatsAppButtonProps {
  whatsapp: string;
  propertyName?: string;
}

const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({ whatsapp, propertyName }) => {
  const msg = propertyName
    ? `Hola, te contacto por ${propertyName}`
    : 'Hola, quiero conocer el valor de mi propiedad en CABA. ¿Me pueden asesorar?';
  return (
    <a
      href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(msg)}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-8 right-8 z-50 bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform flex items-center justify-center group"
      aria-label="Contactar por WhatsApp"
    >
      <MessageCircle size={32} />
      <span className="absolute right-full mr-4 bg-white text-black px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg border border-black/5">
        {propertyName ? '¿Te interesa esta propiedad?' : 'Solicitar asesoramiento'}
      </span>
    </a>
  );
};

export default WhatsAppButton;
