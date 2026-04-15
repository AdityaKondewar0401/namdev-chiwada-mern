# 🍛 Namdev Chiwada — Full MERN Stack App

> Authentic Maharashtrian Snacks E-Commerce Platform  
> Converted from static HTML to production-ready MERN stack

---

## 🗂️ Project Structure

```
mern-app/
├── client/                     # React + Vite + Tailwind CSS Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx         ← Sticky navbar, mobile menu, cart badge
│   │   │   ├── Footer.jsx         ← Full footer with links & contact
│   │   │   ├── ProductCard.jsx    ← Animated product card + wishlist
│   │   │   ├── Skeletons.jsx      ← Loading skeleton components
│   │   │   ├── ProtectedRoute.jsx ← JWT-protected route wrapper
│   │   │   └── WhatsAppFloat.jsx  ← Floating WhatsApp button
│   │   ├── context/
│   │   │   ├── AuthContext.jsx    ← JWT auth state (register/login/logout)
│   │   │   ├── CartContext.jsx    ← Persistent cart (localStorage + DB sync)
│   │   │   └── WishlistContext.jsx← Wishlist toggle with DB sync
│   │   ├── hooks/
│   │   │   └── useReveal.js       ← IntersectionObserver scroll animations
│   │   ├── pages/
│   │   │   ├── HomePage.jsx       ← Hero, Marquee, Features, Products, CTA
│   │   │   ├── ProductsPage.jsx   ← Grid + filter + sort + search
│   │   │   ├── ProductDetailPage.jsx← Gallery, tabs, size selector, qty, related
│   │   │   ├── CartPage.jsx       ← Cart with promo code + order summary
│   │   │   ├── CheckoutPage.jsx   ← Address + payment + order placement
│   │   │   ├── OrdersPage.jsx     ← Order list + order detail with tracker
│   │   │   ├── AuthPages.jsx      ← Login + Register
│   │   │   └── ContactPage.jsx    ← Contact form + map + social links
│   │   ├── services/
│   │   │   └── api.js             ← Axios instance + all API calls
│   │   ├── App.jsx                ← Router + providers + layout
│   │   ├── main.jsx               ← React entry point
│   │   └── index.css              ← Tailwind + custom CSS variables
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
└── server/                     # Node.js + Express + MongoDB Backend
    ├── config/
    │   └── db.js               ← MongoDB connection
    ├── models/
    │   ├── User.js             ← User schema (bcrypt, wishlist, address)
    │   ├── Product.js          ← Product schema (sizes, nutrition, text index)
    │   ├── Cart.js             ← Cart schema (items, qty)
    │   └── Order.js            ← Order schema (status, address, promo)
    ├── controllers/
    │   ├── authController.js   ← register, login, getMe, updateProfile
    │   ├── productController.js← CRUD + seed with 6 real products
    │   ├── cartController.js   ← get, add, update, remove, clear
    │   ├── orderController.js  ← place, list, detail, promo validation
    │   └── wishlistController.js← toggle + get wishlist
    ├── routes/
    │   ├── auth.js
    │   ├── products.js
    │   ├── cart.js
    │   ├── orders.js
    │   └── wishlist.js
    ├── middleware/
    │   ├── auth.js             ← JWT protect + admin guard
    │   └── errorHandler.js     ← Global error handler
    ├── .env
    ├── server.js               ← Express app entry
    └── package.json
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or [MongoDB Atlas](https://www.mongodb.com/atlas))

### 1. Clone / unzip the project

```bash
cd mern-app
```

### 2. Install all dependencies

```bash
# Install root dev tools
npm install

# Install server + client dependencies
npm run install:all
```

### 3. Configure environment

**server/.env** (already created):
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/namdev-chiwada
JWT_SECRET=namdev_chiwada_super_secret_key_2025
JWT_EXPIRE=30d
NODE_ENV=development
```

For MongoDB Atlas, replace `MONGO_URI` with your Atlas connection string.

**client/.env** (already created):
```env
VITE_API_URL=http://localhost:5000/api
```

### 4. Seed the database

Start the server first, then seed products:

```bash
# Terminal 1 — start backend
npm run dev:server

# In another terminal or use curl/Postman:
curl -X POST http://localhost:5000/api/products/seed
```

### 5. Run development servers

```bash
# Run both simultaneously (requires concurrently)
npm run dev

# OR run separately:
npm run dev:server   # http://localhost:5000
npm run dev:client   # http://localhost:5173
```

---

## 🔌 API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | — | Register new user |
| POST | `/api/auth/login` | — | Login, returns JWT |
| GET | `/api/auth/me` | ✅ | Get current user |
| PUT | `/api/auth/profile` | ✅ | Update profile |
| GET | `/api/products` | — | List products (filter/sort/search) |
| GET | `/api/products/:id` | — | Single product |
| POST | `/api/products` | Admin | Create product |
| PUT | `/api/products/:id` | Admin | Update product |
| DELETE | `/api/products/:id` | Admin | Delete product |
| POST | `/api/products/seed` | — | Seed demo data |
| GET | `/api/cart` | ✅ | Get user cart |
| POST | `/api/cart` | ✅ | Add item to cart |
| PUT | `/api/cart/:itemId` | ✅ | Update item qty |
| DELETE | `/api/cart/:itemId` | ✅ | Remove item |
| DELETE | `/api/cart` | ✅ | Clear cart |
| POST | `/api/orders` | ✅ | Place order |
| GET | `/api/orders` | ✅ | User's orders |
| GET | `/api/orders/:id` | ✅ | Order detail |
| POST | `/api/orders/validate-promo` | ✅ | Validate promo code |
| GET | `/api/wishlist` | ✅ | Get wishlist |
| POST | `/api/wishlist/:productId` | ✅ | Toggle wishlist item |

### Promo Codes
| Code | Benefit |
|------|---------|
| `NAMDEV10` | 10% discount |
| `SOLAPUR` | Free delivery |
| `FLAT50` | ₹50 flat off |

---

## 🎨 Design System

| Variable | Value | Usage |
|----------|-------|-------|
| `saffron` | `#e07000` | Primary brand color |
| `saffron-light` | `#ff9010` | Hover states |
| `cream` | `#fffdf7` | Page background |
| `brown-dark` | `#2d1a00` | Primary text |
| `gold` | `#d4af37` | CTA buttons |
| Fonts | Playfair Display + DM Sans + Poppins | Headings + body + nav |

---

## ✨ Features Implemented

- ✅ **Auth** — JWT register/login/logout with bcrypt passwords
- ✅ **Products** — Full CRUD, text search, filter by category, sort by price/rating
- ✅ **Cart** — Persistent (localStorage + MongoDB sync on login)
- ✅ **Wishlist** — Toggle per product, synced to DB
- ✅ **Orders** — Place order, track status, view history
- ✅ **Promo Codes** — 3 promo codes with validation endpoint
- ✅ **Protected Routes** — Cart/checkout/orders require auth
- ✅ **Responsive** — Mobile-first, bottom nav friendly
- ✅ **Animations** — Framer Motion page transitions + scroll reveals
- ✅ **Skeletons** — Loading states on all data-fetching components
- ✅ **Toast Notifications** — react-hot-toast throughout
- ✅ **WhatsApp Float** — Direct WhatsApp order button
- ✅ **Admin Guard** — Role-based access for product management

---

## 🏗️ Production Build

```bash
# Build React client
npm run build

# Serve with Express (add static serving to server.js):
# app.use(express.static(path.join(__dirname, '../client/dist')))
# app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../client/dist/index.html')))
```

---

Made with ❤️ in Solapur · Namdev Chiwada © 2025
