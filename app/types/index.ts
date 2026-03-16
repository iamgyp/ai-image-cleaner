export interface ProcessOptions {
  clearExif: boolean;
  addFakeCameraData: boolean;
  addFilmGrain: boolean;
  resample: boolean;
  rotate: boolean;
  colorSpaceConversion: boolean;
}

export interface CameraType {
  id: string;
  name: string;
  make: string;
  model: string;
}

export const CAMERA_PRESETS: CameraType[] = [
  { id: 'iphone15', name: 'iPhone 15 Pro', make: 'Apple', model: 'iPhone 15 Pro' },
  { id: 'iphone14', name: 'iPhone 14 Pro', make: 'Apple', model: 'iPhone 14 Pro' },
  { id: 'sonya7iv', name: 'Sony A7 IV', make: 'SONY', model: 'ILCE-7M4' },
  { id: 'sonya7iii', name: 'Sony A7 III', make: 'SONY', model: 'ILCE-7M3' },
  { id: 'canonr5', name: 'Canon EOS R5', make: 'Canon', model: 'Canon EOS R5' },
  { id: 'canonr6', name: 'Canon EOS R6', make: 'Canon', model: 'Canon EOS R6' },
  { id: 'nikonz8', name: 'Nikon Z8', make: 'NIKON', model: 'Z 8' },
  { id: 'fujixt5', name: 'Fujifilm X-T5', make: 'FUJIFILM', model: 'X-T5' },
];

export const DEFAULT_OPTIONS: ProcessOptions = {
  clearExif: true,
  addFakeCameraData: true,
  addFilmGrain: true,
  resample: true,
  rotate: true,
  colorSpaceConversion: false,
};
