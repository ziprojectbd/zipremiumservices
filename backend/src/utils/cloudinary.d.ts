import { v2 as cloudinary } from 'cloudinary';
export { cloudinary };
/**
 * Upload a buffer as an image to Cloudinary.
 * @param buffer - The file buffer (from multer) or a File-like object.
 * @param folder - The Cloudinary folder to upload to.
 */
export declare function uploadImage(buffer: Buffer | {
    arrayBuffer(): Promise<ArrayBuffer>;
}, folder?: string): Promise<string>;
/**
 * Upload a buffer as a Lottie animation (raw JSON) to Cloudinary.
 */
export declare function uploadLottie(buffer: Buffer | {
    arrayBuffer(): Promise<ArrayBuffer>;
}, folder?: string): Promise<string>;
export declare function deleteImage(imageUrl: string): Promise<boolean>;
//# sourceMappingURL=cloudinary.d.ts.map