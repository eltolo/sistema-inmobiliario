import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Award, Target, Heart, Building, Users } from 'lucide-react';
import webDataRaw from '../data/properties.json';
import { WebData } from '../types/property';
const data = webDataRaw as WebData;
const c = data.config;

const stats = [
  { icon: <Building size={24} />, value: '10+', label: 'Años de Trayectoria' },
  { icon: <Target size={24} />, value: 'CABA', label: 'Cobertura' },
  { icon: <Heart size={24} />, value: '100%', label: 'Acompañamiento' },
  { icon: <Users size={24} />, value: 'Asesoría', label: 'Personalizada' },
];

export default function About() {
  return (
    <div className="min-h-screen bg-zinc-950 pt-24">
      {/* Hero */}
      <section className="py-20 border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 rounded-full text-amber-500 text-xs uppercase tracking-widest mb-8">
            <Award size={16} />
            <span>Más de 10 años en el mercado</span>
          </div>
          <h1 className="text-5xl font-serif text-white mb-6 leading-tight">
            {c.agency_name}
          </h1>
          <div className="flex items-center justify-center gap-2 text-white/50 mb-8">
            <MapPin size={16} />
            <span>{c.address}</span>
          </div>
          <p className="text-lg text-white/60 leading-relaxed max-w-2xl mx-auto">
            Nos dedicamos al alquiler y venta de propiedades en toda la Capital Federal.
            Contamos con <strong className="text-white">10 años de trayectoria</strong> en el Mercado Inmobiliario,
            ayudando a personas y empresas a concretar sus proyectos.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((s, i) => (
              <div key={i} className="bg-zinc-900/50 p-8 rounded-2xl border border-white/5 text-center hover:border-amber-500/30 transition-colors">
                <div className="text-amber-500 mb-4 flex justify-center">{s.icon}</div>
                <div className="text-3xl font-serif text-white mb-1">{s.value}</div>
                <div className="text-white/40 text-xs uppercase tracking-widest">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Filosofía */}
      <section className="py-20 border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-serif text-white mb-8 border-l-4 border-amber-500 pl-4 uppercase tracking-widest">
            Nuestra Filosofía
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-zinc-900/30 p-8 rounded-2xl border border-white/5">
              <Target className="text-amber-500 mb-4" size={32} />
              <h3 className="text-lg font-serif text-white mb-3">Misión</h3>
              <p className="text-white/50 leading-relaxed text-sm">
                Brindar asesoramiento y acompañamiento a lo largo de todo el proceso
                inmobiliario, garantizando transparencia, confianza y resultados
                para nuestros clientes.
              </p>
            </div>
            <div className="bg-zinc-900/30 p-8 rounded-2xl border border-white/5">
              <Award className="text-amber-500 mb-4" size={32} />
              <h3 className="text-lg font-serif text-white mb-3">Valores</h3>
              <p className="text-white/50 leading-relaxed text-sm">
                Compromiso, honestidad y dedicación. Creemos en el trabajo serio
                y en construir relaciones de largo plazo con quienes confían en nosotros
                para encontrar su próximo hogar o inversión.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contacto */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-serif text-white mb-8 border-l-4 border-amber-500 pl-4 uppercase tracking-widest inline-block">
            Contacto
          </h2>
          <div className="flex flex-col md:flex-row justify-center gap-8 mt-8">
            <a href={`tel:${c.whatsapp}`} className="flex items-center gap-4 bg-zinc-900/50 p-6 rounded-2xl border border-white/5 hover:border-amber-500/30 transition-colors">
              <Phone className="text-amber-500" size={24} />
              <div className="text-left">
                <div className="text-white/40 text-[10px] uppercase tracking-widest mb-1">Teléfono</div>
                <div className="text-white font-medium">{c.whatsapp}</div>
              </div>
            </a>
            <a href={`mailto:${c.email}`} className="flex items-center gap-4 bg-zinc-900/50 p-6 rounded-2xl border border-white/5 hover:border-amber-500/30 transition-colors">
              <Mail className="text-amber-500" size={24} />
              <div className="text-left">
                <div className="text-white/40 text-[10px] uppercase tracking-widest mb-1">Email</div>
                <div className="text-white font-medium">{c.email}</div>
              </div>
            </a>
            <div className="flex items-center gap-4 bg-zinc-900/50 p-6 rounded-2xl border border-white/5">
              <MapPin className="text-amber-500" size={24} />
              <div className="text-left">
                <div className="text-white/40 text-[10px] uppercase tracking-widest mb-1">Dirección</div>
                <div className="text-white font-medium">{c.address}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-20">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <Link to="/" className="inline-block px-8 py-4 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-xl transition-all uppercase tracking-widest text-sm shadow-lg shadow-amber-500/10">
            Ver Propiedades
          </Link>
        </div>
      </section>
    </div>
  );
}
