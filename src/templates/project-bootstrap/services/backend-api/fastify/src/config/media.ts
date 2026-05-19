export const mediaConfig = {
  storage: {
    directory: process.env.MEDIA_STORAGE_DIR || '/app/storage/uploads',
    publicUrl: process.env.MEDIA_PUBLIC_URL || '',
    maxImageWidth: Number(process.env.MEDIA_MAX_IMAGE_WIDTH || 1200),
    imageQuality: Number(process.env.MEDIA_IMAGE_QUALITY || 75),
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  },
}
