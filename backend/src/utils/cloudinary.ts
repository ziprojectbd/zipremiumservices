import { v2 as cloudinary } from 'cloudinary';
import { devLog, devError } from './devLogger.js';

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary };

/**
 * Upload a buffer as an image to Cloudinary.
 * @param buffer - The file buffer (from multer) or a File-like object.
 * @param folder - The Cloudinary folder to upload to.
 */
export async function uploadImage(buffer: Buffer | { arrayBuffer(): Promise<ArrayBuffer> }, folder: string = 'user-products'): Promise<string> {
  return new Promise((resolve, reject) => {
    let fileBuffer: Buffer;

    if (Buffer.isBuffer(buffer)) {
      fileBuffer = buffer;
    } else {
      // Handle File-like objects (Web API File / Blob)
      buffer.arrayBuffer().then(ab => {
        fileBuffer = Buffer.from(ab);
        doUpload(fileBuffer, resolve, reject);
      }).catch(reject);
      return;
    }

    doUpload(fileBuffer, resolve, reject);
  });

  function doUpload(buf: Buffer, resolve: (url: string) => void, reject: (err: Error) => void) {
    cloudinary.uploader.upload_stream(
      {
        resource_type: 'image',
        folder,
        format: 'webp',
        quality: 'auto:good',
        fetch_format: 'auto',
      },
      (error, result) => {
        if (error) reject(error);
        else if (result) resolve(result.secure_url);
        else reject(new Error('Upload failed'));
      }
    ).end(buf);
  }
}

/**
 * Upload a buffer as a Lottie animation (raw JSON) to Cloudinary.
 */
export async function uploadLottie(buffer: Buffer | { arrayBuffer(): Promise<ArrayBuffer> }, folder: string = 'lottie'): Promise<string> {
  return new Promise((resolve, reject) => {
    let fileBuffer: Buffer;

    if (Buffer.isBuffer(buffer)) {
      fileBuffer = buffer;
    } else {
      buffer.arrayBuffer().then(ab => {
        fileBuffer = Buffer.from(ab);
        doUpload(fileBuffer, resolve, reject);
      }).catch(reject);
      return;
    }

    doUpload(fileBuffer, resolve, reject);
  });

  function doUpload(buf: Buffer, resolve: (url: string) => void, reject: (err: Error) => void) {
    cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw',
        folder,
        format: 'json',
      },
      (error, result) => {
        if (error) reject(error);
        else if (result) resolve(result.secure_url);
        else reject(new Error('Upload failed'));
      }
    ).end(buf);
  }
}

export async function deleteImage(imageUrl: string): Promise<boolean> {
  try {
    const url = new URL(imageUrl);
    const pathParts = url.pathname.split('/');

    devLog('Cloudinary URL path parts:', pathParts);

    const uploadIndex = pathParts.indexOf('upload');
    if (uploadIndex === -1) {
      devError('Invalid Cloudinary URL format - no upload found');
      return false;
    }

    let publicIdWithFolder = pathParts.slice(uploadIndex + 1).join('/');
    publicIdWithFolder = publicIdWithFolder.replace(/^v\d+\//, '');
    const publicId = publicIdWithFolder.split('.')[0];

    devLog('Deleting Cloudinary image with public_id:', publicId);

    const result = await cloudinary.uploader.destroy(publicId);
    devLog('Cloudinary delete result:', result);

    if (result.result === 'ok') {
      return true;
    } else if (result.result === 'not found') {
      devLog('Image not found in Cloudinary (may have been already deleted)');
      return true;
    } else {
      devError('Cloudinary delete failed:', result);
      return false;
    }
  } catch (error) {
    devError('Error deleting image from Cloudinary:', error);
    return false;
  }
}
