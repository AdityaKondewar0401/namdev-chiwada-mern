# Namdev Chiwada MERN - Permanent Agent Context

This file is the durable project briefing for future AI coding agents. It is written for agents, not end users. Use it to understand architecture, contracts, conventions, and integration traps without re-reading the entire repository.

Prefer verified source code over this document if the repository changes later.

## 1. Project Overview

Namdev Chiwada is a full-stack MERN e-commerce application for a Solapur snack brand. The customer app supports product discovery, product detail pages, cart, wishlist, account/profile, COD checkout, Razorpay online checkout, order history, and order tracking. Admin users can manage products, images, orders, and promo codes.

The repository contains two real application packages plus a root orchestration package:

- `client/`: React 18 single-page app built with Vite and Tailwind CSS.
- `server/`: Express REST API backed by MongoDB/Mongoose.
- Root `package.json`: convenience scripts for installing, running, building, and starting the two packages.

Business domain summary:

- Products are traditional Maharashtrian namkeen/snacks with multiple sizes and prices.
- Carts and orders store product snapshots for name, image, size/weight, price, and quantity.
- Auth is JWT-based, persisted in browser `localStorage`.
- Admin authorization is role-based with `User.role === "admin"`.
- Payments use Razorpay for online checkout and Cash on Delivery for COD.
- Transactional order email uses Brevo HTTPS API.
- Product images upload through Cloudinary.

## 2. High-Level Architecture

```text
React SPA
  -> React Router route tree
  -> AuthContext / CartContext / WishlistContext
  -> client/src/services/api.js Axios instance
  -> /api/* HTTP requests

Express API
  -> server/server.js app composition
  -> route modules
  -> protect/admin middleware
  -> controllers
  -> Mongoose models
  -> MongoDB

External providers
  -> Google Identity Services for sign-in
  -> Razorpay for online payment
  -> Cloudinary for uploaded product images
  -> Brevo API for transactional email
```

There is no broad backend service layer. Domain orchestration mostly lives in controllers. The main service exception is `server/services/emailService.js`, and shared price math lives in `server/utils/pricing.js`.

On the client, `client/src/services/api.js` is the transport/service layer. Use it or the exported API groups for new JSON endpoints.

## 3. Complete Repository Structure

```text
mern-app/
  AGENT.md
  README.md
  package.json
  package-lock.json
  .gitignore
  {client/
    src/
      {components,pages,context,services,hooks,utils},server/
        {controllers,models,routes,middleware,config}}/
  client/
    index.html
    package.json
    package-lock.json
    postcss.config.js
    tailwind.config.js
    vercel.json
    vite.config.js
    public/
      images/
        logo.png
        chiwada-1.jpg
        chiwada-2.jpg
        chiwada-3.jpg
        bakarwadi-1.jpg
        bakarwadi-2.jpg
        bakarwadi-3.jpg
        maka-chiwada-1.jpg
        maka-chiwada-2.jpg
        farsan-1.jpg
        farsan-2.jpg
        special.png
    src/
      main.jsx
      App.jsx
      index.css
      components/
        Navbar.jsx
        Footer.jsx
        WhatsAppFloat.jsx
        PageWrapper.jsx
        ProtectedRoute.jsx
        ProductCard.jsx
        QuantityStepper.jsx
        Skeletons.jsx
        NamkeenSection.jsx
        HeroExperience.jsx
        HeritageTimeline.jsx
        TestimonialsCarousel.jsx
        DistributorshipBand.jsx
        StickyShopBar.jsx
        admin/
          AdminNav.jsx
          DashboardTab.jsx
          ProductsTab.jsx
          ProductFormTab.jsx
          OrdersTab.jsx
          PromoCodesTab.jsx
          adminConstants.js
          charts.jsx
        account/
          AccountNav.jsx
          ProfileTab.jsx
          OrdersTab.jsx
          WishlistTab.jsx
          AddressTab.jsx
          accountConstants.js
      context/
        AuthContext.jsx
        CartContext.jsx
        WishlistContext.jsx
      hooks/
        useReveal.js
      pages/
        HomePage.jsx
        ProductsPage.jsx
        ProductDetailPage.jsx
        NamkeenDetailPage.jsx
        CartPage.jsx
        CheckoutPage.jsx
        OrdersPage.jsx
        WishlistPage.jsx
        AccountPage.jsx
        AuthPages.jsx
        AdminPage.jsx
        AboutPage.jsx
        ContactPage.jsx
      services/
        api.js
      utils/
        animations.js
        cloudinary.js
  server/
    package.json
    package-lock.json
    railway.toml
    server.js
    seed.js
    makeAdmin.js
    config/
      db.js
      seedData.js
      cloudinary.js
      email.js
    controllers/
      authController.js
      productController.js
      cartController.js
      orderController.js
      paymentController.js
      uploadController.js
      wishlistController.js
    middleware/
      auth.js
      errorHandler.js
    models/
      User.js
      Product.js
      Cart.js
      Order.js
      Promo.js
    routes/
      auth.js
      products.js
      cart.js
      orders.js
      payment.js
      upload.js
      wishlist.js
    services/
      emailService.js
    utils/
      pricing.js
```

The root `{client/` directory is a stray legacy artifact made of nested empty directories. Do not add source code there. The real frontend is `client/`.

## 4. Frontend Technologies

| Concern | Technology | Notes |
| --- | --- | --- |
| Runtime | React 18 | Function components and hooks. No TypeScript. |
| Bundler | Vite 5 | `client/vite.config.js` includes a dev proxy for relative `/api` calls. |
| Routing | `react-router-dom` 6 | `BrowserRouter`, `Routes`, `Route`, `Navigate`, URL query params. |
| Styling | Tailwind CSS 3 | Brand tokens in `tailwind.config.js`; shared classes in `index.css`. |
| Animation | Framer Motion 10 | Global `MotionConfig` uses `reducedMotion="user"`. |
| HTTP | Axios | Shared instance in `client/src/services/api.js`. |
| Notifications | `react-hot-toast` | Used for auth, cart, checkout, admin, account, and contact feedback. |
| Icons | `lucide-react` plus emoji/inline SVG | Product cards use Lucide; much of the app uses existing emoji/inline SVG. |
| Auth provider | Google Identity Services script | Loaded in `client/index.html`; `AuthPages.jsx` posts credentials to server. |
| Payment UI | Razorpay Checkout script | Dynamically loaded by `CheckoutPage.jsx`. |

Important frontend config:

- `client/index.html` loads Google Fonts and Google Identity Services.
- `client/tailwind.config.js` defines `saffron`, `cream`, `brown-dark`, `brown-mid`, `gold`, `leaf`, animation tokens, shadows, and custom radii.
- `client/vercel.json` rewrites all paths to `/index.html` for SPA routing.
- `client/vite.config.js` proxies relative `/api` requests to `https://namdev-backend.onrender.com` during Vite development.

## 5. Backend Technologies

| Concern | Technology | Notes |
| --- | --- | --- |
| Runtime | Node.js `24.x` | Declared in root, client, and server package manifests. |
| HTTP API | Express 4 | Server package uses Express 4 even though root package has duplicated backend deps. |
| Database | MongoDB + Mongoose 8 | Models are in `server/models`. |
| Password auth | `bcryptjs` | Hashing occurs in `User` pre-save hook. |
| Token auth | `jsonwebtoken` | JWT contains `{ id }`; middleware reloads user by id. |
| Google auth | `google-auth-library` | Server verifies Google ID token against `GOOGLE_CLIENT_ID`. |
| Payment | `razorpay`, Node `crypto` | Creates Razorpay orders and verifies HMAC signatures. |
| Uploads | Cloudinary, Multer, `multer-storage-cloudinary` | Admin-only product image uploads. |
| Email | Brevo HTTPS API via native `fetch` | SMTP is intentionally not used. |
| Logging/dev | Morgan, Nodemon | Morgan only in development. |

Install or change dependencies in the owning subpackage (`client/` or `server/`) unless the change is truly root-level orchestration.

## 6. Application Composition

`client/src/main.jsx` renders `App` inside:

```jsx
<React.StrictMode>
  <MotionConfig reducedMotion="user">
    <App />
  </MotionConfig>
</React.StrictMode>
```

`client/src/App.jsx` wraps all routes in providers in this exact order:

```jsx
<AuthProvider>
  <CartProvider>
    <WishlistProvider>{children}</WishlistProvider>
  </CartProvider>
</AuthProvider>
```

Keep this provider order. `CartProvider` and `WishlistProvider` depend on `AuthContext`.

`Layout` renders `Navbar`, `<main>`, optional `Footer`, and `WhatsAppFloat`. Most storefront pages should stay inside `Layout`. Auth pages and admin are intentionally standalone. Checkout uses `hideFooter`.

`ScrollToTop` scrolls to top on pathname changes. `AnimatePresence` wraps route transitions.

## 7. Frontend Routing Structure

Routes are declared in `client/src/App.jsx`.

| Route | Access | Component | Purpose |
| --- | --- | --- | --- |
| `/` | Public | `HomePage` | Hero, marquee, features, API-backed featured products, story, testimonials, B2B band. |
| `/products` | Public | `ProductsPage` | Product catalog from API with search/sort mirrored to URL query params. |
| `/products/:id` | Public | `ProductDetailPage` | Canonical product detail by Mongo `_id` or slug, with gallery, size, cart, wishlist, related products. |
| `/cart` | Public | `CartPage` | Cart review, quantity changes, promo preview, featured suggestions. |
| `/checkout` | Auth | `CheckoutPage` | Address, promo revalidation, COD or Razorpay payment, order placement. |
| `/orders` | Auth | `OrdersPage` | Current user's order list. |
| `/orders/:id` | Auth | `OrdersPage` | Single order detail and status tracker. |
| `/account` | Auth | `AccountPage` | Profile, orders, wishlist, address tabs using `?tab=`. |
| `/wishlist` | Auth | `WishlistPage` | Dedicated wishlist grid using `WishlistContext` plus product catalog lookup. |
| `/admin` | Admin | `AdminPage` | Product/order/promo admin workspace. Not wrapped in storefront layout. |
| `/login` | Public | `LoginPage` | Password and Google sign-in. |
| `/register` | Public | `RegisterPage` | Signup with optional phone and marketing consent. |
| `/about` | Public | `AboutPage` | Brand story and legacy presentation. |
| `/contact` | Public | `ContactPage` | Contact info, map, mailto/WhatsApp form. No backend contact API. |
| `/namkeen/:id` | Public legacy | `NamkeenDetailPage` | Broken legacy static product detail. Do not extend. |
| `*` | Public | inline 404 | Branded not-found page inside `Layout`. |

`ProtectedRoute` performs client-only gating. It redirects unauthenticated users to `/login` with `location.state.from`, and redirects non-admin users away from `adminOnly` routes. Server middleware is the real security boundary.

## 8. Important Frontend Modules

| Module | Responsibility | Agent guidance |
| --- | --- | --- |
| `Navbar.jsx` | Sticky header, promo marquee, nav links, mobile drawer, search, account menu, cart badge. | Search navigates to `/products?search=...`. Admin link appears only for admin users. |
| `Footer.jsx` | Storefront footer contact and links. | Uses hard-coded contact details. |
| `WhatsAppFloat.jsx` | Floating WhatsApp button. | Currently ignores props passed by `App` and does not listen to PDP events. |
| `PageWrapper.jsx` | Shared route transition wrapper. | Use for normal pages. |
| `ProtectedRoute.jsx` | Client auth/admin route guard. | Convenience only; never use as the only authorization. |
| `ProductCard.jsx` | Reusable product card with size selector, wishlist context, and `QuantityStepper`. | Preferred card for new product grids. |
| `QuantityStepper.jsx` | Add/update/decrement cart UI. | Cart identity is `product._id + size`; pass selected size and price. |
| `Skeletons.jsx` | Loading placeholders for products, detail, and cart. | Beware dynamic Tailwind classes like `w-${w}` are not generated unless safelisted. |
| `NamkeenSection.jsx` | Home featured-products section. | Uses API products but local visual-only wishlist state; not the canonical reusable card. |
| `HeroExperience.jsx` | Home hero carousel using Cloudinary URL helpers. | Uses module-scope helper components to prevent animation remount flicker. |
| `HeritageTimeline.jsx` | Home story teaser. | Mobile vertical stepper, desktop horizontal timeline. |
| `TestimonialsCarousel.jsx` | Testimonials. | Mobile swipe carousel, desktop grid. |
| `DistributorshipBand.jsx` | B2B WhatsApp/phone/email CTA. | Hard-coded brand contact constants. |
| `StickyShopBar.jsx` | Mobile floating "Shop Now" CTA. | Appears after hero and hides when footer intersects. |
| `hooks/useReveal.js` | One-shot IntersectionObserver. | Attach returned ref to elements with `.reveal`. |
| `utils/animations.js` | Framer Motion variants. | Prefer these before adding duplicate variants. |
| `utils/cloudinary.js` | Adds Cloudinary transformations and responsive srcset. | Use for Cloudinary display URLs where possible. |

## 9. Page Responsibilities

- `HomePage.jsx`: page composition only. Imports hero/story/testimonials/distributorship/sticky-shop components and `NamkeenSection`.
- `ProductsPage.jsx`: fetches `productAPI.getAll({ sort, search })`, tracks loading/error/total, and syncs `sort`/`search` to URL params.
- `ProductDetailPage.jsx`: fetches one product, fetches related products, manages gallery, selected size, quantity, wishlist, share, and mobile sticky add-to-cart bar.
- `CartPage.jsx`: reads `CartContext`, allows quantity/removal/clear, validates promo with `orderAPI.validatePromo`, passes promo state to checkout navigation.
- `CheckoutPage.jsx`: validates address, revalidates incoming promo from cart, uses `api.post('/api/payment/create-order')`, opens Razorpay, verifies payment, then calls `orderAPI.place`.
- `OrdersPage.jsx`: supports both list and detail route modes from the same component based on optional `id` param.
- `AccountPage.jsx`: fetches orders and populated wishlist once for stats and tab content; tabs are query-param based.
- `WishlistPage.jsx`: combines product catalog fetch with `WishlistContext` IDs to display saved products.
- `AdminPage.jsx`: thin admin shell. Fetches products and admin orders, owns active tab and edit-product state, delegates UI to `components/admin/*`.
- `AuthPages.jsx`: contains login/register pages plus Google login button. Google login uses raw `fetch` to `${import.meta.env.VITE_API_URL}/api/auth/google`.
- `ContactPage.jsx`: opens `mailto:` or WhatsApp with pre-filled content; there is no server-side contact submission.
- `AboutPage.jsx`: presentation-heavy page with local helpers, animation hooks, story data, and no backend calls.
- `NamkeenDetailPage.jsx`: legacy broken page that references undefined `PRODUCTS`. Do not build new functionality on it.

## 10. Client State Management

The app uses React local state plus contexts. There is no Redux, Zustand, React Query, or SWR.

### AuthContext

File: `client/src/context/AuthContext.jsx`

Storage keys:

```text
nc_token
nc_user
```

Exposed values:

```js
{
  user,
  loading,
  register,
  login,
  logout,
  updateProfile,
  saveUser,
  isAdmin
}
```

Patterns:

- Initializes `user` from `localStorage.nc_user`.
- Stores JWT in `localStorage.nc_token`.
- `register` and `login` call `authAPI`, persist token/user via `saveUser`, update state, and toast.
- `saveUser(user, token)` is the correct path for Google login because it updates both localStorage and React state.
- `logout` removes only auth keys, not `nc_cart`.
- `updateProfile` calls `authAPI.updateProfile`, merges returned user into existing user, persists it, and toasts.
- There is no startup hydration from `/api/auth/me` and no refresh-token flow.

### CartContext

File: `client/src/context/CartContext.jsx`

Storage key:

```text
nc_cart
```

Exposed values:

```js
{
  items,
  loading,
  addToCart,
  updateQuantity,
  removeFromCart,
  clearCart,
  getItemQuantity,
  totalItems,
  subtotal,
  shipping,
  total
}
```

Patterns:

- Cart item identity is product id plus selected size.
- `normalizeItems` converts Mongo/ObjectId-like values into strings for `_id` and `product`.
- Guest carts read/write `localStorage.nc_cart`.
- Signed-in users load `/api/cart` and overwrite local cart state with the server cart. There is no guest-cart merge on login.
- `addToCart` updates UI optimistically and calls `POST /api/cart` for signed-in users.
- `updateQuantity(productId, size, qty)` updates UI immediately and debounces the server `PUT /api/cart` call by 400 ms.
- `removeFromCart(id, size)` is overloaded: with `size`, `id` is a product id and removal is done via `updateQuantity(id, size, 0)`; without `size`, `id` is the cart subdocument `_id` and `DELETE /api/cart/:itemId` is used.
- `clearCart` clears local state and calls `DELETE /api/cart` for signed-in users.
- Current display totals use `FREE_SHIPPING_THRESHOLD = 499` behavior inline: shipping is INR 0 when subtotal >= 499, otherwise INR 49 if there are items.

### WishlistContext

File: `client/src/context/WishlistContext.jsx`

Exposed values:

```js
{
  wishlist,
  toggle,
  isWishlisted,
  loading
}
```

Patterns and caveat:

- Fetches `/api/wishlist` whenever a user logs in.
- `toggle(productId)` requires auth, optimistically updates state, calls `POST /api/wishlist/:productId`, and replaces state with the server response.
- The API `GET /api/wishlist` returns populated product objects, but `isWishlisted(id)` and `WishlistPage` expect an array of id strings. Normalize to IDs before relying on this context in new work.
- `AccountPage` does not use `WishlistContext`; it fetches populated wishlist products directly for account tabs.

## 11. API Client and Service Layer

`client/src/services/api.js` creates a single Axios instance:

```js
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
});
```

Request interceptor:

```http
Authorization: Bearer <localStorage.nc_token>
```

Response interceptor:

- On HTTP 401, removes `nc_token` and `nc_user`.
- Redirects hard to `/login`.

Exported helper groups:

```js
authAPI: {
  register,
  login,
  getMe,
  updateProfile,
}

productAPI: {
  getAll,
  getOne,
  create,
  update,
  delete,
}

cartAPI: {
  get,
  add,
  update,
  remove,
  clear,
}

orderAPI: {
  place,
  getAll,
  getOne,
  validatePromo,
}

wishlistAPI: {
  get,
  toggle,
}
```

Admin order, admin promo, upload, and payment calls currently use raw `api.get/post/put/delete` in their components. For new work, prefer adding named helpers to `api.js` first if the endpoint will be reused.

For multipart upload through Axios, `ProductFormTab` calls `api.post('/api/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })`. Do not send JSON content type for `FormData` manually outside this established pattern.

## 12. Backend Request Pipeline

`server/server.js` is the Express app entry:

1. Loads `.env`.
2. Builds an allow-list CORS policy for local origins, known deployed origins, `CLIENT_URL`, and any `.vercel.app` origin.
3. Enables JSON and URL-encoded body parsing with 10 MB limits.
4. Enables Morgan only when `NODE_ENV === "development"`.
5. Serves `../client/public/images` at `/images`.
6. Mounts route modules under `/api/*`.
7. Exposes `GET /api/health` and `GET /test`.
8. Adds JSON 404 handler.
9. Adds global `errorHandler`.
10. Connects MongoDB before listening.

Middleware:

- `protect`: reads Bearer token, verifies JWT with `JWT_SECRET`, loads current user with `select('-password')`, attaches `req.user`, returns 401 on missing/invalid/expired token.
- `admin`: requires `req.user.role === "admin"`, returns 403 otherwise.
- `errorHandler`: normalizes Mongoose cast errors, duplicate keys, and validation errors into `{ success: false, message }`.

Backend route modules should stay thin: import controllers, apply middleware in explicit order, and export the router.

## 13. HTTP API Contract

All primary API endpoints are under `/api`. Successful responses generally use:

```json
{ "success": true }
```

Errors generally use:

```json
{ "success": false, "message": "..." }
```

### System

| Method | Path | Access | Notes |
| --- | --- | --- | --- |
| GET | `/api/health` | Public | Health/environment/timestamp response. |
| GET | `/test` | Public | Simple server diagnostic outside `/api`. |

### Auth

| Method | Path | Access | Notes |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | Public | Name, email, password required. Phone and boolean marketing consent optional. |
| POST | `/api/auth/login` | Public | Email/password login. |
| POST | `/api/auth/google` | Public | Google ID credential login/link/create. |
| GET | `/api/auth/me` | Auth | Current user plus populated wishlist basics. |
| PUT | `/api/auth/profile` | Auth | Update name, phone, address, optional boolean marketing consent. |
| PUT | `/api/auth/change-password` | Auth | Current/new password. No client UI currently wired. |

### Products

Route ordering matters: `/featured` and `/search` must stay before `/:id`.

| Method | Path | Access | Notes |
| --- | --- | --- | --- |
| GET | `/api/products/featured` | Public | Featured products, sorted by `sortOrder`, limit 4. |
| GET | `/api/products/search?q=...` | Public | Regex search across `name`, `sub`, `desc`, `intro`, limit 10. |
| GET | `/api/products` | Public | Query: `category`, `sort`, `search`, `featured`, `page`, `limit`. |
| POST | `/api/products/seed` | Public | Destructive product reset from `config/seedData.js`. |
| GET | `/api/products/:id` | Public | Finds by Mongo ObjectId first, then slug. Returns related products. |
| POST | `/api/products` | Admin | Create product. Controller generates slug if absent. |
| PUT | `/api/products/:id` | Admin | Update product with `findByIdAndUpdate`; no pre-save slug hook. |
| DELETE | `/api/products/:id` | Admin | Delete product. |

Product sort values:

```text
default: sortOrder ascending
price-asc: price ascending
price-desc: price descending
rating: rating descending
popular: reviews descending
```

### Cart

All cart routes require auth through `router.use(protect)`.

| Method | Path | Access | Notes |
| --- | --- | --- | --- |
| GET | `/api/cart` | Auth | Creates empty cart if missing; populates product basics. |
| POST | `/api/cart` | Auth | Adds/increments by `productId + size`; stores client-sent line snapshot. |
| PUT | `/api/cart` | Auth | Body `{ productId, size, quantity }`; quantity <= 0 removes matching line. |
| DELETE | `/api/cart/:itemId` | Auth | Removes by cart item subdocument id. |
| DELETE | `/api/cart` | Auth | Clears all lines. |

### Wishlist

All wishlist routes require auth.

| Method | Path | Access | Notes |
| --- | --- | --- | --- |
| GET | `/api/wishlist` | Auth | Returns populated Product documents from `User.wishlist`. |
| POST | `/api/wishlist/:productId` | Auth | Toggles Product ObjectId in `User.wishlist`; returns raw wishlist ids. |

### Orders and Promos

Static admin routes must stay before `/:id`.

| Method | Path | Access | Notes |
| --- | --- | --- | --- |
| POST | `/api/orders` | Auth | Places order from persisted server cart, then clears cart. |
| GET | `/api/orders` | Auth | Current user's orders newest first. |
| POST | `/api/orders/validate-promo` | Auth | Validates active promo by code using client-supplied subtotal for preview only. |
| GET | `/api/orders/admin/promos` | Admin | List all promo documents. |
| POST | `/api/orders/admin/promos` | Admin | Create promo document. |
| PUT | `/api/orders/admin/promos/:code/toggle` | Admin | Toggle active/inactive. |
| DELETE | `/api/orders/admin/promos/:code` | Admin | Delete non-default promo. |
| GET | `/api/orders/admin` | Admin | All orders with user name/email populated. |
| PUT | `/api/orders/:id/status` | Admin | Updates order status only. |
| GET | `/api/orders/:id` | Auth | Owner or admin can read. |

### Payment

| Method | Path | Access | Notes |
| --- | --- | --- | --- |
| POST | `/api/payment/create-order` | Auth | Creates Razorpay order from persisted server cart and revalidated promo, not from client amount. |
| POST | `/api/payment/verify` | Auth | Verifies Razorpay HMAC signature. Optionally updates an existing internal order if `orderId` is supplied. |

### Upload

All upload routes require `protect` and `admin`.

| Method | Path | Access | Notes |
| --- | --- | --- | --- |
| POST | `/api/upload` | Admin | Single file field `image`. |
| POST | `/api/upload/multiple` | Admin | Multiple file field `images`, max 4. |
| DELETE | `/api/upload/:publicId` | Admin | Deletes one Cloudinary asset by route param. Public IDs with `/` need deliberate encoding/routing work. |

## 14. Database Entities and Relationships

Relationship model:

```text
User 1 -> 1 Cart
User 1 -> many Order
User many -> many Product through User.wishlist
Cart 1 -> many CartItem -> Product
Order 1 -> many OrderItem -> Product optional reference plus snapshots
Promo independent collection used by pricing/order flows
```

### User

File: `server/models/User.js`

Core fields:

- `name`: required string.
- `email`: required, unique, lowercased, trimmed.
- `password`: optional string, min length 6.
- `phone`: optional trimmed string.
- `googleId`: optional string.
- `avatar`: optional string.
- `role`: `"user"` or `"admin"`, default `"user"`.
- `wishlist`: array of Product ObjectIds.
- `address`: `street`, `city`, `state`, `pincode`.
- `isVerified`: boolean.
- `marketingConsent`: per-channel object with `email`, `sms`, `whatsapp`, `consentedAt`, `source`.

Password hashing:

```js
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});
```

Use `user.save()` for password changes so the hook runs. Never return `password` from API responses.

### Product

File: `server/models/Product.js`

Core fields:

- `name`, `namMarathi`, `slug`, `sub`, `desc`, `intro`.
- `category`: enum `"mild" | "spicy" | "special"`.
- `tag`, `badge`, `badgeColor`.
- `sizes`: array of `{ weight, price }`.
- `price`, `originalPrice`, `weight`.
- `img`, `images`.
- `ingredients`, `nutrition`, `info`.
- `rating`, `reviews`, `inStock`, `featured`, `sortOrder`.

Shape examples:

```js
sizes: [{ weight: '250g', price: 180 }]
nutrition: [['Calories', '128 kcal']]
```

Slug behavior:

- `createProduct` sets a slug from `name` if absent.
- Product pre-save hook also generates slug when `name` changes and no slug exists.
- `updateProduct` uses `findByIdAndUpdate`, so the pre-save hook does not run. Explicitly update slug when renaming products that require URL changes.

Indexes:

```js
productSchema.index({ name: 'text', sub: 'text', desc: 'text' });
```

### Cart

File: `server/models/Cart.js`

Fields:

- `user`: required unique User ObjectId.
- `items`: array of subdocuments with `product`, `name`, `img`, `price`, `size`, `qty`.

`totalPrice` is a Mongoose virtual calculated from item snapshot prices.

Cart item snapshots are intentional: the cart can display name/image/price/size without refetching the Product, but the current `addToCart` server controller trusts the client-sent `price` and `size` after checking only that the product exists. Any pricing-security work must validate selected size and server price before storing the cart line.

### Order

File: `server/models/Order.js`

Fields:

- `user`: required User ObjectId.
- `items`: order item snapshots.
- `shippingAddress`: flexible shape with modern fields (`fullName`, `line1`, `pincode`) and legacy aliases (`name`, `street`, `zip`).
- `subtotal`, `shippingCharge`, `discount`, `total`.
- `promoCode`, `notes`.
- `status`: `"pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled"`.
- `paymentMethod`: defaults to `"COD"`.
- `paymentStatus`: `"pending" | "paid" | "failed"`.
- `razorpayOrderId`, `razorpayPaymentId`.

Status progression:

```text
pending -> confirmed -> processing -> shipped -> delivered
                                  -> cancelled
```

Important schema mismatch:

- `Cart.items` uses `size`.
- `Order.items` schema declares `weight`, not `size`.
- `orderController.placeOrder` passes `cart.items` directly into `Order.create`.
- Several UI/email paths read `item.size`.

Because Mongoose schemas are strict by default, new orders may not reliably preserve `size` unless this is fixed deliberately. If changing this, migrate schema/controller/UI/email together and preserve historical rendering.

### Promo

File: `server/models/Promo.js`

Fields:

- `code`: required, unique, uppercase, trimmed.
- `type`: `"percent" | "flat" | "shipping"`.
- `value`: number.
- `active`: boolean.
- `uses`: number.

Promos are persisted in MongoDB. `server/utils/pricing.js` looks up active promo docs. `orderController.placeOrder` increments `uses` only after a successful order is created.

Default promo code names (`NAMDEV10`, `SOLAPUR`, `FLAT50`) are protected from deletion in UI/server logic, but this codebase does not automatically seed them. They must exist in the `Promo` collection to validate.

## 15. Pricing, Promo, Payment, and Order Flow

Shared pricing utility:

```js
const FREE_SHIPPING_THRESHOLD = 499;
const STANDARD_SHIPPING = 49;
```

`server/utils/pricing.js` exports:

```js
calculateCartTotals(items, promoCode)
applyPromoToSubtotal(subtotal, promo)
FREE_SHIPPING_THRESHOLD
STANDARD_SHIPPING
```

Order flow:

```text
Product UI
  -> CartContext optimistic update
  -> signed-in users persist to /api/cart
  -> CartPage optionally validates promo for preview
  -> CheckoutPage revalidates promo if supplied through navigation state
  -> COD:
       POST /api/orders
  -> Razorpay:
       POST /api/payment/create-order
       Razorpay Checkout modal
       POST /api/payment/verify
       POST /api/orders with paymentStatus "paid"
  -> server calculates totals from persisted cart
  -> Order saved
  -> Cart cleared
  -> transactional email attempted in try/catch
```

Authority rules:

- Client totals are display estimates.
- `paymentController.createPaymentOrder` calculates Razorpay amount from persisted server cart and active promo.
- `orderController.placeOrder` calculates final order totals from persisted server cart and active promo.
- `validatePromo` uses a client-supplied subtotal only for preview; it must not be used as charge authority.
- Email failure must not fail order placement.

Payment details:

- Client `paymentMethod` state values are `"razorpay"` and `"cod"`.
- Server order `paymentMethod` values are `"ONLINE"` and `"COD"`.
- Online orders require `paymentStatus: "paid"` before `POST /api/orders`.
- `verifyPayment` can update an existing order only if `orderId` is sent, but the current checkout verifies before creating the internal order, so no `orderId` is supplied.

Known pricing/copy trap:

- Cart, checkout, server pricing, and hero copy use free shipping over/at INR 499.
- Product detail UI still says free delivery at `>= INR 500`. Treat this as display-copy drift.

## 16. Authentication and Authorization Flow

Password signup:

1. Client `RegisterPage` submits name, email, phone, password, and boolean `marketingConsent`.
2. `authController.register` checks required fields and duplicate email.
3. Boolean consent expands into the per-channel `marketingConsent` schema.
4. User is created; pre-save hook hashes password.
5. JWT and safe user object are returned.
6. `AuthContext.saveUser` stores token/user and updates state.

Password login:

1. Client submits email/password.
2. `authController.login` loads the user with password selected.
3. Rejects invalid credentials.
4. Rejects password login for Google-only accounts with no password.
5. Returns JWT and safe user object.

Google login:

1. `AuthPages.jsx` renders Google Identity Services button.
2. Google callback posts credential to `/api/auth/google` using raw `fetch`.
3. Server verifies ID token with `GOOGLE_CLIENT_ID`.
4. Server finds by `googleId` or email; links `googleId` to existing email user if needed.
5. New Google users are created with `avatar` and `isVerified: true`.
6. Client must call `saveUser(data.user, data.token)`.

Authorization:

- Client `ProtectedRoute` handles route UX only.
- Server `protect` and `admin` middleware are authoritative.
- Apply `protect` before `admin` on admin API routes.
- Never add a private/admin feature that is protected only in React.

Security model:

- JWT is stored in localStorage.
- Axios attaches Bearer tokens.
- HTTP 401 clears auth storage and redirects to login.
- There is no token refresh and no HttpOnly-cookie auth.

## 17. Admin Architecture

`AdminPage.jsx` is a shell:

- Confirms user exists and role is admin.
- Fetches products with `productAPI.getAll({ limit: 100 })`.
- Fetches admin orders with `api.get('/api/orders/admin')`.
- Owns `activeTab`, `products`, `orders`, `loading`, and `editProduct`.
- Delegates UI to `components/admin/*`.

Admin tabs:

- `DashboardTab`: derives analytics from already-fetched products/orders; no extra API calls.
- `ProductsTab`: searchable product list with edit/delete callbacks.
- `ProductFormTab`: add/edit product form, Cloudinary uploads, comma parsing for images/ingredients/sizes.
- `OrdersTab`: fetches admin orders itself, filters by status/search, updates status with `PUT /api/orders/:id/status`.
- `PromoCodesTab`: lists/adds/toggles/deletes persisted promos via `/api/orders/admin/promos`.

Admin constants:

- `adminConstants.js` owns tab definitions, categories, status options/config, and payment icons.
- `charts.jsx` provides dependency-free SVG/CSS analytics primitives.

Product form parsing:

```text
sizes input: "250g:180,500g:340"
images input: "url1,url2,url3"
ingredients input: "Besan Sev, Peanuts, Curry Leaves"
```

Destructive admin actions:

- Product deletion asks with `window.confirm`.
- Product seeding is public and destructive; avoid using it unless explicitly requested.
- Promo deletion blocks `NAMDEV10`, `SOLAPUR`, and `FLAT50` by code name.

## 18. Account Architecture

`AccountPage.jsx` fetches data once at page load:

- `orderAPI.getAll()` for current user orders.
- `wishlistAPI.get()` for populated wishlist products.

Tabs are controlled by URL query:

```text
/account?tab=profile
/account?tab=orders
/account?tab=wishlist
/account?tab=address
```

Account tab components:

- `ProfileTab`: edits name/phone and shows computed profile completeness.
- `OrdersTab`: uses passed order data and displays expandable order cards with status stepper.
- `WishlistTab`: uses passed populated wishlist products and removes via `wishlistAPI.toggle`.
- `AddressTab`: edits `user.address` fields through `AuthContext.updateProfile`.
- `AccountNav`: mobile horizontal pill bar and desktop sidebar; shows order/wishlist counts.

Use `accountConstants.js` for tab labels and order status color/progression.

## 19. Styling and UI Patterns

Brand palette:

```text
saffron: #e07000
saffron-light: #ff9010
saffron-pale: #fff0d6
cream: #fbf8e7
cream-mid: #faeed0
brown-dark: #2d1a00
brown-mid: #7a3300
brown-light: #c05a00
gold: #d4af37
gold-light: #f0cc5a
gold-pale: #fdf3c8
leaf: #2d5a1b
```

Fonts loaded in `index.html`:

- Cormorant Garamond
- Playfair Display
- DM Sans
- Poppins
- Noto Serif Devanagari
- Tiro Devanagari Marathi
- Gotu

Checkout uses inline CSS with `fontFamily: "'Lora', Georgia, serif"`, but `Lora` is not loaded in `index.html`. It currently falls back unless the font link is expanded.

Reusable CSS classes in `index.css`:

- `btn-primary`
- `btn-saffron`
- `btn-outline`
- `card`
- `section-eyebrow`
- `section-title`
- `form-input`
- `badge`, `badge-default`, `badge-green`, `badge-red`, `badge-gold`, `badge-blue`
- `hero-gradient`
- `shimmer-text`
- `marquee-track`
- `skeleton`
- `reveal`, `reveal.visible`
- `gallery-zoom`
- `nav-cta-shine`

UI conventions:

- Preserve the saffron/cream/brown/gold storefront language.
- Use Tailwind utilities and existing semantic CSS classes first.
- Inline style objects are common for gradients, shadows, dynamic colors, and complex one-off responsive components.
- Keep mobile behavior first-class, not an afterthought. Many components have explicit mobile layouts.
- Use Framer Motion with `viewport={{ once: true }}` for scroll reveals when appropriate.
- Respect `prefers-reduced-motion` and global `MotionConfig reducedMotion="user"`.
- Use meaningful image `alt` text. Decorative thumbnails may use empty alt.

## 20. Environment Setup

Do not commit secrets. `.gitignore` ignores `.env` and `node_modules`, but note it only lists `.env`, not every nested env filename pattern.

Expected client environment variables:

```dotenv
VITE_API_URL=https://your-api-origin
VITE_GOOGLE_CLIENT_ID=your-google-web-client-id
VITE_RAZORPAY_KEY_ID=your-razorpay-public-key
```

Expected server environment variables:

```dotenv
PORT=5000
MONGO_URI=mongodb://localhost:27017/namdev-chiwada
JWT_SECRET=replace-with-long-random-secret
JWT_EXPIRE=30d
NODE_ENV=development
CLIENT_URL=http://localhost:5173

GOOGLE_CLIENT_ID=your-google-web-client-id

CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...

EMAIL_USER=verified-brevo-sender@example.com
BREVO_API_KEY=...
```

Notes:

- `EMAIL_PASS` is not used by the current Brevo implementation.
- `CLIENT_URL` is used for CORS and email/logo links. Set it in deployed environments.
- `VITE_API_URL` should point at the API origin. Axios helper paths include `/api/...`.
- If `VITE_API_URL` is absent, Axios relative `/api` calls may work in Vite because of the proxy, but Google login raw `fetch(`${import.meta.env.VITE_API_URL}/api/auth/google`)` will fail.

## 21. Commands

Run from repository root:

```bash
npm install
npm run install:all
npm run dev
npm run dev:server
npm run dev:client
npm run build
npm run start
```

What they do:

- `npm run install:all`: installs `server/` then `client/`.
- `npm run dev`: runs server and client concurrently.
- `npm run dev:server`: `cd server && npm run dev`.
- `npm run dev:client`: `cd client && npm run dev`.
- `npm run build`: `cd client && npm run build`.
- `npm run start`: `cd server && npm start`.

Run from `server/`:

```bash
node seed.js
node makeAdmin.js user@example.com
```

Deployment config:

- `server/railway.toml` uses Nixpacks, no build command, start command `node server.js`.
- `client/vercel.json` is only an SPA fallback rewrite. It is not an API proxy.

There are no configured test, lint, or formatter scripts in the package manifests.

## 22. Important Dependencies

Root:

- `concurrently`: runs both dev servers.
- Some backend packages are duplicated at root, but runtime code uses `server/package.json`.

Client:

- `@vitejs/plugin-react`
- `vite`
- `react`
- `react-dom`
- `react-router-dom`
- `axios`
- `framer-motion`
- `lucide-react`
- `react-hot-toast`
- `tailwindcss`
- `postcss`
- `autoprefixer`

Server:

- `express`
- `mongoose`
- `cors`
- `dotenv`
- `morgan`
- `nodemon`
- `bcryptjs`
- `jsonwebtoken`
- `google-auth-library`
- `razorpay`
- `cloudinary`
- `multer`
- `multer-storage-cloudinary`
- `nodemailer` is installed but current email sending uses Brevo HTTPS API, not SMTP.

## 23. Known Design Decisions

- Controllers are the domain orchestration layer. Do not introduce a separate service abstraction unless it removes real duplication or matches a new repeated pattern.
- Product, cart, and order items use snapshots so old carts/orders remain readable if product data changes.
- Server-side cart and pricing are intended to be the authority for payment/order totals.
- Transactional email is intentionally best-effort after order creation.
- Brevo HTTPS API is used instead of SMTP because platform SMTP egress can be blocked.
- Cloudinary upload transforms cap image dimensions at 800x800, use automatic quality, and use automatic fetch format.
- Admin dashboard analytics are computed client-side from fetched orders/products instead of adding analytics endpoints.
- Contact form opens user email/WhatsApp instead of pretending to submit to a nonexistent API.
- The app has both public `/products/:id` and broken legacy `/namkeen/:id`; use `/products/:id` for maintained product work.

## 24. Known Constraints and Traps

1. `NamkeenDetailPage.jsx` is broken because it references undefined `PRODUCTS`. Do not extend `/namkeen/:id`; use `/products/:id`.
2. `WishlistContext` receives populated objects from `GET /api/wishlist` but ID-based helpers expect strings. Normalize wishlist state before depending on it in new UI.
3. `WishlistPage` fetches all products and filters by `wishlist.includes(p._id)`, so it is affected by the same object-vs-id issue.
4. `NamkeenSection` uses local visual wishlist state only. `ProductCard` uses persistent `WishlistContext`.
5. Guest cart is not merged into server cart on login. Server cart replaces local state.
6. `logout` does not clear `nc_cart`, so the last loaded cart can remain in localStorage.
7. Server cart add trusts client-sent size and price after product existence check. Validate product size/price server-side before any pricing-security change.
8. `Order.items` schema uses `weight`, while UI/email reads `item.size` and `placeOrder` passes cart items with `size`. Fix as a coordinated migration.
9. `ProductDetailPage` dispatches a `pdp-sticky-bar` event and `App` passes props to `WhatsAppFloat`, but `WhatsAppFloat` ignores both.
10. Product detail copy still says free delivery at INR 500, while pricing utilities and cart/checkout use INR 499.
11. Default promo names are protected from deletion but not seeded automatically.
12. `POST /api/products/seed` is public and destructive. Do not use or expose casually.
13. `DELETE /api/upload/:publicId` is awkward for Cloudinary public IDs containing `/`.
14. `ProductFormTab` removes uploaded image URLs from form state only; it does not call Cloudinary delete.
15. `updateProduct` does not auto-regenerate slug on rename.
16. `CheckoutPage.jsx` uses `Lora` but `index.html` does not load it.
17. `Skeletons.jsx` contains dynamic Tailwind width classes (`w-${w}`) that Tailwind may not generate.
18. Development proxy helps relative `/api` calls, but production Vercel rewrite does not proxy API traffic.
19. No automated test suite exists. Validate changed flows manually or with targeted build checks.

## 25. Coding Conventions

Frontend:

- Use `.jsx` React function components and hooks.
- Do not introduce TypeScript without a repository-wide migration.
- Use relative imports; no path aliases are configured.
- Keep page-local helper components inside the page file when they are not reused.
- Prefer existing contexts, API helpers, `PageWrapper`, `ProductCard`, `QuantityStepper`, skeletons, and animation utilities.
- Match the edited file's formatting. Existing code uses semicolons and a mix of compact and expanded JSX.
- Use `react-hot-toast` for user-facing non-blocking success/error messages.
- Keep loading, empty, and error states for data-fetching UI.
- Keep product IDs as Mongo `_id` strings in UI.
- For cart operations, always preserve selected size and price.

Backend:

- Routes stay thin.
- Controllers use `async`/`await`, return early for expected validation/auth failures, and pass unexpected failures to `next(err)` unless the existing controller intentionally handles its own response.
- Preserve `{ success, ... }` JSON envelopes.
- Use HTTP 401 for missing/invalid auth, 403 for authenticated-but-forbidden, 404 for missing resources, and 400 for validation/business-rule failures.
- Use Mongoose schemas for persistent validation.
- Never expose passwords or provider secrets.
- Apply `protect, admin` to admin routes.
- Keep static routes before generic `/:id` routes.

Documentation/comments:

- This codebase has many historical comments from prior changes. New work should use concise comments only for non-obvious logic.
- Avoid adding change-log style comments to source files.

## 26. Safe Feature-Addition Playbook

When adding or changing a feature:

1. Identify the vertical slice: page/component, context state, API helper, route, controller, model, external integration.
2. Preserve security boundaries: React guards are UX only; backend middleware is required for protected behavior.
3. Update contracts together: schema, controller input/output, route, client API helper, context normalization, forms, and rendering.
4. Keep cart/order snapshot semantics unless deliberately changing historical data behavior.
5. Keep pricing server-authoritative. Any new discount, delivery rule, tax, fee, or payment condition must update `server/utils/pricing.js`, `orderController`, payment creation, and UI displays together.
6. Reuse optimistic-update patterns for cart/wishlist and include rollback on failure.
7. Treat external providers as fallible. Payment/upload failures should surface clearly; email failures should not cancel an order.
8. Avoid duplicating product cards, quantity controls, status configs, and tab definitions. Use existing reusable modules/constants.
9. Protect destructive actions with clear confirmation and server authorization.
10. Validate proportionally. With no test suite, at minimum run `npm run build` for frontend-impacting changes and manually exercise affected API/UI flows when possible.

## 27. Agent Checklist Before Editing

- Check current git status and preserve user changes.
- Ignore the stray `{client/` tree.
- Work in `client/` for React/UI changes and `server/` for API/data changes.
- Do not read, print, or commit `.env` secrets.
- Add reusable JSON endpoint methods to `client/src/services/api.js`.
- For protected backend mutations, verify route middleware and controller validation.
- For product/cart/order changes, inspect all three schemas plus UI/email renderers.
- For promo/payment changes, inspect `server/utils/pricing.js`, `orderController.js`, `paymentController.js`, `CartPage.jsx`, and `CheckoutPage.jsx`.
- For deployment-sensitive changes, account for Vercel SPA fallback, API origin env vars, CORS, MongoDB, Cloudinary, Razorpay, Google, and Brevo env vars.
- Do not incidentally fix known constraints. If a trap must be fixed, scope it deliberately across affected files.
