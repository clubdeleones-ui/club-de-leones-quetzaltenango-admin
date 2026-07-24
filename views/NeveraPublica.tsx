import React, { useState, useEffect, useMemo } from 'react';
import { 
  Wine, 
  Beer, 
  CupSoda, 
  Cookie, 
  ShoppingBag, 
  UserCheck, 
  Search, 
  Plus, 
  Minus, 
  CheckCircle2, 
  DollarSign, 
  CreditCard, 
  ArrowRight,
  Refrigerator,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { NeveraProducto, Socio, CategoriaProductoNevera } from '../types';
import { firebaseService } from '../services/firebaseService';
import { useModal } from '../context/ModalContext';

export const NeveraPublica: React.FC = () => {
  const { showAlert } = useModal();
  
  const [productos, setProductos] = useState<NeveraProducto[]>([]);
  const [socios, setSocios] = useState<Socio[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Selection States
  const [selectedSocio, setSelectedSocio] = useState<Socio | null>(null);
  const [socioSearch, setSocioSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('todos');
  
  // Cart State: { [productId]: quantity }
  const [cart, setCart] = useState<{ [id: string]: number }>({});
  
  // Payment Flow States
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'cargo_cuenta'>('cargo_cuenta');
  const [submitting, setSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<{ id: string; socio: string; total: number; metodo: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await firebaseService.syncInitialNeveraCatalog();
      const [prods, listSocios] = await Promise.all([
        firebaseService.getNeveraInventario(),
        firebaseService.getSocios()
      ]);
      setProductos(prods.filter(p => p.activo !== false));
      setSocios(listSocios);
    } catch (err) {
      console.error("Error loading nevera data:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredSocios = useMemo(() => {
    if (!socioSearch.trim()) return [];
    return socios.filter(s => 
      s.nombre.toLowerCase().includes(socioSearch.toLowerCase()) ||
      (s.codigoSocio && s.codigoSocio.toLowerCase().includes(socioSearch.toLowerCase()))
    ).slice(0, 5);
  }, [socios, socioSearch]);

  const filteredProductos = useMemo(() => {
    if (activeCategory === 'todos') return productos;
    return productos.filter(p => p.categoria === activeCategory);
  }, [productos, activeCategory]);

  const cartItemsList = useMemo(() => {
    return Object.entries(cart)
      .filter(([_, qty]) => qty > 0)
      .map(([id, qty]) => {
        const prod = productos.find(p => p.id === id);
        return {
          productoId: id,
          nombreProducto: prod ? prod.nombre : 'Producto',
          precioUnitario: prod ? prod.precio : 0,
          cantidad: qty,
          subtotal: (prod ? prod.precio : 0) * qty,
          stock: prod ? prod.stockActual : 0
        };
      });
  }, [cart, productos]);

  const totalAmount = useMemo(() => {
    return cartItemsList.reduce((sum, item) => sum + item.subtotal, 0);
  }, [cartItemsList]);

  const totalQuantity = useMemo(() => {
    return cartItemsList.reduce((sum, item) => sum + item.cantidad, 0);
  }, [cartItemsList]);

  const handleQuantityChange = (prodId: string, delta: number, maxStock: number) => {
    const current = cart[prodId] || 0;
    const next = Math.max(0, current + delta);
    if (next > maxStock) {
      showAlert({
        title: "Stock Máximo",
        message: `Solo hay ${maxStock} unidades disponibles de este producto.`,
        type: 'info'
      });
      return;
    }
    setCart(prev => ({ ...prev, [prodId]: next }));
  };

  const handleConfirmOrder = async () => {
    if (!selectedSocio) {
      showAlert({
        title: "Selecciona tu Nombre",
        message: "Por favor busca y selecciona tu perfil de socio antes de confirmar.",
        type: 'error'
      });
      return;
    }

    if (cartItemsList.length === 0) {
      showAlert({
        title: "Carrito Vacío",
        message: "Selecciona al menos un producto para llevar de la nevera.",
        type: 'error'
      });
      return;
    }

    try {
      setSubmitting(true);
      const consumoData = {
        socioId: selectedSocio.id,
        socioNombre: selectedSocio.nombre,
        items: cartItemsList.map(item => ({
          productoId: item.productoId,
          nombreProducto: item.nombreProducto,
          cantidad: item.cantidad,
          precioUnitario: item.precioUnitario,
          subtotal: item.subtotal
        })),
        montoTotal: totalAmount,
        metodoPago: paymentMethod,
        fechaConsumo: new Date().toISOString(),
        estado: paymentMethod === 'efectivo' ? ('pagado' as const) : ('pendiente_cobro' as const),
        notas: `Consumo registrado via Autoservicio QR Nevera`
      };

      const orderId = await firebaseService.registrarConsumoNevera(consumoData);
      
      setCompletedOrder({
        id: orderId.substring(0, 8).toUpperCase(),
        socio: selectedSocio.nombre,
        total: totalAmount,
        metodo: paymentMethod === 'efectivo' ? 'Efectivo en Caja' : 'Cargado a Cuenta Personal'
      });
      
      // Reload inventory
      await loadData();
      setCart({});
    } catch (error) {
      console.error("Error submitting order:", error);
      showAlert({
        title: "Error de Registro",
        message: "Ocurrió un error al registrar tu consumo. Por favor intenta de nuevo.",
        type: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-center items-center p-6">
        <Refrigerator className="w-12 h-12 text-amber-700 animate-bounce mb-4" />
        <p className="font-extrabold text-base text-slate-700">Cargando Nevera Lionística...</p>
      </div>
    );
  }

  if (completedOrder) {
    return (
      <div className="min-h-screen bg-slate-100/80 text-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full border border-slate-200 text-center space-y-6 shadow-2xl animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-300 shadow-sm">
            <CheckCircle2 size={48} />
          </div>

          <div>
            <span className="text-xs font-black uppercase tracking-widest text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              ¡Consumo Registrado!
            </span>
            <h2 className="text-2xl font-black mt-3 text-slate-800">¡Gracias, {completedOrder.socio}!</h2>
            <p className="text-slate-500 text-xs mt-1.5 font-medium">Orden #{completedOrder.id} registrada exitosamente en el sistema de Tesorería.</p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-left space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 font-semibold">Monto Total:</span>
              <span className="font-black text-amber-900 text-lg">Q. {completedOrder.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">Forma de Pago:</span>
              <span className="font-bold text-slate-800 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-xs">
                {completedOrder.metodo}
              </span>
            </div>
          </div>

          <button
            onClick={() => setCompletedOrder(null)}
            className="w-full bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-800 hover:to-amber-900 text-white font-black py-4 rounded-2xl transition-all shadow-md hover:shadow-lg text-sm flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Sparkles size={18} />
            <span>Registrar Otro Consumo</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-800 font-sans pb-36">
      {/* Top Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 p-3.5 sm:p-4 shadow-xs">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-amber-100/80 p-2.5 rounded-2xl border border-amber-300 text-amber-900 shadow-xs">
              <Refrigerator size={24} />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-800 flex items-center">
                Nevera Lionística
                <span className="ml-2 text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider border border-amber-300">
                  Autoservicio QR
                </span>
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium">Club de Leones Quetzaltenango</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-3.5 sm:p-5 space-y-5">

        {/* Step 1: Socio Selection */}
        <section className="bg-white rounded-[2rem] p-4 sm:p-5 border border-slate-200/90 space-y-3 shadow-sm">
          <div className="flex items-center space-x-2 text-amber-900 font-black text-xs uppercase tracking-wider">
            <UserCheck size={16} />
            <span>Paso 1: Identifícate como Socio</span>
          </div>

          {selectedSocio ? (
            <div className="flex items-center justify-between bg-amber-50/80 border border-amber-200/90 p-3 sm:p-3.5 rounded-2xl">
              <div className="flex items-center space-x-3">
                <img 
                  src={selectedSocio.foto || 'https://picsum.photos/100/100'} 
                  alt={selectedSocio.nombre}
                  className="w-10 h-10 rounded-full object-cover border-2 border-amber-400 shadow-xs"
                />
                <div>
                  <h3 className="font-extrabold text-xs sm:text-sm text-slate-900">{selectedSocio.nombre}</h3>
                  <p className="text-[11px] text-amber-900 font-semibold">{selectedSocio.puesto || 'Socio León'}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedSocio(null);
                  setSocioSearch('');
                }}
                className="text-xs text-amber-800 hover:text-amber-950 underline font-extrabold px-2 py-1 cursor-pointer"
              >
                Cambiar
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="relative">
                <Search size={18} className="absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  value={socioSearch}
                  onChange={(e) => setSocioSearch(e.target.value)}
                  placeholder="Escribe tu nombre para buscar..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white font-medium placeholder-slate-400 transition-all shadow-inner"
                />
              </div>

              {filteredSocios.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 shadow-md">
                  {filteredSocios.map(socio => (
                    <button
                      key={socio.id}
                      onClick={() => {
                        setSelectedSocio(socio);
                        setSocioSearch('');
                      }}
                      className="w-full p-3 text-left hover:bg-amber-50/50 flex items-center space-x-3 transition-all cursor-pointer"
                    >
                      <img 
                        src={socio.foto || 'https://picsum.photos/100/100'} 
                        alt={socio.nombre}
                        className="w-8 h-8 rounded-full object-cover border border-slate-200"
                      />
                      <div>
                        <p className="text-xs font-extrabold text-slate-800">{socio.nombre}</p>
                        <p className="text-[10px] text-slate-500 font-medium">{socio.puesto || 'Socio'}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Category Filters */}
        <section className="flex space-x-2 overflow-x-auto custom-scrollbar pb-1">
          {[
            { id: 'todos', label: '📦 Todos', icon: ShoppingBag },
            { id: 'gaseosas_jugos', label: '🥤 Gaseosas & Jugos', icon: CupSoda },
            { id: 'cerveza', label: '🍺 Cerveza', icon: Beer },
            { id: 'vino_licor', label: '🍷 Vino & Licores', icon: Wine },
            { id: 'snacks', label: '🍿 Snacks', icon: Cookie },
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeCategory === cat.id
                  ? 'bg-amber-900 text-amber-300 shadow-md font-black scale-102'
                  : 'bg-white text-slate-700 border border-slate-200/90 hover:bg-slate-100 shadow-xs'
              }`}
            >
              <span>{cat.label}</span>
            </button>
          ))}
        </section>

        {/* Step 2: Product Catalog Grid (Mobile Optimized 2 Columns) */}
        <section className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filteredProductos.map(prod => {
            const qtyInCart = cart[prod.id] || 0;
            const isOutOfStock = prod.stockActual <= 0;

            return (
              <div 
                key={prod.id} 
                className={`bg-white rounded-[1.8rem] p-3 sm:p-4 border transition-all flex flex-col justify-between shadow-xs ${
                  qtyInCart > 0 
                    ? 'border-amber-500/90 bg-gradient-to-b from-white to-amber-50/40 shadow-md shadow-amber-500/10' 
                    : 'border-slate-200/90 hover:border-slate-300'
                }`}
              >
                <div className="space-y-2.5">
                  <div className="relative h-28 sm:h-36 rounded-2xl bg-slate-100 overflow-hidden">
                    <img 
                      src={prod.imagenUrl || 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?q=80&w=400&auto=format&fit=crop'} 
                      alt={prod.nombre}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute top-2 right-2 bg-slate-900/90 backdrop-blur-md px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-black text-amber-400 shadow-sm">
                      Q. {prod.precio.toFixed(2)}
                    </div>
                    {isOutOfStock && (
                      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center">
                        <span className="bg-red-500/90 text-white border border-red-400 text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          Agotado
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 line-clamp-2 min-h-[2rem] leading-snug">
                      {prod.nombre}
                    </h3>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] sm:text-xs text-slate-500 font-medium">
                        Stock: <strong className={prod.stockActual <= prod.stockMinimo ? 'text-amber-700 font-black' : 'text-slate-700'}>{prod.stockActual} u.</strong>
                      </span>
                      {prod.stockActual <= prod.stockMinimo && prod.stockActual > 0 && (
                        <span className="text-[8px] sm:text-[9px] bg-amber-100 text-amber-900 border border-amber-300 px-1 py-0.2 rounded font-bold">Últimas</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Counter Control */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] sm:text-xs font-bold text-slate-500">Cant:</span>
                  <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                    <button
                      onClick={() => handleQuantityChange(prod.id, -1, prod.stockActual)}
                      disabled={qtyInCart === 0}
                      className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-200 disabled:opacity-30 flex items-center justify-center font-bold text-xs cursor-pointer transition-all shadow-xs"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="w-5 sm:w-6 text-center font-black text-xs sm:text-sm text-slate-900">{qtyInCart}</span>
                    <button
                      onClick={() => handleQuantityChange(prod.id, 1, prod.stockActual)}
                      disabled={isOutOfStock || qtyInCart >= prod.stockActual}
                      className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-amber-900 text-amber-300 hover:bg-amber-800 disabled:opacity-30 flex items-center justify-center font-black text-xs cursor-pointer transition-all shadow-xs"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </section>

      </main>

      {/* Floating Bottom Bar / Checkout Drawer */}
      {cartItemsList.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-3 sm:p-4 bg-gradient-to-t from-slate-100 via-slate-100/90 to-transparent">
          <div className="max-w-2xl mx-auto bg-white border-2 border-amber-500/80 rounded-[2.2rem] p-3.5 sm:p-4 shadow-2xl backdrop-blur-md space-y-3">
            
            {/* Socio summary badge */}
            {!selectedSocio && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-2 flex items-center space-x-2 text-amber-900 text-[11px] font-bold">
                <AlertTriangle size={14} className="shrink-0 text-amber-700" />
                <span>Recuerda seleccionar tu nombre arriba antes de confirmar.</span>
              </div>
            )}

            {/* Payment Method Selector */}
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => setPaymentMethod('cargo_cuenta')}
                className={`py-2 px-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                  paymentMethod === 'cargo_cuenta'
                    ? 'bg-amber-900 text-amber-300 shadow-md font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CreditCard size={14} />
                <span>Cargo a Cuenta</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('efectivo')}
                className={`py-2 px-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                  paymentMethod === 'efectivo'
                    ? 'bg-emerald-700 text-white shadow-md font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <DollarSign size={14} />
                <span>Pago Efectivo</span>
              </button>
            </div>

            {/* Total and Submit */}
            <div className="flex items-center justify-between pt-0.5">
              <div>
                <span className="text-[11px] text-slate-500 font-bold block">{totalQuantity} productos seleccionados</span>
                <span className="text-xl sm:text-2xl font-black text-slate-900">Q. {totalAmount.toFixed(2)}</span>
              </div>

              <button
                onClick={handleConfirmOrder}
                disabled={submitting || !selectedSocio}
                className="bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-800 hover:to-amber-900 text-white font-black px-5 py-3 rounded-2xl transition-all hover:scale-105 active:scale-95 disabled:opacity-40 flex items-center space-x-2 cursor-pointer text-xs sm:text-sm shadow-md"
              >
                <span>{submitting ? 'Registrando...' : 'Confirmar Consumo'}</span>
                <ArrowRight size={16} />
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default NeveraPublica;
