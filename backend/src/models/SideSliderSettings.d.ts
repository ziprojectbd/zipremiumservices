import mongoose, { Document } from 'mongoose';
export interface ISideSliderSettings extends Document {
    navigation: {
        name: string;
        slug: string;
        icon: string;
        badge?: string;
        color: string;
        description: string;
        enabled: boolean;
        order: number;
    }[];
    liveActivity: {
        enabled: boolean;
        orders: {
            user: string;
            service: string;
            time: string;
            flag: string;
        }[];
    };
    trustBadges: {
        safe: {
            enabled: boolean;
            icon: string;
            label: string;
            color: string;
        };
        fast: {
            enabled: boolean;
            icon: string;
            label: string;
            color: string;
        };
    };
    premiumServices: {
        enabled: boolean;
        logo: string;
        title: string;
        subtitle: string;
    };
    updatedAt: Date;
}
declare const _default: mongoose.Model<any, {}, {}, {}, any, any, any> | mongoose.Model<ISideSliderSettings, {}, {}, {}, Document<unknown, {}, ISideSliderSettings, {}, mongoose.DefaultSchemaOptions> & ISideSliderSettings & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, ISideSliderSettings>;
export default _default;
//# sourceMappingURL=SideSliderSettings.d.ts.map