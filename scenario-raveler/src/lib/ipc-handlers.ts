import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export const ipcHandlers = {
    'read-file-text': async (filePath: string) => {
        return fs.readFileSync(filePath, 'utf-8');
    },
    'write-temp-file': async (content: string, filename: string) => {
        const tempDir = os.tmpdir();
        const tempFile = path.join(tempDir, filename);
        fs.writeFileSync(tempFile, content, 'utf-8');
        return tempFile;
    },
    'delete-file': async (filePath: string) => {
        try {
            fs.unlinkSync(filePath);
            return true;
        } catch (e) {
            console.warn('Failed to delete file:', e);
            return false;
        }
    }
};
