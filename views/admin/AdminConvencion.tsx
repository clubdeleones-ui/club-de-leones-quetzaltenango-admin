import React, { useState, useEffect } from 'react';
import { 
  Save, 
  Users, 
  Settings, 
  Download, 
  Search, 
  Sparkles, 
  Clock, 
  Image, 
  FileText, 
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { firebaseService } from '../../services/firebaseService';
import { ConvencionConfig, ConvencionRegistro } from '../../types';

export function AdminConvencion() {
  const [activeSubTab, setActiveSubTab] = useState<'config' | 'registros'>('config');
  const [config, setConfig] = useState<ConvencionConfig>({
    titulo: '',
    lema: '',
    fechaEvento: '',
    horaEvento: '',
    fotoSede: '',
    inscripcionesAbiertas: false
  });
  const [registros, setRegistros] = useState<ConvencionRegistro[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const dbConfig = await firebaseService.getConvencionConfig();
        setConfig(dbConfig);
        
        const dbRegistros = await firebaseService.getConvencionRegistros();
        setRegistros(dbRegistros);
      } catch (error) {
        console.error("Error al cargar datos de convención:", error);
        setErrorMsg("Hubo un error al conectar con la base de datos.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleToggleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await firebaseService.saveConvencionConfig(config);
      setSuccessMsg("¡Configuración de la convención guardada exitosamente!");
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (error) {
      console.error("Error al guardar configuración:", error);
      setErrorMsg("No se pudo guardar la configuración.");
    } finally {
      setSaving(false);
    }
  };

  // Filtered registrations
  const filteredRegistros = registros.filter(r => {
    const term = searchTerm.toLowerCase();
    return (
      r.nombre.toLowerCase().includes(term) ||
      r.email.toLowerCase().includes(term) ||
      r.club.toLowerCase().includes(term) ||
      r.cargo.toLowerCase().includes(term) ||
      r.distrito.toLowerCase().includes(term)
    );
  });

  // Export registrations to CSV format
  const handleExportCSV = () => {
    if (registros.length === 0) return;
    
    const headers = ["Nombre Completo", "Email", "Telefono", "Club", "Cargo", "Distrito", "Fecha Registro"];
    const csvRows = [
      headers.join(','), // Header row
      ...filteredRegistros.map(r => [
        `"${r.nombre.replace(/"/g, '""')}"`,
        `"${r.email.replace(/"/g, '""')}"`,
        `"${r.telefono.replace(/"/g, '""')}"`,
        `"${r.club.replace(/"/g, '""')}"`,
        `"${r.cargo.replace(/"/g, '""')}"`,
        `"${r.distrito.replace(/"/g, '""')}"`,
        `"${new Date(r.fechaRegistro).toLocaleString()}"`
      ].join(','))
    ];

    const csvContent = "\uFEFF" + csvRows.join("\n"); // Include BOM for Excel Spanish compatibility
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Preinscritos_Convencion_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
        <Loader2 className="w-10 h-10 text-blue-900 animate-spin" />
        <p className="mt-4 text-blue-900 font-bold">Cargando panel de convención...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
      {/* Sub Header / Tabs Navigation */}
      <div className="bg-slate-50 border-b border-slate-100 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center space-x-2">
            <Sparkles className="text-yellow-500" size={24} />
            <span>Configuración de la Convención D3</span>
          </h2>
          <p className="text-xs text-slate-550 mt-1">Gestiona los contenidos de la landing page pública y la base de pre-inscritos.</p>
        </div>

        <div className="flex bg-slate-200/60 p-1 rounded-2xl border border-slate-250">
          <button
            onClick={() => setActiveSubTab('config')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
              activeSubTab === 'config'
                ? 'bg-blue-900 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Settings size={14} />
            <span>Contenidos</span>
          </button>
          <button
            onClick={() => setActiveSubTab('registros')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
              activeSubTab === 'registros'
                ? 'bg-blue-900 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users size={14} />
            <span>Pre-registros ({registros.length})</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-6">
        {successMsg && (
          <div className="mb-6 flex items-center space-x-3 bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-sm font-bold">
            <CheckCircle className="text-emerald-500 shrink-0" size={18} />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="mb-6 flex items-center space-x-3 bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl text-sm font-bold">
            <AlertCircle className="text-red-500 shrink-0" size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Configuration Contents Tab */}
        {activeSubTab === 'config' && (
          <form onSubmit={handleSaveConfig} className="space-y-8 max-w-4xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Título */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500" htmlFor="titulo">Título de la Convención</label>
                <input 
                  type="text" 
                  id="titulo"
                  name="titulo"
                  value={config.titulo}
                  onChange={handleConfigChange}
                  required
                  placeholder="Ej. Distrito D3 Guatemala"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-900 rounded-2xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900/10 transition-all font-semibold"
                />
              </div>

              {/* Lema */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500" htmlFor="lema">Lema / Frase Leonística</label>
                <input 
                  type="text" 
                  id="lema"
                  name="lema"
                  value={config.lema}
                  onChange={handleConfigChange}
                  required
                  placeholder="Ej. Rugiendo con fuerza..."
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-900 rounded-2xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900/10 transition-all font-semibold"
                />
              </div>

              {/* Fecha Evento */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500" htmlFor="fechaEvento">Fecha de Inicio del Evento</label>
                <div className="relative">
                  <input 
                    type="date" 
                    id="fechaEvento"
                    name="fechaEvento"
                    value={config.fechaEvento}
                    onChange={handleConfigChange}
                    required
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-900 rounded-2xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900/10 transition-all font-semibold"
                  />
                </div>
              </div>

              {/* Hora Evento */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500" htmlFor="horaEvento">Hora de Inicio</label>
                <div className="relative">
                  <input 
                    type="text" 
                    id="horaEvento"
                    name="horaEvento"
                    value={config.horaEvento}
                    onChange={handleConfigChange}
                    required
                    placeholder="HH:MM:SS (Ej: 08:00:00)"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-900 rounded-2xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900/10 transition-all font-semibold"
                  />
                </div>
              </div>

              {/* Foto Sede */}
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500" htmlFor="fotoSede">URL de la Foto de la Sede</label>
                <div className="relative">
                  <input 
                    type="text" 
                    id="fotoSede"
                    name="fotoSede"
                    value={config.fotoSede}
                    onChange={handleConfigChange}
                    placeholder="https://ejemplo.com/imagen.jpg"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-900 rounded-2xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900/10 transition-all font-semibold"
                  />
                </div>
                {config.fotoSede && (
                  <div className="mt-3 relative w-48 h-32 rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                    <img src={config.fotoSede} alt="Vista previa de sede" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              {/* Checkbox Inscripciones Abiertas */}
              <div className="md:col-span-2 flex items-center space-x-3 bg-blue-50/50 p-4 border border-blue-100 rounded-2xl">
                <input
                  type="checkbox"
                  id="inscripcionesAbiertas"
                  name="inscripcionesAbiertas"
                  checked={config.inscripcionesAbiertas}
                  onChange={handleToggleChange}
                  className="w-5 h-5 accent-blue-900 rounded focus:ring-0 focus:outline-none cursor-pointer"
                />
                <div className="cursor-pointer">
                  <label htmlFor="inscripcionesAbiertas" className="font-extrabold text-slate-800 text-sm select-none cursor-pointer">
                    Habilitar botón / formulario de Pre-inscripciones
                  </label>
                  <p className="text-[10px] text-slate-500">
                    Si está marcado, los usuarios podrán pre-registrarse en la landing page. De lo contrario, se mostrará "Inscripciones Abiertas Muy Pronto".
                  </p>
                </div>
              </div>

            </div>

            <div className="pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center space-x-2 bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-950 hover:to-indigo-950 text-white font-black px-6 py-3.5 rounded-2xl text-xs uppercase tracking-wider transition-all shadow-md disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Save size={16} />
                    <span>Guardar Configuración</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Pre-registrations list Tab */}
        {activeSubTab === 'registros' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              {/* Search Bar */}
              <div className="relative w-full sm:max-w-xs">
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar socio, email o club..."
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-900 rounded-2xl pl-10 pr-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900/10 transition-all font-semibold"
                />
                <Search className="absolute left-3.5 top-3 text-slate-450" size={16} />
              </div>

              {/* Export Button */}
              {registros.length > 0 && (
                <button
                  onClick={handleExportCSV}
                  className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md"
                >
                  <Download size={14} />
                  <span>Exportar CSV (Excel)</span>
                </button>
              )}
            </div>

            {/* Registrations Table */}
            {filteredRegistros.length > 0 ? (
              <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600 border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 font-extrabold text-slate-800 uppercase tracking-wider text-[10px]">
                        <th className="px-6 py-4">Nombre Completo</th>
                        <th className="px-6 py-4">Contacto</th>
                        <th className="px-6 py-4">Club de procedencia</th>
                        <th className="px-6 py-4">Cargo</th>
                        <th className="px-6 py-4">Distrito</th>
                        <th className="px-6 py-4">Fecha Registro</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-105 font-bold">
                      {filteredRegistros.map((reg) => (
                        <tr key={reg.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <span className="text-slate-850 font-black">{reg.nombre}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col text-xs space-y-0.5">
                              <span className="text-slate-700">{reg.email}</span>
                              <span className="text-slate-500">{reg.telefono}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-700">{reg.club}</td>
                          <td className="px-6 py-4">
                            <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-md uppercase font-black tracking-wider">
                              {reg.cargo}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-500 text-xs">{reg.distrito}</td>
                          <td className="px-6 py-4 text-slate-500 text-xs">
                            {new Date(reg.fechaRegistro).toLocaleString('es-ES', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <FileText className="w-12 h-12 text-slate-350 mx-auto" />
                <p className="mt-4 text-slate-800 font-extrabold text-base">No hay pre-registros encontrados</p>
                <p className="text-xs text-slate-500 mt-1">Los socios que se registren en la landing page aparecerán listados aquí.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
