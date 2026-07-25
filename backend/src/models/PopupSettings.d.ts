import mongoose, { Document } from 'mongoose';
export interface IPopupSettings extends Document {
    enabled: boolean;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<any, {}, {}, {}, any, any, any> | mongoose.Model<IPopupSettings, {}, {}, {}, Document<unknown, {}, IPopupSettings, {}, mongoose.DefaultSchemaOptions> & IPopupSettings & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IPopupSettings>;
export default _default;
//# sourceMappingURL=PopupSettings.d.ts.map