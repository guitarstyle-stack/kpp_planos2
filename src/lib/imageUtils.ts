/**
 * Utility for compressing images using Native Browser Canvas API
 */
export async function compressImage(file: File, maxSizeMB: number = 1): Promise<File> {
    const fileSizeMB = file.size / (1024 * 1024);

    // If file is not an image or smaller than maxSizeMB, return original file
    if (!file.type.startsWith("image/") || fileSizeMB <= maxSizeMB) {
        return file;
    }

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement("canvas");
                let width = img.width;
                let height = img.height;

                // Calculate new dimensions (if needed, but here we mainly use quality compression)
                // If the image is extremely large in dimensions, we can also scale it down
                const MAX_WIDTH = 1920;
                const MAX_HEIGHT = 1080;

                if (width > MAX_WIDTH || height > MAX_HEIGHT) {
                    if (width > height) {
                        height = Math.round((height * MAX_WIDTH) / width);
                        width = MAX_WIDTH;
                    } else {
                        width = Math.round((width * MAX_HEIGHT) / height);
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext("2d");
                if (!ctx) {
                    resolve(file); // Fallback to original
                    return;
                }

                ctx.drawImage(img, 0, 0, width, height);

                // Initial quality
                let quality = 0.8;

                const getCompressedBlob = (q: number): Promise<Blob | null> => {
                    return new Promise((res) => {
                        canvas.toBlob((blob) => res(blob), file.type, q);
                    });
                };

                // Recursive function to try and fit within maxSizeMB
                const attemptCompression = async (q: number): Promise<File> => {
                    const blob = await getCompressedBlob(q);
                    if (!blob) return file;

                    // If still too large and we haven't reached minimum quality
                    if (blob.size / (1024 * 1024) > maxSizeMB && q > 0.1) {
                        return attemptCompression(q - 0.1);
                    }

                    return new File([blob], file.name, {
                        type: file.type,
                        lastModified: Date.now(),
                    });
                };

                attemptCompression(quality).then(resolve).catch(() => resolve(file));
            };
            img.onerror = () => resolve(file);
        };
        reader.onerror = () => resolve(file);
    });
}
