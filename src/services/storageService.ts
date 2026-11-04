import { supabase } from '@/lib/supabase';
import { serviceError } from '@/services/serviceError';

export async function uploadImage(
  uri: string,
  bucket: string,
  path: string,
): Promise<string> {
  const response = await fetch(uri);
  const blob = await response.blob();

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, blob, {
      contentType: blob.type || 'image/jpeg',
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw serviceError(
      'storageService: upload image',
      error,
      'Failed to upload image. Please try again.',
    );
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(data.path);

  return publicUrl;
}

export async function uploadScoreImages(
  uris: string[],
  userId: string,
): Promise<string[]> {
  const timestamp = Date.now();
  return Promise.all(
    uris.map((uri, idx) =>
      uploadImage(uri, 'attachments', `scores/${userId}/${timestamp}_${idx}.jpg`),
    ),
  );
}

export async function uploadRecipeImages(
  uris: string[],
  userId: string,
): Promise<string[]> {
  const timestamp = Date.now();
  return Promise.all(
    uris.map((uri, idx) =>
      uploadImage(uri, 'attachments', `recipes/${userId}/${timestamp}_${idx}.jpg`),
    ),
  );
}
