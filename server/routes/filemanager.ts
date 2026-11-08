import { Router, Request, Response } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { db, HOSTING_STORAGE_DIR, UPLOADS_DIR } from '../db.js';

export const fileManagerRouter = Router();

const upload = multer({ dest: UPLOADS_DIR, limits: { fileSize: 25 * 1024 * 1024 } });

// Helper to resolve and ensure customer cannot escape their hosting root
function getSafePath(customerId: string, hostingId: string, requestedSubpath: string = ''): { rootDir: string; targetPath: string } {
  const rootDir = path.resolve(HOSTING_STORAGE_DIR, customerId, hostingId, 'public_html');
  if (!fs.existsSync(rootDir)) {
    fs.mkdirSync(rootDir, { recursive: true });
  }

  // Sanitize requested subpath
  const cleanSub = requestedSubpath.replace(/^\/+/, '').replace(/\.\./g, '');
  const targetPath = path.resolve(rootDir, cleanSub);

  // Security check: Must start with rootDir
  if (!targetPath.startsWith(rootDir)) {
    throw new Error('Access denied: Illegal path traversal detected');
  }

  return { rootDir, targetPath };
}

// GET /api/filemanager/:hostingId/list?path=...
fileManagerRouter.get('/:hostingId/list', (req: Request, res: Response) => {
  try {
    const hostingId = req.params.hostingId;
    const account = db.getHosting().find((h) => h.id === hostingId);
    if (!account) return res.status(404).json({ error: 'Hosting account not found' });

    const reqPath = (req.query.path as string) || '';
    const { rootDir, targetPath } = getSafePath(account.customerId, account.id, reqPath);

    if (!fs.existsSync(targetPath)) {
      return res.status(404).json({ error: 'Requested folder does not exist' });
    }

    const stat = fs.statSync(targetPath);
    if (!stat.isDirectory()) {
      return res.status(400).json({ error: 'Path is not a directory' });
    }

    const items = fs.readdirSync(targetPath, { withFileTypes: true }).map((ent) => {
      const full = path.join(targetPath, ent.name);
      const s = fs.statSync(full);
      return {
        name: ent.name,
        isDirectory: ent.isDirectory(),
        size: ent.isDirectory() ? 0 : s.size,
        updatedAt: s.mtime.toISOString(),
        extension: ent.isDirectory() ? '' : path.extname(ent.name).toLowerCase(),
      };
    });

    // Calculate total directory disk usage
    let totalBytes = 0;
    const calcDirSize = (d: string) => {
      const entries = fs.readdirSync(d, { withFileTypes: true });
      for (const ent of entries) {
        const p = path.join(d, ent.name);
        if (ent.isDirectory()) {
          calcDirSize(p);
        } else {
          totalBytes += fs.statSync(p).size;
        }
      }
    };
    calcDirSize(rootDir);

    // Current relative path from root
    const relPath = path.relative(rootDir, targetPath).replace(/\\/g, '/');

    return res.json({
      currentPath: relPath ? `/${relPath}` : '/',
      items,
      totalBytes,
      totalMB: Number((totalBytes / (1024 * 1024)).toFixed(2)),
      storageLimitMB: account.storageTotalMB,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/filemanager/:hostingId/read?path=...
fileManagerRouter.get('/:hostingId/read', (req: Request, res: Response) => {
  try {
    const hostingId = req.params.hostingId;
    const account = db.getHosting().find((h) => h.id === hostingId);
    if (!account) return res.status(404).json({ error: 'Hosting account not found' });

    const reqPath = (req.query.path as string) || '';
    if (!reqPath) return res.status(400).json({ error: 'File path required' });

    const { targetPath } = getSafePath(account.customerId, account.id, reqPath);
    if (!fs.existsSync(targetPath)) return res.status(404).json({ error: 'File not found' });

    const stat = fs.statSync(targetPath);
    if (stat.isDirectory()) return res.status(400).json({ error: 'Cannot read directory as text' });

    // Limit readable text file size to 2MB
    if (stat.size > 2 * 1024 * 1024) {
      return res.status(400).json({ error: 'File is too large to view in online editor (limit 2MB).' });
    }

    const content = fs.readFileSync(targetPath, 'utf-8');
    return res.json({
      fileName: path.basename(targetPath),
      path: reqPath,
      content,
      size: stat.size,
      updatedAt: stat.mtime.toISOString(),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/filemanager/:hostingId/write
fileManagerRouter.post('/:hostingId/write', (req: Request, res: Response) => {
  try {
    const hostingId = req.params.hostingId;
    const { path: reqPath, content } = req.body;
    if (!reqPath || content === undefined) {
      return res.status(400).json({ error: 'Path and content are required' });
    }

    const account = db.getHosting().find((h) => h.id === hostingId);
    if (!account) return res.status(404).json({ error: 'Hosting account not found' });

    const { targetPath } = getSafePath(account.customerId, account.id, reqPath);
    // Ensure parent directory exists
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, content, 'utf-8');

    return res.json({ message: 'File saved successfully', path: reqPath });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/filemanager/:hostingId/mkdir
fileManagerRouter.post('/:hostingId/mkdir', (req: Request, res: Response) => {
  try {
    const hostingId = req.params.hostingId;
    const { folderName, currentPath } = req.body;
    if (!folderName) return res.status(400).json({ error: 'Folder name is required' });

    const account = db.getHosting().find((h) => h.id === hostingId);
    if (!account) return res.status(404).json({ error: 'Hosting account not found' });

    const cleanFolder = folderName.replace(/[^a-zA-Z0-9._-]/g, '');
    const fullTarget = path.join(currentPath || '', cleanFolder);
    const { targetPath } = getSafePath(account.customerId, account.id, fullTarget);

    if (fs.existsSync(targetPath)) {
      return res.status(409).json({ error: 'A file or folder with this name already exists' });
    }

    fs.mkdirSync(targetPath, { recursive: true });
    return res.status(201).json({ message: 'Folder created successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/filemanager/:hostingId/upload
fileManagerRouter.post('/:hostingId/upload', upload.single('file'), (req: Request, res: Response) => {
  const tempPath = req.file?.path;
  try {
    const hostingId = req.params.hostingId;
    const targetDirSubpath = (req.body.currentPath as string) || '';

    const account = db.getHosting().find((h) => h.id === hostingId);
    if (!account) {
      if (tempPath && fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      return res.status(404).json({ error: 'Hosting account not found' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file received' });
    }

    const { targetPath: dirPath } = getSafePath(account.customerId, account.id, targetDirSubpath);
    const destFilePath = path.join(dirPath, req.file.originalname);

    fs.renameSync(req.file.path, destFilePath);
    return res.status(201).json({ message: 'File uploaded successfully', fileName: req.file.originalname });
  } catch (err: any) {
    if (tempPath && fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/filemanager/:hostingId/rename
fileManagerRouter.post('/:hostingId/rename', (req: Request, res: Response) => {
  try {
    const hostingId = req.params.hostingId;
    const { oldPath, newName } = req.body;
    if (!oldPath || !newName) return res.status(400).json({ error: 'Old path and new name are required' });

    const account = db.getHosting().find((h) => h.id === hostingId);
    if (!account) return res.status(404).json({ error: 'Hosting account not found' });

    const { targetPath: srcPath } = getSafePath(account.customerId, account.id, oldPath);
    if (!fs.existsSync(srcPath)) return res.status(404).json({ error: 'Source file not found' });

    const cleanNewName = newName.replace(/[^a-zA-Z0-9._-]/g, '');
    const destPath = path.join(path.dirname(srcPath), cleanNewName);

    fs.renameSync(srcPath, destPath);
    return res.json({ message: 'Renamed successfully', newName: cleanNewName });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// DELETE /api/filemanager/:hostingId/delete
fileManagerRouter.delete('/:hostingId/delete', (req: Request, res: Response) => {
  try {
    const hostingId = req.params.hostingId;
    const reqPath = req.query.path as string;
    if (!reqPath) return res.status(400).json({ error: 'Path is required' });

    const account = db.getHosting().find((h) => h.id === hostingId);
    if (!account) return res.status(404).json({ error: 'Hosting account not found' });

    const { rootDir, targetPath } = getSafePath(account.customerId, account.id, reqPath);
    // Never allow deleting rootDir itself
    if (targetPath === rootDir) {
      return res.status(403).json({ error: 'Cannot delete document root folder' });
    }

    if (!fs.existsSync(targetPath)) return res.status(404).json({ error: 'Item not found' });

    fs.rmSync(targetPath, { recursive: true, force: true });
    return res.json({ message: 'Deleted successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/filemanager/:hostingId/download?path=...
fileManagerRouter.get('/:hostingId/download', (req: Request, res: Response) => {
  try {
    const hostingId = req.params.hostingId;
    const reqPath = req.query.path as string;
    if (!reqPath) return res.status(400).json({ error: 'Path is required' });

    const account = db.getHosting().find((h) => h.id === hostingId);
    if (!account) return res.status(404).json({ error: 'Hosting account not found' });

    const { targetPath } = getSafePath(account.customerId, account.id, reqPath);
    if (!fs.existsSync(targetPath)) return res.status(404).json({ error: 'File not found' });

    return res.download(targetPath);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});
