import React from 'react';
import { Socio, UserRole } from '../types';
import { 
  CreditCard, 
  Calendar, 
  FileText, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Gift, 
  Heart, 
  Download, 
  Award, 
  DollarSign,
  Briefcase
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { MOCK_DONACIONES } from '../constants';
import { generateDiplomaDonacionPDF } from '../utils/pdfGenerator';

interface DashboardProps {
  user: Socio;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  // Check if the user is a Donor
  const isDonante = user.rol === UserRole.DONANTE;

  // Filter donor-specific donations
  const misDonaciones = React.useMemo(() => {
    return MOCK_DONACIONES.filter(
      (d) => d.donante.toLowerCase() === user.nombre.toLowerCase()
    );
  }, [user.nombre]);

  const montoTotalDonado = React.useMemo(() => {
    return misDonaciones.reduce((sum, d) => sum + d.monto, 0);
  }, [misDonaciones]);

  const handleDescargarDiploma = () => {
    generateDiplomaDonacionPDF(user.nombre, montoTotalDonado);
  };

  // Render Donor Dashboard
  if (isDonante) {
    return (
      <div className="space-y-8 animate-in fade-in duration-700">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="bg-yellow-500 text-blue-900 text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest">
              Panel del Donante
            </span>
            <h1 className="text-4xl font-black text-blue-900 tracking-tight mt-3">¡Gracias por tu apoyo, {user.nombre}!</h1>
            <p className="text-slate-500 mt-1">Aquí puedes ver el impacto de tu generosidad y descargar tu reconocimiento.</p>
          </div>
          <div className="flex items-center space-x-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <img src={user.foto} className="w-12 h-12 rounded-full border-2 border-yellow-500 object-cover" alt="Avatar" />
            <div>
              <p className="font-bold text-sm leading-tight text-slate-800">{user.nombre}</p>
              <p className="text-xs text-slate-500 italic font-medium">{user.puesto || 'Donante Distinguido'}</p>
            </div>
          </div>
        </header>

        {/* KPIs Donante */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-900 to-indigo-950 p-6 rounded-[2rem] text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
              <Heart size={100} className="fill-white" />
            </div>
            <h3 className="text-blue-200 text-xs font-bold uppercase tracking-widest">Total Donado Acumulado</h3>
            <p className="text-4xl font-black mt-2">Q {montoTotalDonado.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</p>
            <p className="text-xs text-yellow-400 mt-3 font-semibold">Sembrando bienestar en Quetzaltenango</p>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-slate-200/80 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none text-blue-900">
              <Gift size={100} />
            </div>
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest">Aportes Realizados</h3>
            <p className="text-4xl font-black text-slate-800 mt-2">{misDonaciones.length} Contribuciones</p>
            <div className="flex items-center text-xs text-green-600 bg-green-50 px-2 py-1 rounded-lg w-fit mt-3 font-semibold">
              <CheckCircle size={12} className="mr-1" />
              Fondos recibidos exitosamente
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-slate-200/80 shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div>
              <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest">Diploma de Reconocimiento</h3>
              <p className="text-sm text-slate-500 mt-2">Descarga tu diploma oficial firmado por la Junta Directiva del Club.</p>
            </div>
            <button
              onClick={handleDescargarDiploma}
              disabled={montoTotalDonado === 0}
              className="mt-4 bg-yellow-500 hover:bg-yellow-600 text-blue-900 font-black px-5 py-3.5 rounded-xl flex items-center justify-center space-x-2 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Award size={18} />
              <span>Descargar Diploma</span>
              <Download size={16} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Historial de donaciones */}
          <div className="bg-white p-8 rounded-[2rem] border border-slate-200/80 shadow-sm space-y-6 lg:col-span-2">
            <h3 className="text-2xl font-black text-slate-800 tracking-tight flex items-center">
              <TrendingUp className="mr-2 text-blue-900" />
              Historial de Contribuciones
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold text-xs uppercase tracking-wider">
                    <th className="pb-4">Fecha</th>
                    <th className="pb-4">Causa / Proyecto Patrocinado</th>
                    <th className="pb-4">Tipo</th>
                    <th className="pb-4 text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {misDonaciones.map((don) => (
                    <tr key={don.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 text-sm text-slate-600 font-medium">{don.fecha}</td>
                      <td className="py-4 text-sm font-bold text-slate-800">{don.proyecto}</td>
                      <td className="py-4 text-xs font-semibold text-slate-500">{don.tipo}</td>
                      <td className="py-4 text-sm font-black text-blue-900 text-right">Q {don.monto.toFixed(2)}</td>
                    </tr>
                  ))}
                  {misDonaciones.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400 italic">No se han registrado donaciones bajo este nombre aún.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Proyectos de Impacto Activos */}
          <div className="bg-white p-8 rounded-[2rem] border border-slate-200/80 shadow-sm space-y-6">
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Causas Activas</h3>
            <p className="text-slate-400 text-xs leading-relaxed">Conoce las campañas activas que buscan financiamiento para seguir sirviendo en Quetzaltenango.</p>
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors cursor-pointer border border-slate-100">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-black bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full uppercase">Salud</span>
                  <span className="text-xs font-bold text-yellow-600">Activo</span>
                </div>
                <h4 className="font-extrabold text-slate-800 mt-2">Jornada Oftalmológica 2026</h4>
                <p className="text-xs text-slate-500 mt-1">Meta: Proveer exámenes y lentes correctores gratis a 500 personas de escasos recursos.</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors cursor-pointer border border-slate-100">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-black bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full uppercase">Educación</span>
                  <span className="text-xs font-bold text-yellow-600">Activo</span>
                </div>
                <h4 className="font-extrabold text-slate-800 mt-2">Remodelación Escuela Palajunoj</h4>
                <p className="text-xs text-slate-500 mt-1">Meta: Reconstruir techos, sanitarios e instalar pizarras en la escuela local del cantón.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render Standard Socio Dashboard
  const data = [
    { name: 'Pagado', value: 850 },
    { name: 'Pendiente', value: user.montoPendiente },
  ];
  const COLORS = ['#1e3a8a', '#eab308'];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-blue-900 tracking-tight">Hola, {user.nombre}</h1>
          <p className="text-slate-500 mt-1">Bienvenido a tu panel de socio.</p>
        </div>
        <div className="flex items-center space-x-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <img src={user.foto} className="w-12 h-12 rounded-full border-2 border-yellow-500 object-cover" alt="Avatar" />
          <div>
            <p className="font-bold text-sm leading-tight text-slate-800">{user.nombre}</p>
            <p className="text-xs text-slate-500 italic font-medium">{user.puesto || 'Socio Activo'}</p>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-50 text-blue-900 rounded-2xl">
              <CreditCard size={24} />
            </div>
            {user.estadoCuotas === 'Al día' ? (
              <span className="flex items-center text-xs font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                <CheckCircle size={12} className="mr-1" /> AL DÍA
              </span>
            ) : (
              <span className="flex items-center text-xs font-bold text-yellow-600 bg-yellow-50 px-2.5 py-1 rounded-full">
                <AlertCircle size={12} className="mr-1" /> PENDIENTE
              </span>
            )}
          </div>
          <h3 className="text-slate-500 text-sm font-medium">Estado de Cuotas</h3>
          <p className="text-3xl font-bold mt-1">Q {user.montoPendiente.toFixed(2)}</p>
          <p className="text-xs text-slate-400 mt-2">Saldo pendiente al corte actual.</p>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="p-3 bg-yellow-50 text-yellow-600 rounded-2xl w-fit mb-4">
            <Calendar size={24} />
          </div>
          <h3 className="text-slate-500 text-sm font-medium">Asistencia</h3>
          <p className="text-3xl font-bold mt-1">92%</p>
          <p className="text-xs text-slate-400 mt-2">Últimos 12 meses.</p>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="p-3 bg-green-50 text-green-600 rounded-2xl w-fit mb-4">
            <FileText size={24} />
          </div>
          <h3 className="text-slate-500 text-sm font-medium">Actas Revisadas</h3>
          <p className="text-3xl font-bold mt-1">12</p>
          <p className="text-xs text-slate-400 mt-2">Este año fiscal.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Chart Section */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-xl font-bold mb-6 flex items-center">
            <TrendingUp className="mr-2 text-blue-900" />
            Resumen Financiero Anual
          </h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center space-x-8 mt-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-900 rounded-full" />
              <span className="text-sm text-slate-600">Al día (Q850)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full" />
              <span className="text-sm text-slate-600">Pendiente (Q{user.montoPendiente})</span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-xl font-bold mb-6">Próximos Pasos</h3>
          <div className="space-y-6">
            <div className="flex items-center p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors cursor-pointer">
              <div className="bg-blue-900 text-white p-3 rounded-xl mr-4">
                <FileText size={20} />
              </div>
              <div className="flex-grow">
                <p className="font-bold">Firmar Acta 2024-02</p>
                <p className="text-xs text-slate-500">Pendiente de revisión</p>
              </div>
            </div>
            <div className="flex items-center p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors cursor-pointer">
              <div className="bg-yellow-500 text-blue-900 p-3 rounded-xl mr-4">
                <CreditCard size={20} />
              </div>
              <div className="flex-grow">
                <p className="font-bold">Pago Cuota Abril</p>
                <p className="text-xs text-slate-500">Vence en 5 días</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
