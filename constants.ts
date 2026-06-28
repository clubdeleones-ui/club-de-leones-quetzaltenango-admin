
import { Socio, UserRole, Acta, Actividad, GaleriaItem, Donacion, Beneficio, PropuestaSocio } from './types';
export const MOCK_SOCIOS: Socio[] = [
  {
    id: '1',
    nombre: 'Edwin Ernesto Pacheco López',
    correo: 'innovandoxela@gmail.com',
    rol: UserRole.SUPER_ADMIN,
    puesto: 'Presidente del Club',
    codigoSocio: 'CLQ-2026-001',
    estadoCuotas: 'Al día',
    montoPendiente: 0,
    foto: 'https://picsum.photos/seed/edwin/200/200',
    fechaIngreso: '2026-07-01',
    telefono: '502-36135616',
    estatus: 'Pending',
    fechaFin: '2027-06-30',
    club: 'QUETZALTENANGO',
    fechaUltimoPago: '2026-02-05',
    historialPagos: [
      { id: 'p1-1', fechaPago: '2026-01-05', monto: 100, periodo: 'Enero 2026', tipoPeriodo: 'Mensual', metodo: 'Transferencia', bancoReferencia: 'Banco Industrial', numeroReferencia: 'BI-778901' },
      { id: 'p1-2', fechaPago: '2026-02-05', monto: 100, periodo: 'Febrero 2026', tipoPeriodo: 'Mensual', metodo: 'Transferencia', bancoReferencia: 'Banco Industrial', numeroReferencia: 'BI-889012' }
    ]
  },
  {
    id: '2',
    nombre: 'Flor Rodríguez Cifuentes',
    correo: 'ubirod3@gmail.com',
    rol: UserRole.SECRETARIO,
    puesto: 'Secretario del Club',
    codigoSocio: 'CLQ-2026-002',
    estadoCuotas: 'Pendiente',
    montoPendiente: 100,
    foto: 'https://picsum.photos/seed/flor/200/200',
    fechaIngreso: '2026-07-01',
    telefono: '',
    estatus: 'Pending',
    fechaFin: '2027-06-30',
    club: 'QUETZALTENANGO',
    fechaUltimoPago: '2026-01-08',
    historialPagos: [
      { id: 'p2-1', fechaPago: '2026-01-08', monto: 100, periodo: 'Enero 2026', tipoPeriodo: 'Mensual', metodo: 'Depósito', bancoReferencia: 'Banrural', numeroReferencia: 'BR-112233' }
    ]
  },
  {
    id: '3',
    nombre: 'Oscar Adolfo Garcia Chamale',
    correo: 'oscargarcia@leonesxela.com',
    rol: UserRole.TESORERO,
    puesto: 'Tesorero del Club',
    puestosAdicionales: ['Segundo Vicepresidente del Club'],
    codigoSocio: 'CLQ-2026-003',
    estadoCuotas: 'En mora',
    montoPendiente: 300,
    foto: 'https://picsum.photos/seed/oscar/200/200',
    fechaIngreso: '2026-07-01',
    telefono: '',
    estatus: 'Pending',
    fechaFin: '2027-06-30',
    club: 'QUETZALTENANGO',
    fechaUltimoPago: '2025-12-10',
    historialPagos: [
      { id: 'p3-1', fechaPago: '2025-12-10', monto: 100, periodo: 'Diciembre 2025', tipoPeriodo: 'Mensual', metodo: 'Efectivo' }
    ]
  },
  {
    id: '4',
    nombre: 'Mariantonia Cruz De León De Toralla',
    correo: 'mariancruzdl@gmail.com',
    rol: UserRole.ASESOR_SERVICIOS,
    puesto: 'Asesor de Mercadotecnia',
    codigoSocio: 'CLQ-2026-004',
    estadoCuotas: 'Al día',
    montoPendiente: 0,
    foto: 'https://picsum.photos/seed/mariantonia/200/200',
    fechaIngreso: '2026-07-01',
    telefono: '502-0000-54140948',
    estatus: 'Pending',
    fechaFin: '2027-06-30',
    club: 'QUETZALTENANGO',
    fechaUltimoPago: '2026-01-12',
    historialPagos: [
      { id: 'p4-1', fechaPago: '2026-01-12', monto: 600, periodo: '1er Semestre 2026', tipoPeriodo: 'Semestral', metodo: 'Transferencia', bancoReferencia: 'G&T Continental', numeroReferencia: 'GT-445566' }
    ]
  },
  {
    id: '5',
    nombre: 'Rolando José Daniel Mérida del Valle',
    correo: 'contactomsixela@gmail.com',
    rol: UserRole.PRESIDENTE_AFILIACION,
    puesto: 'Presidente del Comité de Aumento de Socios del Club',
    codigoSocio: 'CLQ-2026-005',
    estadoCuotas: 'Al día',
    montoPendiente: 0,
    foto: 'https://picsum.photos/seed/rolando/200/200',
    fechaIngreso: '2026-07-01',
    telefono: '',
    estatus: 'Pending',
    fechaFin: '2027-06-30',
    club: 'QUETZALTENANGO',
    fechaUltimoPago: '2026-01-02',
    historialPagos: [
      { id: 'p5-1', fechaPago: '2026-01-02', monto: 1200, periodo: 'Año 2026', tipoPeriodo: 'Anual', metodo: 'Transferencia', bancoReferencia: 'Banco Industrial', numeroReferencia: 'BI-999000' }
    ]
  },
  {
    id: '6',
    nombre: 'Jonathan García Chávez',
    correo: 'jd.garcia.ch@gmail.com',
    rol: UserRole.ASESOR_SERVICIOS,
    puesto: 'Asesor de Servicios del club',
    codigoSocio: 'CLQ-2026-006',
    estadoCuotas: 'Pendiente',
    montoPendiente: 200,
    foto: 'https://picsum.photos/seed/jonathan/200/200',
    fechaIngreso: '2026-07-01',
    telefono: '',
    estatus: 'Pending',
    fechaFin: '2027-06-30',
    club: 'QUETZALTENANGO',
    fechaUltimoPago: '2025-12-28',
    historialPagos: [
      { id: 'p6-1', fechaPago: '2025-12-28', monto: 100, periodo: 'Diciembre 2025', tipoPeriodo: 'Mensual', metodo: 'Depósito', bancoReferencia: 'Banrural', numeroReferencia: 'BR-789012' }
    ]
  },
  {
    id: '7',
    nombre: 'Ricardo Solorzano Guillen',
    correo: 'ricardo.solorzano.g@gmail.com',
    rol: UserRole.SOCIO,
    puesto: 'Vicepresidente de club',
    codigoSocio: 'CLQ-2026-007',
    estadoCuotas: 'Al día',
    montoPendiente: 0,
    foto: 'https://picsum.photos/seed/ricardo/200/200',
    fechaIngreso: '2026-07-01',
    telefono: '0050230348221',
    estatus: 'Pending',
    fechaFin: '2027-06-30',
    club: 'QUETZALTENANGO',
    fechaUltimoPago: '2026-02-15',
    historialPagos: [
      { id: 'p7-1', fechaPago: '2026-01-15', monto: 100, periodo: 'Enero 2026', tipoPeriodo: 'Mensual', metodo: 'Efectivo' },
      { id: 'p7-2', fechaPago: '2026-02-15', monto: 100, periodo: 'Febrero 2026', tipoPeriodo: 'Mensual', metodo: 'Transferencia', bancoReferencia: 'Banco Industrial', numeroReferencia: 'BI-113355' }
    ]
  },
  {
    id: '8',
    nombre: 'Club de Leones Quetzaltenango',
    correo: 'clubdeleonesquetzaltenango@gmail.com',
    rol: UserRole.SUPER_ADMIN,
    puesto: 'Administrador Principal',
    codigoSocio: 'CLQ-ADMIN-000',
    estadoCuotas: 'Al día',
    montoPendiente: 0,
    foto: 'https://picsum.photos/seed/adminmain/200/200',
    fechaIngreso: '2026-01-01',
    telefono: '502-7761-0000',
    estatus: 'Active',
    fechaFin: 'Sin fecha fin',
    club: 'QUETZALTENANGO'
  },
  {
    id: '9',
    nombre: 'Sofía Ramos',
    correo: 'donante@leonesxela.com',
    rol: UserRole.DONANTE,
    puesto: 'Donante Distinguido',
    codigoSocio: 'CLQ-DON-009',
    estadoCuotas: 'Al día',
    montoPendiente: 0,
    foto: 'https://picsum.photos/seed/donante1/200/200',
    fechaIngreso: '2025-02-14',
    telefono: '502-5555-5555',
    estatus: 'Active',
    fechaFin: 'Sin fecha fin',
    club: 'QUETZALTENANGO'
  }
];

export const MOCK_ACTAS: Acta[] = [
  {
    id: 'acta-2023-01',
    titulo: 'Asamblea Ordinaria Enero 2024',
    fecha: '2024-01-15',
    contenido: 'Se discutieron los planes para el bingo benéfico de marzo. El tesorero presentó el informe de gastos del año 2023. Se aprobó la remodelación del salón principal del club.',
    autor: 'Elena Castillo',
    pdfUrl: '#'
  },
  {
    id: 'acta-2023-02',
    titulo: 'Reunión de Junta Directiva Febrero 2024',
    fecha: '2024-02-10',
    contenido: 'Coordinación de la jornada médica en el valle de Palajunoj. Se asignaron presupuestos para medicamentos y logística. Nuevos socios propuestos para entrevista.',
    autor: 'Elena Castillo',
    pdfUrl: '#'
  }
];

export const MOCK_ACTIVIDADES: Actividad[] = [
  {
    id: 'ev-1',
    titulo: 'Gran Bingo Benéfico 2026',
    descripcion: 'Acompáñanos en nuestro evento anual para recaudar fondos destinados a becas educativas y suministros escolares para niños de escasos recursos en Quetzaltenango. ¡Habrá música en vivo, deliciosa comida tradicional y fabulosos premios!',
    fecha: '2026-07-15 15:00',
    lugar: 'Sede Central Club de Leones (Diagonal 3, Xela)',
    imagen: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&q=80&w=800',
    publica: true,
    conBotonDonacion: true,
    donacionUrl: '#/donar'
  },
  {
    id: 'ev-2',
    titulo: 'Jornada Oftalmológica Comunitaria',
    descripcion: 'Exámenes de la vista gratuitos y entrega de lentes recetados de alta calidad para personas vulnerables de nuestra comunidad. Contaremos con la participación de oftalmólogos certificados y equipo de alta tecnología.',
    fecha: '2026-08-20 08:00',
    lugar: 'Parque Central de Quetzaltenango',
    imagen: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=800',
    publica: true,
    conBotonDonacion: true,
    donacionUrl: '#/donar'
  }
];


export const MOCK_GALERIA: GaleriaItem[] = [
  {
    id: 'g1',
    titulo: 'Inauguración del Club 1945',
    fecha: '1945-10-25',
    url: 'https://picsum.photos/seed/hist1/800/600',
    descripcion: 'Miembros fundadores frente a la primera sede.'
  },
  {
    id: 'g2',
    titulo: 'Cena de Gala 1970',
    fecha: '1970-12-15',
    url: 'https://picsum.photos/seed/hist2/800/600',
    descripcion: 'Celebración del 25 aniversario.'
  }
];

export const CLUB_STATUTES = `
# ESTATUTOS CLUB DE LEONES DE QUETZALTENANGO

# CAPÍTULO PRIMERO: DISPOSICIONES GENERALES.

ARTÍCULO 1: Denominación y Naturaleza
I. Denominación: La denominación de la Asociación es CLUB DE LEONES DE QUETZALTENANGO, no tendrá ninguna modificación, en adelante denominada simplemente la asociación.
II. Naturaleza: La asociación es una organización de carácter privado, no lucrativa, no religiosa, apolítica, social, cultural, educativa, humanitaria, de asistencia social y de desarrollo integral de sus asociados.

ARTÍCULO 2: Objeto
El objeto de La Asociación es:
a) Agrupar un conjunto de personas que se interesen por el bienestar y los intereses humanos de la sociedad de Quetzaltenango, buscar la cooperación entre profesionales, empresarios, comerciantes y todos los entes que tengan relación directa e indirecta con el desarrollo económico e integral de la comunidad;
b) Fomentar la participación de sus socios en todo lo que se refiera a la superación moral, intelectual, cívica, industrial, profesional, empresarial, de emprendimiento y comercial de la comunidad;
c) Demostrar que el orden, la cooperación y la reciprocidad han de preferirse en lugar de la rivalidad, discordia y la competencia destructora;
d) Cooperar con otras agrupaciones afines y que proyecten los mismos propósitos que la asociación;
e) Buscar, proyectar, procurar y motivar entre los integrantes de la asociación y la sociedad Quetzalteca, prácticas de colaboración y desarrollo entre los sectores empresariales, laborales, profesionales, y económicos que tiendan a crear un desarrollo para toda la sociedad;
f) Velar por: el bienestar, salud, educación, convivencia pacífica, derechos humanos, desarrollo integral, y ambiental de la sociedad quetzalteca, en lo que le fuera pertinente.

ARTÍCULO 3: Domicilio
El domicilio de la Asociación se establece en el municipio de Quetzaltenango, departamento de Quetzaltenango y su sede en CALLE RODOLFO ROBLES, VEINTICUATRO GUIÓN CINCUENTA Y TRES, ZONA UNO, en donde se desarrollarán sus sesiones y asambleas, sin embargo, la asociación podrá establecer subsedes, oficinas y delegaciones en cualquier parte del territorio de la República de Guatemala, así como en el extranjero.

ARTÍCULO 4: Plazo
La Asociación se establece por tiempo indefinido.

ARTÍCULO 5: Fines
Los fines de La Asociación son:
a) Velar por el bienestar ciudadano, la convivencia pacífica entre sus asociados y la población en general;
b) Realizará eventos de toda índole, para instruir y promover a los asociados y cuando corresponda a la demás población, sobre temas de salud, educación, ecología, cultural, deportes, cívica;
c) Fomentar el respeto, y la aplicación de los valores cívicos, éticos, morales, espirituales y científicos de sus asociados y de la población;
d) Proyectar cualquier tipo de ayuda a la sociedad en todas las áreas posibles como salud integral, educación, capacitaciones, eventos, realizando jornadas médicas en general;
e) Conciencia ecológica: promover de todas las formas posibles mensajes a los asociados y a la población, para que cuide, proteja, mantenga, y desarrolle un ambiente ecológico sano, y productivo para el país, realizando toda actividad que sea necesaria para tal fin;
f) Servicios comunitarios como: Alivio de Catástrofes, Servicios de Medio Ambiente, Conciencia y evaluaciones sobre la Diabetes, Servicio de atención y preservación de la Vista, Oportunidades para la Juventud, Atención educativa a Niños;
g) Estos numerales son indicativos y no limitativos pudiendo la asociación realizar toda actividad que busque mejorar las condiciones de vida de Quetzaltenango y de todo el país, sin fines de lucro;
h) La asociación también podrá desarrollar y realizar entre otras las actividades: Aceptar donaciones internas y externas, siempre que las mismas vayan de acuerdo con los objetivos, fines y propósitos de la asociación, solicitar ayuda y celebrar convenios con instituciones de carácter nacional e internacional para el logro de los fines de La Asociación. Todas las actividades que conlleven una prestación de servicios tanto en el objeto como en los fines, se realizarán de manera no lucrativa y ad honorem, de acuerdo con la Naturaleza Jurídica de la asociación y todas aquellas autorizaciones o licencias que sean necesarias para la realización de los mismos serán tramitadas ante la autoridad que corresponda.

# CAPÍTULO SEGUNDO: DE LOS ASOCIADOS.

ARTÍCULO 6: Requisitos de Ingreso
Para ingresar como asociado se establecen los siguientes requisitos:
a) Hombre o mujer, mayor de edad;
b) Responsable, confiable, de reconocida honorabilidad y honradez;
c) Hallarse en el libre ejercicio de sus derechos civiles;
d) El ingreso de nuevos socios es por invitación de un asociado activo;
e) Someterse al procedimiento establecido en el reglamento de ingreso;
f) Cancelar la cuota o contribución que establezca la Asamblea General;
g) Se considerarán asociados activos, aquellos que estén inscritos en los registros de ingresos y egresos de la asociación, que cuenten con la constancia que lo acredite como tal suscrita por el secretario y el presidente de la Junta Directiva, y/o la persona que en el futuro pudiera designarse para esta actividad, y estar al día en el pago de cuotas ordinarias y extraordinarias que se establezcan.

ARTÍCULO 7: Clases de socios
La asociación distingue a los socios en los siguientes tipos:
a) ACTIVO: Es un socio calificado y elegible para presentarse como candidato a cargos de la asociación y el derecho a votar en todos los asuntos que requieren el voto de los socios; y tales obligaciones incluirán el pago puntual de las cuotas, la participación en las actividades de la asociación y una conducta que refleje la imagen favorable de esta asociación en la comunidad;
b) SOCIO FORÁNEO: Es un socio de esta asociación que se marchó de la comunidad, o que por razones de salud u otra causa legítima no pueda asistir regularmente a las reuniones de la asociación, pero desea seguir afiliado a esta asociación y a quien la junta directiva de esta asociación ha conferido esta categoría. La Junta Directiva de esta asociación revisará semestralmente la situación de cada socio foráneo. Un socio foráneo no será elegible para ocupar cargos ni tendrá derecho de voto en las reuniones o convenciones del distrito o internacionales, pero tendrá la obligación de pagar las cuotas fijadas por la asociación;
c) HONORARIO: Aunque no es socio activo de la asociación, es una distinción especial por el servicio excepcional que presta a su comunidad o a esta asociación. La asociación pagará la cuota de ingreso y las cuotas ordinarias y extraordinarias de este socio, quien podrá asistir a las reuniones, pero no tendrá los derechos y privilegios de un socio activo;
d) PRIVILEGIADO: Un socio de esta asociación que ha estado afiliado a esta, por quince años o más y quien por razón de enfermedad, edad avanzada u otra causa legítima determinada por la junta directiva de esta asociación, debe renunciar a su condición de socio activo. Un socio privilegiado pagará las cuotas fijadas por la asociación. Este socio tendrá derecho de voto y otros privilegios que confiere la afiliación, excepto el derecho de ocupar cargos en la asociación.

ARTÍCULO 8: Derechos de los Asociados
a) Elegir y ser electos para optar a cualquier cargo en la Asociación;
b) Tener voz y voto en las sesiones de la Asamblea General;
c) Tener acceso a la información de todos los asuntos que tengan relación con la Asociación;
d) Hacer ponencias y solicitudes ante los órganos de la Asociación;
e) Los socios que no cumplan con la obligación de pagar las cuotas de esta asociación, por más de sesenta (60) días quedarán privados de sus derechos y privilegios hasta que hayan pagado el total de lo que deben. Solo los socios en pleno goce de derechos y privilegios tendrán el derecho de ejercer el voto y de ocupar cargos en esta asociación.

ARTÍCULO 9: Deberes de los asociados
Son deberes de los asociados los siguientes:
a) Cumplir y hacer que se cumplan los estatutos, reglamentos y demás disposiciones adoptados por la asociación, y las leyes de la República de Guatemala;
b) Concurrir a las sesiones a las que fueren convocados, salvo casos irreversibles debidamente comprobados;
c) Desempeñar con responsabilidad y ética los cargos y comisiones que se le confíen;
d) Cooperar en el desarrollo de las actividades de la Asociación; y
e) Aquellos que vayan siendo necesarios debido y/o originados por los cambios de modernización, tecnológica, leyes, costumbres, propios del desarrollo humano, cultural, y social.

# CAPÍTULO TERCERO: ESTRUCTURA ORGÁNICA.

ARTÍCULO 10: Órganos
Son órganos de la Asociación los siguientes:
a) Asamblea General; y
b) Junta Directiva.

ARTÍCULO 11: Asamblea General
La Asamblea General es la máxima autoridad de la asociación.

ARTÍCULO 12: Integración
La Asamblea General se integra con los asociados activos y presentes.

ARTÍCULO 13: Sesiones de la Asamblea General
La Asamblea General se reunirá en forma ordinaria una vez al año y en forma extraordinaria las veces que sea necesario. Asimismo, se podrá reunir cuando lo solicite un mínimo del diez por ciento de los asociados activos según los registros. La asamblea se deberá realizar dentro de los cuatro meses siguientes al período contable que haya concluido, el cual es establecido por las leyes tributarias del país, pudiéndose modificar esta fecha en un futuro si los asociados lo creyeren conveniente; actualmente es del uno de enero al treinta y uno de diciembre de cada año, salvo el primer año el cual inicia de forma diferente.

ARTÍCULO 14: Convocatoria
Las convocatorias a las Asambleas Generales Ordinarias o Extraordinarias se harán por medio de la junta directiva, indicando el carácter de la sesión, fecha, hora y lugar. En el caso de la asamblea general extraordinaria también se deberá incluir la agenda a tratar. La convocatoria debe llegar a cada asociado por lo menos con diez días calendario de anticipación, por medio de convocatoria escrita y correo electrónico.

ARTÍCULO 15: Resoluciones
Las resoluciones de la Asamblea General se adoptarán por mayoría simple de votos de los asociados activos presentes en la sesión, siempre que se ajusten a la ley y a los presentes estatutos y no se podrá alegar desconocimiento de las mismas ya que tienen carácter obligatorio para todos los asociados, aunque no hayan asistido a las sesiones en que fueron acordadas o que hayan votado en contra.

ARTÍCULO 16: Quórum
El quórum para que las sesiones de asamblea general se consideren válidamente reunidas, deberá estar integrado por lo menos con la presencia del cincuenta por ciento más uno de los asociados activos. Si el día y hora fijados en la convocatoria no se reúne el quórum indicado, la sesión se celebrará una hora después, en el mismo lugar y fecha fijados con los asociados que se encuentren presentes, sin necesidad de nueva convocatoria.

ARTÍCULO 17: Atribuciones de la Asamblea General Ordinaria
Las atribuciones de la asamblea general son:
a) Elegir a los miembros de la Junta Directiva;
b) Autorizar las cuotas ordinarias, extraordinarias, y/o cuotas específicas que deben pagar los asociados, propuestas por la junta directiva, y/o asamblea general;
c) Conocer y aprobar los informes de todas las actividades realizadas y la planificación para el siguiente periodo, reportes, planes de trabajo, presupuestos realizados, y proyectados, estados financieros siendo estos actualmente Balance General, Estado de Resultados, Flujos de Efectivo, Cambios en el patrimonio, Notas a los estados financieros, la contabilidad deberá llevarse principalmente de acuerdo a las leyes tributarias vigentes de Guatemala, y en la medida de lo posible en base a los principios de contabilidad generalmente aceptados, si Guatemala adopta normas internacionales de contabilidad o disposiciones específicas a temas contables de asociaciones deberán llevarse de acuerdo a esas normativas que presente la junta directiva;
d) Designar cada año la firma de auditores externos para fiscalizar los recursos patrimoniales de la Asociación; y
e) Aquellas otras que le correspondan de acuerdo con su calidad máxima de la Asociación.

ARTÍCULO 18: Atribuciones de la Asamblea General Extraordinaria
Son atribuciones de la Asamblea General Extraordinaria:
a) Autorizar la enajenación o gravamen de cualquier bien mueble, inmueble o derecho de la Asociación siempre que tal gestión sea para cumplir los fines y objetivos de la asociación;
b) Acordar la reforma, modificación, de los presentes estatutos, e implementación, cambio, modernización, o eliminación de los reglamentos aprobados por la asamblea;
c) Aprobar los reglamentos que sean necesarios para la buena marcha de los asuntos de la Asociación;
d) Acordar la disolución y liquidación de la Asociación;
e) Resolver las impugnaciones que se presenten en contra de actos y/o resoluciones de la Junta Directiva y demás órganos de la Asociación; y,
f) Resolver aquellos asuntos que, por su importancia, no pueden ser propuestos hasta la celebración de la próxima Asamblea General Ordinaria.

ARTÍCULO 19: Junta Directiva
La Junta Directiva es el Órgano Ejecutivo y Administrativo de la Asociación y se integra con los siguientes cargos:
a) Presidente;
b) Vicepresidente;
c) Secretario;
d) Tesorero; y
e) tres vocales.

ARTÍCULO 20: Duración
Los miembros de la Junta Directiva durarán en sus cargos un año y su desempeño será ad-honorem. Podrán ser reelectos por un período más en forma consecutiva, únicamente para que se garantice la alternabilidad en los cargos.

ARTÍCULO 21: Elección
El sistema de elección para integrar la Junta Directiva, será por cargos o por planilla, según decida la Asamblea General. La votación se hará en forma secreta. Resultarán electos quienes obtengan la mayoría simple de votos.

ARTÍCULO 22: Toma de Posesión
La junta directiva electa tomará posesión la primera quincena de julio de cada año.

ARTÍCULO 23: Resoluciones de la Junta Directiva
Todas las resoluciones de la Junta Directiva, deberán tomarse por mayoría simple de votos. En caso de empate, quien presida tendrá doble voto. Para que la reunión de la Junta Directiva se considere válidamente reunida se necesita de la presencia de por lo menos cinco de sus miembros.

ARTÍCULO 24: Atribuciones de la Junta Directiva
Son atribuciones de la junta directiva:
a) Cumplir y hacer que se cumplan los reglamentos y las resoluciones de la asamblea general;
b) Promover actividades para mantener y ampliar los programas de la entidad;
c) Dirigir la administración de la asociación;
d) En defecto de disposiciones reglamentarias, disponer de todo lo que concierne a la contratación, funciones y régimen del personal administrativo de la Asociación;
e) Acordar el otorgamiento de mandatos y designar a los mandatarios que deberán ejercitarlos;
f) Administrar el patrimonio de la asociación;
g) Autorizar los gastos de funcionamiento de la entidad;
h) Preparar el plan de trabajo y el presupuesto anual, así como los informes sobre actividades realizadas y los estados financieros y contables de la entidad, para someterlos a la consideración de la asamblea general;
i) Aceptar herencias, legados y donaciones;
j) Conocer las faltas de los asociados para la aplicación de las medidas disciplinarias correspondientes; y
k) Aquellas otras que le correspondan de conformidad con los presentes estatutos, reglamentos de la Asociación, reglamentos internos y las disposiciones de la asamblea general o por su calidad de órgano administrador.

ARTÍCULO 25: Atribuciones del Presidente
Son atribuciones del presidente las siguientes:
a) Representar legalmente a la asociación en todos los actos en que la misma tenga interés;
b) Presidir las sesiones de la asamblea general y de la Junta Directiva;
c) Aprobar juntamente con el secretario el libro de actas de las sesiones de la asamblea general y de la junta directiva, así como el libro de ingresos y egresos de los asociados;
d) Ejercer doble voto, en caso de empate, en las sesiones de Asamblea General y Junta Directiva;
e) Autorizar juntamente con el tesorero todos los egresos y pagos que se efectúen;
f) Cumplir y hacer que se cumplan los presentes estatutos, el reglamento de la asociación, reglamentos internos, las disposiciones de la asamblea general y/o de la junta directiva y velar por el buen funcionamiento de la entidad y sus órganos;
g) Nombrará los comités ordinarios y extraordinarios para el funcionamiento de la asociación, y los supervisará.

ARTÍCULO 26: Atribuciones del Vicepresidente
Son atribuciones del vicepresidente de la Junta Directiva las siguientes:
a) Asistir al presidente en el desempeño de su cargo;
b) Sustituir al presidente en caso de impedimento, de ausencia temporal o total, esto último si la Asamblea General lo aprobare;
c) Aquellas otras que le asignen la Asamblea General o la Junta Directiva.

ARTÍCULO 27: Atribuciones del Secretario
Son atribuciones del Secretario de la Junta Directiva de la Asociación las siguientes:
a) Llevar y conservar los libros y registros de actas de la Asamblea General, Junta Directiva y de ingreso de asociados;
b) Redactar y autorizar con el Presidente las actas de la Asamblea General y de la Junta Directiva;
c) Notificar los acuerdos de la Asamblea General y de la Junta Directiva;
d) Elaborar y someter a la aprobación de la junta directiva la memoria anual de labores;
e) Ejercer aquellas atribuciones que se relacionen con su competencia;
f) Entregar al término de su función, y de manera oportuna, todos los registros correspondientes de la asociación a su sucesor en el cargo.

ARTÍCULO 28: Atribuciones del Tesorero
Son atribuciones del tesorero de la Junta Directiva de la Asociación las siguientes:
a) Recaudar y custodiar los fondos de la asociación;
b) Autorizar con el presidente las erogaciones con relación a los gastos de funcionamiento y operación de la asociación;
c) Rendir informe mensual a la Junta Directiva del ingreso y egreso de los fondos;
d) Elaborar el proyecto anual de ingresos y egresos de la Asociación;
e) Elaborar el informe contable y financiero anual;
f) Elaborar el inventario de los bienes de la asociación;
g) Informar sobre todos los actos de su competencia;
h) Entregar al término de su función, y de manera oportuna, todos los registros correspondientes de la asociación a su sucesor en el cargo.

ARTÍCULO 29: Atribuciones de los Vocales
Son atribuciones de los vocales de la Junta Directiva las siguientes:
a) Colaborar activamente con los demás miembros de la junta directiva en los asuntos de la asociación;
b) Sustituir por su orden a los miembros de la junta directiva en caso de impedimento, ausencia temporal o definitiva si lo aceptare y si el caso lo amerita, excepto al presidente;
c) Las demás que le asignen los presentes estatutos, el reglamento de la asociación o reglamento interno y las disposiciones de la asamblea general y la junta directiva.

# CAPÍTULO CUARTO: DEL PATRIMONIO Y RÉGIMEN ECONÓMICO.

ARTÍCULO 30: Integración del Patrimonio
El patrimonio de la asociación se constituye con todos los bienes y derechos que adquiera por cualquier título legal. Realizará sus fines y se sostendrá financieramente y/o económicamente con las cuotas que ordinaria y extraordinariamente aporten sus miembros, las contribuciones voluntarias, las donaciones, cualquier producto o rendimiento de los bienes propios y de los eventos que se realicen, y, por cualquier otro ingreso lícito.

ARTÍCULO 31: Destino del Patrimonio
El patrimonio de la Asociación y los bienes particulares que lo constituyen se destinarán exclusivamente a la consecución de sus objetivos y fines, quedándole expresamente prohibidos cualquier tipo de distribución de dividendos, utilidades, ganancias, excedentes, ventajas o privilegios a favor de sus miembros, o de terceros. Ningún miembro de la asociación podrá alegar derechos sobre los bienes de la misma, aunque deje de pertenecer a ella o la asociación misma se disuelva.

ARTÍCULO 32: Fiscalización del Patrimonio
Los recursos patrimoniales de la Asociación serán fiscalizados por dos asociados que serán nombrados por la Asamblea General para un período de dos años o en su caso por un Auditor externo nombrado por la propia Asamblea General a petición de uno de sus asociados.

ARTÍCULO 33: Bienes Remanentes
En caso de disolución de la Asociación, la Asamblea General extraordinaria deberá aprobar a qué entidad deberán trasladarse los bienes remanentes, la que deberá tener fines similares a esta Asociación, dicha entidad debe ser sin fines de lucro económico.

# CAPÍTULO QUINTO: DEL RÉGIMEN DISCIPLINARIO.

ARTÍCULO 34: Diferencias
Toda diferencia que surja entre los asociados o de estos para con la Asociación, se resolverá en forma amigable, mediante la aplicación de métodos alternos de resolución de conflictos.

ARTÍCULO 35: Pérdida de la calidad de Asociado
La calidad de asociado activo se pierde por suspensión temporal acordada por la Junta Directiva. La pérdida de la calidad de asociado se da en los casos establecidos en estos estatutos.

ARTÍCULO 36: Recuperación de la Calidad
La calidad de asociado activo se recupera por cumplimiento del plazo por el cual fue suspendido, o en su caso por cesar la causa que motivó la suspensión, previa resolución de la junta directiva.

ARTÍCULO 37: De las Faltas
Se consideran faltas cometidas por los asociados las siguientes:
a) El incumplimiento de estos estatutos y sus reglamentos, a lo resuelto por la Asamblea General;
b) El incumplimiento a las disposiciones de la Asamblea General;
c) El incumplimiento a lo resuelto por la Junta Directiva, cuando se compruebe que están actuando contra los intereses de la asociación;
d) El incumplimiento de compromisos que contraiga con la asociación; y
e) La falta de pago de más de tres cuotas ordinarias.

ARTÍCULO 38: Sanciones
La Junta Directiva podrá aplicar a cualquier asociado por faltas cometidas, según sea el caso, las siguientes sanciones:
a) Amonestación verbal y/o escrita;
b) Suspensión de la calidad de asociado activo hasta por seis meses. Esta suspensión implica la imposibilidad de ejercer sus derechos establecidos en las literales a, b y c, del artículo ocho de estos estatutos;
c) Pérdida total de la calidad de asociado.

ARTÍCULO 39: Procedimiento
Previo a dictar las sanciones respectivas, la Junta Directiva hará saber por escrito al asociado los cargos que haya en su contra, concediéndole un plazo de diez días hábiles para que por escrito haga valer los argumentos de su defensa. Con su contestación o sin ella, la Junta Directiva dentro de los quince días siguientes dictará la resolución correspondiente. Se exceptúa del trámite anterior lo relativo a las amonestaciones verbales.

ARTÍCULO 40: Recursos
El afectado, dentro de los diez días siguientes de haber sido notificado de la disposición o resolución que le afecte, podrá interponer por escrito ante la junta directiva, recurso de apelación. La Junta Directiva elevará el expediente al conocimiento de la asamblea general, la que estará obligada a conocerlo sin más trámite. En contra de lo resuelto por la asamblea general en relación al caso de apelación, no aplica ningún otro recurso propio de estos estatutos.

ARTÍCULO 41: Actuaciones
Todas las actuaciones referentes a este capítulo deben constar por escrito.

# CAPÍTULO SEXTO: DE LAS MODIFICACIONES A LOS ESTATUTOS.

ARTÍCULO 42: Modificaciones
Los presentes estatutos únicamente podrán ser modificados o reformados por la asamblea general extraordinaria, convocada especialmente para el efecto.

ARTÍCULO 43: Solicitud
La modificación o reforma de los estatutos debe ser solicitada por escrito a la Junta Directiva por una tercera parte de asociados activos y la asamblea general extraordinaria conocerá el caso.

ARTÍCULO 44: Estudio
La Junta Directiva deberá realizar un estudio de la solicitud de modificación o reforma de los estatutos y presentar sus observaciones y un proyecto que contenga las mismas a la asamblea general extraordinaria.

ARTÍCULO 45: Quórum de Aprobación
El Quórum necesario para el cambio de estatutos, se aplica lo estipulado en el artículo dieciséis de los presentes estatutos.

ARTÍCULO 46: Resolución
Toda modificación a los estatutos deberá ser aprobada por el cincuenta por ciento (50%) más uno de los asociados presentes en la asamblea y activos con derecho a voto presente en la Asamblea General Extraordinaria que conozca.

# CAPÍTULO SÉPTIMO: DISOLUCIÓN Y LIQUIDACIÓN.

ARTÍCULO 47: Causas de Disolución
La asociación podrá disolverse por las siguientes causas:
a) Por resolución de autoridad competente;
b) Por resolución de la Asamblea General adoptada en sesión extraordinaria convocada específicamente para este asunto y con el voto favorable de por lo menos en el setenta por ciento de los asociados activos; y
c) Cuando no pudiere continuar con los fines señalados en estos estatutos.

ARTÍCULO 48: Procedimiento de Liquidación
En la Asamblea General extraordinaria que apruebe la disolución de la entidad, se deberá nombrar hasta un máximo de dos (2) liquidadores, quienes cumplirán con las funciones que dicha asamblea les asigne y obligadamente con las siguientes:
a) Tener la representación legal de la Asociación en liquidación;
b) Exigir cuentas de su administración a toda persona que haya manejado intereses de la Asociación;
c) Cumplir con las obligaciones pendientes;
d) Concluir las operaciones pendientes al tiempo de la disolución;
e) Otorgar los finiquitos;
f) Disponer que se practique el Balance General final;
g) Hacer cierre definitivo de todas las cuentas contables, elaborar Estados Financieros de liquidación;
h) Rendir cuenta a la Asamblea General extraordinaria de su administración liquidadora y someter a su consideración toda la documentación para su aprobación final;
i) Suscribir y presentar al Registro de las Personas Jurídicas del Ministerio de Gobernación la documentación de la asociación para cancelar su inscripción.

ARTÍCULO 49: Junta Directiva
Los integrantes de la junta directiva aquí nombrada continuarán en el desempeño de sus cargos hasta la fecha en que la asamblea general elija a la nueva junta directiva de acuerdo con estos estatutos y estos tomen posesión de los cargos. Los presentes proceden a elegir por unanimidad a las personas que ocuparán los diferentes cargos de la junta directiva, la cual queda integrada de la siguiente manera: Presidente: Ricardo Manuel Solórzano Guillén; Vicepresidente: Carlos Haroldo del Valle Martínez; Secretario: Miguel Ángel Hernández Manrique; Tesorero: Edmer Joel Hoffens Minera; Vocal I: Sylvia Leticia Rodríguez Estrada; Vocal II: Mynor Loarca Bacon; Vocal III: Martha Julia Magali Menaut Vargas.

# CAPÍTULO OCTAVO: DISPOSICIONES FINALES Y TRANSITORIAS.

ARTÍCULO 50: Interpretación
Cualquier problema de interpretación de los estatutos y sus reglamentos, deberá ser resuelto por la Junta Directiva. Si la interpretación genera controversia, deberá solicitarse dictamen a un Profesional del Derecho, para resolverla.
`;

export const MOCK_DONACIONES: Donacion[] = [
  {
    id: 'don-1',
    donante: 'Supermercados La Torre',
    monto: 5000,
    fecha: '2024-03-12',
    proyecto: 'Jornada Oftalmológica',
    tipo: 'Empresarial'
  },
  {
    id: 'don-2',
    donante: 'Familia Maldonado Fuentes',
    monto: 1200,
    fecha: '2024-04-05',
    proyecto: 'Remodelación de la Cueva',
    tipo: 'Individual'
  },
  {
    id: 'don-3',
    donante: 'Fundación Rotaria Xela',
    monto: 8000,
    fecha: '2024-04-20',
    proyecto: 'Jornada Médica Palajunoj',
    tipo: 'Empresarial'
  },
  {
    id: 'don-4',
    donante: 'Sofía Ramos',
    monto: 3500,
    fecha: '2025-03-15',
    proyecto: 'Jornada Médica Palajunoj',
    tipo: 'Individual'
  },
  {
    id: 'don-5',
    donante: 'Sofía Ramos',
    monto: 1500,
    fecha: '2025-05-10',
    proyecto: 'Bingo Benéfico',
    tipo: 'Individual'
  }
];

export const MOCK_BENEFICIOS: Beneficio[] = [
  {
    id: 'ben-1',
    titulo: 'Descuento en Óptica Santa Lucía',
    descripcion: '25% de descuento en aros y exámenes de la vista especializados para socios y familiares directos.',
    convenioCon: 'Óptica Santa Lucía Xela',
    descuento: '25%',
    categoria: 'Salud'
  },
  {
    id: 'ben-2',
    titulo: 'Tarifa Corporativa en Gimnasio Flex',
    descripcion: 'Acceso ilimitado a todas las áreas de musculación y clases grupales con mensualidad reducida.',
    convenioCon: 'Gimnasio Flex',
    descuento: 'Q150/mes (reg. Q250)',
    categoria: 'Recreación'
  },
  {
    id: 'ben-3',
    titulo: 'Descuento en Farmacias de la Comunidad',
    descripcion: '10% de descuento en medicamentos éticos y 5% en material de curación al presentar carnet de socio.',
    convenioCon: 'Farmacias La Comunidad',
    descuento: '10%',
    categoria: 'Salud'
  }
];

export const MOCK_PROPUESTAS: PropuestaSocio[] = [
  {
    id: 'prop-ejemplo-1',
    proponente: 'Elena Castillo Castillo',
    nombreCandidato: 'Dr. Mario Juárez Sandoval',
    profesionCandidato: 'Médico Pediatra',
    fotoCandidato: 'https://picsum.photos/seed/mario/200/200',
    caracteristicas: ['Altruismo y Solidaridad', 'Vocación de Servicio', 'Sensibilidad Comunitaria'],
    motivoPropuesta: 'El Dr. Mario es reconocido en Quetzaltenango por sus constantes jornadas de salud pediátrica sin costo para niños de escasos recursos. Su espíritu altruista y compromiso social encajan perfectamente con la visión de ayuda del Club de Leones.',
    porQueBuenLeon: 'Mario aportará su conocimiento médico y redes de apoyo para robustecer nuestras jornadas oftalmológicas y médicas en el valle de Palajunoj. Su capacidad de liderazgo facilitará la consecución de donaciones de insumos de salud.',
    fechaPropuesta: '2026-05-26',
    estado: 'Pendiente',
    generoCandidato: 'Masculino',
    estadoCivil: 'Casado',
    hijos: 'Con hijos',
    nombreEsposa: 'María Fernanda López'
  }
];

