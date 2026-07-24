import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    required: true,
    trim: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  priceBDT: {
    type: Number,
    default: 0,
  },
  priceUSDT: {
    type: Number,
    default: 0,
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  description: {
    type: String,
    trim: true,
  },
  details: {
    type: String,
    trim: true,
  },
  imageUrl: {
    type: String,
    trim: true,
  },
  images: {
    type: [String],
    default: [],
  },
  seoTitle: {
    type: String,
    trim: true,
    maxlength: 60,
  },
  seoDescription: {
    type: String,
    trim: true,
    maxlength: 160,
  },
  seoKeywords: {
    type: String,
    trim: true,
  },
  seoSlug: {
    type: String,
    trim: true,
  },
  featured: {
    type: Boolean,
    default: false,
  },
  available: {
    type: Boolean,
    default: true,
  },
  showStock: {
    type: Boolean,
    default: true,
  },
  showImageSlider: {
    type: Boolean,
    default: true,
  },
  sales: {
    type: Number,
    default: 0,
  },
  revenue: {
    type: Number,
    default: 0,
  },
  trend: {
    type: String,
    default: '+0%',
  },
  smmServiceId: {
    type: String,
    index: true,
    sparse: true,
    default: null,
  },
  smmProvider: {
    type: String,
    default: null,
  },
  smmMin: {
    type: Number,
    default: null,
  },
  smmMax: {
    type: Number,
    default: null,
  },
  orderFields: {
    type: [{
      key: { type: String, required: true },
      label: { type: String, required: true },
      type: {
        type: String,
        enum: ['text', 'textarea', 'number', 'url', 'email', 'select', 'radio', 'checkbox', 'date', 'time', 'password', 'hidden'],
        default: 'text',
      },
      placeholder: { type: String },
      required: { type: Boolean, default: false },
      options: { type: [mongoose.Schema.Types.Mixed], default: undefined },
      defaultValue: { type: mongoose.Schema.Types.Mixed },
      validation: {
        type: {
          min: { type: Number },
          max: { type: Number },
          pattern: { type: String },
        },
        default: {},
      },
      showIf: {
        type: {
          field: { type: String },
          equals: { type: String },
        },
        default: {},
      },
    }],
    default: [],
  },
}, {
  timestamps: true,
});

// Calculate revenue when sales are updated
productSchema.pre('save', async function() {
  if (this.isModified('sales') || this.isModified('price')) {
    this.revenue = Math.round(this.sales * this.price * 100) / 100;
  }
});

// Virtual for formatted price
productSchema.virtual('formattedPrice').get(function() {
  return `$${this.price % 1 === 0 ? this.price.toFixed(0) : this.price.toFixed(2)}`;
});

// Virtual for formatted revenue
productSchema.virtual('formattedRevenue').get(function() {
  const revenue = this.revenue || 0;
  return `$${revenue.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

const existingProductModel = mongoose.models.Product as mongoose.Model<any> | undefined;

// In dev hot-reload, model can be cached with an older schema.
// Ensure newly added fields are available without requiring a manual restart.
if (existingProductModel && !existingProductModel.schema.path('imageUrl')) {
  existingProductModel.schema.add({
    imageUrl: {
      type: String,
      trim: true,
    },
    images: {
      type: [String],
      default: [],
    },
  });
}
if (existingProductModel && !existingProductModel.schema.path('smmServiceId')) {
  existingProductModel.schema.add({
    smmServiceId: { type: String, index: true, sparse: true, default: null },
    smmProvider: { type: String, default: null },
  });
}
if (existingProductModel && !existingProductModel.schema.path('smmMin')) {
  existingProductModel.schema.add({
    smmMin: { type: Number, default: null },
    smmMax: { type: Number, default: null },
  });
}
if (existingProductModel && !existingProductModel.schema.path('orderFields')) {
  existingProductModel.schema.add({
    orderFields: {
      type: [{
        key: { type: String, required: true },
        label: { type: String, required: true },
        type: {
          type: String,
          enum: ['text', 'textarea', 'number', 'url', 'email', 'select', 'radio', 'checkbox', 'date', 'time', 'password', 'hidden'],
          default: 'text',
        },
        placeholder: { type: String },
        required: { type: Boolean, default: false },
        options: { type: [mongoose.Schema.Types.Mixed], default: undefined },
        defaultValue: { type: mongoose.Schema.Types.Mixed },
        validation: {
          type: {
            min: { type: Number },
            max: { type: Number },
            pattern: { type: String },
          },
          default: {},
        },
        showIf: {
          type: {
            field: { type: String },
            equals: { type: String },
          },
          default: {},
        },
      }],
      default: [],
    },
  });
}
if (existingProductModel && !existingProductModel.schema.path('seoTitle')) {
  existingProductModel.schema.add({
    seoTitle: {
      type: String,
      trim: true,
      maxlength: 60,
    },
    seoDescription: {
      type: String,
      trim: true,
      maxlength: 160,
    },
    seoKeywords: {
      type: String,
      trim: true,
    },
    seoSlug: {
      type: String,
      trim: true,
    },
  });
}

const ProductModel: mongoose.Model<any> =
  existingProductModel || mongoose.model('Product', productSchema);

export default ProductModel;
