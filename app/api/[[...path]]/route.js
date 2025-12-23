import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { NextResponse } from 'next/server';

const MONGO_URL = process.env.MONGO_URL;
const DB_NAME = process.env.DB_NAME || 'ecommerce_store';
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = await MongoClient.connect(MONGO_URL);
  const db = client.db(DB_NAME);

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

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
async function initializeDummyProducts(db) {
  const productsCollection = db.collection('products');
  const count = await productsCollection.countDocuments();
  
  if (count === 0) {
    const dummyProducts = [
      {
        id: uuidv4(),
        name: 'Wireless Bluetooth Headphones',
        description: 'Premium sound quality with active noise cancellation. 30-hour battery life.',
        price: 149.99,
        category: 'Electronics',
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop',
        stock: 50,
        rating: 4.5,
        createdAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Smart Watch Series 5',
        description: 'Track your fitness goals with advanced health monitoring features.',
        price: 299.99,
        category: 'Electronics',
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop',
        stock: 30,
        rating: 4.7,
        createdAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Laptop Backpack',
        description: 'Durable and stylish backpack with multiple compartments for your laptop and accessories.',
        price: 59.99,
        category: 'Accessories',
        image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=500&fit=crop',
        stock: 100,
        rating: 4.3,
        createdAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Wireless Mouse',
        description: 'Ergonomic design with precise tracking and long battery life.',
        price: 29.99,
        category: 'Electronics',
        image: 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=500&h=500&fit=crop',
        stock: 75,
        rating: 4.4,
        createdAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Classic White T-Shirt',
        description: 'Premium cotton t-shirt, perfect for everyday wear.',
        price: 24.99,
        category: 'Fashion',
        image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=500&fit=crop',
        stock: 200,
        rating: 4.2,
        createdAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Running Shoes',
        description: 'Comfortable and lightweight running shoes with excellent cushioning.',
        price: 89.99,
        category: 'Fashion',
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop',
        stock: 60,
        rating: 4.6,
        createdAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Stainless Steel Water Bottle',
        description: 'Insulated water bottle keeps drinks cold for 24 hours or hot for 12 hours.',
        price: 34.99,
        category: 'Home & Kitchen',
        image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&h=500&fit=crop',
        stock: 120,
        rating: 4.5,
        createdAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Yoga Mat',
        description: 'Non-slip yoga mat with extra cushioning for comfort during workouts.',
        price: 39.99,
        category: 'Sports',
        image: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=500&h=500&fit=crop',
        stock: 80,
        rating: 4.4,
        createdAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Coffee Maker',
        description: 'Programmable coffee maker with 12-cup capacity and auto shut-off.',
        price: 79.99,
        category: 'Home & Kitchen',
        image: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=500&h=500&fit=crop',
        stock: 40,
        rating: 4.3,
        createdAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Desk Lamp',
        description: 'LED desk lamp with adjustable brightness and color temperature.',
        price: 44.99,
        category: 'Home & Kitchen',
        image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500&h=500&fit=crop',
        stock: 90,
        rating: 4.6,
        createdAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Portable Speaker',
        description: 'Waterproof Bluetooth speaker with 360-degree sound.',
        price: 69.99,
        category: 'Electronics',
        image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500&h=500&fit=crop',
        stock: 55,
        rating: 4.5,
        createdAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Sunglasses',
        description: 'Polarized sunglasses with UV protection and stylish design.',
        price: 54.99,
        category: 'Fashion',
        image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500&h=500&fit=crop',
        stock: 110,
        rating: 4.4,
        createdAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Phone Case',
        description: 'Protective phone case with shock-absorbing corners.',
        price: 19.99,
        category: 'Accessories',
        image: 'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=500&h=500&fit=crop',
        stock: 150,
        rating: 4.2,
        createdAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Gaming Keyboard',
        description: 'Mechanical gaming keyboard with RGB backlighting.',
        price: 129.99,
        category: 'Electronics',
        image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&h=500&fit=crop',
        stock: 35,
        rating: 4.7,
        createdAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Hoodie',
        description: 'Comfortable cotton blend hoodie, perfect for casual wear.',
        price: 49.99,
        category: 'Fashion',
        image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500&h=500&fit=crop',
        stock: 85,
        rating: 4.5,
        createdAt: new Date()
      }
    ];

    await productsCollection.insertMany(dummyProducts);
    console.log('Dummy products initialized');
  }
}

export async function GET(request, { params }) {
  try {
    const { db } = await connectToDatabase();
    const path = params?.path || [];
    const pathString = path.join('/');

    // Initialize dummy products
    await initializeDummyProducts(db);

    // Get all products
    if (pathString === 'products' || pathString === '') {
      const productsCollection = db.collection('products');
      const products = await productsCollection.find({}).toArray();
      return NextResponse.json({ success: true, products });
    }

    // Get single product
    if (pathString.startsWith('products/')) {
      const productId = pathString.split('/')[1];
      const productsCollection = db.collection('products');
      const product = await productsCollection.findOne({ id: productId });
      
      if (!product) {
        return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
      }
      
      return NextResponse.json({ success: true, product });
    }

    // Get user's cart
    if (pathString === 'cart') {
      const user = getUserFromRequest(request);
      if (!user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }

      const cartsCollection = db.collection('carts');
      const cart = await cartsCollection.findOne({ userId: user.userId });
      
      if (!cart) {
        return NextResponse.json({ success: true, cart: { items: [], total: 0 } });
      }

      return NextResponse.json({ success: true, cart });
    }

    // Get user's orders
    if (pathString === 'orders') {
      const user = getUserFromRequest(request);
      if (!user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }

      const ordersCollection = db.collection('orders');
      const orders = await ordersCollection.find({ userId: user.userId }).sort({ createdAt: -1 }).toArray();
      
      return NextResponse.json({ success: true, orders });
    }

    return NextResponse.json({ success: false, error: 'Route not found' }, { status: 404 });
  } catch (error) {
    console.error('GET Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const { db } = await connectToDatabase();
    const path = params?.path || [];
    const pathString = path.join('/');
    const body = await request.json();

    // User registration
    if (pathString === 'register') {
      const { email, password, name } = body;
      
      if (!email || !password || !name) {
        return NextResponse.json({ success: false, error: 'All fields are required' }, { status: 400 });
      }

      const usersCollection = db.collection('users');
      const existingUser = await usersCollection.findOne({ email });
      
      if (existingUser) {
        return NextResponse.json({ success: false, error: 'Email already exists' }, { status: 400 });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const userId = uuidv4();
      
      const newUser = {
        id: userId,
        email,
        password: hashedPassword,
        name,
        createdAt: new Date()
      };

      await usersCollection.insertOne(newUser);
      
      const token = jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '7d' });
      
      return NextResponse.json({ 
        success: true, 
        message: 'Registration successful',
        token,
        user: { id: userId, email, name }
      });
    }

    // User login
    if (pathString === 'login') {
      const { email, password } = body;
      
      if (!email || !password) {
        return NextResponse.json({ success: false, error: 'Email and password are required' }, { status: 400 });
      }

      const usersCollection = db.collection('users');
      const user = await usersCollection.findOne({ email });
      
      if (!user) {
        return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
      }

      const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
      
      return NextResponse.json({ 
        success: true, 
        message: 'Login successful',
        token,
        user: { id: user.id, email: user.email, name: user.name }
      });
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

      // Get product details
      const productsCollection = db.collection('products');
      const product = await productsCollection.findOne({ id: productId });
      
      if (!product) {
        return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
      }

      const cartsCollection = db.collection('carts');
      let cart = await cartsCollection.findOne({ userId: user.userId });

      if (!cart) {
        cart = {
          userId: user.userId,
          items: [],
          total: 0,
          updatedAt: new Date()
        };
      }

      const existingItemIndex = cart.items.findIndex(item => item.productId === productId);
      
      if (existingItemIndex > -1) {
        cart.items[existingItemIndex].quantity += quantity;
      } else {
        cart.items.push({
          productId,
          name: product.name,
          price: product.price,
          image: product.image,
          quantity
        });
      }

      cart.total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      cart.updatedAt = new Date();

      await cartsCollection.updateOne(
        { userId: user.userId },
        { $set: cart },
        { upsert: true }
      );

      return NextResponse.json({ success: true, message: 'Added to cart', cart });
    }

    // Place order
    if (pathString === 'orders') {
      const user = getUserFromRequest(request);
      if (!user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }

      const { shippingAddress, paymentMethod } = body;
      
      if (!shippingAddress || !paymentMethod) {
        return NextResponse.json({ success: false, error: 'Shipping address and payment method are required' }, { status: 400 });
      }

      // Get cart
      const cartsCollection = db.collection('carts');
      const cart = await cartsCollection.findOne({ userId: user.userId });
      
      if (!cart || cart.items.length === 0) {
        return NextResponse.json({ success: false, error: 'Cart is empty' }, { status: 400 });
      }

      // Create order
      const ordersCollection = db.collection('orders');
      const orderId = uuidv4();
      
      const order = {
        id: orderId,
        userId: user.userId,
        items: cart.items,
        total: cart.total,
        shippingAddress,
        paymentMethod,
        status: 'pending',
        createdAt: new Date()
      };

      await ordersCollection.insertOne(order);

      // Clear cart
      await cartsCollection.deleteOne({ userId: user.userId });

      return NextResponse.json({ success: true, message: 'Order placed successfully', order });
    }

    return NextResponse.json({ success: false, error: 'Route not found' }, { status: 404 });
  } catch (error) {
    console.error('POST Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { db } = await connectToDatabase();
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

      const cartsCollection = db.collection('carts');
      const cart = await cartsCollection.findOne({ userId: user.userId });

      if (!cart) {
        return NextResponse.json({ success: false, error: 'Cart not found' }, { status: 404 });
      }

      const itemIndex = cart.items.findIndex(item => item.productId === productId);
      
      if (itemIndex === -1) {
        return NextResponse.json({ success: false, error: 'Item not found in cart' }, { status: 404 });
      }

      if (quantity <= 0) {
        cart.items.splice(itemIndex, 1);
      } else {
        cart.items[itemIndex].quantity = quantity;
      }

      cart.total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      cart.updatedAt = new Date();

      await cartsCollection.updateOne(
        { userId: user.userId },
        { $set: cart }
      );

      return NextResponse.json({ success: true, message: 'Cart updated', cart });
    }

    return NextResponse.json({ success: false, error: 'Route not found' }, { status: 404 });
  } catch (error) {
    console.error('PUT Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { db } = await connectToDatabase();
    const path = params?.path || [];
    const pathString = path.join('/');

    // Remove item from cart
    if (pathString.startsWith('cart/')) {
      const user = getUserFromRequest(request);
      if (!user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }

      const productId = pathString.split('/')[1];
      const cartsCollection = db.collection('carts');
      const cart = await cartsCollection.findOne({ userId: user.userId });

      if (!cart) {
        return NextResponse.json({ success: false, error: 'Cart not found' }, { status: 404 });
      }

      cart.items = cart.items.filter(item => item.productId !== productId);
      cart.total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      cart.updatedAt = new Date();

      await cartsCollection.updateOne(
        { userId: user.userId },
        { $set: cart }
      );

      return NextResponse.json({ success: true, message: 'Item removed from cart', cart });
    }

    return NextResponse.json({ success: false, error: 'Route not found' }, { status: 404 });
  } catch (error) {
    console.error('DELETE Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}