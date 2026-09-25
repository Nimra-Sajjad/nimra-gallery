import express from 'express';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import {
  loadStore,
  saveStore,
  verifyPassword,
  hashPassword,
  createSessionToken,
  verifySessionToken,
} from './store.js';
import type { DesignItem, VideoItem, PortfolioInfo, ContactMessage } from '../src/types';

const UPLOADS_BUCKET = process.env.SUPABASE_UPLOADS_BUCKET || 'uploads';

function getStorageClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set for file uploads.');
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

// Builds and returns a fully configured Express app (no app.listen here —
// that's left to whichever entry point uses it: server.ts for traditional
// hosting, or api/[...all].ts for Vercel serverless).
export async function createApp() {
  const app = express();

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Files are uploaded straight to Supabase Storage now (no local disk),
  // so we keep everything in memory just long enough to forward it.
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
    fileFilter: (_req, file, cb) => {
      const allowedImageMimes = [
        'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'image/avif',
      ];
      const allowedVideoMimes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
      if (allowedImageMimes.includes(file.mimetype) || allowedVideoMimes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error(`Unsupported file format: ${file.mimetype}`));
      }
    },
  });

  function requireAdminAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
      return;
    }
    const token = authHeader.slice(7).trim();
    const verified = verifySessionToken(token);
    if (!verified) {
      res.status(401).json({ error: 'Unauthorized: Session expired or invalid' });
      return;
    }
    (req as any).adminUser = verified;
    next();
  }

  /* ---------------- PUBLIC API ROUTES ---------------- */

  app.get('/api/portfolio', async (_req, res) => {
    try {
      const store = await loadStore();
      const publishedDesigns = store.designs.filter((d) => d.isPublished).sort((a, b) => a.order - b.order);
      const publishedVideos = store.videos.filter((v) => v.isPublished).sort((a, b) => a.order - b.order);
      res.json({ info: store.info, designs: publishedDesigns, videos: publishedVideos });
    } catch (err) {
      console.error('Failed to get public portfolio:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/contact', async (req, res) => {
    try {
      const { name, email, message } = req.body;
      if (!name || !email || !message) {
        res.status(400).json({ error: 'All fields (name, email, message) are required.' });
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.status(400).json({ error: 'Invalid email address.' });
        return;
      }

      const store = await loadStore();
      const newMessage: ContactMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: String(name).trim().substring(0, 100),
        email: String(email).trim().toLowerCase().substring(0, 150),
        message: String(message).trim().substring(0, 2500),
        createdAt: new Date().toISOString(),
        read: false,
      };

      store.messages.unshift(newMessage);
      await saveStore(store);

      res.json({ success: true, message: 'Message sent successfully.' });
    } catch (err) {
      console.error('Contact submission error:', err);
      res.status(500).json({ error: 'Failed to send message.' });
    }
  });

  /* ---------------- AUTH ROUTES ---------------- */

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required.' });
        return;
      }

      const store = await loadStore();
      const admin = store.admin;

      const normalizedInputEmail = String(email).trim().toLowerCase();
      const matchesEmail =
        normalizedInputEmail === admin.email.toLowerCase() ||
        normalizedInputEmail === 'admin' ||
        normalizedInputEmail === 'admin@nimragallery.com';

      if (!matchesEmail) {
        res.status(401).json({ error: 'Invalid credentials.' });
        return;
      }

      const isValid = verifyPassword(password, admin.passwordHash, admin.salt);
      if (!isValid) {
        res.status(401).json({ error: 'Invalid credentials.' });
        return;
      }

      const token = createSessionToken(admin.id, admin.email);
      res.json({
        success: true,
        token,
        user: { id: admin.id, email: admin.email, name: admin.name },
      });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Authentication failed.' });
    }
  });

  app.get('/api/auth/me', requireAdminAuth, async (_req, res) => {
    try {
      const store = await loadStore();
      res.json({ user: { id: store.admin.id, email: store.admin.email, name: store.admin.name } });
    } catch (err) {
      res.status(500).json({ error: 'Failed to load user.' });
    }
  });

  app.post('/api/auth/logout', (_req, res) => {
    res.json({ success: true });
  });

  /* ---------------- PROTECTED ADMIN ROUTES ---------------- */

  app.get('/api/admin/data', requireAdminAuth, async (_req, res) => {
    try {
      const store = await loadStore();
      res.json({
        info: store.info,
        designs: [...store.designs].sort((a, b) => a.order - b.order),
        videos: [...store.videos].sort((a, b) => a.order - b.order),
        messages: store.messages,
        admin: { email: store.admin.email, name: store.admin.name },
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch admin data.' });
    }
  });

  app.put('/api/admin/info', requireAdminAuth, async (req, res) => {
    try {
      const infoUpdate = req.body as Partial<PortfolioInfo>;
      const store = await loadStore();
      store.info = { ...store.info, ...infoUpdate };
      await saveStore(store);
      res.json({ success: true, info: store.info });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update info.' });
    }
  });

  app.put('/api/admin/credentials', requireAdminAuth, async (req, res) => {
    try {
      const { currentPassword, newEmail, newPassword, newName } = req.body;
      const store = await loadStore();

      if (!currentPassword) {
        res.status(400).json({ error: 'Current password is required to change credentials.' });
        return;
      }

      const isValid = verifyPassword(currentPassword, store.admin.passwordHash, store.admin.salt);
      if (!isValid) {
        res.status(401).json({ error: 'Incorrect current password.' });
        return;
      }

      if (newName) store.admin.name = String(newName).trim();
      if (newEmail) store.admin.email = String(newEmail).trim().toLowerCase();
      if (newPassword && newPassword.length >= 6) {
        const { hash, salt } = hashPassword(newPassword);
        store.admin.passwordHash = hash;
        store.admin.salt = salt;
      }

      await saveStore(store);
      const newToken = createSessionToken(store.admin.id, store.admin.email);
      res.json({
        success: true,
        token: newToken,
        user: { id: store.admin.id, email: store.admin.email, name: store.admin.name },
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update credentials.' });
    }
  });

  // Upload one or multiple files — now goes straight to Supabase Storage
  app.post('/api/admin/upload', requireAdminAuth, upload.array('files', 20), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        res.status(400).json({ error: 'No files were uploaded.' });
        return;
      }

      const supabase = getStorageClient();
      const uploadedFiles = [];

      for (const file of files) {
        const ext = (file.originalname.split('.').pop() || 'bin').toLowerCase();
        const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_').substring(0, 40);
        const uniquePath = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeName}`;

        const { error: uploadError } = await supabase.storage
          .from(UPLOADS_BUCKET)
          .upload(uniquePath, file.buffer, { contentType: file.mimetype, upsert: false });

        if (uploadError) {
          console.error('Supabase upload error:', uploadError);
          continue;
        }

        const { data: publicUrlData } = supabase.storage.from(UPLOADS_BUCKET).getPublicUrl(uniquePath);

        uploadedFiles.push({
          url: publicUrlData.publicUrl,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
        });
      }

      if (uploadedFiles.length === 0) {
        res.status(500).json({ error: 'All uploads failed. Check that the Supabase bucket exists and is public.' });
        return;
      }

      res.json({ success: true, files: uploadedFiles, file: uploadedFiles[0] });
    } catch (err: any) {
      console.error('File upload error:', err);
      res.status(500).json({ error: err.message || 'File upload failed.' });
    }
  });

  // Designs: Create
  app.post('/api/admin/designs', requireAdminAuth, async (req, res) => {
    try {
      const { title, images, isPublished, aspectRatio } = req.body;
      if (!images || !Array.isArray(images) || images.length === 0) {
        res.status(400).json({ error: 'At least one image is required.' });
        return;
      }

      const store = await loadStore();
      const nextOrder = store.designs.length > 0 ? Math.min(...store.designs.map((d) => d.order)) - 1 : 1;

      const newDesign: DesignItem = {
        id: `design_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        title: title ? String(title).trim() : undefined,
        images: images.map((img: any, idx: number) => ({
          id: img.id || `img_${Date.now()}_${idx}`,
          url: img.url,
          alt: img.alt || '',
          caption: img.caption || '',
        })),
        isPublished: isPublished !== false,
        order: nextOrder,
        aspectRatio: aspectRatio || 'portrait',
        createdAt: new Date().toISOString(),
      };

      store.designs.unshift(newDesign);
      store.designs.forEach((item, index) => { item.order = index + 1; });
      await saveStore(store);

      res.status(201).json({ success: true, design: newDesign });
    } catch (err) {
      console.error('Create design error:', err);
      res.status(500).json({ error: 'Failed to create design.' });
    }
  });

  // Designs: Update
  app.put('/api/admin/designs/:id', requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const store = await loadStore();
      const index = store.designs.findIndex((d) => d.id === id);
      if (index === -1) {
        res.status(404).json({ error: 'Design post not found.' });
        return;
      }

      const existing = store.designs[index];
      const { title, images, isPublished, order, aspectRatio } = req.body;

      if (images && (!Array.isArray(images) || images.length === 0)) {
        res.status(400).json({ error: 'Post must have at least one image.' });
        return;
      }

      store.designs[index] = {
        ...existing,
        title: title !== undefined ? title : existing.title,
        images: images ? images : existing.images,
        isPublished: isPublished !== undefined ? isPublished : existing.isPublished,
        order: order !== undefined ? Number(order) : existing.order,
        aspectRatio: aspectRatio || existing.aspectRatio,
      };

      await saveStore(store);
      res.json({ success: true, design: store.designs[index] });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update design.' });
    }
  });

  // Designs: Reorder
  app.put('/api/admin/designs-reorder', requireAdminAuth, async (req, res) => {
    try {
      const { orderedIds } = req.body as { orderedIds: string[] };
      if (!Array.isArray(orderedIds)) {
        res.status(400).json({ error: 'orderedIds array is required.' });
        return;
      }

      const store = await loadStore();
      const designMap = new Map(store.designs.map((d) => [d.id, d]));

      const reordered: DesignItem[] = [];
      orderedIds.forEach((id, idx) => {
        const item = designMap.get(id);
        if (item) {
          item.order = idx + 1;
          reordered.push(item);
          designMap.delete(id);
        }
      });

      designMap.forEach((item) => {
        item.order = reordered.length + 1;
        reordered.push(item);
      });

      store.designs = reordered;
      await saveStore(store);

      res.json({ success: true, designs: store.designs });
    } catch (err) {
      res.status(500).json({ error: 'Failed to reorder designs.' });
    }
  });

  // Designs: Delete
  app.delete('/api/admin/designs/:id', requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const store = await loadStore();
      const initialCount = store.designs.length;
      store.designs = store.designs.filter((d) => d.id !== id);

      if (store.designs.length === initialCount) {
        res.status(404).json({ error: 'Design not found.' });
        return;
      }

      store.designs.forEach((d, idx) => { d.order = idx + 1; });
      await saveStore(store);

      res.json({ success: true, message: 'Design deleted successfully.' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete design.' });
    }
  });

  // Videos: Create
  app.post('/api/admin/videos', requireAdminAuth, async (req, res) => {
    try {
      const { title, videoUrl, thumbnailUrl, alt, isPublished, aspectRatio } = req.body;
      if (!videoUrl) {
        res.status(400).json({ error: 'Video URL or uploaded file is required.' });
        return;
      }

      const store = await loadStore();
      const newVideo: VideoItem = {
        id: `video_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        title: title ? String(title).trim() : undefined,
        videoUrl: String(videoUrl).trim(),
        thumbnailUrl: thumbnailUrl ? String(thumbnailUrl).trim() : '',
        alt: alt ? String(alt).trim() : '',
        isPublished: isPublished !== false,
        order: store.videos.length + 1,
        aspectRatio: aspectRatio || 'landscape',
        createdAt: new Date().toISOString(),
      };

      store.videos.unshift(newVideo);
      store.videos.forEach((v, idx) => { v.order = idx + 1; });
      await saveStore(store);

      res.status(201).json({ success: true, video: newVideo });
    } catch (err) {
      res.status(500).json({ error: 'Failed to create video.' });
    }
  });

  // Videos: Update
  app.put('/api/admin/videos/:id', requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const store = await loadStore();
      const index = store.videos.findIndex((v) => v.id === id);
      if (index === -1) {
        res.status(404).json({ error: 'Video not found.' });
        return;
      }

      const existing = store.videos[index];
      const { title, videoUrl, thumbnailUrl, alt, isPublished, order, aspectRatio } = req.body;

      store.videos[index] = {
        ...existing,
        title: title !== undefined ? title : existing.title,
        videoUrl: videoUrl !== undefined ? videoUrl : existing.videoUrl,
        thumbnailUrl: thumbnailUrl !== undefined ? thumbnailUrl : existing.thumbnailUrl,
        alt: alt !== undefined ? alt : existing.alt,
        isPublished: isPublished !== undefined ? isPublished : existing.isPublished,
        order: order !== undefined ? Number(order) : existing.order,
        aspectRatio: aspectRatio || existing.aspectRatio,
      };

      await saveStore(store);
      res.json({ success: true, video: store.videos[index] });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update video.' });
    }
  });

  // Videos: Reorder
  app.put('/api/admin/videos-reorder', requireAdminAuth, async (req, res) => {
    try {
      const { orderedIds } = req.body as { orderedIds: string[] };
      if (!Array.isArray(orderedIds)) {
        res.status(400).json({ error: 'orderedIds array is required.' });
        return;
      }

      const store = await loadStore();
      const videoMap = new Map(store.videos.map((v) => [v.id, v]));

      const reordered: VideoItem[] = [];
      orderedIds.forEach((id, idx) => {
        const item = videoMap.get(id);
        if (item) {
          item.order = idx + 1;
          reordered.push(item);
          videoMap.delete(id);
        }
      });

      videoMap.forEach((item) => {
        item.order = reordered.length + 1;
        reordered.push(item);
      });

      store.videos = reordered;
      await saveStore(store);

      res.json({ success: true, videos: store.videos });
    } catch (err) {
      res.status(500).json({ error: 'Failed to reorder videos.' });
    }
  });

  // Videos: Delete
  app.delete('/api/admin/videos/:id', requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const store = await loadStore();
      const initialCount = store.videos.length;
      store.videos = store.videos.filter((v) => v.id !== id);

      if (store.videos.length === initialCount) {
        res.status(404).json({ error: 'Video not found.' });
        return;
      }

      store.videos.forEach((v, idx) => { v.order = idx + 1; });
      await saveStore(store);

      res.json({ success: true, message: 'Video deleted successfully.' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete video.' });
    }
  });

  // Messages: Delete
  app.delete('/api/admin/messages/:id', requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const store = await loadStore();
      store.messages = store.messages.filter((m) => m.id !== id);
      await saveStore(store);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete message.' });
    }
  });

  return app;
}
