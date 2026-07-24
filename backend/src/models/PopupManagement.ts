import mongoose, { Document, Schema } from 'mongoose';

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

const PopupManagementSchema: Schema = new Schema({
  imageUrl: {
    type: String,
    required: true,
    trim: true
  },
  altText: {
    type: String,
    required: true,
    trim: true,
    default: 'Popup Image'
  },
  offerUrl: {
    type: String,
    trim: true
  },
  showDuration: {
    type: Number,
    required: true,
    default: 3,
    min: 1,
    max: 60
  },
  order: {
    type: Number,
    required: true,
    default: 0
  },
  type: {
    type: String,
    enum: ['image', 'lottie'],
    default: 'image'
  }
}, {
  timestamps: true
});

// Index for ordering
PopupManagementSchema.index({ order: 1 });

export default mongoose.models.PopupManagement || mongoose.model<IPopupManagement>('PopupManagement', PopupManagementSchema);
