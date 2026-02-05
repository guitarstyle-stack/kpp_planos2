
import { supabase } from '../lib/supabase';
import { Readable } from 'stream';

const BUCKET_NAME = 'uploads';

interface UploadOptions {
    buffer: Buffer;
    filename: string;
    mimeType: string;
}

interface StoredFile {
    id: string; // We'll use the path as the ID for consistency with the previous interface
    name: string;
    mimeType: string;
    size: number;
    webViewLink?: string;
    webContentLink?: string;
}

/**
 * Upload a file to Supabase Storage
 */
export async function uploadFile({ buffer, filename, mimeType }: UploadOptions): Promise<StoredFile> {
    try {
        // Sanitize filename to avoid issues
        const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
        // Add timestamp to make it unique
        const filePath = `${Date.now()}_${sanitizedFilename}`;

        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(filePath, buffer, {
                contentType: mimeType,
                upsert: false
            });

        if (error) {
            throw error;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(filePath);

        return {
            id: filePath,
            name: filename,
            mimeType: mimeType,
            size: buffer.length,
            webViewLink: publicUrl,
            webContentLink: publicUrl
        };

    } catch (error) {
        console.error("Supabase Storage upload error:", error);
        throw new Error("Failed to upload file to Supabase Storage");
    }
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteFile(fileId: string): Promise<void> {
    try {
        // fileId is the path in the bucket
        const { error } = await supabase.storage
            .from(BUCKET_NAME)
            .remove([fileId]);

        if (error) {
            throw error;
        }
    } catch (error) {
        console.error("Supabase Storage delete error:", error);
        throw new Error("Failed to delete file from Supabase Storage");
    }
}

/**
 * Get file metadata/URL (Simulating the previous Google Drive behavior)
 */
export async function getFile(fileId: string): Promise<StoredFile> {
    try {
        const { data: { publicUrl } } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(fileId);

        // Note: Supabase doesn't easily give metadata by path without listing, 
        // so we mock some details or would need to store metadata in DB side as well.
        // For now, we return the URL as the most important part.

        return {
            id: fileId,
            name: "Unknown", // We don't store the original name in the bucket path necessarily/easily retrievable without DB
            mimeType: "application/octet-stream",
            size: 0,
            webViewLink: publicUrl,
            webContentLink: publicUrl
        };

    } catch (error) {
        console.error("Supabase Storage get file error:", error);
        throw new Error("Failed to get file from Supabase Storage");
    }
}

/**
 * Download a file from Supabase Storage as a buffer
 */
export async function downloadFile(fileId: string): Promise<Buffer> {
    try {
        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .download(fileId);

        if (error) {
            throw error;
        }

        const arrayBuffer = await data.arrayBuffer();
        return Buffer.from(arrayBuffer);
    } catch (error) {
        console.error("Supabase Storage download error:", error);
        throw new Error("Failed to download file from Supabase Storage");
    }
}

/**
 * Get a readable stream for a file
 */
export async function getFileStream(fileId: string): Promise<Readable> {
    const buffer = await downloadFile(fileId);
    return Readable.from(buffer);
}
/**
 * Validate file before upload (Shared logic mainly)
 */
export function validateFile(filename: string, mimeType: string, size: number): { valid: boolean; error?: string } {
    // Allowed MIME types
    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    // Check MIME type
    if (!allowedTypes.includes(mimeType)) {
        return {
            valid: false,
            error: `File type not allowed. Allowed types: Images (JPG, PNG, GIF), PDF, Word, Excel`,
        };
    }

    // Check file size (10MB default)
    const maxSize = parseInt(process.env.MAX_FILE_SIZE_MB || "10", 10) * 1024 * 1024;
    if (size > maxSize) {
        return {
            valid: false,
            error: `File too large. Maximum size: ${maxSize / 1024 / 1024}MB`,
        };
    }

    return { valid: true };
}
