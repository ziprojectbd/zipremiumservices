import mongoose, { Document } from 'mongoose';
export interface IPopupManagement extends Document {
    imageUrl: string;
    altText: string;
    offerUrl?: string;
    showDuration: number;
    order: number;
    type: 'image' | 'lottie';
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<any, {}, {}, {}, any, any, any>;
export default _default;
//# sourceMappingURL=PopupManagement.d.ts.map