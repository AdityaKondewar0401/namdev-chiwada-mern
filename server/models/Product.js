const mongoose = require('mongoose');

const sizeSchema = new mongoose.Schema({
  weight: { type: String, required: true },  // "250g", "500g", "1kg"
  price:  { type: Number, required: true },  // 180, 340, 640
});

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    namMarathi: {
      type: String,  // "नामदेव चिवडा"
      default: '',
    },
    slug: {
      type: String,  // "namdev-chiwada" — used in URLs
      unique: true,
      lowercase: true,
    },
    sub: {
      type: String,  // "House Signature Blend"
      default: '',
    },
    desc: {
      type: String,
      required: [true, 'Description is required'],
    },
    intro: {
      type: String,  // Short 1-line intro for cards
      default: '',
    },
    category: {
      type: String,
      enum: ['mild', 'spicy', 'special'],
      required: true,
    },
    tag: {
      type: String,  // "🏆 Most Loved", "✨ Chef's Pick"
      default: '',
    },
    badge: {
      type: String,  // "Bestseller", "New", "Premium"
      default: '',
    },
    badgeColor: {
      type: String,  // "#e07000"
      default: '#e07000',
    },
    sizes: [sizeSchema],
    // Main display price (lowest size price)
    price: {
      type: Number,
      required: true,
    },
    originalPrice: {
      type: Number,  // For showing strikethrough price
    },
    weight: {
      type: String,  // Default weight "250g"
      default: '250g',
    },
    // Images array — supports multiple product images
    images: [
      {
        type: String,  // URL of image
      }
    ],
    // Main image (first image or featured)
    img: {
      type: String,
      required: [true, 'Product image is required'],
    },
    ingredients: [{ type: String }],
    nutrition: [[String]],  // [["Calories", "142 kcal"], ...]
    info: {
      type: String,  // Shelf life, FSSAI etc.
    },
    rating: {
      type: Number,
      default: 4.5,
      min: 0,
      max: 5,
    },
    reviews: {
      type: Number,
      default: 0,
    },
    inStock: {
      type: Boolean,
      default: true,
    },
    // The % off retail price a partner sees when ordering through their
    // portal — e.g. 30 means a partner pays 70% of the listed price.
    // Purely informational for the partner's own order request; the admin
    // still sets the final, binding unitPrice when approving into a real
    // Consignment (same as any manually-dispatched consignment).
    partnerDiscountPercent: {
      type: Number,
      default: 30,
      min: 0,
      max: 90,
    },
    featured: {
      type: Boolean,
      default: false,  // Show on homepage
    },
    sortOrder: {
      type: Number,
      default: 0,  // Control display order
    },
  },
  { timestamps: true }
);

// Auto-generate slug from name before saving
productSchema.pre('save', function (next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim();
  }
  next();
});

// Text search index
productSchema.index({ name: 'text', sub: 'text', desc: 'text' });

module.exports = mongoose.model('Product', productSchema);