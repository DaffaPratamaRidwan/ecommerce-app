'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart, User, LogOut, Search, ShoppingBag, Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function App() {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [orders, setOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [currentView, setCurrentView] = useState('products'); // products, cart, orders, product-detail
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // login or register
  const [showCheckoutDialog, setShowCheckoutDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Form states
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', password: '' });
  const [checkoutForm, setCheckoutForm] = useState({ 
    address: '', 
    city: '', 
    zipCode: '', 
    paymentMethod: 'credit-card' 
  });

  useEffect(() => {
    // Check for stored token
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
      fetchCart(token);
      fetchOrders(token);
    }
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      if (data.success) {
        setProducts(data.products);
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to fetch products', variant: 'destructive' });
    }
  };

  const fetchCart = async (token) => {
    try {
      const response = await fetch('/api/cart', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setCart(data.cart || { items: [], total: 0 });
      }
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    }
  };

  const fetchOrders = async (token) => {
    try {
      const response = await fetch('/api/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });
      const data = await response.json();
      
      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        setShowAuthDialog(false);
        toast({ title: 'Success', description: 'Logged in successfully!' });
        fetchCart(data.token);
        fetchOrders(data.token);
        setLoginForm({ email: '', password: '' });
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to login', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerForm)
      });
      const data = await response.json();
      
      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        setShowAuthDialog(false);
        toast({ title: 'Success', description: 'Registration successful!' });
        fetchCart(data.token);
        setRegisterForm({ name: '', email: '', password: '' });
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to register', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setCart({ items: [], total: 0 });
    setOrders([]);
    setCurrentView('products');
    toast({ title: 'Success', description: 'Logged out successfully' });
  };

  const addToCart = async (product) => {
    if (!user) {
      toast({ title: 'Login Required', description: 'Please login to add items to cart' });
      setShowAuthDialog(true);
      return;
    }

    const token = localStorage.getItem('token');
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ productId: product.id, quantity: 1 })
      });
      const data = await response.json();
      
      if (data.success) {
        setCart(data.cart);
        toast({ title: 'Success', description: `${product.name} added to cart!` });
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to add to cart', variant: 'destructive' });
    }
  };

  const updateCartQuantity = async (productId, newQuantity) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('/api/cart', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ productId, quantity: newQuantity })
      });
      const data = await response.json();
      
      if (data.success) {
        setCart(data.cart);
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update cart', variant: 'destructive' });
    }
  };

  const removeFromCart = async (productId) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`/api/cart/${productId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.success) {
        setCart(data.cart);
        toast({ title: 'Success', description: 'Item removed from cart' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to remove item', variant: 'destructive' });
    }
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    setLoading(true);
    
    try {
      const shippingAddress = `${checkoutForm.address}, ${checkoutForm.city}, ${checkoutForm.zipCode}`;
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          shippingAddress, 
          paymentMethod: checkoutForm.paymentMethod 
        })
      });
      const data = await response.json();
      
      if (data.success) {
        setCart({ items: [], total: 0 });
        setShowCheckoutDialog(false);
        toast({ title: 'Success', description: 'Order placed successfully!' });
        setCurrentView('orders');
        fetchOrders(token);
        setCheckoutForm({ address: '', city: '', zipCode: '', paymentMethod: 'credit-card' });
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to place order', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['All', ...new Set(products.map(p => p.category))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <Toaster />
      
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg shadow-lg sticky top-0 z-50 border-b border-gray-100">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div 
              className="flex items-center space-x-3 cursor-pointer group"
              onClick={() => setCurrentView('products')}
            >
              <div className="relative">
                <ShoppingBag className="h-9 w-9 text-indigo-600 group-hover:text-indigo-700 transition-colors" />
                <div className="absolute -inset-1 bg-indigo-600/20 rounded-lg blur-sm group-hover:bg-indigo-600/30 transition-colors"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Good Stuffs</h1>
                <p className="text-xs text-gray-500">Premium Shopping Experience</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {user ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentView('orders')}
                    className="text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                  >
                    My Orders
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative hover:bg-indigo-50 transition-all"
                    onClick={() => setCurrentView('cart')}
                  >
                    <ShoppingCart className="h-5 w-5 text-gray-600 group-hover:text-indigo-600" />
                    {cart.items.length > 0 && (
                      <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-0">
                        {cart.items.length}
                      </Badge>
                    )}
                  </Button>
                  <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-full">
                    <User className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">{user.name}</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleLogout} className="border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all">
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </>
              ) : (
                <Button 
                  onClick={() => { setAuthMode('login'); setShowAuthDialog(true); }}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all"
                >
                  Login / Register
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {currentView === 'products' && (
          <div>
            {/* Search and Filter */}
            <div className="mb-8 space-y-6">
              <div className="relative max-w-2xl mx-auto">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search for amazing products..."
                  className="pl-12 py-4 text-lg border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-full shadow-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="flex gap-3 flex-wrap justify-center">
                {categories.map(category => (
                  <Badge
                    key={category}
                    variant={selectedCategory === category ? 'default' : 'outline'}
                    className={`cursor-pointer px-5 py-2 text-sm font-medium transition-all ${
                      selectedCategory === category 
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-0 shadow-md' 
                        : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 text-black'
                    }`}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map(product => (
                <Card key={product.id} className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-gray-100 hover:border-indigo-200 overflow-hidden">
                  <div onClick={() => { setSelectedProduct(product); setCurrentView('product-detail'); }}>
                    <div className="relative overflow-hidden">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-3 right-3">
                        <Badge className="bg-white/90 text-gray-700 border-0 shadow-sm">
                          {product.category}
                        </Badge>
                      </div>
                    </div>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg line-clamp-1 group-hover:text-indigo-600 transition-colors">{product.name}</CardTitle>
                      <CardDescription className="line-clamp-2 text-white">{product.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">${product.price}</span>
                        <div className="flex items-center space-x-1">
                          <span className="text-yellow-500">⭐</span>
                          <span className="text-sm text-white">{product.rating}</span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        Stock: <span className={`font-medium ${product.stock < 10 ? 'text-red-500' : 'text-green-500'}`}>{product.stock}</span> units
                      </div>
                    </CardContent>
                  </div>
                  <CardFooter className="pt-0">
                    <Button 
                      className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0 shadow-md hover:shadow-lg transition-all" 
                      onClick={() => addToCart(product)}
                    >
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Add to Cart
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        )}

        {currentView === 'product-detail' && selectedProduct && (
          <div className="max-w-6xl mx-auto">
            <Button 
              variant="outline" 
              className="mb-6 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all" 
              onClick={() => setCurrentView('products')}
            >
              ← Back to Products
            </Button>
            <Card className="overflow-hidden border-gray-100 shadow-lg">
              <div className="grid md:grid-cols-2 gap-8 p-8">
                <div>
                  <div className="relative overflow-hidden rounded-lg">
                    <img
                      src={selectedProduct.image}
                      alt={selectedProduct.name}
                      className="w-full h-96 object-cover"
                    />
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-white/90 text-gray-700 border-0 shadow-sm">
                        {selectedProduct.category}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  <div>
                    <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{selectedProduct.name}</h1>
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="flex items-center space-x-1">
                        <span className="text-yellow-500 text-lg">⭐</span>
                        <span className="text-lg font-semibold text-white">{selectedProduct.rating}</span>
                      </div>
                      <span className="text-gray-400">|</span>
                      <span className="text-white">{selectedProduct.category}</span>
                    </div>
                    <p className="text-white text-lg leading-relaxed">{selectedProduct.description}</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-baseline space-x-2">
                      <span className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">${selectedProduct.price}</span>
                      <span className="text-gray-500">USD</span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-white">Stock Availability</span>
                        <span className={`font-semibold ${selectedProduct.stock < 10 ? 'text-red-500' : 'text-green-500'}`}>
                          {selectedProduct.stock < 10 ? `Only ${selectedProduct.stock} left!` : `${selectedProduct.stock} units available`}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    size="lg" 
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all text-lg py-6" 
                    onClick={() => addToCart(selectedProduct)}
                  >
                    <ShoppingCart className="mr-3 h-6 w-6" />
                    Add to Cart
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {currentView === 'cart' && (
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h2 className="text-4xl font-bold mb-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Shopping Cart</h2>
              <p className="text-gray-600">Review your items before checkout</p>
            </div>
            {cart.items.length === 0 ? (
              <Card className="border-gray-100 shadow-sm">
                <CardContent className="p-16 text-center">
                  <div className="relative inline-block mb-6">
                    <ShoppingCart className="h-20 w-20 mx-auto text-gray-300" />
                    <div className="absolute -inset-2 bg-gray-100 rounded-full blur-xl"></div>
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-700 mb-3">Your cart is empty</h3>
                  <p className="text-gray-500 mb-6">Add some amazing products to get started!</p>
                  <Button 
                    onClick={() => setCurrentView('products')}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0 shadow-md hover:shadow-lg transition-all"
                  >
                    Continue Shopping
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {cart.items.map(item => (
                  <Card key={item.productId} className="border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-6">
                        <div className="relative overflow-hidden rounded-lg">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-28 h-28 object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-xl mb-1">{item.name}</h3>
                          <p className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">${item.price}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Button
                            variant="outline"
                            size="icon"
                            className="border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all"
                            onClick={() => updateCartQuantity(item.productId, item.quantity - 1)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-16 text-center font-semibold text-lg">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all"
                            onClick={() => updateCartQuantity(item.productId, item.quantity + 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-2xl mb-2">${(item.price * item.quantity).toFixed(2)}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 transition-all"
                            onClick={() => removeFromCart(item.productId)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                <Card className="border-gray-100 shadow-lg">
                  <CardContent className="p-8">
                    <div className="flex justify-between items-center mb-6">
                      <span className="text-2xl font-semibold">Total Amount:</span>
                      <span className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">${cart.total.toFixed(2)}</span>
                    </div>
                    <div className="flex gap-4">
                      <Button 
                        variant="outline" 
                        className="flex-1 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all text-lg py-3" 
                        onClick={() => setCurrentView('products')}
                      >
                        Continue Shopping
                      </Button>
                      <Button 
                        className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all text-lg py-3" 
                        onClick={() => setShowCheckoutDialog(true)}
                      >
                        Proceed to Checkout
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}

        {currentView === 'orders' && (
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h2 className="text-4xl font-bold mb-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">My Orders</h2>
              <p className="text-gray-600">Track your order history and status</p>
            </div>
            {orders.length === 0 ? (
              <Card className="border-gray-100 shadow-sm">
                <CardContent className="p-16 text-center">
                  <div className="relative inline-block mb-6">
                    <ShoppingBag className="h-20 w-20 mx-auto text-gray-300" />
                    <div className="absolute -inset-2 bg-gray-100 rounded-full blur-xl"></div>
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-700 mb-3">No orders yet</h3>
                  <p className="text-gray-500 mb-6">Start shopping to see your order history!</p>
                  <Button 
                    onClick={() => setCurrentView('products')}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0 shadow-md hover:shadow-lg transition-all"
                  >
                    Start Shopping
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {orders.map(order => (
                  <Card key={order.id} className="border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="pb-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl mb-1">Order #{order.id.substring(0, 8)}</CardTitle>
                          <CardDescription className="text-gray-500">
                            {new Date(order.createdAt).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </CardDescription>
                        </div>
                        <Badge className={`px-3 py-1 ${
                          order.status === 'Delivered' ? 'bg-green-100 text-green-700 border-0' :
                          order.status === 'Processing' ? 'bg-blue-100 text-blue-700 border-0' :
                          order.status === 'Shipped' ? 'bg-purple-100 text-purple-700 border-0' :
                          'bg-gray-100 text-gray-700 border-0'
                        }`}>
                          {order.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                            <div>
                              <span className="font-medium">{item.name}</span>
                              <span className="text-gray-500 ml-2">x {item.quantity}</span>
                            </div>
                            <span className="font-semibold text-lg">${(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                        <div className="pt-3 mt-3 border-t border-gray-200">
                          <div className="flex justify-between items-center">
                            <span className="text-xl font-semibold">Total:</span>
                            <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">${order.total.toFixed(2)}</span>
                          </div>
                        </div>
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm text-gray-600">
                            <span className="font-semibold">Shipping Address:</span>
                            <div className="mt-1">{order.shippingAddress}</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Auth Dialog */}
      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent className="sm:max-w-md border-gray-100 shadow-xl">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              {authMode === 'login' ? 'Login to access your account' : 'Join us for a premium shopping experience'}
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={authMode} onValueChange={setAuthMode} className="mt-4">
            <TabsList className="grid w-full grid-cols-2 bg-gray-100">
              <TabsTrigger value="login" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Login</TabsTrigger>
              <TabsTrigger value="register" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="mt-6">
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <Label htmlFor="login-email" className="text-sm font-medium text-gray-700">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    required
                    className="mt-1 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Enter your email"
                  />
                </div>
                <div>
                  <Label htmlFor="login-password" className="text-sm font-medium text-gray-700">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    required
                    className="mt-1 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Enter your password"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0 shadow-md hover:shadow-lg transition-all py-3" 
                  disabled={loading}
                >
                  {loading ? 'Logging in...' : 'Login'}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="register" className="mt-6">
              <form onSubmit={handleRegister} className="space-y-5">
                <div>
                  <Label htmlFor="register-name" className="text-sm font-medium text-gray-700">Name</Label>
                  <Input
                    id="register-name"
                    type="text"
                    value={registerForm.name}
                    onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                    required
                    className="mt-1 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Enter your name"
                  />
                </div>
                <div>
                  <Label htmlFor="register-email" className="text-sm font-medium text-gray-700">Email</Label>
                  <Input
                    id="register-email"
                    type="email"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                    required
                    className="mt-1 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Enter your email"
                  />
                </div>
                <div>
                  <Label htmlFor="register-password" className="text-sm font-medium text-gray-700">Password</Label>
                  <Input
                    id="register-password"
                    type="password"
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                    required
                    className="mt-1 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Create a password"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0 shadow-md hover:shadow-lg transition-all py-3" 
                  disabled={loading}
                >
                  {loading ? 'Registering...' : 'Register'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Checkout Dialog */}
      <Dialog open={showCheckoutDialog} onOpenChange={setShowCheckoutDialog}>
        <DialogContent className="sm:max-w-lg border-gray-100 shadow-xl">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Checkout</DialogTitle>
            <DialogDescription className="text-gray-600">Complete your order details</DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCheckout} className="space-y-5 mt-4">
            <div>
              <Label htmlFor="address" className="text-sm font-medium text-gray-700">Street Address</Label>
              <Input
                id="address"
                value={checkoutForm.address}
                onChange={(e) => setCheckoutForm({ ...checkoutForm, address: e.target.value })}
                required
                placeholder="123 Main Street"
                className="mt-1 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city" className="text-sm font-medium text-gray-700">City</Label>
                <Input
                  id="city"
                  value={checkoutForm.city}
                  onChange={(e) => setCheckoutForm({ ...checkoutForm, city: e.target.value })}
                  required
                  placeholder="New York"
                  className="mt-1 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <Label htmlFor="zipCode" className="text-sm font-medium text-gray-700">Zip Code</Label>
                <Input
                  id="zipCode"
                  value={checkoutForm.zipCode}
                  onChange={(e) => setCheckoutForm({ ...checkoutForm, zipCode: e.target.value })}
                  required
                  placeholder="10001"
                  className="mt-1 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="paymentMethod" className="text-sm font-medium text-gray-700">Payment Method</Label>
              <Select 
                value={checkoutForm.paymentMethod} 
                onValueChange={(value) => setCheckoutForm({ ...checkoutForm, paymentMethod: value })}
              >
                <SelectTrigger className="mt-1 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit-card">Credit Card</SelectItem>
                  <SelectItem value="debit-card">Debit Card</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="cash-on-delivery">Cash on Delivery</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Separator className="my-6" />
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-700">Total Amount:</span>
                <span className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">${cart.total.toFixed(2)}</span>
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all py-3 text-lg" 
              disabled={loading}
            >
              {loading ? 'Placing Order...' : 'Place Order'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}