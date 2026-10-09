import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Calendar, 
  DollarSign, 
  Search, 
  CheckCircle, 
  Loader2, 
  Trash2, 
  X, 
  FolderOpen,
  Folder,
  ChevronRight,
  Home as HomeIcon,
  RefreshCw,
  ArrowRight,
  Sparkles,
  Save,
  Upload
} from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import { googleService } from '../services/googleService';
import { firebaseService } from '../services/firebaseService';
import { Actividad, AsignacionComision, RubroPresupuesto } from '../types';
import { useToast } from '../context/ToastContext';

interface GoogleSheetsImporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: () => void;
  initialSpreadsheetId?: string;
}

export const GoogleSheetsImporterModal: React.FC<GoogleSheetsImporterModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
  initialSpreadsheetId
}) => {
  const { showToast } = useToast();

  // Pasos: 'select_file' | 'select_tabs' | 'preview_edit' | 'importing'
  const [step, setStep] = useState<'select_file' | 'select_tabs' | 'preview_edit' | 'importing'>('select_file');

  // Estados de conexión y archivos
  const [hasGoogleAuth, setHasGoogleAuth] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [driveFiles, setDriveFiles] = useState<Array<{ id: string; name: string; mimeType: string; modifiedTime?: string }>>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState<{ id: string; name: string } | null>(null);
  const [manualInput, setManualInput] = useState(initialSpreadsheetId || '');

  // Explorador de carpetas y migas de pan
  const [currentFolder, setCurrentFolder] = useState<{ id: string | null; name: string }>({ id: null, name: 'Mi Unidad' });
  const [folderHistory, setFolderHistory] = useState<Array<{ id: string | null; name: string }>>([
    { id: null, name: 'Mi Unidad' }
  ]);

  // Pestañas disponibles y seleccionadas
  const [availableTabs, setAvailableTabs] = useState<string[]>([]);
  const [cronogramaTab, setCronogramaTab] = useState<string>('');
  const [presupuestoTab, setPresupuestoTab] = useState<string>('');
  const [isLoadingTabs, setIsLoadingTabs] = useState(false);

  // Datos parseados y editables
  const [parsedActividades, setParsedActividades] = useState<Array<{
    id: string;
    mes: string;
    titulo: string;
    fecha: string;
    lugar: string;
    descripcion: string;
    publica: boolean;
  }>>([]);

  const [parsedPresupuesto, setParsedPresupuesto] = useState<Array<{
    id: string;
    comisionOAccion: string;
    rubroNombre: string;
    monto: number;
    mesOTemporalidad: string;
    descripcion: string;
  }>>([]);

  const [activePreviewTab, setActivePreviewTab] = useState<'cronograma' | 'presupuesto'>('cronograma');
  const [isProcessingSheets, setIsProcessingSheets] = useState(false);

  // Hook de Google OAuth para solicitar permisos de Drive y Sheets
  const loginGoogle = useGoogleLogin({
    scope: 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/spreadsheets.readonly',
    onSuccess: async (tokenResponse) => {
      setIsConnecting(true);
      try {
        googleService.setAccessToken(tokenResponse.access_token);
        setHasGoogleAuth(true);
        showToast('Conectado con éxito a tu cuenta de Google', 'success');
        await loadDriveFiles(null);
      } catch (err: any) {
        console.error("Error al inicializar sesión de Google:", err);
        showToast('Sesión iniciada. Puedes pegar el enlace de tu Google Sheet directamente.', 'info');
      } finally {
        setIsConnecting(false);
      }
    },
    onError: (err) => {
      console.error("Error en Google Login:", err);
      showToast('Error al autorizar con Google. Revisa las ventanas emergentes del navegador.', 'error');
      setIsConnecting(false);
    }
  });

  const loadDriveFiles = async (folderId?: string | null, search?: string) => {
    setIsLoadingFiles(true);
    try {
      const files = await googleService.fetchSpreadsheetsFromDrive({
        folderId: folderId || undefined,
        searchTerm: search || undefined
      });
      setDriveFiles(files);
      setHasGoogleAuth(true);
      if (files.length === 0) {
        if (search) {
          showToast(`No se encontraron archivos con "${search}". Busca otro término o pega el enlace abajo.`, 'info');
        } else {
          showToast('Esta carpeta no contiene hojas de cálculo ni subcarpetas.', 'info');
        }
      }
    } catch (err: any) {
      console.warn("Fallo al listar Drive:", err);
      setHasGoogleAuth(true);
      showToast('Sesión iniciada. Si tu archivo no aparece en la lista, puedes pegar el enlace directo abajo.', 'info');
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleOpenFolder = (folderId: string, folderName: string) => {
    setSearchQuery('');
    const newFolder = { id: folderId, name: folderName };
    setCurrentFolder(newFolder);
    setFolderHistory(prev => [...prev, newFolder]);
    loadDriveFiles(folderId);
  };

  const handleNavigateBreadcrumb = (index: number) => {
    setSearchQuery('');
    const target = folderHistory[index];
    const newHistory = folderHistory.slice(0, index + 1);
    setCurrentFolder(target);
    setFolderHistory(newHistory);
    loadDriveFiles(target.id);
  };

  const handleSearchDrive = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) {
      loadDriveFiles(currentFolder.id);
      return;
    }
    loadDriveFiles(null, searchQuery.trim());
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    loadDriveFiles(currentFolder.id);
  };

  // Soporte para archivos Excel locales (.xlsx / .xls)
  const [localWorkbook, setLocalWorkbook] = useState<any | null>(null);

  // Al seleccionar un archivo de Drive o ingresar URL/ID manual
  const handleSelectFile = async (fileId: string, fileName?: string, mimeType?: string) => {
    setLocalWorkbook(null);
    setSelectedFile({ id: fileId, name: fileName || 'Documento de Google Sheets' });
    setIsLoadingTabs(true);
    setStep('select_tabs');

    try {
      const tabs = await googleService.fetchSpreadsheetTabs(fileId, fileName || mimeType);
      setAvailableTabs(tabs);
      
      // Auto-detectar pestañas por nombre
      const foundCrono = tabs.find(t => /crono|activi|mes|agenda|event/i.test(t)) || tabs[0] || '';
      const foundPresu = tabs.find(t => /presup|cost|financ|fond|numer|rubr/i.test(t)) || (tabs.length > 1 ? tabs[1] : tabs[0]) || '';
      
      setCronogramaTab(foundCrono);
      setPresupuestoTab(foundPresu !== foundCrono ? foundPresu : (tabs[1] || foundCrono));
    } catch (err: any) {
      console.error("Error al obtener pestañas:", err);
      showToast('No se pudieron leer las pestañas. Asegúrate de tener permisos en el documento.', 'error');
      setStep('select_file');
    } finally {
      setIsLoadingTabs(false);
    }
  };

  // Cargar archivo Excel directamente desde la computadora
  const handleLocalFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoadingTabs(true);
    try {
      const { workbook, sheetNames } = await googleService.parseLocalExcelFile(file);
      setLocalWorkbook(workbook);
      setSelectedFile({ id: 'local-file', name: file.name });
      setAvailableTabs(sheetNames);
      
      const foundCrono = sheetNames.find(t => /crono|activi|mes|agenda|event/i.test(t)) || sheetNames[0] || '';
      const foundPresu = sheetNames.find(t => /presup|cost|financ|fond|numer|rubr/i.test(t)) || (sheetNames.length > 1 ? sheetNames[1] : sheetNames[0]) || '';
      
      setCronogramaTab(foundCrono);
      setPresupuestoTab(foundPresu !== foundCrono ? foundPresu : (sheetNames[1] || foundCrono));
      setStep('select_tabs');
      showToast(`Archivo "${file.name}" cargado con éxito.`, 'success');
    } catch (err: any) {
      console.error("Error al procesar archivo Excel local:", err);
      showToast('Error al leer el archivo Excel. Asegúrate de que sea un archivo .xlsx válido.', 'error');
    } finally {
      setIsLoadingTabs(false);
      e.target.value = '';
    }
  };

  // Extraer y procesar datos de las pestañas seleccionadas
  const handleProcessTabs = async () => {
    if (!selectedFile) return;
    setIsProcessingSheets(true);

    try {
      // 1. Procesar Cronograma / Actividades
      if (cronogramaTab) {
        let cronoRecords: Record<string, string>[] = [];
        if (localWorkbook) {
          cronoRecords = googleService.readWorkbookSheetData(localWorkbook, cronogramaTab);
        } else {
          cronoRecords = await googleService.fetchSheetData(selectedFile.id, `'${cronogramaTab}'!A1:Z200`, selectedFile.name);
        }

        const activities = cronoRecords.map((row, index) => {
          const keys = Object.keys(row);
          const mesKey = keys.find(k => /mes|periodo|month/i.test(k));
          const tituloKey = keys.find(k => /activ|tema|nombre|título|titulo|evento/i.test(k));
          const fechaKey = keys.find(k => /fecha|dia|día|date/i.test(k));
          const lugarKey = keys.find(k => /lugar|sitio|ubicacion|ubicación/i.test(k));
          const descKey = keys.find(k => /descrip|detalle|objetivo|nota/i.test(k));

          const mes = (mesKey ? row[mesKey] : '') || `Mes ${index + 1}`;
          const titulo = (tituloKey ? row[tituloKey] : '') || Object.values(row)[0] || `Actividad ${index + 1}`;
          let fecha = fechaKey ? row[fechaKey] : '';
          
          if (!fecha && mes) {
            const currentYear = new Date().getFullYear();
            fecha = `${currentYear}-01-15`;
          }

          return {
            id: `act-import-${Date.now()}-${index}`,
            mes,
            titulo,
            fecha: fecha || new Date().toISOString().split('T')[0],
            lugar: (lugarKey ? row[lugarKey] : '') || 'Sede Club de Leones Quetzaltenango',
            descripcion: (descKey ? row[descKey] : '') || `Tema del mes: ${mes}`,
            publica: true
          };
        }).filter(a => a.titulo.trim().length > 0);

        setParsedActividades(activities);
      }

      // 2. Procesar Presupuesto
      if (presupuestoTab) {
        let presuRecords: Record<string, string>[] = [];
        if (localWorkbook) {
          presuRecords = googleService.readWorkbookSheetData(localWorkbook, presupuestoTab);
        } else {
          presuRecords = await googleService.fetchSheetData(selectedFile.id, `'${presupuestoTab}'!A1:Z200`, selectedFile.name);
        }

        const budgetItems = presuRecords.map((row, index) => {
          const keys = Object.keys(row);
          const comisionKey = keys.find(k => /comisi|accion|acción|respons|area|área/i.test(k));
          const rubroKey = keys.find(k => /rubro|concepto|gasto|cuenta|categoria/i.test(k));
          const montoKey = keys.find(k => /monto|presupuesto|valor|total|q|costo|cost/i.test(k));
          const mesKey = keys.find(k => /mes|period|tempo/i.test(k));
          const descKey = keys.find(k => /descrip|observa|detalle/i.test(k));

          const rawMonto = montoKey ? row[montoKey] : '0';
          const cleanMonto = parseFloat(String(rawMonto).replace(/[^0-9.]/g, '')) || 0;

          return {
            id: `presu-import-${Date.now()}-${index}`,
            comisionOAccion: (comisionKey ? row[comisionKey] : '') || 'Comisión de Servicio',
            rubroNombre: (rubroKey ? row[rubroKey] : '') || (comisionKey ? row[comisionKey] : `Rubro #${index + 1}`),
            monto: cleanMonto,
            mesOTemporalidad: (mesKey ? row[mesKey] : '') || 'Mensual',
            descripcion: (descKey ? row[descKey] : '') || 'Asignación presupuestaria extraída de Google Sheets'
          };
        }).filter(b => b.rubroNombre.trim().length > 0);

        setParsedPresupuesto(budgetItems);
      }

      setStep('preview_edit');
      showToast('Datos leídos con éxito. Revisa y ajusta los valores antes de importar.', 'success');
    } catch (err: any) {
      console.error("Error al procesar hojas:", err);
      showToast('Error al leer el contenido de las hojas seleccionadas.', 'error');
    } finally {
      setIsProcessingSheets(false);
    }
  };

  // Guardar definitivamente en Firestore
  const handleConfirmImport = async () => {
    setStep('importing');
    try {
      let importedActivitiesCount = 0;
      let importedBudgetCount = 0;

      // 1. Guardar Actividades en Firestore
      for (const act of parsedActividades) {
        const nuevaActividad: Actividad = {
          id: act.id,
          titulo: act.titulo.trim(),
          descripcion: act.descripcion.trim(),
          fecha: act.fecha,
          lugar: act.lugar.trim(),
          imagen: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&q=80&w=1200',
          publica: act.publica,
          conBotonVoluntariado: true,
          conBotonAsistencia: true
        };
        await firebaseService.saveActividad(nuevaActividad);
        importedActivitiesCount++;
      }

      // 2. Guardar Presupuesto en Firestore
      for (const item of parsedPresupuesto) {
        const rubroId = `rubro-import-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        
        // Crear rubro
        const nuevoRubro: RubroPresupuesto = {
          id: rubroId,
          codigo: `SHEET-${Math.floor(100 + Math.random() * 900)}`,
          nombre: item.rubroNombre,
          descripcion: item.descripcion,
          fechaCreacion: new Date().toISOString(),
          activo: true
        };
        await firebaseService.saveRubroPresupuesto(nuevoRubro);

        // Crear asignación
        const nuevaAsignacion: AsignacionComision = {
          id: item.id,
          comision: item.comisionOAccion,
          monto: Number(item.monto) || 0,
          rubroId: rubroId,
          temporalidad: (['Mensual', 'Bimensual', 'Trimestral', 'Semestral', 'Anual', 'Unica'].includes(item.mesOTemporalidad) 
            ? item.mesOTemporalidad 
            : 'Mensual') as any,
          actividad: item.rubroNombre,
          descripcion: item.descripcion,
          fechaCreacion: new Date().toISOString()
        };
        await firebaseService.saveAsignacionComision(nuevaAsignacion);
        importedBudgetCount++;
      }

      showToast(`¡Importación exitosa! ${importedActivitiesCount} actividades y ${importedBudgetCount} asignaciones guardadas.`, 'success');
      if (onImportComplete) onImportComplete();
      onClose();
    } catch (err: any) {
      console.error("Error al guardar en Firestore:", err);
      showToast('Ocurrió un error al guardar los datos en Firestore.', 'error');
      setStep('preview_edit');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Cabecera Modal */}
        <div className="bg-gradient-to-r from-blue-900 via-blue-950 to-indigo-900 px-6 py-5 text-white flex items-center justify-between relative overflow-hidden border-b border-blue-800">
          <div className="flex items-center space-x-3 z-10">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/20 border border-yellow-400/40 flex items-center justify-center text-yellow-400">
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-wide flex items-center gap-2">
                Importador de Cronograma y Presupuesto
                <span className="bg-yellow-400 text-blue-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Google Sheets
                </span>
              </h2>
              <p className="text-blue-200 text-xs font-medium">
                Sincroniza actividades por mes en el calendario y presupuesto inicial editable
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors z-10"
          >
            <X size={18} />
          </button>
        </div>

        {/* Contenido según el paso */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* PASO 1: SELECCIONAR ARCHIVO */}
          {step === 'select_file' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-3.5">
                  <div className="w-12 h-12 rounded-xl bg-white shadow-sm border border-slate-200 flex items-center justify-center text-emerald-600">
                    <FolderOpen size={24} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800">
                      Explorar archivos de Google Drive
                    </h3>
                    <p className="text-xs text-slate-500">
                      Conecta tu cuenta para ver y seleccionar tus hojas de cálculo recientes
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => loginGoogle()}
                  disabled={isConnecting || isLoadingFiles}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  {isConnecting || isLoadingFiles ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Sparkles size={16} className="text-yellow-400" />
                  )}
                  {hasGoogleAuth ? 'Actualizar Archivos de Drive' : 'Conectar con Google Drive'}
                </button>
              </div>

              {/* Explorador de Archivos y Carpetas de Google Drive */}
              {hasGoogleAuth && (
                <div className="space-y-3.5 bg-slate-50/80 p-4 rounded-2xl border border-slate-200">
                  
                  {/* Barra de Búsqueda Recursiva en Todo Drive */}
                  <form onSubmit={handleSearchDrive} className="flex gap-2">
                    <div className="relative flex-1">
                      <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Buscar en todo tu Drive y subcarpetas (ej. Presupuesto, Actividades)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 shadow-2xs"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={handleClearSearch}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                        >
                          <X size={13} />
                        </button>
                      )}
                    </div>
                    <button
                      type="submit"
                      disabled={isLoadingFiles}
                      className="px-4 py-2 bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                    >
                      {isLoadingFiles ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                      <span className="hidden sm:inline">Buscar</span>
                    </button>
                  </form>

                  {/* Migas de Pan (Breadcrumbs) de Navegación por Carpetas */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/80">
                    <div className="flex items-center gap-1.5 text-xs overflow-x-auto py-1 px-2.5 bg-white border border-slate-200 rounded-xl flex-1 shadow-2xs">
                      {folderHistory.map((folder, idx) => (
                        <React.Fragment key={folder.id || 'root'}>
                          {idx > 0 && <ChevronRight size={12} className="text-slate-400 shrink-0" />}
                          <button
                            type="button"
                            onClick={() => handleNavigateBreadcrumb(idx)}
                            className={`hover:text-blue-900 hover:underline font-bold truncate max-w-[130px] flex items-center gap-1 transition-colors cursor-pointer ${
                              idx === folderHistory.length - 1 ? 'text-blue-950 font-black' : 'text-slate-500'
                            }`}
                          >
                            {idx === 0 && <HomeIcon size={12} className="shrink-0" />}
                            <span className="truncate">{folder.name}</span>
                          </button>
                        </React.Fragment>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => loadDriveFiles(currentFolder.id)}
                      disabled={isLoadingFiles}
                      title="Actualizar carpeta actual"
                      className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-blue-900 hover:bg-slate-50 shadow-2xs transition-all cursor-pointer shrink-0"
                    >
                      <RefreshCw size={13} className={isLoadingFiles ? 'animate-spin' : ''} />
                    </button>
                  </div>

                  {/* Contenido de la carpeta o resultados de búsqueda */}
                  {isLoadingFiles ? (
                    <div className="py-12 flex flex-col items-center justify-center space-y-2 text-slate-400">
                      <Loader2 size={24} className="animate-spin text-blue-900" />
                      <p className="text-xs font-semibold">Explorando Google Drive...</p>
                    </div>
                  ) : driveFiles.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto p-1">
                      {driveFiles.map((file) => {
                        const isFolder = file.mimeType === 'application/vnd.google-apps.folder';

                        if (isFolder) {
                          return (
                            <div
                              key={file.id}
                              onClick={() => handleOpenFolder(file.id, file.name)}
                              className="p-3 rounded-xl border border-amber-200/90 bg-amber-50/40 hover:bg-amber-100/50 hover:border-amber-400 cursor-pointer transition-all flex items-center justify-between group shadow-2xs"
                            >
                              <div className="flex items-center space-x-2.5 overflow-hidden">
                                <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0 group-hover:scale-105 transition-transform">
                                  <Folder size={17} />
                                </div>
                                <div className="truncate">
                                  <p className="text-xs font-black text-slate-800 group-hover:text-amber-950 truncate">
                                    {file.name}
                                  </p>
                                  <span className="text-[9.5px] font-extrabold text-amber-700 uppercase tracking-wider">
                                    Carpeta • Clic para explorar
                                  </span>
                                </div>
                              </div>
                              <ArrowRight size={14} className="text-amber-500 group-hover:translate-x-1 transition-transform shrink-0" />
                            </div>
                          );
                        }

                        // Hoja de cálculo o Excel
                        const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || (file.mimeType && (file.mimeType.includes('openxml') || file.mimeType.includes('ms-excel')));

                        return (
                          <div
                            key={file.id}
                            onClick={() => handleSelectFile(file.id, file.name, file.mimeType)}
                            className="p-3 rounded-xl border border-slate-200 bg-white hover:border-emerald-600 hover:bg-emerald-50/40 cursor-pointer transition-all flex items-center justify-between group shadow-2xs"
                          >
                            <div className="flex items-center space-x-2.5 overflow-hidden">
                              <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform ${
                                isExcel ? 'bg-emerald-100 border-emerald-300 text-emerald-800' : 'bg-blue-50 border-blue-200 text-blue-700'
                              }`}>
                                <FileSpreadsheet size={17} />
                              </div>
                              <div className="truncate">
                                <div className="flex items-center gap-1.5">
                                  <p className="text-xs font-bold text-slate-800 group-hover:text-emerald-950 truncate">
                                    {file.name}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className={`text-[8.5px] font-black uppercase px-1 py-0.2 rounded ${
                                    isExcel ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                                  }`}>
                                    {isExcel ? 'Excel .xlsx' : 'Google Sheet'}
                                  </span>
                                  {file.modifiedTime && (
                                    <span className="text-[10px] text-slate-400">
                                      {new Date(file.modifiedTime).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <ArrowRight size={14} className="text-slate-300 group-hover:text-emerald-700 group-hover:translate-x-1 transition-transform shrink-0" />
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-8 text-center space-y-2 bg-white rounded-xl border border-dashed border-slate-200 p-4">
                      <FolderOpen size={28} className="mx-auto text-slate-300" />
                      <p className="text-xs font-bold text-slate-600">
                        {searchQuery ? `No encontramos archivos con "${searchQuery}"` : 'No hay hojas ni subcarpetas en este nivel'}
                      </p>
                      <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                        Puedes buscar por palabra clave arriba, subir el archivo Excel directamente desde tu computadora o pegar el enlace.
                      </p>
                      {folderHistory.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleNavigateBreadcrumb(0)}
                          className="text-xs font-bold text-blue-900 hover:underline pt-1"
                        >
                          Volver a Mi Unidad raíz
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* OPCIÓN DIRECTA: Subir archivo Excel (.xlsx / .csv) desde la computadora */}
              <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200/90 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
                <div className="flex items-center space-x-3.5">
                  <div className="w-11 h-11 rounded-xl bg-white shadow-xs border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
                    <Upload size={22} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                      Cargar archivo Excel (.xlsx / .xls / .csv) desde tu equipo
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium">
                      ¿Tienes el archivo guardado en tu computadora? Cárgalo al instante sin necesidad de pasar por Google Drive.
                    </p>
                  </div>
                </div>

                <label className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer shrink-0">
                  <Upload size={14} />
                  <span>Examinar Excel</span>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleLocalFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* O ingreso directo de URL / ID */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <label className="text-xs font-bold text-slate-700">
                  O pega directamente el enlace o ID de la hoja de cálculo de Google Sheets:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0X... o el ID"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    className="flex-1 px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-900"
                  />
                  <button
                    type="button"
                    onClick={() => manualInput.trim() && handleSelectFile(manualInput.trim())}
                    disabled={!manualInput.trim() || isLoadingTabs}
                    className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                  >
                    {isLoadingTabs ? <Loader2 size={16} className="animate-spin" /> : 'Abrir Hoja'}
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* PASO 2: SELECCIONAR PESTAÑAS */}
          {step === 'select_tabs' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-blue-950">Documento seleccionado:</p>
                  <p className="text-sm font-black text-blue-900">{selectedFile?.name}</p>
                </div>
                <button
                  onClick={() => setStep('select_file')}
                  className="text-xs text-blue-700 hover:underline font-semibold"
                >
                  Cambiar archivo
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="p-5 rounded-2xl border-2 border-emerald-200 bg-emerald-50/30 space-y-3">
                  <div className="flex items-center space-x-2 text-emerald-800">
                    <Calendar size={18} />
                    <h3 className="text-sm font-black uppercase tracking-wider">
                      Pestaña de Cronograma / Actividades
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600">
                    Selecciona la pestaña que contiene los temas y actividades mensuales:
                  </p>
                  <select
                    value={cronogramaTab}
                    onChange={(e) => setCronogramaTab(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-emerald-300 rounded-xl font-bold text-slate-800 focus:outline-none focus:border-emerald-600"
                  >
                    <option value="">-- No importar actividades --</option>
                    {availableTabs.map((tab) => (
                      <option key={tab} value={tab}>{tab}</option>
                    ))}
                  </select>
                </div>

                <div className="p-5 rounded-2xl border-2 border-amber-200 bg-amber-50/30 space-y-3">
                  <div className="flex items-center space-x-2 text-amber-800">
                    <DollarSign size={18} />
                    <h3 className="text-sm font-black uppercase tracking-wider">
                      Pestaña de Presupuesto
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600">
                    Selecciona la pestaña con los rubros, acciones y números de presupuesto:
                  </p>
                  <select
                    value={presupuestoTab}
                    onChange={(e) => setPresupuestoTab(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-amber-300 rounded-xl font-bold text-slate-800 focus:outline-none focus:border-amber-600"
                  >
                    <option value="">-- No importar presupuesto --</option>
                    {availableTabs.map((tab) => (
                      <option key={tab} value={tab}>{tab}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep('select_file')}
                  className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Atrás
                </button>
                <button
                  type="button"
                  onClick={handleProcessTabs}
                  disabled={isProcessingSheets || (!cronogramaTab && !presupuestoTab)}
                  className="px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-sm flex items-center gap-2"
                >
                  {isProcessingSheets ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <CheckCircle size={16} />
                  )}
                  Leer y Previsualizar Datos
                </button>
              </div>
            </div>
          )}

          {/* PASO 3: PREVISUALIZACIÓN Y EDICIÓN EN VIVO */}
          {step === 'preview_edit' && (
            <div className="space-y-5 animate-in fade-in duration-300">
              
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex space-x-2">
                  <button
                    onClick={() => setActivePreviewTab('cronograma')}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
                      activePreviewTab === 'cronograma'
                        ? 'bg-blue-900 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Calendar size={14} />
                    Actividades ({parsedActividades.length})
                  </button>
                  <button
                    onClick={() => setActivePreviewTab('presupuesto')}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
                      activePreviewTab === 'presupuesto'
                        ? 'bg-blue-900 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <DollarSign size={14} />
                    Presupuesto ({parsedPresupuesto.length})
                  </button>
                </div>

                <p className="text-[11px] font-semibold text-slate-500 hidden sm:block">
                  ✏️ Puedes editar los campos directamente antes de guardar
                </p>
              </div>

              {/* Contenido Editable: Cronograma */}
              {activePreviewTab === 'cronograma' && (
                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                  {parsedActividades.length === 0 ? (
                    <p className="text-center py-8 text-xs text-slate-400">No hay actividades detectadas en esta hoja.</p>
                  ) : (
                    parsedActividades.map((act, index) => (
                      <div key={act.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-blue-100 text-blue-900 rounded-md">
                            {act.mes || `Mes ${index + 1}`}
                          </span>
                          <button
                            onClick={() => setParsedActividades(prev => prev.filter(a => a.id !== act.id))}
                            className="text-slate-400 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div className="sm:col-span-2">
                            <label className="text-[10px] font-bold text-slate-500">Título / Tema</label>
                            <input
                              type="text"
                              value={act.titulo}
                              onChange={(e) => {
                                const val = e.target.value;
                                setParsedActividades(prev => prev.map(a => a.id === act.id ? { ...a, titulo: val } : a));
                              }}
                              className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-semibold"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-500">Fecha Tentativa</label>
                            <input
                              type="date"
                              value={act.fecha}
                              onChange={(e) => {
                                const val = e.target.value;
                                setParsedActividades(prev => prev.map(a => a.id === act.id ? { ...a, fecha: val } : a));
                              }}
                              className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-semibold"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-500">Lugar</label>
                          <input
                            type="text"
                            value={act.lugar}
                            onChange={(e) => {
                              const val = e.target.value;
                              setParsedActividades(prev => prev.map(a => a.id === act.id ? { ...a, lugar: val } : a));
                            }}
                            className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Contenido Editable: Presupuesto */}
              {activePreviewTab === 'presupuesto' && (
                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                  {parsedPresupuesto.length === 0 ? (
                    <p className="text-center py-8 text-xs text-slate-400">No hay rubros de presupuesto detectados en esta hoja.</p>
                  ) : (
                    parsedPresupuesto.map((item) => (
                      <div key={item.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-amber-100 text-amber-900 rounded-md">
                            {item.comisionOAccion}
                          </span>
                          <button
                            onClick={() => setParsedPresupuesto(prev => prev.filter(p => p.id !== item.id))}
                            className="text-slate-400 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div className="sm:col-span-2">
                            <label className="text-[10px] font-bold text-slate-500">Rubro o Acción</label>
                            <input
                              type="text"
                              value={item.rubroNombre}
                              onChange={(e) => {
                                const val = e.target.value;
                                setParsedPresupuesto(prev => prev.map(p => p.id === item.id ? { ...p, rubroNombre: val } : p));
                              }}
                              className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-semibold"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-500">Monto Presupuestado (Q)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={item.monto}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setParsedPresupuesto(prev => prev.map(p => p.id === item.id ? { ...p, monto: val } : p));
                              }}
                              className="w-full px-2.5 py-1.5 text-xs bg-white border border-amber-300 font-black text-amber-900 rounded-lg"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-500">Descripción / Nota</label>
                          <input
                            type="text"
                            value={item.descripcion}
                            onChange={(e) => {
                              const val = e.target.value;
                              setParsedPresupuesto(prev => prev.map(p => p.id === item.id ? { ...p, descripcion: val } : p));
                            }}
                            className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-600"
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Botones de Acción */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep('select_tabs')}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cambiar pestañas
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmImport}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md flex items-center gap-2"
                  >
                    <Save size={16} />
                    Confirmar e Importar a Base de Datos
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* PASO 4: IMPORTANDO */}
          {step === 'importing' && (
            <div className="py-16 text-center space-y-4 animate-in fade-in duration-300">
              <Loader2 size={40} className="animate-spin text-blue-900 mx-auto" />
              <h3 className="text-base font-black text-slate-800">
                Guardando actividades y presupuesto en el sistema...
              </h3>
              <p className="text-xs text-slate-500">
                Sincronizando con Firestore y actualizando el Calendario y Finanzas del Club.
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
