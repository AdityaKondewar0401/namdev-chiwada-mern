# Namdev Chiwda MERN - Permanent Agent Context

This file is the durable project briefing for future AI coding agents. It is written for agents, not end users. Use it to understand architecture, contracts, conventions, and integration traps without re-reading the entire repository.

Prefer verified source code over this document if the repository changes later.

## 1. Project Overview

Namdev Chiwda is a full-stack MERN e-commerce application for a Solapur snack brand. The customer app supports product discovery, product detail pages, cart, wishlist, account/profile, COD checkout, Razorpay online checkout, order history, and order tracking. Admin users can manage products, images, orders, and promo codes.

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
- Transactional order email uses Resend HTTPS API.
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
  -> Resend API for transactional email
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
    scripts/
      generate-seo-files.mjs   ← build-time sitemap.xml + robots.txt generator ("prebuild" script)
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
        SEO.jsx                  ← per-page <head> manager (title/meta/canonical/OG/Twitter/JSON-LD)
        Breadcrumbs.jsx          ← shared visible breadcrumb nav; feeds buildBreadcrumbSchema()
        WishlistIcon.jsx
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
      config/
        seo.config.js           ← canonical domain + brand SEO defaults (SITE_URL, SITE_NAME, ...)
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
        ChiwadaPage.jsx            ← SEO landing page — "chiwada"
        SolapuriChiwadaPage.jsx    ← SEO landing page — "solapuri chiwada"
        MaharashtrianSnacksPage.jsx← SEO landing page — "maharashtrian snacks"
        OurHistoryPage.jsx         ← SEO landing page — brand history / "since 1873"
      services/
        api.js
      utils/
        animations.js
        cloudinary.js
        structuredData.js       ← pure JSON-LD builders (Organization/WebSite/Product/Breadcrumb/FAQ)
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
      rateLimits.js            ← single source of truth for every rate-limit threshold (env-driven)
      shadowfax.js
    controllers/
      authController.js
      productController.js
      cartController.js
      orderController.js
      paymentController.js
      uploadController.js
      wishlistController.js
      shippingController.js
    middleware/
      auth.js
      errorHandler.js
      rateLimiter.js           ← per-IP tiered limiters (express-rate-limit)
      accountRateLimiter.js    ← per-ACCOUNT exponential backoff (Mongo-backed)
      validate.js              ← express-validator choke point — 400 on any failed chain
    models/
      User.js
      Product.js
      Cart.js
      Order.js
      Promo.js
      RateLimitAttempt.js      ← backs accountRateLimiter; TTL-indexed
      VerifiedPayment.js
    routes/
      auth.js
      products.js
      cart.js
      orders.js
      payment.js
      upload.js
      wishlist.js
      shipping.js
    services/
      emailService.js
      shadowfaxService.js
    utils/
      pricing.js
      weight.js
    validators/               ← one express-validator chain file per domain
      common.js                 (shared field helpers: mongoIdParam, indianPhone, ...)
      authValidators.js
      productValidators.js
      cartValidators.js
      orderValidators.js
      paymentValidators.js
      wishlistValidators.js
      uploadValidators.js
      shippingValidators.js
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

- `client/index.html` loads Google Fonts and Google Identity Services, and carries the static fallback `<head>` metadata (title, description, Open Graph, Twitter card, LCP hero preload) that non-JS crawlers see. Per-page SEO is layered on top at runtime by `components/SEO.jsx`.
- `client/tailwind.config.js` defines `saffron`, `cream`, `brown-dark`, `brown-mid`, `gold`, `leaf`, animation tokens, shadows, and custom radii.
- `client/vercel.json` rewrites all paths to `/index.html` for SPA routing.
- `client/vite.config.js` proxies relative `/api` requests to `https://namdev-backend.onrender.com` during Vite development.
- `client/scripts/generate-seo-files.mjs` runs as the client package's `prebuild` (so `npm run build` always runs it first) and writes `public/sitemap.xml` + `public/robots.txt`. See §29.
- `client/src/config/seo.config.js` is the single source of truth for the production domain (`SITE_URL`, from `VITE_SITE_URL`, default `https://www.namdevchiwda.com`) and brand SEO defaults.

See §29 for the full SEO architecture.

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
| Email | Resend HTTPS API via native `fetch` | SMTP is intentionally not used. |
| Rate limiting | `express-rate-limit` (per-IP, in-memory) + a Mongo-backed per-account backoff | Tiered. See §30. |
| Input validation | `express-validator` chains in `server/validators/*` + `middleware/validate.js` | Reject-only, never sanitize-and-continue. See §30. |
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
| `/products/:slug` | Public | `ProductDetailPage` | Product detail. Param accepts a slug OR a raw Mongo `_id` (`GET /api/products/:id` resolves either). Canonical URLs are slug-based; the page client-side-redirects an id URL to the slug URL once the product resolves (a `<Navigate replace>`, not a true HTTP 301 — see §24). Gallery, size, cart, wishlist, related products. |
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
| `/our-history` | Public | `OurHistoryPage` | SEO landing page — brand history, "since 1873". |
| `/chiwada` | Public | `ChiwadaPage` | SEO landing page targeting the keyword "chiwada". |
| `/solapuri-chiwada` | Public | `SolapuriChiwadaPage` | SEO landing page targeting "solapuri chiwada". Includes visible FAQ + `FAQPage` JSON-LD. |
| `/maharashtrian-snacks` | Public | `MaharashtrianSnacksPage` | SEO landing page targeting "maharashtrian snacks". |
| `/business` | Public | `BusinessLandingPage` | Public, indexable B2B acquisition page — loads eagerly like the SEO pages. Wrapped in `B2BFeatureGate` (404s for non-admins while `B2B_ENABLED` is off — see §31). |
| `/business/apply` | Auth | `BusinessApplyPage` | Wholesale application form. `B2BFeatureGate` outside `ProtectedRoute` (login not required to see the gate itself). |
| `/b2b` | `businessOnly` | `B2BDashboardPage` | Status gate (no application / pending / rejected / suspended / approved) + credit summary + recent orders, inside `B2BProvider`/`B2BLayout`. |
| `/b2b/order` | `businessOnly` | `B2BQuickOrderPage` | Approved-only quick order (grouped catalog, live quote, mobile sticky summary bar). |
| `/b2b/orders`, `/b2b/orders/:id` | `businessOnly` | `B2BOrdersPage`, `B2BOrderDetailPage` | Order list/detail, status timeline, cancel (while `placed`), reorder, invoice PDF download. |
| `/b2b/invoices` | `businessOnly` | `B2BInvoicesPage` | Own invoices, PDF download. |
| `/b2b/statement` | `businessOnly` | `B2BStatementPage` | Own ledger statement with date-range filter, credit summary, CSV export. |
| `/b2b/profile` | `businessOnly` | `B2BProfilePage` | Edit own business profile / shipping addresses. |
| `/namkeen/:id` | Public legacy | `NamkeenRedirect` (in `App.jsx`) | Redirects to `/products/:id` via `<Navigate replace>`. `NamkeenDetailPage.jsx` is now unreferenced dead code. Do not extend. |
| `*` | Public | `NotFoundPage` | Branded not-found page (extracted component, `pages/NotFoundPage.jsx`) inside `Layout`, with `<SEO robots="noindex,nofollow">`. Also what `B2BFeatureGate` renders for a gated route. |

`/b2b/*` routes are `ProtectedRoute businessOnly` (any application status — each page/`B2BContext` reads live status for finer gating, e.g. Quick Order requires `approved`) wrapped OUTSIDE by `B2BFeatureGate`, so a disabled feature 404s regardless of login state. See §31 for the full B2B Wholesale Portal writeup.

The four SEO landing pages are genuine long-form content pages (what-it-is, how-it's-made, heritage tie-in, product links, FAQs), not thin doorway pages. All heritage facts reuse the same true information already on `AboutPage`/`OurHistoryPage`.

Authenticated-only pages (`CheckoutPage`, `OrdersPage`, `AccountPage`, `WishlistPage`, `AdminPage`) are `React.lazy`-loaded / code-split; public + crawled pages load eagerly.

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
| `SEO.jsx` | Per-page `<head>`: title, description, canonical, robots, OG, Twitter, JSON-LD. Manages `document.head` directly via `useEffect` (react-helmet-async does not commit under this Vite/Rolldown build). | Render one `<SEO>` near the top of every page — public pages with real metadata, private pages with `robots="noindex,nofollow"`. `canonical` is required. See §29. |
| `Breadcrumbs.jsx` | Shared visible breadcrumb nav (`items` = `[{label, path}]`). | Hand the SAME `items` array to `buildBreadcrumbSchema()` so visible crumbs and JSON-LD always agree. |
| `hooks/useReveal.js` | One-shot IntersectionObserver. | Attach returned ref to elements with `.reveal`. |
| `utils/animations.js` | Framer Motion variants. | Prefer these before adding duplicate variants. |
| `utils/cloudinary.js` | Adds Cloudinary transformations and responsive srcset. | Use for Cloudinary display URLs where possible. |
| `utils/structuredData.js` | Pure JSON-LD builders: `buildOrganizationSchema`, `buildWebsiteSchema`, `buildProductSchema`, `buildBreadcrumbSchema`, `buildFAQSchema`. | Never invents facts — every field comes from a real Product doc or a static true brand fact. No `LocalBusiness` schema on purpose (business asked not to surface the shop address). |
| `config/seo.config.js` | `SITE_URL`, `SITE_NAME`, `DEFAULT_OG_IMAGE`, `DEFAULT_DESCRIPTION`, `SOCIAL_PROFILES`, `isProductionHost()`. | Change the production domain here (or via `VITE_SITE_URL`) — one place. |

## 9. Page Responsibilities

- `HomePage.jsx`: page composition only. Imports hero/story/testimonials/distributorship/sticky-shop components and `NamkeenSection`.
- `ProductsPage.jsx`: fetches `productAPI.getAll({ sort, search })`, tracks loading/error/total, and syncs `sort`/`search` to URL params.
- `ProductDetailPage.jsx`: fetches one product, fetches related products, manages gallery, selected size, quantity, wishlist, share, mobile sticky add-to-cart bar, breadcrumbs + `Product`/`BreadcrumbList` JSON-LD, and the id→slug canonical redirect.
- `ChiwadaPage.jsx` / `SolapuriChiwadaPage.jsx` / `MaharashtrianSnacksPage.jsx` / `OurHistoryPage.jsx`: static SEO landing pages — long-form content, breadcrumbs, a visible FAQ block, and `<SEO>` with `FAQPage` + `BreadcrumbList` JSON-LD. No backend calls. See §29.
- `CartPage.jsx`: reads `CartContext`, allows quantity/removal/clear, validates promo with `orderAPI.validatePromo`, passes promo state to checkout navigation.
- `CheckoutPage.jsx`: validates address, revalidates incoming promo from cart, uses `api.post('/api/payment/create-order')`, opens Razorpay, verifies payment, then calls `orderAPI.place`.
- `OrdersPage.jsx`: supports both list and detail route modes from the same component based on optional `id` param.
- `AccountPage.jsx`: fetches orders and populated wishlist once for stats and tab content; tabs are query-param based.
- `WishlistPage.jsx`: combines product catalog fetch with `WishlistContext` IDs to display saved products.
- `AdminPage.jsx`: thin admin shell. Fetches products and admin orders, owns active tab and edit-product state, delegates UI to `components/admin/*`.
- `AuthPages.jsx`: contains login/register pages plus Google login button. Google login uses raw `fetch` to `${import.meta.env.VITE_API_URL}/api/auth/google`.
- `ContactPage.jsx`: opens `mailto:` or WhatsApp with pre-filled content; there is no server-side contact submission.
- `AboutPage.jsx`: presentation-heavy page with local helpers, animation hooks, story data, and no backend calls.
- `NamkeenDetailPage.jsx`: legacy broken page (references undefined `PRODUCTS`). Now unreferenced dead code — the `/namkeen/:id` route redirects to `/products/:id` instead (`NamkeenRedirect` in `App.jsx`). Do not build on it.

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

`server.js` also sets `app.set('trust proxy', TRUST_PROXY_HOPS || 1)` (required for correct per-IP rate-limit keying behind Render's proxy) and registers `process.on('uncaughtException'/'unhandledRejection')` handlers that log and exit for a clean restart.

Middleware:

- `protect`: reads Bearer token, verifies JWT with `JWT_SECRET`, loads current user with `select('-password')`, attaches `req.user`, returns 401 on missing/invalid/expired token.
- `admin`: requires `req.user.role === "admin"`, returns 403 otherwise.
- `errorHandler`: normalizes Mongoose cast errors, duplicate keys, and validation errors into `{ success: false, message }`.
- Rate limiters (`middleware/rateLimiter.js`): `authLimiter`, `publicLimiter`, `userActionLimiter`, `webhookLimiter` — per-IP, tiered. See §30.
- `accountLimiter(purpose)` (`middleware/accountRateLimiter.js`): per-account exponential backoff, stacked on top of `authLimiter` for login/register. See §30.
- `validate` (`middleware/validate.js`): runs after a route's `express-validator` chain array; returns `400 { success, message: "Validation failed", errors: [{ field, message }] }` if any rule failed. Reject-only — never sanitizes and continues.

Standard route middleware order: `[ipLimiter] → [validatorChain, validate] → [protect] → [admin] → [userActionLimiter] → controller`. Auth routes specifically: `authLimiter → validatorChain → validate → accountLimiter(...) → controller` (cheap per-IP reject first, schema check before any DB query, per-account DB lookup last). See the header comment in `routes/auth.js`.

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

Two cross-cutting concerns apply to nearly every route below (added in a later security pass — see §30):

- **Rate limiting.** Every route carries exactly one per-IP tier: `authLimiter` (auth routes), `publicLimiter` (public reads), `userActionLimiter` (authenticated actions + admin), or `webhookLimiter` (the Shadowfax callback). `POST /api/auth/register` and `POST /api/auth/login` additionally run `accountLimiter(...)` (per-account backoff). A throttled request gets `429 { success: false, message }` (the account limiter also sets `Retry-After` and adds `retryAfterSeconds`).
- **Input validation.** Most routes run an `express-validator` chain array from `server/validators/*` followed by `validate`. A schema mismatch is rejected with `400 { success: false, message: "Validation failed", errors: [{ field, message }] }` before the controller runs. This is a stricter, field-level envelope than the generic error envelope above — new clients should read `errors[]` when present.

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
| POST | `/api/products/seed` | Admin | Destructive product reset from `config/seedData.js`. Was public until a later security pass locked it behind `protect, admin` — wiping the live catalog required no auth at all before that. |
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

### B2B (Wholesale)

`/api/b2b/*` (business-facing, `router.use(protect, userActionLimiter, requireB2BEnabled)`) and `/api/b2b/admin/*` (admin-only, `router.use(protect, userActionLimiter, admin)`, NOT gated by `B2B_ENABLED`) are a separate, self-contained subsystem — full route list, request/response shapes, and every model/util/component behind them are documented in §31 rather than duplicated in this table (the same treatment §28 gives the Shadowfax routes). The one exception is `GET /api/b2b/config`, which is deliberately public (`publicLimiter`, no `protect`) so the logged-out `/business` landing page can read real delivery-region text and the `enabled` flag.

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
- Product seeding (`POST /api/products/seed`) is admin-only now but still destructive (wipes the whole catalog); avoid using it unless explicitly requested.
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

Fonts loaded in `index.html` (one Google Fonts `<link>`):

- Playfair Display
- DM Sans
- Poppins
- Noto Serif Devanagari
- Tiro Devanagari Marathi
- Gotu
- Lora

Checkout uses inline CSS with `fontFamily: "'Lora', Georgia, serif"` — `Lora` is loaded (see trap 16). "Cormorant Garamond" was removed from `index.html`'s font link after a full-codebase search confirmed nothing referenced it (no `font-cormorant` Tailwind class, no literal font-family string) — it was pure dead weight.

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
VITE_SITE_URL=https://www.namdevchiwda.com   # optional — canonical/OG/sitemap domain; defaults to this value if unset
```

`VITE_SITE_URL` is also read (via `process.env`) by `client/scripts/generate-seo-files.mjs` at build time for the sitemap, and Vercel's own `VERCEL_ENV` drives that script's preview-vs-production `robots.txt` branch.

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

EMAIL_USER=verified-resend-sender@example.com
RESEND_API_KEY=...

# Rate limiting — all optional, sane fallbacks live in server/config/rateLimits.js.
# Retuning any of these needs no code change or logic redeploy.
TRUST_PROXY_HOPS=1                     # reverse-proxy hops to trust for the real client IP (Render = 1)
RATE_LIMIT_IP_AUTH_WINDOW_MS=900000    # Tier 1 (auth): window + max per IP
RATE_LIMIT_IP_AUTH_MAX=20
RATE_LIMIT_IP_PUBLIC_WINDOW_MS=60000   # Tier 2 (public reads)
RATE_LIMIT_IP_PUBLIC_MAX=100
RATE_LIMIT_IP_USER_WINDOW_MS=60000     # Tier 3 (authenticated actions, keyed by user id)
RATE_LIMIT_IP_USER_MAX=180
RATE_LIMIT_IP_WEBHOOK_WINDOW_MS=60000  # Shadowfax webhook (server-to-server)
RATE_LIMIT_IP_WEBHOOK_MAX=120
RATE_LIMIT_LOGIN_FREE_ATTEMPTS=5       # per-account backoff — login
RATE_LIMIT_LOGIN_BASE_DELAY_MS=2000
RATE_LIMIT_LOGIN_MAX_DELAY_MS=900000
RATE_LIMIT_REGISTER_FREE_ATTEMPTS=5    # per-account backoff — register
RATE_LIMIT_REGISTER_BASE_DELAY_MS=5000
RATE_LIMIT_REGISTER_MAX_DELAY_MS=1800000
RATE_LIMIT_PW_RESET_FREE_ATTEMPTS=3    # config ready; no password-reset route wired yet
RATE_LIMIT_PW_RESET_BASE_DELAY_MS=5000
RATE_LIMIT_PW_RESET_MAX_DELAY_MS=1800000
RATE_LIMIT_RECORD_TTL_SECONDS=86400    # Mongo TTL for quiet RateLimitAttempt docs (see §30 trap)
```

Notes:

- `EMAIL_PASS` is not used by the current Resend implementation.
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

- The backend now deploys on Render (see `client/vite.config.js`'s dev proxy target, `https://namdev-backend.onrender.com`, and §20's `VITE_API_URL`). `server/railway.toml` (Nixpacks, start command `node server.js`) is a leftover from an earlier Railway deployment — verify with the user before relying on or removing it.
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
- `express-rate-limit` — per-IP limiters (`middleware/rateLimiter.js`). Uses its `ipKeyGenerator` helper for IPv6-safe keys.
- `express-validator` — request schema chains (`server/validators/*`, `middleware/validate.js`).
- `nodemailer` is installed but current email sending uses Resend HTTPS API, not SMTP.

## 23. Known Design Decisions

- Controllers are the domain orchestration layer. Do not introduce a separate service abstraction unless it removes real duplication or matches a new repeated pattern.
- Product, cart, and order items use snapshots so old carts/orders remain readable if product data changes.
- Server-side cart and pricing are intended to be the authority for payment/order totals.
- Transactional email is intentionally best-effort after order creation.
- Resend HTTPS API is used instead of SMTP because platform SMTP egress can be blocked.
- Cloudinary upload transforms cap image dimensions at 800x800, use automatic quality, and use automatic fetch format.
- Admin dashboard analytics are computed client-side from fetched orders/products instead of adding analytics endpoints.
- Contact form opens user email/WhatsApp instead of pretending to submit to a nonexistent API.
- The app has public `/products/:slug` and a legacy `/namkeen/:id` that now just redirects; use `/products/:slug` for maintained product work.
- SEO metadata is managed client-side (`SEO.jsx` writes `document.head`) rather than SSR/prerender, because the app is a pure Vite SPA. `index.html` carries static fallback tags for non-JS crawlers. Accepted tradeoff — see §29.
- Per-IP rate limiting is deliberately in-memory (per-process), not Redis-backed. Only the per-*account* backoff needs to survive restarts, so only that is in Mongo (`RateLimitAttempt`). See §30.
- `express-validator` chains only *check* (never `.escape()`/`.trim()` to rewrite input). A non-conforming request is rejected, not silently cleaned and passed through.

## 24. Known Constraints and Traps

1. ~~`NamkeenDetailPage.jsx` is broken because it references undefined `PRODUCTS`.~~ FIXED: `/namkeen/:id` now redirects to `/products/:id` via a `NamkeenRedirect` component in `App.jsx` instead of rendering the crashing component. `NamkeenDetailPage.jsx` itself is unreferenced dead code now — safe to delete, kept only so this diff stays reviewable as a redirect, not a deletion.
2. `WishlistContext` receives populated objects from `GET /api/wishlist` but ID-based helpers expect strings. Normalize wishlist state before depending on it in new UI.
3. `WishlistPage` fetches all products and filters by `wishlist.includes(p._id)`, so it is affected by the same object-vs-id issue.
4. `NamkeenSection` uses local visual wishlist state only. `ProductCard` uses persistent `WishlistContext`.
5. Guest cart is not merged into server cart on login. Server cart replaces local state.
6. `logout` does not clear `nc_cart`, so the last loaded cart can remain in localStorage.
7. Server cart add trusts client-sent size and price after product existence check. Validate product size/price server-side before any pricing-security change.
8. ~~`Order.items` schema uses `weight`, while UI/email reads `item.size` and `placeOrder` passes cart items with `size`.~~ FIXED (verified while building the B2B portal, §31): `models/Order.js`'s item schema now has both `size` (current, matches `Cart.items`) and `weight` (kept only for older orders that used it). `utils/orderCreation.js`'s `createOrderForUser` — the shared core `orderController.placeOrder` and the WhatsApp bot both call — explicitly maps `size: item.size` when creating an order, never `weight`.
9. ~~`ProductDetailPage` dispatches a `pdp-sticky-bar` event and `App` passes props to `WhatsAppFloat`, but `WhatsAppFloat` ignores both.~~ FIXED: `WhatsAppFloat` now listens for `pdp-sticky-bar` and honors its `phone`/`message` props. It also now hides itself on `/checkout`, since its fixed `bottom-24 right-5` position previously overlapped CheckoutPage's full-width mobile sticky Pay bar.
10. Product detail copy still says free delivery at INR 500, while pricing utilities and cart/checkout use INR 499.
11. Default promo names are protected from deletion but not seeded automatically.
12. ~~`POST /api/products/seed` is public and destructive.~~ FIXED: now behind `protect, admin` like every other write route in `products.js`.
13. `DELETE /api/upload/:publicId` is awkward for Cloudinary public IDs containing `/`.
14. `ProductFormTab` removes uploaded image URLs from form state only; it does not call Cloudinary delete.
15. `updateProduct` does not auto-regenerate slug on rename.
16. ~~`CheckoutPage.jsx` uses `Lora` but `index.html` does not load it.~~ `Lora` is now in the `index.html` Google Fonts link.
17. `Skeletons.jsx` contains dynamic Tailwind width classes (`w-${w}`) that Tailwind may not generate.
18. Development proxy helps relative `/api` calls, but production Vercel rewrite does not proxy API traffic.
19. No automated test suite exists. Validate changed flows manually or with targeted build checks.
20. **SEO metadata is JS-rendered.** `SEO.jsx` writes `document.head` in a `useEffect`, so crawlers that don't execute JS (most social-preview scrapers — WhatsApp/Facebook/LinkedIn) only ever see the static fallback tags in `client/index.html`, not per-page titles/OG/JSON-LD. Googlebot renders JS and sees the real tags. If richer non-JS previews are needed, that requires SSR/prerendering, which this SPA does not have.
21. **The old-id → canonical-slug product redirect is client-side.** `ProductDetailPage` does `<Navigate replace>` after the product resolves, not an HTTP 301. Search engines treat it as a soft signal only. A true 301 would need an edge/redirect rule on Vercel or the API.
22. `index.html`'s SEO fallback comment still says metadata is rendered "by `<SEO>` via react-helmet-async" — stale; `SEO.jsx` was rewritten to manage `document.head` directly (react-helmet-async never committed under this Vite 8 / Rolldown build). Comment only, no behavioral impact.
23. **Changing `RATE_LIMIT_RECORD_TTL_SECONDS` does not retroactively apply.** MongoDB bakes `expireAfterSeconds` into the TTL index at creation time (`RateLimitAttempt.js`). A new value needs the index dropped and recreated.
24. The account rate limiter **fails open** — a DB error in `accountLimiter`/`recordFailure`/`recordSuccess` is logged and the request proceeds (so a limiter bug can never lock every user out of login). The per-IP `authLimiter` is still the backstop.
25. `RATE_LIMIT_PW_RESET_*` config and `accountRateLimiter`'s `passwordReset` purpose exist but are **not wired to any route** — there is no password-reset endpoint in this codebase yet. Wiring one up later is a one-line route addition, not a redesign.
26. The sitemap generator (`generate-seo-files.mjs`) fetches product slugs from the **live API at build time**. If the backend is asleep/down during a Vercel build, the sitemap is still written but with static pages only (logged as a warning, build does not fail).
27. `generate-seo-files.mjs` and `seo.config.js` each hardcode the same production-domain fallback (`https://www.namdevchiwda.com`) and the same API fallback. Keep them in sync when either changes (both files call this out in comments).

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
- For any new API route, wire the right rate-limit tier + an `express-validator` chain + `validate` (see §30).
- For any new/changed page, keep exactly one `<SEO>` with a correct `canonical`; add public indexable routes to `STATIC_PAGES` in `generate-seo-files.mjs`; private pages pass `robots="noindex,nofollow"` (see §29).
- For product/cart/order changes, inspect all three schemas plus UI/email renderers.
- For promo/payment changes, inspect `server/utils/pricing.js`, `orderController.js`, `paymentController.js`, `CartPage.jsx`, and `CheckoutPage.jsx`.
- For deployment-sensitive changes, account for Vercel SPA fallback, API origin env vars, CORS, MongoDB, Cloudinary, Razorpay, Google, and Resend env vars.
- Do not incidentally fix known constraints. If a trap must be fixed, scope it deliberately across affected files.

## 28. Shipping / Courier — Shadowfax (Forward Operations, Warehouse - Order Creation)

The app ships from its own warehouse (Solapur), not a marketplace, so it
integrates with Shadowfax's **Warehouse - Order Creation** model, not the
Marketplace model. There is no reverse-logistics/returns flow — RTO details
sent to Shadowfax always mirror the pickup warehouse address.

Files:

- `server/config/shadowfax.js` — env-driven config (base URL by
  `SHADOWFAX_ENV`, pickup/RTO address, 7kg max-order-weight cap).
- `server/utils/weight.js` — parses cart/order line `size` labels
  ("250g", "1kg", ...) into grams and sums them per order.
- `server/services/shadowfaxService.js` — the only place that calls the
  Shadowfax API (native `fetch`, same convention as `config/email.js`
  Resend calls — no axios dependency added). Exposes pincode
  serviceability, warehouse order creation, single/bulk tracking (v4),
  order update, cancellation, escalation, and POD lookup, plus
  `mapShadowfaxStatusToOrderStatus` (Shadowfax `status_id` -> our
  `Order.status` enum).
- `server/controllers/shippingController.js` + `server/routes/shipping.js`
  (mounted at `/api/shipping`) — public pincode check
  (`GET /check-pincode`), the Push Callback webhook
  (`POST /webhook/shadowfax`, optionally verified against
  `SHADOWFAX_WEBHOOK_TOKEN`), and admin-only manual actions (resync
  tracking, create/cancel shipment, escalate, POD).
- `Order.courier` (see `server/models/Order.js`) — `awbNumber`,
  `shadowfaxOrderId`, `status`/`statusDisplay` (raw Shadowfax values,
  not our own enum), `trackingUrl`, `history[]` (one entry per webhook
  event), `error` (set if shipment creation/cancellation failed).

Flow:

1. `orderController.placeOrder` re-validates the delivery pincode and the
   7kg weight cap (client-side copies exist in `CheckoutPage.jsx` for UX,
   but these two server checks are authoritative) before creating the
   order.
2. Shipment creation is a deliberate admin action, not automatic.
   `placeOrder` no longer calls Shadowfax at all — an admin must click
   "Create Shipment" in `OrdersTab.jsx`
   (`POST /api/shipping/orders/:id/create-shipment`,
   `shippingController.createShipment`) once the order exists. This gives
   the admin a review step before a real courier pickup is requested.
   On failure, the Shadowfax error is persisted to `order.courier.error`
   (and `lastSyncedAt`) before the 502 response, so a failed attempt
   survives a page refresh instead of looking identical to "never tried"
   — `OrdersTab.jsx`'s "⚠️ Shipment not created" badge depends on this
   being saved.
3. Shadowfax's Push Callback webhook updates `order.courier` and
   forward-progresses `order.status` (via `mapShadowfaxStatusToOrderStatus`)
   — it never regresses an order already `delivered` or `cancelled`.
4. Admin setting an order's status to `cancelled` in `OrdersTab.jsx` also
   cancels the Shadowfax shipment if one exists (`orderController.updateOrderStatus`).

Traps:

- Shadowfax's **staging** environment only whitelists a few test pincodes
  (110009, 560077, 560007 per their docs) — real Solapur-area pincodes like
  413007 will correctly report as unserviceable in staging. This is
  expected; switch `SHADOWFAX_ENV=production` with a real production
  token before relying on real customer pincodes.
- `client_order_id` sent to Shadowfax is always this app's Mongo
  `Order._id` — the webhook's `order_id` field is looked up against that,
  not a separate order-number scheme.

## 29. SEO Architecture

The app is a pure Vite SPA (no SSR / no prerender), so SEO is a layered
client-side + build-time system rather than server-rendered `<head>`s.

### Pieces

| File | Role |
| --- | --- |
| `client/src/config/seo.config.js` | Single source of truth: `SITE_URL` (from `VITE_SITE_URL`, default `https://www.namdevchiwda.com`, trailing slash stripped), `SITE_NAME`, `SITE_NAME_MARATHI`, `DEFAULT_OG_IMAGE`, `DEFAULT_DESCRIPTION`, `TWITTER_HANDLE` (currently `null`), `SOCIAL_PROFILES`, and `isProductionHost()`. |
| `client/src/components/SEO.jsx` | Renders nothing; a `useEffect` writes `document.title`, `meta[name=description/keywords/robots]`, `link[rel=canonical]`, Open Graph, Twitter card, and `script[type=application/ld+json]` directly into `document.head`. Every element it owns carries `data-seo="true"` (or `data-seo-jsonld="true"`) so the next page's effect updates/replaces exactly those and never the static `index.html` fallbacks. |
| `client/src/utils/structuredData.js` | Pure JSON-LD builders: `buildOrganizationSchema()`, `buildWebsiteSchema()` (both homepage-only), `buildProductSchema(product)`, `buildBreadcrumbSchema(items)`, `buildFAQSchema(faqs)`. |
| `client/src/components/Breadcrumbs.jsx` | Visible breadcrumb nav. Takes `items = [{ label, path }]` — the SAME array is passed to `buildBreadcrumbSchema()` so on-page crumbs and JSON-LD always match. |
| `client/index.html` | Static fallback `<head>` (title, description, OG, Twitter, hero LCP preload) for non-JS crawlers. |
| `client/scripts/generate-seo-files.mjs` | `prebuild` script → writes `client/public/sitemap.xml` and `client/public/robots.txt` into the Vite build output. |

### Rules / conventions

- **Every page renders exactly one `<SEO>`** near the top of its JSX.
  Public pages pass real `title` + `description` + `canonical` (+ `jsonLd`
  where relevant). Authenticated/private pages (`AccountPage`, `WishlistPage`,
  `OrdersPage`, `CheckoutPage`, `AdminPage`, `AuthPages`, `CartPage`) and the
  404 route pass `robots="noindex,nofollow"`. `canonical` is **required** —
  it accepts an absolute URL or a site-relative path (`/solapuri-chiwada`),
  resolved against `SITE_URL`.
- `SEO.jsx` does not auto-append a site-name suffix — callers pass the exact
  final title string.
- **Preview-deployment safety (two halves).**
  1. Build-time: `generate-seo-files.mjs` checks `process.env.VERCEL_ENV`; when
     it is `"preview"` it writes a blanket `Disallow: /` `robots.txt` with no
     sitemap line.
  2. Runtime: `isProductionHost()` in `seo.config.js` compares
     `window.location.hostname` to `SITE_URL`'s host; `SEO.jsx` forces
     `robots` to `noindex,nofollow` for any non-production host regardless of
     what the page passed. So a `*.vercel.app` preview can never be indexed as
     a duplicate of production.
- **Sitemap contents.** `STATIC_PAGES` in the script: `/`, `/products`,
  `/chiwada`, `/solapuri-chiwada`, `/maharashtrian-snacks`, `/our-history`,
  `/about`, `/contact`. Product URLs (`/products/<slug>`) are fetched live from
  `GET /api/products?limit=100` at build time. Every authenticated route,
  `/admin`, `/login`, `/register`, and `/namkeen/:id` are deliberately
  excluded. `robots.txt` (production) `Disallow`s `/admin`, `/account`,
  `/wishlist`, `/cart`, `/checkout`, `/orders`, `/login`, `/register`.
- **JSON-LD honesty rule.** `structuredData.js` never fabricates ratings,
  reviews, or business facts. `buildProductSchema` only emits
  `aggregateRating` when `product.reviews > 0`, using the same numbers shown
  on the visible page. There is intentionally **no `LocalBusiness` schema**
  (the business asked not to make the physical shop address more
  discoverable).
- **Product URL canonicalization.** URLs are slug-based
  (`/products/namdev-chiwada`). `GET /api/products/:id` resolves a 24-char
  ObjectId *or* a slug, so no backend change was needed.
  `ProductDetailPage` redirects an id-form URL to the canonical slug URL
  client-side (`<Navigate replace>` — not a true 301; see §24 trap 21).
- The four SEO landing pages (`ChiwadaPage`, `SolapuriChiwadaPage`,
  `MaharashtrianSnacksPage`, `OurHistoryPage`) are full content pages reusing
  true heritage facts from `AboutPage`/`OurHistoryPage`. All four carry a
  visible FAQ block plus matching `FAQPage` JSON-LD and a `BreadcrumbList`.

### When adding or changing a page

1. Add/keep one `<SEO>` with a correct `canonical`.
2. If it's a new public indexable route, add it to `STATIC_PAGES` in
   `generate-seo-files.mjs`.
3. If it has breadcrumbs, build the `items` array once and pass it to both
   `<Breadcrumbs>` and `buildBreadcrumbSchema()`.
4. If it has a visible FAQ, mark it up with `buildFAQSchema()` using the
   exact visible Q&A text.
5. Private/authenticated pages must pass `robots="noindex,nofollow"`.

## 30. Rate Limiting and Input Validation

Both were added in a later security pass and now apply across the API.

### Rate limiting

Config: `server/config/rateLimits.js` — every threshold is read from `.env`
with a fallback (see §20 for the full var list), so ops can retune without a
code change. `server.js` sets `app.set('trust proxy', TRUST_PROXY_HOPS || 1)`
so per-IP keys use the real client IP behind Render's proxy.

**Per-IP tiers** (`server/middleware/rateLimiter.js`, `express-rate-limit`,
in-memory per process):

| Limiter | Default | Applied to |
| --- | --- | --- |
| `authLimiter` | 20 / 15 min / IP | `POST /api/auth/register`, `/login`, `/google` |
| `publicLimiter` | 100 / min / IP | public reads: `GET /api/products*`, `GET /api/shipping/check-pincode` |
| `userActionLimiter` | 180 / min / **user** | every authenticated route (cart, orders, wishlist, payment, upload, admin, `/api/auth/me` + `/profile` + `/change-password`, admin shipping actions). Keyed by `req.user._id`, falling back to `ipKeyGenerator(req.ip)` (IPv6-safe) — so one user on a shared/NAT IP can't exhaust another's quota. `protect` must run before it. |
| `webhookLimiter` | 120 / min / IP | `POST /api/shipping/webhook/shadowfax` only (server-to-server, kept separate from browser abuse) |

Throttled response: `429 { success: false, message }` with `RateLimit-*`
standard headers.

**Per-account exponential backoff** (`server/middleware/accountRateLimiter.js`,
backed by the `RateLimitAttempt` Mongo model). Stacks *on top of*
`authLimiter` for `/register` and `/login`. Stops a distributed / IP-rotating
attacker from brute-forcing one specific account when no single IP trips the
IP limit.

- Keyed by `${purpose}:${normalizedEmail}` (email lowercased/trimmed).
- First `freeAttempts` failures (default 5) run at normal speed — a real user
  mistyping their password never notices.
- Each failure after that: wait `baseDelayMs * 2^(attempts - freeAttempts)`,
  capped at `maxDelayMs`. Blocked requests get
  `429 { success, message, retryAfterSeconds }` + a `Retry-After` header.
- One **success** deletes the record (`recordSuccess`).
- No permanent lockout, no admin unlock — the delay always expires.
- **Fails open**: any DB error in the check or in `recordFailure`/
  `recordSuccess` is logged and the request proceeds (per-IP limiter is the
  backstop).
- Wiring: route does
  `authLimiter, <validators>, validate, accountLimiter('login'), login`;
  the controller calls `await recordFailure(req)` on every failure path and
  `await recordSuccess(req)` on success (`authController.js`).
- `google` login gets only the per-IP limiter — no per-account backoff (you
  already need a valid Google token, so per-account brute force isn't
  meaningful).
- `RateLimitAttempt` has a TTL index on `lastAttemptAt`
  (`expireAfterSeconds: recordTtlSeconds`, default 24h) to reap quiet records.
  Changing that env value needs the index rebuilt (§24 trap 23).

The `passwordReset` purpose is configured but unwired — no reset route exists
yet (§24 trap 25).

### Input validation

- One file per domain in `server/validators/` (`authValidators.js`,
  `productValidators.js`, `cartValidators.js`, `orderValidators.js`,
  `paymentValidators.js`, `wishlistValidators.js`, `uploadValidators.js`,
  `shippingValidators.js`), plus `common.js` for shared field helpers
  (`mongoIdParam`, `indianPhone`, pincode, etc.).
- Each export is an **array of `express-validator` chains** that only *check*
  (`isEmail`, `isInt`, `isLength`, `matches`, `isIn`, `isMongoId`, …). They do
  **not** call `.escape()`/`.trim()` to rewrite bad input into something
  acceptable.
- `server/middleware/validate.js` runs after the chain array: if any rule
  failed it returns
  `400 { success: false, message: "Validation failed", errors: [{ field, message }] }`
  (first error per field) and the controller never runs.
- Route pattern: `router.post('/thing', someValidatorArray, validate, controller.thing)`.
- Rejecting malformed `:id` params here (via `isMongoId`) means Mongoose never
  sees a `CastError` for the common bad-input case.

### When adding a route

1. Pick the right per-IP tier (`publicLimiter` for public reads,
   `userActionLimiter` for anything behind `protect`, `authLimiter` for
   credential-taking routes).
2. Add a validator chain array to the matching `validators/*` file (reuse
   `common.js` helpers) and put `<chain>, validate` before the controller.
3. For a new credential/account route, also add an `accountLimiter(purpose)`
   and a `rateLimitConfig.account.<purpose>` block, and call
   `recordFailure`/`recordSuccess` in the controller.

## 31. B2B Wholesale Portal

A parallel, deliberately separate wholesale ordering system for approved business buyers (retailers, sweet shops, distributors, supermarkets, caterers) — its own models, routes, and frontend section, built on top of the retail app rather than inside it. Full functional spec: `docs/B2B_PORTAL_SPEC.md`. Retail behavior is unchanged everywhere except the small, explicit set of shared files below.

### Overview

- Buyer-side: apply for an account → admin approves with a pricing tier, payment terms, and a credit limit → place tiered-price orders against a small wholesale catalog → track status → download invoices → view a running ledger/statement.
- Admin-side: review/approve/reject/suspend accounts, manage price tiers and the wholesale catalog, manage orders through a status workflow, issue invoices and credit notes, record payments/adjustments, and watch FY turnover against the GST registration threshold.
- No GST is charged anywhere today (`SELLER_GST_MODE=unregistered` — the business holds an FSSAI license, not a GST registration). Every document, screen, email, and CSV says so explicitly; see "Tax mode" below.
- Retail (`Product`, `Order`, `Cart`, checkout, retail admin) is completely untouched by this system — B2B has its own order model, its own admin tabs, and its own pricing/credit logic. The two systems share only the `User` document (one extra field, see Data model) and a handful of UI mount points.

### Feature switch (production safeguard)

The whole business-facing surface can be hidden behind one flag before launch, so the portal can be fully built and admin-configured (tiers, catalog, a test account) in production without being publicly visible or discoverable.

- `businessConfig.enabled` (`server/config/business.js`) reads `B2B_ENABLED` (default `false`, i.e. **fails closed**).
- `requireB2BEnabled` (`server/middleware/business.js`) — mounted via `router.use(protect, userActionLimiter, requireB2BEnabled)` at the top of `routes/b2b.js` (after `GET /config`, which is exempt so the frontend can read the flag). While disabled, every business-facing `/api/b2b/*` route 404s (`Route <url> not found` — indistinguishable from a route that doesn't exist) for anyone whose `req.user.role !== 'admin'`. Admins always pass.
- `routes/b2bAdmin.js` is **not** gated by this flag at all — admins need full access to set everything up before flipping the switch.
- Client: `useB2BEnabled()` (`client/src/hooks/useB2BEnabled.js`) — module-level cached + in-flight-deduped fetch of `GET /api/b2b/config`, fails closed (`enabled: false`) on any error. `B2BFeatureGate` (`client/src/components/b2b/B2BFeatureGate.jsx`) wraps `/business`, `/business/apply`, and every `/b2b/*` route in `App.jsx`, rendering the exact same `<Layout><NotFoundPage/></Layout>` a truly-missing route would show when `!enabled && user?.role !== 'admin'`. `Navbar`/`Footer`/`DistributorshipBand` each compute `showB2B = enabled || user?.role === 'admin'` before rendering their B2B entry point/CTA. `B2BDisabledNotice` (`components/admin/B2BDisabledNotice.jsx`) shows a small "hidden from customers" banner at the top of every admin B2B tab while the flag is off.
- A **separate**, build-time-only `VITE_B2B_ENABLED` (client `.env`) controls two things unrelated to the runtime flag above: whether `/business` is added to `generate-seo-files.mjs`'s sitemap, and a defense-in-depth `noindex` fallback on `BusinessLandingPage` when it's `false`. Keep both flags in sync when actually launching.

### isTest accounts and the purge script

An admin can mark any `BusinessAccount.isTest = true` (toggle in `B2BAccountsTab`'s detail drawer, or `PUT /api/b2b/admin/accounts/:id { isTest }`) to exercise the full order → invoice → payment → credit-note flow against real (e.g. Atlas) infrastructure without polluting real numbers:

- Test accounts get their own document-numbering series — `utils/b2bNumbering.js` prefixes order/invoice/credit-note numbers `TST-O-`/`TST/`/`TSC/` instead of the real `B2B-`/`NCB/`/`NCC/`, backed by separate `_test`-suffixed `Counter` documents, so a burst of test invoices never consumes a real sequence number.
- `b2bAdminSummaryController.getSummary` and `utils/turnover.js`'s wholesale turnover both explicitly exclude `isTest: true` accounts from outstanding, aging, and FY-turnover totals (`BusinessAccount.find({..., isTest: {$ne: true}})` / `{$nin: testAccountIds}`).
- `B2BStatusBadge` renders a purple "TEST" chip next to the status pill wherever it's used; `B2BOrdersTab`/`B2BLedgerTab` show the same chip on orders/invoices belonging to a test account.
- `server/scripts/purgeB2BTestData.js` (`npm run b2b:purge-test` / `-- --confirm`) is the **only** sanctioned exception to the append-only-ledger / immutable-invoice rules below — and only for `isTest` data. Dry-run by default (prints exactly what would be deleted, deletes nothing); `--confirm` deletes every `B2BOrder`/`Invoice`/`CreditNote`/`LedgerEntry` belonging to an `isTest` account, the accounts themselves, and their `_test` `Counter`s. Never touches non-test `BusinessAccount`s, `PriceTier`, `WholesaleCatalogItem`, `Users`, `Products`, or retail `Order`s. Uses plain `deleteMany` (no transaction needed), so — unlike invoice issuance below — it works fine against a standalone (non-replica-set) local `MONGO_URI`.

### Data model (`server/models/`)

| Model | Purpose |
| --- | --- |
| `BusinessAccount.js` | One per `User` (1:1, unique `user`). Application + approval workflow (`status`: pending/approved/rejected/suspended), `tier`, `paymentTerms`, `creditLimit`, billing + shipping addresses, `isTest`. `gstin` is unique+sparse — callers must omit/unset the key rather than assign `null` (a stored `null` would defeat the sparse index — see trap below). |
| `PriceTier.js` | Named discount tiers (e.g. STANDARD, DISTRIBUTOR) — a flat `discountPercent` off `WholesaleCatalogItem.basePricePerUnit`, exactly one `isDefault: true` at a time (`utils/b2bTiers.js` enforces this). No tiers are seeded — created through the admin UI. |
| `WholesaleCatalogItem.js` | The **only** place a B2B price ever lives (never on `Product`) — `product` + `size` (unique pair, matching one of `product.sizes[].weight` or `product.weight`), `unitsPerCase`, `moqCases`, `basePricePerUnit`, optional per-tier `tierOverrides[]`, `hsnCode` (stored for a possible future GST mode, never displayed today). |
| `B2BOrder.js` | Deliberately separate from retail `Order` — different fields (cases, dispatch/LR, credit hold, invoice link) and a different status workflow. Items/billing/shipping are snapshots taken at placement time, never re-read live later. |
| `Invoice.js` | **Immutable** once created — every field (seller config, buyer, lines, totals, tax mode) is a point-in-time snapshot, so a past invoice reads correctly even after the seller later registers for GST. Corrections happen only through a `CreditNote`, never an edit. |
| `CreditNote.js` | v1 = full-cancellation only (one per invoice, unique `invoice` index) — no partial credit notes. Same immutable-snapshot principle as `Invoice`. |
| `LedgerEntry.js` | **Append-only** — no update/delete route exists anywhere except the purge script above. A business's outstanding balance is always `sum(debit) - sum(credit)` over these, never a stored running total, so it can never drift. `type`: opening_balance / invoice / payment / credit_note / adjustment. |
| `Counter.js` | Shared atomic-increment backer for every sequential document number (`findOneAndUpdate({_id}, {$inc:{seq:1}}, {upsert:true, new:true, session})` — proven gapless/unique under 20 concurrent issuances in `tests/b2bInvoicing.test.js`). One counter document per series, e.g. `invoice:26-27` / `invoice:26-27_test`. |

`User.js` gained exactly one thing for B2B: `GET /api/auth/me`'s safe-user object now includes the caller's `business` status summary (read by `B2BContext` to keep the cached `AuthContext` user in sync — see Frontend below).

### Server-side logic (`server/utils/`)

| File | Responsibility |
| --- | --- |
| `money.js` | `round2`, `roundToRupee` (rupee round-off with a signed adjustment line), `amountInWordsINR` (Indian lakh/crore numbering). Every B2B rupee amount goes through this — never rounded inline. |
| `taxMode.js` | Single place every B2B code path asks "what does tax look like right now." Only `unregistered` is implemented; an unsupported `SELLER_GST_MODE` throws at `require` time (server boot), not at first order. `documentTitle('invoice'|'credit_note')` → plain "Invoice"/"Credit Note" (never "Tax Invoice"). `computeLineTax` → always `{taxAmount: 0}` today. `supplierTaxNote()` → the sanctioned disclosure string. |
| `gstin.js` | GSTIN format + checksum validation — used only to validate a **buyer's** optional GSTIN and pre-fill their state; has no tax effect while unregistered. |
| `indianStates.js` | The published GST state/UT code table (2-digit prefixes). |
| `financialYear.js` | IST (UTC+5:30, no DST) financial-year math — `getFinancialYear`, `getFinancialYearRange`, `formatDocNumber` (asserts ≤16 chars). Computed in IST explicitly because Render runs in UTC and a naive calculation would misfile the last ~5.5h of each IST day. |
| `b2bRegion.js` | Delivery-state allowlist (`isAllowedDeliveryState`, `getAllowedStateNames`) — see "Delivery region" below. |
| `b2bPricing.js` | `priceB2BOrder` — the single source of truth for quote/place/admin-edit totals (MOQ, min order value, delivery-state, stock, tier price resolution). Client-sent prices/totals are never trusted; always re-derived here. |
| `b2bCredit.js` | `getOutstanding` (derived from `LedgerEntry`), `getOpenOrderValue`, `getOverdueSummary` (FIFO credit allocation across unpaid invoices), `getCreditSummary`, `shouldHold` (prepaid never holds at placement — checked at dispatch instead). |
| `b2bOrderStatus.js` | The order state machine as a pure transition graph (`placed → confirmed → packed → dispatched → delivered`, plus `cancelled`/`rejected` branches) — see below. |
| `b2bTiers.js` | `enforceSingleDefaultTier`, `isTierInUse` (blocks hard-delete of a tier still referenced by an account or catalog override). |
| `b2bNumbering.js` | `nextB2BOrderNumber`, `nextInvoiceNumber`, `nextCreditNoteNumber` — real vs. `_test` series selection baked in here (see isTest above). |
| `b2bInvoicing.js` | `issueInvoiceForOrder` — the transactional invoice-issuance core (see below). |
| `b2bCreditNote.js` | `applyCreditNoteToInvoice` (session-agnostic core, callable inside an already-open transaction) + `issueCreditNoteForInvoice` (standalone, own transaction). |
| `b2bStatement.js` | `buildStatement` (opening balance + running-balance entries + closing balance for a date range) + `statementToCsv` — shared by both the business-facing and admin ledger endpoints. |
| `turnover.js` | `getFinancialYearTurnover` — read-only retail + wholesale FY revenue vs. `GST_REGISTRATION_THRESHOLD`, `isTest` accounts excluded from the wholesale figure. |

### Tax mode and the "no GST" rule

While `SELLER_GST_MODE=unregistered` (the only implemented mode), **no GST wording, percentage, or column may appear anywhere in B2B UI, email, CSV, or PDF** — enforced by routing every tax-facing string through `utils/taxMode.js` rather than hardcoding it. The sanctioned exceptions, all deliberate: the buyer's own optional GSTIN capture field (record-keeping only, no tax effect); `WholesaleCatalogItem.hsnCode` (admin-only, stored for a possible future GST mode, never rendered to a buyer); the supplier's own disclosure line on every invoice/credit-note PDF and the public `/business` FAQ ("Supplier not registered under GST. GST not charged."); and the admin-only FY-turnover-vs-threshold watch (`B2BLedgerTab`, `DashboardTab`'s `GstThresholdPanel`), which is explicitly *about* the GST registration threshold and needs to say so. A full-codebase grep for `GST|HSN|tax|incl|excl` across every B2B client file, `emailService.js`, the PDF service, and the CSV exporter turned up nothing outside this list (verified in Phase 5).

Phase 6 (not built, only when explicitly asked): `SELLER_GST_MODE=regular` — per-item GST rate, CGST+SGST vs IGST by place of supply, "Tax Invoice" title, seller GSTIN + HSN columns/summary on PDFs, tax-exclusive pricing option, widened `B2B_ALLOWED_STATE_CODES`. Existing unregistered-mode invoices must remain unchanged (they're immutable snapshots) — a mode change only affects invoices issued after the switch.

### Delivery region restriction

B2B orders (quote, placement, and admin quantity-edits) are restricted to `B2B_ALLOWED_STATE_CODES` (default `27` = Maharashtra only) via `utils/b2bRegion.js`'s `isAllowedDeliveryState(shippingAddress.stateCode)`, checked inside `b2bPricing.priceB2BOrder` — not just in the UI. Rationale: while unregistered, inter-state supply of goods generally requires GST registration, so cross-state B2B shipping is deliberately out of scope until Phase 6. Retail checkout is unaffected — it has no such restriction.

### Order state machine (`utils/b2bOrderStatus.js`)

```text
placed -> confirmed -> packed -> dispatched -> delivered
placed -> rejected
placed/confirmed/packed -> cancelled
```

Pure allowed/forbidden transition graph, DB-free and unit-tested in isolation; all side effects (credit-hold blocking on `confirmed`, auto-invoice-on-`dispatched`, credit-note-on-`cancelled`-after-invoicing) live in `b2bAdminOrderController.updateOrderStatus`, which consults the graph before doing anything else. `rejected`/`cancelled` require a `reason` string (`REASON_REQUIRED_FOR`). Cancelling from `confirmed`/`packed` when the order already has an invoice (`CANCEL_REQUIRES_CREDIT_NOTE_IF_INVOICED`) runs the credit-note creation and the order-status change as **one transaction**, not two separate writes.

### Invoicing, credit notes, and the ledger

- **Auto-issuance on dispatch**: `updateOrderStatus`'s `dispatched` branch calls `issueInvoiceForOrder` if the order has no invoice yet. For a **prepaid** account whose outstanding balance would still be > 0 after this invoice, this is blocked (`400 { requiresForce: true, message }`) unless the request includes `force: true` — the admin UI (`B2BOrdersTab`) shows a native `window.confirm()` with the server's message and retries with `force: true` on accept, matching this codebase's existing `window.confirm` convention (`AdminPage`, `OrdersTab`, `B2BCatalogTab`, `B2BProfilePage`). Non-prepaid (net7/15/30) accounts never need force — credit terms are expected to carry an outstanding balance.
- **Manual issuance**: `POST /api/b2b/admin/orders/:id/invoice` — any status from `confirmed` onward, one invoice per order (enforced by `Invoice.order`'s unique index).
- **`issueInvoiceForOrder`** (`utils/b2bInvoicing.js`) runs inside `mongoose.startSession().withTransaction(...)`: loads the order, throws if already invoiced or not yet `confirmed`/`packed`/`dispatched`, allocates the next invoice number (real or `_test` series), snapshots seller+buyer+lines+totals+`amountInWords`+`dueDate` (term days by `paymentTerms`), creates the `Invoice`, writes one `LedgerEntry` (`type: 'invoice'`, `debit: payable`), and links `order.invoice`. Throws loudly (500) if `businessConfig.seller.legalName` or `.fssaiLicenseNo` is blank (`REQUIRED_FOR_INVOICING` in `config/business.js`) — the rest of the portal works fine without seller details filled in; only actual invoice issuance enforces them.
- **Credit notes** (`utils/b2bCreditNote.js`): full-cancellation only, amount always equals the invoice's `totals.payable` regardless of payments already received against it (so a credit note after a partial payment correctly leaves the account with a **credit** balance, not zero). Writes one `LedgerEntry` (`type: 'credit_note'`, `credit: payable`), flips `invoice.status` to `cancelled`. A second credit-note attempt on an already-cancelled invoice is rejected (`400`).
- **Ledger writes** (admin only, `b2bAdminLedgerController.js`): `recordPayment` (amount, method, optional reference/date/note), `recordAdjustment` (debit or credit, note required), `recordOpeningBalance` (once only, before any other entry exists for that account — enforced with a plain existence check, not a transaction, since there's no concurrent-write race worth guarding here).
- **Why transactions matter here, and the local-dev caveat**: invoice issuance and credit-note issuance each touch 2–3 documents (the doc itself, a `LedgerEntry`, and the source order/invoice status) that must commit atomically. `mongoose.startSession()/withTransaction()` requires a MongoDB **replica set** — this app's own local dev `MONGO_URI` (`mongodb://127.0.0.1:27017/...`) is a plain **standalone** instance with no transaction support, deliberately left unchanged (not this codebase's decision to make). See Testing strategy below for how this is worked around for both automated tests and manual local verification.

### PDF generation (`services/invoicePdfService.js`, `pdfkit`)

`renderInvoicePdf(invoice, extra)` / `renderCreditNotePdf(creditNote, invoice)` render purely from the stored immutable snapshot — never re-read live catalog/account data. No GST/HSN columns anywhere; the FSSAI number is prominent; the supplier's not-registered-under-GST note is always printed in the footer; `documentTitle` is `.toUpperCase()`'d at render time. Logo loaded from `client/public/images/logo.png` if present, text-only header otherwise.

**Testing note**: pdfkit embeds/subsets even the standard 14 fonts, so a rendered PDF's text is never recoverable as literal ASCII from the raw byte stream (confirmed directly — stream compression was not the obstacle). `tests/b2bInvoicing.test.js` therefore asserts correctness against the `Invoice`/`CreditNote` document's stored fields (this file's actual data source) plus a render-succeeds smoke test on byte length/content-type, and the visual layout was additionally confirmed by hand (generate a real sample PDF, read it with a PDF-capable tool).

### Turnover watch (`utils/turnover.js`, read-only)

Informational only — never changes retail or B2B behavior. `getFinancialYearTurnover(fy)` sums retail `Order` revenue (COD delivered + ONLINE paid, non-cancelled) and wholesale `Invoice.totals.payable` minus `CreditNote.totals.payable` (both excluding `isTest` accounts) for the given FY, against `GST_REGISTRATION_THRESHOLD`. Surfaced in two places: `B2BLedgerTab` (admin B2B tab) and a compact `GstThresholdPanel` on the retail `DashboardTab` (so it's visible without navigating into the B2B section — GST liability applies to the whole business, not just wholesale) — the latter fetches its own data independently and fails silently (renders nothing) if the summary endpoint errors, so it can never break the rest of the retail dashboard.

### API routes

`/api/b2b/*` — business-facing. `router.use(protect, userActionLimiter, requireB2BEnabled)` except `GET /config` (public, `publicLimiter`).

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/config` | Public. `{ enabled, allowedStateCodes, allowedStateNames, minOrderValue, taxNote }`. |
| GET | `/me` | Own `BusinessAccount` (or `null`) + `creditSummary` if approved. |
| POST | `/apply` | Create/re-apply (only while no account or `status: rejected`; `409` otherwise). |
| PUT | `/me` | Update own profile/shipping addresses; `businessName`/`gstin`/`billingAddress` locked once out of `pending`. |
| GET | `/catalog` | `loadBusiness, requireApprovedBusiness`. Tier-priced catalog for the caller. |
| POST | `/orders/quote` | `requireApprovedBusiness`, extra `b2bQuoteLimiter`. Server-priced preview, never charges. |
| POST | `/orders` | `requireApprovedBusiness`. Places the order (`status: placed`). |
| GET | `/orders`, `/orders/:id` | `loadBusiness` only (any status) — own orders, newest first / by id. |
| POST | `/orders/:id/cancel` | Only while `status: placed`; `reason` required. |
| GET | `/invoices`, `/invoices/:id`, `/invoices/:id/pdf` | Own invoices (scoped to `req.business._id` — structurally IDOR-safe, no route takes an arbitrary business id). |
| GET | `/credit-notes/:id/pdf` | Own credit notes. |
| GET | `/ledger`, `/ledger/export.csv` | `?from&to` (ISO dates) — own statement / CSV. |

`/api/b2b/admin/*` — admin-only. `router.use(protect, userActionLimiter, admin)`, not gated by `B2B_ENABLED`.

| Method | Path | Notes |
| --- | --- | --- |
| GET/POST | `/accounts`, `/accounts/:id` | List (status/search/paginated), create-for-existing-user (`409` friendly duplicate response), detail. |
| PUT | `/accounts/:id` | Includes `isTest` toggle. |
| POST | `/accounts/:id/approve\|reject\|suspend\|reactivate` | Approve requires `tier`+`paymentTerms`; reject/suspend take a note/reason. |
| GET/POST/PUT/DELETE | `/tiers`, `/tiers/:id` | Price tier CRUD. Delete blocked if in use (`b2bTiers.isTierInUse`). |
| GET/POST/PUT/DELETE | `/catalog`, `/catalog/:id` | Catalog item CRUD. Delete blocked if the item was ever ordered. |
| GET | `/orders`, `/orders/:id` | List (status/business/date/paginated) / detail (any business). |
| PUT | `/orders/:id/items` | Only while `placed`; re-prices server-side; `reason` required; logged to `order.editHistory`. |
| POST | `/orders/:id/status` | Body `{status, note, reason, dispatch, force}` — the state-machine + auto-invoice + credit-note-on-cancel logic. |
| POST | `/orders/:id/override-credit-hold` | Clears `creditHold`, logs who/when/why. |
| POST | `/orders/:id/invoice` | Manual invoice issuance. |
| GET | `/invoices`, `/invoices/:id/pdf` | `?business&from&to` filter. |
| POST | `/invoices/:id/credit-note` | `reason` required. |
| GET | `/credit-notes/:id/pdf` | |
| GET | `/accounts/:id/ledger`, `/accounts/:id/ledger/export.csv` | `?from&to` — any account's statement / CSV. |
| POST | `/accounts/:id/payments\|adjustments\|opening-balance` | Ledger writes — see above. |
| GET | `/summary` | Pending applications, orders-by-status, total outstanding + aging buckets + top outstanding accounts (all `isTest`-excluded), FY turnover, `testAccountCount`. |

### Frontend

- **Pages** (`client/src/pages/business/`): `BusinessLandingPage` (public, indexable), `BusinessApplyPage`, `B2BDashboardPage` (status gate + credit summary + recent orders), `B2BQuickOrderPage` (grouped catalog, 400ms-debounced live quote, mobile sticky summary bar, `nc_b2b_draft_<userId>` localStorage draft), `B2BOrdersPage`/`B2BOrderDetailPage` (status timeline, cancel, reorder-via-draft, invoice PDF download), `B2BInvoicesPage`, `B2BStatementPage` (date-range filter, CSV export), `B2BProfilePage`.
- **Shared components** (`client/src/components/b2b/`): `B2BLayout` (sub-nav — pill bar on mobile, sidebar on desktop), `B2BModal` (bottom-sheet on mobile / centered on desktop, used by every B2B/admin-B2B modal), `B2BStatusBadge` (status pill + optional TEST chip), `B2BFeatureGate`, `CaseStepper` (deliberately separate from retail `QuantityStepper` — cases, not units).
- **Context**: `B2BContext`/`B2BProvider` (`client/src/context/B2BContext.jsx`) — mounted only inside the `/b2b` route tree (not the global provider chain), holds `business`/`creditSummary`/`config`/`loading` for every `/b2b/*` page so each page doesn't refetch `GET /me` independently; syncs the cached `AuthContext` user's business status via its existing `saveUser()` (never edits `AuthContext.jsx` itself) when the live status differs.
- **Admin tabs** (`client/src/components/admin/`): `B2BAccountsTab`, `B2BCatalogTab` (tiers + wholesale catalog items), `B2BOrdersTab` (status actions, dispatch-with-force confirm, issue-invoice), `B2BLedgerTab` (FY-turnover-vs-threshold card, aging buckets, top-outstanding shortcut, account search/statement, payment/adjustment/opening-balance modals, invoice list + credit-note issuance), `B2BDisabledNotice`. Wired into `adminConstants.js` (`TABS`, `group: 'b2b'`), `AdminNav.jsx` (separate "Wholesale" section), `AdminPage.jsx` (tab render switch).
- **`downloadBlobResponse`** (`client/src/utils/downloadBlob.js`): every PDF/CSV download goes through the shared `api` axios instance with `responseType: 'blob'` (carries the JWT via its request interceptor) and this helper turns the blob into a temporary object URL to trigger the browser save — a plain `<a href="/api/...">` **cannot** authenticate, since the token lives in `localStorage`, not a cookie.
- **`api.js`**: `b2bAPI` (business-facing) and `b2bAdminAPI` (admin) — full method lists mirror the route tables above 1:1.

### Testing strategy

`server/tests/b2b*.test.js` + `taxMode.test.js`/`gstin.test.js`/`financialYear.test.js`/`money.test.js`/`business.middleware.test.js` — all plain `node:test` (`node --test` / `npm test`), no new test dependency except where noted. Most run against the app's real `MONGO_URI` (fine — they don't need transactions). The **one** exception: `tests/b2bInvoicing.test.js` (invoice issuance, dispatch-triggered auto-invoice, credit notes, payments, statement math, 20-concurrent-invoice-numbering) needs real multi-document transactions, which the local standalone `MONGO_URI` can't provide (see above) — it spins up an isolated, disposable single-node replica set via `tests/helpers/memoryReplSet.js` (`mongodb-memory-server`, the only new devDependency besides `pdfkit`) instead of connecting to the app's real database. `startReplSet()`/`stopReplSet()` in `before`/`after`. This pattern is also the correct way to manually verify transactional B2B flows against a local dev server without a real MongoDB replica set — point a throwaway `server.js` process's `MONGO_URI` at a `MongoMemoryReplSet.create(...)` instance instead of the real local Mongo.

**`node:test` gotcha**: `beforeEach`/`afterEach` apply to the entire file's implicit top-level suite regardless of where they're declared in the file — not scoped only to tests declared after them. Give hooks/fixtures added mid-file their own dedicated users/data rather than assuming isolation from earlier tests, and wrap test bodies in `try/finally` for cleanup so one failed assertion can't skip cleanup and poison a later test.

### Environment variables

Server (`.env`, see `.env.example` for the full annotated template):

```dotenv
B2B_ENABLED=false                      # master switch — see Feature switch above
SELLER_GST_MODE=unregistered           # only supported value today
SELLER_LEGAL_NAME=                     # required before invoices can be issued (REQUIRED_FOR_INVOICING)
SELLER_TRADE_NAME=Namdev Chiwda
SELLER_FSSAI_LICENSE=                  # required before invoices can be issued
SELLER_ADDRESS_LINE1=
SELLER_ADDRESS_LINE2=
SELLER_CITY=Solapur
SELLER_STATE_CODE=27
SELLER_PINCODE=
SELLER_PHONE=
SELLER_EMAIL=care@namdevchiwda.com
SELLER_BANK_NAME=                      # bank block is optional — invoice just omits the payment-details footer if blank
SELLER_BANK_ACCOUNT_NAME=
SELLER_BANK_ACCOUNT_NO=
SELLER_BANK_IFSC=
SELLER_UPI_ID=
B2B_ALLOWED_STATE_CODES=27             # comma-separated 2-digit GST state codes
B2B_MIN_ORDER_VALUE=5000
B2B_ADMIN_NOTIFY_EMAIL=care@namdevchiwda.com
GST_REGISTRATION_THRESHOLD=4000000
RATE_LIMIT_IP_B2B_QUOTE_WINDOW_MS=60000  # extra per-user limiter on POST /orders/quote, on top of Tier 3
RATE_LIMIT_IP_B2B_QUOTE_MAX=120
```

Client (`.env`):

```dotenv
VITE_B2B_ENABLED=false   # build-time only — sitemap inclusion + BusinessLandingPage noindex fallback (see Feature switch above)
```

### B2B-specific traps and gotchas

28. `BusinessAccount.gstin` must never be assigned `null` — a sparse unique index only excludes genuinely-*absent* keys, not present-with-`null` ones. Every controller write path omits/unsets the key instead (`gstin: gstin || undefined`, or leaving it out of the payload entirely). Applies to any future sparse-unique field added to this or any model.
29. Name fields across this app (`authValidators`'s `/^[\p{L}\p{M}\s.'-]+$/u`) reject digits — a test fixture or seed name like "Phase 3 Admin" fails validation; spell numbers out ("Phase Three Admin") in test data.
30. `mongoose.startSession()/withTransaction()` will throw "Transaction numbers are only allowed on a replica set member or mongos" against this app's real local dev `MONGO_URI` (a standalone instance) — this is expected, not a bug in the transactional invoice/credit-note code; see Testing strategy above for the workaround.
31. A rendered invoice/credit-note PDF's text is not recoverable as literal ASCII from the raw byte stream (pdfkit embeds/subsets fonts regardless of compression) — don't reach for text-extraction assertions in new PDF tests; assert against the source document's stored fields instead.
