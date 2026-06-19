import React, { useState, useEffect } from 'react';
import { Camera, Plus, Edit2, Trash2, X, UploadCloud, Save, ImageIcon, Calendar, Tag } from 'lucide-react';
import { GaleriaItem } from '../types';
import { firebaseService } from '../services/firebaseService';
import { compressImageFile } from '../utils/imageCompressor';

const CATEGORIAS_GALERIA = [
  'Inauguraciones',
  'Cenas de Gala',
  'Jornadas Médicas',
  'Actividades Especiales',
  'Historia del Club',
  'Otro'
];

export const GaleriaAdmin: React.FC = () => {
  const [items, setItems] = useState<GaleriaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GaleriaItem | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState({
    titulo: '',
    fecha: '',
    descripcion: '',
    categoria: 'Historia del Club',
    contextoPremium: '',
    url: ''
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const data = await firebaseService.getGaleriaItems();
      setItems(data);
    } catch (error) {
      console.error("Error fetching galeria:", error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (item?: GaleriaItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        titulo: item.titulo,
        fecha: item.fecha,
        descripcion: item.descripcion,
        categoria: item.categoria || 'Historia del Club',
        contextoPremium: item.contextoPremium || '',
        url: item.url
      });
      setImagePreview(item.url);
    } else {
      setEditingItem(null);
      setFormData({
        titulo: '',
        fecha: new Date().toISOString().split('T')[0],
        descripcion: '',
        categoria: 'Historia del Club',
        contextoPremium: '',
        url: ''
      });
      setImagePreview('');
    }
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      // Create local preview immediately
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titulo || (!formData.url && !imageFile)) {
      alert("Título y fotografía son requeridos.");
      return;
    }

    setIsUploading(true);
    try {
      let finalUrl = formData.url;

      // Upload new image if selected
      if (imageFile) {
        const compressedBase64 = await compressImageFile(imageFile, 1200, 1200, 0.8);
        finalUrl = await firebaseService.uploadGaleriaImage(compressedBase64, 'gal');
      }

      const galeriaItem: GaleriaItem = {
        id: editingItem?.id || `gal_${Date.now()}`,
        titulo: formData.titulo,
        fecha: formData.fecha,
        descripcion: formData.descripcion,
        categoria: formData.categoria,
        contextoPremium: formData.contextoPremium,
        url: finalUrl
      };

      await firebaseService.saveGaleriaItem(galeriaItem);
      setIsModalOpen(false);
      fetchItems();
    } catch (error) {
      console.error("Error saving galeria item:", error);
      alert("Hubo un error al guardar la foto.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("¿Estás seguro de eliminar esta foto? Esta acción no se puede deshacer.")) {
      try {
        await firebaseService.deleteGaleriaItem(id);
        setItems(items.filter(item => item.id !== id));
      } catch (error) {
        console.error("Error deleting galeria item:", error);
        alert("Hubo un error al eliminar la foto.");
      }
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-blue-100/50 p-3 rounded-2xl">
            <Camera className="text-blue-900 w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Gestión de Galería</h1>
            <p className="text-slate-500 font-medium">Administra las fotos y el archivo histórico del club.</p>
          </div>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center space-x-2 bg-blue-900 hover:bg-blue-800 text-white px-5 py-3 rounded-2xl font-bold transition-all hover:scale-105 active:scale-95 shadow-md"
        >
          <Plus size={20} />
          <span>Nueva Foto</span>
        </button>
      </header>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
          {items.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-white rounded-3xl border border-dashed border-slate-300">
              <Camera size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500 text-lg">Aún no hay fotos en la galería.</p>
              <button onClick={() => openModal()} className="text-blue-600 font-bold mt-2 hover:underline">
                Sube la primera imagen
              </button>
            </div>
          ) : (
            items.map(item => (
              <div key={item.id} className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-lg transition-all group">
                <div className="relative h-48 bg-slate-100 overflow-hidden">
                  <img 
                    src={item.url} 
                    alt={item.titulo} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-xl text-xs font-bold text-slate-700 flex items-center shadow-sm">
                    <Tag size={12} className="mr-1.5 text-blue-600" />
                    {item.categoria || 'Sin Categoría'}
                  </div>
                  <div className="absolute top-3 right-3 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => openModal(item)}
                      className="bg-white/90 backdrop-blur-md p-2 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-white transition-colors shadow-sm"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="bg-white/90 backdrop-blur-md p-2 rounded-xl text-slate-600 hover:text-red-600 hover:bg-white transition-colors shadow-sm"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-extrabold text-lg text-slate-800 line-clamp-1">{item.titulo}</h3>
                  <div className="flex items-center text-xs text-slate-500 mt-2 mb-3 font-medium">
                    <Calendar size={14} className="mr-1.5" />
                    {item.fecha}
                  </div>
                  <p className="text-slate-600 text-sm line-clamp-2">{item.descripcion}</p>
                  {item.contextoPremium && (
                    <div className="mt-3 text-[10px] font-black uppercase text-yellow-600 bg-yellow-50 px-2 py-1 rounded-lg inline-block">
                      Contiene Ficha Premium
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <header className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-black text-slate-800 flex items-center">
                <Camera className="mr-3 text-blue-600" />
                {editingItem ? 'Editar Foto' : 'Subir Nueva Foto'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-white p-2 rounded-full shadow-sm">
                <X size={20} />
              </button>
            </header>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Fotografía *</label>
                  <div className="relative border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors group overflow-hidden">
                    {imagePreview ? (
                      <div className="relative h-64 w-full">
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-contain bg-slate-200" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-white font-bold flex items-center bg-black/50 px-4 py-2 rounded-xl backdrop-blur-sm">
                            <UploadCloud className="mr-2" /> Cambiar Imagen
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                        <ImageIcon size={48} className="mb-4 text-slate-300" />
                        <span className="font-semibold">Haz clic para subir una foto</span>
                        <span className="text-xs text-slate-400 mt-1">JPG, PNG (máx 5MB)</span>
                      </div>
                    )}
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-700">Título de la Foto *</label>
                  <input 
                    type="text" 
                    required
                    value={formData.titulo}
                    onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium"
                    placeholder="Ej. Inauguración 1945"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-700">Fecha de la Foto *</label>
                  <input 
                    type="date" 
                    required
                    value={formData.fecha}
                    onChange={(e) => setFormData({...formData, fecha: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium"
                  />
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="text-sm font-bold text-slate-700">Categoría Temática *</label>
                  <select 
                    value={formData.categoria}
                    onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium appearance-none"
                  >
                    {CATEGORIAS_GALERIA.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="text-sm font-bold text-slate-700">Descripción Corta</label>
                  <textarea 
                    rows={2}
                    value={formData.descripcion}
                    onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium resize-none custom-scrollbar"
                    placeholder="Breve descripción para mostrar debajo de la foto..."
                  />
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="text-sm font-bold text-slate-700 flex items-center">
                    Contexto Premium (Reverso de la foto)
                    <span className="ml-2 text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-md uppercase tracking-wider">Opcional</span>
                  </label>
                  <p className="text-xs text-slate-500 mb-2">Información histórica extensa que se revelará al interactuar con la foto en la galería pública.</p>
                  <textarea 
                    rows={4}
                    value={formData.contextoPremium}
                    onChange={(e) => setFormData({...formData, contextoPremium: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:bg-white transition-all font-medium resize-none custom-scrollbar"
                    placeholder="Escribe aquí el contexto histórico detallado, anécdotas, o nombres de las personas en la fotografía..."
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex justify-end space-x-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                  disabled={isUploading}
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isUploading}
                  className="flex items-center px-8 py-3 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-bold transition-all shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save size={20} className="mr-2" />
                      {editingItem ? 'Guardar Cambios' : 'Publicar Foto'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
