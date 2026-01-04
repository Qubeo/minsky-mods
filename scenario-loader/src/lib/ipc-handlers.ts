import * as fs from 'fs';

export const ipcHandlers = {
    'read-file-text': async (filePath: string) => {
        return fs.readFileSync(filePath, 'utf-8');
    }
};
