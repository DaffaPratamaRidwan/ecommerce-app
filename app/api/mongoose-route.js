import connectToDatabase from '@/lib/mongodb';
import Product from '@/models/Product';
import User from '@/models/User';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

// Helper to verify JWT token
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Helper to get user from token
function getUserFromRequest(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  return verifyToken(token);
}

// Initialize dummy products
async function initializeDummyProducts() {
  const count = await Product.countDocuments();
  
  if (count === 0) {
    const dummyProducts = [
      {
        name: 'Wireless Bluetooth Headphones',
        description: 'Premium sound quality with active noise cancellation. 30-hour battery life.',
        price: 149.99,
        category: 'electronics',
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop',
        stock: 50,
        rating: 4.5,
        featured: true
      },
      {
        name: 'Smart Watch Series 5',
        description: 'Track your fitness goals with advanced health monitoring features.',
        price: 299.99,
        category: 'electronics',
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop',
        stock: 30,
        rating: 4.7,
        featured: true
      },
      {
        name: 'Laptop Backpack',
        description: 'Durable and stylish backpack with multiple compartments for your laptop and accessories.',
        price: 59.99,
        category: 'other',
        image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=500&fit=crop',
        stock: 100,
        rating: 4.3,
        featured: false
      },
      {
        name: 'Wireless Mouse',
        description: 'Ergonomic design with precise tracking and long battery life.',
        price: 29.99,
        category: 'electronics',
        image: 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=500&h=500&fit=crop',
        stock: 75,
        rating: 4.4,
        featured: false
      },
      {
        name: 'Classic White T-Shirt',
        description: 'Premium cotton t-shirt, perfect for everyday wear.',
        price: 24.99,
        category: 'clothing',
        image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=500&fit=crop',
        stock: 200,
        rating: 4.2,
        featured: false
      },
      {
        name: 'Running Shoes',
        description: 'Comfortable and lightweight running shoes with excellent cushioning.',
        price: 89.99,
        category: 'clothing',
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop',
        stock: 60,
        rating: 4.6,
        featured: true
      },
      {
        name: 'Stainless Steel Water Bottle',
        description: 'Insulated water bottle keeps drinks cold for 24 hours or hot for 12 hours.',
        price: 34.99,
        category: 'home',
        image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&h=500&fit=crop',
        stock: 120,
        rating: 4.5,
        featured: false
      },
      {
        name: 'Yoga Mat',
        description: 'Non-slip yoga mat with extra cushioning for comfort during workouts.',
        price: 39.99,
        category: 'sports',
        image: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=500&h=500&fit=crop',
        stock: 80,
        rating: 4.4,
        featured: false
      }
    ];

    await Product.insertMany(dummyProducts);
    console.log('Dummy products initialized with Mongoose');
  }
}

export async function GET(request, { params }) {
  try {
    await connectToDatabase();
    const path = params?.path || [];
    const pathString = path.join('/');

    // Initialize dummy products
    await initializeDummyProducts();

    // Get all products
    if (pathString === 'products' || pathString === '') {
      const products = await Product.find({}).sort({ createdAt: -1 });
      return NextResponse.json({ success: true, products });
    }

    // Get single product
    if (pathString.startsWith('products/')) {
      const productId = pathString.split('/')[1];
      const product = await Product.findById(productId);
      
      if (!product) {
        return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
      }
      
      return NextResponse.json({ success: true, product });
    }

    // Get featured products
    if (pathString === 'products/featured') {
      const products = await Product.getFeatured();
      return NextResponse.json({ success: true, products });
    }

    // Get products by category
    if (pathString.startsWith('products/category/')) {
      const category = pathString.split('/')[2];
      const products = await Product.getByCategory(category);
      return NextResponse.json({ success: true, products });
    }

    // Get user profile
    if (pathString === 'user/profile') {
      const user = getUserFromRequest(request);
      if (!user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }

      const userProfile = await User.findById(user.userId);
      if (!userProfile) {
        return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
      }

      return NextResponse.json({ success: true, user: userProfile.toProfileJSON() });
    }

    return NextResponse.json({ success: false, error: 'Route not found' }, { status: 404 });
  } catch (error) {
    console.error('GET Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    await connectToDatabase();
    const path = params?.path || [];
    const pathString = path.join('/');
    const body = await request.json();

    // User registration
    if (pathString === 'register') {
      const { email, password, name } = body;
      
      if (!email || !password || !name) {
        return NextResponse.json({ success: false, error: 'All fields are required' }, { status: 400 });
      }

      const existingUser = await User.findOne({ email });
      
      if (existingUser) {
        return NextResponse.json({ success: false, error: 'Email already exists' }, { status: 400 });
      }

      const newUser = new User({
        email,
        password,
        name
      });

      await newUser.save();
      
      const token = jwt.sign({ userId: newUser._id, email }, JWT_SECRET, { expiresIn: '7d' });
      
      return NextResponse.json({ 
        success: true, 
        message: 'Registration successful',
        token,
        user: newUser.toProfileJSON()
      });
    }

    // User login
    if (pathString === 'login') {
      const { email, password } = body;
      
      if (!email || !password) {
        return NextResponse.json({ success: false, error: 'Email and password are required' }, { status: 400 });
      }

      const user = await User.findOne({ email });
      
      if (!user) {
        return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
      }

      const isPasswordValid = await user.comparePassword(password);
      
      if (!isPasswordValid) {
        return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
      }

      const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
      
      return NextResponse.json({ 
        success: true, 
        message: 'Login successful',
        token,
        user: user.toProfileJSON()
      });
    }

    // Create new product (admin only)
    if (pathString === 'products') {
      const user = getUserFromRequest(request);
      if (!user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }

      const userProfile = await User.findById(user.userId);
      if (!userProfile || userProfile.role !== 'admin') {
        return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
      }

      const { name, description, price, category, image, stock, featured } = body;
      
      if (!name || !description || !price || !category) {
        return NextResponse.json({ success: false, error: 'Required fields missing' }, { status: 400 });
      }

      const newProduct = new Product({
        name,
        description,
        price,
        category,
        image,
        stock,
        featured
      });

      await newProduct.save();
      
      return NextResponse.json({ success: true, message: 'Product created', product: newProduct });
    }

    // Add to cart
    if (pathString === 'cart') {
      const user = getUserFromRequest(request);
      if (!user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }

      const { productId, quantity = 1 } = body;
      
      if (!productId) {
        return NextResponse.json({ success: false, error: 'Product ID is required' }, { status: 400 });
      }

      const product = await Product.findById(productId);
      
      if (!product) {
        return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
      }

      const userProfile = await User.findById(user.userId);
      
      const existingItemIndex = userProfile.cart.findIndex(item => 
        item.product.toString() === productId
      );
      
      if (existingItemIndex > -1) {
        userProfile.cart[existingItemIndex].quantity += quantity;
      } else {
        userProfile.cart.push({
          product: productId,
          quantity
        });
      }

      await userProfile.save();

      return NextResponse.json({ success: true, message: 'Added to cart', cart: userProfile.cart });
    }

    return NextResponse.json({ success: false, error: 'Route not found' }, { status: 404 });
  } catch (error) {
    console.error('POST Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    await connectToDatabase();
    const path = params?.path || [];
    const pathString = path.join('/');
    const body = await request.json();

    // Update cart item quantity
    if (pathString === 'cart') {
      const user = getUserFromRequest(request);
      if (!user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }

      const { productId, quantity } = body;
      
      if (!productId || quantity === undefined) {
        return NextResponse.json({ success: false, error: 'Product ID and quantity are required' }, { status: 400 });
      }

      const userProfile = await User.findById(user.userId);
      if (!userProfile) {
        return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
      }

      const itemIndex = userProfile.cart.findIndex(item => 
        item.product.toString() === productId
      );
      
      if (itemIndex === -1) {
        return NextResponse.json({ success: false, error: 'Item not found in cart' }, { status: 404 });
      }

      if (quantity <= 0) {
        userProfile.cart.splice(itemIndex, 1);
      } else {
        userProfile.cart[itemIndex].quantity = quantity;
      }

      await userProfile.save();

      return NextResponse.json({ success: true, message: 'Cart updated', cart: userProfile.cart });
    }

    // Update product (admin only)
    if (pathString.startsWith('products/')) {
      const user = getUserFromRequest(request);
      if (!user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }

      const userProfile = await User.findById(user.userId);
      if (!userProfile || userProfile.role !== 'admin') {
        return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
      }

      const productId = pathString.split('/')[1];
      const updateData = body;

      const product = await Product.findByIdAndUpdate(
        productId,
        updateData,
        { new: true, runValidators: true }
      );

      if (!product) {
        return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
      }

      return NextResponse.json({ success: true, message: 'Product updated', product });
    }

    return NextResponse.json({ success: false, error: 'Route not found' }, { status: 404 });
  } catch (error) {
    console.error('PUT Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectToDatabase();
    const path = params?.path || [];
    const pathString = path.join('/');

    // Remove item from cart
    if (pathString.startsWith('cart/')) {
      const user = getUserFromRequest(request);
      if (!user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }

      const productId = pathString.split('/')[1];
      const userProfile = await User.findById(user.userId);

      if (!userProfile) {
        return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
      }

      userProfile.cart = userProfile.cart.filter(item => 
        item.product.toString() !== productId
      );

      await userProfile.save();

      return NextResponse.json({ success: true, message: 'Item removed from cart', cart: userProfile.cart });
    }

    // Delete product (admin only)
    if (pathString.startsWith('products/')) {
      const user = getUserFromRequest(request);
      if (!user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }

      const userProfile = await User.findById(user.userId);
      if (!userProfile || userProfile.role !== 'admin') {
        return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
      }

      const productId = pathString.split('/')[1];
      const product = await Product.findByIdAndDelete(productId);

      if (!product) {
        return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
      }

      return NextResponse.json({ success: true, message: 'Product deleted' });
    }

    return NextResponse.json({ success: false, error: 'Route not found' }, { status: 404 });
  } catch (error) {
    console.error('DELETE Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
