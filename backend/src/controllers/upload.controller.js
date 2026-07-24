import { uploadImage, uploadLottie } from '../utils/cloudinary.js';
import { success, error } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Convert a Node.js Buffer into a minimal File-like object that the
 * cloudinary utility functions can consume (they expect .arrayBuffer()).
 */
function bufferToFileLike(buffer) {
  return {
    arrayBuffer: async () => {
      const arrayBuffer = new ArrayBuffer(buffer.length);
      const view = new Uint8Array(arrayBuffer);
      for (let i = 0; i < buffer.length; i++) {
        view[i] = buffer[i];
      }
      return arrayBuffer;
    },
  };
}

/**
 * Determine whether a file is a Lottie animation based on its form field
 * name, original extension, or MIME type.
 */
function isLottieFile(file) {
  if (file.fieldname === 'lottie') return true;
  const name = file.originalname || '';
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'json') return true;
  if (file.mimetype === 'application/json') return true;
  return false;
}

// POST /upload
export const uploadFile = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json(error('No file uploaded'));
  }

  const file = req.file;
  const lottie = isLottieFile(file);
  const maxSize = lottie ? 10 * 1024 * 1024 : 5 * 1024 * 1024;

  if (file.size > maxSize) {
    return res.status(400).json(
      error(`File too large. Maximum size is ${lottie ? '10MB' : '5MB'}`)
    );
  }

  const fileLike = bufferToFileLike(file.buffer);

  try {
    let url;
    if (lottie) {
      url = await uploadLottie(fileLike);
    } else {
      url = await uploadImage(fileLike);
    }
    return res.json(success({ url }));
  } catch (err) {
    return res.status(500).json(error('Upload failed'));
  }
});
