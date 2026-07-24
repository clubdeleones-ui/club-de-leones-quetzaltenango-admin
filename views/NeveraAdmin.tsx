import React, { useState, useEffect, useMemo } from 'react';
import { 
  Refrigerator, 
  Plus, 
  Edit2, 
  Trash2, 
  QrCode, 
  DollarSign, 
  CreditCard, 
  AlertTriangle, 
  Search, 
  CheckCircle2, 
  Printer, 
  TrendingUp,
  Wine,
  Beer,
  CupSoda,
  Cookie,
  History,
  Users,
  X as XIcon,
  Save,
  ShoppingBag
} from 'lucide-react';
import { NeveraProducto, NeveraConsumo, NeveraSaldoSocio, CategoriaProductoNevera, Socio } from '../types';
import { firebaseService } from '../services/firebaseService';
import { useModal } from '../context/ModalContext';
import QRCode from 'qrcode';

export const NeveraAdmin: React.FC = () => {
  const { showAlert, showConfirm } = useModal();
  
  const [activeSubTab, setActiveSubTab] = useState<'inventario' | 'cuentas' | 'historial' | 'qr'>('inventario');
  const [loading, setLoading] = useState(true);
  
  const [productos, setProductos] = useState<NeveraProducto[]>([]);
  const [consumos, setConsumos] = useState<NeveraConsumo[]>([]);
  const [cuentas, setCuentas] = useState<NeveraSaldoSocio[]>([]);
  const [socios, setSocios] = useState<Socio[]>([]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('todos');

  // Product Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<NeveraProducto | null>(null);
  const [productForm, setProductForm] = useState<{
    nombre: string;
    categoria: CategoriaProductoNevera;
    precio: number;
    stockActual: number;
    stockMinimo: number;
    imagenUrl: string;
    activo: boolean;
  }>({
    nombre: '',
    categoria: 'gaseosas_jugos',
    precio: 10,
    stockActual: 12,
    stockMinimo: 5,
    imagenUrl: '',
    activo: true
  });

  // Abono Modal State
  const [isAbonoModalOpen, setIsAbonoModalOpen] = useState(false);
  const [selectedCuentaForAbono, setSelectedCuentaForAbono] = useState<NeveraSaldoSocio | null>(null);
  const [abonoForm, setAbonoForm] = useState<{
    monto: number;
    metodo: 'efectivo' | 'transferencia' | 'deposito';
    referencia: string;
  }>({
    monto: 0,
    metodo: 'efectivo',
    referencia: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await firebaseService.syncInitialNeveraCatalog();
      const [prodsList, consumosList, cuentasList, sociosList] = await Promise.all([
        firebaseService.getNeveraInventario(),
        firebaseService.getNeveraConsumos(),
        firebaseService.getNeveraCuentasSocios(),
        firebaseService.getSocios()
      ]);
      setProductos(prodsList);
      setConsumos(consumosList);
      setCuentas(cuentasList);
      setSocios(sociosList);
    } catch (err) {
      console.error("Error loading nevera admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  // KPIs
  const totalStockUnits = useMemo(() => {
    return productos.reduce((sum, p) => sum + p.stockActual, 0);
  }, [productos]);

  const lowStockCount = useMemo(() => {
    return productos.filter(p => p.stockActual <= p.stockMinimo).length;
  }, [productos]);

  const totalPendingReceivables = useMemo(() => {
    return cuentas.reduce((sum, c) => sum + (c.saldoPendiente || 0), 0);
  }, [cuentas]);

  const totalConsumosVolume = useMemo(() => {
    return consumos.reduce((sum, c) => sum + c.montoTotal, 0);
  }, [consumos]);

  // Product Modal handlers
  const openProductModal = (prod?: NeveraProducto) => {
    if (prod) {
      setEditingProduct(prod);
      setProductForm({
        nombre: prod.nombre,
        categoria: prod.categoria,
        precio: prod.precio,
        stockActual: prod.stockActual,
        stockMinimo: prod.stockMinimo,
        imagenUrl: prod.imagenUrl || '',
        activo: prod.activo !== false
      });
    } else {
      setEditingProduct(null);
      setProductForm({
        nombre: '',
        categoria: 'gaseosas_jugos',
        precio: 10,
        stockActual: 12,
        stockMinimo: 5,
        imagenUrl: '',
        activo: true
      });
    }
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const prodToSave: NeveraProducto = {
        id: editingProduct ? editingProduct.id : '',
        nombre: productForm.nombre,
        categoria: productForm.categoria,
        precio: Number(productForm.precio),
        stockActual: Number(productForm.stockActual),
        stockMinimo: Number(productForm.stockMinimo),
        imagenUrl: productForm.imagenUrl,
        activo: productForm.activo,
        fechaEdicion: new Date().toISOString()
      };

      await firebaseService.saveNeveraProducto(prodToSave);
      showAlert({
        title: "Producto Guardado",
        message: `El producto "${prodToSave.nombre}" se guardó correctamente.`,
        type: 'success'
      });
      setIsProductModalOpen(false);
      loadData();
    } catch (err) {
      console.error("Error saving product:", err);
      showAlert({
        title: "Error",
        message: "No se pudo guardar el producto.",
        type: 'error'
      });
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    const confirmed = await showConfirm({
      title: "Eliminar Producto",
      message: `¿Estás seguro de eliminar el producto "${name}" del inventario de la nevera?`,
      confirmText: "Eliminar",
      type: "warning"
    });

    if (confirmed) {
      try {
        await firebaseService.deleteNeveraProducto(id);
        showAlert({
          title: "Eliminado",
          message: "Producto eliminado correctamente.",
          type: "success"
        });
        loadData();
      } catch (err) {
        console.error("Error deleting product:", err);
      }
    }
  };

  // Stock Adjustment
  const handleAdjustStock = async (prod: NeveraProducto, delta: number) => {
    const newStock = Math.max(0, prod.stockActual + delta);
    try {
      await firebaseService.saveNeveraProducto({ ...prod, stockActual: newStock });
      setProductos(prev => prev.map(p => p.id === prod.id ? { ...p, stockActual: newStock } : p));
    } catch (err) {
      console.error("Error updating stock:", err);
    }
  };

  // Abono Handlers
  const openAbonoModal = (cuenta: NeveraSaldoSocio) => {
    setSelectedCuentaForAbono(cuenta);
    setAbonoForm({
      monto: cuenta.saldoPendiente,
      metodo: 'efectivo',
      referencia: ''
    });
    setIsAbonoModalOpen(true);
  };

  const handleSaveAbono = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCuentaForAbono) return;

    try {
      await firebaseService.registrarAbonoNevera(
        selectedCuentaForAbono.socioId,
        selectedCuentaForAbono.socioNombre,
        {
          id: Date.now().toString(),
          fecha: new Date().toISOString(),
          monto: Number(abonoForm.monto),
          metodo: abonoForm.metodo,
          referencia: abonoForm.referencia,
          registradoPor: 'Tesorero'
        }
      );

      showAlert({
        title: "Abono Registrado",
        message: `Se registró el pago de Q. ${Number(abonoForm.monto).toFixed(2)} para ${selectedCuentaForAbono.socioNombre}.`,
        type: "success"
      });
      setIsAbonoModalOpen(false);
      loadData();
    } catch (err) {
      console.error("Error saving abono:", err);
      showAlert({
        title: "Error",
        message: "No se pudo registrar el abono.",
        type: "error"
      });
    }
  };

  const qrUrl = "https://clubdeleonesquetzaltenango.org/#/nevera";
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    QRCode.toDataURL(qrUrl, { width: 300, margin: 2 })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error("Error generating QR:", err));
  }, [qrUrl]);

  const filteredProductosAdmin = useMemo(() => {
    return productos.filter(p => {
      const matchesCategory = filterCategory === 'todos' || p.categoria === filterCategory;
      const matchesSearch = p.nombre.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [productos, filterCategory, searchQuery]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-left">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-br from-amber-500 to-amber-700 p-3.5 rounded-2xl text-slate-950 shadow-md">
            <Refrigerator className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center">
              Control de Nevera / Bar Lionístico
              <span className="ml-3 text-xs bg-amber-100 text-amber-900 px-3 py-1 rounded-full font-bold">Tesorería</span>
            </h1>
            <p className="text-slate-500 font-medium text-xs mt-0.5">Control de inventario, consumos por QR y estados de cuenta de socios.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => openProductModal()}
            className="flex items-center space-x-2 bg-amber-900 hover:bg-amber-800 text-white px-4 py-2.5 rounded-2xl font-bold transition-all hover:scale-105 active:scale-95 shadow-md cursor-pointer text-xs"
          >
            <Plus size={16} />
            <span>Nuevo Producto</span>
          </button>

          <button
            onClick={() => setActiveSubTab('qr')}
            className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-amber-300 px-4 py-2.5 rounded-2xl font-bold transition-all hover:scale-105 active:scale-95 shadow-md cursor-pointer text-xs border border-amber-500/30"
          >
            <QrCode size={16} />
            <span>Ver QR Imprimible</span>
          </button>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Unidades en Inventario</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{totalStockUnits} u.</h3>
          </div>
          <div className="bg-blue-50 text-blue-900 p-3 rounded-2xl border border-blue-100">
            <ShoppingBag size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Stock Mínimo Alertas</p>
            <h3 className={`text-2xl font-black mt-1 ${lowStockCount > 0 ? 'text-amber-600' : 'text-slate-800'}`}>
              {lowStockCount} alertad{lowStockCount === 1 ? 'a' : 'as'}
            </h3>
          </div>
          <div className={`p-3 rounded-2xl border ${lowStockCount > 0 ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
            <AlertTriangle size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cuentas por Cobrar (Socios)</p>
            <h3 className="text-2xl font-black text-amber-900 mt-1">Q. {totalPendingReceivables.toFixed(2)}</h3>
          </div>
          <div className="bg-amber-50 text-amber-900 p-3 rounded-2xl border border-amber-200">
            <CreditCard size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ventas Totales Registradas</p>
            <h3 className="text-2xl font-black text-emerald-700 mt-1">Q. {totalConsumosVolume.toFixed(2)}</h3>
          </div>
          <div className="bg-emerald-50 text-emerald-700 p-3 rounded-2xl border border-emerald-200">
            <TrendingUp size={24} />
          </div>
        </div>
      </div>

      {/* Navigation Subtabs */}
      <div className="flex border-b border-slate-200 space-x-4 bg-white px-6 rounded-2xl shadow-xs">
        {[
          { id: 'inventario', label: '📦 Catálogo & Stock', icon: ShoppingBag },
          { id: 'cuentas', label: '💳 Cuentas por Cobrar Socios', icon: CreditCard, badge: cuentas.filter(c => c.saldoPendiente > 0).length },
          { id: 'historial', label: '📜 Historial de Consumos', icon: History },
          { id: 'qr', label: '🖨️ Ficha QR Imprimible', icon: QrCode },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`py-4 px-2 text-xs font-black transition-all flex items-center space-x-2 border-b-2 cursor-pointer ${
              activeSubTab === tab.id
                ? 'border-amber-700 text-amber-900'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>{tab.label}</span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className="bg-amber-600 text-white text-[10px] px-2 py-0.5 rounded-full font-black">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* SUBTAB 1: INVENTARIO & STOCK */}
      {activeSubTab === 'inventario' && (
        <div className="space-y-6">
          {/* Controls */}
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-slate-200">
            <div className="relative w-full md:w-80">
              <Search size={18} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar producto en la nevera..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto">
              {[
                { id: 'todos', label: 'Todos' },
                { id: 'gaseosas_jugos', label: '🥤 Gaseosas & Jugos' },
                { id: 'cerveza', label: '🍺 Cervezas' },
                { id: 'vino_licor', label: '🍷 Vinos & Licores' },
                { id: 'snacks', label: '🍿 Snacks' },
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setFilterCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    filterCategory === cat.id
                      ? 'bg-amber-900 text-amber-300 shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProductosAdmin.map(prod => {
              const isLow = prod.stockActual <= prod.stockMinimo;

              return (
                <div key={prod.id} className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                  <div className="space-y-4">
                    <div className="relative h-36 rounded-2xl bg-slate-100 overflow-hidden">
                      <img 
                        src={prod.imagenUrl || 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?q=80&w=400&auto=format&fit=crop'} 
                        alt={prod.nombre}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2 bg-slate-900/90 text-amber-400 font-black text-xs px-3 py-1 rounded-full backdrop-blur-md">
                        Q. {prod.precio.toFixed(2)}
                      </div>
                      {isLow && (
                        <div className="absolute top-2 left-2 bg-amber-600 text-white font-black text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md">
                          ¡Bajo Stock!
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="font-extrabold text-slate-800 text-base">{prod.nombre}</h3>
                      <div className="flex items-center justify-between text-xs mt-2">
                        <span className="text-slate-500 font-medium">Categoría: <strong className="text-slate-700 capitalize">{prod.categoria.replace('_', ' ')}</strong></span>
                        <span className="text-slate-500 font-medium">Mínimo: <strong>{prod.stockMinimo} u.</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Stock Counter Controls */}
                  <div className="mt-5 pt-4 border-t border-slate-100 space-y-3">
                    <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-2xl border border-slate-150">
                      <span className="text-xs font-bold text-slate-700">Stock Disponible:</span>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleAdjustStock(prod, -1)}
                          className="w-7 h-7 bg-white text-slate-700 hover:bg-slate-200 border border-slate-300 rounded-lg flex items-center justify-center font-black text-xs cursor-pointer"
                        >
                          -
                        </button>
                        <span className={`w-8 text-center font-black text-sm ${isLow ? 'text-amber-600' : 'text-slate-800'}`}>
                          {prod.stockActual}
                        </span>
                        <button
                          onClick={() => handleAdjustStock(prod, 1)}
                          className="w-7 h-7 bg-amber-900 text-white hover:bg-amber-800 rounded-lg flex items-center justify-center font-black text-xs cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2 pt-1">
                      <button
                        onClick={() => openProductModal(prod)}
                        className="p-2 text-slate-600 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 rounded-xl transition-all cursor-pointer text-xs flex items-center space-x-1 font-bold"
                      >
                        <Edit2 size={14} />
                        <span>Editar</span>
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(prod.id, prod.nombre)}
                        className="p-2 text-slate-400 hover:text-red-600 bg-slate-100 hover:bg-red-50 rounded-xl transition-all cursor-pointer text-xs"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUBTAB 2: CUENTAS POR COBRAR DE SOCIOS */}
      {activeSubTab === 'cuentas' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-black text-lg text-slate-800">Estados de Cuenta Nevera</h3>
              <p className="text-xs text-slate-500 font-medium">Lista de socios con saldos pendientes por consumos en la nevera.</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Cuentas por Cobrar</span>
              <span className="text-xl font-black text-amber-900">Q. {totalPendingReceivables.toFixed(2)}</span>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {cuentas.filter(c => c.saldoPendiente > 0).length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle2 size={48} className="mx-auto text-emerald-500 mb-3" />
                <p className="text-slate-600 font-bold text-base">¡Todos los socios están al día!</p>
                <p className="text-slate-400 text-xs mt-1">No hay saldos pendientes por cobrar en la nevera.</p>
              </div>
            ) : (
              cuentas.filter(c => c.saldoPendiente > 0).map(cuenta => (
                <div key={cuenta.socioId} className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-900 font-black text-sm">
                      {cuenta.socioNombre.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-800">{cuenta.socioNombre}</h4>
                      <p className="text-xs text-slate-400">
                        Último consumo: {cuenta.ultimoConsumoFecha ? new Date(cuenta.ultimoConsumoFecha).toLocaleDateString('es-GT') : 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Saldo Deudor</span>
                      <span className="text-lg font-black text-amber-900">Q. {cuenta.saldoPendiente.toFixed(2)}</span>
                    </div>

                    <button
                      onClick={() => openAbonoModal(cuenta)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm cursor-pointer flex items-center space-x-1.5"
                    >
                      <DollarSign size={14} />
                      <span>Registrar Pago / Abono</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 3: HISTORIAL DE CONSUMOS */}
      {activeSubTab === 'historial' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-black text-lg text-slate-800">Historial de Consumos Registrados</h3>
              <p className="text-xs text-slate-500 font-medium">Registro detallado de transacciones escaneadas vía autoservicio QR.</p>
            </div>
            <span className="bg-slate-100 text-slate-700 font-bold text-xs px-3 py-1 rounded-full">
              {consumos.length} consumos totales
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <th className="p-3">Fecha</th>
                  <th className="p-3">Socio</th>
                  <th className="p-3">Productos Consumidos</th>
                  <th className="p-3">Forma de Pago</th>
                  <th className="p-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {consumos.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-400">
                      No hay consumos registrados aún.
                    </td>
                  </tr>
                ) : (
                  consumos.map(cons => (
                    <tr key={cons.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-3 whitespace-nowrap text-slate-500">
                        {new Date(cons.fechaConsumo).toLocaleString('es-GT', { dateStyle: 'medium', timeStyle: 'short' })}
                      </td>
                      <td className="p-3 font-bold text-slate-800">{cons.socioNombre}</td>
                      <td className="p-3">
                        <ul className="space-y-0.5">
                          {cons.items.map((it, idx) => (
                            <li key={idx} className="text-[11px]">
                              <strong>{it.cantidad}x</strong> {it.nombreProducto} (Q. {it.subtotal.toFixed(2)})
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="p-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          cons.metodoPago === 'efectivo'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-900'
                        }`}>
                          {cons.metodoPago === 'efectivo' ? '💵 Efectivo en Caja' : '💳 Cargo a Cuenta'}
                        </span>
                      </td>
                      <td className="p-3 text-right font-black text-slate-800 text-sm">
                        Q. {cons.montoTotal.toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 4: FICHA QR IMPRIMIBLE */}
      {activeSubTab === 'qr' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 max-w-xl mx-auto text-center space-y-6">
          <div className="border-4 border-amber-500 rounded-3xl p-6 bg-slate-900 text-white space-y-6 shadow-2xl">
            <div className="flex items-center justify-center space-x-2">
              <Refrigerator size={32} className="text-amber-400" />
              <h2 className="text-2xl font-black tracking-tight">NEVERA LIONÍSTICA</h2>
            </div>
            
            <p className="text-amber-300 font-bold text-xs uppercase tracking-widest">
              Club de Leones Quetzaltenango
            </p>

            <div className="bg-white p-6 rounded-2xl inline-block shadow-inner">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="QR Code Nevera" className="w-56 h-56 mx-auto rounded-xl object-contain" />
              ) : (
                <div className="w-56 h-56 bg-slate-800 animate-pulse rounded-xl mx-auto flex items-center justify-center text-xs text-slate-400">
                  Generando QR...
                </div>
              )}
            </div>

            <div className="space-y-1">
              <p className="text-sm font-extrabold text-slate-100">📱 Escanea con tu teléfono para registrar tu consumo</p>
              <p className="text-xs text-slate-400">Selecciona lo que tomas y elige si pagas en efectivo o lo cargas a tu cuenta.</p>
            </div>

            <div className="pt-2 text-[10px] text-amber-400/80 font-mono border-t border-slate-800">
              {qrUrl}
            </div>
          </div>

          <button
            onClick={() => window.print()}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-2xl transition-all shadow-md flex items-center justify-center space-x-2 text-xs cursor-pointer"
          >
            <Printer size={16} />
            <span>Imprimir Ficha QR para la Puerta de la Nevera</span>
          </button>
        </div>
      )}

      {/* PRODUCT FORM MODAL */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-center items-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-lg text-slate-800">
                {editingProduct ? 'Editar Producto Nevera' : 'Nuevo Producto Nevera'}
              </h3>
              <button onClick={() => setIsProductModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <XIcon size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nombre del Producto *</label>
                <input
                  type="text"
                  required
                  value={productForm.nombre}
                  onChange={(e) => setProductForm({ ...productForm, nombre: e.target.value })}
                  placeholder="Ej. Cerveza Gallo Fría 350ml"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Categoría *</label>
                <select
                  value={productForm.categoria}
                  onChange={(e) => setProductForm({ ...productForm, categoria: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                >
                  <option value="gaseosas_jugos">🥤 Gaseosas & Jugos</option>
                  <option value="cerveza">🍺 Cervezas</option>
                  <option value="vino_licor">🍷 Vinos & Licores</option>
                  <option value="snacks">🍿 Snacks & Botanas</option>
                  <option value="otros">📦 Otros</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Precio (Q.) *</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={productForm.precio}
                    onChange={(e) => setProductForm({ ...productForm, precio: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Stock Actual</label>
                  <input
                    type="number"
                    required
                    value={productForm.stockActual}
                    onChange={(e) => setProductForm({ ...productForm, stockActual: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Stock Mínimo</label>
                  <input
                    type="number"
                    required
                    value={productForm.stockMinimo}
                    onChange={(e) => setProductForm({ ...productForm, stockMinimo: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">URL de Imagen del Producto</label>
                <input
                  type="text"
                  value={productForm.imagenUrl}
                  onChange={(e) => setProductForm({ ...productForm, imagenUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="activoCheck"
                  checked={productForm.activo}
                  onChange={(e) => setProductForm({ ...productForm, activo: e.target.checked })}
                  className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                />
                <label htmlFor="activoCheck" className="text-xs font-bold text-slate-700">Producto Habilitado en Nevera</label>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-900 hover:bg-amber-800 text-white font-bold rounded-xl text-xs shadow-md"
                >
                  Guardar Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ABONO MODAL */}
      {isAbonoModalOpen && selectedCuentaForAbono && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-center items-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-lg text-slate-800">Registrar Pago / Abono Nevera</h3>
                <p className="text-xs text-amber-900 font-bold">{selectedCuentaForAbono.socioNombre}</p>
              </div>
              <button onClick={() => setIsAbonoModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <XIcon size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveAbono} className="space-y-4">
              <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200 text-xs">
                <span className="text-amber-900 font-bold">Saldo Deudor Actual: </span>
                <strong className="text-amber-950 font-black text-sm">Q. {selectedCuentaForAbono.saldoPendiente.toFixed(2)}</strong>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Monto a Cancelar / Abonar (Q.) *</label>
                <input
                  type="number"
                  step="0.5"
                  required
                  max={selectedCuentaForAbono.saldoPendiente}
                  value={abonoForm.monto}
                  onChange={(e) => setAbonoForm({ ...abonoForm, monto: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-black text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Método de Pago *</label>
                <select
                  value={abonoForm.metodo}
                  onChange={(e) => setAbonoForm({ ...abonoForm, metodo: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                >
                  <option value="efectivo">💵 Efectivo Entregado a Tesorería</option>
                  <option value="transferencia">🏦 Transferencia Bancaria</option>
                  <option value="deposito">📄 Depósito Bancario</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Número de Referencia / Nota</label>
                <input
                  type="text"
                  value={abonoForm.referencia}
                  onChange={(e) => setAbonoForm({ ...abonoForm, referencia: e.target.value })}
                  placeholder="Ej. Transf. #948271 de Banco Industrial"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAbonoModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs shadow-md"
                >
                  Registrar Pago
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default NeveraAdmin;
