import mongoose, { Document } from 'mongoose';
export interface IPromoOffer extends Document {
    title: string;
    description: string;
    imageUrl: string;
    order: number;
    enabled: boolean;
    link?: string;
    type: 'image' | 'lottie';
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<any, {}, {}, {}, any, any, any>;
export default _default;
//# sourceMappingURL=PromoOffer.d.ts.map