import mongoose, { Document, Schema } from 'mongoose';

export interface IPopupSettings extends Document {
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PopupSettingsSchema: Schema = new Schema({
  enabled: {
    type: Boolean,
    required: true,
    default: true
  }
}, {
  timestamps: true
});

export default mongoose.models.PopupSettings || mongoose.model<IPopupSettings>('PopupSettings', PopupSettingsSchema);
