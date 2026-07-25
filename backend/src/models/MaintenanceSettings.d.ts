import { Model, HydratedDocument } from 'mongoose';
export type MaintenanceType = 'marquee' | 'fullscreen';
export interface IMaintenanceSettings {
    enabled: boolean;
    type: MaintenanceType;
    message: string;
    updatedAt: Date;
}
interface MaintenanceSettingsModel extends Model<IMaintenanceSettings> {
    getSettings(): Promise<HydratedDocument<IMaintenanceSettings>>;
}
declare const _default: MaintenanceSettingsModel;
export default _default;
//# sourceMappingURL=MaintenanceSettings.d.ts.map