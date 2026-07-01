import React from 'react';
import { Link } from 'react-router-dom';
import { AgencyConfig } from '../types/property';

interface NavbarProps {
  config: AgencyConfig;
}

const Navbar: React.FC<NavbarProps> = ({ config }) => {
  return (
    <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex flex-col">
          <span className="text-2xl font-serif tracking-widest text-white">
            <span className="uppercase">Quintana</span>
            <br />
            <span className="text-[10px] tracking-[0.3em] text-amber-500 uppercase font-sans">Servicios Inmobiliarios</span>
          </span>
        </Link>
        <div className="hidden md:flex items-center gap-8 text-[10px] uppercase tracking-[0.2em] text-white/70 font-bold">
          <Link to="/" className="hover:text-amber-500 transition-colors">Propiedades</Link>
          <a href="/#tasacion" className="hover:text-amber-500 transition-colors">Asesoramiento</a>
          <Link to="/nosotros" className="hover:text-amber-500 transition-colors">Nosotros</Link>
          <Link to="/contacto" className="hover:text-amber-500 transition-colors">Contacto</Link>
        </div>
        <a
          href="/#tasacion"
          className="inline-flex items-center gap-2 bg-amber-500 text-black px-4 py-2 rounded-full text-[10px] uppercase tracking-wider font-bold hover:bg-amber-400 transition-all"
        >
          Solicitar asesoramiento
        </a>
      </div>
    </nav>
  );
};

export default Navbar;
