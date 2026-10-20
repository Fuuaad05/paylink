# API and storefront integration

All state-changing routes require a same-origin browser request when an Origin header is supplied. Protected endpoints require `Authorization: Bearer <Supabase access token>` obtained from wallet sign-in. No service key belongs in a browser.

- `GET /api/health`: non-sensitive configuration readiness.
- `GET /api/products?id=<uuid>`: public title, description, price and recipient. Never returns file paths.
- `GET /api/products`: signed-in seller's products.
- `POST /api/products`: publish `{title,description,price,storagePath}` after an authenticated upload into the seller's own private bucket folder. Recipient comes from verified auth identity.
- `GET /api/orders`: signed-in buyer's orders.
- `POST /api/orders`: `{productId}`. Reuses the order for this buyer/product pair.
- `POST /api/pay`: `{orderId}`. Returns HTTP 402 + PAYMENT-REQUIRED. Resend with the SDK-generated PAYMENT-SIGNATURE header. Requires the same authenticated buyer session; this is not an anonymous general-purpose paid API.
- `POST /api/orders/reconcile`: `{orderId,txHash?}`. Validates the existing settlement and payment signature, and marks it paid after 3 confirmations. No replacement authorization is signed.
- `POST /api/download`: `{orderId}`. Requires a paid order belonging to the current authenticated user; returns a 60-second signed download URL.

## Add a checkout button to another site

Publish a product and copy its URL. Set it as the `href` in `examples/storefront.html`. Checkout and wallet sign-in take place on PayLink's origin; this example does not share sessions or secrets across origins.

The application has no webhook delivery or merchant API-key SDK yet. Those are planned extensions, not current features.

- `GET /api/sales?page=0`: authenticated seller-only confirmed sales, exact revenue total, counts and 25-row pagination. Seller identity comes exclusively from server-verified authentication. No database migration is required.

## Product presentation

`GET /api/products` now returns `cover_url`, `file_type` and `file_size`. Private product paths remain server-only. Covers are intentionally public.

`POST /api/products` accepts an optional `coverPath`. Type and size are read from stored objects, not trusted from the browser.

`PATCH /api/products` accepts `{productId, coverPath?}` for the authenticated owner. It attaches an optional cover and refreshes file metadata for an existing product. It does not alter the product price or purchased file. Missing/foreign products return 404.
