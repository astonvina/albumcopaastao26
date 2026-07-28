import { createClient } from '@supabase/supabase-js';

const safeProcessEnv = typeof process !== 'undefined' ? process.env : {};
const metaEnv = (import.meta as any).env || {};

const supabaseUrl = safeProcessEnv.SUPABASE_URL || safeProcessEnv.VITE_SUPABASE_URL || metaEnv.VITE_SUPABASE_URL || '';
const supabaseServiceKey = safeProcessEnv.SUPABASE_SERVICE_ROLE_KEY || safeProcessEnv.SUPABASE_ANON_KEY || safeProcessEnv.VITE_SUPABASE_ANON_KEY || metaEnv.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseServerConfigured = Boolean(supabaseUrl && supabaseServiceKey);

export const supabaseServer = isSupabaseServerConfigured
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

/**
 * Uploads a file buffer to Supabase Storage if configured
 */
export async function uploadToSupabaseStorage(
  bucketName: string,
  filePath: string,
  fileBuffer: Buffer,
  contentType: string
): Promise<string | null> {
  if (!supabaseServer) return null;

  try {
    // Sanitize bucket name (e.g. "stickers/vermelho" -> bucket: "stickers", path: "vermelho/filename")
    const parts = bucketName.split('/');
    const rootBucket = parts[0] || 'uploads';
    const subFolder = parts.slice(1).join('/');

    const fullPath = subFolder ? `${subFolder}/${filePath}` : filePath;

    // Upload to Supabase Storage
    const { data, error } = await supabaseServer.storage
      .from(rootBucket)
      .upload(fullPath, fileBuffer, {
        contentType,
        upsert: true
      });

    if (error) {
      console.warn(`[Supabase Storage Warning] Error uploading to bucket ${rootBucket}:`, error.message);
      return null;
    }

    // Get public URL
    const { data: publicUrlData } = supabaseServer.storage
      .from(rootBucket)
      .getPublicUrl(fullPath);

    return publicUrlData.publicUrl;
  } catch (err) {
    console.error('[Supabase Storage Error]:', err);
    return null;
  }
}
