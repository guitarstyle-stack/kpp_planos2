import { google } from "googleapis";
import { Readable } from "stream";

// Google Drive configuration
const SCOPES = ["https://www.googleapis.com/auth/drive.file"];

interface DriveFile {
    id: string;
    name: string;
    mimeType: string;
    size: number;
    webViewLink?: string;
    webContentLink?: string;
}

interface UploadOptions {
    buffer: Buffer;
    filename: string;
    mimeType: string;
}

// Initialize Google Drive client
function getDriveClient() {
    const clientEmail = process.env.GOOGLE_DRIVE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_DRIVE_PRIVATE_KEY?.replace(/\\n/g, "\n");

    if (!clientEmail || !privateKey) {
        throw new Error("Google Drive credentials not configured");
    }

    const auth = new google.auth.JWT({
        email: clientEmail,
        key: privateKey,
        scopes: SCOPES,
    });

    return google.drive({ version: "v3", auth });
}

/**
 * Upload a file to Google Drive
 */
export async function uploadFile({ buffer, filename, mimeType }: UploadOptions): Promise<DriveFile> {
    try {
        const drive = getDriveClient();
        const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

        const bufferStream = Readable.from(buffer);

        const fileMetadata: any = {
            name: filename,
        };

        // Add to specific folder if configured
        if (folderId) {
            fileMetadata.parents = [folderId];
        }

        const media = {
            mimeType,
            body: bufferStream,
        };

        const response = await drive.files.create({
            requestBody: fileMetadata,
            media,
            fields: "id, name, mimeType, size, webViewLink, webContentLink",
        });

        const file = response.data;

        if (!file.id) {
            throw new Error("Failed to upload file - no file ID returned");
        }

        return {
            id: file.id,
            name: file.name || filename,
            mimeType: file.mimeType || mimeType,
            size: parseInt(file.size || "0", 10),
            webViewLink: file.webViewLink || undefined,
            webContentLink: file.webContentLink || undefined,
        };
    } catch (error) {
        console.error("Google Drive upload error:", error);
        throw new Error("Failed to upload file to Google Drive");
    }
}

/**
 * Delete a file from Google Drive
 */
export async function deleteFile(fileId: string): Promise<void> {
    try {
        const drive = getDriveClient();

        await drive.files.delete({
            fileId,
        });
    } catch (error) {
        console.error("Google Drive delete error:", error);
        throw new Error("Failed to delete file from Google Drive");
    }
}

/**
 * Get file metadata from Google Drive
 */
export async function getFile(fileId: string): Promise<DriveFile> {
    try {
        const drive = getDriveClient();

        const response = await drive.files.get({
            fileId,
            fields: "id, name, mimeType, size, webViewLink, webContentLink",
        });

        const file = response.data;

        return {
            id: file.id || fileId,
            name: file.name || "Unknown",
            mimeType: file.mimeType || "application/octet-stream",
            size: parseInt(file.size || "0", 10),
            webViewLink: file.webViewLink || undefined,
            webContentLink: file.webContentLink || undefined,
        };
    } catch (error) {
        console.error("Google Drive get file error:", error);
        throw new Error("Failed to get file from Google Drive");
    }
}

/**
 * Download a file from Google Drive as a buffer
 */
export async function downloadFile(fileId: string): Promise<Buffer> {
    try {
        const drive = getDriveClient();

        const response = await drive.files.get(
            {
                fileId,
                alt: "media",
            },
            {
                responseType: "arraybuffer",
            }
        );

        return Buffer.from(response.data as ArrayBuffer);
    } catch (error) {
        console.error("Google Drive download error:", error);
        throw new Error("Failed to download file from Google Drive");
    }
}

/**
 * Get a readable stream for a file (for large files)
 */
export async function getFileStream(fileId: string): Promise<Readable> {
    try {
        const drive = getDriveClient();

        const response = await drive.files.get(
            {
                fileId,
                alt: "media",
            },
            {
                responseType: "stream",
            }
        );

        return response.data as unknown as Readable;
    } catch (error) {
        console.error("Google Drive stream error:", error);
        throw new Error("Failed to stream file from Google Drive");
    }
}

/**
 * List files in a folder (for debugging/admin purposes)
 */
export async function listFiles(folderId?: string): Promise<DriveFile[]> {
    try {
        const drive = getDriveClient();

        const query = folderId ? `'${folderId}' in parents` : undefined;

        const response = await drive.files.list({
            q: query,
            fields: "files(id, name, mimeType, size, webViewLink, webContentLink)",
            pageSize: 100,
        });

        const files = response.data.files || [];

        return files.map((file) => ({
            id: file.id || "",
            name: file.name || "Unknown",
            mimeType: file.mimeType || "application/octet-stream",
            size: parseInt(file.size || "0", 10),
            webViewLink: file.webViewLink || undefined,
            webContentLink: file.webContentLink || undefined,
        }));
    } catch (error) {
        console.error("Google Drive list files error:", error);
        throw new Error("Failed to list files from Google Drive");
    }
}

/**
 * Validate file before upload
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

    // Sanitize filename
    const sanitizedName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    if (sanitizedName !== filename) {
        console.warn(`Filename sanitized: ${filename} -> ${sanitizedName}`);
    }

    return { valid: true };
}
