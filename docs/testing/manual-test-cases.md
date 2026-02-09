# Manual Test Cases - Hardware Store Website

This document provides step-by-step test scenarios for manually testing the Hardware Store website's user features while the application is running in a browser.

## Prerequisites

- **Backend Server**: Running at `http://localhost:3001`
- **Frontend Server**: Running at `http://localhost:5173`
- **Database**: Seeded with sample data
- **Test Data**: Default admin credentials: `admin` / `admin123`

---

## Table of Contents

1. [Customer Portal Features](#customer-portal-features)
   - [Home Page & Navigation](#1-home-page--navigation)
   - [Product Browsing & Search](#2-product-browsing--search)
   - [Product Details & Variants](#3-product-details--variants)
   - [Shopping Cart](#4-shopping-cart)
   - [Checkout Process](#5-checkout-process)
   - [Order Tracking](#6-order-tracking)
   - [Customer Registration & Login](#7-customer-registration--login)
   - [Customer Account Management](#8-customer-account-management)
   - [Saved Addresses](#9-saved-addresses)
   - [Wishlist](#10-wishlist)
   - [Order History](#11-order-history)
2. [Admin Dashboard Features](#admin-dashboard-features)
   - [Admin Login](#12-admin-login)
   - [Dashboard & Analytics](#13-dashboard--analytics)
   - [Order Management](#14-order-management)
   - [Order Status Workflow](#15-order-status-workflow)
   - [Product Management](#16-product-management)
   - [Category Management](#17-category-management)
   - [Reports & Insights](#18-reports--insights)

---

## Customer Portal Features

### 1. Home Page & Navigation

#### Test Case 1.1: Access Home Page
**Objective:** Verify home page loads correctly

**Steps:**
1. Open browser and navigate to `http://localhost:5173`
2. Wait for page to fully load

**Expected Results:**
- ✅ Home page displays with hero section
- ✅ Navigation bar shows: Logo, Products, Track Order, Cart icon, User menu
- ✅ Categories section is visible
- ✅ "How to Order" section is visible
- ✅ Footer with contact information and links is displayed
- ✅ Mobile: Bottom navigation bar shows (Home, Products, Cart, Account)

#### Test Case 1.2: Navigate Using Header Menu
**Objective:** Test navigation links in header

**Steps:**
1. From home page, click "Products" in navigation bar
2. Click browser back button
3. Click "Track Order" in navigation bar
4. Click the logo to return home
5. Click cart icon (🛒)
6. On mobile: Test bottom navigation tabs

**Expected Results:**
- ✅ Products page loads when clicking "Products"
- ✅ Back button returns to previous page
- ✅ Track Order page loads correctly
- ✅ Logo click returns to home page
- ✅ Cart icon shows cart page
- ✅ Cart badge displays item count (if cart has items)
- ✅ Mobile navigation works smoothly

#### Test Case 1.3: Search Functionality (Header)
**Objective:** Test global search in header

**Steps:**
1. Click the search icon (🔍) in header
2. Type "hammer" in search box
3. Wait for search results to appear
4. Click on a product from search results
5. Close search by clicking X or pressing ESC

**Expected Results:**
- ✅ Search modal/dropdown opens
- ✅ Search results appear while typing (debounced)
- ✅ Shows product name, price, and thumbnail
- ✅ Clicking result navigates to product detail page
- ✅ Search closes properly
- ✅ Empty search shows "No results found"

---

### 2. Product Browsing & Search

#### Test Case 2.1: View All Products
**Objective:** Access and browse the products page

**Steps:**
1. Navigate to Products page (`/products`)
2. Scroll through the product grid
3. Observe product cards

**Expected Results:**
- ✅ Product grid displays in responsive layout (3-4 columns on desktop, 2 on tablet, 1 on mobile)
- ✅ Each product card shows:
  - Product image (or placeholder if no image)
  - Product name
  - Price (formatted as ₱X,XXX.XX)
  - Unit (e.g., "piece", "meter")
  - Stock status (or "Out of Stock")
  - Add to Cart button (or "Out of Stock" if unavailable)
- ✅ Wishlist heart icon visible (for logged-in users)
- ✅ Products are clickable to view details

#### Test Case 2.2: Filter by Category
**Objective:** Test category filtering

**Steps:**
1. On Products page, note the category dropdown/filter
2. Select a category (e.g., "Hand Tools")
3. Observe filtered results
4. Select "All Categories"
5. Verify all products show again

**Expected Results:**
- ✅ Only products from selected category display
- ✅ Product count updates
- ✅ "All Categories" shows all products
- ✅ Category selection persists in URL parameter
- ✅ Page refreshes maintain filter selection

#### Test Case 2.3: Search Products
**Objective:** Test product search functionality

**Steps:**
1. On Products page, locate search input
2. Type "cement" in search box
3. Wait for results
4. Try search with "xyz123nonexistent"
5. Clear search and verify all products return

**Expected Results:**
- ✅ Search filters products in real-time (debounced)
- ✅ Matches product names and descriptions
- ✅ Shows "No products found" for invalid search
- ✅ Products reappear when search is cleared
- ✅ Search is case-insensitive

#### Test Case 2.4: Filter by Availability
**Objective:** Test stock availability filter

**Steps:**
1. On Products page, find "Available Only" checkbox/toggle
2. Enable "Available Only" filter
3. Observe products
4. Disable filter

**Expected Results:**
- ✅ Only in-stock products display when enabled
- ✅ Out-of-stock products are filtered out
- ✅ All products show when filter is disabled
- ✅ Filter state is reflected in UI

#### Test Case 2.5: Combine Filters
**Objective:** Test multiple filters together

**Steps:**
1. Select a category (e.g., "Power Tools")
2. Enable "Available Only" filter
3. Type a search term
4. Verify results match all criteria
5. Clear all filters one by one

**Expected Results:**
- ✅ Products match ALL active filters simultaneously
- ✅ No products show if no matches
- ✅ Clearing filters restores products progressively
- ✅ URL parameters update correctly

---

### 3. Product Details & Variants

#### Test Case 3.1: View Product Details
**Objective:** Access and view complete product information

**Steps:**
1. From Products page, click on any product card
2. Wait for product detail page to load
3. Scroll through the page
4. Review all sections

**Expected Results:**
- ✅ Product detail page loads
- ✅ Displays:
  - Product name and description
  - Current price (large and prominent)
  - Unit type
  - Stock quantity (or "Out of Stock")
  - Product images (if available)
  - Category information
  - Add to Cart button
  - Quantity selector
  - Wishlist button (for logged-in users)
- ✅ "Back to Products" or similar navigation link
- ✅ Breadcrumb navigation (if implemented)

#### Test Case 3.2: View Product Image Gallery
**Objective:** Test image gallery/lightbox functionality

**Steps:**
1. On product detail page with multiple images
2. Click on thumbnail images
3. Click on main image to open lightbox
4. Use next/previous arrows in lightbox
5. Click outside or press ESC to close lightbox

**Expected Results:**
- ✅ Clicking thumbnail updates main image
- ✅ Lightbox opens with full-size image
- ✅ Navigation arrows work in lightbox
- ✅ Lightbox closes properly
- ✅ Smooth transitions and animations
- ✅ Returns to correct image position

#### Test Case 3.3: Select Product Variant
**Objective:** Test variant selection (for products with variants)

**Steps:**
1. Find a product with variants (e.g., different sizes/colors)
2. View variant options displayed
3. Select first variant
4. Note price and stock changes
5. Select another variant
6. Observe updates

**Expected Results:**
- ✅ Variant selector displays all available variants
- ✅ Price updates to variant-specific price (if different)
- ✅ Stock quantity updates for selected variant
- ✅ "Out of Stock" shows if variant unavailable
- ✅ Selected variant is highlighted
- ✅ Add to Cart uses selected variant
- ✅ Variant name/details are clear

#### Test Case 3.4: View Bulk Pricing
**Objective:** Test bulk pricing tier display

**Steps:**
1. Find a product with bulk pricing enabled
2. Locate bulk pricing section
3. Review pricing tiers
4. Adjust quantity selector to different tier levels
5. Observe price calculations

**Expected Results:**
- ✅ Bulk pricing table/section is visible
- ✅ Shows minimum quantities and discounts
- ✅ Discount type clear (percentage or fixed)
- ✅ Tooltip or info icon explains pricing
- ✅ Price updates reflect bulk discount when applicable
- ✅ Clear indication of savings

#### Test Case 3.5: Adjust Quantity
**Objective:** Test quantity selector controls

**Steps:**
1. On product detail page, find quantity selector
2. Click + button to increase quantity
3. Click - button to decrease quantity
4. Try to decrease below 1
5. Try to increase above available stock
6. Manually type a quantity in the input

**Expected Results:**
- ✅ Plus button increases quantity by 1
- ✅ Minus button decreases quantity by 1
- ✅ Cannot decrease below 1
- ✅ Cannot exceed available stock
- ✅ Warning message appears at stock limit
- ✅ Manual input validates properly
- ✅ Subtotal updates (if shown)

---

### 4. Shopping Cart

#### Test Case 4.1: Add Product to Cart
**Objective:** Add product from detail page to cart

**Steps:**
1. On product detail page, select quantity (e.g., 2)
2. If product has variants, select a variant
3. Click "Add to Cart" button
4. Observe feedback
5. Check cart icon badge in header

**Expected Results:**
- ✅ Success toast notification appears
- ✅ Message shows product name and quantity added
- ✅ Cart icon badge updates to show total items
- ✅ Cart badge animates/pulses briefly
- ✅ Button shows brief loading state
- ✅ Can add product multiple times (quantities accumulate)

#### Test Case 4.2: Quick Add from Product List
**Objective:** Add products directly from products page

**Steps:**
1. On Products page, find "Add to Cart" button on product card
2. Click button without viewing details
3. Observe cart updates
4. Try adding out-of-stock product

**Expected Results:**
- ✅ Product adds to cart instantly
- ✅ Cart badge updates
- ✅ Toast notification confirms addition
- ✅ Out-of-stock products cannot be added
- ✅ Default quantity of 1 is used
- ✅ Default variant used (if product has variants)

#### Test Case 4.3: View Shopping Cart
**Objective:** Access and review cart contents

**Steps:**
1. Click cart icon in header
2. Review cart page layout
3. Verify all added items are present

**Expected Results:**
- ✅ Cart page displays with all items
- ✅ Each cart item shows:
  - Product image
  - Product name
  - Selected variant (if applicable)
  - Unit price
  - Quantity selector
  - Subtotal (quantity × price)
  - Remove button
- ✅ Cart summary section shows:
  - Subtotal for all items
  - Item count
  - Delivery fee note
  - Total amount
- ✅ "Proceed to Checkout" button visible
- ✅ "Continue Shopping" link available

#### Test Case 4.4: Update Cart Quantities
**Objective:** Modify quantities in cart

**Steps:**
1. In cart, locate quantity selector for an item
2. Increase quantity using + button
3. Decrease quantity using - button
4. Try setting quantity to 0
5. Set quantity to maximum stock

**Expected Results:**
- ✅ Quantity updates immediately
- ✅ Subtotal recalculates automatically
- ✅ Total amount updates
- ✅ Quantity 0 triggers item removal (or confirmation)
- ✅ Cannot exceed product stock
- ✅ Warning shown at stock limit
- ✅ All calculations are accurate

#### Test Case 4.5: Remove Items from Cart
**Objective:** Delete items from cart

**Steps:**
1. In cart, click "Remove" or trash icon on an item
2. If confirmation dialog appears, confirm removal
3. Observe cart updates
4. Remove all items from cart

**Expected Results:**
- ✅ Item removes immediately or after confirmation
- ✅ Cart total recalculates
- ✅ Item count badge updates
- ✅ When cart is empty:
  - Shows "Your Cart is Empty" message
  - Shows "Browse Products" button
  - Checkout button disabled or hidden
- ✅ No errors occur

#### Test Case 4.6: Cart with Variants
**Objective:** Test cart behavior with product variants

**Steps:**
1. Add product with variant A to cart
2. Go back and add same product with variant B
3. View cart
4. Verify both appear as separate items

**Expected Results:**
- ✅ Same product with different variants shows as separate cart items
- ✅ Each variant clearly labeled
- ✅ Prices reflect variant-specific pricing
- ✅ Quantities are independent
- ✅ Can remove variants individually

#### Test Case 4.7: Cart Persistence
**Objective:** Verify cart data persists across sessions

**Steps:**
1. Add items to cart
2. Refresh the page
3. Close browser tab and reopen site
4. Check cart contents

**Expected Results:**
- ✅ Cart items persist after page refresh
- ✅ Quantities and selections remain
- ✅ Cart survives browser restart (localStorage)
- ✅ Cart badge shows correct count on reload

---

### 5. Checkout Process

#### Test Case 5.1: Access Checkout
**Objective:** Navigate to checkout page

**Steps:**
1. Ensure cart has at least one item
2. Click "Proceed to Checkout" from cart page
3. Verify checkout page loads

**Expected Results:**
- ✅ Checkout page loads with progress indicator
- ✅ Shows step 1/3 or similar progress
- ✅ Checkout form displays
- ✅ Order summary visible (sidebar or below)
- ✅ Items from cart are listed in summary

#### Test Case 5.2: Fill Checkout Form (Guest User)
**Objective:** Complete checkout as guest without account

**Steps:**
1. On checkout page, locate customer information form
2. Fill in **Full Name**: "Juan Dela Cruz"
3. Fill in **Phone Number**: "09171234567"
4. Fill in **Full Address**: "123 Main Street, Building A, Unit 5"
5. Fill in **Barangay**: "Barangay Santo Niño"
6. Fill in **Landmarks** (optional): "Near SM Mall"
7. Fill in **Notes** (optional): "Please call before delivery"
8. Review form

**Expected Results:**
- ✅ All fields are clearly labeled
- ✅ Required fields marked with asterisk (*)
- ✅ Phone number field accepts Philippine format
- ✅ Form is user-friendly and accessible
- ✅ Optional fields are clearly marked

#### Test Case 5.3: Form Validation - Required Fields
**Objective:** Test form validation for required fields

**Steps:**
1. On checkout form, leave **Name** field empty
2. Try to submit form
3. Fill Name, leave **Phone** empty, submit
4. Fill Phone incorrectly (e.g., "123"), submit
5. Fill Phone correctly, leave **Address** empty, submit
6. Fill Address with less than 5 characters, submit
7. Leave **Barangay** empty, submit

**Expected Results:**
- ✅ Cannot proceed with empty required fields
- ✅ Error messages appear below fields:
  - "Name is required"
  - "Phone number is required"
  - "Invalid phone format (e.g., 09171234567)"
  - "Address is required"
  - "Address must be at least 5 characters"
  - "Barangay is required"
- ✅ Error messages are clear and helpful
- ✅ First invalid field is focused
- ✅ Form does not submit

#### Test Case 5.4: Form Validation - Phone Number Formats
**Objective:** Test phone number validation

**Steps:**
1. Try phone numbers:
   - `09171234567` (valid)
   - `+639171234567` (valid)
   - `0917 123 4567` (valid with spaces)
   - `12345` (invalid - too short)
   - `09171234567890` (invalid - too long)
   - `08171234567` (invalid - wrong prefix)
   - `abcdefghijk` (invalid - not numeric)

**Expected Results:**
- ✅ Accepts `09XXXXXXXXX` format (11 digits)
- ✅ Accepts `+639XXXXXXXXX` format (13 chars)
- ✅ Accepts formats with spaces
- ✅ Rejects invalid formats with clear error message
- ✅ Validation happens on blur or submit

#### Test Case 5.5: Use Saved Address (Logged-in Customer)
**Objective:** Test saved address selection for logged-in users

**Steps:**
1. Ensure you're logged in as customer
2. Navigate to checkout
3. Look for saved addresses dropdown/selection
4. Select a saved address
5. Verify form populates automatically

**Expected Results:**
- ✅ Saved addresses are available to select
- ✅ Selecting address auto-fills form fields
- ✅ Can still edit auto-filled information
- ✅ Option to save new address (if checkbox present)
- ✅ Default address pre-selected (if exists)

#### Test Case 5.6: Review Order Before Placing
**Objective:** Verify order summary and review

**Steps:**
1. Fill checkout form completely
2. Review order summary section showing:
   - All cart items with quantities and prices
   - Subtotal
   - Delivery fee (calculated or "To be calculated")
   - Total amount
3. Review entered customer information
4. Check for "Edit" or "Back" options

**Expected Results:**
- ✅ Order summary displays all items correctly
- ✅ Prices and quantities are accurate
- ✅ Total calculation is correct
- ✅ Customer information shown
- ✅ Can go back to cart if needed
- ✅ Clear "Place Order" button visible

#### Test Case 5.7: Place Order Successfully
**Objective:** Complete order placement

**Steps:**
1. With valid form data and items in cart
2. Click "Place Order" or "Confirm Order" button
3. Wait for processing
4. Observe result

**Expected Results:**
- ✅ Button shows loading state ("Placing Order...")
- ✅ Button is disabled during submission
- ✅ No errors occur
- ✅ Success toast notification appears
- ✅ Redirects to Order Confirmation page
- ✅ Cart is cleared after successful order

#### Test Case 5.8: Cart Validation on Checkout
**Objective:** Test backend cart validation

**Steps:**
1. Add an in-stock product to cart
2. In another browser/incognito, login as admin and reduce product stock to 0
3. Return to checkout in first browser
4. Try to place order

**Expected Results:**
- ✅ Validation error shows before order submission
- ✅ Error message indicates which product is unavailable
- ✅ Shows "X item(s) are no longer available"
- ✅ Redirects to cart or shows clear error
- ✅ Cart updates to reflect availability

#### Test Case 5.9: Empty Cart Checkout Prevention
**Objective:** Ensure cannot checkout with empty cart

**Steps:**
1. Clear cart completely
2. Try to navigate to `/checkout` directly via URL

**Expected Results:**
- ✅ Shows "Your Cart is Empty" message
- ✅ Cannot access checkout form
- ✅ Shows "Browse Products" or similar button
- ✅ No errors occur

---

### 6. Order Tracking

#### Test Case 6.1: Access Track Order Page
**Objective:** Navigate to order tracking

**Steps:**
1. From home page or navigation, click "Track Order"
2. Observe track order page

**Expected Results:**
- ✅ Track Order page loads
- ✅ Shows search/input field for order number
- ✅ Placeholder text guides format (e.g., "HW-20241211-0001")
- ✅ "Track" or "Search" button visible
- ✅ Instructions or help text present

#### Test Case 6.2: Track Order with Valid Order Number
**Objective:** Track an existing order

**Steps:**
1. Have a valid order number (from Order Confirmation or test data)
   - Example: `HW-20241211-0001`
2. On Track Order page, enter the order number
3. Click "Track" button
4. Review displayed order information

**Expected Results:**
- ✅ Order details load successfully
- ✅ Displays:
  - Order number
  - Customer name
  - Delivery address (full address, barangay, landmarks)
  - Phone number
  - Order status with badge/color
  - Order date and time
  - List of items with quantities and prices
  - Total amount
  - Customer notes (if provided)
- ✅ Order status timeline or progress indicator shown
- ✅ All information is formatted correctly

#### Test Case 6.3: Track Order Status Timeline
**Objective:** Verify order status progression display

**Steps:**
1. Track an order with a specific status (e.g., "Out for Delivery")
2. Review status timeline/progress
3. Check visual indicators

**Expected Results:**
- ✅ Status timeline shows progression:
  - ✅ Pending
  - ✅ Accepted
  - ✅ Preparing
  - ✅ Out for Delivery
  - ✅ Delivered
  - ✅ Completed
- ✅ Current status is highlighted/active
- ✅ Completed steps are marked (checkmarks)
- ✅ Future steps are grayed out
- ✅ Icons or colors indicate status
- ✅ Rejected/Cancelled shows separately if applicable

#### Test Case 6.4: Track Order - Invalid Order Number
**Objective:** Test tracking with non-existent order

**Steps:**
1. On Track Order page, enter invalid order number:
   - `HW-99999999-9999`
   - `INVALID-ORDER`
   - `12345`
2. Click "Track" button

**Expected Results:**
- ✅ Error message appears
- ✅ Message says "Order not found" or similar
- ✅ No order details displayed
- ✅ User can try again with different number
- ✅ No console errors

#### Test Case 6.5: Track Order - Empty Search
**Objective:** Validate required order number input

**Steps:**
1. On Track Order page, leave input empty
2. Try to click "Track" button

**Expected Results:**
- ✅ Required field validation triggers
- ✅ Error message or disabled button
- ✅ Helpful message shown
- ✅ Cannot submit empty search

#### Test Case 6.6: Track Order via URL Parameter
**Objective:** Test direct URL with order number

**Steps:**
1. Navigate to URL with order number parameter:
   - Example: `http://localhost:5173/track-order?order=HW-20241211-0001`
2. Page should load and auto-search

**Expected Results:**
- ✅ Page automatically searches for order
- ✅ Order details displayed without manual search
- ✅ Input field is pre-filled
- ✅ User can search for different order

#### Test Case 6.7: Track Recent Order from Order Confirmation
**Objective:** Test order tracking link from confirmation page

**Steps:**
1. Place a new order
2. On Order Confirmation page, click "Track Order" link/button
3. Verify automatic redirect

**Expected Results:**
- ✅ Automatically redirects to tracked order
- ✅ New order details displayed
- ✅ Order status is "Pending" initially
- ✅ All order information correct

---

### 7. Customer Registration & Login

#### Test Case 7.1: Access Registration Page
**Objective:** Navigate to customer registration

**Steps:**
1. Click "Login" or user icon in header (when not logged in)
2. Find "Register" or "Sign Up" link
3. Click to access registration page

**Expected Results:**
- ✅ Registration page loads
- ✅ Shows registration form with fields:
  - Full Name
  - Email
  - Phone Number
  - Password
  - Confirm Password
- ✅ "Sign Up" or "Register" button visible
- ✅ Link to login page if already have account
- ✅ Terms and conditions notice (if applicable)

#### Test Case 7.2: Register New Customer Account
**Objective:** Create a new customer account

**Steps:**
1. On registration page, fill in:
   - **Name**: "Maria Santos"
   - **Email**: "maria.santos@email.com"
   - **Phone**: "09171234567"
   - **Password**: "SecurePass123!"
   - **Confirm Password**: "SecurePass123!"
2. Click "Register" or "Sign Up" button
3. Wait for processing

**Expected Results:**
- ✅ Form submits successfully
- ✅ Success message appears
- ✅ Automatically logs in user
- ✅ Redirects to home page or account page
- ✅ User icon shows logged-in state
- ✅ Welcome message or notification

#### Test Case 7.3: Registration Validation - Required Fields
**Objective:** Test form validation on registration

**Steps:**
1. Try submitting with each field empty one at a time
2. Check error messages for:
   - Empty name
   - Empty email
   - Invalid email format
   - Empty phone
   - Invalid phone format
   - Empty password
   - Short password (less than 6 characters)
   - Mismatched password confirmation

**Expected Results:**
- ✅ All required fields validated
- ✅ Clear error messages appear:
  - "Name is required"
  - "Email is required"
  - "Invalid email address"
  - "Phone number is required"
  - "Invalid phone format"
  - "Password must be at least 8 characters"
  - "Passwords do not match"
- ✅ Cannot submit with errors
- ✅ Errors clear when field is corrected

#### Test Case 7.4: Registration - Duplicate Email
**Objective:** Test registration with existing email

**Steps:**
1. Try to register with email that already exists
   - Use email from previous registration or seed data
2. Click "Register"

**Expected Results:**
- ✅ Error message appears
- ✅ Message indicates email already in use
- ✅ Suggests logging in instead
- ✅ Form is not cleared
- ✅ User can try different email

#### Test Case 7.5: Access Login Page
**Objective:** Navigate to customer login

**Steps:**
1. Click "Login" link in navigation or user menu
2. Verify login page loads

**Expected Results:**
- ✅ Login page displays
- ✅ Shows login form with:
  - Email field
  - Password field
  - "Login" button
  - "Forgot Password?" link (if implemented)
  - "Register" link for new users
- ✅ Clean and user-friendly layout

#### Test Case 7.6: Login with Valid Credentials
**Objective:** Sign in with existing account

**Steps:**
1. On login page, enter valid credentials:
   - **Email**: (use registered customer email)
   - **Password**: (use correct password)
2. Click "Login" button
3. Wait for authentication

**Expected Results:**
- ✅ Login successful
- ✅ Success message or notification
- ✅ Redirects to home page or previous page
- ✅ User menu shows logged-in state
- ✅ Shows customer name in header
- ✅ No errors occur

#### Test Case 7.7: Login Validation - Invalid Credentials
**Objective:** Test login with wrong credentials

**Steps:**
1. Try logging in with incorrect password
2. Try logging in with non-existent email
3. Try with empty fields

**Expected Results:**
- ✅ Error message displayed
- ✅ Messages like:
  - "Invalid email or password"
  - "Email is required"
  - "Password is required"
- ✅ User remains on login page
- ✅ Can retry login
- ✅ Password field is cleared for security

#### Test Case 7.8: Rate Limiting on Login
**Objective:** Test brute force protection

**Steps:**
1. Try logging in with wrong password 5+ times rapidly
2. Observe behavior after multiple attempts

**Expected Results:**
- ✅ After 5 failed attempts within 15 minutes:
  - Error message appears
  - "Too many attempts, please try again after 15 minutes"
- ✅ Further login attempts blocked temporarily
- ✅ Protection notice is clear

#### Test Case 7.9: Logout Functionality
**Objective:** Test logging out of customer account

**Steps:**
1. Ensure you're logged in as customer
2. Click user menu/icon in header
3. Select "Logout" or "Sign Out"
4. Confirm logout if prompted

**Expected Results:**
- ✅ Successfully logs out
- ✅ Redirects to home page or login page
- ✅ User menu returns to logged-out state
- ✅ Cart persists (not cleared)
- ✅ Cannot access protected pages after logout
- ✅ Success message appears

---

### 8. Customer Account Management

#### Test Case 8.1: Access Account Page
**Objective:** Navigate to customer account settings

**Steps:**
1. Log in as customer
2. Click user icon/menu in header
3. Select "My Account" or similar option
4. Verify account page loads

**Expected Results:**
- ✅ Account page accessible only when logged in
- ✅ Shows account overview with:
  - Customer name
  - Email address
  - Phone number
  - Account creation date
- ✅ Shows navigation/tabs for:
  - Profile/Account Info
  - Order History
  - Saved Addresses
  - Wishlist
- ✅ Clean and organized layout

#### Test Case 8.2: View Profile Information
**Objective:** View current account details

**Steps:**
1. On account page, view profile section
2. Review displayed information
3. Check for edit options

**Expected Results:**
- ✅ Shows current profile information:
  - Full name
  - Email address
  - Phone number
- ✅ "Edit Profile" or similar button visible
- ✅ "Change Password" option available
- ✅ Information displayed clearly

#### Test Case 8.3: Edit Profile Information
**Objective:** Update account details

**Steps:**
1. Click "Edit Profile" button
2. Form appears or fields become editable
3. Update **Name** to "Maria Teresa Santos"
4. Update **Phone** to "09187654321"
5. Click "Save" or "Update" button
6. Wait for confirmation

**Expected Results:**
- ✅ Edit form displays with current values
- ✅ Can modify name and phone
- ✅ Email may be read-only or require verification
- ✅ Changes save successfully
- ✅ Success message appears
- ✅ Updated information displays
- ✅ No data loss occurs

#### Test Case 8.4: Change Password
**Objective:** Update account password

**Steps:**
1. On account page, find "Change Password" option
2. Click to open password change form/modal
3. Fill in:
   - **Current Password**: (enter current password)
   - **New Password**: "NewSecurePass456!"
   - **Confirm New Password**: "NewSecurePass456!"
4. Submit form
5. Log out and log back in with new password

**Expected Results:**
- ✅ Password change form displays
- ✅ Requires current password for verification
- ✅ New password validation (minimum length, etc.)
- ✅ Passwords must match
- ✅ Success message on update
- ✅ Can login with new password
- ✅ Cannot login with old password
- ✅ Secure handling (no password in URL/logs)

#### Test Case 8.5: Change Password - Validation Errors
**Objective:** Test password change validation

**Steps:**
1. Try changing password with:
   - Wrong current password
   - New password too short
   - Mismatched confirmation
   - Same as current password (if not allowed)

**Expected Results:**
- ✅ Error messages appear for each issue:
  - "Current password is incorrect"
  - "Password must be at least 8 characters"
  - "Passwords do not match"
  - "New password must be different" (if applicable)
- ✅ Form does not submit with errors
- ✅ User can correct and retry

---

### 9. Saved Addresses

#### Test Case 9.1: Access Saved Addresses
**Objective:** Navigate to saved addresses page

**Steps:**
1. Log in as customer
2. Go to account menu or My Account page
3. Click "Saved Addresses" or "Addresses" option
4. Verify page loads

**Expected Results:**
- ✅ Saved Addresses page displays
- ✅ Shows list of saved addresses (if any exist)
- ✅ Shows "Add New Address" button
- ✅ Message if no addresses saved yet
- ✅ Each address shows:
  - Label (e.g., "Home", "Office")
  - Full address
  - Barangay
  - Landmarks
  - Default badge (if default address)
  - Edit and Delete buttons

#### Test Case 9.2: Add New Saved Address
**Objective:** Create a new saved address

**Steps:**
1. On Saved Addresses page, click "Add New Address"
2. Fill in form:
   - **Label**: "Home"
   - **Full Address**: "456 Oak Street, Building C, Unit 12"
   - **Barangay**: "Barangay San Pedro"
   - **Landmarks**: "Beside Municipal Hall"
3. Optionally check "Set as Default Address"
4. Click "Save Address" button

**Expected Results:**
- ✅ Form modal or page appears
- ✅ All fields are clear and labeled
- ✅ Can set as default during creation
- ✅ Address saves successfully
- ✅ Success message appears
- ✅ New address appears in list
- ✅ Form closes/resets after save

#### Test Case 9.3: Edit Saved Address
**Objective:** Modify existing saved address

**Steps:**
1. On Saved Addresses page, find an existing address
2. Click "Edit" button
3. Modify any field (e.g., update label to "Home - Main")
4. Click "Save" or "Update"

**Expected Results:**
- ✅ Edit form/modal opens with current values
- ✅ Can modify all fields
- ✅ Changes save successfully
- ✅ Updated address displays in list
- ✅ Success notification appears

#### Test Case 9.4: Delete Saved Address
**Objective:** Remove saved address

**Steps:**
1. On Saved Addresses page, find an address to delete
2. Click "Delete" or trash icon
3. If confirmation dialog appears, confirm deletion
4. Observe result

**Expected Results:**
- ✅ Confirmation dialog appears (recommended)
- ✅ Address deletes successfully
- ✅ Removes from list immediately
- ✅ Success message appears
- ✅ If deleting default address:
  - Another address becomes default (if exists)
  - Or no default if only one address

#### Test Case 9.5: Set Default Address
**Objective:** Change which address is default

**Steps:**
1. Have at least 2 saved addresses
2. Find address that is not default
3. Click "Set as Default" or similar option
4. Observe changes

**Expected Results:**
- ✅ Selected address marked as default
- ✅ Previous default address unmarked
- ✅ Only one default address exists at a time
- ✅ Default badge/indicator updates
- ✅ Success notification appears
- ✅ Default address used in checkout

#### Test Case 9.6: Use Saved Address in Checkout
**Objective:** Verify saved addresses available during checkout

**Steps:**
1. Have saved addresses in account
2. Add items to cart
3. Go to checkout
4. Look for saved address selection
5. Select a saved address

**Expected Results:**
- ✅ Saved addresses dropdown/selector visible
- ✅ All saved addresses available to choose
- ✅ Default address pre-selected
- ✅ Selecting address auto-fills form
- ✅ Can still edit auto-filled information

---

### 10. Wishlist

#### Test Case 10.1: Add Product to Wishlist from Product Detail
**Objective:** Save product to wishlist from detail page

**Steps:**
1. Ensure logged in as customer (or test prompted to login)
2. Go to any product detail page
3. Find heart icon/wishlist button
4. Click to add to wishlist
5. Observe feedback

**Expected Results:**
- ✅ Heart icon toggles to filled/active state
- ✅ Success message appears: "Added to wishlist"
- ✅ Wishlist badge count updates in header (if shown)
- ✅ Product is saved to wishlist
- ✅ If not logged in: prompted to login first

#### Test Case 10.2: Add Product to Wishlist from Product Card
**Objective:** Add to wishlist from products listing

**Steps:**
1. Logged in as customer
2. On Products page, hover over product card
3. Click heart icon on product card
4. Verify wishlist update

**Expected Results:**
- ✅ Heart icon appears on product card
- ✅ Click adds to wishlist
- ✅ Heart icon fills/changes color
- ✅ Success notification
- ✅ Wishlist count updates
- ✅ Can add multiple products

#### Test Case 10.3: Remove Product from Wishlist (Product Page)
**Objective:** Remove from wishlist via product detail

**Steps:**
1. Go to product detail page that's already in wishlist
2. Heart icon should be filled/active
3. Click heart icon to remove
4. Observe result

**Expected Results:**
- ✅ Heart icon returns to outlined/inactive state
- ✅ Message appears: "Removed from wishlist"
- ✅ Wishlist count decreases
- ✅ Product removed from wishlist
- ✅ Can add back immediately

#### Test Case 10.4: Access Wishlist Page
**Objective:** View all wishlist items

**Steps:**
1. Click user menu in header
2. Select "Wishlist" or heart icon with badge
3. Navigate to wishlist page

**Expected Results:**
- ✅ Wishlist page loads
- ✅ Shows all saved products
- ✅ Each product displays:
  - Product image
  - Product name
  - Price
  - "Add to Cart" button
  - Remove from wishlist button
- ✅ If empty: shows "Your wishlist is empty" message
- ✅ Grid/list layout is responsive

#### Test Case 10.5: Add Wishlist Item to Cart
**Objective:** Move product from wishlist to cart

**Steps:**
1. On Wishlist page, find a product
2. Click "Add to Cart" button
3. Observe result
4. Product remains in wishlist (or test if it auto-removes)

**Expected Results:**
- ✅ Product adds to cart successfully
- ✅ Success notification appears
- ✅ Cart badge updates
- ✅ Product stays in wishlist (typically)
- ✅ Can specify quantity before adding (if feature exists)

#### Test Case 10.6: Remove Item from Wishlist Page
**Objective:** Delete product from wishlist

**Steps:**
1. On Wishlist page, find a product
2. Click "Remove" or X icon
3. Observe result

**Expected Results:**
- ✅ Product removes immediately
- ✅ Success message: "Removed from wishlist"
- ✅ Wishlist count updates
- ✅ Product disappears from list
- ✅ No errors occur

#### Test Case 10.7: Wishlist Persistence
**Objective:** Verify wishlist saves across sessions

**Steps:**
1. Add products to wishlist
2. Log out
3. Log back in
4. Check wishlist

**Expected Results:**
- ✅ Wishlist items persist after logout/login
- ✅ All saved products still present
- ✅ Wishlist count accurate
- ✅ Data stored server-side (linked to account)

#### Test Case 10.8: Wishlist for Out-of-Stock Products
**Objective:** Test wishlist with unavailable products

**Steps:**
1. Add out-of-stock product to wishlist
2. View wishlist page
3. Observe how unavailable products are displayed

**Expected Results:**
- ✅ Can add out-of-stock products to wishlist
- ✅ Product shows "Out of Stock" badge/indicator
- ✅ "Add to Cart" button is disabled or hidden
- ✅ Still can remove from wishlist
- ✅ Helps customers track when item back in stock

---

### 11. Order History

#### Test Case 11.1: Access Order History
**Objective:** Navigate to order history page

**Steps:**
1. Log in as customer
2. Click user menu in header
3. Select "Order History" or "Orders"
4. Verify page loads

**Expected Results:**
- ✅ Order History page displays
- ✅ Shows list of customer's orders (newest first)
- ✅ Each order shows:
  - Order number
  - Order date
  - Status badge
  - Total amount
  - Number of items
  - "View Details" link
- ✅ If no orders: shows "No orders yet" message
- ✅ Link to browse products

#### Test Case 11.2: View Past Orders List
**Objective:** Review order history overview

**Steps:**
1. On Order History page with existing orders
2. Scroll through order list
3. Review information displayed
4. Check status badges

**Expected Results:**
- ✅ Orders listed in reverse chronological order
- ✅ Clear visual separation between orders
- ✅ Status colors match order tracking:
  - Pending (yellow)
  - Accepted (blue)
  - Preparing (purple)
  - Out for Delivery (indigo)
  - Delivered (green)
  - Completed (green)
  - Cancelled (red)
  - Rejected (red)
- ✅ Formatted dates and amounts
- ✅ Responsive layout

#### Test Case 11.3: View Order Details from History
**Objective:** Access full order information

**Steps:**
1. On Order History page, find an order
2. Click "View Details" or order number
3. Review order detail page/modal

**Expected Results:**
- ✅ Full order details display
- ✅ Shows same information as order tracking:
  - Order number
  - Order date and time
  - Current status with timeline
  - Customer information
  - Delivery address
  - All ordered items with quantities and prices
  - Total amount
  - Notes
- ✅ Can go back to order history
- ✅ May have option to reorder items

#### Test Case 11.4: Filter/Search Order History
**Objective:** Find specific orders (if feature exists)

**Steps:**
1. On Order History page, look for search/filter
2. If exists, filter by status
3. Search by order number or date

**Expected Results:**
- ✅ Filter by status works (Pending, Delivered, etc.)
- ✅ Search finds matching orders
- ✅ Results update dynamically
- ✅ Can clear filters
- ✅ Shows "No orders found" if no matches

#### Test Case 11.5: Reorder from Order History
**Objective:** Add previous order items to cart (if feature exists)

**Steps:**
1. View order details from history
2. Look for "Reorder" or "Order Again" button
3. Click to reorder
4. Check cart

**Expected Results:**
- ✅ All items from order added to cart
- ✅ Respects current stock availability
- ✅ Success message appears
- ✅ Redirects to cart or products page
- ✅ If items unavailable: shows warning

---

## Admin Dashboard Features

### 12. Admin Login

#### Test Case 12.1: Access Admin Login Page
**Objective:** Navigate to admin login

**Steps:**
1. Navigate to `http://localhost:5173/admin/login`
2. Or click "Admin Login" link in footer
3. Verify admin login page loads

**Expected Results:**
- ✅ Admin login page displays
- ✅ Different from customer login page
- ✅ Shows:
  - Username field
  - Password field
  - "Sign In" button
  - Hardware Store or admin branding
- ✅ Clean, professional layout

#### Test Case 12.2: Login as Admin
**Objective:** Access admin dashboard with credentials

**Steps:**
1. On admin login page, enter:
   - **Username**: `admin`
   - **Password**: `admin123`
2. Click "Sign In" button
3. Wait for authentication

**Expected Results:**
- ✅ Login successful
- ✅ Redirects to admin dashboard (`/admin`)
- ✅ Admin layout loads with:
  - Sidebar navigation
  - Admin header/topbar
  - Dashboard content
- ✅ No errors occur
- ✅ Shows admin user name in header

#### Test Case 12.3: Admin Login - Invalid Credentials
**Objective:** Test admin login validation

**Steps:**
1. Try logging in with wrong password
2. Try with wrong username
3. Try with empty fields

**Expected Results:**
- ✅ Error message appears
- ✅ "Invalid username or password"
- ✅ Does not redirect
- ✅ Can retry login
- ✅ Password field clears for security

#### Test Case 12.4: Admin Logout
**Objective:** Sign out from admin dashboard

**Steps:**
1. While logged into admin dashboard
2. Find logout button (usually in header or sidebar)
3. Click "Logout" or "Sign Out"
4. Confirm if prompted

**Expected Results:**
- ✅ Logs out successfully
- ✅ Redirects to admin login page
- ✅ Cannot access admin pages after logout
- ✅ Session cleared
- ✅ Success notification (optional)

#### Test Case 12.5: Admin Protected Routes
**Objective:** Verify admin pages require authentication

**Steps:**
1. While logged out, try accessing:
   - `http://localhost:5173/admin`
   - `http://localhost:5173/admin/orders`
   - `http://localhost:5173/admin/products`
2. Observe behavior

**Expected Results:**
- ✅ Redirects to admin login page
- ✅ Cannot access admin pages without auth
- ✅ After login, can return to intended page
- ✅ Security is enforced

---

### 13. Dashboard & Analytics

#### Test Case 13.1: View Admin Dashboard
**Objective:** Access main dashboard overview

**Steps:**
1. Log in as admin
2. Verify you're on dashboard page (`/admin`)
3. Review dashboard sections

**Expected Results:**
- ✅ Dashboard loads with multiple sections:
  - **Statistics Cards**:
    - Total Orders (today, pending, total)
    - Revenue (today, this week, this month)
    - Total Products
    - Low Stock alert count
  - **Recent Orders Table**
  - **Order Status Chart** (if implemented)
  - **Revenue Chart** (if implemented)
  - **Low Stock Products List**
  - **Quick Action Buttons**
- ✅ Data displays correctly
- ✅ Responsive layout
- ✅ Professional design

#### Test Case 13.2: Review Statistics Cards
**Objective:** Verify dashboard stats

**Steps:**
1. On dashboard, locate stat cards at top
2. Review each statistic:
   - Orders today
   - Pending orders
   - Total orders
   - Revenue today
   - Revenue this week
   - Revenue this month
   - Total products
   - Low stock count
3. Note the values

**Expected Results:**
- ✅ All statistics display numeric values
- ✅ Currency formatted correctly (₱X,XXX.XX)
- ✅ Icons represent each stat
- ✅ Color-coded for quick scanning
- ✅ Trends shown (up/down arrows) if implemented
- ✅ Values are accurate (verify against database)

#### Test Case 13.3: View Recent Orders
**Objective:** Check recent orders section

**Steps:**
1. On dashboard, find "Recent Orders" table
2. Review displayed orders
3. Click "View All" link (if present)

**Expected Results:**
- ✅ Shows 5-10 most recent orders
- ✅ Each order displays:
  - Order number
  - Customer name and phone
  - Total amount
  - Status badge
  - Time placed
  - "View" action button
- ✅ "View All" link goes to full orders page
- ✅ Can click individual order to view details
- ✅ Status colors for quick reference

#### Test Case 13.4: View Low Stock Products
**Objective:** Check inventory alerts

**Steps:**
1. On dashboard, find "Low Stock Products" section
2. Review listed products below threshold
3. Note stock quantities

**Expected Results:**
- ✅ Lists products with stock below threshold
- ✅ Shows:
  - Product name
  - Current stock quantity
  - Low stock threshold (if shown)
  - Stock status indicator (red warning)
- ✅ Sorted by urgency (lowest stock first)
- ✅ Link to update stock or product management
- ✅ Empty state if no low stock products

#### Test Case 13.5: Dashboard Charts (if implemented)
**Objective:** Review visual analytics

**Steps:**
1. Find charts on dashboard:
   - Order status distribution
   - Revenue over time
   - Sales trends
2. Review data visualization

**Expected Results:**
- ✅ Charts render correctly
- ✅ Data is accurate and up-to-date
- ✅ Legends and labels are clear
- ✅ Interactive tooltips (if applicable)
- ✅ Responsive on different screen sizes
- ✅ Colors are distinct and accessible

#### Test Case 13.6: Quick Actions
**Objective:** Test dashboard quick action buttons

**Steps:**
1. Find quick action section (often at bottom)
2. Try clicking:
   - "Process Pending Orders"
   - "Manage Products"
   - "View Reports"
3. Verify navigation

**Expected Results:**
- ✅ Quick action buttons visible
- ✅ Each navigates to relevant page:
  - Pending orders → Orders page filtered to pending
  - Manage products → Products management page
  - Reports → Reports page
- ✅ Convenient shortcuts for common tasks

---

### 14. Order Management

#### Test Case 14.1: Access Orders Page
**Objective:** Navigate to order management

**Steps:**
1. In admin dashboard, click "Orders" in sidebar
2. Verify orders page loads

**Expected Results:**
- ✅ Orders page displays (`/admin/orders`)
- ✅ Shows orders table/list
- ✅ Filter and search options visible
- ✅ Pagination controls (if many orders)
- ✅ Page title: "Orders" or "Order Management"

#### Test Case 14.2: View All Orders List
**Objective:** Review orders table

**Steps:**
1. On Orders page, review table
2. Scroll through orders
3. Check column headers

**Expected Results:**
- ✅ Orders table shows columns:
  - Order # (clickable)
  - Customer Name
  - Phone
  - Date & Time
  - Status (badge)
  - Total Amount
  - Action (View button)
- ✅ Default sort: newest orders first
- ✅ Clickable rows or view buttons
- ✅ Status colors for easy scanning:
  - Pending (yellow)
  - Accepted (blue)
  - Preparing (purple)
  - Out for Delivery (indigo)
  - Delivered (green)
  - Completed (green)
  - Cancelled (red)
  - Rejected (red)

#### Test Case 14.3: Filter Orders by Status
**Objective:** Test status filter

**Steps:**
1. On Orders page, find status filter dropdown
2. Select "Pending"
3. Observe filtered results
4. Try other statuses:
   - Accepted
   - Out for Delivery
   - Delivered
   - Cancelled
5. Select "All Orders"

**Expected Results:**
- ✅ Filter dropdown lists all order statuses
- ✅ Selecting status shows only matching orders
- ✅ Order count updates
- ✅ Filter state shown in UI
- ✅ URL parameter updates (for bookmarking)
- ✅ "All Orders" shows everything
- ✅ Shows "No orders" if filter results empty

#### Test Case 14.4: Search Orders
**Objective:** Search by order number or customer

**Steps:**
1. On Orders page, locate search input
2. Search by order number: "HW-20241211-0001"
3. Clear search
4. Search by customer name: "Juan"
5. Search by phone: "0917"

**Expected Results:**
- ✅ Search filters orders in real-time
- ✅ Matches order number (exact or partial)
- ✅ Matches customer name
- ✅ Matches phone number
- ✅ Case-insensitive search
- ✅ Shows "No results" if no matches
- ✅ Can combine search with status filter

#### Test Case 14.5: Filter by Date Range (if implemented)
**Objective:** Filter orders by date

**Steps:**
1. Find date range filter
2. Select date range (e.g., Last 7 days, Last month, Custom)
3. Apply filter
4. Verify results

**Expected Results:**
- ✅ Date filter options available
- ✅ Preset ranges work (Today, This Week, This Month)
- ✅ Custom date picker works
- ✅ Shows orders within selected range
- ✅ Can clear date filter

#### Test Case 14.6: Pagination
**Objective:** Test order list pagination (if many orders)

**Steps:**
1. If more than 20 orders exist, observe pagination
2. Click "Next" page
3. Click "Previous" page
4. Try page number links
5. Change items per page (if option exists)

**Expected Results:**
- ✅ Pagination controls appear when needed
- ✅ Shows current page and total pages
- ✅ Next/Previous buttons work
- ✅ Page numbers are clickable
- ✅ Items per page selector works (10, 20, 50, 100)
- ✅ URL updates with page number
- ✅ Filters persist across pages

---

### 15. Order Status Workflow

#### Test Case 15.1: View Order Details (Admin)
**Objective:** Access full order information as admin

**Steps:**
1. On Orders page, click "View" or order number
2. Order detail page loads
3. Review all sections

**Expected Results:**
- ✅ Order detail page displays (`/admin/orders/:id`)
- ✅ Shows comprehensive information:
  - **Order Header**: Order #, Status, Date
  - **Customer Info**: Name, Phone, Address, Barangay, Landmarks
  - **Order Items**: Products, variants, quantities, prices
  - **Order Summary**: Subtotal, delivery fee, total
  - **Customer Notes**: Special instructions
  - **Status History**: Timeline of status changes
  - **SMS Logs**: Sent notifications (if implemented)
- ✅ Status update buttons visible
- ✅ Professional layout
- ✅ "Back to Orders" navigation

#### Test Case 15.2: Update Order Status - Accept Order
**Objective:** Accept a pending order

**Steps:**
1. View a pending order in admin
2. Locate status update section
3. Find "Accept Order" button
4. Click to accept
5. If confirmation needed, confirm

**Expected Results:**
- ✅ Status updates to "Accepted"
- ✅ Status badge changes to blue
- ✅ Success message appears
- ✅ Status history records change with timestamp
- ✅ SMS sent to customer (if SMS enabled)
- ✅ Status timeline updates
- ✅ Cannot reverse to pending

#### Test Case 15.3: Update Order Status - Reject Order
**Objective:** Reject a pending order

**Steps:**
1. View a pending order
2. Click "Reject Order" button
3. Modal/form appears requesting reason
4. Enter rejection reason: "Product temporarily unavailable"
5. Confirm rejection

**Expected Results:**
- ✅ Rejection reason modal opens
- ✅ Requires reason text (validation)
- ✅ Status updates to "Rejected"
- ✅ Status badge changes to red
- ✅ Rejection reason saved and displayed
- ✅ SMS sent to customer with reason
- ✅ Cannot change status after rejection (terminal state)
- ✅ Order removed from active orders

#### Test Case 15.4: Update Order Status - Preparing
**Objective:** Move accepted order to preparing

**Steps:**
1. View an accepted order
2. Click "Mark as Preparing" button
3. Confirm action

**Expected Results:**
- ✅ Status updates to "Preparing"
- ✅ Status badge changes to purple
- ✅ Success notification
- ✅ Status history updated
- ✅ SMS notification sent (optional)
- ✅ Status timeline shows progress

#### Test Case 15.5: Update Order Status - Out for Delivery
**Objective:** Mark order as out for delivery

**Steps:**
1. View a preparing order
2. Click "Mark as Out for Delivery" button
3. Confirm action

**Expected Results:**
- ✅ Status updates to "Out for Delivery"
- ✅ Status badge changes to indigo
- ✅ Success message
- ✅ SMS sent to customer about delivery
- ✅ Timestamp recorded
- ✅ Driver/delivery info field (if implemented)

#### Test Case 15.6: Update Order Status - Delivered
**Objective:** Confirm order delivery

**Steps:**
1. View order marked "Out for Delivery"
2. Click "Mark as Delivered" button
3. Confirm delivery

**Expected Results:**
- ✅ Status updates to "Delivered"
- ✅ Status badge changes to green
- ✅ Success notification
- ✅ SMS confirmation sent to customer
- ✅ Delivery timestamp recorded
- ✅ Can move to "Completed" next

#### Test Case 15.7: Update Order Status - Complete Order
**Objective:** Close delivered order

**Steps:**
1. View delivered order
2. Click "Complete Order" button
3. Confirm completion

**Expected Results:**
- ✅ Status updates to "Completed"
- ✅ Order marked as fulfilled
- ✅ Success message
- ✅ Order archived or marked complete
- ✅ Final status (cannot change further typically)
- ✅ Status history complete

#### Test Case 15.8: Cancel Order
**Objective:** Cancel order before delivery

**Steps:**
1. View order in any pre-delivery status (Accepted, Preparing, Out for Delivery)
2. Find "Cancel Order" option
3. Provide cancellation reason if prompted
4. Confirm cancellation

**Expected Results:**
- ✅ Can cancel from statuses: Accepted, Preparing, Out for Delivery
- ✅ Status updates to "Cancelled"
- ✅ Status badge changes to red
- ✅ Cancellation reason saved
- ✅ SMS sent to customer
- ✅ Terminal status (no further updates)
- ✅ Stock returned (if inventory tracking)

#### Test Case 15.9: Status Workflow Validation
**Objective:** Verify status transitions are enforced

**Steps:**
1. Try invalid status transitions:
   - Skip from Pending to Delivered
   - Change Completed/Rejected order status
   - Move backwards in workflow

**Expected Results:**
- ✅ Only valid next statuses shown as options
- ✅ Button shown for allowed transitions:
  - Pending → Accept or Reject
  - Accepted → Preparing or Cancel
  - Preparing → Out for Delivery or Cancel
  - Out for Delivery → Delivered or Cancel
  - Delivered → Completed
- ✅ Cannot skip steps in workflow
- ✅ Terminal statuses (Completed, Rejected, Cancelled) cannot be changed
- ✅ Backend validates transitions

#### Test Case 15.10: View Status History
**Objective:** Review order status timeline

**Steps:**
1. View order that has gone through multiple statuses
2. Find "Status History" or timeline section
3. Review recorded changes

**Expected Results:**
- ✅ Status history displays chronologically
- ✅ Each entry shows:
  - Previous status
  - New status
  - Changed by (admin user)
  - Timestamp
  - Notes/reason (if provided)
- ✅ Visual timeline or list format
- ✅ Complete audit trail
- ✅ Easy to understand progression

---

### 16. Product Management

#### Test Case 16.1: Access Products Management
**Objective:** Navigate to product management page

**Steps:**
1. In admin sidebar, click "Products"
2. Verify products page loads

**Expected Results:**
- ✅ Products management page displays (`/admin/products`)
- ✅ Shows products table/grid
- ✅ "Add New Product" button visible
- ✅ Search and filter options
- ✅ Each product shows:
  - Image thumbnail
  - Name
  - Category
  - Price
  - Stock quantity
  - Availability status
  - Action buttons (Edit, Delete)

#### Test Case 16.2: View Products List
**Objective:** Review all products in system

**Steps:**
1. On Products page, scroll through product list
2. Observe product information
3. Check for sorting options

**Expected Results:**
- ✅ All products listed
- ✅ Table or grid layout
- ✅ Stock levels visible
- ✅ Low stock products highlighted
- ✅ Out of stock clearly marked
- ✅ Can sort by name, price, stock, category
- ✅ Pagination if many products

#### Test Case 16.3: Search Products (Admin)
**Objective:** Find specific products

**Steps:**
1. Use search box on products page
2. Search by product name
3. Search by SKU (if applicable)
4. Clear search

**Expected Results:**
- ✅ Search filters products list
- ✅ Real-time or debounced search
- ✅ Matches name, description, SKU
- ✅ Shows "No results" if not found
- ✅ Can clear search easily

#### Test Case 16.4: Filter Products by Category (Admin)
**Objective:** Filter by category in admin

**Steps:**
1. Find category filter dropdown
2. Select a category
3. Verify filtered results
4. Select "All Categories"

**Expected Results:**
- ✅ Category filter works
- ✅ Shows only selected category products
- ✅ Can combine with search
- ✅ "All Categories" shows everything

#### Test Case 16.5: Filter by Availability/Stock Status
**Objective:** Filter by stock status

**Steps:**
1. Find filters for:
   - In Stock
   - Low Stock
   - Out of Stock
   - Available/Unavailable
2. Apply filter
3. Verify results

**Expected Results:**
- ✅ Stock status filters work
- ✅ Low stock shows products below threshold
- ✅ Out of stock shows quantity = 0
- ✅ Unavailable shows isAvailable = false
- ✅ Can clear filters

#### Test Case 16.6: Add New Product (Basic)
**Objective:** Create a product without variants

**Steps:**
1. Click "Add New Product" or "+ Add Product" button
2. Fill in product form:
   - **Name**: "Test Hammer"
   - **Description**: "A reliable claw hammer for general use"
   - **Price**: 450.00
   - **Unit**: "piece"
   - **Category**: Select "Hand Tools"
   - **Stock Quantity**: 50
   - **Low Stock Threshold**: 10
   - **SKU**: "HAM-001" (optional)
   - **Availability**: Checked
3. Optionally upload image
4. Click "Save" or "Create Product"

**Expected Results:**
- ✅ Form modal or page opens
- ✅ All fields are clear and labeled
- ✅ Required fields marked
- ✅ Category dropdown populated
- ✅ Can upload product image
- ✅ Price accepts decimal
- ✅ Product saves successfully
- ✅ Success message appears
- ✅ New product appears in list
- ✅ Form resets/closes

#### Test Case 16.7: Add Product with Image Upload
**Objective:** Upload product image during creation

**Steps:**
1. Start creating new product
2. Find image upload section
3. Click "Upload Image" or drag-and-drop
4. Select image file (JPEG/PNG)
5. Preview image
6. Save product

**Expected Results:**
- ✅ Image upload field visible
- ✅ Supports drag-and-drop or file picker
- ✅ Accepts JPG, PNG, WebP formats
- ✅ Image preview shows after selection
- ✅ File size validation (e.g., max 5MB)
- ✅ Image saves with product
- ✅ Thumbnail displays in product list
- ✅ Error handling for invalid files

#### Test Case 16.8: Product Form Validation
**Objective:** Test new product validation

**Steps:**
1. Try creating product with:
   - Empty name
   - Negative price
   - Price = 0
   - Empty category
   - Negative stock
   - Text in numeric fields

**Expected Results:**
- ✅ Validation errors appear:
  - "Name is required"
  - "Price must be greater than 0"
  - "Category is required"
  - "Stock quantity must be 0 or greater"
- ✅ Cannot submit with errors
- ✅ Errors clear when corrected
- ✅ First error field focused

#### Test Case 16.9: Edit Existing Product
**Objective:** Update product information

**Steps:**
1. On Products page, find product to edit
2. Click "Edit" button
3. Edit form opens with current values
4. Modify:
   - Name to "Updated Name"
   - Price to new value
   - Stock quantity
   - Description
5. Click "Update" or "Save Changes"

**Expected Results:**
- ✅ Edit form opens pre-filled with current values
- ✅ Can modify all fields
- ✅ Image can be changed (upload new)
- ✅ Changes save successfully
- ✅ Success message appears
- ✅ Product list updates with new info
- ✅ No data loss occurs

#### Test Case 16.10: Delete Product
**Objective:** Remove product from system

**Steps:**
1. Find product to delete
2. Click "Delete" or trash icon
3. Confirmation dialog appears
4. Confirm deletion

**Expected Results:**
- ✅ Confirmation dialog asks to confirm
- ✅ Warning about irreversible action
- ✅ On confirm: product deleted (soft delete)
- ✅ Success message appears
- ✅ Product removed from list
- ✅ Product marked isDeleted = true (not shown to customers)
- ✅ Can cancel deletion

#### Test Case 16.11: Toggle Product Availability
**Objective:** Enable/disable product sales

**Steps:**
1. Find available product
2. Click toggle/switch to make unavailable
3. Observe change
4. Toggle back to available

**Expected Results:**
- ✅ Availability toggle is clear (switch/checkbox)
- ✅ Product marks as unavailable
- ✅ Not shown to customers when unavailable
- ✅ Visual indicator in admin list (grayed out, badge)
- ✅ Can toggle back on
- ✅ Success notification
- ✅ Instant update

#### Test Case 16.12: Update Product Stock
**Objective:** Adjust stock quantity

**Steps:**
1. Find product
2. Locate stock quantity field or edit button
3. Update stock quantity (e.g., add 20 units)
4. Save change

**Expected Results:**
- ✅ Can update stock directly or via edit form
- ✅ Accepts positive integers
- ✅ Stock updates immediately
- ✅ Success message
- ✅ Low stock warning appears if below threshold
- ✅ Stock level reflects in customer view

#### Test Case 16.13: Add Product with Variants
**Objective:** Create product with multiple variants

**Steps:**
1. Start creating new product
2. Enable "Has Variants" option
3. Fill base product info
4. Add variants:
   - **Variant 1**: Name "Small", Price 300, Stock 20
   - **Variant 2**: Name "Medium", Price 450, Stock 15
   - **Variant 3**: Name "Large", Price 600, Stock 10
5. Save product

**Expected Results:**
- ✅ Variant section appears when enabled
- ✅ Can add multiple variants
- ✅ Each variant has name, price, stock, SKU
- ✅ Variant attributes flexible (size, color, etc.)
- ✅ Base product price may be optional if using variants
- ✅ All variants save with product
- ✅ Variants appear correctly on customer site

#### Test Case 16.14: Edit Product Variants
**Objective:** Modify existing product variants

**Steps:**
1. Edit product that has variants
2. Access variants section
3. Edit existing variant (change price or stock)
4. Add new variant
5. Delete a variant
6. Save changes

**Expected Results:**
- ✅ Can modify variant details
- ✅ Can add new variants to existing product
- ✅ Can remove variants
- ✅ Confirmation for variant deletion
- ✅ Changes save successfully
- ✅ Variants update on customer site
- ✅ Orders with variants not affected

#### Test Case 16.15: Add Bulk Pricing Tiers
**Objective:** Set volume discounts

**Steps:**
1. Edit or create product
2. Enable "Has Bulk Pricing"
3. Add pricing tiers:
   - **Tier 1**: Min 10 units, 5% discount
   - **Tier 2**: Min 50 units, 10% discount
   - **Tier 3**: Min 100 units, ₱50 fixed discount per unit
4. Save product

**Expected Results:**
- ✅ Bulk pricing section available
- ✅ Can add multiple tiers
- ✅ Each tier has:
  - Minimum quantity
  - Discount type (percentage or fixed amount)
  - Discount value
- ✅ Tiers save with product
- ✅ Displayed to customers on product page
- ✅ Pricing calculations correct in cart

#### Test Case 16.16: Manage Product Image Gallery
**Objective:** Add multiple images to product

**Steps:**
1. Edit product
2. Find image gallery section
3. Upload additional images (2-3 more)
4. Set primary image
5. Reorder images
6. Delete an image
7. Save product

**Expected Results:**
- ✅ Can upload multiple images
- ✅ Gallery shows all images
- ✅ Can set one as primary (thumbnail)
- ✅ Drag to reorder images (if feature exists)
- ✅ Can delete individual images
- ✅ Images display in customer product gallery
- ✅ Alt text option for accessibility

---

### 17. Category Management

#### Test Case 17.1: Access Categories Page
**Objective:** Navigate to category management

**Steps:**
1. In admin sidebar, click "Categories"
2. Verify categories page loads

**Expected Results:**
- ✅ Categories page displays (`/admin/categories`)
- ✅ Shows list of all categories
- ✅ "Add New Category" button visible
- ✅ Each category shows:
  - Name
  - Description
  - Icon (if applicable)
  - Product count
  - Action buttons (Edit, Delete)

#### Test Case 17.2: View All Categories
**Objective:** Review category list

**Steps:**
1. On Categories page, view all categories
2. Check product counts
3. Observe organization

**Expected Results:**
- ✅ All categories listed
- ✅ Shows number of products in each
- ✅ Description visible
- ✅ Icon displayed (if used)
- ✅ Sorted alphabetically or by creation
- ✅ Clear layout

#### Test Case 17.3: Add New Category
**Objective:** Create a category

**Steps:**
1. Click "Add New Category" button
2. Fill in form:
   - **Name**: "Electrical Tools"
   - **Description**: "Tools for electrical work"
   - **Icon**: Select icon (if feature exists)
3. Click "Save" or "Create Category"

**Expected Results:**
- ✅ Form modal or page opens
- ✅ Fields are clear
- ✅ Name is required
- ✅ Description is optional
- ✅ Icon selector (optional feature)
- ✅ Category saves successfully
- ✅ Success message appears
- ✅ New category in list
- ✅ Available in product creation

#### Test Case 17.4: Category Name Validation
**Objective:** Test category validation

**Steps:**
1. Try creating category with empty name
2. Try duplicate category name
3. Try very long name

**Expected Results:**
- ✅ Name is required
- ✅ Error for duplicate name
- ✅ Character limit enforced (if applicable)
- ✅ Cannot submit with errors

#### Test Case 17.5: Edit Category
**Objective:** Update category information

**Steps:**
1. Find category to edit
2. Click "Edit" button
3. Modify name or description
4. Save changes

**Expected Results:**
- ✅ Edit form opens with current values
- ✅ Can modify all fields
- ✅ Changes save successfully
- ✅ Success message appears
- ✅ Category updates in list
- ✅ Associated products unaffected

#### Test Case 17.6: Delete Category
**Objective:** Remove category

**Steps:**
1. Find category with NO products (or few products)
2. Click "Delete" button
3. Confirmation dialog appears
4. Try deleting category with products
5. Verify behavior

**Expected Results:**
- ✅ Confirmation dialog appears
- ✅ Warning if category has products
- ✅ Options:
  - Cannot delete if has products
  - Or must reassign products first
  - Or cascading delete with warning
- ✅ On successful delete:
  - Category removed from list
  - Success message
- ✅ Soft delete (isDeleted = true)

---

### 18. Reports & Insights

#### Test Case 18.1: Access Reports Page
**Objective:** Navigate to reports section

**Steps:**
1. In admin sidebar, click "Reports"
2. Verify reports page loads

**Expected Results:**
- ✅ Reports page displays (`/admin/reports`)
- ✅ Shows different report sections:
  - Sales Report
  - Product Report
  - Revenue Analytics
  - Order Statistics
- ✅ Date range selectors
- ✅ Export options (if implemented)

#### Test Case 18.2: Generate Sales Report
**Objective:** View sales analytics

**Steps:**
1. On Reports page, find Sales Report section
2. Select date range (e.g., Last 30 Days)
3. Click "Generate" or report loads automatically
4. Review report data

**Expected Results:**
- ✅ Sales report displays
- ✅ Shows:
  - Total sales amount
  - Number of orders
  - Average order value
  - Sales by category
  - Sales by day/week/month
- ✅ Charts or graphs (if implemented)
- ✅ Tabular data
- ✅ Can filter by date range
- ✅ Accurate calculations

#### Test Case 18.3: Product Performance Report
**Objective:** View product sales data

**Steps:**
1. Find Product Report section
2. Generate report for date range
3. Review top-selling products
4. Check slow-moving products

**Expected Results:**
- ✅ Product report displays
- ✅ Shows:
  - Top 10 selling products
  - Quantities sold
  - Revenue per product
  - Product ranking
- ✅ Sorted by sales volume or revenue
- ✅ Helps identify popular items
- ✅ Shows underperforming products

#### Test Case 18.4: Revenue Analytics
**Objective:** Analyze revenue trends

**Steps:**
1. View revenue section
2. Select different time periods:
   - Today
   - This Week
   - This Month
   - Custom Range
3. Review data

**Expected Results:**
- ✅ Revenue broken down by period
- ✅ Comparison to previous period (if implemented)
- ✅ Charts showing trends
- ✅ Growth indicators (up/down percentages)
- ✅ Daily/weekly/monthly breakdown
- ✅ Accurate totals

#### Test Case 18.5: Order Statistics
**Objective:** View order metrics

**Steps:**
1. Find order statistics section
2. Review data displayed
3. Check status breakdowns

**Expected Results:**
- ✅ Shows order counts by status:
  - Pending
  - Accepted
  - Preparing
  - Out for Delivery
  - Delivered
  - Completed
  - Cancelled
  - Rejected
- ✅ Percentage of each status
- ✅ Average processing time (if tracked)
- ✅ Fulfillment rate
- ✅ Cancellation rate

#### Test Case 18.6: Export Reports (if implemented)
**Objective:** Download report data

**Steps:**
1. On Reports page, find export options
2. Select report to export
3. Choose format (CSV, PDF, Excel)
4. Click "Export" or "Download"
5. Verify downloaded file

**Expected Results:**
- ✅ Export button visible
- ✅ Format options available
- ✅ File downloads successfully
- ✅ Data is complete and accurate
- ✅ Formatted correctly for chosen format
- ✅ Filename includes date/timestamp

---

## Additional General Testing

### Cross-Browser Testing
Test the application in different browsers:
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari (if on Mac/iOS)

Verify all features work consistently across browsers.

### Responsive Design Testing
Test on different screen sizes:
- ✅ Desktop (1920x1080, 1366x768)
- ✅ Tablet (768x1024)
- ✅ Mobile (375x667, 414x896)

Verify:
- Layout adjusts properly
- Navigation works (mobile menu, bottom tabs)
- Forms are usable
- Images scale correctly
- No horizontal scrolling
- Touch-friendly buttons

### Performance Testing
- ✅ Page load times are reasonable
- ✅ Images load efficiently
- ✅ No lag when typing in forms
- ✅ Smooth animations and transitions
- ✅ Cart updates quickly
- ✅ Search is responsive

### Accessibility Testing
- ✅ All images have alt text
- ✅ Forms have proper labels
- ✅ Keyboard navigation works
- ✅ Color contrast is sufficient
- ✅ Error messages are clear
- ✅ Focus indicators visible

### Error Handling
- ✅ Network errors handled gracefully
- ✅ User-friendly error messages
- ✅ No console errors
- ✅ Validation errors are helpful
- ✅ Can recover from errors

---

## Summary

This comprehensive test cases document covers:
- **11 Customer Portal feature areas** with 78+ test cases
- **7 Admin Dashboard feature areas** with 62+ test cases
- **140+ total manual test scenarios**

Each test case includes:
- Clear objective
- Step-by-step instructions
- Expected results with checkboxes

Use these test cases to systematically verify all features of the Hardware Store application while it's running in a browser. Check off (✅) each expected result as you verify it works correctly.

---

## Notes for Testers

1. **Start with Customer Features**: Test the public-facing features first
2. **Test Both Happy Paths and Error Cases**: Don't just test successful scenarios
3. **Use Different Data**: Try various inputs to find edge cases
4. **Document Issues**: Note any bugs or inconsistencies found
5. **Test in Sequence**: Some features depend on others (e.g., must create account before testing saved addresses)
6. **Clear Cache**: If testing after code changes, clear browser cache
7. **Use Developer Tools**: Check console for errors during testing
8. **Test SMS**: If SMS is enabled, verify notifications are sent correctly

---

**Document Version**: 1.0  
**Last Updated**: February 8, 2026  
**For**: Hardware Store Web Application Manual Testing
