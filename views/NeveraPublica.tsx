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
      <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-center items-center p-6">
        <Refrigerator className="w-12 h-12 text-amber-400 animate-bounce mb-4" />
        <p className="font-bold text-lg">Cargando Nevera Lionística...</p>
      </div>
    );
  }

  if (completedOrder) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
        <div className="bg-slate-800 rounded-3xl p-8 max-w-md w-full border border-amber-500/30 text-center space-y-6 shadow-2xl animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/50">
            <CheckCircle2 size={48} />
          </div>

          <div>
            <span className="text-xs font-black uppercase tracking-widest text-amber-400">¡Consumo Registrado!</span>
            <h2 className="text-2xl font-black mt-1">¡Gracias, {completedOrder.socio}!</h2>
            <p className="text-slate-400 text-xs mt-2">Orden #{completedOrder.id} registrada exitosamente en el sistema de Tesorería.</p>
          </div>

          <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-700 text-left space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400 font-medium">Monto Total:</span>
              <span className="font-black text-amber-300 text-lg">Q. {completedOrder.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Forma de Pago:</span>
              <span className="font-bold text-white bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
                {completedOrder.metodo}
              </span>
            </div>
          </div>

          <button
            onClick={() => setCompletedOrder(null)}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black py-4 rounded-2xl transition-all shadow-lg text-sm flex items-center justify-center space-x-2"
          >
            <Sparkles size={18} />
            <span>Registrar Otro Consumo</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-32">
      {/* Top Header */}
      <header className="bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800 sticky top-0 z-30 p-4 shadow-md">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-amber-500/20 p-2.5 rounded-2xl border border-amber-500/40 text-amber-400">
              <Refrigerator size={24} />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-white flex items-center">
                Nevera Lionística
                <span className="ml-2 text-[10px] bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">Autoservicio</span>
              </h1>
              <p className="text-xs text-slate-400 font-medium">Club de Leones Quetzaltenango</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-6">

        {/* Step 1: Socio Selection */}
        <section className="bg-slate-900/90 rounded-3xl p-5 border border-slate-800 space-y-3 shadow-lg">
          <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
            <UserCheck size={16} />
            <span>Paso 1: Identifícate como Socio</span>
          </div>

          {selectedSocio ? (
            <div className="flex items-center justify-between bg-amber-950/40 border border-amber-500/40 p-3.5 rounded-2xl">
              <div className="flex items-center space-x-3">
                <img 
                  src={selectedSocio.foto || 'https://picsum.photos/100/100'} 
                  alt={selectedSocio.nombre}
                  className="w-10 h-10 rounded-full object-cover border border-amber-400"
                />
                <div>
                  <h3 className="font-extrabold text-sm text-white">{selectedSocio.nombre}</h3>
                  <p className="text-[11px] text-amber-300 font-medium">{selectedSocio.puesto || 'Socio León'}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedSocio(null);
                  setSocioSearch('');
                }}
                className="text-xs text-slate-400 hover:text-white underline font-bold px-2 py-1"
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
                  className="w-full bg-slate-950 border border-slate-700 rounded-2xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-amber-400 font-medium placeholder-slate-500"
                />
              </div>

              {filteredSocios.length > 0 && (
                <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-850">
                  {filteredSocios.map(socio => (
                    <button
                      key={socio.id}
                      onClick={() => {
                        setSelectedSocio(socio);
                        setSocioSearch('');
                      }}
                      className="w-full p-3 text-left hover:bg-slate-850 flex items-center space-x-3 transition-all cursor-pointer"
                    >
                      <img 
                        src={socio.foto || 'https://picsum.photos/100/100'} 
                        alt={socio.nombre}
                        className="w-8 h-8 rounded-full object-cover border border-slate-700"
                      />
                      <div>
                        <p className="text-xs font-bold text-white">{socio.nombre}</p>
                        <p className="text-[10px] text-slate-400">{socio.puesto || 'Socio'}</p>
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
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeCategory === cat.id
                  ? 'bg-amber-500 text-slate-950 shadow-md scale-102 font-black'
                  : 'bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-850'
              }`}
            >
              <span>{cat.label}</span>
            </button>
          ))}
        </section>

        {/* Step 2: Product Catalog Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredProductos.map(prod => {
            const qtyInCart = cart[prod.id] || 0;
            const isOutOfStock = prod.stockActual <= 0;

            return (
              <div 
                key={prod.id} 
                className={`bg-slate-900 rounded-3xl p-4 border transition-all flex flex-col justify-between ${
                  qtyInCart > 0 
                    ? 'border-amber-500/80 bg-gradient-to-b from-slate-900 to-amber-950/20 shadow-lg shadow-amber-950/20' 
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="space-y-3">
                  <div className="relative h-32 rounded-2xl bg-slate-950 overflow-hidden">
                    <img 
                      src={prod.imagenUrl || 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?q=80&w=400&auto=format&fit=crop'} 
                      alt={prod.nombre}
                      className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute top-2 right-2 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-black text-amber-400 border border-amber-500/30">
                      Q. {prod.precio.toFixed(2)}
                    </div>
                    {isOutOfStock && (
                      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center">
                        <span className="bg-red-500/20 text-red-400 border border-red-500/40 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                          Agotado
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="font-extrabold text-sm text-white line-clamp-1">{prod.nombre}</h3>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[11px] text-slate-400 font-medium">
                        Stock: <strong className={prod.stockActual <= prod.stockMinimo ? 'text-amber-400 font-black' : 'text-slate-300'}>{prod.stockActual} u.</strong>
                      </span>
                      {prod.stockActual <= prod.stockMinimo && prod.stockActual > 0 && (
                        <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-bold">Últimas unidades</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Counter Control */}
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400">Cantidad:</span>
                  <div className="flex items-center space-x-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                    <button
                      onClick={() => handleQuantityChange(prod.id, -1, prod.stockActual)}
                      disabled={qtyInCart === 0}
                      className="w-7 h-7 rounded-lg bg-slate-850 hover:bg-slate-750 disabled:opacity-30 text-white flex items-center justify-center font-bold text-xs cursor-pointer transition-all"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-6 text-center font-black text-sm text-white">{qtyInCart}</span>
                    <button
                      onClick={() => handleQuantityChange(prod.id, 1, prod.stockActual)}
                      disabled={isOutOfStock || qtyInCart >= prod.stockActual}
                      className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 hover:bg-amber-400 disabled:opacity-30 flex items-center justify-center font-black text-xs cursor-pointer transition-all"
                    >
                      <Plus size={14} />
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
        <div className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent">
          <div className="max-w-2xl mx-auto bg-slate-900 border-2 border-amber-500/60 rounded-3xl p-4 shadow-2xl backdrop-blur-md space-y-4">
            
            {/* Socio summary badge */}
            {!selectedSocio && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-2.5 flex items-center space-x-2 text-amber-300 text-xs font-bold">
                <AlertTriangle size={16} className="shrink-0" />
                <span>Recuerda seleccionar tu nombre arriba antes de confirmar.</span>
              </div>
            )}

            {/* Payment Method Selector */}
            <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => setPaymentMethod('cargo_cuenta')}
                className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                  paymentMethod === 'cargo_cuenta'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <CreditCard size={14} />
                <span>Cargar a mi Cuenta</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('efectivo')}
                className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                  paymentMethod === 'efectivo'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <DollarSign size={14} />
                <span>Pago en Efectivo</span>
              </button>
            </div>

            {/* Total and Submit */}
            <div className="flex items-center justify-between pt-1">
              <div>
                <span className="text-xs text-slate-400 font-bold block">{totalQuantity} productos seleccionados</span>
                <span className="text-2xl font-black text-amber-400">Q. {totalAmount.toFixed(2)}</span>
              </div>

              <button
                onClick={handleConfirmOrder}
                disabled={submitting || !selectedSocio}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black px-6 py-3.5 rounded-2xl transition-all hover:scale-105 active:scale-95 disabled:opacity-40 flex items-center space-x-2 cursor-pointer text-sm shadow-lg shadow-amber-500/20"
              >
                <span>{submitting ? 'Registrando...' : 'Confirmar Consumo'}</span>
                <ArrowRight size={18} />
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default NeveraPublica;
