import React from 'react';
import { Home, MessageCircle } from 'lucide-react';
import { AgencyConfig } from '../types/property';

interface ContactProps {
  config: AgencyConfig;
}

function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  const local = cleaned.startsWith('54') && cleaned.length >= 11 ? cleaned.slice(2) : cleaned;
  if (local.length === 10) {
    return `${local.slice(0, 2)} ${local.slice(2, 6)}-${local.slice(6)}`;
  }
  return phone;
}

function whatsappLink(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  return `https://wa.me/${cleaned}`;
}

const ContactCard: React.FC<{ label: string; phone: string }> = ({ label, phone }) => (
  <a
    href={whatsappLink(phone)}
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center justify-between w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl px-6 py-5 hover:bg-white/15 transition-all"
  >
    <div className="flex flex-col">
      <span className="text-white/60 text-[10px] uppercase tracking-[0.2em] font-bold mb-1">{label}</span>
      <span className="text-white text-2xl font-bold tracking-tight">{formatPhone(phone)}</span>
    </div>
    <div className="w-12 h-12 rounded-2xl bg-[#25D366] flex items-center justify-center text-white shadow-lg shadow-[#25D366]/20">
      <MessageCircle className="w-6 h-6 fill-current" />
    </div>
  </a>
);

const Contact: React.FC<ContactProps> = ({ config }) => {
  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-zinc-950">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: 'radial-gradient(circle at 50% 30%, rgba(60,50,40,0.6) 0%, rgba(10,10,10,0.95) 70%), linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.7))',
        }}
      />
      <div className="absolute inset-0 backdrop-blur-xl" />

      <div className="relative z-10 w-full max-w-md px-6 py-12 flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full border border-white/30 bg-white/10 backdrop-blur-md flex items-center justify-center mb-8">
          <Home className="w-7 h-7 text-white" />
        </div>

        <p className="text-white/70 text-xs uppercase tracking-[0.3em] font-bold mb-3">PROPIEDADES</p>
        <h1 className="text-3xl font-serif text-white leading-tight mb-1">
          Coordina hoy tu visita
        </h1>
        <h2 className="text-3xl font-serif text-[#25D366] mb-10">
          por WhatsApp
        </h2>

        <div className="w-full flex flex-col gap-4 mb-12">
          <ContactCard label="WhatsApp" phone={config.whatsapp} />
          {config.whatsapp_claudia && (
            <ContactCard label="WhatsApp" phone={config.whatsapp_claudia} />
          )}
        </div>

        <p className="text-white/50 text-sm italic">"no te duermas"</p>
      </div>
    </div>
  );
};

export default Contact;
