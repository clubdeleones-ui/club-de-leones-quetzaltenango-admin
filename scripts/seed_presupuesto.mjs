import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC08B_CEENQfWsAqIw8E15OKc61gA_6e68",
  authDomain: "club-leones-quetzaltenango.firebaseapp.com",
  projectId: "club-leones-quetzaltenango",
  storageBucket: "club-leones-quetzaltenango.firebasestorage.app",
  messagingSenderId: "373834259776",
  appId: "1:373834259776:web:7c2ac8c45998abe9b12ea5"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const DATOS_OFICIALES = [
  // INGRESOS (1.01 & 2.01)
  { codigo: "1.01", tipo: "Ingreso", categoria: "Ingresos Administrativos", descripcion: "Cuotas Ordinarias 54 Socios x 9 Meses", unidad: "SOCIO", cantidad: 54, montoUnitario: 1125.00, total: 60750.00, comision: "Administración y Finanzas" },
  { codigo: "1.01", tipo: "Ingreso", categoria: "Ingresos Administrativos", descripcion: "Parqueo Club de Leones", unidad: "MES", cantidad: 9, montoUnitario: 15000.00, total: 135000.00, comision: "Comisión de Parqueo" },
  { codigo: "1.01", tipo: "Ingreso", categoria: "Ingresos Administrativos", descripcion: "Local Club de Leones", unidad: "MES", cantidad: 6, montoUnitario: 3000.00, total: 18000.00, comision: "Comisión de Arrendamientos" },
  { codigo: "1.01", tipo: "Ingreso", categoria: "Ingresos Administrativos", descripcion: "Apartamento Club de Leones", unidad: "MES", cantidad: 8, montoUnitario: 300.00, total: 2400.00, comision: "Comisión de Arrendamientos" },
  { codigo: "2.01", tipo: "Ingreso", categoria: "Ingresos por Actividades", descripcion: "Rifa Anual / Actividad de Recaudacion", unidad: "UNIDAD", cantidad: 1, montoUnitario: 10000.00, total: 10000.00, comision: "Comisión de Festejos y Recaudación" },
  { codigo: "2.01", tipo: "Ingreso", categoria: "Ingresos por Actividades", descripcion: "Bingo Anual / Actividad de Recaudacion", unidad: "UNIDAD", cantidad: 1, montoUnitario: 10000.00, total: 10000.00, comision: "Comisión de Festejos y Recaudación" },
  { codigo: "2.01", tipo: "Ingreso", categoria: "Ingresos por Actividades", descripcion: "Donaciones de Patrocinadores / Empresas", unidad: "UNIDAD", cantidad: 10, montoUnitario: 2000.00, total: 20000.00, comision: "Comisión de Relaciones Públicas" },
  { codigo: "2.01", tipo: "Ingreso", categoria: "Ingresos por Actividades", descripcion: "Evento / Cena Benefica", unidad: "UNIDAD", cantidad: 1, montoUnitario: 10000.00, total: 10000.00, comision: "Comisión de Festejos y Recaudación" },

  // EGRESOS - OBRAS SOCIALES (4.01)
  { codigo: "4.01", tipo: "Egreso", categoria: "Obras Sociales / Actividades de Servicio", descripcion: "Salud Mental y Bienestar (4-12 Oct - Semana Mundial de Servicio)", unidad: "ACTIVIDAD", cantidad: 1, montoUnitario: 8000.00, total: 8000.00, comision: "Comisión de Obras Sociales y Salud" },
  { codigo: "4.01", tipo: "Egreso", categoria: "Obras Sociales / Actividades de Servicio", descripcion: "Diabetes (14 Nov - Dia Mundial de la Diabetes)", unidad: "ACTIVIDAD", cantidad: 1, montoUnitario: 8000.00, total: 8000.00, comision: "Comisión de Obras Sociales y Salud" },
  { codigo: "4.01", tipo: "Egreso", categoria: "Obras Sociales / Actividades de Servicio", descripcion: "Hambre (Enero - Periodo Intensivo)", unidad: "ACTIVIDAD", cantidad: 1, montoUnitario: 8000.00, total: 8000.00, comision: "Comisión de Obras Sociales y Salud" },
  { codigo: "4.01", tipo: "Egreso", categoria: "Obras Sociales / Actividades de Servicio", descripcion: "Ayuda Humanitaria (Marzo - Enfoque Servicio Humanitario)", unidad: "ACTIVIDAD", cantidad: 1, montoUnitario: 8000.00, total: 8000.00, comision: "Comisión de Obras Sociales y Salud" },
  { codigo: "4.01", tipo: "Egreso", categoria: "Obras Sociales / Actividades de Servicio", descripcion: "Medio Ambiente (5 Jun - Dia Mundial del Medio Ambiente)", unidad: "ACTIVIDAD", cantidad: 1, montoUnitario: 8000.00, total: 8000.00, comision: "Comisión de Medio Ambiente" },

  // EGRESOS - CONVIVENCIAS Y EVENTOS (5.01)
  { codigo: "5.01", tipo: "Egreso", categoria: "Convivencias y Eventos", descripcion: "1 de Noviembre - Homenaje a Leones Fallecidos", unidad: "CONVIVENCIA", cantidad: 1, montoUnitario: 1500.00, total: 1500.00, comision: "Comisión de Protocolo y Convivencia" },
  { codigo: "5.01", tipo: "Egreso", categoria: "Convivencias y Eventos", descripcion: "Dia del Diablo (7 de Diciembre)", unidad: "CONVIVENCIA", cantidad: 1, montoUnitario: 1500.00, total: 1500.00, comision: "Comisión de Entretenimiento y Convivencia" },
  { codigo: "5.01", tipo: "Egreso", categoria: "Convivencias y Eventos", descripcion: "Convivio Navideno", unidad: "CONVIVENCIA", cantidad: 1, montoUnitario: 10000.00, total: 10000.00, comision: "Comisión de Entretenimiento y Convivencia" },
  { codigo: "5.01", tipo: "Egreso", categoria: "Convivencias y Eventos", descripcion: "Dia del Carino", unidad: "CONVIVENCIA", cantidad: 1, montoUnitario: 1500.00, total: 1500.00, comision: "Comisión de Entretenimiento y Convivencia" },
  { codigo: "5.01", tipo: "Egreso", categoria: "Convivencias y Eventos", descripcion: "Viernes de Dolores (19 de Marzo)", unidad: "CONVIVENCIA", cantidad: 1, montoUnitario: 1500.00, total: 1500.00, comision: "Comisión de Entretenimiento y Convivencia" },
  { codigo: "5.01", tipo: "Egreso", categoria: "Convivencias y Eventos", descripcion: "Dia de la Madre", unidad: "CONVIVENCIA", cantidad: 1, montoUnitario: 3000.00, total: 3000.00, comision: "Comisión de Damas Leonas y Festejos" },
  { codigo: "5.01", tipo: "Egreso", categoria: "Convivencias y Eventos", descripcion: "Dia del Padre", unidad: "CONVIVENCIA", cantidad: 1, montoUnitario: 1500.00, total: 1500.00, comision: "Comisión de Entretenimiento y Convivencia" },

  // EGRESOS - ADMINISTRATIVOS (3.01)
  { codigo: "3.01", tipo: "Egreso", categoria: "Egresos Administrativos", descripcion: "Cuotas Internacionales por Ano", unidad: "SOCIO", cantidad: 54, montoUnitario: 396.78, total: 21426.12, comision: "Administración y Finanzas" },
  { codigo: "3.01", tipo: "Egreso", categoria: "Egresos Administrativos", descripcion: "Cuotas de Distrito por Ano", unidad: "SOCIO", cantidad: 54, montoUnitario: 100.00, total: 5400.00, comision: "Administración y Finanzas" },
  { codigo: "3.01", tipo: "Egreso", categoria: "Egresos Administrativos", descripcion: "Pago Operadora Parqueo (Norvil Gutierrez)", unidad: "MES", cantidad: 9, montoUnitario: 4248.00, total: 38232.00, comision: "Comisión de Parqueo" },
  { codigo: "3.01", tipo: "Egreso", categoria: "Egresos Administrativos", descripcion: "Comite Consultivo de Jefe de Zona", unidad: "UNIDAD", cantidad: 1, montoUnitario: 1000.00, total: 1000.00, comision: "Junta Directiva y Presidencia" },
  { codigo: "3.01", tipo: "Egreso", categoria: "Egresos Administrativos", descripcion: "Actividad Conjunta con Clubes de Zona", unidad: "UNIDAD", cantidad: 1, montoUnitario: 5000.00, total: 5000.00, comision: "Junta Directiva y Presidencia" },
  { codigo: "3.01", tipo: "Egreso", categoria: "Egresos Administrativos", descripcion: "Capacitaciones", unidad: "UNIDAD", cantidad: 3, montoUnitario: 1000.00, total: 3000.00, comision: "Comisión de Liderazgo y Aumento de Socios" },
  { codigo: "3.01", tipo: "Egreso", categoria: "Egresos Administrativos", descripcion: "Pines y Reconocimientos", unidad: "UNIDAD", cantidad: 50, montoUnitario: 50.00, total: 2500.00, comision: "Comisión de Protocolo y Agenda Leonística" },
  { codigo: "3.01", tipo: "Egreso", categoria: "Egresos Administrativos", descripcion: "Suministros de Cafeteria", unidad: "SESION", cantidad: 36, montoUnitario: 50.00, total: 1800.00, comision: "Comisión de Logística, Alimentos y Bebidas" },
  { codigo: "3.01", tipo: "Egreso", categoria: "Egresos Administrativos", descripcion: "Suministros de Limpieza", unidad: "MES", cantidad: 9, montoUnitario: 400.00, total: 3600.00, comision: "Administración y Mantenimiento de Sede" },
  { codigo: "3.01", tipo: "Egreso", categoria: "Egresos Administrativos", descripcion: "Mantenimiento de Edificios + Luz y Agua", unidad: "MES", cantidad: 9, montoUnitario: 2500.00, total: 22500.00, comision: "Administración y Mantenimiento de Sede" }
];

async function run() {
  console.log("=== INICIANDO LIMPIEZA Y CARGA DEL PRESUPUESTO OFICIAL ===");

  // 1. Limpiar colecciones anteriores
  const colecciones = ['presupuestos_fondos', 'presupuestos_asignaciones', 'presupuestos_rubros'];
  for (const colName of colecciones) {
    const snap = await getDocs(collection(db, colName));
    console.log(`Borrando ${snap.size} registros de ${colName}...`);
    for (const d of snap.docs) {
      await deleteDoc(doc(db, colName, d.id));
    }
  }

  // 2. Insertar Rubros oficiales
  const rubrosUnicos = [
    { codigo: "1.01", nombre: "Ingresos Administrativos", descripcion: "Cuotas, parqueo y arrendamientos del Club" },
    { codigo: "2.01", nombre: "Ingresos por Actividades", descripcion: "Rifas, bingos, cenas benéficas y donaciones de patrocinadores" },
    { codigo: "3.01", nombre: "Egresos Administrativos", descripcion: "Operación de parqueo, cuotas internacionales/distritales, suministros y sede" },
    { codigo: "4.01", nombre: "Obras Sociales / Actividades de Servicio", descripcion: "Ejes globales de servicio: Salud Mental, Diabetes, Hambre, Ayuda Humanitaria, Medio Ambiente" },
    { codigo: "5.01", nombre: "Convivencias y Eventos", descripcion: "Festejos leonísticos, convivios y fechas tradicionales" }
  ];

  for (const r of rubrosUnicos) {
    const rubroId = `rubro-cod-${r.codigo.replace('.', '_')}`;
    await setDoc(doc(db, "presupuestos_rubros", rubroId), {
      id: rubroId,
      codigo: r.codigo,
      nombre: r.nombre,
      descripcion: r.descripcion,
      fechaCreacion: new Date().toISOString(),
      activo: true
    });
    console.log(`[OK] Rubro creado: ${r.codigo} - ${r.nombre}`);
  }

  // 3. Insertar Ingresos en presupuestos_fondos
  const ingresos = DATOS_OFICIALES.filter(d => d.tipo === "Ingreso");
  for (let i = 0; i < ingresos.length; i++) {
    const ing = ingresos[i];
    const fondoId = `fondo-${ing.codigo.replace('.', '_')}-${i + 1}`;
    await setDoc(doc(db, "presupuestos_fondos", fondoId), {
      id: fondoId,
      tipo: ing.descripcion.includes("Cuota") ? "Cuotas" : ing.categoria.includes("Actividades") ? "Actividad" : "Autónomo",
      monto: ing.total,
      descripcion: ing.descripcion,
      fecha: new Date().toISOString(),
      codigo: ing.codigo,
      categoria: ing.categoria,
      unidad: ing.unidad,
      cantidad: ing.cantidad,
      montoUnitario: ing.montoUnitario,
      comision: ing.comision
    });
    console.log(`[OK] Ingreso: Q${ing.total.toLocaleString()} -> ${ing.descripcion}`);
  }

  // 4. Insertar Egresos en presupuestos_asignaciones
  const egresos = DATOS_OFICIALES.filter(d => d.tipo === "Egreso");
  for (let i = 0; i < egresos.length; i++) {
    const eg = egresos[i];
    const asigId = `asig-${eg.codigo.replace('.', '_')}-${i + 1}`;
    const rubroId = `rubro-cod-${eg.codigo.replace('.', '_')}`;

    let temporalidad = "Unica";
    if (eg.unidad === "MES") temporalidad = "Mensual";
    else if (eg.unidad === "SOCIO" || eg.unidad === "ACTIVIDAD" || eg.unidad === "CONVIVENCIA") temporalidad = "Anual";

    await setDoc(doc(db, "presupuestos_asignaciones", asigId), {
      id: asigId,
      comision: eg.comision,
      monto: eg.total,
      rubroId: rubroId,
      temporalidad: temporalidad,
      actividad: eg.descripcion,
      descripcion: `${eg.cantidad} ${eg.unidad} × Q${eg.montoUnitario.toFixed(2)} (${eg.categoria})`,
      fechaCreacion: new Date().toISOString(),
      codigo: eg.codigo,
      categoria: eg.categoria,
      unidad: eg.unidad,
      cantidad: eg.cantidad,
      montoUnitario: eg.montoUnitario,
      totalPresupuestado: eg.total
    });
    console.log(`[OK] Egreso: Q${eg.total.toLocaleString()} -> [${eg.comision}] ${eg.descripcion}`);
  }

  console.log("=== PRESUPUESTO OFICIAL CARGADO EXITOSAMENTE ===");
  process.exit(0);
}

run().catch((err) => {
  console.error("Error al ejecutar:", err);
  process.exit(1);
});
