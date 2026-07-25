import mongoose, { Model, type HydratedDocument } from 'mongoose';

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

const MaintenanceSettingsSchema = new mongoose.Schema<IMaintenanceSettings>({
  enabled: {
    type: Boolean,
    default: false,
    required: true
  },
  type: {
    type: String,
    enum: ['marquee', 'fullscreen'],
    default: 'marquee',
    required: true
  },
  message: {
    type: String,
    default: '',
    trim: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure only one maintenance settings document exists
MaintenanceSettingsSchema.statics.getSettings = async function(): Promise<HydratedDocument<IMaintenanceSettings>> {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({
      enabled: false,
      type: 'marquee',
      message: ''
    });
  }
  return settings;
};

export default (mongoose.models.MaintenanceSettings as MaintenanceSettingsModel) || mongoose.model<IMaintenanceSettings, MaintenanceSettingsModel>('MaintenanceSettings', MaintenanceSettingsSchema);
