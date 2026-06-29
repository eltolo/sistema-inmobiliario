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
import webDataRaw from './data/properties.json';
import { Property, WebData } from './types/property';
import { thumbUrl } from './lib/utils';

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

const CATEGORIES = [
  { label: 'Todos', value: 'Todos' },
  { label: 'Departamentos', value: 'Departamento' },
  { label: 'Casas', value: 'Casa' },
  { label: 'PH', value: 'PH' },
  { label: 'Oficinas', value: 'Oficina' },
  { label: 'Locales Comerciales', value: 'Local Comercial' },
  { label: 'Cocheras', value: 'Cochera' },
];
const OPERATIONS = ['Todos', 'Venta', 'Alquiler'];

const HomePage = () => {
  const [filterOp, setFilterOp] = useState('Todos');
  const [filterCat, setFilterCat] = useState('Todos');

  const filtered = data.properties.filter(p => {
    if (filterOp !== 'Todos' && p.operation !== filterOp) return false;
    if (filterCat !== 'Todos' && p.type !== filterCat) return false;
    return true;
  });

  return (
    <div className="pt-32 pb-20 px-4 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
        <div>
          <h1 className="text-2xl font-serif text-white mb-2 border-l-4 border-amber-500 pl-6 uppercase tracking-widest">
            Nuestras Propiedades
          </h1>
          <p className="text-white/40 pl-6 uppercase tracking-tighter text-xs">Explora las mejores oportunidades en Capital Federal</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {OPERATIONS.map(op => (
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
      </div>

      <div className="flex flex-wrap gap-2 mb-10">
        {CATEGORIES.map(cat => (
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
        {filtered.map((prop) => (
          <Link 
            key={prop.id} 
            to={`/property/${prop.id}`}
            className="group bg-zinc-900 rounded-2xl overflow-hidden border border-white/5 hover:border-amber-500/50 transition-all hover:-translate-y-1 relative"
          >
            {/* Badge de Estado (Vendido/Alquilado) */}
            {prop.status !== "Disponible" && (
              <div className={`absolute top-4 left-4 z-10 bg-black/80 backdrop-blur-md px-4 py-1 rounded-full text-[10px] font-bold border uppercase tracking-[0.2em] ${
                prop.status === 'Pausado' ? 'text-amber-500 border-amber-500/30' : 'text-amber-500 border-amber-500/30'
              }`}>
                {prop.status}
              </div>
            )}

            <div className="aspect-[3/4] overflow-hidden relative">
              <img 
                src={thumbUrl(prop.images[0] || '/images/placeholder.jpg')} 
                alt={prop.title}
                className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ${prop.status !== "Disponible" && prop.status !== "Pausado" ? 'grayscale opacity-50' : prop.status === 'Pausado' ? 'opacity-40' : ''}`}
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
    </div>
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
          <Route path="/" element={<HomePage />} />
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
