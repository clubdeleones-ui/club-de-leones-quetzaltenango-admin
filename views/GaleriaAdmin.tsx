import React, { useState, useEffect, useMemo } from 'react';
import { Camera, Plus, Edit2, Trash2, X as XIcon, UploadCloud, Save, ImageIcon, Calendar, Tag, Building2, Users, Car, Briefcase, Sparkles, CheckCircle2 } from 'lucide-react';
import { GaleriaItem } from '../types';
import { firebaseService } from '../services/firebaseService';
import { compressImageFile, validateImageFile } from '../utils/imageCompressor';
import { useModal } from '../context/ModalContext';
import { formatDisplayDate } from '../utils/dateSpanishFormatter';

const CATEGORIAS_GALERIA = [
  'Rentas & Salones del Club',
  'Museo de Personajes',
  'Inauguraciones',
  'Cenas de Gala',
  'Jornadas Médicas',
  'Actividades Especiales',
  'Historia del Club',
  'Otro'
];

export const GaleriaAdmin: React.FC = () => {
  const { showAlert, showConfirm } = useModal();
  const alert = (msg: string) => {
    showAlert("Notificación", msg);
  };

  const [items, setItems] = useState<GaleriaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GaleriaItem | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [filterCategory, setFilterCategory] = useState<'todos' | 'rentas' | 'museo' | 'eventos'>('todos');

  const [formData, setFormData] = useState({
    titulo: '',
    fecha: '',
    descripcion: '',
    categoria: 'Rentas & Salones del Club',
    contextoPremium: '',
    url: '',
    esFondoPantalla: false,

    // Campos del Museo de Personajes
    tipoPersonaje: 'presidente' as 'presidente' | 'directiva' | 'relevante' | 'fundador',
    periodoServicio: '',
    puestoCargo: '',
    logrosDestacadosText: '',
    citaHonorifica: '',

    // Campos de Promoción de Rentas / Salones / Parqueo / Oficinas
    esRenta: false,
    tipoEspacio: 'salon' as 'salon' | 'parqueo' | 'oficina' | 'otro',
    capacidadPersonas: '',
    dimensionesArea: '',
    amenidadesText: '',
    tarifaReferencial: '',
    disponibilidadHorario: '',
    telefonoContacto: ''
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
        categoria: item.categoria || (item.esRenta || item.tipoEspacio ? 'Rentas & Salones del Club' : 'Historia del Club'),
        contextoPremium: item.contextoPremium || '',
        url: item.url,
        esFondoPantalla: !!item.esFondoPantalla,
        tipoPersonaje: item.tipoPersonaje || 'presidente',
        periodoServicio: item.periodoServicio || '',
        puestoCargo: item.puestoCargo || '',
        logrosDestacadosText: item.logrosDestacados ? item.logrosDestacados.join('\n') : '',
        citaHonorifica: item.citaHonorifica || '',

        // Rentas
        esRenta: item.categoria === 'Rentas & Salones del Club' || !!item.esRenta,
        tipoEspacio: item.tipoEspacio || 'salon',
        capacidadPersonas: item.capacidadPersonas || '',
        dimensionesArea: item.dimensionesArea || '',
        amenidadesText: item.amenidades ? item.amenidades.join('\n') : '',
        tarifaReferencial: item.tarifaReferencial || '',
        disponibilidadHorario: item.disponibilidadHorario || '',
        telefonoContacto: item.telefonoContacto || ''
      });
      setImagePreview(item.url);
    } else {
      setEditingItem(null);
      setFormData({
        titulo: '',
        fecha: new Date().toISOString().split('T')[0],
        descripcion: '',
        categoria: filterCategory === 'rentas' ? 'Rentas & Salones del Club' : filterCategory === 'museo' ? 'Museo de Personajes' : 'Rentas & Salones del Club',
        contextoPremium: '',
        url: '',
        esFondoPantalla: false,
        tipoPersonaje: 'presidente',
        periodoServicio: '',
        puestoCargo: '',
        logrosDestacadosText: '',
        citaHonorifica: '',

        esRenta: true,
        tipoEspacio: 'salon',
        capacidadPersonas: '',
        dimensionesArea: '',
        amenidadesText: '',
        tarifaReferencial: '',
        disponibilidadHorario: 'Lunes a Domingo / Horario flexible',
        telefonoContacto: '50277612345'
      });
      setImagePreview('');
    }
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validation = validateImageFile(file);
      if (!validation.valid) {
        alert(validation.error || "Imagen inválida");
        return;
      }
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

      // Parse achievements line by line
      const logros = formData.logrosDestacadosText
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 0);

      // Parse amenidades line by line
      const amenidades = formData.amenidadesText
        .split('\n')
        .map(a => a.trim())
        .filter(a => a.length > 0);

      const isRentaCategory = formData.categoria === 'Rentas & Salones del Club';

      const galeriaItem: GaleriaItem = {
        id: editingItem?.id || `gal_${Date.now()}`,
        titulo: formData.titulo,
        fecha: formData.fecha,
        descripcion: formData.descripcion,
        categoria: formData.categoria,
        contextoPremium: formData.contextoPremium,
        url: finalUrl,
        esFondoPantalla: formData.esFondoPantalla,

        // Museo
        tipoPersonaje: formData.categoria === 'Museo de Personajes' ? formData.tipoPersonaje : undefined,
        periodoServicio: formData.categoria === 'Museo de Personajes' ? formData.periodoServicio : undefined,
        puestoCargo: formData.categoria === 'Museo de Personajes' ? formData.puestoCargo : undefined,
        logrosDestacados: formData.categoria === 'Museo de Personajes' ? logros : undefined,
        // Rentas
        esRenta: isRentaCategory,
        tipoEspacio: isRentaCategory ? formData.tipoEspacio : undefined,
        capacidadPersonas: isRentaCategory ? formData.capacidadPersonas : undefined,
        dimensionesArea: isRentaCategory ? formData.dimensionesArea : undefined,
        amenidades: isRentaCategory ? amenidades : undefined,
        tarifaReferencial: isRentaCategory ? formData.tarifaReferencial : undefined,
        disponibilidadHorario: isRentaCategory ? formData.disponibilidadHorario : undefined,
        telefonoContacto: isRentaCategory ? formData.telefonoContacto : undefined
      };

      await firebaseService.saveGaleriaItem(galeriaItem);

      if (formData.esFondoPantalla) {
        const otherActive = items.find(item => item.id !== galeriaItem.id && item.esFondoPantalla);
        if (otherActive) {
          await firebaseService.saveGaleriaItem({ ...otherActive, esFondoPantalla: false });
        }
      }

      setIsModalOpen(false);
      fetchItems();
    } catch (error) {
      console.error("Error saving galeria item:", error);
      alert(error instanceof Error ? error.message : "Hubo un error al guardar la foto.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (await showConfirm("Eliminar Foto / Espacio", "¿Estás seguro de eliminar este elemento? Esta acción no se puede deshacer.", { type: 'danger', confirmText: 'Eliminar', cancelText: 'Cancelar' })) {
      try {
        await firebaseService.deleteGaleriaItem(id);
        setItems(items.filter(item => item.id !== id));
      } catch (error) {
        console.error("Error deleting galeria item:", error);
        alert("Hubo un error al eliminar el elemento.");
      }
    }
  };

  const handleToggleFondoPantalla = async (itemId: string, currentVal: boolean) => {
    try {
      const newVal = !currentVal;
      
      const updatedItems = items.map(item => {
        if (item.id === itemId) {
          return { ...item, esFondoPantalla: newVal };
        } else if (newVal) {
          return { ...item, esFondoPantalla: false };
        }
        return item;
      });
      setItems(updatedItems);

      const selectedItem = items.find(item => item.id === itemId);
      if (selectedItem) {
        await firebaseService.saveGaleriaItem({ ...selectedItem, esFondoPantalla: newVal });
      }

      if (newVal) {
        const otherActive = items.find(item => item.id !== itemId && item.esFondoPantalla);
        if (otherActive) {
          await firebaseService.saveGaleriaItem({ ...otherActive, esFondoPantalla: false });
        }
      }
      
      alert(newVal ? "Imagen establecida como anuncio destacado (Pop-up de temporada) exitosamente." : "Se ha desactivado la imagen como anuncio destacado.");
    } catch (error) {
      console.error("Error toggling wallpaper flag:", error);
      alert("Hubo un error al establecer la imagen como anuncio.");
      fetchItems();
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const isRenta = item.categoria === 'Rentas & Salones del Club' || !!item.esRenta || !!item.tipoEspacio;
      const isMuseo = item.categoria === 'Museo de Personajes' || !!item.tipoPersonaje;
      
      if (filterCategory === 'rentas' && !isRenta) return false;
      if (filterCategory === 'museo' && !isMuseo) return false;
      if (filterCategory === 'eventos' && (isMuseo || isRenta)) return false;
      return true;
    });
  }, [items, filterCategory]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-left">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-amber-100/60 p-3 rounded-2xl border border-amber-300">
            <Camera className="text-amber-900 w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Gestión de Galería, Salones & Museo</h1>
            <p className="text-slate-500 font-medium text-xs">Administra las fotos de salones y rentas, personajes ilustres y archivo histórico.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex p-1 bg-slate-100 rounded-2xl border border-slate-200 gap-1">
            <button
              onClick={() => setFilterCategory('todos')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                filterCategory === 'todos' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              📋 Todos ({items.length})
            </button>
            <button
              onClick={() => setFilterCategory('rentas')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                filterCategory === 'rentas' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600'
              }`}
            >
              🏰 Salones & Rentas ({items.filter(i => i.categoria === 'Rentas & Salones del Club' || i.esRenta).length})
            </button>
            <button
              onClick={() => setFilterCategory('museo')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                filterCategory === 'museo' ? 'bg-amber-900 text-amber-300 shadow-xs' : 'text-slate-600'
              }`}
            >
              🏛️ Museo ({items.filter(i => i.categoria === 'Museo de Personajes' || i.tipoPersonaje).length})
            </button>
            <button
              onClick={() => setFilterCategory('eventos')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                filterCategory === 'eventos' ? 'bg-blue-900 text-white shadow-xs' : 'text-slate-600'
              }`}
            >
              🖼️ Eventos
            </button>
          </div>

          <button
            onClick={() => openModal()}
            className="flex items-center space-x-2 bg-amber-900 hover:bg-amber-800 text-white px-5 py-2.5 rounded-2xl font-bold transition-all hover:scale-105 active:scale-95 shadow-md cursor-pointer text-xs"
          >
            <Plus size={18} />
            <span>+ Nuevo Elemento</span>
          </button>
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-900"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
          {filteredItems.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-white rounded-3xl border border-dashed border-slate-300">
              <Camera size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500 text-lg">No hay elementos registrados en esta categoría.</p>
              <button onClick={() => openModal()} className="text-blue-600 font-bold mt-2 hover:underline cursor-pointer">
                Sube la primera imagen o espacio
              </button>
            </div>
          ) : (
            filteredItems.map(item => {
              const isRenta = item.categoria === 'Rentas & Salones del Club' || item.esRenta;
              return (
                <div key={item.id} className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-lg transition-all group flex flex-col h-full">
                  <div className="relative h-48 bg-slate-100 overflow-hidden shrink-0">
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
                        className="bg-white/90 backdrop-blur-md p-2 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-white transition-colors shadow-sm cursor-pointer"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="bg-white/90 backdrop-blur-md p-2 rounded-xl text-slate-600 hover:text-red-600 hover:bg-white transition-colors shadow-sm cursor-pointer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="p-5 flex flex-col justify-between flex-1">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-extrabold text-lg text-slate-800 line-clamp-1">{item.titulo}</h3>
                        {isRenta && (
                          <span className="text-[10px] font-black uppercase bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md flex-shrink-0">
                            {item.tipoEspacio === 'salon' ? 'Salón' : item.tipoEspacio === 'parqueo' ? 'Parqueo' : item.tipoEspacio === 'oficina' ? 'Oficina' : 'Renta'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center text-xs text-slate-500 mt-1 mb-2 font-medium">
                        <Calendar size={14} className="mr-1.5" />
                        {formatDisplayDate(item.fecha)}
                      </div>
                      <p className="text-slate-600 text-sm line-clamp-2">{item.descripcion}</p>
                      
                      {/* Metadatos de Rentas */}
                      {isRenta && (
                        <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-slate-100 text-xs font-bold text-slate-700">
                          {item.capacidadPersonas && (
                            <div className="flex items-center space-x-1 truncate bg-slate-50 p-1.5 rounded-lg">
                              <Users size={12} className="text-amber-600 flex-shrink-0" />
                              <span className="truncate">{item.capacidadPersonas}</span>
                            </div>
                          )}
                          {item.tarifaReferencial && (
                            <div className="flex items-center space-x-1 truncate bg-amber-50 p-1.5 rounded-lg text-amber-800">
                              <Tag size={12} className="text-amber-600 flex-shrink-0" />
                              <span className="truncate">{item.tarifaReferencial}</span>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2 mt-3">
                        {item.contextoPremium && (
                          <div className="text-[10px] font-black uppercase text-yellow-600 bg-yellow-50 px-2.5 py-1 rounded-lg inline-block border border-yellow-150">
                            Contiene Ficha Premium
                          </div>
                        )}
                        {item.esFondoPantalla && (
                          <div className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg inline-block border border-emerald-150">
                            🌟 Anuncio Activo (Pop-up)
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-100">
                      <button
                        onClick={() => handleToggleFondoPantalla(item.id, !!item.esFondoPantalla)}
                        className={`w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                          item.esFondoPantalla
                            ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        <ImageIcon size={14} />
                        <span>{item.esFondoPantalla ? 'Desactivar Anuncio' : 'Establecer como Anuncio (Pop-up)'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[95vh] flex flex-col">
            <header className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 flex-shrink-0">
              <h2 className="text-xl font-black text-slate-800 flex items-center">
                <Camera className="mr-3 text-blue-600" />
                {editingItem ? 'Editar Elemento de Galería' : 'Subir Nueva Foto o Espacio'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-white p-2 rounded-full shadow-sm cursor-pointer">
                <XIcon size={20} />
              </button>
            </header>

            <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto flex-1">
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
                  <label className="text-sm font-bold text-slate-700">Título / Nombre del Espacio *</label>
                  <input 
                    type="text" 
                    required
                    value={formData.titulo}
                    onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium"
                    placeholder="Ej. Salón Principal de Eventos 'La Cueva'"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-700">Fecha del Registro / Foto *</label>
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium cursor-pointer"
                  >
                    {CATEGORIAS_GALERIA.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* BLOQUE DE CONFIGURACIÓN: RENTAS, SALONES, PARQUEO Y OFICINAS */}
                {formData.categoria === 'Rentas & Salones del Club' && (
                  <div className="md:col-span-2 bg-gradient-to-br from-amber-50/90 to-amber-100/40 p-5 rounded-2xl border-2 border-amber-300/80 space-y-4">
                    <h4 className="text-xs font-black text-amber-900 uppercase tracking-widest flex items-center space-x-2">
                      <Building2 size={16} className="text-amber-700" />
                      <span>🏰 Ficha Técnica del Espacio en Alquiler</span>
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Instalación</label>
                        <select
                          value={formData.tipoEspacio}
                          onChange={(e) => setFormData({...formData, tipoEspacio: e.target.value as any})}
                          className="w-full bg-white border border-amber-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 cursor-pointer"
                        >
                          <option value="salon">🎉 Salón de Eventos Sociales / Corporativos</option>
                          <option value="parqueo">🚗 Parqueo / Estacionamiento Seguro</option>
                          <option value="oficina">💼 Oficina / Módulo Comercial</option>
                          <option value="otro">🏛️ Otro Espacio Institucional</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Capacidad Estimada</label>
                        <input
                          type="text"
                          value={formData.capacidadPersonas}
                          onChange={(e) => setFormData({...formData, capacidadPersonas: e.target.value})}
                          placeholder="Ej. Hasta 250 personas / 18 vehículos"
                          className="w-full bg-white border border-amber-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Dimensiones / Superficie</label>
                        <input
                          type="text"
                          value={formData.dimensionesArea}
                          onChange={(e) => setFormData({...formData, dimensionesArea: e.target.value})}
                          placeholder="Ej. 220 m² / 2 niveles"
                          className="w-full bg-white border border-amber-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Tarifa / Precio Referencial</label>
                        <input
                          type="text"
                          value={formData.tarifaReferencial}
                          onChange={(e) => setFormData({...formData, tarifaReferencial: e.target.value})}
                          placeholder="Ej. Q 1,500 por evento / Cotización personalizada"
                          className="w-full bg-white border border-amber-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Horarios & Disponibilidad</label>
                        <input
                          type="text"
                          value={formData.disponibilidadHorario}
                          onChange={(e) => setFormData({...formData, disponibilidadHorario: e.target.value})}
                          placeholder="Ej. Lunes a Domingo / Diurno y Nocturno"
                          className="w-full bg-white border border-amber-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Teléfono / WhatsApp de Contacto</label>
                        <input
                          type="text"
                          value={formData.telefonoContacto}
                          onChange={(e) => setFormData({...formData, telefonoContacto: e.target.value})}
                          placeholder="Ej. 50277612345"
                          className="w-full bg-white border border-amber-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 mb-1">Amenidades y Servicios Incluidos (una por línea)</label>
                        <textarea
                          rows={3}
                          value={formData.amenidadesText}
                          onChange={(e) => setFormData({...formData, amenidadesText: e.target.value})}
                          placeholder="Mesas y sillas incluidas&#10;Equipo de sonido e iluminación&#10;Sanitarios para damas y caballeros&#10;Área de cocina / preparación de banquetes&#10;Parqueo interno seguro"
                          className="w-full bg-white border border-amber-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 resize-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {formData.categoria === 'Museo de Personajes' && (
                  <div className="md:col-span-2 bg-amber-50/70 p-5 rounded-2xl border border-amber-200 space-y-4">
                    <h4 className="text-xs font-black text-amber-900 uppercase tracking-widest flex items-center">
                      🏛️ Ficha de Personaje Ilustre / Directiva
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Personaje / Elemento</label>
                        <select
                          value={formData.tipoPersonaje}
                          onChange={(e) => setFormData({...formData, tipoPersonaje: e.target.value as any})}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                        >
                          <option value="presidente">👑 Presidente Histórico</option>
                          <option value="directiva">👥 Junta Directiva</option>
                          <option value="relevante">⭐ Personaje Relevante</option>
                          <option value="fundador">🏛️ Socio Fundador</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Periodo de Servicio (Año / Rango)</label>
                        <input
                          type="text"
                          value={formData.periodoServicio}
                          onChange={(e) => setFormData({...formData, periodoServicio: e.target.value})}
                          placeholder="Ej. 1952 - 1953"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 mb-1">Puesto / Cargo Oficial</label>
                        <input
                          type="text"
                          value={formData.puestoCargo}
                          onChange={(e) => setFormData({...formData, puestoCargo: e.target.value})}
                          placeholder="Ej. Presidente Fundador Honorario / Secretario de Directiva"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 mb-1">Logros y Legado Destacados (un logro por línea)</label>
                        <textarea
                          rows={3}
                          value={formData.logrosDestacadosText}
                          onChange={(e) => setFormData({...formData, logrosDestacadosText: e.target.value})}
                          placeholder="Escribe cada logro en una línea distinta..."
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 resize-none"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 mb-1">Cita u Oración Honorífica</label>
                        <input
                          type="text"
                          value={formData.citaHonorifica}
                          onChange={(e) => setFormData({...formData, citaHonorifica: e.target.value})}
                          placeholder='Ej. "El servicio a los desvalidos es nuestra razón de ser."'
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 italic"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="md:col-span-2 space-y-1">
                  <label className="text-sm font-bold text-slate-700">Descripción Detallada *</label>
                  <textarea 
                    rows={3}
                    value={formData.descripcion}
                    onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium resize-none custom-scrollbar"
                    placeholder="Descripción o detalles del salón/foto..."
                  />
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="text-sm font-bold text-slate-700 flex items-center">
                    Contexto Premium / Reseña Adicional
                    <span className="ml-2 text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-md uppercase tracking-wider">Opcional</span>
                  </label>
                  <p className="text-xs text-slate-500 mb-2">Información que se revela en la ficha ampliada o reverso de foto.</p>
                  <textarea 
                    rows={3}
                    value={formData.contextoPremium}
                    onChange={(e) => setFormData({...formData, contextoPremium: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:bg-white transition-all font-medium resize-none custom-scrollbar"
                    placeholder="Escribe aquí notas adicionales, restricciones o detalles históricos..."
                  />
                </div>
                
                <div className="md:col-span-2 pt-2">
                  <div className="flex items-start space-x-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-150 text-left">
                    <input 
                      type="checkbox" 
                      id="edit-esFondoPantalla" 
                      checked={formData.esFondoPantalla} 
                      onChange={e => setFormData({...formData, esFondoPantalla: e.target.checked})}
                      className="w-5 h-5 rounded text-blue-900 border-slate-300 focus:ring-blue-900 mt-0.5 shrink-0 cursor-pointer"
                    />
                    <div>
                      <label htmlFor="edit-esFondoPantalla" className="text-sm font-bold text-slate-700 select-none cursor-pointer block">Establecer como Anuncio Destacado (Pop-up)</label>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">Esta imagen se abrirá automáticamente en pantalla completa para los visitantes al entrar al sitio web.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex justify-end space-x-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
                  disabled={isUploading}
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isUploading}
                  className="flex items-center px-8 py-3 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-bold transition-all shadow-md disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save size={20} className="mr-2" />
                      {editingItem ? 'Guardar Cambios' : 'Publicar Espacio / Foto'}
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

