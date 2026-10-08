
import { gapi } from 'gapi-script';
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

    // DRIVE API: List Google Sheets files from user's Google Drive
    fetchSpreadsheetsFromDrive: async (): Promise<Array<{ id: string; name: string; modifiedTime?: string; iconLink?: string }>> => {
        try {
            // 1. Vía REST directa con Access Token (ultra rápido, sin gapi)
            if (currentAccessToken) {
                const query = "mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false";
                const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=${encodeURIComponent('files(id, name, modifiedTime, iconLink)')}&orderBy=modifiedTime desc&pageSize=50`;
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
                    q: "mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false",
                    fields: 'files(id, name, modifiedTime, iconLink)',
                    orderBy: 'modifiedTime desc',
                    pageSize: 30
                });
                return response.result.files || [];
            }
            return [];
        } catch (error: any) {
            console.error('Error fetching spreadsheets from Drive:', error);
            throw error;
        }
    },

    // SHEETS API: Get list of tab titles inside a spreadsheet
    fetchSpreadsheetTabs: async (spreadsheetIdOrUrl: string): Promise<string[]> => {
        const spreadsheetId = googleService.extractSpreadsheetId(spreadsheetIdOrUrl);
        try {
            // 1. Probar vía REST directa con Access Token
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
                }
            }

            // 2. Probar vía GAPI
            try {
                await googleService.initClient();
                const client = (gapi as any).client;
                if (client && client.sheets) {
                    const response = await client.sheets.spreadsheets.get({
                        spreadsheetId,
                        fields: 'sheets.properties(sheetId,title,index)'
                    });
                    const sheets = response.result.sheets || [];
                    const titles = sheets.map((s: any) => s.properties.title as string).filter(Boolean);
                    if (titles.length > 0) return titles;
                }
            } catch (gapiErr) {
                console.warn('GAPI tabs fetch failed, checking public sheet:', gapiErr);
            }

            // 3. Fallback para hojas públicas compartidas
            return ['Hoja 1'];
        } catch (error: any) {
            console.error('Error fetching sheet tabs:', error);
            throw error;
        }
    },

    // SHEETS API: Fetch data from a specific sheet using REST/OAuth with fallback
    fetchSheetData: async (spreadsheetIdOrUrl: string, range: string = 'A1:Z500'): Promise<Record<string, string>[]> => {
        const spreadsheetId = googleService.extractSpreadsheetId(spreadsheetIdOrUrl);
        
        // 1. Probar vía REST directa con Access Token
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
                }
            } catch (restErr) {
                console.warn('REST fetchSheetData failed, falling back:', restErr);
            }
        }

        // 2. Probar vía GAPI
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

        // 3. Fallback a lectura pública CSV
        const matchSheet = range.match(/^'([^']+)'/);
        const sheetName = matchSheet ? matchSheet[1] : undefined;
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
