const UNIDADES = ['cero', 'un', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
const DECENAS = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta'];

export function numberToWords(n: number, isFem = false): string {
  if (n < 20) {
    if (n === 1) return isFem ? 'una' : 'un';
    return UNIDADES[n];
  }
  if (n === 20) return 'veinte';
  if (n < 30) {
    const special = ['veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve'];
    if (n === 21 && isFem) return 'veintiuna';
    return special[n - 21];
  }
  const dec = Math.floor(n / 10);
  const uni = n % 10;
  if (uni === 0) return DECENAS[dec];
  const uniWord = uni === 1 && isFem ? 'una' : UNIDADES[uni];
  return `${DECENAS[dec]} y ${uniWord}`;
}

export function getWrittenDateTimeSpanish(date: Date): string {
  const day = date.getDate();
  const monthIndex = date.getMonth();
  const year = date.getFullYear();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  
  const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  
  const dayWord = day === 1 ? 'primero' : numberToWords(day);
  const monthWord = months[monthIndex];
  
  let yearWord = 'dos mil ';
  if (year >= 2000 && year < 2100) {
    const yy = year - 2000;
    yearWord += numberToWords(yy);
  } else {
    yearWord += year.toString(); // Fallback
  }
  
  const hourWord = hours === 1 ? 'una hora' : `${numberToWords(hours, true)} horas`;
  let minWord = '';
  if (minutes === 0) {
    minWord = 'en punto';
  } else if (minutes === 1) {
    minWord = 'un minuto';
  } else {
    minWord = `${numberToWords(minutes)} minutos`;
  }
  
  const written = `${dayWord} de ${monthWord} de ${yearWord} a las ${hourWord} con ${minWord}`;
  
  // Numeric format: DD/MM/YYYY HH:MM
  const dd = String(day).padStart(2, '0');
  const mm = String(monthIndex + 1).padStart(2, '0');
  const yyyy = year;
  const hh = String(hours).padStart(2, '0');
  const mins = String(minutes).padStart(2, '0');
  const numeric = `${dd}/${mm}/${yyyy} ${hh}:${mins}`;
  
  // Capitalize first letter
  const capitalizedWritten = written.charAt(0).toUpperCase() + written.slice(1);
  
  return `${capitalizedWritten} (${numeric})`;
}

export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  
  // Handle YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss or DD/MM/YYYY
  const cleanStr = dateStr.trim();
  const dateOnly = cleanStr.includes('T') ? cleanStr.split('T')[0] : cleanStr.split(' ')[0];
  const parts = dateOnly.split('-');
  
  if (parts.length === 3 && parts[0].length === 4) {
    const yyyy = parts[0];
    const mm = parts[1].padStart(2, '0');
    const dd = parts[2].padStart(2, '0');
    return `${dd}/${mm}/${yyyy}`;
  }

  // If already DD/MM/YYYY
  if (dateOnly.includes('/')) {
    const slashParts = dateOnly.split('/');
    if (slashParts.length === 3) {
      const dd = slashParts[0].padStart(2, '0');
      const mm = slashParts[1].padStart(2, '0');
      const yyyy = slashParts[2];
      return `${dd}/${mm}/${yyyy}`;
    }
  }

  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    }
  } catch (e) {
    // Ignore error
  }
  
  return dateStr;
}
