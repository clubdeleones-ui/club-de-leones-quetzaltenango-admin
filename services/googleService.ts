
import { gapi } from 'gapi-script';
import * as XLSX from 'xlsx';
import { env } from '../config/env';

const CLIENT_ID = env.googleClientId || import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
export const GOOGLE_CONFIG = {
    ESTATUTOS_DOC_ID: '1ynFhIRLt2R8JVHGmxVjm0-6Qfa9wCs-3pEzX6ZtMzOM',
};
const DISCOVERY_DOCS = [
    'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
    'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest',
    'https://www.googleapis.com/discovery/v1/apis/docs/v1/rest',
    'https://sheets.googleapis.com/$discovery/rest?version=v4'
];
const SCOPES = 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/calendar.events.readonly https://www.googleapis.com/auth/documents.readonly https://www.googleapis.com/auth/spreadsheets.readonly';

let initPromise: Promise<boolean> | null = null;
let currentAccessToken: string | null = null;

export const googleService = {
    initClient: (): Promise<boolean> => {
        if (!initPromise) {
            initPromise = new Promise((resolve, reject) => {
                gapi.load('client', () => {
                    const initConfig: any = {
                        discoveryDocs: DISCOVERY_DOCS,
                    };
                    if (CLIENT_ID) {
                        initConfig.clientId = CLIENT_ID;
                        initConfig.scope = SCOPES;
                    }
                    gapi.client.init(initConfig).then(() => {
                        if (currentAccessToken && (gapi as any)?.client?.setToken) {
                            (gapi as any).client.setToken({ access_token: currentAccessToken });
                        }
                        resolve(true);
                    }, (error: any) => {
                        initPromise = null; // reset if initialization failed
                        reject(error);
                    });
                });
            });
        }
        return initPromise;
    },

    setAccessToken: (token: string) => {
        currentAccessToken = token;
        try {
            if (typeof gapi !== 'undefined' && (gapi as any)?.client?.setToken) {
                (gapi as any).client.setToken({ access_token: token });
            }
        } catch (e) {
            // Silencioso: gapi.client aún no ha cargado, se usa fetch REST nativo con el token
        }
    },

    getAccessToken: (): string | null => {
        return currentAccessToken;
    },

    // DRIVE API: Fetch files from a specific folder (Actas)
    fetchActasFromDrive: async (folderId: string) => {
        try {
            if (currentAccessToken) {
                const query = `'${folderId}' in parents and trashed = false`;
                const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=${encodeURIComponent('files(id, name, createdTime, webViewLink, iconLink)')}`;
                const res = await fetch(url, {
                    headers: { Authorization: `Bearer ${currentAccessToken}`, Accept: 'application/json' }
                });
                if (res.ok) {
                    const data = await res.json();
                    return data.files || [];
                }
            }
            const response = await gapi.client.drive.files.list({
                q: `'${folderId}' in parents and trashed = false`,
                fields: 'files(id, name, createdTime, webViewLink, iconLink)',
            });
            return response.result.files;
        } catch (error) {
            console.error('Error fetching actas from Drive:', error);
            return [];
        }
    },

    // DOCS API: Fetch content from a specific Document (Estatutos)
    fetchDocContent: async (documentId: string) => {
        try {
            if (currentAccessToken) {
                const url = `https://docs.googleapis.com/v1/documents/${documentId}`;
                const res = await fetch(url, {
                    headers: { Authorization: `Bearer ${currentAccessToken}`, Accept: 'application/json' }
                });
                if (res.ok) {
                    const data = await res.json();
                    return googleService.parseDocContent(data.body?.content || []);
                }
            }
            const response = await gapi.client.docs.documents.get({
                documentId: documentId,
            });
            const content = response.result.body.content;
            return googleService.parseDocContent(content);
        } catch (error) {
            console.error('Error fetching Doc content:', error);
            return '';
        }
    },

    // CALENDAR API: Fetch events
    fetchCalendarEvents: async () => {
        try {
            if (currentAccessToken) {
                const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(new Date().toISOString())}&showDeleted=false&singleEvents=true&maxResults=10&orderBy=startTime`;
                const res = await fetch(url, {
                    headers: { Authorization: `Bearer ${currentAccessToken}`, Accept: 'application/json' }
                });
                if (res.ok) {
                    const data = await res.json();
                    return data.items || [];
                }
            }
            const response = await gapi.client.calendar.events.list({
                calendarId: 'primary',
                timeMin: (new Date()).toISOString(),
                showDeleted: false,
                singleEvents: true,
                maxResults: 10,
                orderBy: 'startTime',
            });
            return response.result.items;
        } catch (error) {
            console.error('Error fetching Calendar events:', error);
            return [];
        }
    },

    // Helper to parse Google Doc body content to plain text/markdown
    parseDocContent: (content: any[]) => {
        let text = '';
        content.forEach(element => {
            if (element.paragraph) {
                element.paragraph.elements.forEach((el: any) => {
                    if (el.textRun) {
                        text += el.textRun.content;
                    }
                });
            }
        });
        return text;
    },

    // Extraer Spreadsheet ID de una URL o cadena
    extractSpreadsheetId: (urlOrId: string): string => {
        const clean = urlOrId.trim();
        const match = clean.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
        if (match && match[1]) {
            return match[1];
        }
        return clean;
    },
    // Cache en memoria para archivos Excel descargados de Drive
    _excelCache: new Map<string, XLSX.WorkBook>(),

    isExcelFile: (fileNameOrMime: string = ''): boolean => {
        return /xlsx|xls|spreadsheetml|ms-excel/i.test(fileNameOrMime);
    },

    // Descargar y parsear archivo Excel (.xlsx / .xls) desde Google Drive
    fetchExcelFromDrive: async (fileId: string): Promise<XLSX.WorkBook> => {
        if (googleService._excelCache.has(fileId)) {
            return googleService._excelCache.get(fileId)!;
        }
        if (!currentAccessToken) {
            throw new Error('Se requiere sesión de Google para descargar el archivo de Drive.');
        }
        const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&supportsAllDrives=true`;
        const res = await fetch(url, {
            headers: {
                Authorization: `Bearer ${currentAccessToken}`,
            }
        });
        if (!res.ok) {
            throw new Error(`Error al descargar archivo de Drive (${res.status} ${res.statusText})`);
        }
        const arrayBuffer = await res.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        googleService._excelCache.set(fileId, workbook);
        return workbook;
    },

    // Parsear archivo Excel local (.xlsx/.xls/.csv) subido por el usuario desde su equipo
    parseLocalExcelFile: async (file: File): Promise<{ workbook: XLSX.WorkBook; sheetNames: string[] }> => {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        return { workbook, sheetNames: workbook.SheetNames };
    },

    // Leer registros de una hoja de cálculo desde un WorkBook en memoria (local o Drive)
    readWorkbookSheetData: (workbook: XLSX.WorkBook, sheetName: string): Record<string, string>[] => {
        const worksheet = workbook.Sheets[sheetName];
        if (!worksheet) return [];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        return rawJson.map(row => {
            const clean: Record<string, string> = {};
            Object.keys(row).forEach(k => {
                clean[String(k).trim()] = String(row[k] !== undefined && row[k] !== null ? row[k] : '').trim();
            });
            return clean;
        });
    },

    // DRIVE API: List Google Sheets files, Excel (.xlsx/.xls) & folders with recursive search
    fetchSpreadsheetsFromDrive: async (options?: { 
        searchTerm?: string; 
        folderId?: string;
        onlySheets?: boolean;
    }): Promise<Array<{ id: string; name: string; mimeType: string; modifiedTime?: string; iconLink?: string }>> => {
        try {
            const searchTerm = options?.searchTerm?.trim();
            const folderId = options?.folderId?.trim();
            const onlySheets = options?.onlySheets || false;

            // Filtro de tipos de hojas: Sheets nativas + Excel xlsx/xls + CSV
            const sheetMimes = "(mimeType = 'application/vnd.google-apps.spreadsheet' or mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' or mimeType = 'application/vnd.ms-excel' or mimeType = 'text/csv' or name contains '.xlsx' or name contains '.xls')";

            let queryParts: string[] = ['trashed = false'];

            if (onlySheets) {
                queryParts.push(sheetMimes);
            } else {
                queryParts.push(`(${sheetMimes} or mimeType = 'application/vnd.google-apps.folder')`);
            }

            if (searchTerm) {
                // Búsqueda recursiva por nombre en todo el Drive
                const escapedTerm = searchTerm.replace(/'/g, "\\'");
                queryParts.push(`name contains '${escapedTerm}'`);
            } else if (folderId) {
                // Explorar contenidos dentro de una carpeta específica
                queryParts.push(`'${folderId}' in parents`);
            }

            const query = queryParts.join(' and ');

            // 1. Vía REST directa con Access Token (soporta subcarpetas y Shared Drives)
            if (currentAccessToken) {
                const params = new URLSearchParams({
                    q: query,
                    fields: 'files(id, name, mimeType, modifiedTime, iconLink)',
                    orderBy: 'folder,modifiedTime desc',
                    pageSize: '100',
                    supportsAllDrives: 'true',
                    includeItemsFromAllDrives: 'true'
                });

                const url = `https://www.googleapis.com/drive/v3/files?${params.toString()}`;
                const res = await fetch(url, {
                    headers: {
                        Authorization: `Bearer ${currentAccessToken}`,
                        Accept: 'application/json'
                    }
                });

                if (res.ok) {
                    const data = await res.json();
                    return data.files || [];
                }
            }

            // 2. Fallback con GAPI
            await googleService.initClient();
            const client = (gapi as any).client;
            if (client && client.drive) {
                const response = await client.drive.files.list({
                    q: query,
                    fields: 'files(id, name, mimeType, modifiedTime, iconLink)',
                    orderBy: 'folder,modifiedTime desc',
                    pageSize: 50,
                    supportsAllDrives: true,
                    includeItemsFromAllDrives: true
                });
                return response.result.files || [];
            }
            return [];
        } catch (error: any) {
            console.error('Error fetching spreadsheets/folders from Drive:', error);
            throw error;
        }
    },

    // SHEETS / EXCEL API: Get list of tab titles inside a spreadsheet or Excel file
    fetchSpreadsheetTabs: async (spreadsheetIdOrUrl: string, fileNameOrMime?: string): Promise<string[]> => {
        const spreadsheetId = googleService.extractSpreadsheetId(spreadsheetIdOrUrl);
        const isExcel = googleService.isExcelFile(fileNameOrMime || '') || spreadsheetIdOrUrl.endsWith('.xlsx') || spreadsheetIdOrUrl.endsWith('.xls');

        // 1. Si es un archivo Excel de Drive (.xlsx / .xls), descargarlo y leerlo con SheetJS
        if (isExcel && currentAccessToken) {
            try {
                const workbook = await googleService.fetchExcelFromDrive(spreadsheetId);
                if (workbook.SheetNames && workbook.SheetNames.length > 0) {
                    return workbook.SheetNames;
                }
            } catch (excelErr) {
                console.warn('Error reading Excel from Drive with SheetJS, trying Sheets API:', excelErr);
            }
        }

        try {
            // 2. Probar vía REST directa con Google Sheets API v4
            if (currentAccessToken) {
                const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties(sheetId,title,index)`;
                const res = await fetch(url, {
                    headers: {
                        Authorization: `Bearer ${currentAccessToken}`,
                        Accept: 'application/json'
                    }
                });
                if (res.ok) {
                    const data = await res.json();
                    const sheets = data.sheets || [];
                    const titles = sheets.map((s: any) => s.properties?.title as string).filter(Boolean);
                    if (titles.length > 0) return titles;
                } else if (res.status === 400 || res.status === 404) {
                    // Si Sheets API falla porque el archivo en Drive es un binario .xlsx sin convertir
                    try {
                        const workbook = await googleService.fetchExcelFromDrive(spreadsheetId);
                        if (workbook.SheetNames && workbook.SheetNames.length > 0) {
                            return workbook.SheetNames;
                        }
                    } catch (e) {
                        console.warn('Fallback Excel download failed:', e);
                    }
                }
            }

            // 3. Probar vía GAPI
            try {
                await googleService.initClient();
                const client = (gapi as any).client;
                if (client && client.sheets) {
                    const response = await client.sheets.spreadsheets.get({
                        spreadsheetId,
                        fields: 'sheets.properties(sheetId,title,index)'
                    });
                    const sheets = response.result.sheets || [];
                    const titles = sheets.map((s: any) => s.properties?.title as string).filter(Boolean);
                    if (titles.length > 0) return titles;
                }
            } catch (gapiErr) {
                console.warn('GAPI tabs fetch failed, checking public sheet:', gapiErr);
            }

            // 4. Fallback para hojas públicas compartidas
            return ['Hoja 1'];
        } catch (error: any) {
            console.error('Error fetching sheet tabs:', error);
            throw error;
        }
    },

    // SHEETS / EXCEL API: Fetch data from a specific sheet using REST/OAuth with fallback
    fetchSheetData: async (spreadsheetIdOrUrl: string, range: string = 'A1:Z500', fileNameOrMime?: string): Promise<Record<string, string>[]> => {
        const spreadsheetId = googleService.extractSpreadsheetId(spreadsheetIdOrUrl);
        const matchSheet = range.match(/^'([^']+)'/);
        const sheetName = matchSheet ? matchSheet[1] : (range.split('!')[0] || 'Hoja 1');
        const isExcel = googleService.isExcelFile(fileNameOrMime || '') || googleService._excelCache.has(spreadsheetId);

        // 1. Si es Excel (.xlsx/.xls) o está en caché de SheetJS, leer directamente de la pestaña
        if (isExcel) {
            try {
                const workbook = await googleService.fetchExcelFromDrive(spreadsheetId);
                const records = googleService.readWorkbookSheetData(workbook, sheetName);
                if (records.length > 0) return records;
            } catch (excelErr) {
                console.warn('Error reading sheet from Excel workbook, trying Sheets API:', excelErr);
            }
        }
        
        // 2. Probar vía REST directa con Access Token (Google Sheets API v4)
        if (currentAccessToken) {
            try {
                const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;
                const res = await fetch(url, {
                    headers: {
                        Authorization: `Bearer ${currentAccessToken}`,
                        Accept: 'application/json'
                    }
                });
                if (res.ok) {
                    const data = await res.json();
                    const values: string[][] = data.values || [];
                    if (values.length > 0) {
                        const [rawHeaders, ...rows] = values;
                        const headers = rawHeaders.map((h, i) => String(h || `Columna_${i + 1}`).trim());
                        return rows.map(row => {
                            const item: Record<string, string> = {};
                            headers.forEach((header, index) => {
                                item[header] = String(row[index] || '').trim();
                            });
                            return item;
                        });
                    }
                } else if (res.status === 400 || res.status === 404) {
                    // Fallback a descarga Excel si no era formato nativo de Sheets
                    try {
                        const workbook = await googleService.fetchExcelFromDrive(spreadsheetId);
                        const records = googleService.readWorkbookSheetData(workbook, sheetName);
                        if (records.length > 0) return records;
                    } catch (e) {
                        console.warn('Fallback Excel sheet read failed:', e);
                    }
                }
            } catch (restErr) {
                console.warn('REST fetchSheetData failed, falling back:', restErr);
            }
        }

        // 3. Probar vía GAPI
        try {
            await googleService.initClient();
            const client = (gapi as any).client;
            if (client && client.sheets) {
                const response = await client.sheets.spreadsheets.values.get({
                    spreadsheetId,
                    range,
                });
                const values: string[][] = response.result.values || [];
                if (values.length > 0) {
                    const [rawHeaders, ...rows] = values;
                    const headers = rawHeaders.map((h, i) => String(h || `Columna_${i + 1}`).trim());
                    return rows.map(row => {
                        const item: Record<string, string> = {};
                        headers.forEach((header, index) => {
                            item[header] = String(row[index] || '').trim();
                        });
                        return item;
                    });
                }
            }
        } catch (gapiErr) {
            console.warn('GAPI fetchSheetData failed, trying CSV public fallback:', gapiErr);
        }

        // 4. Fallback a lectura pública CSV
        return googleService.fetchSheetDataPublic(spreadsheetId, sheetName);
    },

    // Leer hoja de Google Sheets pública o compartida vía exportación CSV (No requiere OAuth)
    fetchSheetDataPublic: async (spreadsheetIdOrUrl: string, sheetName?: string): Promise<Record<string, string>[]> => {
        try {
            const spreadsheetId = googleService.extractSpreadsheetId(spreadsheetIdOrUrl);
            let url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv`;
            if (sheetName) {
                url += `&sheet=${encodeURIComponent(sheetName)}`;
            }

            const res = await fetch(url);
            if (!res.ok) {
                throw new Error(`No se pudo leer la hoja de cálculo (${res.status} ${res.statusText}). Asegúrese de que la hoja tenga acceso de lectura ("Cualquiera con el enlace puede ver").`);
            }
            const csvText = await res.text();
            return googleService.parseCsvToObjects(csvText);
        } catch (error: any) {
            console.error('Error fetching public sheet CSV:', error);
            throw error;
        }
    },

    // Parseador robusto de CSV a objetos
    parseCsvToObjects: (csvText: string): Record<string, string>[] => {
        const lines: string[] = [];
        let currentLine = '';
        let insideQuotes = false;

        for (let i = 0; i < csvText.length; i++) {
            const char = csvText[i];
            if (char === '"') {
                insideQuotes = !insideQuotes;
                currentLine += char;
            } else if ((char === '\n' || char === '\r') && !insideQuotes) {
                if (currentLine.trim()) {
                    lines.push(currentLine.trim());
                }
                currentLine = '';
            } else {
                currentLine += char;
            }
        }
        if (currentLine.trim()) {
            lines.push(currentLine.trim());
        }

        if (lines.length === 0) return [];

        const parseLine = (line: string): string[] => {
            const values: string[] = [];
            let current = '';
            let inQuotes = false;
            for (let i = 0; i < line.length; i++) {
                const c = line[i];
                if (c === '"') {
                    if (inQuotes && line[i + 1] === '"') {
                        current += '"';
                        i++;
                    } else {
                        inQuotes = !inQuotes;
                    }
                } else if (c === ',' && !inQuotes) {
                    values.push(current.trim());
                    current = '';
                } else {
                    current += c;
                }
            }
            values.push(current.trim());
            return values.map(v => v.replace(/^"|"$/g, '').trim());
        };

        const headers = parseLine(lines[0]);
        const records: Record<string, string>[] = [];

        for (let i = 1; i < lines.length; i++) {
            const values = parseLine(lines[i]);
            // Ignorar filas completamente vacías
            if (values.every(v => !v)) continue;
            const item: Record<string, string> = {};
            headers.forEach((h, index) => {
                if (h) {
                    item[h] = values[index] || '';
                }
            });
            records.push(item);
        }

        return records;
    }
};
