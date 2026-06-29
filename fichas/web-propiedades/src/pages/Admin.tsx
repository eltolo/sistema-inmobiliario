import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Save, RefreshCw, LogOut, Settings, Building2, CheckCircle, Clock, AlertCircle, Trash2, Plus, ExternalLink, Loader2, X, Instagram, Copy, Download, Image as ImageIcon, Upload, Star } from 'lucide-react';
import { WebData, AgencyConfig, Property } from '../types/property';
import webDataRaw from '../data/properties.json';

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [config, setConfig] = useState<AgencyConfig | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [dirtyFields, setDirtyFields] = useState<Record<string, { precio?: string; expensas?: string; tipo?: string; ambientes?: string; dormitorios?: string; orientacion?: string; antiguedad?: string; metros_totales?: string; metros_cubiertos?: string; banos?: string; luminoso?: string }>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [scrapeJob, setScrapeJob] = useState<{ jobId: string; status: string; stage: string; logs: string[]; error: string | null } | null>(null);
  const [instagramModal, setInstagramModal] = useState<{ open: boolean; propertyId?: string; cardUrl?: string; caption?: string; loading: boolean; error?: string; publishing: boolean; publishError?: string; published?: boolean }>({ open: false, loading: false, publishing: false });
  const [photoModal, setPhotoModal] = useState<{ open: boolean; propertyId?: string; photos: { filename: string; url: string; thumb: string; isCover: boolean }[]; loading: boolean; error?: string; uploading: boolean; deleting?: string; settingCover?: string }>({ open: false, photos: [], loading: false, uploading: false });
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const data = webDataRaw as WebData;
    setConfig(data.config);
    setProperties(data.properties);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123') { // Contraseña simple
      setIsAuthenticated(true);
    } else {
      alert('Contraseña incorrecta');
    }
  };

  const saveConfig = async () => {
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      const data = await res.json();
      setMessage({ text: data.message, type: 'success' });
    } catch (err) {
      setMessage({ text: 'Error al guardar configuración', type: 'error' });
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch('/api/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      });
      const data = await res.json();
      setProperties(prev => prev.map(p => p.id === id ? { ...p, status } : p));
      setMessage({ text: data.message, type: 'success' });
    } catch (err) {
      setMessage({ text: 'Error al actualizar estado', type: 'error' });
    }
  };

  const markDirty = (id: string, field: 'precio' | 'expensas' | 'tipo' | 'ambientes' | 'dormitorios' | 'orientacion' | 'antiguedad' | 'metros_totales' | 'metros_cubiertos' | 'banos' | 'luminoso', value: string) => {
    setDirtyFields(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value }
    }));
  };

  const saveProperty = async (id: string) => {
    const dirty = dirtyFields[id];
    if (!dirty || Object.keys(dirty).length === 0) return;

    setSavingId(id);
    try {
      const res = await fetch('/api/property/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...dirty })
      });
      const data = await res.json();
      setProperties(prev => prev.map(p =>
        p.id === id ? {
          ...p,
          ...(dirty.precio !== undefined && { price: dirty.precio }),
          ...(dirty.expensas !== undefined && { expenses: dirty.expensas }),
          ...(dirty.tipo !== undefined && { type: dirty.tipo }),
          ...(dirty.ambientes !== undefined && { rooms: dirty.ambientes }),
          ...(dirty.dormitorios !== undefined && { bedrooms: dirty.dormitorios }),
          ...(dirty.orientacion !== undefined && { orientation: dirty.orientacion }),
          ...(dirty.antiguedad !== undefined && { age: dirty.antiguedad }),
          ...(dirty.metros_totales !== undefined && { total_area: dirty.metros_totales }),
          ...(dirty.metros_cubiertos !== undefined && { covered_area: dirty.metros_cubiertos }),
          ...(dirty.banos !== undefined && { bathrooms: dirty.banos }),
          ...(dirty.luminoso !== undefined && { luminoso: dirty.luminoso }),
        } : p
      ));
      setDirtyFields(prev => { const n = { ...prev }; delete n[id]; return n; });
      setMessage({ text: data.message || `Propiedad ${id} actualizada`, type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch {
      setMessage({ text: 'Error al guardar cambios', type: 'error' });
    } finally {
      setSavingId(null);
    }
  };

  const isDirty = (id: string) => {
    const d = dirtyFields[id];
    return d && Object.keys(d).length > 0;
  };

  const deleteProperty = async (id: string) => {
    if (!confirm(`¿Eliminar ${id}? Se borrarán todos sus datos. Luego deberás rescrapearla.`)) return;
    try {
      const res = await fetch('/api/property/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      setMessage({ text: data.message, type: 'success' });
      setProperties(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      setMessage({ text: 'Error al eliminar', type: 'error' });
    }
  };

  const addProperty = async () => {
    if (!newUrl.includes('zonaprop.com.ar')) {
      setMessage({ text: 'Ingresá una URL válida de Zonaprop', type: 'error' });
      return;
    }
    try {
      const res = await fetch('/api/property/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: newUrl })
      });
      const data = await res.json();
      if (data.jobId) {
        setScrapeJob({ jobId: data.jobId, status: 'starting', stage: 'Iniciando...', logs: [], error: null });
        setNewUrl('');
      } else {
        setMessage({ text: data.message, type: 'success' });
        setNewUrl('');
      }
    } catch (err) {
      setMessage({ text: 'Error al agregar propiedad', type: 'error' });
    }
  };

  // Poll scrape job status
  useEffect(() => {
    if (!scrapeJob || scrapeJob.status === 'complete' || scrapeJob.status === 'error') {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      return;
    }
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/scrape-status/${scrapeJob.jobId}`);
        if (!res.ok) throw new Error('Not found');
        const data = await res.json();
        setScrapeJob(data);
        if (data.status === 'complete' || data.status === 'error') {
          if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
          }
          if (data.status === 'complete') {
            setTimeout(() => window.location.reload(), 3000);
          }
        }
      } catch {
        if (pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
      }
    }, 2000);
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [scrapeJob?.jobId, scrapeJob?.status]);

  const runSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/sync', { method: 'POST' });
      const data = await res.json();
      setMessage({ text: data.message, type: 'success' });
      // Recargar página después de sync para ver cambios
      setTimeout(() => window.location.reload(), 2000);
    } catch (err) {
      setMessage({ text: 'Error en la sincronización', type: 'error' });
    } finally {
      setIsSyncing(false);
    }
  };

  const openInstagramModal = async (id: string) => {
    setInstagramModal({ open: true, propertyId: id, loading: true, publishing: false });
    try {
      const res = await fetch(`/api/instagram/${id}`);
      if (!res.ok) throw new Error('No se pudo cargar el contenido de Instagram');
      const data = await res.json();
      setInstagramModal(prev => ({ ...prev, ...data, loading: false, error: undefined }));
    } catch (err: any) {
      setInstagramModal(prev => ({ ...prev, loading: false, error: err.message }));
    }
  };

  const copyCaption = () => {
    if (!instagramModal.caption) return;
    navigator.clipboard.writeText(instagramModal.caption);
    setMessage({ text: 'Caption copiado al portapapeles', type: 'success' });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  const downloadCard = () => {
    if (!instagramModal.cardUrl) return;
    const link = document.createElement('a');
    link.href = instagramModal.cardUrl;
    link.download = `${instagramModal.propertyId || 'propiedad'}_instagram.jpg`;
    link.click();
  };

  const publishToInstagram = async () => {
    if (!instagramModal.propertyId) return;
    setInstagramModal(prev => ({ ...prev, publishing: true, publishError: undefined, published: false }));
    try {
      const res = await fetch(`/api/publish-instagram/${instagramModal.propertyId}`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error publicando en Instagram');
      setInstagramModal(prev => ({ ...prev, publishing: false, published: true, publishError: undefined }));
      setMessage({ text: 'Publicado en Instagram', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (err: any) {
      setInstagramModal(prev => ({ ...prev, publishing: false, publishError: err.message }));
    }
  };

  const openPhotoManager = async (id: string) => {
    setPhotoModal({ open: true, propertyId: id, photos: [], loading: true, uploading: false });
    await loadPhotos(id);
  };

  const loadPhotos = async (id: string) => {
    try {
      const res = await fetch(`/api/property/${id}/photos`);
      if (!res.ok) throw new Error('No se pudieron cargar las fotos');
      const data = await res.json();
      setPhotoModal(prev => ({ ...prev, photos: data.photos || [], loading: false, error: undefined }));
    } catch (err: any) {
      setPhotoModal(prev => ({ ...prev, loading: false, error: err.message }));
    }
  };

  const setCoverPhoto = async (filename: string) => {
    if (!photoModal.propertyId) return;
    setPhotoModal(prev => ({ ...prev, settingCover: filename }));
    try {
      const res = await fetch(`/api/property/${photoModal.propertyId}/photos/cover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error actualizando portada');
      setPhotoModal(prev => ({
        ...prev,
        photos: prev.photos.map(p => ({ ...p, isCover: p.filename === filename })),
        settingCover: undefined
      }));
      setMessage({ text: 'Portada actualizada. Sincronizá la web para ver el cambio.', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (err: any) {
      setPhotoModal(prev => ({ ...prev, settingCover: undefined, error: err.message }));
    }
  };

  const deletePhoto = async (filename: string) => {
    if (!photoModal.propertyId) return;
    if (!confirm(`¿Eliminar ${filename}?`)) return;
    setPhotoModal(prev => ({ ...prev, deleting: filename }));
    try {
      const res = await fetch(`/api/property/${photoModal.propertyId}/photos/${encodeURIComponent(filename)}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error eliminando foto');
      setPhotoModal(prev => ({ ...prev, photos: prev.photos.filter(p => p.filename !== filename), deleting: undefined }));
      setMessage({ text: 'Foto eliminada. Sincronizá la web para ver el cambio.', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (err: any) {
      setPhotoModal(prev => ({ ...prev, deleting: undefined, error: err.message }));
    }
  };

  const uploadPhotos = async (files: FileList | null) => {
    if (!files || files.length === 0 || !photoModal.propertyId) return;
    setPhotoModal(prev => ({ ...prev, uploading: true, error: undefined }));
    const formData = new FormData();
    Array.from(files).forEach(file => formData.append('photos', file));
    try {
      const res = await fetch(`/api/property/${photoModal.propertyId}/photos`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error subiendo fotos');
      await loadPhotos(photoModal.propertyId);
      setPhotoModal(prev => ({ ...prev, uploading: false }));
      setMessage({ text: `${data.filenames?.length || 0} foto(s) subida(s). Sincronizá la web para ver el cambio.`, type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setPhotoModal(prev => ({ ...prev, uploading: false, error: err.message }));
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-zinc-900 p-8 rounded-2xl border border-white/10 w-full max-w-md"
        >
          <div className="text-center mb-8">
            <h1 className="text-2xl font-serif text-white uppercase tracking-widest mb-2">Panel Admin</h1>
            <p className="text-white/40 text-xs">QUINTANA PROP - ACCESO RESTRINGIDO</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="password" 
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:border-amber-500 outline-none transition-all"
            />
            <button className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-xl transition-all uppercase tracking-widest text-sm">
              Ingresar
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 pt-32 pb-20 px-4 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-serif text-white mb-2 border-l-4 border-amber-500 pl-6 uppercase tracking-widest">
            Administración
          </h1>
          <p className="text-white/40 pl-6 uppercase tracking-tighter text-xs">Gestión de contenidos y estados</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={runSync}
            disabled={isSyncing}
            className="flex items-center gap-2 px-6 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full border border-white/10 transition-all text-xs uppercase tracking-widest disabled:opacity-50"
          >
            <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
            {isSyncing ? 'Sincronizando...' : 'Sincronizar Web'}
          </button>
          <button 
            onClick={() => setIsAuthenticated(false)}
            className="flex items-center gap-2 px-6 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-full border border-red-500/20 transition-all text-xs uppercase tracking-widest"
          >
            <LogOut size={14} />
            Salir
          </button>
        </div>
      </div>

      {message.text && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-8 p-4 rounded-xl border flex items-center gap-3 ${
            message.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'
          }`}
        >
          {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span className="text-sm font-medium">{message.text}</span>
        </motion.div>
      )}

      {/* Agregar propiedad desde URL */}
      <div className="mb-12 bg-zinc-900 p-8 rounded-2xl border border-white/10">
        <div className="flex items-center gap-2 text-amber-500 mb-6">
          <Plus size={18} />
          <h2 className="font-serif uppercase tracking-widest">Agregar Propiedad</h2>
        </div>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="text-[10px] text-white/40 uppercase tracking-widest mb-1 block">URL de Zonaprop</label>
            <input 
              type="text" 
              placeholder="https://www.zonaprop.com.ar/propiedades/clasificado/..."
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addProperty()}
              className="w-full bg-black border border-white/5 rounded-lg px-4 py-3 text-white text-sm focus:border-amber-500 outline-none transition-colors"
            />
          </div>
          <button 
            onClick={addProperty}
            className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-lg transition-all text-xs uppercase tracking-widest whitespace-nowrap"
          >
            <ExternalLink size={14} />
            Agregar
          </button>
        </div>
      </div>

      {/* Modal de progreso de scrape */}
      {scrapeJob && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="bg-zinc-900 rounded-2xl border border-white/10 p-8 w-full max-w-lg max-h-[80vh] flex flex-col"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-serif text-white uppercase tracking-widest">
                {scrapeJob.status === 'complete' ? '¡Completado!' : scrapeJob.status === 'error' ? 'Error' : 'Agregando Propiedad'}
              </h3>
              {(scrapeJob.status === 'complete' || scrapeJob.status === 'error') && (
                <button onClick={() => { setScrapeJob(null); if (scrapeJob.status === 'complete') window.location.reload(); }} className="text-white/40 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              )}
            </div>

            {/* Spinner o icono de estado */}
            <div className="flex items-center gap-4 mb-6">
              {scrapeJob.status === 'running' || scrapeJob.status === 'starting' || scrapeJob.status === 'syncing' ? (
                <Loader2 size={24} className="text-amber-500 animate-spin flex-shrink-0" />
              ) : scrapeJob.status === 'complete' ? (
                <CheckCircle size={24} className="text-green-500 flex-shrink-0" />
              ) : (
                <AlertCircle size={24} className="text-red-500 flex-shrink-0" />
              )}
              <div>
                <p className="text-white font-medium">{scrapeJob.stage}</p>
                {scrapeJob.status === 'running' && (
                  <p className="text-white/40 text-xs mt-1">Esto puede tomar unos minutos...</p>
                )}
                {scrapeJob.status === 'complete' && (
                  <p className="text-green-500/60 text-xs mt-1">Recargando página automáticamente...</p>
                )}
                {scrapeJob.error && (
                  <p className="text-red-500/60 text-xs mt-1">{scrapeJob.error}</p>
                )}
              </div>
            </div>

            {/* Logs */}
            {scrapeJob.logs.length > 0 && (
              <div className="bg-black/60 rounded-xl p-4 overflow-y-auto flex-1 max-h-48 border border-white/5">
                {scrapeJob.logs.map((log, i) => (
                  <p key={i} className="text-white/40 text-[10px] font-mono leading-relaxed">{log}</p>
                ))}
              </div>
            )}

            {/* Botón de cerrar cuando terminó */}
            {scrapeJob.status === 'complete' && (
              <button
                onClick={() => { setScrapeJob(null); window.location.reload(); }}
                className="mt-6 w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-all uppercase tracking-widest text-sm"
              >
                Aceptar y Recargar
              </button>
            )}
            {scrapeJob.status === 'error' && (
              <button
                onClick={() => setScrapeJob(null)}
                className="mt-6 w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all uppercase tracking-widest text-sm"
              >
                Cerrar
              </button>
            )}
          </motion.div>
        </motion.div>
      )}

      {/* Modal de gestión de fotos */}
      {photoModal.open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="bg-zinc-900 rounded-2xl border border-white/10 p-8 w-full max-w-5xl max-h-[90vh] flex flex-col overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-serif text-white uppercase tracking-widest flex items-center gap-2">
                <ImageIcon size={20} className="text-amber-500" />
                Fotos de {photoModal.propertyId}
              </h3>
              <button onClick={() => setPhotoModal({ open: false, photos: [], loading: false, uploading: false })} className="text-white/40 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {photoModal.loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={32} className="text-amber-500 animate-spin" />
              </div>
            ) : photoModal.error ? (
              <div className="text-red-400 text-sm py-8 text-center">{photoModal.error}</div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <p className="text-white/40 text-xs uppercase tracking-widest">
                    {photoModal.photos.length} foto(s) · La primera será la portada tras sincronizar
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => uploadPhotos(e.target.files)}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={photoModal.uploading}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-black font-bold rounded-lg transition-all text-xs uppercase tracking-widest"
                  >
                    {photoModal.uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                    Subir fotos
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {photoModal.photos.map((photo) => (
                    <div key={photo.filename} className={`relative group rounded-xl overflow-hidden border ${photo.isCover ? 'border-amber-500 ring-2 ring-amber-500/30' : 'border-white/10'} bg-black`}>
                      <img
                        src={photo.thumb}
                        alt={photo.filename}
                        className="w-full aspect-square object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).src = photo.url; }}
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                        <button
                          onClick={() => setCoverPhoto(photo.filename)}
                          disabled={photoModal.settingCover === photo.filename}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 transition-all ${photo.isCover ? 'bg-amber-500 text-black' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                        >
                          {photoModal.settingCover === photo.filename ? <Loader2 size={12} className="animate-spin" /> : <Star size={12} />}
                          {photo.isCover ? 'Portada' : 'Portada'}
                        </button>
                        <button
                          onClick={() => deletePhoto(photo.filename)}
                          disabled={photoModal.deleting === photo.filename}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest bg-red-500/80 hover:bg-red-500 text-white flex items-center gap-1.5 transition-all"
                        >
                          {photoModal.deleting === photo.filename ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                          Eliminar
                        </button>
                      </div>
                      {photo.isCover && (
                        <div className="absolute top-2 left-2 bg-amber-500 text-black text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md flex items-center gap-1">
                          <Star size={10} /> Portada
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-white/5 text-white/30 text-xs text-center">
                  Cambios aplicados en la carpeta origen. Hacé clic en "Sincronizar Web" para publicarlos.
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}

      {/* Modal de contenido Instagram */}
      {instagramModal.open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="bg-zinc-900 rounded-2xl border border-white/10 p-8 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-serif text-white uppercase tracking-widest flex items-center gap-2">
                <Instagram size={20} className="text-pink-500" />
                Instagram
              </h3>
              <button onClick={() => setInstagramModal({ open: false, loading: false, publishing: false })} className="text-white/40 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {instagramModal.loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={32} className="text-pink-500 animate-spin" />
              </div>
            ) : instagramModal.error ? (
              <div className="text-red-400 text-sm py-8 text-center">{instagramModal.error}</div>
            ) : (
              <div className="space-y-6">
                {instagramModal.cardUrl && (
                  <div className="rounded-xl overflow-hidden border border-white/10">
                    <img src={instagramModal.cardUrl} alt="Instagram card" className="w-full h-auto" />
                  </div>
                )}
                {instagramModal.caption && (
                  <div className="bg-black/60 rounded-xl p-4 border border-white/5">
                    <label className="text-[10px] text-white/40 uppercase tracking-widest mb-2 block">Caption</label>
                    <pre className="text-white/80 text-xs whitespace-pre-wrap font-sans">{instagramModal.caption}</pre>
                  </div>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={copyCaption}
                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-2"
                  >
                    <Copy size={14} />
                    Copiar caption
                  </button>
                  <button
                    onClick={downloadCard}
                    className="flex-1 py-3 bg-pink-500 hover:bg-pink-600 text-white rounded-xl transition-all text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-2"
                  >
                    <Download size={14} />
                    Descargar imagen
                  </button>
                </div>
                <div className="pt-4 border-t border-white/5">
                  <button
                    onClick={publishToInstagram}
                    disabled={instagramModal.publishing}
                    className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 text-white rounded-xl transition-all text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-2"
                  >
                    {instagramModal.publishing ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Publicando...
                      </>
                    ) : instagramModal.published ? (
                      <>
                        <CheckCircle size={14} />
                        Publicado
                      </>
                    ) : (
                      <>
                        <Instagram size={14} />
                        Publicar en Instagram
                      </>
                    )}
                  </button>
                  {instagramModal.publishError && (
                    <div className="mt-3 text-xs text-red-400 bg-red-500/10 rounded-lg p-3 text-center">
                      {instagramModal.publishError}
                    </div>
                  )}
                  {instagramModal.published && (
                    <div className="mt-3 text-xs text-green-400 bg-green-500/10 rounded-lg p-3 text-center">
                      Publicación exitosa.
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Config Global */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-zinc-900 p-8 rounded-2xl border border-white/10">
            <div className="flex items-center gap-2 text-amber-500 mb-6">
              <Settings size={18} />
              <h2 className="font-serif uppercase tracking-widest">Contacto Global</h2>
            </div>
            {config && (
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] text-white/40 uppercase tracking-widest mb-1 block">WhatsApp</label>
                  <input 
                    type="text" 
                    value={config.whatsapp}
                    onChange={(e) => setConfig({ ...config, whatsapp: e.target.value })}
                    className="w-full bg-black border border-white/5 rounded-lg px-4 py-2 text-white text-sm focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-white/40 uppercase tracking-widest mb-1 block">Email</label>
                  <input 
                    type="text" 
                    value={config.email}
                    onChange={(e) => setConfig({ ...config, email: e.target.value })}
                    className="w-full bg-black border border-white/5 rounded-lg px-4 py-2 text-white text-sm focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-white/40 uppercase tracking-widest mb-1 block">Instagram</label>
                  <input 
                    type="text" 
                    value={config.instagram}
                    onChange={(e) => setConfig({ ...config, instagram: e.target.value })}
                    className="w-full bg-black border border-white/5 rounded-lg px-4 py-2 text-white text-sm focus:border-amber-500 outline-none"
                  />
                </div>
                <div className="pt-4 border-t border-white/5">
                  <label className="text-[10px] text-pink-400 uppercase tracking-widest mb-2 block flex items-center gap-2">
                    <Instagram size={12} />
                    Publicación automática (Instagram Graph API)
                  </label>
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] text-white/40 uppercase tracking-widest mb-1 block">Instagram Account ID</label>
                      <input 
                        type="text" 
                        value={config.instagram_account_id || ''}
                        onChange={(e) => setConfig({ ...config, instagram_account_id: e.target.value })}
                        className="w-full bg-black border border-white/5 rounded-lg px-4 py-2 text-white text-sm focus:border-pink-500 outline-none"
                        placeholder="ej. 17841400000000000"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-white/40 uppercase tracking-widest mb-1 block">Access Token</label>
                      <input 
                        type="password" 
                        value={config.instagram_access_token || ''}
                        onChange={(e) => setConfig({ ...config, instagram_access_token: e.target.value })}
                        className="w-full bg-black border border-white/5 rounded-lg px-4 py-2 text-white text-sm focus:border-pink-500 outline-none"
                        placeholder="Token de Graph API"
                      />
                    </div>
                  </div>
                </div>
                <button 
                  onClick={saveConfig}
                  className="w-full py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-lg transition-all mt-4 flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
                >
                  <Save size={14} />
                  Guardar Cambios
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Listado Propiedades */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-zinc-900 p-8 rounded-2xl border border-white/10">
            <div className="flex items-center gap-2 text-amber-500 mb-6">
              <Building2 size={18} />
              <h2 className="font-serif uppercase tracking-widest">Estado de Propiedades</h2>
            </div>
            <div className="space-y-2">
              {properties.map((prop) => (
                <div key={prop.id} className="p-4 bg-black/40 rounded-xl border border-white/5 group hover:border-white/10 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg overflow-hidden border border-white/10 flex-shrink-0">
                        <img src={prop.images[0] || '/images/placeholder.jpg'} alt="" className="w-full h-full object-cover" />
                      </div>
                    <div>
                      <div className="text-white text-sm font-medium">{prop.address}</div>
                      <div className="text-white/30 text-[10px] uppercase tracking-wider">{prop.neighborhood} · {prop.type}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                  <button
                    onClick={() => openPhotoManager(prop.id)}
                    className="text-white/20 hover:text-amber-500 transition-colors"
                    title="Gestionar fotos"
                  >
                    <ImageIcon size={14} />
                  </button>
                  <button
                    onClick={() => openInstagramModal(prop.id)}
                    className="text-white/20 hover:text-pink-500 transition-colors"
                    title={prop.instagram_card ? 'Descargar contenido para Instagram' : 'Generá primero desde Sincronizar Web'}
                  >
                    <Instagram size={14} />
                  </button>
                  <button
                    onClick={() => deleteProperty(prop.id)}
                    className="text-white/20 hover:text-red-500 transition-colors"
                    title="Borrar propiedad"
                  >
                    <Trash2 size={14} />
                  </button>
                  <select 
                      value={prop.status}
                      onChange={(e) => updateStatus(prop.id, e.target.value)}
                      className={`text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-full border outline-none bg-black cursor-pointer transition-colors ${
                        prop.status === 'Disponible' ? 'text-green-500 border-green-500/20' : 
                        prop.status === 'Vendido' ? 'text-red-500 border-red-500/20' : 
                        prop.status === 'Alquilado' ? 'text-blue-500 border-blue-500/20' : 
                        prop.status === 'Pausado' ? 'text-amber-500 border-amber-500/20' :
                        'text-white/40 border-white/10'
                      }`}
                    >
                      <option value="Disponible">Disponible</option>
                      <option value="Pausado">Pausado</option>
                      <option value="Alquilado">Alquilado</option>
                      <option value="Vendido">Vendido</option>
                      <option value="Reservado">Reservado</option>
                  </select>
                  </div>
                </div>
              <div className="flex gap-3 mt-3 items-end">
                    <div className="flex-1">
                      <label className="text-[10px] text-white/30 uppercase tracking-widest mb-1 block">Precio</label>
                      <input type="text" value={dirtyFields[prop.id]?.precio ?? prop.price} onChange={(e) => markDirty(prop.id, 'precio', e.target.value)} className={`w-full bg-black border rounded-lg px-3 py-1.5 text-white text-xs outline-none transition-colors ${dirtyFields[prop.id]?.precio !== undefined ? 'border-amber-500' : 'border-white/5 focus:border-amber-500'}`} />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] text-white/30 uppercase tracking-widest mb-1 block">Expensas</label>
                      <input type="text" value={dirtyFields[prop.id]?.expensas ?? prop.expenses} onChange={(e) => markDirty(prop.id, 'expensas', e.target.value)} className={`w-full bg-black border rounded-lg px-3 py-1.5 text-white text-xs outline-none transition-colors ${dirtyFields[prop.id]?.expensas !== undefined ? 'border-amber-500' : 'border-white/5 focus:border-amber-500'}`} />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] text-white/30 uppercase tracking-widest mb-1 block">Categoría</label>
                      <select value={dirtyFields[prop.id]?.tipo ?? prop.type} onChange={(e) => markDirty(prop.id, 'tipo', e.target.value)} className={`w-full bg-black border rounded-lg px-3 py-1.5 text-white text-xs outline-none transition-colors ${dirtyFields[prop.id]?.tipo !== undefined ? 'border-amber-500' : 'border-white/5 focus:border-amber-500'}`}>
                        <option value="Departamento">Departamento</option>
                        <option value="Casa">Casa</option>
                        <option value="PH">PH</option>
                        <option value="Oficina">Oficina</option>
                        <option value="Local Comercial">Local Comercial</option>
                        <option value="Cochera">Cochera</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-2 items-end">
                    <div className="flex-1">
                      <label className="text-[10px] text-white/30 uppercase tracking-widest mb-1 block">Ambientes</label>
                      <input type="text" value={dirtyFields[prop.id]?.ambientes ?? prop.rooms} onChange={(e) => markDirty(prop.id, 'ambientes', e.target.value)} className={`w-full bg-black border rounded-lg px-3 py-1.5 text-white text-xs outline-none transition-colors ${dirtyFields[prop.id]?.ambientes !== undefined ? 'border-amber-500' : 'border-white/5 focus:border-amber-500'}`} />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] text-white/30 uppercase tracking-widest mb-1 block">Dormitorios</label>
                      <input type="text" value={dirtyFields[prop.id]?.dormitorios ?? prop.bedrooms} onChange={(e) => markDirty(prop.id, 'dormitorios', e.target.value)} className={`w-full bg-black border rounded-lg px-3 py-1.5 text-white text-xs outline-none transition-colors ${dirtyFields[prop.id]?.dormitorios !== undefined ? 'border-amber-500' : 'border-white/5 focus:border-amber-500'}`} />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] text-white/30 uppercase tracking-widest mb-1 block">Baños</label>
                      <input type="text" value={dirtyFields[prop.id]?.banos ?? prop.bathrooms} onChange={(e) => markDirty(prop.id, 'banos', e.target.value)} className={`w-full bg-black border rounded-lg px-3 py-1.5 text-white text-xs outline-none transition-colors ${dirtyFields[prop.id]?.banos !== undefined ? 'border-amber-500' : 'border-white/5 focus:border-amber-500'}`} />
                    </div>
                  </div>
                  <div className="flex gap-3 mt-2 items-end">
                    <div className="flex-1">
                      <label className="text-[10px] text-white/30 uppercase tracking-widest mb-1 block">Metros Totales</label>
                      <input type="text" value={dirtyFields[prop.id]?.metros_totales ?? prop.total_area} onChange={(e) => markDirty(prop.id, 'metros_totales', e.target.value)} className={`w-full bg-black border rounded-lg px-3 py-1.5 text-white text-xs outline-none transition-colors ${dirtyFields[prop.id]?.metros_totales !== undefined ? 'border-amber-500' : 'border-white/5 focus:border-amber-500'}`} />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] text-white/30 uppercase tracking-widest mb-1 block">Metros Cubiertos</label>
                      <input type="text" value={dirtyFields[prop.id]?.metros_cubiertos ?? prop.covered_area} onChange={(e) => markDirty(prop.id, 'metros_cubiertos', e.target.value)} className={`w-full bg-black border rounded-lg px-3 py-1.5 text-white text-xs outline-none transition-colors ${dirtyFields[prop.id]?.metros_cubiertos !== undefined ? 'border-amber-500' : 'border-white/5 focus:border-amber-500'}`} />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] text-white/30 uppercase tracking-widest mb-1 block">Orientación</label>
                      <input type="text" value={dirtyFields[prop.id]?.orientacion ?? prop.orientation} onChange={(e) => markDirty(prop.id, 'orientacion', e.target.value)} className={`w-full bg-black border rounded-lg px-3 py-1.5 text-white text-xs outline-none transition-colors ${dirtyFields[prop.id]?.orientacion !== undefined ? 'border-amber-500' : 'border-white/5 focus:border-amber-500'}`} />
                    </div>
                  </div>
                  <div className="flex gap-3 mt-2 items-end">
                    <div className="flex-1">
                      <label className="text-[10px] text-white/30 uppercase tracking-widest mb-1 block">Antigüedad</label>
                      <input type="text" value={dirtyFields[prop.id]?.antiguedad ?? prop.age} onChange={(e) => markDirty(prop.id, 'antiguedad', e.target.value)} className={`w-full bg-black border rounded-lg px-3 py-1.5 text-white text-xs outline-none transition-colors ${dirtyFields[prop.id]?.antiguedad !== undefined ? 'border-amber-500' : 'border-white/5 focus:border-amber-500'}`} />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] text-white/30 uppercase tracking-widest mb-1 block">Luminoso</label>
                      <select value={dirtyFields[prop.id]?.luminoso ?? prop.luminoso} onChange={(e) => markDirty(prop.id, 'luminoso', e.target.value)} className={`w-full bg-black border rounded-lg px-3 py-1.5 text-white text-xs outline-none transition-colors ${dirtyFields[prop.id]?.luminoso !== undefined ? 'border-amber-500' : 'border-white/5 focus:border-amber-500'}`}>
                        <option value="">-</option>
                        <option value="Si">Sí</option>
                        <option value="No">No</option>
                      </select>
                    </div>
                    <button onClick={() => saveProperty(prop.id)} disabled={!isDirty(prop.id) || savingId === prop.id} className={`px-4 py-1.5 rounded-lg text-xs uppercase tracking-widest font-bold flex items-center gap-1.5 transition-all ${isDirty(prop.id) ? 'bg-amber-500 hover:bg-amber-600 text-black cursor-pointer' : 'bg-white/5 text-white/20 cursor-default'}`}>
                      {savingId === prop.id ? <RefreshCw size={12} className="animate-spin" /> : <Save size={12} />}
                      {savingId === prop.id ? '...' : 'Guardar'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
