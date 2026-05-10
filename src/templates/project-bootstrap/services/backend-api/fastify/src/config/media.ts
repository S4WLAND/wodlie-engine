export const mediaConfig = {
  minio: {
    endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9000',
    user: process.env.MINIO_ROOT_USER || '',
    password: process.env.MINIO_ROOT_PASSWORD || '',
    bucket: process.env.MINIO_BUCKET || '{{PROJECT_NAME}}-media',
    publicUrl: process.env.MINIO_PUBLIC_URL || '',
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  },
}
