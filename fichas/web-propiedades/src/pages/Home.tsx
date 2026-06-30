import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Phone, Calendar, Camera, Handshake, CheckCircle, ArrowRight, Home as HomeIcon, MapPin, Mail } from 'lucide-react';
import webDataRaw from '../data/properties.json';
import { WebData } from '../types/property';
import { thumbUrl } from '../lib/utils';

const data = webDataRaw as WebData;

const whatsappNumber = data.config.whatsapp_claudia || data.config.whatsapp;
const whatsappLink = (text: string) => `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;

const fadeIn = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-50px' },
  transition: { duration: 0.6, delay }
});

export default function Home() {
  const [form, setForm] = useState({ name: '', phone: '', address: '', message: '' });
  const [formStatus, setFormStatus] = useState<'idle' | 'sent'>('idle');
  const [filterOp, setFilterOp] = useState('Todos');
  const [filterCat, setFilterCat] = useState('Todos');

  const categories = [
    { label: 'Todos', value: 'Todos' },
    { label: 'Departamentos', value: 'Departamento' },
    { label: 'Casas', value: 'Casa' },
    { label: 'PH', value: 'PH' },
    { label: 'Oficinas', value: 'Oficina' },
    { label: 'Locales', value: 'Local Comercial' },
    { label: 'Cocheras', value: 'Cochera' },
  ];
  const operations = ['Todos', 'Venta', 'Alquiler'];

  useEffect(() => {
    // Schema.org LocalBusiness
    const existing = document.getElementById('schema-localbusiness');
    if (existing) existing.remove();
    const script = document.createElement('script');
    script.id = 'schema-localbusiness';
    script.type = 'application/ld+json';
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'RealEstateAgent',
      name: data.config.agency_name,
      url: 'https://quintana.cabapropiedades.ar',
      telephone: data.config.whatsapp,
      email: data.config.email,
      address: {
        '@type': 'PostalAddress',
        streetAddress: data.config.address,
        addressLocality: 'Buenos Aires',
        addressCountry: 'AR'
      },
      areaServed: {
        '@type': 'City',
        name: 'Capital Federal'
      },
      priceRange: '$$'
    });
    document.head.appendChild(script);
    return () => {
      const s = document.getElementById('schema-localbusiness');
      if (s) s.remove();
    };
  }, []);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = `Hola, soy ${form.name}. Quiero solicitar una tasación sin cargo.\nTeléfono: ${form.phone}\nDirección: ${form.address}\n${form.message}`;
    window.open(whatsappLink(text), '_blank');
    setFormStatus('sent');
  };

  const filtered = data.properties.filter(p => {
    if (filterOp !== 'Todos' && p.operation !== filterOp) return false;
    if (filterCat !== 'Todos' && p.type !== filterCat) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/90 to-zinc-950/60" />
          <img
            src="/images/hero-bg.jpg"
            alt="Propiedades en CABA"
            className="w-full h-full object-cover opacity-40"
            loading="eager"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <motion.div {...fadeIn(0)} className="max-w-3xl">
            <span className="inline-block text-amber-500 text-xs uppercase tracking-[0.3em] font-bold mb-6 border border-amber-500/30 px-4 py-2 rounded-full">
              Quintana Servicios Inmobiliarios
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif text-white leading-tight mb-6">
              Vendé o alquilá tu propiedad en CABA con atención personalizada y tecnología.
            </h1>
            <p className="text-lg sm:text-xl text-white/70 mb-8 leading-relaxed max-w-2xl">
              En Quintana acompañamos todo el proceso: tasación profesional, publicación en los principales portales, fotografía de calidad, difusión en redes sociales y seguimiento personalizado hasta el cierre de la operación.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="#tasacion"
                className="inline-flex items-center justify-center gap-2 bg-amber-500 text-black px-8 py-4 rounded-full font-bold uppercase tracking-wider hover:bg-amber-400 transition-all"
              >
                <Calendar size={20} />
                Solicitar Tasación
              </a>
              <a
                href={whatsappLink('Hola, quiero vender/alquilar una propiedad en CABA. ¿Me pueden asesorar?')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 border border-white/20 text-white px-8 py-4 rounded-full font-bold uppercase tracking-wider hover:bg-white/10 transition-all"
              >
                <Phone size={20} />
                WhatsApp
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Beneficios */}
      <section className="py-20 bg-zinc-900 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: HomeIcon, title: 'Tasación Profesional', desc: 'Precio realista según el mercado actual.' },
              { icon: Camera, title: 'Fotografías de Alta Calidad', desc: 'Imágenes que destacan el valor de tu propiedad.' },
              { icon: ArrowRight, title: 'Máxima Difusión', desc: 'Publicación en portales y redes sociales.' },
              { icon: Handshake, title: 'Acompañamiento Personalizado', desc: 'Te acompañamos hasta el cierre de la operación.' },
            ].map((item, i) => (
              <motion.div key={item.title} {...fadeIn(i * 0.1)} className="bg-zinc-950/50 border border-white/5 rounded-2xl p-8 text-center hover:border-amber-500/30 transition-all">
                <div className="w-14 h-14 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-amber-500">
                  <item.icon size={28} />
                </div>
                <h3 className="text-white font-serif text-xl mb-3">{item.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ¿Por qué elegirnos? */}
      <section className="py-24 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div {...fadeIn(0)}>
              <span className="text-amber-500 text-xs uppercase tracking-[0.3em] font-bold">No vendemos solamente propiedades</span>
              <h2 className="text-3xl sm:text-4xl font-serif text-white mt-4 mb-6">Vendemos confianza.</h2>
              <p className="text-white/60 mb-8 leading-relaxed">
                En Quintana Sabemos que confiarle la venta o alquiler de tu propiedad a una inmobiliaria es una decisión importante. Por eso trabajamos con transparencia, comunicación constante y resultados medibles.
              </p>
              <ul className="space-y-4">
                {[
                  'Atención personalizada de principio a fin',
                  'Respuesta rápida a tus consultas',
                  'Tecnología para promocionar propiedades',
                  'Publicación en múltiples portales',
                  'Seguimiento permanente hasta el cierre'
                ].map((text, i) => (
                  <li key={i} className="flex items-start gap-3 text-white/80">
                    <CheckCircle className="text-amber-500 shrink-0 mt-1" size={20} />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
            <motion.div {...fadeIn(0.2)} className="relative rounded-2xl overflow-hidden border border-white/5 aspect-[4/3]">
              <img
                src="/images/about-bg.jpg"
                alt="Inmobiliaria Quintana"
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <div className="flex items-center gap-3 text-white/80 text-sm">
                  <MapPin size={18} className="text-amber-500" />
                  <span>{data.config.address}</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Claudia */}
      <section className="py-24 bg-zinc-900 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div {...fadeIn(0)} className="order-2 lg:order-1 relative">
              <div className="aspect-[3/4] max-w-md mx-auto rounded-2xl overflow-hidden border border-white/5 bg-zinc-800">
                <img
                  src="/images/claudia.jpg"
                  alt="Claudia - Quintana Servicios Inmobiliarios"
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = '<div class="flex items-center justify-center h-full text-white/30 text-sm uppercase tracking-widest">Foto de Claudia</div>';
                    }
                  }}
                />
              </div>
            </motion.div>
            <motion.div {...fadeIn(0.2)} className="order-1 lg:order-2">
              <span className="text-amber-500 text-xs uppercase tracking-[0.3em] font-bold">Tu contacto</span>
              <h2 className="text-3xl sm:text-4xl font-serif text-white mt-4 mb-6">Hola, soy Claudia.</h2>
              <p className="text-white/60 text-lg leading-relaxed mb-8">
                Nuestro compromiso es acompañarte durante todo el proceso de compra, venta o alquiler para que tomes decisiones con tranquilidad.
              </p>
              <a
                href={whatsappLink('Hola Claudia, quiero hablar sobre una propiedad.')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#25D366] text-white px-8 py-4 rounded-full font-bold uppercase tracking-wider hover:scale-105 transition-transform"
              >
                <Phone size={20} />
                Hablar con Claudia
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Propiedades */}
      <section id="propiedades" className="py-24 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeIn(0)} className="text-center mb-16">
            <span className="text-amber-500 text-xs uppercase tracking-[0.3em] font-bold">Propiedades</span>
            <h2 className="text-3xl sm:text-4xl font-serif text-white mt-4 mb-4">Conocé nuestras propiedades</h2>
            <p className="text-white/50">Explorá las mejores oportunidades en Capital Federal.</p>
          </motion.div>

          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {operations.map(op => (
              <button key={op} onClick={() => setFilterOp(op)}
                className={`px-4 py-2 rounded-full border text-xs uppercase tracking-widest transition-all ${
                  filterOp === op
                    ? 'bg-zinc-900 border-white/10 text-white/80'
                    : 'bg-zinc-900/30 border-white/5 text-white/30 hover:text-white/60'
                }`}>
                {op}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {categories.map(cat => (
              <button key={cat.value} onClick={() => setFilterCat(cat.value)}
                className={`px-4 py-2 rounded-full border text-xs uppercase tracking-widest transition-all ${
                  filterCat === cat.value
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                    : 'bg-zinc-900/30 border-white/5 text-white/30 hover:text-white/60'
                }`}>
                {cat.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.slice(0, 6).map((prop) => (
              <Link
                key={prop.id}
                to={`/property/${prop.id}`}
                className="group bg-zinc-900 rounded-2xl overflow-hidden border border-white/5 hover:border-amber-500/50 transition-all hover:-translate-y-1 relative"
              >
                {prop.status !== 'Disponible' && (
                  <div className={`absolute top-4 left-4 z-10 bg-black/80 backdrop-blur-md px-4 py-1 rounded-full text-[10px] font-bold border uppercase tracking-[0.2em] text-amber-500 border-amber-500/30`}>
                    {prop.status}
                  </div>
                )}
                <div className="aspect-[4/3] overflow-hidden relative">
                  <img
                    src={thumbUrl(prop.images[0] || '/images/placeholder.jpg')}
                    alt={prop.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-white text-[10px] font-bold border border-white/10 uppercase tracking-widest">
                    {prop.operation}
                  </div>
                </div>
                <div className="p-6">
                  <div className="text-amber-500 font-serif text-xl mb-1">{prop.price}</div>
                  <h3 className="text-white font-medium mb-2 truncate uppercase tracking-tight">{prop.address}</h3>
                  <p className="text-white/40 text-xs mb-4 uppercase tracking-wider">{prop.neighborhood}</p>
                  <div className="flex gap-4 text-white/60 text-[10px] border-t border-white/5 pt-4 uppercase tracking-widest">
                    <span>{prop.rooms} Amb.</span>
                    <span>{prop.total_area} m²</span>
                    <span className="ml-auto">{prop.type}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-12">
            <a href="#propiedades" className="inline-flex items-center gap-2 text-amber-500 uppercase tracking-widest text-xs font-bold hover:gap-4 transition-all">
              Ver todas las propiedades <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </section>

      {/* CTA Final - Tasación */}
      <section id="tasacion" className="py-24 bg-zinc-900 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeIn(0)} className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-serif text-white mb-4">¿Querés conocer el valor actual de tu propiedad?</h2>
            <p className="text-white/60 text-lg">Solicitá una tasación sin cargo.</p>
          </motion.div>

          <motion.form {...fadeIn(0.1)} onSubmit={handleFormSubmit} className="bg-zinc-950 border border-white/5 rounded-2xl p-8 sm:p-12">
            {formStatus === 'sent' ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-[#25D366]/10 rounded-full flex items-center justify-center mx-auto mb-6 text-[#25D366]">
                  <Phone size={32} />
                </div>
                <h3 className="text-2xl font-serif text-white mb-2">¡Solicitud enviada!</h3>
                <p className="text-white/60 mb-6">Te contactaremos a la brevedad para coordinar la tasación.</p>
                <button
                  type="button"
                  onClick={() => setFormStatus('idle')}
                  className="text-amber-500 uppercase tracking-widest text-xs font-bold hover:text-amber-400"
                >
                  Enviar otra consulta
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="sm:col-span-2">
                  <label className="block text-white/60 text-xs uppercase tracking-widest mb-2">Nombre</label>
                  <input
                    required
                    type="text"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full bg-zinc-900 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-amber-500 transition-colors"
                    placeholder="Tu nombre"
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-xs uppercase tracking-widest mb-2">Teléfono</label>
                  <input
                    required
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full bg-zinc-900 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-amber-500 transition-colors"
                    placeholder="11 1234 5678"
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-xs uppercase tracking-widest mb-2">Dirección de la propiedad</label>
                  <input
                    required
                    type="text"
                    value={form.address}
                    onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                    className="w-full bg-zinc-900 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-amber-500 transition-colors"
                    placeholder="Av. Córdoba 1234, CABA"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-white/60 text-xs uppercase tracking-widest mb-2">Mensaje</label>
                  <textarea
                    rows={4}
                    value={form.message}
                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    className="w-full bg-zinc-900 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-amber-500 transition-colors"
                    placeholder="Contanos más sobre la propiedad..."
                  />
                </div>
                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    className="w-full bg-amber-500 text-black px-8 py-4 rounded-lg font-bold uppercase tracking-wider hover:bg-amber-400 transition-all flex items-center justify-center gap-2"
                  >
                    <Mail size={20} />
                    Solicitar Tasación
                  </button>
                  <p className="text-white/30 text-xs text-center mt-4">
                    Al enviar, te abriremos WhatsApp para completar la solicitud.
                  </p>
                </div>
              </div>
            )}
          </motion.form>
        </div>
      </section>
    </div>
  );
}