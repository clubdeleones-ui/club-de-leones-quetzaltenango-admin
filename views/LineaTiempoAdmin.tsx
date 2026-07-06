import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X as XIcon, UploadCloud, Save, Clock, MapPin, Search } from 'lucide-react';
import { HitoHistorico } from '../types';
import { firebaseService } from '../services/firebaseService';
import { compressImageFile, validateImageFile } from '../utils/imageCompressor';
import { useModal } from '../context/ModalContext';

export const LineaTiempoAdmin: React.FC = () => {
  const { showAlert, showConfirm } = useModal();
  const alert = (msg: string) => showAlert("Notificación", msg);

  const [items, setItems] = useState<HitoHistorico[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<HitoHistorico | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState<{
    titulo: string;
    fecha: string;
    descripcion: string;
    categoria: 'Club de Leones' | 'Ciudad de Quetzaltenango';
    estado: 'Borrador' | 'Publicado';
    imagenUrl: string;
  }>({
    titulo: '',
    fecha: '',
    descripcion: '',
    categoria: 'Club de Leones',
    estado: 'Publicado',
    imagenUrl: ''
  });
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const data = await firebaseService.getHitosHistoricos();
      // Sort by date descending safely (handles missing or non-string dates)
      const sorted = data.sort((a, b) => {
        const dateA = a.fecha || '';
        const dateB = b.fecha || '';
        return dateB.localeCompare(dateA);
      });
      setItems(sorted);
    } catch (error) {
      console.error("Error fetching hitos:", error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (item?: HitoHistorico) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        titulo: item.titulo,
        fecha: item.fecha,
        descripcion: item.descripcion,
        categoria: item.categoria,
        estado: item.estado,
        imagenUrl: item.imagenUrl || ''
      });
      setImagePreview(item.imagenUrl || '');
    } else {
      setEditingItem(null);
      setFormData({
        titulo: '',
        fecha: new Date().toISOString().split('T')[0],
        descripcion: '',
        categoria: 'Club de Leones',
        estado: 'Publicado',
        imagenUrl: ''
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
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titulo || !formData.fecha || !formData.descripcion) {
      alert("Título, fecha y descripción son obligatorios.");
      return;
    }

    setIsUploading(true);
    try {
      let finalImageUrl = formData.imagenUrl;
      if (imageFile) {
        // Compress to 1200 max size and 0.8 quality
        const compressedBase64 = await compressImageFile(imageFile, 1200, 1200, 0.8);
        // Use 'hito' as the prefix to write to the root of the galeria folder (avoids storage rules subfolder issues)
        finalImageUrl = await firebaseService.uploadGaleriaImage(compressedBase64, 'hito');
        
        // If upload fallback returned the huge base64 data URL, throw an error to prevent Firestore document size limit issues
        if (finalImageUrl.startsWith('data:image')) {
          throw new Error('La subida de imagen falló. Por favor, verifica las reglas de almacenamiento de Firebase.');
        }
      }

      const hitoId = editingItem ? editingItem.id : undefined;
      await firebaseService.saveHitoHistorico({
        id: hitoId as any,
        ...formData,
        imagenUrl: finalImageUrl
      });

      await fetchItems();
      setIsModalOpen(false);
      showAlert("Éxito", "El hito histórico se guardó correctamente.");
    } catch (error) {
      console.error("Error saving hito:", error);
      alert(error instanceof Error ? error.message : "Hubo un error al guardar el hito. Inténtalo de nuevo.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await showConfirm(
      "Eliminar Hito",
      "¿Estás seguro de que deseas eliminar este hito histórico de forma permanente?",
      "Eliminar",
      "Cancelar"
    );
    if (confirmed) {
      try {
        await firebaseService.deleteHitoHistorico(id);
        setItems(items.filter(item => item.id !== id));
        showAlert("Éxito", "Hito eliminado correctamente.");
      } catch (error) {
        console.error("Error deleting hito:", error);
        alert("Hubo un error al eliminar el hito.");
      }
    }
  };

  const filteredItems = items.filter(item => 
    item.titulo.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden">
      {/* Header Panel */}
      <div className="bg-gradient-to-br from-blue-900 to-blue-950 px-8 py-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center space-x-3 text-yellow-400 mb-2">
              <Clock size={24} />
              <span className="font-bold tracking-wider uppercase text-sm">Comité de Patrimonio</span>
            </div>
            <h2 className="text-3xl font-extrabold text-white">Gestión de Línea de Tiempo</h2>
            <p className="text-blue-200 mt-2">Administra los hitos históricos del Club y de la Ciudad de Quetzaltenango.</p>
          </div>
          <button
            onClick={() => openModal()}
            className="flex items-center space-x-2 bg-yellow-500 hover:bg-yellow-400 text-blue-950 px-6 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 whitespace-nowrap"
          >
            <Plus size={20} />
            <span>Nuevo Hito</span>
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por título o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition-all shadow-sm"
          />
        </div>
        <div className="text-sm font-semibold text-slate-500">
          Total de hitos: <span className="text-blue-900">{filteredItems.length}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
            <Clock className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-lg font-bold text-slate-600">No hay hitos registrados</p>
            <p className="text-slate-500 mt-1">Comienza agregando un nuevo momento histórico.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <div key={item.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all group">
                <div className="h-48 bg-slate-100 relative overflow-hidden">
                  {item.imagenUrl ? (
                    <img src={item.imagenUrl} alt={item.titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-200">
                      <Clock className="w-12 h-12 text-slate-400" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3 flex space-x-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${item.estado === 'Publicado' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                      {item.estado}
                    </span>
                  </div>
                  <div className="absolute top-3 left-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm flex items-center space-x-1 ${item.categoria === 'Club de Leones' ? 'bg-blue-900 text-white' : 'bg-amber-100 text-amber-800'}`}>
                      {item.categoria === 'Club de Leones' ? <Clock size={12}/> : <MapPin size={12}/>}
                      <span>{item.categoria}</span>
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <div className="text-sm font-bold text-blue-900 mb-1">{item.fecha}</div>
                  <h3 className="font-bold text-slate-800 text-lg mb-2 line-clamp-1">{item.titulo}</h3>
                  <p className="text-slate-500 text-sm line-clamp-2 mb-4">{item.descripcion}</p>
                  <div className="flex justify-end space-x-2 border-t border-slate-100 pt-4">
                    <button onClick={() => openModal(item)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar">
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white/95 backdrop-blur z-10">
              <h2 className="text-2xl font-bold text-blue-900">{editingItem ? 'Editar Hito Histórico' : 'Nuevo Hito Histórico'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <XIcon size={24} className="text-slate-500" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Título del Evento *</label>
                    <input
                      type="text"
                      required
                      value={formData.titulo}
                      onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 outline-none transition-all"
                      placeholder="Ej. Fundación del Club"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Fecha (Año o Fecha Completa) *</label>
                    <input
                      type="text"
                      required
                      value={formData.fecha}
                      onChange={(e) => setFormData({...formData, fecha: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 outline-none transition-all"
                      placeholder="Ej. 1940 o 15 de Febrero de 1940"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Categoría *</label>
                    <select
                      value={formData.categoria}
                      onChange={(e) => setFormData({...formData, categoria: e.target.value as any})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 outline-none transition-all"
                    >
                      <option value="Club de Leones">Historia del Club de Leones</option>
                      <option value="Ciudad de Quetzaltenango">Historia de Quetzaltenango</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Estado</label>
                    <select
                      value={formData.estado}
                      onChange={(e) => setFormData({...formData, estado: e.target.value as any})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 outline-none transition-all"
                    >
                      <option value="Publicado">Publicado</option>
                      <option value="Borrador">Borrador</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-sm font-bold text-slate-700 mb-1">Fotografía o Imagen (Opcional)</label>
                  <div className="border-2 border-dashed border-slate-300 rounded-2xl p-4 text-center hover:bg-slate-50 transition-colors relative h-48 flex flex-col items-center justify-center group overflow-hidden">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                    />
                    {imagePreview ? (
                      <>
                        <img src={imagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover z-0" />
                        <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          <p className="text-white font-bold flex items-center"><UploadCloud className="mr-2" /> Cambiar Imagen</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-10 h-10 text-slate-400 mb-2 group-hover:text-blue-600 transition-colors" />
                        <p className="text-sm text-slate-500 font-medium">Click para subir foto</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Descripción Histórica *</label>
                <textarea
                  required
                  rows={4}
                  value={formData.descripcion}
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 outline-none transition-all resize-none"
                  placeholder="Narra los detalles de este momento histórico..."
                ></textarea>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 text-slate-500 hover:bg-slate-100 font-bold rounded-xl mr-3 transition-colors"
                  disabled={isUploading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-6 py-2.5 bg-blue-900 text-white font-bold rounded-xl hover:bg-blue-800 transition-all flex items-center shadow-lg disabled:opacity-50"
                >
                  {isUploading ? (
                    <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div> Guardando...</>
                  ) : (
                    <><Save size={20} className="mr-2" /> Guardar Hito</>
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
