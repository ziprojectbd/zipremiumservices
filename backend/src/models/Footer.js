import mongoose from 'mongoose';
const FooterSchema = new mongoose.Schema({
    sections: [{
            title: {
                type: String,
                required: true
            },
            color: {
                type: String,
                required: true
            },
            hoverColor: {
                type: String,
                required: true
            },
            links: [{
                    name: {
                        type: String,
                        required: true
                    },
                    href: {
                        type: String,
                        required: true
                    }
                }]
        }]
}, {
    timestamps: true
});
// Ensure only one footer document exists
FooterSchema.pre('save', async function () {
    const Model = this.constructor;
    const existingFooter = await Model.findOne({ _id: { $ne: this._id } });
    if (existingFooter) {
        throw new Error('Only one footer document is allowed');
    }
});
const FooterModel = mongoose.models.Footer || mongoose.model('Footer', FooterSchema);
export default FooterModel;
//# sourceMappingURL=Footer.js.map