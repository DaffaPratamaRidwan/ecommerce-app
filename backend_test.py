#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for E-commerce Platform
Tests all endpoints: Products, Authentication, Cart, Orders
"""

import requests
import json
import uuid
import time
from datetime import datetime

# Configuration
BASE_URL = "https://ezstore-next.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}

class EcommerceAPITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.headers = HEADERS.copy()
        self.auth_token = None
        self.user_data = None
        self.test_products = []
        self.test_results = {
            "products": {},
            "auth": {},
            "cart": {},
            "orders": {}
        }
        
    def log_test(self, category, test_name, success, message, response_data=None):
        """Log test results"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"[{timestamp}] {status} {category} - {test_name}: {message}")
        
        self.test_results[category][test_name] = {
            "success": success,
            "message": message,
            "response_data": response_data,
            "timestamp": timestamp
        }
        
    def set_auth_token(self, token):
        """Set authentication token for subsequent requests"""
        self.auth_token = token
        self.headers["Authorization"] = f"Bearer {token}"
        
    def test_products_api(self):
        """Test Products API endpoints"""
        print("\n" + "="*60)
        print("TESTING PRODUCTS API")
        print("="*60)
        
        # Test 1: GET all products
        try:
            response = requests.get(f"{self.base_url}/products", headers=HEADERS, timeout=30)
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and "products" in data:
                    products = data["products"]
                    self.test_products = products
                    product_count = len(products)
                    self.log_test("products", "get_all_products", True, 
                                f"Retrieved {product_count} products successfully")
                    
                    # Verify we have 15 dummy products
                    if product_count == 15:
                        self.log_test("products", "dummy_products_count", True, 
                                    "Correct number of dummy products (15) initialized")
                    else:
                        self.log_test("products", "dummy_products_count", False, 
                                    f"Expected 15 products, got {product_count}")
                else:
                    self.log_test("products", "get_all_products", False, 
                                "Response missing success flag or products array")
            else:
                self.log_test("products", "get_all_products", False, 
                            f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("products", "get_all_products", False, f"Request failed: {str(e)}")
            
        # Test 2: GET single product
        if self.test_products:
            try:
                test_product = self.test_products[0]
                product_id = test_product["id"]
                response = requests.get(f"{self.base_url}/products/{product_id}", 
                                      headers=HEADERS, timeout=30)
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("success") and "product" in data:
                        product = data["product"]
                        if product["id"] == product_id:
                            self.log_test("products", "get_single_product", True, 
                                        f"Retrieved product '{product['name']}' successfully")
                        else:
                            self.log_test("products", "get_single_product", False, 
                                        "Product ID mismatch in response")
                    else:
                        self.log_test("products", "get_single_product", False, 
                                    "Response missing success flag or product data")
                else:
                    self.log_test("products", "get_single_product", False, 
                                f"HTTP {response.status_code}: {response.text}")
            except Exception as e:
                self.log_test("products", "get_single_product", False, f"Request failed: {str(e)}")
        
        # Test 3: GET non-existent product
        try:
            fake_id = str(uuid.uuid4())
            response = requests.get(f"{self.base_url}/products/{fake_id}", 
                                  headers=HEADERS, timeout=30)
            
            if response.status_code == 404:
                data = response.json()
                if not data.get("success"):
                    self.log_test("products", "get_nonexistent_product", True, 
                                "Correctly returned 404 for non-existent product")
                else:
                    self.log_test("products", "get_nonexistent_product", False, 
                                "Should return success=false for non-existent product")
            else:
                self.log_test("products", "get_nonexistent_product", False, 
                            f"Expected 404, got HTTP {response.status_code}")
        except Exception as e:
            self.log_test("products", "get_nonexistent_product", False, f"Request failed: {str(e)}")
            
    def test_authentication_api(self):
        """Test User Authentication endpoints"""
        print("\n" + "="*60)
        print("TESTING AUTHENTICATION API")
        print("="*60)
        
        # Generate unique test user data
        unique_id = str(uuid.uuid4())[:8]
        test_email = f"testuser_{unique_id}@example.com"
        test_password = "SecurePassword123!"
        test_name = f"Test User {unique_id}"
        
        # Test 1: User Registration
        try:
            registration_data = {
                "name": test_name,
                "email": test_email,
                "password": test_password
            }
            
            response = requests.post(f"{self.base_url}/register", 
                                   json=registration_data, headers=HEADERS, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and "token" in data and "user" in data:
                    self.auth_token = data["token"]
                    self.user_data = data["user"]
                    self.set_auth_token(self.auth_token)
                    self.log_test("auth", "user_registration", True, 
                                f"User '{test_name}' registered successfully")
                else:
                    self.log_test("auth", "user_registration", False, 
                                "Registration response missing required fields")
            else:
                self.log_test("auth", "user_registration", False, 
                            f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("auth", "user_registration", False, f"Request failed: {str(e)}")
            
        # Test 2: Duplicate Registration (should fail)
        try:
            response = requests.post(f"{self.base_url}/register", 
                                   json=registration_data, headers=HEADERS, timeout=30)
            
            if response.status_code == 400:
                data = response.json()
                if not data.get("success") and "already exists" in data.get("error", "").lower():
                    self.log_test("auth", "duplicate_registration", True, 
                                "Correctly rejected duplicate email registration")
                else:
                    self.log_test("auth", "duplicate_registration", False, 
                                "Error message doesn't indicate duplicate email")
            else:
                self.log_test("auth", "duplicate_registration", False, 
                            f"Expected 400, got HTTP {response.status_code}")
        except Exception as e:
            self.log_test("auth", "duplicate_registration", False, f"Request failed: {str(e)}")
            
        # Test 3: User Login
        try:
            login_data = {
                "email": test_email,
                "password": test_password
            }
            
            response = requests.post(f"{self.base_url}/login", 
                                   json=login_data, headers=HEADERS, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and "token" in data and "user" in data:
                    # Update token in case it's different
                    self.auth_token = data["token"]
                    self.set_auth_token(self.auth_token)
                    self.log_test("auth", "user_login", True, 
                                f"User '{test_email}' logged in successfully")
                else:
                    self.log_test("auth", "user_login", False, 
                                "Login response missing required fields")
            else:
                self.log_test("auth", "user_login", False, 
                            f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("auth", "user_login", False, f"Request failed: {str(e)}")
            
        # Test 4: Login with wrong password
        try:
            wrong_login_data = {
                "email": test_email,
                "password": "WrongPassword123!"
            }
            
            response = requests.post(f"{self.base_url}/login", 
                                   json=wrong_login_data, headers=HEADERS, timeout=30)
            
            if response.status_code == 401:
                data = response.json()
                if not data.get("success") and "invalid credentials" in data.get("error", "").lower():
                    self.log_test("auth", "wrong_password_login", True, 
                                "Correctly rejected login with wrong password")
                else:
                    self.log_test("auth", "wrong_password_login", False, 
                                "Error message doesn't indicate invalid credentials")
            else:
                self.log_test("auth", "wrong_password_login", False, 
                            f"Expected 401, got HTTP {response.status_code}")
        except Exception as e:
            self.log_test("auth", "wrong_password_login", False, f"Request failed: {str(e)}")
            
    def test_cart_api(self):
        """Test Shopping Cart endpoints"""
        print("\n" + "="*60)
        print("TESTING SHOPPING CART API")
        print("="*60)
        
        if not self.auth_token:
            self.log_test("cart", "authentication_required", False, 
                        "No auth token available - authentication tests must pass first")
            return
            
        if not self.test_products:
            self.log_test("cart", "products_required", False, 
                        "No products available - product tests must pass first")
            return
            
        test_product = self.test_products[0]
        test_product_id = test_product["id"]
        
        # Test 1: Add item to cart
        try:
            cart_data = {
                "productId": test_product_id,
                "quantity": 2
            }
            
            response = requests.post(f"{self.base_url}/cart", 
                                   json=cart_data, headers=self.headers, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and "cart" in data:
                    cart = data["cart"]
                    if len(cart["items"]) > 0 and cart["items"][0]["productId"] == test_product_id:
                        self.log_test("cart", "add_to_cart", True, 
                                    f"Added '{test_product['name']}' to cart successfully")
                    else:
                        self.log_test("cart", "add_to_cart", False, 
                                    "Cart doesn't contain the added product")
                else:
                    self.log_test("cart", "add_to_cart", False, 
                                "Response missing success flag or cart data")
            else:
                self.log_test("cart", "add_to_cart", False, 
                            f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("cart", "add_to_cart", False, f"Request failed: {str(e)}")
            
        # Test 2: Get cart
        try:
            response = requests.get(f"{self.base_url}/cart", headers=self.headers, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and "cart" in data:
                    cart = data["cart"]
                    if "items" in cart and "total" in cart:
                        item_count = len(cart["items"])
                        total = cart["total"]
                        self.log_test("cart", "get_cart", True, 
                                    f"Retrieved cart with {item_count} items, total: ${total}")
                    else:
                        self.log_test("cart", "get_cart", False, 
                                    "Cart missing items or total fields")
                else:
                    self.log_test("cart", "get_cart", False, 
                                "Response missing success flag or cart data")
            else:
                self.log_test("cart", "get_cart", False, 
                            f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("cart", "get_cart", False, f"Request failed: {str(e)}")
            
        # Test 3: Update cart item quantity
        try:
            update_data = {
                "productId": test_product_id,
                "quantity": 3
            }
            
            response = requests.put(f"{self.base_url}/cart", 
                                  json=update_data, headers=self.headers, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and "cart" in data:
                    cart = data["cart"]
                    updated_item = next((item for item in cart["items"] 
                                       if item["productId"] == test_product_id), None)
                    if updated_item and updated_item["quantity"] == 3:
                        self.log_test("cart", "update_cart_quantity", True, 
                                    "Updated cart item quantity successfully")
                    else:
                        self.log_test("cart", "update_cart_quantity", False, 
                                    "Cart item quantity not updated correctly")
                else:
                    self.log_test("cart", "update_cart_quantity", False, 
                                "Response missing success flag or cart data")
            else:
                self.log_test("cart", "update_cart_quantity", False, 
                            f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("cart", "update_cart_quantity", False, f"Request failed: {str(e)}")
            
        # Test 4: Add another product to cart
        if len(self.test_products) > 1:
            try:
                second_product = self.test_products[1]
                cart_data = {
                    "productId": second_product["id"],
                    "quantity": 1
                }
                
                response = requests.post(f"{self.base_url}/cart", 
                                       json=cart_data, headers=self.headers, timeout=30)
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("success"):
                        self.log_test("cart", "add_second_product", True, 
                                    f"Added second product '{second_product['name']}' to cart")
                    else:
                        self.log_test("cart", "add_second_product", False, 
                                    "Failed to add second product")
                else:
                    self.log_test("cart", "add_second_product", False, 
                                f"HTTP {response.status_code}: {response.text}")
            except Exception as e:
                self.log_test("cart", "add_second_product", False, f"Request failed: {str(e)}")
                
        # Test 5: Remove item from cart
        try:
            response = requests.delete(f"{self.base_url}/cart/{test_product_id}", 
                                     headers=self.headers, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and "cart" in data:
                    cart = data["cart"]
                    removed_item = next((item for item in cart["items"] 
                                       if item["productId"] == test_product_id), None)
                    if not removed_item:
                        self.log_test("cart", "remove_from_cart", True, 
                                    "Removed item from cart successfully")
                    else:
                        self.log_test("cart", "remove_from_cart", False, 
                                    "Item still exists in cart after removal")
                else:
                    self.log_test("cart", "remove_from_cart", False, 
                                "Response missing success flag or cart data")
            else:
                self.log_test("cart", "remove_from_cart", False, 
                            f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("cart", "remove_from_cart", False, f"Request failed: {str(e)}")
            
        # Test 6: Unauthorized cart access
        try:
            unauthorized_headers = {"Content-Type": "application/json"}
            response = requests.get(f"{self.base_url}/cart", headers=unauthorized_headers, timeout=30)
            
            if response.status_code == 401:
                data = response.json()
                if not data.get("success") and "unauthorized" in data.get("error", "").lower():
                    self.log_test("cart", "unauthorized_access", True, 
                                "Correctly rejected unauthorized cart access")
                else:
                    self.log_test("cart", "unauthorized_access", False, 
                                "Error message doesn't indicate unauthorized access")
            else:
                self.log_test("cart", "unauthorized_access", False, 
                            f"Expected 401, got HTTP {response.status_code}")
        except Exception as e:
            self.log_test("cart", "unauthorized_access", False, f"Request failed: {str(e)}")
            
    def test_orders_api(self):
        """Test Orders endpoints"""
        print("\n" + "="*60)
        print("TESTING ORDERS API")
        print("="*60)
        
        if not self.auth_token:
            self.log_test("orders", "authentication_required", False, 
                        "No auth token available - authentication tests must pass first")
            return
            
        # First, add items to cart for order testing
        if self.test_products:
            try:
                # Add a product to cart
                cart_data = {
                    "productId": self.test_products[0]["id"],
                    "quantity": 2
                }
                requests.post(f"{self.base_url}/cart", json=cart_data, headers=self.headers, timeout=30)
                time.sleep(1)  # Brief pause to ensure cart is updated
            except Exception as e:
                self.log_test("orders", "cart_setup", False, f"Failed to setup cart: {str(e)}")
                return
                
        # Test 1: Place order
        try:
            order_data = {
                "shippingAddress": {
                    "street": "123 Test Street",
                    "city": "Test City",
                    "state": "Test State",
                    "zipCode": "12345",
                    "country": "Test Country"
                },
                "paymentMethod": "credit_card"
            }
            
            response = requests.post(f"{self.base_url}/orders", 
                                   json=order_data, headers=self.headers, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and "order" in data:
                    order = data["order"]
                    if "id" in order and "items" in order and "total" in order:
                        self.log_test("orders", "place_order", True, 
                                    f"Order placed successfully with ID: {order['id']}")
                    else:
                        self.log_test("orders", "place_order", False, 
                                    "Order response missing required fields")
                else:
                    self.log_test("orders", "place_order", False, 
                                "Response missing success flag or order data")
            else:
                self.log_test("orders", "place_order", False, 
                            f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("orders", "place_order", False, f"Request failed: {str(e)}")
            
        # Test 2: Get user orders
        try:
            response = requests.get(f"{self.base_url}/orders", headers=self.headers, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and "orders" in data:
                    orders = data["orders"]
                    order_count = len(orders)
                    self.log_test("orders", "get_orders", True, 
                                f"Retrieved {order_count} orders successfully")
                    
                    # Verify order structure
                    if order_count > 0:
                        first_order = orders[0]
                        required_fields = ["id", "items", "total", "status", "createdAt"]
                        missing_fields = [field for field in required_fields 
                                        if field not in first_order]
                        if not missing_fields:
                            self.log_test("orders", "order_structure", True, 
                                        "Order structure contains all required fields")
                        else:
                            self.log_test("orders", "order_structure", False, 
                                        f"Order missing fields: {missing_fields}")
                else:
                    self.log_test("orders", "get_orders", False, 
                                "Response missing success flag or orders data")
            else:
                self.log_test("orders", "get_orders", False, 
                            f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("orders", "get_orders", False, f"Request failed: {str(e)}")
            
        # Test 3: Verify cart is cleared after order
        try:
            response = requests.get(f"{self.base_url}/cart", headers=self.headers, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and "cart" in data:
                    cart = data["cart"]
                    if len(cart.get("items", [])) == 0:
                        self.log_test("orders", "cart_cleared_after_order", True, 
                                    "Cart correctly cleared after order placement")
                    else:
                        self.log_test("orders", "cart_cleared_after_order", False, 
                                    "Cart still contains items after order placement")
                else:
                    self.log_test("orders", "cart_cleared_after_order", False, 
                                "Failed to retrieve cart for verification")
            else:
                self.log_test("orders", "cart_cleared_after_order", False, 
                            f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("orders", "cart_cleared_after_order", False, f"Request failed: {str(e)}")
            
        # Test 4: Place order with empty cart (should fail)
        try:
            order_data = {
                "shippingAddress": {
                    "street": "456 Another Street",
                    "city": "Another City",
                    "state": "Another State",
                    "zipCode": "67890",
                    "country": "Another Country"
                },
                "paymentMethod": "paypal"
            }
            
            response = requests.post(f"{self.base_url}/orders", 
                                   json=order_data, headers=self.headers, timeout=30)
            
            if response.status_code == 400:
                data = response.json()
                if not data.get("success") and "empty" in data.get("error", "").lower():
                    self.log_test("orders", "empty_cart_order", True, 
                                "Correctly rejected order with empty cart")
                else:
                    self.log_test("orders", "empty_cart_order", False, 
                                "Error message doesn't indicate empty cart")
            else:
                self.log_test("orders", "empty_cart_order", False, 
                            f"Expected 400, got HTTP {response.status_code}")
        except Exception as e:
            self.log_test("orders", "empty_cart_order", False, f"Request failed: {str(e)}")
            
        # Test 5: Unauthorized orders access
        try:
            unauthorized_headers = {"Content-Type": "application/json"}
            response = requests.get(f"{self.base_url}/orders", headers=unauthorized_headers, timeout=30)
            
            if response.status_code == 401:
                data = response.json()
                if not data.get("success") and "unauthorized" in data.get("error", "").lower():
                    self.log_test("orders", "unauthorized_orders_access", True, 
                                "Correctly rejected unauthorized orders access")
                else:
                    self.log_test("orders", "unauthorized_orders_access", False, 
                                "Error message doesn't indicate unauthorized access")
            else:
                self.log_test("orders", "unauthorized_orders_access", False, 
                            f"Expected 401, got HTTP {response.status_code}")
        except Exception as e:
            self.log_test("orders", "unauthorized_orders_access", False, f"Request failed: {str(e)}")
            
    def print_summary(self):
        """Print comprehensive test summary"""
        print("\n" + "="*80)
        print("COMPREHENSIVE TEST SUMMARY")
        print("="*80)
        
        total_tests = 0
        passed_tests = 0
        failed_tests = 0
        
        for category, tests in self.test_results.items():
            if not tests:
                continue
                
            print(f"\n{category.upper()} TESTS:")
            print("-" * 40)
            
            for test_name, result in tests.items():
                total_tests += 1
                status = "✅ PASS" if result["success"] else "❌ FAIL"
                print(f"{status} {test_name}: {result['message']}")
                
                if result["success"]:
                    passed_tests += 1
                else:
                    failed_tests += 1
                    
        print("\n" + "="*80)
        print(f"FINAL RESULTS: {passed_tests}/{total_tests} tests passed")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print("="*80)
        
        return {
            "total": total_tests,
            "passed": passed_tests,
            "failed": failed_tests,
            "success_rate": (passed_tests / total_tests * 100) if total_tests > 0 else 0
        }

def main():
    """Run comprehensive E-commerce API tests"""
    print("Starting Comprehensive E-commerce Backend API Testing")
    print(f"Base URL: {BASE_URL}")
    print("="*80)
    
    tester = EcommerceAPITester()
    
    # Run all test suites
    tester.test_products_api()
    tester.test_authentication_api()
    tester.test_cart_api()
    tester.test_orders_api()
    
    # Print final summary
    summary = tester.print_summary()
    
    # Return exit code based on results
    return 0 if summary["failed"] == 0 else 1

if __name__ == "__main__":
    exit(main())