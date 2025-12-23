import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true,
    enum: ['electronics', 'clothing', 'books', 'home', 'sports', 'toys', 'other']
  },
  image: {
    type: String,
    default: ''
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  reviews: {
    type: Number,
    min: 0,
    default: 0
  },
  featured: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for better search performance
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });
productSchema.index({ featured: 1 });

// Virtual for product's URL
productSchema.virtual('url').get(function() {
  return `/products/${this._id}`;
});

// Method to update stock
productSchema.methods.updateStock = function(quantity) {
  this.stock += quantity;
  this.updatedAt = new Date();
  return this.save();
};

// Static method to get featured products
productSchema.statics.getFeatured = function() {
  return this.find({ featured: true }).sort({ createdAt: -1 });
};

// Static method to get products by category
productSchema.statics.getByCategory = function(category) {
  return this.find({ category }).sort({ createdAt: -1 });
};

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

export default Product;
