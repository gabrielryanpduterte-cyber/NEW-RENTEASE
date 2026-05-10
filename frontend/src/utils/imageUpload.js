export const IMAGE_UPLOAD_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,image/bmp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.gif,.bmp,.heic,.heif';

const HEIC_EXTENSIONS = ['.heic', '.heif'];
const JPEG_QUALITY_STEPS = [0.86, 0.76, 0.66, 0.56];

export function isImageFile(file) {
  if (!file) return false;
  if (file.type?.startsWith('image/')) return true;

  const name = file.name?.toLowerCase() || '';
  return ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', ...HEIC_EXTENSIONS].some((extension) =>
    name.endsWith(extension),
  );
}

export function isPdfFile(file) {
  if (!file) return false;
  return file.type === 'application/pdf' || file.name?.toLowerCase().endsWith('.pdf');
}

function isHeicFile(file) {
  const mime = file.type?.toLowerCase() || '';
  const name = file.name?.toLowerCase() || '';
  return mime === 'image/heic' || mime === 'image/heif' || HEIC_EXTENSIONS.some((extension) => name.endsWith(extension));
}

function jpegName(file) {
  const base = (file.name || 'photo').replace(/\.[^.]+$/, '');
  return `${base || 'photo'}-converted.jpg`;
}

async function heicToJpegBlob(file, quality) {
  const { default: heic2any } = await import('heic2any');
  const output = await heic2any({
    blob: file,
    toType: 'image/jpeg',
    quality,
  });

  return Array.isArray(output) ? output[0] : output;
}

function loadImage(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('The selected image could not be read by this browser.'));
    };
    image.src = url;
  });
}

function canvasToBlob(canvas, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('The selected image could not be converted.'));
        }
      },
      'image/jpeg',
      quality,
    );
  });
}

async function imageBlobToJpeg(blob, { maxWidth, maxHeight, quality }) {
  const image = await loadImage(blob);
  const scale = Math.min(1, maxWidth / image.naturalWidth, maxHeight / image.naturalHeight);
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  canvas.width = width;
  canvas.height = height;
  if (!context) {
    throw new Error('This browser could not prepare the selected image.');
  }
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);

  return canvasToBlob(canvas, quality);
}

export async function prepareUploadFile(file, options = {}) {
  const {
    maxSizeMB = 5,
    maxWidth = 1800,
    maxHeight = 1800,
    convertImages = true,
    allowPdf = false,
  } = options;

  if (!file) {
    return { file: null, converted: false, message: '' };
  }

  const maxBytes = maxSizeMB * 1024 * 1024;

  if (allowPdf && isPdfFile(file)) {
    if (file.size > maxBytes) {
      throw new Error(`File must be ${maxSizeMB} MB or smaller.`);
    }
    return { file, converted: false, message: '' };
  }

  if (!isImageFile(file)) {
    throw new Error('Choose a JPG, PNG, WEBP, GIF, BMP, HEIC, or HEIF image.');
  }

  if (!convertImages && file.size <= maxBytes) {
    return { file, converted: false, message: '' };
  }

  let sourceBlob = file;
  let heicConverted = false;

  if (isHeicFile(file)) {
    sourceBlob = await heicToJpegBlob(file, JPEG_QUALITY_STEPS[0]);
    heicConverted = true;
  }

  let lastBlob = null;
  for (const quality of JPEG_QUALITY_STEPS) {
    const jpegBlob = await imageBlobToJpeg(sourceBlob, { maxWidth, maxHeight, quality });
    lastBlob = jpegBlob;
    if (jpegBlob.size <= maxBytes) {
      const convertedFile = new File([jpegBlob], jpegName(file), {
        type: 'image/jpeg',
        lastModified: Date.now(),
      });
      return {
        file: convertedFile,
        converted: true,
        message: heicConverted ? 'Converted HEIC/HEIF to JPG.' : 'Converted photo to JPG for upload.',
      };
    }
  }

  if (lastBlob) {
    throw new Error(`Photo is still larger than ${maxSizeMB} MB after conversion. Try a smaller image.`);
  }

  throw new Error('The selected image could not be converted.');
}

export async function prepareUploadFiles(files, options = {}) {
  const prepared = [];
  const messages = [];

  for (const file of files) {
    const result = await prepareUploadFile(file, options);
    if (result.file) {
      prepared.push(result.file);
    }
    if (result.message) {
      messages.push(result.message);
    }
  }

  return { files: prepared, messages };
}
