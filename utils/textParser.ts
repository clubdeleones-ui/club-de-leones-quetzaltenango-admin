
export interface StatuteSection {
    id: string;
    type: 'title' | 'article' | 'paragraph';
    level: number;
    text: string;
    subText?: string;
}

export const parseStatutes = (rawText: string): StatuteSection[] => {
    const lines = rawText.split('\n');
    const sections: StatuteSection[] = [];

    lines.forEach((line, index) => {
        const trimmed = line.trim();
        if (!trimmed) return;

        // Match Titles (e.g. # TITLE or TITULO I)
        if (trimmed.startsWith('#') || /^(TITULO|TÍTULO)\s+[IVXLCDM]+/i.test(trimmed)) {
            sections.push({
                id: `title-${index}`,
                type: 'title',
                level: trimmed.startsWith('##') ? 2 : 1,
                text: trimmed.replace(/^#+\s*/, '').toUpperCase()
            });
        }
        // Match Articles (e.g. ## ARTICULO I or ARTICULO 1)
        else if (/^(ARTICULO|ARTÍCULO)\s+[IVXLCDM0-9]+/i.test(trimmed)) {
            const parts = trimmed.split(':');
            sections.push({
                id: `art-${index}`,
                type: 'article',
                level: 3,
                text: parts[0].trim(),
                subText: parts[1] ? parts[1].trim() : undefined
            });
        }
        // Paragraphs
        else {
            sections.push({
                id: `p-${index}`,
                type: 'paragraph',
                level: 4,
                text: trimmed
            });
        }
    });

    return sections;
};

const removeAccents = (str: string): string => {
    return str
        .toLowerCase()
        .replace(/[áäàâ]/g, 'a')
        .replace(/[éëèê]/g, 'e')
        .replace(/[íïìî]/g, 'i')
        .replace(/[óöòô]/g, 'o')
        .replace(/[úüùû]/g, 'u');
};

export const searchKeywords = (sections: StatuteSection[], query: string): StatuteSection[] => {
    if (!query.trim()) return [];
    const cleanQuery = removeAccents(query);
    return sections.filter(s =>
        removeAccents(s.text).includes(cleanQuery) ||
        (s.subText && removeAccents(s.subText).includes(cleanQuery))
    );
};
