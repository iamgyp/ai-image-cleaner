'use client';

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxFileSizeMB?: number;
}

export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.88,
  maxFileSizeMB: 4,
};

/**
 * 压缩图片文件
 * @param file 原始图片文件
 * @param options 压缩选项
 * @returns 压缩后的文件和压缩信息
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const originalSize = file.size;

  // 如果文件已经小于限制，直接返回
  if (originalSize <= opts.maxFileSizeMB! * 1024 * 1024) {
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 1,
    };
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      // 计算新的尺寸
      let { width, height } = calculateNewDimensions(
        img.width,
        img.height,
        opts.maxWidth!,
        opts.maxHeight!
      );

      // 创建 canvas
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('无法创建 canvas 上下文'));
        return;
      }

      // 使用高质量渲染
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // 绘制图片
      ctx.drawImage(img, 0, 0, width, height);

      // 转换为 blob，确保使用正确的 MIME type
      const mimeType = 'image/jpeg';
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('图片压缩失败'));
            return;
          }

          // 创建新的文件对象，确保 type 属性正确设置
          const fileName = file.name.replace(/\.[^/.]+$/, '') + '.jpg';
          const compressedFile = new File([blob], fileName, {
            type: mimeType,
            lastModified: Date.now(),
          });

          // 验证 File 对象的 type 属性
          if (compressedFile.type !== mimeType) {
            console.warn('File type mismatch, expected:', mimeType, 'got:', compressedFile.type);
          }

          resolve({
            file: compressedFile,
            originalSize,
            compressedSize: blob.size,
            compressionRatio: blob.size / originalSize,
          });
        },
        mimeType,
        opts.quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('图片加载失败'));
    };

    img.src = url;
  });
}

/**
 * 计算新的图片尺寸，保持宽高比
 */
function calculateNewDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  let width = originalWidth;
  let height = originalHeight;

  // 如果图片尺寸已经在限制范围内，不做调整
  if (width <= maxWidth && height <= maxHeight) {
    return { width, height };
  }

  // 计算缩放比例
  const widthRatio = maxWidth / width;
  const heightRatio = maxHeight / height;
  const ratio = Math.min(widthRatio, heightRatio);

  width = Math.round(width * ratio);
  height = Math.round(height * ratio);

  return { width, height };
}

/**
 * 格式化文件大小显示
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 检查文件大小是否超过限制
 */
export function isFileTooLarge(file: File, maxSizeMB: number = 4): boolean {
  return file.size > maxSizeMB * 1024 * 1024;
}
