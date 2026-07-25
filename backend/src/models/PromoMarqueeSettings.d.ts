import { Model } from 'mongoose';
interface IPromoMarqueeSettings {
    enabled: boolean;
    message: string;
    updatedAt: Date;
}
interface PromoMarqueeSettingsModel extends Model<IPromoMarqueeSettings> {
    getSettings(): Promise<IPromoMarqueeSettings>;
}
declare const _default: PromoMarqueeSettingsModel;
export default _default;
//# sourceMappingURL=PromoMarqueeSettings.d.ts.map