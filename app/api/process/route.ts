import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { ProcessOptions, CameraType, CAMERA_PRESETS } from '../../types';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;
    const optionsJson = formData.get('options') as string;
    const cameraId = formData.get('cameraId') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    const options: ProcessOptions = JSON.parse(optionsJson);
    const camera = CAMERA_PRESETS.find(c => c.id === cameraId) || CAMERA_PRESETS[0];

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    let currentBuffer = Buffer.from(bytes);

    // 检查文件类型和大小
    console.log('Received file:', {
      name: file.name,
      type: file.type,
      size: file.size,
    });

    // 验证输入 buffer 是否为有效的图片格式
    try {
      // 尝试获取元数据，如果失败则尝试转换格式
      const metadata = await sharp(currentBuffer).metadata();
      console.log('Image metadata:', {
        format: metadata.format,
        width: metadata.width,
        height: metadata.height,
      });

      // 如果 Sharp 无法识别格式，尝试转换为 JPEG
      if (!metadata.format) {
        console.log('Unknown format detected, attempting to convert...');
        const convertedBuffer = await sharp(currentBuffer, { failOnError: false })
          .jpeg({ quality: 95 })
          .toBuffer();
        currentBuffer = Buffer.from(convertedBuffer);
      }
    } catch (metadataError) {
      console.error('Metadata extraction error:', metadataError);
      console.log('Attempting to convert image format...');

      // 尝试将 buffer 转换为 JPEG 格式
      try {
        const convertedBuffer = await sharp(currentBuffer, { failOnError: false })
          .jpeg({ quality: 95 })
          .toBuffer();
        currentBuffer = Buffer.from(convertedBuffer);
        console.log('Successfully converted to JPEG format');
      } catch (convertError) {
        console.error('Format conversion failed:', convertError);
        return NextResponse.json(
          { error: 'Unsupported image format', details: String(convertError) },
          { status: 400 }
        );
      }
    }

    // Get original metadata
    const metadata = await sharp(currentBuffer).metadata();
    let width = metadata.width || 1024;
    let height = metadata.height || 1024;

    // 1. Resample (random scale between 0.9 and 1.1)
    if (options.resample) {
      const scale = 0.9 + Math.random() * 0.2;
      width = Math.round(width * scale);
      height = Math.round(height * scale);
      const resizedBuffer = await sharp(currentBuffer)
        .resize(width, height, { fit: 'fill', kernel: 'lanczos3' })
        .toBuffer();
      currentBuffer = Buffer.from(resizedBuffer);
    }

    // 2. Rotate (-1 to 1 degrees)
    if (options.rotate) {
      const angle = -1 + Math.random() * 2;
      const rotatedBuffer = await sharp(currentBuffer)
        .rotate(angle)
        .toBuffer();
      currentBuffer = Buffer.from(rotatedBuffer);
    }

    // 3. Color space conversion
    if (options.colorSpaceConversion) {
      const colorBuffer = await sharp(currentBuffer)
        .toColorspace('adobe-rgb')
        .toColorspace('srgb')
        .toBuffer();
      currentBuffer = Buffer.from(colorBuffer);
    }

    // 4. Add film grain
    if (options.addFilmGrain) {
      const noiseIntensity = 0.03 + Math.random() * 0.02;
      const noiseBuffer = await createNoiseBuffer(width, height, noiseIntensity);
      const grainBuffer = await sharp(currentBuffer)
        .composite([{ input: noiseBuffer, blend: 'overlay' }])
        .toBuffer();
      currentBuffer = Buffer.from(grainBuffer);
    }

    // 5. Convert to PNG
    const pngBuffer = await sharp(currentBuffer)
      .png({ quality: 95, compressionLevel: 6 })
      .toBuffer();
    currentBuffer = Buffer.from(pngBuffer);

    // 6. Add fake EXIF data if enabled
    if (options.clearExif && options.addFakeCameraData) {
      const exifBuffer = await addFakeExifData(currentBuffer, camera);
      currentBuffer = Buffer.from(exifBuffer);
    }

    // Return the processed image as Uint8Array for NextResponse
    return new NextResponse(new Uint8Array(currentBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': 'attachment; filename="processed.png"',
      },
    });

  } catch (error) {
    console.error('Processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process image', details: String(error) },
      { status: 500 }
    );
  }
}

async function createNoiseBuffer(width: number, height: number, intensity: number): Promise<Buffer> {
  const noiseSize = Math.min(Math.max(width, height), 512);
  const pixels = noiseSize * noiseSize * 4;
  const noiseData = Buffer.alloc(pixels);
  
  for (let i = 0; i < pixels; i += 4) {
    const noise = Math.floor(Math.random() * 256);
    noiseData[i] = noise;
    noiseData[i + 1] = noise;
    noiseData[i + 2] = noise;
    noiseData[i + 3] = Math.floor(intensity * 255 * 0.3);
  }

  const result = await sharp(noiseData, {
    raw: { width: noiseSize, height: noiseSize, channels: 4 },
  })
    .resize(width, height, { fit: 'fill' })
    .png()
    .toBuffer();
  
  return Buffer.from(result);
}

async function addFakeExifData(buffer: Buffer, camera: CameraType): Promise<Buffer> {
  const now = new Date();
  const dateStr = now.toISOString().replace(/[-:T]/g, ':').slice(0, 19);

  const result = await sharp(buffer)
    .withMetadata({
      exif: {
        IFD0: {
          Make: camera.make,
          Model: camera.model,
          DateTime: dateStr,
        },
      },
    })
    .toBuffer();
  
  return Buffer.from(result);
}
