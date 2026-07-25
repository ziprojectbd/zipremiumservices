import mongoose from 'mongoose';
export const normalizeCategorySlug = (value) => value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    icon: {
        type: String,
        default: '📦',
    },
    gradient: {
        type: String,
        default: 'from-gray-500 to-slate-500',
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    sortOrder: {
        type: Number,
        default: 0,
    },
}, {
    timestamps: true,
});
categorySchema.pre('validate', function () {
    if (typeof this.slug === 'string' && this.slug.trim().length > 0) {
        this.slug = normalizeCategorySlug(this.slug);
    }
    else if (typeof this.name === 'string' && this.name.trim().length > 0) {
        this.slug = normalizeCategorySlug(this.name);
    }
});
export default mongoose.models.Category || mongoose.model('Category', categorySchema);
//# sourceMappingURL=Category.js.map