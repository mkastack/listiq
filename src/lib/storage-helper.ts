import { supabase } from "./supabase";

export type BucketName = "avatars" | "listings" | "claims" | "articles";

/**
 * Uploads a file to a Supabase bucket with automatic error handling for missing buckets.
 * @param bucket The name of the bucket to upload to
 * @param path The path within the bucket
 * @param file The file object to upload
 * @returns The public URL of the uploaded file
 */
export async function uploadFile(bucket: BucketName, path: string, file: File): Promise<string> {
  // 1. Check if bucket exists (or just try to upload and handle error)
  const { data, error: uploadError } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: true,
  });

  if (uploadError) {
    // If bucket doesn't exist, try to create it (might fail based on RLS)
    if (uploadError.message.includes("bucket not found") || (uploadError as any).status === 404) {
      console.warn(`Bucket "${bucket}" not found. Attempting to create it...`);
      try {
        const { error: createError } = await supabase.storage.createBucket(bucket, {
          public: true,
          fileSizeLimit: 1024 * 1024 * 2, // 2MB
          allowedMimeTypes: ["image/png", "image/jpeg", "image/gif", "application/pdf"],
        });

        if (!createError) {
          // Retry upload if bucket was created
          const { data: retryData, error: retryError } = await supabase.storage
            .from(bucket)
            .upload(path, file, { upsert: true });

          if (retryError) throw retryError;
          return getPublicUrl(bucket, path);
        } else {
          throw new Error(
            `Bucket "${bucket}" was not found and could not be created automatically. Please create it manually in your Supabase dashboard under Storage -> New Bucket.`,
          );
        }
      } catch (err) {
        throw new Error(
          `STORAGE ERROR: The bucket "${bucket}" does not exist. \n\nFIX: Go to your Supabase Dashboard -> Storage -> Create a NEW public bucket named "${bucket}".`,
        );
      }
    }
    throw uploadError;
  }

  return getPublicUrl(bucket, path);
}

function getPublicUrl(bucket: string, path: string): string {
  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(path);
  return publicUrl;
}
