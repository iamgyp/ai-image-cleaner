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

    // Start with sharp
    let image = sharp(buffer);
    const metadata = await image.metadata();
    
    // Get original dimensions
    let width = metadata.width || 1024;
    let height = metadata.height || 1024;

    // Build processing pipeline
    let pipeline = sharp(buffer, {
      // Remove all metadata initially
      ...(options.clearExif && { animated: false }),
    });

    // 1. Resample (random scale between 0.9 and 1.1)
    if (options.resample) {
      const scale = 0.9 + Math.random() * 0.2; // 0.9 to 1.1
      width = Math.round(width * scale);
      height = Math.round(height * scale);
      pipeline = pipeline.resize(width, height, {
        fit: 'fill',
        kernel: 'lanczos3',
      });
    }

    // 2. Rotate (-1 to 1 degrees)
    if (options.rotate) {
      const angle = -1 + Math.random() * 2; // -1 to 1
      pipeline = pipeline.rotate(angle);
    }

    // 3. Color space conversion
    if (options.colorSpaceConversion) {
      pipeline = pipeline
        .toColorspace('adobe-rgb')
        .toColorspace('srgb');
    }

    // 4. Add film grain
    if (options.addFilmGrain) {
      // Create noise overlay
      const noiseIntensity = 0.03 + Math.random() * 0.02; // 3-5%
      const noiseBuffer = await createNoiseBuffer(width, height, noiseIntensity);
      
      // Composite noise over image
      pipeline = pipeline.composite([{
        input: noiseBuffer,
        blend: 'overlay',
      }]);
    }

    // Process the image
    let outputBuffer = await pipeline
      .png({
        quality: 95,
        compressionLevel: 6,
      })
      .toBuffer();

    // 5. Add fake EXIF data if enabled
    if (options.clearExif && options.addFakeCameraData) {
      outputBuffer = await addFakeExifData(outputBuffer, camera, width, height);
    }

    // Return the processed image
    return new NextResponse(outputBuffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': 'attachment; filename="processed.png"',
      },
    });

  } catch (error) {
    console.error('Processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process image' },
      { status: 500 }
    );
  }
}

async function createNoiseBuffer(width: number, height: number, intensity: number): Promise<Buffer> {
  // Create a simple noise pattern using sharp
  const size = Math.max(width, height);
  const noiseSize = Math.min(size, 512); // Limit noise texture size
  
  // Generate random noise data
  const pixels = noiseSize * noiseSize * 4;
  const noiseData = Buffer.alloc(pixels);
  
  for (let i = 0; i < pixels; i += 4) {
    const noise = Math.random() * 255;
    noiseData[i] = noise;     // R
    noiseData[i + 1] = noise; // G
    noiseData[i + 2] = noise; // B
    noiseData[i + 3] = intensity * 255 * 0.3; // A (reduced opacity)
  }

  const noiseImage = sharp(noiseData, {
    raw: {
      width: noiseSize,
      height: noiseSize,
      channels: 4,
    },
  });

  // Resize to match image dimensions and make it tileable
  return await noiseImage
    .resize(width, height, { fit: 'fill' })
    .toBuffer();
}

async function addFakeExifData(
  buffer: Buffer,
  camera: CameraType,
  width: number,
  height: number
): Promise<Buffer> {
  // Generate realistic EXIF data
  const now = new Date();
  const dateStr = now.toISOString().replace(/[-:T]/g, ':').slice(0, 19);
  
  // Random camera settings
  const aperture = [1.4, 1.8, 2.8, 4.0, 5.6, 8.0][Math.floor(Math.random() * 6)];
  const shutterSpeed = ['1/60', '1/125', '1/250', '1/500', '1/1000'][Math.floor(Math.random() * 5)];
  const iso = [100, 200, 400, 800, 1600][Math.floor(Math.random() * 5)];
  const focalLength = [24, 35, 50, 85, 135][Math.floor(Math.random() * 5)];

  // Create EXIF metadata
  const exif = {
    IFD0: {
      Make: camera.make,
      Model: camera.model,
      DateTime: dateStr,
      ImageDescription: '',
      Software: `${camera.make} Image Editor`,
    },
    IFD1: {},
    ExifIFD: {
      ExposureTime: shutterSpeed,
      FNumber: aperture,
      ISOSpeedRatings: iso,
      DateTimeOriginal: dateStr,
      DateTimeDigitized: dateStr,
      FocalLength: focalLength,
      ExposureProgram: 2, // Normal program
      MeteringMode: 5, // Pattern
      Flash: 0, // No flash
    },
    GPS: {},
  };

  // Note: Sharp has limited EXIF writing capabilities
  // For a production app, you might need a more robust EXIF library like exiftool or piexifjs
  // For now, we'll use sharp's withMetadata
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
