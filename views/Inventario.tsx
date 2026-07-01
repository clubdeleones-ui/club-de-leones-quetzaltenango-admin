import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Package, Plus, Search, Archive, MapPin, User, Tag, Heart, Shield, AlertTriangle, 
  Trash2, Edit, X, Calendar, DollarSign, AlertCircle, CheckCircle, Check, Info,
  ChevronDown, ChevronLeft, ChevronRight, Filter
} from 'lucide-react';
import { BienInventario, CategoriaInventario } from '../types';
import { firebaseService } from '../services/firebaseService';

const MOCK_INVENTARIO: BienInventario[] = [
  {
    id: 'inv-1',
    codigo: 'INV-MOB-001',
    nombre: 'Mesas Plegables Rectangulares (1.80m)',
    categoria: 'mobiliario_sede',
    cantidad: 15,
    unidadMedida: 'Unidades',
    estado: 'bueno',
    ubicacion: 'Salón Principal',
    responsableNombre: 'Edwin Ernesto Pacheco López',
    valorEstimado: 4500,
    fechaAdquisicion: '2024-03-12',
    esDonacion: false,
    notas: 'Mesas de plástico reforzado color blanco para eventos.'
  },
  {
    id: 'inv-2',
    codigo: 'INV-MOB-002',
    nombre: 'Sillas de Plástico Acolchadas Azules',
    categoria: 'mobiliario_sede',
    cantidad: 120,
    unidadMedida: 'Unidades',
    estado: 'excelente',
    ubicacion: 'Salón Principal',
    responsableNombre: 'Edwin Ernesto Pacheco López',
    valorEstimado: 18000,
    fechaAdquisicion: '2025-01-10',
    esDonacion: false,
    notas: 'Sillas apilables de metal y tela azul.'
  },
  {
    id: 'inv-3',
    codigo: 'INV-COC-001',
    nombre: 'Cubertería Fina de Acero Inoxidable (Juegos)',
    categoria: 'cocina_vajilla',
    cantidad: 150,
    unidadMedida: 'Juegos',
    estado: 'bueno',
    ubicacion: 'Cocina de la Sede',
    responsableNombre: 'María del Carmen Sosa',
    valorEstimado: 3750,
    fechaAdquisicion: '2023-05-18',
    esDonacion: false,
    notas: 'Juego completo de tenedor, cuchillo, cuchara sopera y cucharita.'
  },
  {
    id: 'inv-4',
    codigo: 'INV-COC-002',
    nombre: 'Manteles Largos de Lino Color Blanco',
    categoria: 'cocina_vajilla',
    cantidad: 25,
    unidadMedida: 'Unidades',
    estado: 'regular',
    ubicacion: 'Bodega de Blancos',
    responsableNombre: 'María del Carmen Sosa',
    valorEstimado: 2500,
    fechaAdquisicion: '2023-09-05',
    esDonacion: false,
    notas: 'Manteles largos para mesas imperiales. Requieren lavado especial.'
  },
  {
    id: 'inv-5',
    codigo: 'INV-TEC-001',
    nombre: 'Consola de Sonido Yamaha de 12 Canales',
    categoria: 'tecnologia_sonido',
    cantidad: 1,
    unidadMedida: 'Unidad',
    estado: 'excelente',
    ubicacion: 'Cabina de Sonido',
    responsableNombre: 'Julio Roberto García',
    valorEstimado: 6200,
    fechaAdquisicion: '2024-11-20',
    esDonacion: false,
    notas: 'Consola mezcladora analógica profesional para eventos.'
  },
  {
    id: 'inv-6',
    codigo: 'INV-TEC-002',
    nombre: 'Bafles Activos JBL de 15" (Con Trípodes)',
    categoria: 'tecnologia_sonido',
    cantidad: 2,
    unidadMedida: 'Unidades',
    estado: 'bueno',
    ubicacion: 'Cabina de Sonido',
    responsableNombre: 'Julio Roberto García',
    valorEstimado: 9500,
    fechaAdquisicion: '2024-11-20',
    esDonacion: false,
    notas: 'Bafles autoamplificados de alta fidelidad con soportes.'
  },
  {
    id: 'inv-7',
    codigo: 'INV-COC-003',
    nombre: 'Refrigerador Mabe de 14 Pies Cúbicos',
    categoria: 'cocina_vajilla',
    cantidad: 1,
    unidadMedida: 'Unidad',
    estado: 'bueno',
    ubicacion: 'Cocina de la Sede',
    responsableNombre: 'María del Carmen Sosa',
    valorEstimado: 5400,
    fechaAdquisicion: '2022-04-15',
    esDonacion: false,
    notas: 'Refrigerador color acero con dispensador de agua.'
  },
  {
    id: 'inv-8',
    codigo: 'INV-DON-001',
    nombre: 'Sillas de Ruedas Estándar Plegables',
    categoria: 'donaciones_sociales',
    cantidad: 8,
    unidadMedida: 'Unidades',
    estado: 'excelente',
    ubicacion: 'Bodega de Donaciones',
    responsableNombre: 'Ana Estela Gómez',
    valorEstimado: 12000,
    fechaAdquisicion: '2026-02-14',
    esDonacion: true,
    donanteNombre: 'Lions Clubs International Foundation (LCIF)',
    notas: 'Sillas listas para ser donadas en jornadas de salud.'
  },
  {
    id: 'inv-9',
    codigo: 'INV-DON-002',
    nombre: 'Lotes de Ropa Invernal (Suéteres/Frazadas)',
    categoria: 'donaciones_sociales',
    cantidad: 4,
    unidadMedida: 'Cajas',
    estado: 'bueno',
    ubicacion: 'Bodega de Donaciones',
    responsableNombre: 'Ana Estela Gómez',
    esDonacion: true,
    donanteNombre: 'Vecinos del Barrio El Calvario',
    notas: 'Cajas debidamente clasificadas por tallas para contingencias climáticas.'
  },
  {
    id: 'inv-10',
    codigo: 'INV-OFI-001',
    nombre: 'Escritorios de Madera de Caoba Ejecutivos',
    categoria: 'oficina',
    cantidad: 3,
    unidadMedida: 'Unidades',
    estado: 'excelente',
    ubicacion: 'Oficina de Secretaría',
    responsableNombre: 'Edwin Ernesto Pacheco López',
    valorEstimado: 7500,
    fechaAdquisicion: '2024-06-30',
    esDonacion: false,
    notas: 'Escritorios con gaveteros y llaves individuales.'
  },
  {
    id: 'inv-11',
    codigo: 'INV-PAT-001',
    nombre: 'Estandarte Oficial Bordado en Oro (1960)',
    categoria: 'patrimonio_historico',
    cantidad: 1,
    unidadMedida: 'Unidad',
    estado: 'excelente',
    ubicacion: 'Vitrina de Secretaría',
    responsableNombre: 'Edwin Ernesto Pacheco López',
    fechaAdquisicion: '1960-09-15',
    esDonacion: false,
    notas: 'Estandarte fundacional de terciopelo azul marino bordado con hilos de oro de 14k.'
  },
  {
    id: 'inv-12',
    codigo: 'INV-PAT-002',
    nombre: 'Galería de Cuadros Fotográficos Ex-Presidentes',
    categoria: 'patrimonio_historico',
    cantidad: 35,
    unidadMedida: 'Unidades',
    estado: 'bueno',
    ubicacion: 'Galería de Honor (Pasillo)',
    responsableNombre: 'Edwin Ernesto Pacheco López',
    esDonacion: false,
    notas: 'Retratos oficiales con marco de madera tallada y vidrio antirreflejante.'
  },
  {
    id: 'inv-13',
    codigo: 'INV-PAT-003',
    nombre: 'Placa de Reconocimiento del Centenario de Lions Club',
    categoria: 'patrimonio_historico',
    cantidad: 1,
    unidadMedida: 'Unidad',
    estado: 'excelente',
    ubicacion: 'Vitrina de Secretaría',
    responsableNombre: 'Edwin Ernesto Pacheco López',
    fechaAdquisicion: '2017-06-07',
    esDonacion: true,
    donanteNombre: 'Oficina Internacional de Lions Clubs',
    notas: 'Placa conmemorativa de bronce sobre base de madera de nogal.'
  }
];

const DEFAULT_CATEGORIES: CategoriaInventario[] = [
  { id: 'mobiliario_sede', label: 'Mobiliario Sede', prefix: 'MOB' },
  { id: 'cocina_vajilla', label: 'Cocina y Vajilla', prefix: 'COC' },
  { id: 'tecnologia_sonido', label: 'Tecnología y Sonido', prefix: 'TEC' },
  { id: 'donaciones_sociales', label: 'Donaciones y Apoyo', prefix: 'DON' },
  { id: 'patrimonio_historico', label: 'Patrimonio e Historia', prefix: 'PAT' },
  { id: 'oficina', label: 'Mobiliario Oficina', prefix: 'OFI' }
];

// Predefined colors list for categories to assign dynamically
const SCHEMES = [
  { name: 'blue', bar: 'bg-blue-600', text: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', textSelected: 'text-blue-900', ring: 'focus:ring-blue-900' },
  { name: 'emerald', bar: 'bg-emerald-600', text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', textSelected: 'text-emerald-950', ring: 'focus:ring-emerald-900' },
  { name: 'amber', bar: 'bg-amber-600', text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', textSelected: 'text-amber-950', ring: 'focus:ring-amber-700' },
  { name: 'purple', bar: 'bg-purple-600', text: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200', textSelected: 'text-purple-950', ring: 'focus:ring-purple-700' },
  { name: 'rose', bar: 'bg-rose-600', text: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200', textSelected: 'text-rose-950', ring: 'focus:ring-rose-700' },
  { name: 'indigo', bar: 'bg-indigo-600', text: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200', textSelected: 'text-indigo-950', ring: 'focus:ring-indigo-700' },
  { name: 'teal', bar: 'bg-teal-600', text: 'text-teal-700', bg: 'bg-teal-50', border: 'border-teal-200', textSelected: 'text-teal-950', ring: 'focus:ring-teal-700' },
  { name: 'orange', bar: 'bg-orange-600', text: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200', textSelected: 'text-orange-950', ring: 'focus:ring-orange-700' },
  { name: 'cyan', bar: 'bg-cyan-600', text: 'text-cyan-700', bg: 'bg-cyan-50', border: 'border-cyan-200', textSelected: 'text-cyan-950', ring: 'focus:ring-cyan-700' }
];

export const Inventario: React.FC = () => {
  const [bienes, setBienes] = useState<BienInventario[]>([]);
  const [categories, setCategories] = useState<CategoriaInventario[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedCondition, setSelectedCondition] = useState('all');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Category filter dropdown state
  const [showCatFilterMenu, setShowCatFilterMenu] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Modal control
  const [showModal, setShowModal] = useState(false);
  const [editingBien, setEditingBien] = useState<BienInventario | null>(null);

  // Subform to add category inline
  const [showNewCatSubform, setShowNewCatSubform] = useState(false);
  const [newCatLabel, setNewCatLabel] = useState('');
  const [newCatPrefix, setNewCatPrefix] = useState('');

  const [formData, setFormData] = useState({
    nombre: '',
    categoria: '',
    cantidad: 1,
    unidadMedida: 'Unidades',
    estado: 'bueno' as BienInventario['estado'],
    ubicacion: '',
    responsableNombre: '',
    valorEstimado: '',
    fechaAdquisicion: '',
    esDonacion: false,
    donanteNombre: '',
    notas: ''
  });

  // Load initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch Categories
        let cats = await firebaseService.getCategoriasInventario();
        if (cats.length === 0) {
          for (const c of DEFAULT_CATEGORIES) {
            await firebaseService.saveCategoriaInventario(c);
          }
          cats = DEFAULT_CATEGORIES;
        }
        setCategories(cats);

        // Fetch Inventory Items
        let items = await firebaseService.getBienesInventario();
        if (items.length === 0) {
          for (const item of MOCK_INVENTARIO) {
            await firebaseService.saveBienInventario(item);
          }
          items = MOCK_INVENTARIO;
        }
        setBienes(items);

        localStorage.setItem('club_leones_inventario', JSON.stringify(items));
        localStorage.setItem('club_leones_categorias_inventario', JSON.stringify(cats));
      } catch (e) {
        console.error("Error fetching data:", e);
        const localItems = localStorage.getItem('club_leones_inventario');
        const localCats = localStorage.getItem('club_leones_categorias_inventario');
        setBienes(localItems ? JSON.parse(localItems) : MOCK_INVENTARIO);
        setCategories(localCats ? JSON.parse(localCats) : DEFAULT_CATEGORIES);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCatFilterMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeCategory, selectedCondition]);

  const handleOpenAddModal = () => {
    setEditingBien(null);
    setShowNewCatSubform(false);
    setFormData({
      nombre: '',
      categoria: categories[0]?.id || 'mobiliario_sede',
      cantidad: 1,
      unidadMedida: 'Unidades',
      estado: 'bueno',
      ubicacion: '',
      responsableNombre: '',
      valorEstimado: '',
      fechaAdquisicion: new Date().toISOString().split('T')[0],
      esDonacion: false,
      donanteNombre: '',
      notas: ''
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (bien: BienInventario) => {
    setEditingBien(bien);
    setShowNewCatSubform(false);
    setFormData({
      nombre: bien.nombre,
      categoria: bien.categoria,
      cantidad: bien.cantidad,
      unidadMedida: bien.unidadMedida || 'Unidades',
      estado: bien.estado,
      ubicacion: bien.ubicacion,
      responsableNombre: bien.responsableNombre,
      valorEstimado: bien.valorEstimado ? String(bien.valorEstimado) : '',
      fechaAdquisicion: bien.fechaAdquisicion || '',
      esDonacion: bien.esDonacion,
      donanteNombre: bien.donanteNombre || '',
      notas: bien.notas || ''
    });
    setShowModal(true);
  };

  const handleDeleteBien = async (id: string) => {
    if (!window.confirm("¿Está seguro de eliminar este bien de inventario permanentemente?")) return;
    try {
      await firebaseService.deleteBienInventario(id);
      const updated = bienes.filter(b => b.id !== id);
      setBienes(updated);
      localStorage.setItem('club_leones_inventario', JSON.stringify(updated));
    } catch (e) {
      console.error("Error deleting item:", e);
      alert("No se pudo eliminar el bien.");
    }
  };

  const handleAddCategoryInline = async () => {
    if (!newCatLabel.trim() || !newCatPrefix.trim()) {
      alert("Ingrese nombre y prefijo de código para la categoría.");
      return;
    }
    const cleanPrefix = newCatPrefix.trim().toUpperCase().slice(0, 4);
    const generatedId = newCatLabel.trim().toLowerCase().replace(/\s+/g, '_');

    if (categories.some(c => c.id === generatedId || c.prefix === cleanPrefix)) {
      alert("Ya existe una categoría con ese nombre o prefijo.");
      return;
    }

    const newCat: CategoriaInventario = {
      id: generatedId,
      label: newCatLabel.trim(),
      prefix: cleanPrefix
    };

    try {
      await firebaseService.saveCategoriaInventario(newCat);
      const updatedCats = [...categories, newCat];
      setCategories(updatedCats);
      localStorage.setItem('club_leones_categorias_inventario', JSON.stringify(updatedCats));

      setFormData(prev => ({ ...prev, categoria: generatedId }));
      setNewCatLabel('');
      setNewCatPrefix('');
      setShowNewCatSubform(false);
    } catch (e) {
      console.error("Error saving category:", e);
      alert("No se pudo registrar la nueva categoría.");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre.trim() || !formData.categoria || !formData.ubicacion.trim() || !formData.responsableNombre.trim()) {
      alert("Por favor, llene los campos obligatorios.");
      return;
    }

    const uniqueId = editingBien ? editingBien.id : `inv-${Date.now()}`;
    const selectedCat = categories.find(c => c.id === formData.categoria);
    const prefix = selectedCat?.prefix || 'GEN';
    
    const countCategory = bienes.filter(b => b.categoria === formData.categoria && b.id !== uniqueId).length + 1;
    const paddingCode = String(countCategory).padStart(3, '0');
    const computedCode = editingBien ? editingBien.codigo : `INV-${prefix}-${paddingCode}`;

    const newBien: BienInventario = {
      id: uniqueId,
      codigo: computedCode,
      nombre: formData.nombre.trim(),
      categoria: formData.categoria,
      cantidad: Number(formData.cantidad) || 1,
      unidadMedida: formData.unidadMedida.trim(),
      estado: formData.estado,
      ubicacion: formData.ubicacion.trim(),
      responsableNombre: formData.responsableNombre.trim(),
      valorEstimado: formData.valorEstimado ? Number(formData.valorEstimado) : undefined,
      fechaAdquisicion: formData.fechaAdquisicion || undefined,
      esDonacion: formData.esDonacion,
      donanteNombre: formData.esDonacion ? formData.donanteNombre.trim() : undefined,
      notas: formData.notas.trim() || undefined
    };

    try {
      await firebaseService.saveBienInventario(newBien);
      const updated = editingBien 
        ? bienes.map(b => b.id === uniqueId ? newBien : b)
        : [newBien, ...bienes];
      
      setBienes(updated);
      localStorage.setItem('club_leones_inventario', JSON.stringify(updated));
      setShowModal(false);
    } catch (e) {
      console.error("Error saving inventory item:", e);
      alert("No se pudo guardar el bien en la base de datos.");
    }
  };

  // Deterministic color scheme function for categories
  const getCategoryColorScheme = (catId: string) => {
    if (catId === 'all') {
      return { bar: 'bg-slate-500', text: 'text-slate-655', bg: 'bg-slate-50', border: 'border-slate-200' };
    }
    let hash = 0;
    for (let i = 0; i < catId.length; i++) {
      hash = catId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % SCHEMES.length;
    return SCHEMES[index];
  };

  // KPIs Calculations
  const stats = useMemo(() => {
    const totalItems = bienes.reduce((sum, b) => sum + b.cantidad, 0);
    const totalPatrimonioValor = bienes.reduce((sum, b) => sum + ((b.valorEstimado || 0) * b.cantidad), 0);
    const donacionesCount = bienes.filter(b => b.categoria === 'donaciones_sociales').reduce((sum, b) => sum + b.cantidad, 0);
    const enAlerta = bienes.filter(b => b.estado === 'dañado' || b.estado === 'en_reparacion').length;
    return { totalItems, totalPatrimonioValor, donacionesCount, enAlerta };
  }, [bienes]);

  // Filtering
  const filteredBienes = useMemo(() => {
    return bienes.filter(b => {
      const matchesSearch = b.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || b.codigo.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = activeCategory === 'all' || b.categoria === activeCategory;
      const matchesCondition = selectedCondition === 'all' || b.estado === selectedCondition;
      return matchesSearch && matchesCategory && matchesCondition;
    });
  }, [bienes, searchTerm, activeCategory, selectedCondition]);

  // Pagination calculation
  const paginatedBienes = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredBienes.slice(start, start + itemsPerPage);
  }, [filteredBienes, currentPage]);

  const totalPages = Math.ceil(filteredBienes.length / itemsPerPage) || 1;

  const conditionLabels: Record<BienInventario['estado'], string> = {
    'excelente': 'Excelente',
    'bueno': 'Bueno',
    'regular': 'Regular',
    'dañado': 'Dañado',
    'en_reparacion': 'En Mantenimiento'
  };

  const conditionColors: Record<BienInventario['estado'], string> = {
    'excelente': 'bg-green-500 text-white border-green-600',
    'bueno': 'bg-emerald-500/10 text-emerald-700 border-emerald-200',
    'regular': 'bg-amber-500/10 text-amber-700 border-amber-200',
    'dañado': 'bg-red-500/10 text-red-700 border-red-200 animate-pulse',
    'en_reparacion': 'bg-blue-500/10 text-blue-700 border-blue-200'
  };

  const categoryLabelsMap = useMemo(() => {
    const map: Record<string, string> = {};
    categories.forEach(c => {
      map[c.id] = c.label;
    });
    return map;
  }, [categories]);

  // Get active category label and icon color
  const activeCategoryDetails = useMemo(() => {
    if (activeCategory === 'all') {
      return { label: 'Todos los Bienes', scheme: getCategoryColorScheme('all') };
    }
    const cat = categories.find(c => c.id === activeCategory);
    return {
      label: cat ? cat.label : activeCategory,
      scheme: getCategoryColorScheme(activeCategory)
    };
  }, [activeCategory, categories]);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-blue-900 tracking-tight flex items-center">
            <Archive className="text-blue-900 mr-3" size={32} />
            Control de Inventario y Patrimonio
          </h1>
          <p className="text-sm text-slate-655 mt-1 font-medium">
            Gestión y catalogación de bienes muebles, vajilla, tecnología, estandartes históricos y donaciones.
          </p>
        </div>
        <button 
          onClick={handleOpenAddModal}
          className="bg-blue-900 hover:bg-blue-800 text-white font-extrabold px-6 py-3 rounded-xl flex items-center justify-center space-x-2 shadow-md shadow-blue-900/10 active:scale-98 transition-all w-full sm:w-auto text-sm"
        >
          <Plus size={16} />
          <span>Añadir Artículo</span>
        </button>
      </div>

      {/* KPI Widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-5 rounded-[2rem] border border-slate-200/80 shadow-sm flex flex-col justify-between min-h-[105px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs text-slate-450 font-bold uppercase tracking-wider block">Bienes Totales</span>
            <div className="p-2 bg-blue-50 text-blue-900 rounded-xl">
              <Package size={16} />
            </div>
          </div>
          <span className="text-lg sm:text-xl lg:text-lg xl:text-xl font-black text-slate-805 leading-none mt-2 block whitespace-nowrap truncate">
            {stats.totalItems} <span className="text-xs text-slate-400 font-bold">Unidades</span>
          </span>
        </div>

        <div className="bg-white p-5 rounded-[2rem] border border-slate-200/80 shadow-sm flex flex-col justify-between min-h-[105px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs text-slate-450 font-bold uppercase tracking-wider block">Valor Estimado</span>
            <div className="p-2 bg-green-50 text-green-700 rounded-xl">
              <DollarSign size={16} />
            </div>
          </div>
          <span 
            className="text-lg sm:text-xl lg:text-lg xl:text-xl font-black text-slate-805 leading-none mt-2 block whitespace-nowrap truncate"
            title={`Q ${stats.totalPatrimonioValor.toLocaleString('es-GT', { minimumFractionDigits: 2 })}`}
          >
            Q {stats.totalPatrimonioValor.toLocaleString('es-GT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>
        </div>

        <div className="bg-white p-5 rounded-[2rem] border border-slate-200/80 shadow-sm flex flex-col justify-between min-h-[105px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs text-slate-450 font-bold uppercase tracking-wider block">Donaciones en Bodega</span>
            <div className="p-2 bg-red-50 text-red-550 rounded-xl">
              <Heart size={16} />
            </div>
          </div>
          <span className="text-lg sm:text-xl lg:text-lg xl:text-xl font-black text-slate-805 leading-none mt-2 block whitespace-nowrap truncate">
            {stats.donacionesCount} <span className="text-xs text-slate-400 font-bold">Insumos</span>
          </span>
        </div>

        <div className="bg-white p-5 rounded-[2rem] border border-slate-200/80 shadow-sm flex flex-col justify-between min-h-[105px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs text-slate-450 font-bold uppercase tracking-wider block">Bienes en Alerta</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <AlertTriangle size={16} />
            </div>
          </div>
          <span className="text-lg sm:text-xl lg:text-lg xl:text-xl font-black text-slate-805 leading-none mt-2 block whitespace-nowrap truncate">
            {stats.enAlerta} <span className="text-xs text-slate-400 font-bold">Artículos</span>
          </span>
        </div>
      </div>

      {/* Filters and Category selector (Dropdown) */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-100/50 p-4 rounded-2xl border border-slate-200/60 z-30 relative">
        <div className="flex flex-col sm:flex-row gap-4 items-center w-full sm:w-auto">
          {/* Search bar */}
          <div className="relative w-full sm:max-w-[280px]">
            <Search className="absolute left-4 top-3 text-slate-400" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por código o nombre..."
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all text-xs font-semibold"
            />
          </div>

          {/* Custom Category Dropdown selector instead of overflowing tabs */}
          <div className="relative w-full sm:w-auto" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setShowCatFilterMenu(!showCatFilterMenu)}
              className="w-full sm:w-auto bg-white border border-slate-200 hover:border-slate-350 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-between sm:justify-start space-x-2 transition-all active:scale-98"
            >
              <div className="flex items-center space-x-2">
                <span className={`w-2.5 h-2.5 rounded-full ${activeCategoryDetails.scheme.bar}`} />
                <span>{activeCategoryDetails.label}</span>
              </div>
              <ChevronDown size={14} className="text-slate-500 ml-2" />
            </button>

            {showCatFilterMenu && (
              <div className="absolute left-0 mt-2 bg-white border border-slate-200 shadow-xl rounded-2xl w-full sm:w-[260px] py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <button
                  type="button"
                  onClick={() => {
                    setActiveCategory('all');
                    setShowCatFilterMenu(false);
                  }}
                  className={`w-full px-4 py-2 text-left text-xs font-bold hover:bg-slate-50 flex items-center space-x-2.5 ${activeCategory === 'all' ? 'bg-slate-50 text-blue-900' : 'text-slate-655'}`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                  <span>Todos los Bienes</span>
                </button>
                {categories.map(cat => {
                  const scheme = getCategoryColorScheme(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setActiveCategory(cat.id);
                        setShowCatFilterMenu(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-xs font-bold hover:bg-slate-50 flex items-center space-x-2.5 ${activeCategory === cat.id ? 'bg-slate-50 text-blue-900' : 'text-slate-655'}`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full ${scheme.bar}`} />
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Condition Filter */}
        <div className="flex items-center space-x-2 min-w-[150px] w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex-shrink-0">Estado:</span>
          <select
            value={selectedCondition}
            onChange={e => setSelectedCondition(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-900 w-full appearance-none pr-8 cursor-pointer"
            style={{ backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23475569' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`, backgroundPosition: 'right 8px center', backgroundSize: '16px', backgroundRepeat: 'no-repeat' }}
          >
            <option value="all">Cualquier Condición</option>
            <option value="excelente">Excelente</option>
            <option value="bueno">Bueno</option>
            <option value="regular">Regular</option>
            <option value="dañado">Dañado</option>
            <option value="en_reparacion">En Mantenimiento</option>
          </select>
        </div>
      </div>

      {/* Grid of Fichas - RESTRICTED TO EXACTLY TWO COLUMNS FOR MAXIMUM ORDER */}
      {loading ? (
        <div className="text-center py-20 bg-white border rounded-[2rem] border-slate-200/80">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-900 mx-auto"></div>
          <p className="text-slate-400 mt-4 italic text-sm font-semibold">Cargando inventario del club...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {paginatedBienes.map(b => {
            const scheme = getCategoryColorScheme(b.categoria);
            return (
              <div 
                key={b.id} 
                className="bg-white border border-slate-205 hover:border-slate-350 rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between relative group overflow-hidden"
              >
                {/* Dynamic Category color bar indicator */}
                <div className={`absolute top-0 left-0 right-0 h-1.5 ${scheme.bar}`} />

                <div className="space-y-4 pt-1.5">
                  {/* Code and condition */}
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-450 tracking-wider font-sans bg-slate-100 px-2 py-0.5 rounded-lg">
                      {b.codigo}
                    </span>
                    <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${conditionColors[b.estado]}`}>
                      {conditionLabels[b.estado]}
                    </span>
                  </div>

                  {/* Name & Category Tag */}
                  <div className="text-left">
                    <h4 className="font-extrabold text-slate-805 text-base sm:text-lg leading-snug group-hover:text-blue-950 transition-colors">
                      {b.nombre}
                    </h4>
                    
                    {/* Beautiful matched category tag */}
                    <div className="mt-2 flex items-center">
                      <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg border flex items-center space-x-1 ${scheme.bg} ${scheme.text} ${scheme.border}`}>
                        <Tag size={10} className="mr-1" />
                        <span>{categoryLabelsMap[b.categoria] || b.categoria}</span>
                      </span>
                    </div>
                    
                    {b.notas && (
                      <p className="text-xs text-slate-500 mt-2.5 italic bg-slate-50/50 p-2.5 rounded-xl border border-slate-100 font-medium">
                        "{b.notas}"
                      </p>
                    )}
                  </div>

                  {/* Technical specs of inventory cards */}
                  <div className="grid grid-cols-2 gap-3.5 bg-slate-50/50 p-3 rounded-2xl border border-slate-100/80 text-xs">
                    <div className="flex items-center space-x-2 text-slate-655 font-semibold">
                      <Package size={14} className="text-slate-400" />
                      <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none">Cantidad</span>
                        <span className="text-slate-800 font-extrabold leading-none block mt-1">{b.cantidad} {b.unidadMedida || 'Uds.'}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 text-slate-655 font-semibold">
                      <MapPin size={14} className="text-slate-400" />
                      <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none">Ubicación</span>
                        <span className="text-slate-800 font-extrabold leading-none block mt-1 truncate max-w-[130px]">{b.ubicacion}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 text-slate-655 font-semibold col-span-2">
                      <User size={14} className="text-slate-400" />
                      <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none">Responsable Custodio</span>
                        <span className="text-slate-800 font-extrabold leading-none block mt-1 truncate max-w-[250px]">{b.responsableNombre}</span>
                      </div>
                    </div>
                  </div>

                  {/* Additional details */}
                  <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-100">
                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Valor Estimado</span>
                      <span className="font-extrabold text-slate-850">
                        {b.valorEstimado ? `Q ${b.valorEstimado.toLocaleString('es-GT', { minimumFractionDigits: 0 })}` : 'N/A'}
                      </span>
                    </div>
                    {b.esDonacion && (
                      <div className="text-right">
                        <span className="text-[9px] font-black text-red-500 uppercase tracking-wider flex items-center justify-end">
                          <Heart size={10} className="mr-0.5" /> Donación
                        </span>
                        <span className="text-[10px] text-slate-500 font-semibold truncate max-w-[160px] block mt-0.5">
                          {b.donanteNombre || 'Anónimo'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2 mt-6 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => handleOpenEditModal(b)}
                    className="flex-1 bg-slate-50 text-slate-700 border border-slate-200/80 hover:bg-slate-100 hover:text-slate-800 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-colors flex items-center justify-center space-x-1"
                  >
                    <Edit size={12} />
                    <span>Editar</span>
                  </button>
                  <button
                    onClick={() => handleDeleteBien(b.id)}
                    className="bg-red-50 hover:bg-red-100 text-red-655 border border-red-200/80 p-2.5 rounded-xl font-bold text-xs transition-colors flex items-center justify-center flex-shrink-0"
                    title="Eliminar bien"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {filteredBienes.length === 0 && !loading && (
        <div className="text-center py-16 bg-white border border-dashed border-slate-200 rounded-[2rem] text-slate-400 italic">
          No se encontraron bienes en esa categoría o filtro.
        </div>
      )}

      {/* Pagination component */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 pt-6">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-slate-500 bg-white"
          >
            <ChevronLeft size={16} />
          </button>
          
          {Array.from({ length: totalPages }).map((_, index) => {
            const pageNum = index + 1;
            return (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`w-9 h-9 rounded-xl border text-xs font-bold transition-all ${
                  currentPage === pageNum
                    ? 'bg-blue-900 border-blue-900 text-white shadow-sm'
                    : 'bg-white border-slate-200 text-slate-655 hover:bg-slate-50'
                }`}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-slate-500 bg-white"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* CRUD Add/Edit Redesigned Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-[2rem] p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200 relative text-left my-8">
            <button 
              type="button"
              onClick={() => setShowModal(false)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-655 rounded-full hover:bg-slate-50 transition-colors"
            >
              <X size={20} />
            </button>
            
            <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-slate-100">
              <div className="bg-blue-50 p-2.5 rounded-full text-blue-900 border border-blue-100">
                <Archive size={22} />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">
                  {editingBien ? 'Modificar Artículo de Inventario' : 'Registrar Nuevo Artículo de Inventario'}
                </h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Control y Custodia Patrimonial</p>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              
              {/* SECCIÓN 1: DATOS GENERALES */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-blue-900 uppercase tracking-widest flex items-center pb-1 border-b border-slate-100">
                  <Info size={14} className="mr-1.5" />
                  1. Información General del Artículo
                </h4>
                
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-450 uppercase tracking-wider mb-1.5">Nombre del Artículo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Consola de Sonido Yamaha de 12 Canales, Mesas Plegables, etc."
                    value={formData.nombre}
                    onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 outline-none text-sm font-semibold text-slate-700 placeholder:text-slate-350"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-450 uppercase tracking-wider mb-1.5">Categoría *</label>
                    <select
                      value={formData.categoria}
                      onChange={e => {
                        if (e.target.value === 'NEW_CATEGORY') {
                          setShowNewCatSubform(true);
                        } else {
                          setShowNewCatSubform(false);
                          setFormData({ ...formData, categoria: e.target.value });
                        }
                      }}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 outline-none text-sm font-bold text-slate-700 appearance-none cursor-pointer pr-10"
                      style={{ backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23475569' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`, backgroundPosition: 'right 12px center', backgroundSize: '16px', backgroundRepeat: 'no-repeat' }}
                    >
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.label}</option>
                      ))}
                      <option value="NEW_CATEGORY" className="text-blue-600 font-extrabold">+ Crear nueva categoría...</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-450 uppercase tracking-wider mb-1.5">Estado / Conservación *</label>
                    <select
                      value={formData.estado}
                      onChange={e => setFormData({ ...formData, estado: e.target.value as any })}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 outline-none text-sm font-bold text-slate-700 appearance-none cursor-pointer pr-10"
                      style={{ backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23475569' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`, backgroundPosition: 'right 12px center', backgroundSize: '16px', backgroundRepeat: 'no-repeat' }}
                    >
                      <option value="excelente">Excelente</option>
                      <option value="bueno">Bueno</option>
                      <option value="regular">Regular</option>
                      <option value="dañado">Dañado (Requiere atención)</option>
                      <option value="en_reparacion">En Mantenimiento</option>
                    </select>
                  </div>
                </div>

                {/* SUBFORMULARIO INLINE PARA CREAR CATEGORÍA */}
                {showNewCatSubform && (
                  <div className="p-4 bg-blue-50 border border-blue-150 rounded-2xl space-y-3.5 animate-in slide-in-from-top-2 duration-300">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black text-blue-900 uppercase tracking-widest flex items-center">
                        <Tag size={12} className="mr-1" /> Crear Nueva Categoría
                      </span>
                      <button 
                        type="button" 
                        onClick={() => {
                          setShowNewCatSubform(false);
                          setFormData(prev => ({ ...prev, categoria: categories[0]?.id || '' }));
                        }}
                        className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                      >
                        Cancelar
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nombre Categoría *</label>
                        <input
                          type="text"
                          placeholder="Ej. Equipos de Jardinería"
                          value={newCatLabel}
                          onChange={e => setNewCatLabel(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Prefijo Código * (Max 4 letras)</label>
                        <input
                          type="text"
                          placeholder="Ej. JAR o JARD"
                          value={newCatPrefix}
                          onChange={e => setNewCatPrefix(e.target.value.toUpperCase())}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold uppercase"
                        />
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      onClick={handleAddCategoryInline}
                      className="bg-blue-900 text-white font-extrabold text-xs px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors w-full sm:w-auto"
                    >
                      Guardar Categoría
                    </button>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-450 uppercase tracking-wider mb-1.5">Notas / Descripción Técnica</label>
                  <textarea
                    rows={2}
                    placeholder="Escriba especificaciones físicas, marcas, números de serie o historial relevante..."
                    value={formData.notas}
                    onChange={e => setFormData({ ...formData, notas: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 outline-none text-sm font-semibold text-slate-700 resize-none placeholder:text-slate-350"
                  />
                </div>
              </div>

              {/* SECCIÓN 2: CONTROL DE STOCK Y UBICACIÓN */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-blue-900 uppercase tracking-widest flex items-center pb-1 border-b border-slate-100">
                  <MapPin size={14} className="mr-1.5" />
                  2. Control de Stock y Ubicación
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-450 uppercase tracking-wider mb-1.5">Cantidad *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={formData.cantidad}
                      onChange={e => setFormData({ ...formData, cantidad: parseInt(e.target.value) || 1 })}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 outline-none text-sm font-semibold text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-450 uppercase tracking-wider mb-1.5">Unidad de Medida *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Unidades, Juegos, Cajas, Pares"
                      value={formData.unidadMedida}
                      onChange={e => setFormData({ ...formData, unidadMedida: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 outline-none text-sm font-semibold text-slate-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-450 uppercase tracking-wider mb-1.5">Ubicación Física *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Salón Principal, Bodega B, Vitrina"
                      value={formData.ubicacion}
                      onChange={e => setFormData({ ...formData, ubicacion: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 outline-none text-sm font-semibold text-slate-700 placeholder:text-slate-350"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-450 uppercase tracking-wider mb-1.5">Responsable Custodio *</label>
                    <input
                      type="text"
                      required
                      placeholder="Nombre del socio encargado"
                      value={formData.responsableNombre}
                      onChange={e => setFormData({ ...formData, responsableNombre: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 outline-none text-sm font-semibold text-slate-700"
                    />
                  </div>
                </div>
              </div>

              {/* SECCIÓN 3: VALORACIÓN Y ORIGEN (DONACIÓN) */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-blue-900 uppercase tracking-widest flex items-center pb-1 border-b border-slate-100">
                  <DollarSign size={14} className="mr-1.5" />
                  3. Financiamiento y Origen de Adquisición
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-450 uppercase tracking-wider mb-1.5">Valor Estimado Unitario (Q)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-2.5 font-bold text-slate-400 text-sm">Q</span>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={formData.valorEstimado}
                        onChange={e => setFormData({ ...formData, valorEstimado: e.target.value })}
                        className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 outline-none text-sm font-semibold text-slate-700 placeholder:text-slate-350"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-450 uppercase tracking-wider mb-1.5">Fecha de Adquisición</label>
                    <input
                      type="date"
                      value={formData.fechaAdquisicion}
                      onChange={e => setFormData({ ...formData, fechaAdquisicion: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 outline-none text-sm font-semibold text-slate-700"
                    />
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.esDonacion}
                      onChange={e => setFormData({ ...formData, esDonacion: e.target.checked })}
                      className="rounded text-blue-900 focus:ring-blue-900 w-4.5 h-4.5 border-slate-300 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      ¿Este artículo es el resultado de una donación recibida?
                    </span>
                  </label>

                  {formData.esDonacion && (
                    <div className="pt-2 animate-in slide-in-from-top-2 duration-200">
                      <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">Nombre del Donante / Institución Donante</label>
                      <input
                        type="text"
                        placeholder="Ej. Fundación Leones LCIF, Donante Anónimo, etc."
                        value={formData.donanteNombre}
                        onChange={e => setFormData({ ...formData, donanteNombre: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 outline-none text-xs font-semibold text-slate-700 placeholder:text-slate-350"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* BOTONES DE ACCIÓN */}
              <div className="flex space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 text-slate-655 font-extrabold hover:bg-slate-50 border border-slate-200 rounded-xl transition-all text-sm active:scale-98"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-blue-900 hover:bg-blue-805 text-white font-extrabold rounded-xl transition-all shadow-md shadow-blue-900/10 active:scale-98 text-sm"
                >
                  {editingBien ? 'Guardar Cambios' : 'Registrar en Inventario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
