import { createClient, SupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import type { PortfolioData, PortfolioInfo, DesignItem, VideoItem, ContactMessage } from '../src/types';

export interface AdminAccount {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  salt: string;
}

export interface FullStore extends PortfolioData {
  admin: AdminAccount;
}

// --- Supabase client (server-side only; uses the service role key so it
// can read/write regardless of row-level security policies) ---
let cachedClient: SupabaseClient | null = null;
function getSupabase(): SupabaseClient {
  if (cachedClient) return cachedClient;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set. Create a free project at supabase.com, ' +
      'then copy these from Project Settings > API.'
    );
  }
  cachedClient = createClient(url, key, {
    auth: { persistSession: false },
  });
  return cachedClient;
}

const TABLE = 'portfolio_store';
const ROW_ID = 1;

export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const generatedSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, generatedSalt, 64).toString('hex');
  return { hash, salt: generatedSalt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const computedHash = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(computedHash, 'hex'), Buffer.from(hash, 'hex'));
}

// Token signing
const JWT_SECRET = process.env.JWT_SECRET || 'nimra-gallery-secret-key-' + (process.env.APP_URL || 'local-secure-key');

export function createSessionToken(userId: string, email: string): string {
  const payload = {
    userId,
    email,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
  };
  const strPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(strPayload).digest('base64url');
  return `${strPayload}.${signature}`;
}

export function verifySessionToken(token: string): { userId: string; email: string } | null {
  try {
    const [strPayload, signature] = token.split('.');
    if (!strPayload || !signature) return null;
    const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(strPayload).digest('base64url');
    if (signature !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(strPayload, 'base64url').toString('utf8'));
    if (payload.exp && payload.exp < Date.now()) return null;
    return { userId: payload.userId, email: payload.email };
  } catch {
    return null;
  }
}

// Seed initial aesthetic gallery data (used only the very first time the
// app runs, before anything exists in Supabase yet)
const initialDefaultInfo: PortfolioInfo = {
  name: 'Nimra Sajjad',
  title: 'Creative Designer / Developer',
  intro: 'Visual designer and creative developer exploring the interplay of minimalist architecture, experimental typography, and tactile digital systems.',
  aboutText: 'Focused on creating high-contrast visual identities, clean editorial layouts, and kinetic web atmospheres. Combining methodical design discipline with contemporary web technologies to build memorable digital artefacts.',
  skills: [
    'Visual Identity & Systems',
    'Creative Web Development',
    'Editorial Design',
    'Motion & Kinetic Typography',
    'Art Direction',
    'Spatial UI / UX',
  ],
  contactEmail: 'nimrasajjad000@gmail.com',
  contactPhone: '+1 (555) 234-8901',
  socialLinks: [
    { id: '1', platform: 'Instagram', label: 'Instagram', url: 'https://instagram.com' },
    { id: '2', platform: 'Behance', label: 'Behance', url: 'https://behance.net' },
    { id: '3', platform: 'Dribbble', label: 'Dribbble', url: 'https://dribbble.com' },
    { id: '4', platform: 'GitHub', label: 'GitHub', url: 'https://github.com' },
  ],
};

const initialDesigns: DesignItem[] = [];
const initialVideos: VideoItem[] = [];

function getInitialStore(): FullStore {
  // Default password: admin123 — change this immediately after first login.
  const defaultPass = 'admin123';
  const { hash, salt } = hashPassword(defaultPass);

  return {
    info: initialDefaultInfo,
    designs: initialDesigns,
    videos: initialVideos,
    messages: [],
    admin: {
      id: 'admin_1',
      email: 'admin@nimragallery.com',
      name: 'Nimra Sajjad',
      passwordHash: hash,
      salt: salt,
    },
  };
}

export async function loadStore(): Promise<FullStore> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(TABLE)
    .select('data')
    .eq('id', ROW_ID)
    .maybeSingle();

  if (error) {
    console.error('Error reading store from Supabase:', error);
    throw error;
  }

  if (!data) {
    const initial = getInitialStore();
    await saveStore(initial);
    return initial;
  }

  const parsed = data.data as Partial<FullStore>;
  return {
    info: parsed.info || initialDefaultInfo,
    designs: parsed.designs || [],
    videos: parsed.videos || [],
    messages: parsed.messages || [],
    admin: parsed.admin || getInitialStore().admin,
  };
}

export async function saveStore(store: FullStore): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from(TABLE)
    .upsert({ id: ROW_ID, data: store, updated_at: new Date().toISOString() });

  if (error) {
    console.error('Failed to save store to Supabase:', error);
    throw error;
  }
}
