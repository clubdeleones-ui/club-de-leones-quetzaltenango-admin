import React, { useState, useEffect, useRef } from 'react';
import { BookUser, Plus, Phone, MessageCircle, Edit2, Trash2, Search, Building2, Briefcase, X, ChevronDown, CheckCircle, Smartphone } from 'lucide-react';
import { ContactoAgenda } from '../types';
import { firebaseService } from '../services/firebaseService';

export const AgendaContactos: React.FC = () => {
  const [contactos, setContactos] = useState<ContactoAgenda[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ContactoAgenda | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<Omit<ContactoAgenda, 'id'>>({
    nombre: '',
    telefono: '',
    organizacion: '',
    referencia: '',
    campoTrabajo: ''
  });

  useEffect(() => {
    fetchContactos();
  }, []);

  // Cerrar el dropdown si se hace clic afuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchContactos = async () => {
    try {
      setLoading(true);
      const data = await firebaseService.getAgendaContactos();
      setContactos(data);
    } catch (error) {
      console.error("Error fetching agenda:", error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (item?: ContactoAgenda) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        nombre: item.nombre,
        telefono: item.telefono,
        organizacion: item.organizacion,
        referencia: item.referencia,
        campoTrabajo: item.campoTrabajo
      });
    } else {
      setEditingItem(null);
      setFormData({
        nombre: '',
        telefono: '',
        organizacion: '',
        referencia: '',
        campoTrabajo: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const contactoToSave: ContactoAgenda = {
        id: editingItem?.id || `con_${Date.now()}`,
        ...formData
      };
      await firebaseService.saveAgendaContacto(contactoToSave);
      await fetchContactos();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving contacto:", error);
      alert("Hubo un error al guardar el contacto.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("¿Estás seguro de eliminar este contacto?")) {
      try {
        await firebaseService.deleteAgendaContacto(id);
        setContactos(contactos.filter(c => c.id !== id));
      } catch (error) {
        console.error("Error deleting contacto:", error);
      }
    }
  };

  const filteredContactos = contactos.filter(c => 
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.organizacion.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.campoTrabajo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-emerald-100/50 p-3 rounded-2xl">
            <BookUser className="text-emerald-700 w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Agenda de Contactos</h1>
            <p className="text-slate-500 font-medium">Directorio de proveedores, alianzas y contactos clave.</p>
          </div>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center space-x-2 bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-3 rounded-2xl font-bold transition-all hover:scale-105 active:scale-95 shadow-md"
        >
          <Plus size={20} />
          <span>Nuevo Contacto</span>
        </button>
      </header>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center">
        <Search className="text-slate-400 mx-3" size={20} />
        <input 
          type="text" 
          placeholder="Buscar por nombre, organización o campo de trabajo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 outline-none text-slate-700 font-medium bg-transparent"
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-700"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" ref={dropdownRef}>
          {filteredContactos.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-white rounded-3xl border border-dashed border-slate-300">
              <BookUser size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500 text-lg font-medium">No se encontraron contactos.</p>
            </div>
          ) : (
            filteredContactos.map((contacto) => (
              <div key={contacto.id} className="bg-white rounded-[2rem] p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow relative group flex flex-col justify-between h-full">
                <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => openModal(contacto)}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(contacto.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div>
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-100 to-teal-50 rounded-full flex items-center justify-center text-emerald-700 font-black text-xl mb-4 shadow-inner border border-emerald-200/50">
                    {contacto.nombre.charAt(0).toUpperCase()}
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-800 pr-16 leading-tight">{contacto.nombre}</h3>
                  <p className="text-emerald-700 font-bold text-sm mb-4">{contacto.campoTrabajo || 'Sin campo de trabajo'}</p>

                  <div className="space-y-3 mt-4">
                    <div className="flex items-start text-sm">
                      <Building2 size={16} className="text-slate-400 mr-2.5 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">Organización</span>
                        <span className="font-semibold text-slate-700">{contacto.organizacion || 'Independiente'}</span>
                      </div>
                    </div>
                    {contacto.referencia && (
                      <div className="flex items-start text-sm">
                        <CheckCircle size={16} className="text-slate-400 mr-2.5 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">Referencia</span>
                          <span className="font-semibold text-slate-700">{contacto.referencia}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 relative">
                  <div className="mb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Teléfono Directo</span>
                    <div className="flex items-center text-slate-700 font-black text-lg tracking-tight">
                      <Smartphone size={18} className="mr-2 text-emerald-600" />
                      {contacto.telefono}
                    </div>
                  </div>
                  
                  {/* Action Buttons - Mobile Optimized */}
                  <div className="grid grid-cols-2 gap-2 mt-auto w-full">
                    <a 
                      href={`tel:${contacto.telefono.replace(/\D/g, '')}`}
                      className="flex items-center justify-center py-2.5 px-2 bg-blue-50 text-blue-700 rounded-xl font-bold hover:bg-blue-100 transition-colors active:scale-95 text-[11px] sm:text-xs md:text-sm"
                    >
                      <Phone size={16} className="mr-1.5 flex-shrink-0" />
                      <span className="truncate">Llamar</span>
                    </a>
                    <a 
                      href={`https://wa.me/${contacto.telefono.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center py-2.5 px-2 bg-emerald-50 text-emerald-700 rounded-xl font-bold hover:bg-emerald-100 transition-colors active:scale-95 text-[11px] sm:text-xs md:text-sm"
                    >
                      <MessageCircle size={16} className="mr-1.5 flex-shrink-0" />
                      <span className="truncate">WhatsApp</span>
                    </a>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <header className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-black text-slate-800 flex items-center">
                <BookUser className="mr-3 text-emerald-700" />
                {editingItem ? 'Editar Contacto' : 'Nuevo Contacto'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-white p-2 rounded-full shadow-sm">
                <X size={20} />
              </button>
            </header>

            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-700">Nombre Completo *</label>
                <input 
                  type="text" 
                  required
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-medium"
                  placeholder="Ej. Juan Pérez"
                />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-700">Teléfono *</label>
                  <input 
                    type="tel" 
                    required
                    value={formData.telefono}
                    onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-medium"
                    placeholder="Ej. 5555 5555"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-700">Organización</label>
                  <input 
                    type="text" 
                    value={formData.organizacion}
                    onChange={(e) => setFormData({...formData, organizacion: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-medium"
                    placeholder="Ej. Muni, Hotel..."
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-700">Campo de Trabajo</label>
                <input 
                  type="text" 
                  value={formData.campoTrabajo}
                  onChange={(e) => setFormData({...formData, campoTrabajo: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-medium"
                  placeholder="Ej. Proveedor de Alimentos, Abogado..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-700">Referencia</label>
                <input 
                  type="text" 
                  value={formData.referencia}
                  onChange={(e) => setFormData({...formData, referencia: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-medium"
                  placeholder="Ej. Recomendado por León Carlos"
                />
              </div>

              <div className="pt-6 border-t border-slate-100 flex justify-end space-x-3 mt-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center px-8 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold transition-all shadow-md disabled:opacity-70"
                >
                  {isSaving ? 'Guardando...' : 'Guardar Contacto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
