# E-Cart API Documentation

## Auth Middleware

| Middleware | Applied To | Checks |
|---|---|---|
| `authUser` | All protected routes | Valid JWT token |
| `authCustomer` | Customer-only routes | `role === 'customer'` |
| `authSeller` | Seller-only routes | `role === 'seller'` + `isVerified === true` |
| `authAdmin` | Admin-only routes | `role === 'admin'` |

> `authUser` must always come **before** any role middleware.

---

## isVerified Behaviour

| Role | Default `isVerified` | How it becomes `true` |
|---|---|---|
| `customer` | `true` (auto on register) | Automatic |
| `admin` | `true` (auto on register) | Automatic |
| `seller` | `false` | Admin must call `PUT /api/admin/seller/verify/:id` |

---

## User Routes

Base URL: `/api/user`

---

### 1. Register

| | |
|---|---|
| **Method** | `POST` |
| **Endpoint** | `/api/user/register` |
| **Auth** | No Auth Required |

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | String | ✅ | Full name (3–50 characters) |
| `email` | String | ✅ | Valid email address |
| `password` | String | ✅ | Minimum 6 characters |
| `phone` | String | ✅ | 10-digit phone number |
| `isSeller` | Boolean | ❌ | `true` to register as a Seller, default `false` (Customer) |

#### Request Example

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secret123",
  "phone": "9876543210",
  "isSeller": false
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | Boolean | `true` on success |
| `message` | String | `"User registered successfully"` or `"Seller registered successfully"` |
| `token` | String | JWT auth token |
| `user.id` | String | MongoDB user ID |
| `user.name` | String | Full name |
| `user.email` | String | Email address |
| `user.role` | String | `"customer"` or `"seller"` |
| `user.phone` | String | Phone number |

#### Response Example

```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "65f1a2b3c4d5e6f7a8b9c0d1",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "customer",
    "phone": "9876543210"
  }
}
```

---

### 2. Login

| | |
|---|---|
| **Method** | `POST` |
| **Endpoint** | `/api/user/login` |
| **Auth** | No Auth Required |

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | String | ✅ | Registered email address |
| `password` | String | ✅ | Account password |

#### Request Example

```json
{
  "email": "john@example.com",
  "password": "secret123"
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | Boolean | `true` on success |
| `message` | String | `"Logged in successfully"` |
| `token` | String | JWT auth token |
| `redirectTo` | String | Frontend redirect path based on role |
| `user.id` | String | MongoDB user ID |
| `user.name` | String | Full name |
| `user.email` | String | Email address |
| `user.role` | String | `"customer"`, `"seller"`, or `"admin"` |
| `user.isVerified` | Boolean | `true` for customer/admin, `false` for unverified seller |

#### Response Example

```json
{
  "success": true,
  "message": "Logged in successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "redirectTo": "/",
  "user": {
    "id": "65f1a2b3c4d5e6f7a8b9c0d1",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "customer",
    "isVerified": true
  }
}
```

#### Redirect Paths by Role

| Role | `redirectTo` |
|------|-------------|
| `customer` | `/` |
| `seller` | `/seller/dashboard` |
| `admin` | `/admin/dashboard` |

---

### 3. Get Profile

| | |
|---|---|
| **Method** | `GET` |
| **Endpoint** | `/api/user/profile` |
| **Auth** | `authUser` |

#### Headers

| Key | Value |
|-----|-------|
| `Authorization` | `Bearer <token>` |

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | Boolean | `true` on success |
| `user.id` | String | MongoDB user ID |
| `user.name` | String | Full name |
| `user.email` | String | Email address |
| `user.role` | String | `"customer"`, `"seller"`, or `"admin"` |
| `user.phone` | String | Phone number |
| `user.isVerified` | Boolean | Verification status |
| `user.createdAt` | Date | Account creation timestamp |

#### Response Example

```json
{
  "success": true,
  "user": {
    "id": "65f1a2b3c4d5e6f7a8b9c0d1",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "customer",
    "phone": "9876543210",
    "isVerified": true,
    "createdAt": "2026-02-28T10:30:00.000Z"
  }
}
```

---

### 4. Logout

| | |
|---|---|
| **Method** | `POST` |
| **Endpoint** | `/api/user/logout` |
| **Auth** | `authUser` |

#### Headers

| Key | Value |
|-----|-------|
| `Authorization` | `Bearer <token>` |

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | Boolean | `true` on success |
| `message` | String | `"Logged out successfully"` |

#### Response Example

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

> **Note:** The server clears the `token` cookie. The client should also remove the token from `localStorage` / `sessionStorage`.

---

## Seller Routes

Base URL: `/api/seller`

---

### 1. Create Seller Profile

| | |
|---|---|
| **Method** | `POST` |
| **Endpoint** | `/api/seller/create` |
| **Auth** | `authUser` |
| **Role** | User must have `role: "seller"` (register with `isSeller: true`) |

> After creating a profile, the seller's `isVerified` remains `false` until an admin approves them via `PUT /api/admin/seller/verify/:id`.

#### Headers

| Key | Value |
|-----|-------|
| `Authorization` | `Bearer <token>` |

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `shopName` | String | ✅ | Name of the seller's shop (min 3 chars) |
| `gstNumber` | String | ✅ | Valid GST number (must be unique) |
| `panNumber` | String | ✅ | Valid PAN number (must be unique) |
| `bankDetails` | Object | ❌ | `{ accountHolderName, accountNumber, ifscCode }` |

#### Request Example

```json
{
  "shopName": "Tech Store",
  "gstNumber": "22AAAAA0000A1Z5",
  "panNumber": "AAAAA0000A",
  "bankDetails": {
    "accountHolderName": "John Doe",
    "accountNumber": "1234567890",
    "ifscCode": "SBIN0001234"
  }
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | Boolean | `true` on success |
| `message` | String | `"Seller profile created successfully. Waiting for admin approval."` |
| `seller._id` | String | MongoDB seller profile ID |
| `seller.user` | String | Linked MongoDB user ID |
| `seller.shopName` | String | Shop name |
| `seller.gstNumber` | String | GST number (uppercased) |
| `seller.panNumber` | String | PAN number (uppercased) |
| `seller.isApproved` | Boolean | Always `false` on creation |

#### Response Example

```json
{
  "success": true,
  "message": "Seller profile created successfully. Waiting for admin approval.",
  "seller": {
    "_id": "65f1a2b3c4d5e6f7a8b9c0d2",
    "user": "65f1a2b3c4d5e6f7a8b9c0d1",
    "shopName": "Tech Store",
    "gstNumber": "22AAAAA0000A1Z5",
    "panNumber": "AAAAA0000A",
    "isApproved": false
  }
}
```

---

### 2. Get Seller Profile

| | |
|---|---|
| **Method** | `GET` |
| **Endpoint** | `/api/seller/profile` |
| **Auth** | `authUser` + `authSeller` |
| **Role** | `seller` (must be verified by admin) |

#### Headers

| Key | Value |
|-----|-------|
| `Authorization` | `Bearer <token>` |

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | Boolean | `true` on success |
| `seller._id` | String | MongoDB seller profile ID |
| `seller.shopName` | String | Shop name |
| `seller.gstNumber` | String | GST number |
| `seller.panNumber` | String | PAN number |
| `seller.isApproved` | Boolean | Admin approval status |
| `seller.user` | Object | Populated user: `name`, `email`, `phone`, `role` |
| `seller.pickupAddress` | Object / null | Populated pickup address |

#### Response Example

```json
{
  "success": true,
  "seller": {
    "_id": "65f1a2b3c4d5e6f7a8b9c0d2",
    "shopName": "Tech Store",
    "gstNumber": "22AAAAA0000A1Z5",
    "panNumber": "AAAAA0000A",
    "isApproved": true,
    "user": {
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "9876543210",
      "role": "seller"
    },
    "pickupAddress": null
  }
}
```

---

### 3. Update Seller Profile

| | |
|---|---|
| **Method** | `PUT` |
| **Endpoint** | `/api/seller/profile/:id` |
| **Auth** | `authUser` + `authSeller` |
| **Role** | `seller` (must be verified by admin) |

> `gstNumber` and `panNumber` cannot be changed after profile creation.

#### Headers

| Key | Value |
|-----|-------|
| `Authorization` | `Bearer <token>` |

#### URL Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | String | MongoDB ID of the seller profile |

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `shopName` | String | ❌ | Updated shop name |
| `bankDetails` | Object | ❌ | Updated bank account details |
| `pickupAddress` | String | ❌ | Address ID for pickup location |

#### Request Example

```json
{
  "shopName": "Tech Mega Store",
  "bankDetails": {
    "accountHolderName": "John Doe",
    "accountNumber": "9876543210",
    "ifscCode": "HDFC0001234"
  }
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | Boolean | `true` on success |
| `message` | String | `"Seller profile updated successfully"` |
| `seller._id` | String | MongoDB seller profile ID |
| `seller.shopName` | String | Updated shop name |
| `seller.gstNumber` | String | GST number (unchanged) |
| `seller.panNumber` | String | PAN number (unchanged) |
| `seller.isApproved` | Boolean | Admin approval status |

#### Response Example

```json
{
  "success": true,
  "message": "Seller profile updated successfully",
  "seller": {
    "_id": "65f1a2b3c4d5e6f7a8b9c0d2",
    "shopName": "Tech Mega Store",
    "gstNumber": "22AAAAA0000A1Z5",
    "panNumber": "AAAAA0000A",
    "isApproved": true
  }
}
```

---

## Admin Routes

Base URL: `/api/admin`

> All admin routes require `authUser` + `authAdmin` middleware.

---

### Seller Management

---

### 1. Get All Sellers

| | |
|---|---|
| **Method** | `GET` |
| **Endpoint** | `/api/admin/sellers` |
| **Auth** | `authUser` + `authAdmin` |

#### Headers

| Key | Value |
|-----|-------|
| `Authorization` | `Bearer <token>` |

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | Boolean | `true` on success |
| `count` | Number | Total number of sellers |
| `sellers` | Array | List of all seller profiles |
| `sellers[].shopName` | String | Shop name |
| `sellers[].gstNumber` | String | GST number |
| `sellers[].isApproved` | Boolean | Admin approval status |
| `sellers[].user` | Object | Populated user: `name`, `email`, `phone`, `createdAt` |
| `sellers[].pickupAddress` | Object / null | Populated pickup address |

#### Response Example

```json
{
  "success": true,
  "count": 2,
  "sellers": [
    {
      "_id": "65f1a2b3c4d5e6f7a8b9c0d2",
      "shopName": "Tech Store",
      "gstNumber": "22AAAAA0000A1Z5",
      "isApproved": false,
      "user": {
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "9876543210",
        "createdAt": "2026-02-28T10:30:00.000Z"
      }
    }
  ]
}
```

---

### 2. Verify / Approve Seller

| | |
|---|---|
| **Method** | `PUT` |
| **Endpoint** | `/api/admin/seller/verify/:id` |
| **Auth** | `authUser` + `authAdmin` |

> Sets `isApproved: true` on the Seller document **and** `isVerified: true` on the linked User — allowing the seller to access `authSeller` protected routes.

#### Headers

| Key | Value |
|-----|-------|
| `Authorization` | `Bearer <token>` |

#### URL Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | String | MongoDB ID of the seller profile |

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | Boolean | `true` on success |
| `message` | String | `"Seller \"<shopName>\" approved and verified successfully"` |
| `seller._id` | String | MongoDB seller profile ID |
| `seller.shopName` | String | Shop name |
| `seller.isApproved` | Boolean | `true` after approval |
| `seller.user` | Object | Populated user: `name`, `email`, `phone` |

> Also sets `isVerified: true` on the linked User document.

#### Response Example

```json
{
  "success": true,
  "message": "Seller \"Tech Store\" approved and verified successfully",
  "seller": {
    "_id": "65f1a2b3c4d5e6f7a8b9c0d2",
    "shopName": "Tech Store",
    "isApproved": true,
    "user": {
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "9876543210"
    }
  }
}
```

---

### Category Management

---

### 3. Create Category

| | |
|---|---|
| **Method** | `POST` |
| **Endpoint** | `/api/admin/category` |
| **Auth** | `authUser` + `authAdmin` |

#### Headers

| Key | Value |
|-----|-------|
| `Authorization` | `Bearer <token>` |

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | String | ✅ | Unique name of the category |
| `parentCategory` | String | ❌ | MongoDB ID of parent category (for sub-categories) |

#### Request Example

```json
{
  "name": "Electronics",
  "parentCategory": null
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | MongoDB category ID |
| `name` | String | Category name |
| `parentCategory` | String / null | Parent category ID (`null` for root) |
| `level` | Number | Category depth (`0` = root, `1` = sub-category, etc.) |

#### Response Example

```json
{
  "_id": "65f1a2b3c4d5e6f7a8b9c0d3",
  "name": "Electronics",
  "parentCategory": null,
  "level": 0
}
```

---

### 4. Get All Categories

| | |
|---|---|
| **Method** | `GET` |
| **Endpoint** | `/api/admin/categories` |
| **Auth** | `authUser` + `authAdmin` |

#### Headers

| Key | Value |
|-----|-------|
| `Authorization` | `Bearer <token>` |

#### Response Fields

Returns an array of category objects with `parentCategory` populated.

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | MongoDB category ID |
| `name` | String | Category name |
| `parentCategory` | Object / null | Populated parent category (`_id`, `name`) or `null` |
| `level` | Number | Category depth |

#### Response Example

```json
[
  {
    "_id": "65f1a2b3c4d5e6f7a8b9c0d3",
    "name": "Electronics",
    "parentCategory": null,
    "level": 0
  },
  {
    "_id": "65f1a2b3c4d5e6f7a8b9c0d4",
    "name": "Mobile Phones",
    "parentCategory": { "_id": "65f1a2b3c4d5e6f7a8b9c0d3", "name": "Electronics" },
    "level": 1
  }
]
```

---

### 5. Get Category by ID

| | |
|---|---|
| **Method** | `GET` |
| **Endpoint** | `/api/admin/category/:id` |
| **Auth** | `authUser` + `authAdmin` |

#### Headers

| Key | Value |
|-----|-------|
| `Authorization` | `Bearer <token>` |

#### URL Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | String | MongoDB ID of the category |

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | MongoDB category ID |
| `name` | String | Category name |
| `parentCategory` | Object / null | Populated parent category or `null` |
| `level` | Number | Category depth |

#### Response Example

```json
{
  "_id": "65f1a2b3c4d5e6f7a8b9c0d3",
  "name": "Electronics",
  "parentCategory": null,
  "level": 0
}
```

---

### 6. Update Category

| | |
|---|---|
| **Method** | `PUT` |
| **Endpoint** | `/api/admin/category/:id` |
| **Auth** | `authUser` + `authAdmin` |

#### Headers

| Key | Value |
|-----|-------|
| `Authorization` | `Bearer <token>` |

#### URL Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | String | MongoDB ID of the category to update |

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | String | ✅ | Updated category name |
| `parentCategory` | String | ❌ | Updated parent category ID |

#### Request Example

```json
{
  "name": "Consumer Electronics",
  "parentCategory": null
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | MongoDB category ID |
| `name` | String | Updated category name |
| `parentCategory` | Object / null | Updated parent category or `null` |
| `level` | Number | Category depth |

#### Response Example

```json
{
  "_id": "65f1a2b3c4d5e6f7a8b9c0d3",
  "name": "Consumer Electronics",
  "parentCategory": null,
  "level": 0
}
```

---

### 7. Delete Category

| | |
|---|---|
| **Method** | `DELETE` |
| **Endpoint** | `/api/admin/category/:id` |
| **Auth** | `authUser` + `authAdmin` |

#### Headers

| Key | Value |
|-----|-------|
| `Authorization` | `Bearer <token>` |

#### URL Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | String | MongoDB ID of the category to delete |

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `message` | String | `"Category deleted successfully"` |

#### Response Example

```json
{
  "message": "Category deleted successfully"
}
```

---

### Address Management (Admin)

---

### 8. Get All Addresses

| | |
|---|---|
| **Method** | `GET` |
| **Endpoint** | `/api/admin/addresses` |
| **Auth** | `authUser` + `authAdmin` |

#### Headers

| Key | Value |
|-----|-------|
| `Authorization` | `Bearer <token>` |

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | Boolean | `true` on success |
| `count` | Number | Total number of addresses |
| `addresses` | Array | All address documents across all users |
| `addresses[].user` | Object | Populated user: `name`, `email` |
| `addresses[].fullname` | String | Recipient full name |
| `addresses[].phone` | String | Recipient phone |
| `addresses[].street` | String | Street line |
| `addresses[].city` | String | City |
| `addresses[].state` | String | State |
| `addresses[].country` | String | Country |
| `addresses[].pincode` | String | Postal code |
| `addresses[].isDefault` | Boolean | Whether this is user's default address |

#### Response Example

```json
{
  "success": true,
  "count": 2,
  "addresses": [
    {
      "_id": "65f1a2b3c4d5e6f7a8b9c0d5",
      "user": { "name": "John Doe", "email": "john@example.com" },
      "fullname": "John Doe",
      "phone": "9876543210",
      "street": "123 Main St",
      "city": "Mumbai",
      "state": "Maharashtra",
      "country": "India",
      "pincode": "400001",
      "isDefault": true
    }
  ]
}
```

---

### Product Management (Admin)

---

### 9. Get All Products — Admin

| | |
|---|---|
| **Method** | `GET` |
| **Endpoint** | `/api/admin/products` |
| **Auth** | `authUser` + `authAdmin` |

#### Headers

| Key | Value |
|-----|-------|
| `Authorization` | `Bearer <token>` |

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | String | ❌ | Filter by `PENDING`, `APPROVED`, or `BLOCKED` |
| `category` | String | ❌ | Category ID |
| `brand` | String | ❌ | Brand (partial match) |
| `search` | String | ❌ | Search in title, description, brand |
| `page` | Number | ❌ | Page number (default `1`) |
| `limit` | Number | ❌ | Items per page (default `20`) |

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | Boolean | `true` on success |
| `total` | Number | Total matching products |
| `page` | Number | Current page |
| `pages` | Number | Total pages |
| `products` | Array | Product list |
| `products[].title` | String | Product title |
| `products[].brand` | String | Brand name |
| `products[].status` | String | `PENDING`, `APPROVED`, or `BLOCKED` |
| `products[].category` | Object | Populated: `name`, `level` |
| `products[].seller` | Object | Populated: `shopName` |
| `products[].price` | Number | Base price |
| `products[].discount` | Number | Discount percentage |

#### Response Example

```json
{
  "success": true,
  "total": 42,
  "page": 1,
  "pages": 3,
  "products": [
    {
      "_id": "65f1a2b3c4d5e6f7a8b9c0d6",
      "title": "Wireless Headphones",
      "brand": "Sony",
      "status": "PENDING",
      "category": { "_id": "65f...", "name": "Electronics", "level": 0 },
      "seller": { "shopName": "Tech Store" },
      "price": 2999,
      "discount": 10
    }
  ]
}
```

---

### 10. Approve Product

| | |
|---|---|
| **Method** | `PUT` |
| **Endpoint** | `/api/admin/product/approve/:id` |
| **Auth** | `authUser` + `authAdmin` |

#### Headers

| Key | Value |
|-----|-------|
| `Authorization` | `Bearer <token>` |

#### URL Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | String | MongoDB ID of the product |

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | Boolean | `true` on success |
| `message` | String | `"Product \"<title>\" approved successfully"` |
| `product` | Object | Updated product with `status: "APPROVED"` |
| `product.seller` | Object | Populated: `shopName` |

#### Response Example

```json
{
  "success": true,
  "message": "Product \"Wireless Headphones\" approved successfully",
  "product": {
    "_id": "65f1a2b3c4d5e6f7a8b9c0d6",
    "title": "Wireless Headphones",
    "status": "APPROVED",
    "seller": { "shopName": "Tech Store" }
  }
}
```

---

### 11. Block Product

| | |
|---|---|
| **Method** | `PUT` |
| **Endpoint** | `/api/admin/product/block/:id` |
| **Auth** | `authUser` + `authAdmin` |

#### Headers

| Key | Value |
|-----|-------|
| `Authorization` | `Bearer <token>` |

#### URL Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | String | MongoDB ID of the product |

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | Boolean | `true` on success |
| `message` | String | `"Product \"<title>\" blocked successfully"` |
| `product` | Object | Updated product with `status: "BLOCKED"` |

#### Response Example

```json
{
  "success": true,
  "message": "Product \"Wireless Headphones\" blocked successfully",
  "product": {
    "_id": "65f1a2b3c4d5e6f7a8b9c0d6",
    "title": "Wireless Headphones",
    "status": "BLOCKED"
  }
}
```

---

### Product Variant Management (Admin)

---

### 12. Get All Variants — Admin

| | |
|---|---|
| **Method** | `GET` |
| **Endpoint** | `/api/admin/variants` |
| **Auth** | `authUser` + `authAdmin` |

#### Headers

| Key | Value |
|-----|-------|
| `Authorization` | `Bearer <token>` |

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `productId` | String | ❌ | Filter by product ID |
| `isActive` | Boolean | ❌ | `true` or `false` |
| `page` | Number | ❌ | Page number (default `1`) |
| `limit` | Number | ❌ | Items per page (default `20`) |

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | Boolean | `true` on success |
| `total` | Number | Total matching variants |
| `page` | Number | Current page |
| `pages` | Number | Total pages |
| `variants` | Array | Variant list |
| `variants[].sku` | String | Auto-generated SKU |
| `variants[].attributes` | Object | Key-value map e.g. `{ color: "Red", size: "XL" }` |
| `variants[].stock` | Number | Available stock |
| `variants[].price` | Number | Variant price |
| `variants[].isActive` | Boolean | Active/blocked status |
| `variants[].product` | Object | Populated: `title`, `brand`, `status` |

#### Response Example

```json
{
  "success": true,
  "total": 12,
  "page": 1,
  "pages": 1,
  "variants": [
    {
      "_id": "65f1a2b3c4d5e6f7a8b9c0d7",
      "sku": "C0D123-RED-XL-M5X2KAB",
      "attributes": { "color": "Red", "size": "XL" },
      "stock": 50,
      "price": 2699,
      "isActive": true,
      "product": { "title": "Wireless Headphones", "brand": "Sony", "status": "APPROVED" }
    }
  ]
}
```

---

### 13. Block / Unblock Variant

| | |
|---|---|
| **Method** | `PUT` |
| **Endpoint** | `/api/admin/variant/block/:id` |
| **Auth** | `authUser` + `authAdmin` |

#### Headers

| Key | Value |
|-----|-------|
| `Authorization` | `Bearer <token>` |

#### URL Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | String | MongoDB ID of the variant |

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | Boolean | `true` on success |
| `message` | String | `"Variant blocked successfully"` or `"Variant unblocked successfully"` |
| `isActive` | Boolean | New active state |
| `variant` | Object | Updated variant document |

#### Response Example

```json
{
  "success": true,
  "message": "Variant blocked successfully",
  "isActive": false,
  "variant": {
    "_id": "65f1a2b3c4d5e6f7a8b9c0d7",
    "sku": "C0D123-RED-XL-M5X2KAB",
    "isActive": false
  }
}
```

---

### 14. Update Variant — Admin

| | |
|---|---|
| **Method** | `PUT` |
| **Endpoint** | `/api/admin/variant/:id` |
| **Auth** | `authUser` + `authAdmin` |

#### Headers

| Key | Value |
|-----|-------|
| `Authorization` | `Bearer <token>` |

#### URL Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | String | MongoDB ID of the variant |

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `stock` | Number | ❌ | New stock value |
| `price` | Number | ❌ | New price |
| `attributes` | Object | ❌ | New attribute map (triggers SKU regeneration) |

#### Request Example

```json
{
  "stock": 75,
  "price": 2499,
  "attributes": { "color": "Blue", "size": "XL" }
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | Boolean | `true` on success |
| `message` | String | `"Variant updated successfully"` |
| `variant` | Object | Updated variant with new `sku` (if attributes changed) |

#### Response Example

```json
{
  "success": true,
  "message": "Variant updated successfully",
  "variant": {
    "_id": "65f1a2b3c4d5e6f7a8b9c0d7",
    "sku": "C0D123-BLUE-XL-M5X9CAZ",
    "stock": 75,
    "price": 2499,
    "isActive": true
  }
}
```

---

### 15. Delete Variant — Admin

| | |
|---|---|
| **Method** | `DELETE` |
| **Endpoint** | `/api/admin/variant/:id` |
| **Auth** | `authUser` + `authAdmin` |

#### Headers

| Key | Value |
|-----|-------|
| `Authorization` | `Bearer <token>` |

#### URL Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | String | MongoDB ID of the variant |

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | Boolean | `true` on success |
| `message` | String | `"Variant deleted successfully"` |

#### Response Example

```json
{
  "success": true,
  "message": "Variant deleted successfully"
}
```

---

### Payment Management (Admin)

---

### 16. Get All Payments — Admin

| | |
|---|---|
| **Method** | `GET` |
| **Endpoint** | `/api/admin/payments` |
| **Auth** | `authUser` + `authAdmin` |

#### Headers

| Key | Value |
|-----|-------|
| `Authorization` | `Bearer <token>` |

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | String | ❌ | `PENDING`, `COMPLETED`, `FAILED`, or `REFUNDED` |
| `page` | Number | ❌ | Page number (default `1`) |
| `limit` | Number | ❌ | Items per page (default `20`) |

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | Boolean | `true` on success |
| `total` | Number | Total matching payments |
| `page` | Number | Current page |
| `pages` | Number | Total pages |
| `payments` | Array | Payment documents |
| `payments[].user` | Object | Populated: `name`, `email` |
| `payments[].order` | Object | Populated: `status`, `paymentStatus`, `createdAt` |
| `payments[].paymentGateway` | String | `RAZORPAY` or `COD` |
| `payments[].paymentMethod` | String | `CARD`, `UPI`, `NETBANKING`, `WALLET`, or `COD` |
| `payments[].amount` | Number | Payment amount in ₹ |
| `payments[].status` | String | `PENDING`, `COMPLETED`, `FAILED`, or `REFUNDED` |

#### Response Example

```json
{
  "success": true,
  "total": 5,
  "page": 1,
  "pages": 1,
  "payments": [
    {
      "_id": "65f1a2b3c4d5e6f7a8b9c0d8",
      "user": { "name": "John Doe", "email": "john@example.com" },
      "order": { "status": "PLACED", "paymentStatus": "COMPLETED", "createdAt": "2026-03-01T10:00:00.000Z" },
      "paymentGateway": "RAZORPAY",
      "paymentMethod": "UPI",
      "amount": 2999,
      "status": "COMPLETED"
    }
  ]
}
```

---

### 17. Update Payment Status — Admin

| | |
|---|---|
| **Method** | `PUT` |
| **Endpoint** | `/api/admin/payment/:id/status` |
| **Auth** | `authUser` + `authAdmin` |

#### Headers

| Key | Value |
|-----|-------|
| `Authorization` | `Bearer <token>` |

#### URL Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | String | MongoDB ID of the payment |

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | String | ✅ | One of `PENDING`, `COMPLETED`, `FAILED`, `REFUNDED` |

#### Request Example

```json
{
  "status": "COMPLETED"
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | Boolean | `true` on success |
| `message` | String | `"Payment status updated to COMPLETED"` |
| `payment` | Object | Updated payment document |

#### Response Example

```json
{
  "success": true,
  "message": "Payment status updated to COMPLETED",
  "payment": {
    "_id": "65f1a2b3c4d5e6f7a8b9c0d8",
    "amount": 2999,
    "status": "COMPLETED",
    "paymentGateway": "RAZORPAY"
  }
}
```

---

### 18. Refund Payment — Admin

| | |
|---|---|
| **Method** | `POST` |
| **Endpoint** | `/api/admin/payment/:id/refund` |
| **Auth** | `authUser` + `authAdmin` |

> For Razorpay payments, triggers a real refund via the Razorpay API. For COD, marks the payment as `REFUNDED` manually.

#### Headers

| Key | Value |
|-----|-------|
| `Authorization` | `Bearer <token>` |

#### URL Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | String | MongoDB ID of the payment |

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | Boolean | `true` on success |
| `message` | String | Refund result message |
| `refundId` | String | Razorpay refund ID (only for online payments) |
| `payment` | Object | Updated payment with `status: "REFUNDED"` |

#### Response Example

```json
{
  "success": true,
  "message": "Refund initiated successfully via Razorpay.",
  "refundId": "rfnd_FgRAHdNOM4ZVLr",
  "payment": {
    "_id": "65f1a2b3c4d5e6f7a8b9c0d8",
    "amount": 2999,
    "status": "REFUNDED",
    "paymentGateway": "RAZORPAY"
  }
}
```

---

### Order Management (Admin)

---

### 19. Get All Orders — Admin

| | |
|---|---|
| **Method** | `GET` |
| **Endpoint** | `/api/admin/orders` |
| **Auth** | `authUser` + `authAdmin` |

#### Headers

| Key | Value |
|-----|-------|
| `Authorization` | `Bearer <token>` |

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | String | ❌ | Filter by order status |
| `userId` | String | ❌ | Filter by customer user ID |
| `paymentStatus` | String | ❌ | `PENDING`, `COMPLETED`, `FAILED`, or `REFUNDED` |
| `page` | Number | ❌ | Page number (default `1`) |
| `limit` | Number | ❌ | Items per page (default `10`) |

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | Boolean | `true` on success |
| `total` | Number | Total matching orders |
| `page` | Number | Current page |
| `pages` | Number | Total pages |
| `orders` | Array | Order documents |
| `orders[].user` | Object | Customer: `name`, `email`, `phone` |
| `orders[].items` | Array | Order items with product, variant, seller info |
| `orders[].status` | String | Overall order status |
| `orders[].paymentStatus` | String | Denormalized payment status |
| `orders[].payment` | Object | Populated Payment document |
| `orders[].shippingAddress` | Object | Shipping address |

#### Response Example

```json
{
  "success": true,
  "total": 10,
  "page": 1,
  "pages": 1,
  "orders": [
    {
      "_id": "65f1a2b3c4d5e6f7a8b9c0d9",
      "user": { "name": "John Doe", "email": "john@example.com", "phone": "9876543210" },
      "status": "PLACED",
      "paymentStatus": "COMPLETED",
      "items": [
        {
          "product": { "title": "Wireless Headphones", "brand": "Sony" },
          "variant": { "sku": "C0D123-RED-XL-M5X2KAB", "price": 2699 },
          "seller": { "name": "John Seller", "email": "seller@example.com" },
          "quantity": 1,
          "price": 2699,
          "status": "CONFIRMED"
        }
      ],
      "createdAt": "2026-03-01T10:00:00.000Z"
    }
  ]
}
```

---

### 20. Get Order by ID — Admin

| | |
|---|---|
| **Method** | `GET` |
| **Endpoint** | `/api/admin/order/:id` |
| **Auth** | `authUser` + `authAdmin` |

#### Headers

| Key | Value |
|-----|-------|
| `Authorization` | `Bearer <token>` |

#### URL Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | String | MongoDB ID of the order |

#### Response Fields

Same as individual order object in Get All Orders, with full `payment` document populated.

#### Response Example

```json
{
  "success": true,
  "order": {
    "_id": "65f1a2b3c4d5e6f7a8b9c0d9",
    "user": { "name": "John Doe", "email": "john@example.com" },
    "status": "SHIPPED",
    "paymentStatus": "COMPLETED",
    "payment": {
      "_id": "65f1a2b3c4d5e6f7a8b9c0d8",
      "paymentGateway": "RAZORPAY",
      "amount": 2699,
      "status": "COMPLETED"
    }
  }
}
```

---

### 21. Update Order Status — Admin

| | |
|---|---|
| **Method** | `PUT` |
| **Endpoint** | `/api/admin/order/:id/status` |
| **Auth** | `authUser` + `authAdmin` |

#### Headers

| Key | Value |
|-----|-------|
| `Authorization` | `Bearer <token>` |

#### URL Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | String | MongoDB ID of the order |

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | String | ✅ | Any valid order status (see table below) |

#### Valid Order Statuses

| Status | Description |
|--------|-------------|
| `AWAITING_PAYMENT` | Order created, payment not yet done |
| `PLACED` | Payment confirmed |
| `CONFIRMED` | Seller confirmed |
| `SHIPPED` | Dispatched |
| `OUT_FOR_DELIVERY` | Out for delivery |
| `DELIVERED` | Delivered |
| `CANCELLED` | Cancelled |
| `RETURN_REQUESTED` | Return initiated |
| `RETURNED` | Returned |

#### Request Example

```json
{
  "status": "CONFIRMED"
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | Boolean | `true` on success |
| `message` | String | `"Order status updated"` |
| `order` | Object | Updated order with new status |

#### Response Example

```json
{
  "success": true,
  "message": "Order status updated",
  "order": {
    "_id": "65f1a2b3c4d5e6f7a8b9c0d9",
    "status": "CONFIRMED",
    "user": { "name": "John Doe", "email": "john@example.com" }
  }
}
```

---

### 22. Cancel Order — Admin

| | |
|---|---|
| **Method** | `PUT` |
| **Endpoint** | `/api/admin/order/:id/cancel` |
| **Auth** | `authUser` + `authAdmin` |

> Stock is automatically restored for all non-delivered items. Admin can cancel any order that is not already `DELIVERED`, `RETURNED`, or `CANCELLED`.

#### Headers

| Key | Value |
|-----|-------|
| `Authorization` | `Bearer <token>` |

#### URL Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | String | MongoDB ID of the order |

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | Boolean | `true` on success |
| `message` | String | `"Order cancelled successfully"` |
| `order` | Object | Updated order with `status: "CANCELLED"` |

#### Response Example

```json
{
  "success": true,
  "message": "Order cancelled successfully",
  "order": {
    "_id": "65f1a2b3c4d5e6f7a8b9c0d9",
    "status": "CANCELLED"
  }
}
```

---

### 23. Update Item Status — Admin

| | |
|---|---|
| **Method** | `PUT` |
| **Endpoint** | `/api/admin/order/item/:itemId/status` |
| **Auth** | `authUser` + `authAdmin` |

> Admin can set any item status. The top-level order status is automatically synced from all item statuses.

#### Headers

| Key | Value |
|-----|-------|
| `Authorization` | `Bearer <token>` |

#### URL Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `itemId` | String | MongoDB subdocument ID of the order item |

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | String | ✅ | New item status |

#### Request Example

```json
{
  "status": "SHIPPED"
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | Boolean | `true` on success |
| `message` | String | `"Item status updated"` |
| `item` | Object | Updated item subdocument |
| `orderStatus` | String | Recalculated top-level order status |

#### Response Example

```json
{
  "success": true,
  "message": "Item status updated",
  "item": {
    "_id": "65f1a2b3c4d5e6f7a8b9...",
    "status": "SHIPPED",
    "quantity": 1,
    "price": 2699
  },
  "orderStatus": "SHIPPED"
}
```

---

### 24. Process Order Refund — Admin

| | |
|---|---|
| **Method** | `POST` |
| **Endpoint** | `/api/admin/order/:id/refund` |
| **Auth** | `authUser` + `authAdmin` |

> Cancels/returns the order, restores stock for all non-delivered items, and processes a payment refund (Razorpay API for online; manual mark for COD).

#### Headers

| Key | Value |
|-----|-------|
| `Authorization` | `Bearer <token>` |

#### URL Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | String | MongoDB ID of the order |

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | Boolean | `true` on success |
| `message` | String | `"Order refunded and cancelled successfully"` |
| `order` | Object | Updated order with `status: "CANCELLED"/"RETURNED"` and `paymentStatus: "REFUNDED"` |

#### Response Example

```json
{
  "success": true,
  "message": "Order refunded and cancelled successfully",
  "order": {
    "_id": "65f1a2b3c4d5e6f7a8b9c0d9",
    "status": "CANCELLED",
    "paymentStatus": "REFUNDED"
  }
}
```

---

## Address Routes

Base URL: `/api/address`

> All address routes require `authUser`. Both `customer` and `seller` can manage their own addresses.

---

### 1. Create Address

| | |
|---|---|
| **Method** | `POST` |
| **Endpoint** | `/api/address` |
| **Auth** | `authUser` |

#### Headers

| Key | Value |
|-----|-------|
| `Authorization` | `Bearer <token>` |

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `fullname` | String | ✅ | Recipient full name |
| `phone` | String | ✅ | Recipient phone number |
| `street` | String | ✅ | Street / house number |
| `city` | String | ✅ | City |
| `state` | String | ✅ | State |
| `country` | String | ✅ | Country |
| `pincode` | String | ✅ | Postal / ZIP code |
| `isDefault` | Boolean | ❌ | Set as default address (default `false`) |

#### Request Example

```json
{
  "fullname": "John Doe",
  "phone": "9876543210",
  "street": "123 Main Street",
  "city": "Mumbai",
  "state": "Maharashtra",
  "country": "India",
  "pincode": "400001",
  "isDefault": true
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | Boolean | `true` on success |
| `message` | String | `"Address created successfully"` |
| `address._id` | String | MongoDB address ID |
| `address.user` | String | Linked user ID |
| `address.fullname` | String | Recipient name |
| `address.phone` | String | Phone number |
| `address.street` | String | Street |
| `address.city` | String | City |
| `address.state` | String | State |
| `address.country` | String | Country |
| `address.pincode` | String | Pincode |
| `address.isDefault` | Boolean | Default address flag |

#### Response Example

```json
{
  "success": true,
  "message": "Address created successfully",
  "address": {
    "_id": "65f1a2b3c4d5e6f7a8b9c0d5",
    "user": "65f1a2b3c4d5e6f7a8b9c0d1",
    "fullname": "John Doe",
    "phone": "9876543210",
    "street": "123 Main Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "country": "India",
    "pincode": "400001",
    "isDefault": true
  }
}
```

---

### 2. Get My Addresses

| | |
|---|---|
| **Method** | `GET` |
| **Endpoint** | `/api/address` |
| **Auth** | `authUser` |

#### Headers

| Key | Value |
|-----|-------|
| `Authorization` | `Bearer <token>` |

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | Boolean | `true` on success |
| `count` | Number | Number of addresses |
| `addresses` | Array | User's addresses (default first, then newest) |

#### Response Example

```json
{
  "success": true,
  "count": 2,
  "addresses": [
    {
      "_id": "65f1a2b3c4d5e6f7a8b9c0d5",
      "fullname": "John Doe",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400001",
      "isDefault": true
    }
  ]
}
```

---

### 3. Update Address

| | |
|---|---|
| **Method** | `PUT` |
| **Endpoint** | `/api/address/:id` |
| **Auth** | `authUser` |

#### Headers

| Key | Value |
|-----|-------|
| `Authorization` | `Bearer <token>` |

#### URL Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | String | MongoDB ID of the address |

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `fullname` | String | ❌ | Updated recipient name |
| `phone` | String | ❌ | Updated phone |
| `street` | String | ❌ | Updated street |
| `city` | String | ❌ | Updated city |
| `state` | String | ❌ | Updated state |
| `country` | String | ❌ | Updated country |
| `pincode` | String | ❌ | Updated pincode |
| `isDefault` | Boolean | ❌ | Set as default (unsets all others) |

#### Request Example

```json
{
  "city": "Pune",
  "pincode": "411001",
  "isDefault": true
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | Boolean | `true` on success |
| `message` | String | `"Address updated successfully"` |
| `address` | Object | Updated address document |

#### Response Example

```json
{
  "success": true,
  "message": "Address updated successfully",
  "address": {
    "_id": "65f1a2b3c4d5e6f7a8b9c0d5",
    "city": "Pune",
    "pincode": "411001",
    "isDefault": true
  }
}
```

---

### 4. Delete Address

| | |
|---|---|
| **Method** | `DELETE` |
| **Endpoint** | `/api/address/:id` |
| **Auth** | `authUser` |

#### Headers

| Key | Value |
|-----|-------|
| `Authorization` | `Bearer <token>` |

#### URL Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | String | MongoDB ID of the address |

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | Boolean | `true` on success |
| `message` | String | `"Address deleted successfully"` |

#### Response Example

```json
{
  "success": true,
  "message": "Address deleted successfully"
}
```

---

## Public Routes

Base URL: `/api/public`

> No authentication required.

---

### 1. Get All Products — Public

| | |
|---|---|
| **Method** | `GET` |
| **Endpoint** | `/api/public/products` |
| **Auth** | No Auth Required |

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `search` | String | ❌ | Search in title, brand, description |
| `category` | String | ❌ | Category ID |
| `brand` | String | ❌ | Brand name (partial match) |
| `page` | Number | ❌ | Page number (default `1`) |
| `limit` | Number | ❌ | Items per page (default `20`) |

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | Boolean | `true` on success |
| `total` | Number | Total matching approved products |
| `page` | Number | Current page |
| `pages` | Number | Total pages |
| `products` | Array | Approved product list |
| `products[].title` | String | Product title |
| `products[].brand` | String | Brand name |
| `products[].price` | Number | Base price |
| `products[].discount` | Number | Discount % |
| `products[].images` | Array | Image URLs |
| `products[].category` | Object | Populated: `name`, `level` |
| `products[].seller` | Object | Populated: `shopName` |

#### Response Example

```json
{
  "success": true,
  "total": 85,
  "page": 1,
  "pages": 5,
  "products": [
    {
      "_id": "65f1a2b3c4d5e6f7a8b9c0d6",
      "title": "Wireless Headphones",
      "brand": "Sony",
      "price": 2999,
      "discount": 10,
      "images": ["https://example.com/img1.jpg"],
      "category": { "name": "Electronics", "level": 0 },
      "seller": { "shopName": "Tech Store" }
    }
  ]
}
```

---

### 2. Get Product by ID — Public

| | |
|---|---|
| **Method** | `GET` |
| **Endpoint** | `/api/public/product/:id` |
| **Auth** | No Auth Required |

#### URL Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | String | MongoDB ID of the product |

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | Boolean | `true` on success |
| `product` | Object | Full approved product document |
| `product.title` | String | Product title |
| `product.description` | String | Product description |
| `product.brand` | String | Brand name |
| `product.price` | Number | Base price |
| `product.discount` | Number | Discount % |
| `product.images` | Array | Image URL array |
| `product.category` | Object | Populated: `name`, `level` |
| `product.seller` | Object | Populated: `shopName` |

#### Response Example

```json
{
  "success": true,
  "product": {
    "_id": "65f1a2b3c4d5e6f7a8b9c0d6",
    "title": "Wireless Headphones",
    "description": "Premium over-ear headphones with noise cancellation",
    "brand": "Sony",
    "price": 2999,
    "discount": 10,
    "images": ["https://example.com/img1.jpg"],
    "category": { "name": "Electronics", "level": 0 },
    "seller": { "shopName": "Tech Store" }
  }
}
```

---

### 3. Get All Categories — Public

| | |
|---|---|
| **Method** | `GET` |
| **Endpoint** | `/api/public/categories` |
| **Auth** | No Auth Required |

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Category ID |
| `name` | String | Category name |
| `parentCategory` | Object / null | Populated parent or `null` |
| `level` | Number | Depth (`0` = root) |

#### Response Example

```json
[
  { "_id": "65f...", "name": "Electronics", "parentCategory": null, "level": 0 },
  { "_id": "65f...", "name": "Mobile Phones", "parentCategory": { "_id": "65f...", "name": "Electronics" }, "level": 1 }
]
```

---

### 4. Get Variants for a Product — Public

| | |
|---|---|
| **Method** | `GET` |
| **Endpoint** | `/api/public/product/:productId/variants` |
| **Auth** | No Auth Required |

#### URL Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `productId` | String | MongoDB ID of the product |

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | Boolean | `true` on success |
| `count` | Number | Number of active variants |
| `variants` | Array | Active variants sorted by price ascending |
| `variants[].sku` | String | Unique SKU |
| `variants[].attributes` | Object | Variant attributes e.g. `{ color: "Red", size: "XL" }` |
| `variants[].price` | Number | Variant price |
| `variants[].stock` | Number | Available stock |

#### Response Example

```json
{
  "success": true,
  "count": 3,
  "variants": [
    {
      "_id": "65f1a2b3c4d5e6f7a8b9c0d7",
      "sku": "C0D123-BLACK-M-M5X2KAB",
      "attributes": { "color": "Black", "size": "M" },
      "price": 2699,
      "stock": 30
    }
  ]
}
```

---

## Seller Routes (Extended)

Base URL: `/api/seller`

---

### 4. Get Order Payment Status

| | |
|---|---|
| **Method** | `GET` |
| **Endpoint** | `/api/seller/payment/order/:orderId` |
| **Auth** | `authUser` + `authSeller` |

#### Headers

| Key | Value |
|-----|-------|
| `Authorization` | `Bearer <token>` |

#### URL Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `orderId` | String | MongoDB ID of the order |

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | Boolean | `true` on success |
| `orderId` | String | Order ID |
| `paymentStatus` | String | `PENDING`, `COMPLETED`, `FAILED`, or `REFUNDED` |
| `orderStatus` | String | Overall order status |

#### Response Example

```json
{
  "success": true,
  "orderId": "65f1a2b3c4d5e6f7a8b9c0d9",
  "paymentStatus": "COMPLETED",
  "orderStatus": "CONFIRMED"
}
```

---

## Product Routes

Base URL: `/api/product`

> All routes require `authUser` + `authSeller` (verified seller only).

---

### 1. Create Product

| | |
|---|---|
| **Method** | `POST` |
| **Endpoint** | `/api/product` |
| **Auth** | `authUser` + `authSeller` |

> Product is created with `status: "PENDING"`. Admin must approve before it becomes publicly visible.

#### Headers

| Key | Value |
|-----|-------|
| `Authorization` | `Bearer <token>` |

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | String | ✅ | Product title |
| `description` | String | ❌ | Product description |
| `brand` | String | ❌ | Brand name |
| `category` | String | ✅ | Category ID |
| `images` | Array | ✅ | At least one image URL |
| `price` | Number | ✅ | Base price in ₹ |
| `discount` | Number | ❌ | Discount percentage (default `0`) |

#### Request Example

```json
{
  "title": "Wireless Headphones",
  "description": "Premium over-ear noise cancellation headphones",
  "brand": "Sony",
  "category": "65f1a2b3c4d5e6f7a8b9c0d3",
  "images": ["https://example.com/img1.jpg"],
  "price": 2999,
  "discount": 10
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | Boolean | `true` on success |
| `message` | String | `"Product listed successfully. Waiting for admin approval."` |
| `product._id` | String | MongoDB product ID |
| `product.title` | String | Product title |
| `product.status` | String | Always `"PENDING"` on creation |
| `product.seller` | String | Seller ID |
| `product.price` | Number | Base price |
| `product.discount` | Number | Discount % |

#### Response Example

```json
{
  "success": true,
  "message": "Product listed successfully. Waiting for admin approval.",
  "product": {
    "_id": "65f1a2b3c4d5e6f7a8b9c0d6",
    "title": "Wireless Headphones",
    "brand": "Sony",
    "status": "PENDING",
    "price": 2999,
    "discount": 10
  }
}
```

---

### 2. Get My Products

| | |
|---|---|
| **Method** | `GET` |
| **Endpoint** | `/api/product` |
| **Auth** | `authUser` + `authSeller` |

#### Headers

| Key | Value |
|-----|-------|
| `Authorization` | `Bearer <token>` |

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | Boolean | `true` on success |
| `count` | Number | Number of seller's products |
| `products` | Array | All products for logged-in seller |
| `products[].status` | String | `PENDING`, `APPROVED`, or `BLOCKED` |
| `products[].category` | Object | Populated: `name`, `level` |

#### Response Example

```json
{
  "success": true,
  "count": 3,
  "products": [
    {
      "_id": "65f1a2b3c4d5e6f7a8b9c0d6",
      "title": "Wireless Headphones",
      "brand": "Sony",
      "status": "APPROVED",
      "price": 2999,
      "category": { "name": "Electronics", "level": 0 }
    }
  ]
}
```

---

### 3. Update Product

| | |
|---|---|
| **Method** | `PUT` |
| **Endpoint** | `/api/product/:id` |
| **Auth** | `authUser` + `authSeller` |

> After update, product `status` is reset to `"PENDING"` for re-approval.

#### Headers

| Key | Value |
|-----|-------|
| `Authorization` | `Bearer <token>` |

#### URL Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | String | MongoDB ID of the product |

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | String | ❌ | Updated title |
| `description` | String | ❌ | Updated description |
| `brand` | String | ❌ | Updated brand |
| `category` | String | ❌ | Updated category ID |
| `images` | Array | ❌ | Updated image URLs |
| `price` | Number | ❌ | Updated price |
| `discount` | Number | ❌ | Updated discount % |

#### Request Example

```json
{
  "price": 2499,
  "discount": 15
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | Boolean | `true` on success |
| `message` | String | `"Product updated successfully. Re-submitted for admin approval."` |
| `product` | Object | Updated product with `status: "PENDING"` |

#### Response Example

```json
{
  "success": true,
  "message": "Product updated successfully. Re-submitted for admin approval.",
  "product": {
    "_id": "65f1a2b3c4d5e6f7a8b9c0d6",
    "title": "Wireless Headphones",
    "price": 2499,
    "discount": 15,
    "status": "PENDING"
  }
}
```

---

### 4. Delete Product

| | |
|---|---|
| **Method** | `DELETE` |
| **Endpoint** | `/api/product/:id` |
| **Auth** | `authUser` + `authSeller` |

#### Headers

| Key | Value |
|-----|-------|
| `Authorization` | `Bearer <token>` |

#### URL Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | String | MongoDB ID of the product |

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | Boolean | `true` on success |
| `message` | String | `"Product deleted successfully"` |

#### Response Example

```json
{
  "success": true,
  "message": "Product deleted successfully"
}
```

---

## Product Variant Routes

Base URL: `/api/variant`

> All routes require `authUser` + `authSeller`. Sellers can only manage variants for their own products.

---

### 1. Create Variant

| | |
|---|---|
| **Method** | `POST` |
| **Endpoint** | `/api/variant` |
| **Auth** | `authUser` + `authSeller` |

> SKU is auto-generated in the format `<PROD_ID_LAST6>-<ATTR_VALUES>-<TIMESTAMP>`. Example: `C0D123-RED-XL-M5X2KAB`

#### Headers

| Key | Value |
|-----|-------|
| `Authorization` | `Bearer <token>` |

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `productId` | String | ✅ | ID of the parent product (must be seller's own) |
| `attributes` | Object | ❌ | Key-value map e.g. `{ "color": "Red", "size": "XL" }` |
| `stock` | Number | ✅ | Available stock |
| `price` | Number | ✅ | Variant price in ₹ |

#### Request Example

```json
{
  "productId": "65f1a2b3c4d5e6f7a8b9c0d6",
  "attributes": { "color": "Red", "size": "XL" },
  "stock": 50,
  "price": 2699
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | Boolean | `true` on success |
| `message` | String | `"Product variant created successfully"` |
| `variant._id` | String | MongoDB variant ID |
| `variant.product` | String | Parent product ID |
| `variant.sku` | String | Auto-generated SKU |
| `variant.attributes` | Object | Attribute key-value map |
| `variant.stock` | Number | Stock quantity |
| `variant.price` | Number | Variant price |
| `variant.isActive` | Boolean | Always `true` on creation |

#### Response Example

```json
{
  "success": true,
  "message": "Product variant created successfully",
  "variant": {
    "_id": "65f1a2b3c4d5e6f7a8b9c0d7",
    "product": "65f1a2b3c4d5e6f7a8b9c0d6",
    "sku": "C0D123-RED-XL-M5X2KAB",
    "attributes": { "color": "Red", "size": "XL" },
    "stock": 50,
    "price": 2699,
    "isActive": true
  }
}
```

---

### 2. Get My Variants for a Product

| | |
|---|---|
| **Method** | `GET` |
| **Endpoint** | `/api/variant/product/:productId` |
| **Auth** | `authUser` + `authSeller` |

#### Headers

| Key | Value |
|-----|-------|
| `Authorization` | `Bearer <token>` |

#### URL Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `productId` | String | MongoDB ID of the product |

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | Boolean | `true` on success |
| `count` | Number | Number of variants |
| `variants` | Array | All variants for the product |
| `variants[].sku` | String | Unique SKU |
| `variants[].attributes` | Object | Attribute map |
| `variants[].stock` | Number | Current stock |
| `variants[].price` | Number | Price |
| `variants[].isActive` | Boolean | Active status |

#### Response Example

```json
{
  "success": true,
  "count": 3,
  "variants": [
    {
      "_id": "65f1a2b3c4d5e6f7a8b9c0d7",
      "sku": "C0D123-RED-XL-M5X2KAB",
      "attributes": { "color": "Red", "size": "XL" },
      "stock": 50,
      "price": 2699,
      "isActive": true
    }
  ]
}
```

---

### 3. Update Variant

| | |
|---|---|
| **Method** | `PUT` |
| **Endpoint** | `/api/variant/:id` |
| **Auth** | `authUser` + `authSeller` |

> If `attributes` are changed, the SKU is automatically regenerated.

#### Headers

| Key | Value |
|-----|-------|
| `Authorization` | `Bearer <token>` |

#### URL Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | String | MongoDB ID of the variant |

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `stock` | Number | ❌ | Updated stock |
| `price` | Number | ❌ | Updated price |
| `attributes` | Object | ❌ | Updated attributes (triggers SKU regen) |

#### Request Example

```json
{
  "stock": 30,
  "price": 2499
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | Boolean | `true` on success |
| `message` | String | `"Variant updated successfully"` |
| `variant` | Object | Updated variant document |

#### Response Example

```json
{
  "success": true,
  "message": "Variant updated successfully",
  "variant": {
    "_id": "65f1a2b3c4d5e6f7a8b9c0d7",
    "sku": "C0D123-RED-XL-M5X2KAB",
    "stock": 30,
    "price": 2499,
    "isActive": true
  }
}
```

---

### 4. Delete Variant

| | |
|---|---|
| **Method** | `DELETE` |
| **Endpoint** | `/api/variant/:id` |
| **Auth** | `authUser` + `authSeller` |

#### Headers

| Key | Value |
|-----|-------|
| `Authorization` | `Bearer <token>` |

#### URL Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | String | MongoDB ID of the variant |

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | Boolean | `true` on success |
| `message` | String | `"Variant deleted successfully"` |

#### Response Example

```json
{
  "success": true,
  "message": "Variant deleted successfully"
}
```

---

## Cart Routes

Base URL: `/api/cart`

> All routes require `authUser` + `authCustomer`.

---

### 1. Get Cart

| | |
|---|---|
| **Method** | `GET` |
| **Endpoint** | `/api/cart` |
| **Auth** | `authUser` + `authCustomer` |

#### Headers

| Key | Value |
|-----|-------|
| `Authorization` | `Bearer <token>` |

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | Boolean | `true` on success |
| `cart._id` | String | Cart document ID |
| `cart.items` | Array | Cart item list |
| `cart.items[].product` | Object | Populated: `title`, `brand`, `images`, `status` |
| `cart.items[].variant` | Object | Populated: `sku`, `attributes`, `price`, `stock`, `isActive` |
| `cart.items[].seller` | Object | Populated: `shopName` |
| `cart.items[].quantity` | Number | Item quantity |
| `cart.items[].price` | Number | Price at add time |
| `cart.totalItems` | Number | Sum of all quantities |
| `cart.totalPrice` | Number | Total cost |

#### Response Example

```json
{
  "success": true,
  "cart": {
    "_id": "65f1a2b3c4d5e6f7a8b9c0da",
    "items": [
      {
        "_id": "65f1...",
        "product": { "title": "Wireless Headphones", "brand": "Sony" },
        "variant": { "sku": "C0D123-RED-XL-M5X2KAB", "price": 2699 },
        "seller": { "shopName": "Tech Store" },
        "quantity": 2,
        "price": 2699
      }
    ],
    "totalItems": 2,
    "totalPrice": 5398.00
  }
}
```

---

### 2. Add Item to Cart

| | |
|---|---|
| **Method** | `POST` |
| **Endpoint** | `/api/cart/add` |
| **Auth** | `authUser` + `authCustomer` |

> If the same variant already exists in the cart, the quantity is incremented rather than duplicated.

#### Headers

| Key | Value |
|-----|-------|
| `Authorization` | `Bearer <token>` |

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `variantId` | String | ✅ | MongoDB ID of the product variant |
| `quantity` | Number | ❌ | Quantity to add (default `1`) |

#### Request Example

```json
{
  "variantId": "65f1a2b3c4d5e6f7a8b9c0d7",
  "quantity": 2
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | Boolean | `true` on success |
| `message` | String | `"Item added to cart"` |
| `cart` | Object | Updated cart document |

#### Response Example

```json
{
  "success": true,
  "message": "Item added to cart",
  "cart": {
    "_id": "65f1a2b3c4d5e6f7a8b9c0da",
    "items": [
      {
        "_id": "65f1...",
        "variant": "65f1a2b3c4d5e6f7a8b9c0d7",
        "quantity": 2,
        "price": 2699
      }
    ]
  }
}
```

---

### 3. Update Cart Item Quantity

| | |
|---|---|
| **Method** | `PUT` |
| **Endpoint** | `/api/cart/item/:itemId` |
| **Auth** | `authUser` + `authCustomer` |

> Price is refreshed to the current variant price on every update.

#### Headers

| Key | Value |
|-----|-------|
| `Authorization` | `Bearer <token>` |

#### URL Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `itemId` | String | MongoDB subdocument ID of the cart item |

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `quantity` | Number | ✅ | New quantity (minimum `1`) |

#### Request Example

```json
{
  "quantity": 3
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | Boolean | `true` on success |
| `message` | String | `"Cart item updated"` |
| `cart` | Object | Updated cart document |

#### Response Example

```json
{
  "success": true,
  "message": "Cart item updated",
  "cart": {
    "_id": "65f1a2b3c4d5e6f7a8b9c0da",
    "items": [{ "_id": "65f1...", "quantity": 3, "price": 2699 }]
  }
}
```

---

### 4. Remove Item from Cart

| | |
|---|---|
| **Method** | `DELETE` |
| **Endpoint** | `/api/cart/item/:itemId` |
| **Auth** | `authUser` + `authCustomer` |

#### Headers

| Key | Value |
|-----|-------|
| `Authorization` | `Bearer <token>` |

#### URL Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `itemId` | String | MongoDB subdocument ID of the cart item |

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | Boolean | `true` on success |
| `message` | String | `"Item removed from cart"` |
| `cart` | Object | Updated cart without the removed item |

#### Response Example

```json
{
  "success": true,
  "message": "Item removed from cart",
  "cart": { "_id": "65f1a2b3c4d5e6f7a8b9c0da", "items": [] }
}
```

---

### 5. Clear Cart

| | |
|---|---|
| **Method** | `DELETE` |
| **Endpoint** | `/api/cart` |
| **Auth** | `authUser` + `authCustomer` |

#### Headers

| Key | Value |
|-----|-------|
| `Authorization` | `Bearer <token>` |

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | Boolean | `true` on success |
| `message` | String | `"Cart cleared successfully"` |

#### Response Example

```json
{
  "success": true,
  "message": "Cart cleared successfully"
}
```

---

## Payment Routes

Base URL: `/api/payment`

---

### 1. Initiate Payment

| | |
|---|---|
| **Method** | `POST` |
| **Endpoint** | `/api/payment/initiate` |
| **Auth** | `authUser` + `authCustomer` |

#### Headers

| Key | Value |
|-----|-------|
| `Authorization` | `Bearer <token>` |

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `orderId` | String | ✅ | MongoDB ID of the order to pay for |
| `paymentMethod` | String | ✅ | `COD`, `CARD`, `UPI`, `NETBANKING`, or `WALLET` |

#### Request Example

```json
{
  "orderId": "65f1a2b3c4d5e6f7a8b9c0d9",
  "paymentMethod": "UPI"
}
```

#### Response Fields (Razorpay)

| Field | Type | Description |
|-------|------|-------------|
| `success` | Boolean | `true` on success |
| `message` | String | `"Razorpay order created. Complete checkout on the frontend."` |
| `razorpayOrderId` | String | Razorpay order ID to pass to frontend SDK |
| `razorpayKeyId` | String | Razorpay public key for frontend |
| `amount` | Number | Amount in ₹ |
| `currency` | String | `"INR"` |
| `paymentId` | String | Internal Payment document ID |

#### Response Example (Razorpay)

```json
{
  "success": true,
  "message": "Razorpay order created. Complete checkout on the frontend.",
  "razorpayOrderId": "order_FgRAHdNOM4ZVLr",
  "razorpayKeyId": "rzp_test_xxxxxxxxxxxx",
  "amount": 2699,
  "currency": "INR",
  "paymentId": "65f1a2b3c4d5e6f7a8b9c0d8"
}
```

#### Response Fields (COD)

| Field | Type | Description |
|-------|------|-------------|
| `success` | Boolean | `true` on success |
| `message` | String | `"Order placed with Cash on Delivery."` |
| `payment` | Object | Created Payment document with `status: "PENDING"` |

#### Response Example (COD)

```json
{
  "success": true,
  "message": "Order placed with Cash on Delivery.",
  "payment": {
    "_id": "65f1a2b3c4d5e6f7a8b9c0d8",
    "paymentGateway": "COD",
    "paymentMethod": "COD",
    "amount": 2699,
    "status": "PENDING"
  }
}
```

---

### 2. Verify Razorpay Payment

| | |
|---|---|
| **Method** | `POST` |
| **Endpoint** | `/api/payment/verify` |
| **Auth** | `authUser` + `authCustomer` |

> Verifies HMAC SHA256 signature from Razorpay callback. On success, sets `Payment.status = COMPLETED` and `Order.status = PLACED`.

#### Headers

| Key | Value |
|-----|-------|
| `Authorization` | `Bearer <token>` |

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `paymentId` | String | ✅ | Internal Payment document ID |
| `razorpay_payment_id` | String | ✅ | From Razorpay callback |
| `razorpay_order_id` | String | ✅ | From Razorpay callback |
| `razorpay_signature` | String | ✅ | HMAC signature from Razorpay callback |

#### Request Example

```json
{
  "paymentId": "65f1a2b3c4d5e6f7a8b9c0d8",
  "razorpay_payment_id": "pay_FgRAHdNOM4ZVLr",
  "razorpay_order_id": "order_FgRAHdNOM4ZVLr",
  "razorpay_signature": "abc123defghij..."
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | Boolean | `true` on success |
| `message` | String | `"Payment verified successfully. Order is confirmed."` |
| `payment` | Object | Updated payment with `status: "COMPLETED"` |

#### Response Example

```json
{
  "success": true,
  "message": "Payment verified successfully. Order is confirmed.",
  "payment": {
    "_id": "65f1a2b3c4d5e6f7a8b9c0d8",
    "razorpay_payment_id": "pay_FgRAHdNOM4ZVLr",
    "status": "COMPLETED",
    "amount": 2699
  }
}
```

---

### 3. Get My Payments

| | |
|---|---|
| **Method** | `GET` |
| **Endpoint** | `/api/payment/my` |
| **Auth** | `authUser` + `authCustomer` |

#### Headers

| Key | Value |
|-----|-------|
| `Authorization` | `Bearer <token>` |

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | Boolean | `true` on success |
| `count` | Number | Number of payments |
| `payments` | Array | Customer's payment history |
| `payments[].order` | Object | Populated: `status`, `paymentStatus`, `createdAt` |
| `payments[].paymentGateway` | String | `RAZORPAY` or `COD` |
| `payments[].paymentMethod` | String | `CARD`, `UPI`, etc. |
| `payments[].amount` | Number | Payment amount in ₹ |
| `payments[].status` | String | `PENDING`, `COMPLETED`, `FAILED`, or `REFUNDED` |

#### Response Example

```json
{
  "success": true,
  "count": 2,
  "payments": [
    {
      "_id": "65f1a2b3c4d5e6f7a8b9c0d8",
      "order": { "status": "PLACED", "paymentStatus": "COMPLETED", "createdAt": "2026-03-01T10:00:00.000Z" },
      "paymentGateway": "RAZORPAY",
      "paymentMethod": "UPI",
      "amount": 2699,
      "status": "COMPLETED"
    }
  ]
}
```

---

### 4. Get Payment by ID

| | |
|---|---|
| **Method** | `GET` |
| **Endpoint** | `/api/payment/:id` |
| **Auth** | `authUser` (customer — own only; admin — any) |

#### Headers

| Key | Value |
|-----|-------|
| `Authorization` | `Bearer <token>` |

#### URL Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | String | MongoDB ID of the payment |

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | Boolean | `true` on success |
| `payment` | Object | Full payment document |
| `payment.user` | Object | Populated: `name`, `email` |
| `payment.order` | Object | Populated: `status`, `paymentStatus`, `items`, `shippingAddress` |
| `payment.razorpay_payment_id` | String | Razorpay payment ID (if applicable) |
| `payment.amount` | Number | Amount in ₹ |
| `payment.status` | String | Payment status |

#### Response Example

```json
{
  "success": true,
  "payment": {
    "_id": "65f1a2b3c4d5e6f7a8b9c0d8",
    "user": { "name": "John Doe", "email": "john@example.com" },
    "order": { "status": "PLACED", "paymentStatus": "COMPLETED" },
    "paymentGateway": "RAZORPAY",
    "paymentMethod": "UPI",
    "razorpay_payment_id": "pay_FgRAHdNOM4ZVLr",
    "amount": 2699,
    "status": "COMPLETED"
  }
}
```

---

## Order Routes

Base URL: `/api/order`

---

### 1. Place Order

| | |
|---|---|
| **Method** | `POST` |
| **Endpoint** | `/api/order` |
| **Auth** | `authUser` + `authCustomer` |

> Places an order from the customer's current cart. Deducts stock from each variant and clears the cart. Order is created with `status: "AWAITING_PAYMENT"` until payment is completed.

#### Headers

| Key | Value |
|-----|-------|
| `Authorization` | `Bearer <token>` |

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `addressId` | String | ✅ | MongoDB ID of a saved address (must belong to customer) |

#### Request Example

```json
{
  "addressId": "65f1a2b3c4d5e6f7a8b9c0d5"
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | Boolean | `true` on success |
| `message` | String | `"Order placed successfully. Proceed to payment."` |
| `order._id` | String | MongoDB order ID |
| `order.status` | String | `"AWAITING_PAYMENT"` |
| `order.paymentStatus` | String | `"PENDING"` |
| `order.items` | Array | Order items with product, variant, quantity, price |
| `order.shippingAddress` | Object | Populated shipping address |

#### Response Example

```json
{
  "success": true,
  "message": "Order placed successfully. Proceed to payment.",
  "order": {
    "_id": "65f1a2b3c4d5e6f7a8b9c0d9",
    "status": "AWAITING_PAYMENT",
    "paymentStatus": "PENDING",
    "items": [
      {
        "product": { "title": "Wireless Headphones", "brand": "Sony" },
        "variant": { "sku": "C0D123-RED-XL-M5X2KAB", "price": 2699 },
        "quantity": 1,
        "price": 2699,
        "status": "PLACED"
      }
    ],
    "shippingAddress": {
      "fullname": "John Doe",
      "city": "Mumbai",
      "pincode": "400001"
    }
  }
}
```

---

### 2. Get My Orders

| | |
|---|---|
| **Method** | `GET` |
| **Endpoint** | `/api/order/my` |
| **Auth** | `authUser` + `authCustomer` |

#### Headers

| Key | Value |
|-----|-------|
| `Authorization` | `Bearer <token>` |

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | String | ❌ | Filter by order status |
| `page` | Number | ❌ | Page number (default `1`) |
| `limit` | Number | ❌ | Items per page (default `10`) |

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | Boolean | `true` on success |
| `total` | Number | Total matching orders |
| `page` | Number | Current page |
| `pages` | Number | Total pages |
| `orders` | Array | Customer's orders (newest first) |
| `orders[].status` | String | Overall order status |
| `orders[].paymentStatus` | String | Payment status |
| `orders[].items` | Array | Items with product/variant populated |
| `orders[].shippingAddress` | Object | Shipping address |

#### Response Example

```json
{
  "success": true,
  "total": 3,
  "page": 1,
  "pages": 1,
  "orders": [
    {
      "_id": "65f1a2b3c4d5e6f7a8b9c0d9",
      "status": "PLACED",
      "paymentStatus": "COMPLETED",
      "items": [
        {
          "product": { "title": "Wireless Headphones" },
          "variant": { "sku": "C0D123-RED-XL-M5X2KAB" },
          "quantity": 1,
          "price": 2699
        }
      ],
      "createdAt": "2026-03-01T10:00:00.000Z"
    }
  ]
}
```

---

### 3. Get Order by ID

| | |
|---|---|
| **Method** | `GET` |
| **Endpoint** | `/api/order/:id` |
| **Auth** | `authUser` + `authCustomer` (own orders only) |

#### Headers

| Key | Value |
|-----|-------|
| `Authorization` | `Bearer <token>` |

#### URL Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | String | MongoDB ID of the order |

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | Boolean | `true` on success |
| `order` | Object | Full order document |
| `order.user` | Object | Populated: `name`, `email` |
| `order.items` | Array | Full item details with product, variant, seller |
| `order.payment` | Object | Populated Payment document |
| `order.shippingAddress` | Object | Full shipping address |

#### Response Example

```json
{
  "success": true,
  "order": {
    "_id": "65f1a2b3c4d5e6f7a8b9c0d9",
    "user": { "name": "John Doe", "email": "john@example.com" },
    "status": "CONFIRMED",
    "paymentStatus": "COMPLETED",
    "payment": { "_id": "65f...", "status": "COMPLETED", "amount": 2699 },
    "items": [
      {
        "product": { "title": "Wireless Headphones" },
        "variant": { "sku": "C0D123-RED-XL-M5X2KAB", "price": 2699 },
        "seller": { "name": "John Seller" },
        "quantity": 1,
        "status": "CONFIRMED"
      }
    ]
  }
}
```

---

### 4. Cancel Order

| | |
|---|---|
| **Method** | `PUT` |
| **Endpoint** | `/api/order/:id/cancel` |
| **Auth** | `authUser` + `authCustomer` |

> Customers can only cancel orders in `AWAITING_PAYMENT` or `PLACED` status. Stock is automatically restored.

#### Headers

| Key | Value |
|-----|-------|
| `Authorization` | `Bearer <token>` |

#### URL Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | String | MongoDB ID of the order |

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | Boolean | `true` on success |
| `message` | String | `"Order cancelled successfully"` |
| `order` | Object | Updated order with `status: "CANCELLED"` |

#### Response Example

```json
{
  "success": true,
  "message": "Order cancelled successfully",
  "order": {
    "_id": "65f1a2b3c4d5e6f7a8b9c0d9",
    "status": "CANCELLED"
  }
}
```

---

### 5. Get Seller Orders

| | |
|---|---|
| **Method** | `GET` |
| **Endpoint** | `/api/order/seller/orders` |
| **Auth** | `authUser` + `authSeller` |

> Returns only the order items belonging to this seller within each matched order.

#### Headers

| Key | Value |
|-----|-------|
| `Authorization` | `Bearer <token>` |

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | String | ❌ | Filter by item status |
| `page` | Number | ❌ | Page number (default `1`) |
| `limit` | Number | ❌ | Items per page (default `10`) |

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | Boolean | `true` on success |
| `total` | Number | Total matching orders |
| `page` | Number | Current page |
| `pages` | Number | Total pages |
| `orders` | Array | Orders filtered to seller's items only |
| `orders[].user` | Object | Populated: `name`, `email`, `phone` |
| `orders[].items` | Array | Only items belonging to this seller |
| `orders[].shippingAddress` | Object | Shipping address |

#### Response Example

```json
{
  "success": true,
  "total": 5,
  "page": 1,
  "pages": 1,
  "orders": [
    {
      "_id": "65f1a2b3c4d5e6f7a8b9c0d9",
      "user": { "name": "John Doe", "email": "john@example.com", "phone": "9876543210" },
      "items": [
        {
          "product": { "title": "Wireless Headphones" },
          "variant": { "sku": "C0D123-RED-XL-M5X2KAB" },
          "quantity": 1,
          "price": 2699,
          "status": "PLACED"
        }
      ]
    }
  ]
}
```

---

### 6. Update Item Status (Seller)

| | |
|---|---|
| **Method** | `PUT` |
| **Endpoint** | `/api/order/seller/item/:itemId/status` |
| **Auth** | `authUser` + `authSeller` |

> Sellers can only update items belonging to them. Valid statuses: `CONFIRMED`, `SHIPPED`, `OUT_FOR_DELIVERY`, `DELIVERED`. The top-level order status is auto-synced across all items.

#### Headers

| Key | Value |
|-----|-------|
| `Authorization` | `Bearer <token>` |

#### URL Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `itemId` | String | MongoDB subdocument ID of the order item |

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | String | ✅ | One of `CONFIRMED`, `SHIPPED`, `OUT_FOR_DELIVERY`, `DELIVERED` |

#### Request Example

```json
{
  "status": "SHIPPED"
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | Boolean | `true` on success |
| `message` | String | `"Item status updated"` |
| `item` | Object | Updated item subdocument |
| `item.status` | String | New item status |
| `orderStatus` | String | Recalculated top-level order status |

#### Response Example

```json
{
  "success": true,
  "message": "Item status updated",
  "item": {
    "_id": "65f1a2b3c4d5e6f7a8b9...",
    "status": "SHIPPED",
    "quantity": 1,
    "price": 2699
  },
  "orderStatus": "SHIPPED"
}
```
