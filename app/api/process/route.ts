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
    const buffer = Buffer.from(bytes);

    // Get original metadata
    const metadata = await sharp(buffer).metadata();
    let width = metadata.width || 1024;
    let height = metadata.height || 1024;

    // Start pipeline
    let currentBuffer = buffer;

    // 1. Resample (random scale between 0.9 and 1.1)
    if (options.resample) {
      const scale = 0.9 + Math.random() * 0.2;
      width = Math.round(width * scale);
      height = Math.round(height * scale);
      currentBuffer = await sharp(currentBuffer)
        .resize(width, height, { fit: 'fill', kernel: 'lanczos3' })
        .toBuffer();
    }

    // 2. Rotate (-1 to 1 degrees)
    if (options.rotate) {
      const angle = -1 + Math.random() * 2;
      currentBuffer = await sharp(currentBuffer)
        .rotate(angle)
        .toBuffer();
    }

    // 3. Color space conversion
    if (options.colorSpaceConversion) {
      currentBuffer = await sharp(currentBuffer)
        .toColorspace('adobe-rgb')
        .toColorspace('srgb')
        .toBuffer();
    }

    // 4. Add film grain
    if (options.addFilmGrain) {
      const noiseIntensity = 0.03 + Math.random() * 0.02;
      const noiseBuffer = await createNoiseBuffer(width, height, noiseIntensity);
      currentBuffer = await sharp(currentBuffer)
        .composite([{ input: noiseBuffer, blend: 'overlay' }])
        .toBuffer();
    }

    // 5. Convert to PNG
    currentBuffer = await sharp(currentBuffer)
      .png({ quality: 95, compressionLevel: 6 })
      .toBuffer();

    // 6. Add fake EXIF data if enabled
    if (options.clearExif && options.addFakeCameraData) {
      currentBuffer = await addFakeExifData(currentBuffer, camera);
    }

    // Return the processed image
    return new NextResponse(currentBuffer, {
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

  return await sharp(noiseData, {
    raw: { width: noiseSize, height: noiseSize, channels: 4 },
  })
    .resize(width, height, { fit: 'fill' })
    .png()
    .toBuffer();
}

async function addFakeExifData(buffer: Buffer, camera: CameraType): Promise<Buffer> {
  const now = new Date();
  const dateStr = now.toISOString().replace(/[-:T]/g, ':').slice(0, 19);

  return await sharp(buffer)
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
}
