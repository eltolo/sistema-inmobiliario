import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useParams, useLocation, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import PropertyDetails from './components/PropertyDetails';
import Description from './components/Description';
import Multimedia from './components/Multimedia';
import WhatsAppButton from './components/WhatsAppButton';
import Admin from './pages/Admin';
import About from './pages/About';
import Contact from './pages/Contact';
import Home from './pages/Home';
import webDataRaw from './data/properties.json';
import { Property, WebData } from './types/property';

const data = webDataRaw as WebData;

const PropertyPage = () => {
  const { id } = useParams<{ id: string }>();
  const [property, setProperty] = useState<Property | null>(null);

  useEffect(() => {
    const found = data.properties.find(p => p.id === id) || data.properties[0];
    setProperty(found);
  }, [id]);

  if (!property) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">Cargando propiedad...</div>;

  return (
    <>
      <Hero property={property} />
      <Multimedia property={property} />
      {property.map && (
        <section className="py-12 bg-zinc-950">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-2xl font-serif text-white mb-8 border-l-4 border-amber-500 pl-4 uppercase tracking-widest">
              Ubicación
            </h2>
            <div className="rounded-2xl overflow-hidden border border-white/10">
              <iframe
                src={property.map}
                className="w-full h-[400px]"
                title="Mapa interactivo"
                loading="lazy"
              />
            </div>
          </div>
        </section>
      )}
      <PropertyDetails property={property} />
      <Description property={property} />
    </>
  );
};

function AppContent() {
  const location = useLocation();
  const match = location.pathname.match(/^\/property\/(.+)/);
  const currentProp = match ? data.properties.find(p => p.id === match[1]) : null;

  return (
    <div className="min-h-screen bg-zinc-950 font-sans selection:bg-amber-500 selection:text-black">
      <Navbar config={data.config} />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/property/:id" element={<PropertyPage />} />
          <Route path="/nosotros" element={<About />} />
          <Route path="/contacto" element={<Contact config={data.config} />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </main>
      
      <footer className="py-20 bg-black border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex flex-col items-center mb-8">
              <span className="text-2xl font-serif tracking-widest text-white uppercase">Quintana</span>
              <span className="text-[10px] tracking-[0.3em] text-amber-500 uppercase font-sans">Servicios Inmobiliarios</span>
          </div>
          <div className="flex justify-center gap-8 mb-8 text-white/40 text-[10px] uppercase tracking-[0.2em]">
            <a href={`mailto:${data.config.email}`} className="hover:text-amber-500">{data.config.email}</a>
            <span>{data.config.address}</span>
            <a href="#" className="hover:text-amber-500">{data.config.instagram}</a>
          </div>
          <p className="text-white/20 text-[10px] uppercase tracking-widest">
            © 2026 {data.config.agency_name}. Todos los derechos reservados.
          </p>
          <div className="mt-8">
            <Link to="/admin" className="text-[10px] text-white/10 hover:text-white/30 uppercase tracking-[0.3em] transition-colors">Acceso Admin</Link>
          </div>
        </div>
      </footer>

      {location.pathname !== '/contacto' && (
        <WhatsAppButton whatsapp={data.config.whatsapp} propertyName={currentProp?.address} />
      )}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
