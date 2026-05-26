
import { gapi } from 'gapi-script';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
export const GOOGLE_CONFIG = {
    ESTATUTOS_DOC_ID: '1ynFhIRLt2R8JVHGmxVjm0-6Qfa9wCs-3pEzX6ZtMzOM',
};
const DISCOVERY_DOCS = [
    'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
    'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest',
    'https://www.googleapis.com/discovery/v1/apis/docs/v1/rest'
];
const SCOPES = 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/calendar.events.readonly https://www.googleapis.com/auth/documents.readonly';

let initPromise: Promise<boolean> | null = null;

export const googleService = {
    initClient: (): Promise<boolean> => {
        if (!initPromise) {
            initPromise = new Promise((resolve, reject) => {
                gapi.load('client', () => {
                    gapi.client.init({
                        discoveryDocs: DISCOVERY_DOCS,
                    }).then(() => {
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
        gapi.client.setToken({ access_token: token });
    },

    // DRIVE API: Fetch files from a specific folder (Actas)
    fetchActasFromDrive: async (folderId: string) => {
        try {
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
    }
};
