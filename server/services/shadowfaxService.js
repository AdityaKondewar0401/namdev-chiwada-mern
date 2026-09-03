// server/services/shadowfaxService.js
//
// Shadowfax Unified API client — Forward Operations, Warehouse - Order
// Creation model (we ship from our own warehouse, not a marketplace).
//
// Uses native `fetch` (Node 24, same convention as
// server/config/email.js / Resend) instead of adding axios as a new server
// dependency purely for this integration.
//
// Every exported function throws a `ShadowfaxApiError` on failure so
// callers can decide what to do (retry, surface to admin, don't block the
// order, etc.) — this module never swallows errors silently.
//
// Endpoints implemented (see sfxunifiedapi.apib):
//   - Unified Pincode Serviceability   (GET  /v1/clients/serviceability/)
//   - Warehouse - Order Creation       (POST /v3/clients/orders/)
//   - Single Order Details V4         (GET  /v4/clients/orders/{awb}/track/)
//   - Multiple Order Details V4       (POST /v4/clients/bulk_track/)
//   - Update Order Data               (POST /v3/clients/order_update/)
//   - Order Cancellation              (POST /v3/clients/orders/cancel/)
//   - Escalation API                  (POST /v1/clients/support/issue/)
//   - Get POD Details                 (POST /v1/clients/pod_details/)

const { getShadowfaxConfig } = require('../config/shadowfax');
const { calcTotalWeightGrams } = require('../utils/weight');

class ShadowfaxApiError extends Error {
  constructor(message, { status, body } = {}) {
    super(message);
    this.name = 'ShadowfaxApiError';
    this.status = status;
    this.body = body;
  }
}

// ── Order status mapping ──────────────────────────────────────────────
// Maps Shadowfax's warehouse-model `status_id` values (see the "Order
// States" / "warehouse order states" table in the API doc, and the
// "Warehouse order states for PUSH Api" table for the webhook) onto our
// own Order.status enum: pending | confirmed | processing | shipped |
// delivered | cancelled.
//
// Anything not explicitly listed keeps the order's current internal
// status untouched (see applyShadowfaxStatusToOrder in orderController) —
// we never want an unrecognized/future Shadowfax status to silently
// regress an order.
const STATUS_MAP = {
  new: 'confirmed',
  received_from_client_warehouse: 'confirmed',
  item_manifested: 'processing',
  bag_in_transit: 'processing',
  bag_received_at_via: 'processing',
  bag_received: 'processing',
  recd_at_fwd_dc: 'processing',
  recd_at_fwd_hub: 'processing',
  assigned_for_delivery: 'shipped',
  ofd: 'shipped',
  cid: 'shipped',
  nc: 'shipped',
  na: 'shipped',
  reopen_ndr: 'shipped',
  on_hold: 'processing',
  pincode_updated: 'processing',
  item_misrouted: 'processing',
  delivered: 'delivered',
  cancelled_by_customer: 'cancelled',
  lost: 'cancelled',
  rto: 'cancelled',
  rto_in_process: 'cancelled',
  rto_d: 'cancelled',
  rto_nd: 'cancelled',
};

function mapShadowfaxStatusToOrderStatus(statusId) {
  return STATUS_MAP[statusId] || null;
}

// ── Low-level request helper ───────────────────────────────────────────
async function sfxFetch(path, { method = 'GET', body, query } = {}) {
  const { baseUrl, authToken } = getShadowfaxConfig();

  if (!authToken) {
    throw new ShadowfaxApiError(
      'SHADOWFAX_AUTH_TOKEN is not set — cannot call the Shadowfax API.'
    );
  }

  let url = `${baseUrl}${path}`;
  if (query && Object.keys(query).length) {
    const qs = new URLSearchParams(
      Object.entries(query).filter(([, v]) => v !== undefined && v !== null)
    ).toString();
    url += `?${qs}`;
  }

  let res;
  try {
    res = await fetch(url, {
      method,
      headers: {
        Authorization: `Token ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (networkErr) {
    throw new ShadowfaxApiError(`Shadowfax request failed: ${networkErr.message}`);
  }

  let data;
  const text = await res.text();
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    throw new ShadowfaxApiError(
      data?.message || data?.errors || `Shadowfax API error (${res.status})`,
      { status: res.status, body: data }
    );
  }

  return data;
}

// ── 1. Unified Pincode Serviceability ──────────────────────────────────
/**
 * Checks whether a delivery pincode is serviceable by Shadowfax.
 * `service` defaults to "customer_delivery" (forward delivery to the end
 * customer) — the one relevant service for checkout-time validation.
 *
 * Returns { serviceable: boolean, services: string[] }.
 */
async function checkPincodeServiceability(pincode, service = 'customer_delivery') {
  const data = await sfxFetch('/v1/clients/serviceability/', {
    method: 'GET',
    query: { service, page: 1, count: 10, pincodes: pincode },
  });

  const list = Array.isArray(data) ? data : [];
  const match = list.find((entry) => String(entry.code) === String(pincode));

  return {
    serviceable: Boolean(match),
    services: match?.services || [],
  };
}

// ── 2. Warehouse - Order Creation ──────────────────────────────────────
/**
 * Creates a forward delivery request against Shadowfax's warehouse model
 * and returns { awbNumber, shadowfaxOrderId, status, statusDisplay, raw }.
 *
 * @param {Object} order  Mongoose Order document (or plain object) with
 *   `_id`, `items`, `shippingAddress`, `subtotal`, `total`, `paymentMethod`.
 */
async function createWarehouseOrder(order) {
  const cfg = getShadowfaxConfig();
  const addr = order.shippingAddress || {};

  const customerName = addr.fullName || addr.name || 'Customer';
  const customerPhone = String(addr.phone || '').replace(/\D/g, '');
  const addressLine1 = addr.line1 || addr.street || '';
  const pincode = Number(addr.pincode || addr.zip);

  const actualWeightGrams = calcTotalWeightGrams(order.items, cfg.defaultItemWeightGrams);
  const isCod = (order.paymentMethod || 'COD').toUpperCase() === 'COD';

  const payload = {
    order_type: 'warehouse',
    order_details: {
      client_order_id: String(order._id),
      actual_weight: actualWeightGrams,
      volumetric_weight: actualWeightGrams,
      product_value: order.subtotal,
      payment_mode: isCod ? 'COD' : 'Prepaid',
      cod_amount: isCod ? order.total : 0,
      total_amount: order.total,
      order_service: 'regular',
      ...(cfg.gstinNumber ? { gstin_number: cfg.gstinNumber } : {}),
    },
    customer_details: {
      name: customerName,
      contact: customerPhone,
      address_line_1: addressLine1,
      address_line_2: addr.line2 || '',
      city: addr.city || '',
      state: addr.state || '',
      pincode,
      location_type: 'residential',
    },
    pickup_details: { ...cfg.pickup },
    rto_details: { ...cfg.rto },
    product_details: (order.items || []).map((item) => ({
      sku_name: item.name,
      price: item.price,
      category: 'snacks-namkeen',
      additional_details: {
        quantity: item.qty,
      },
    })),
  };

  const data = await sfxFetch('/v3/clients/orders/', { method: 'POST', body: payload });

  if (data.message === 'Failure') {
    throw new ShadowfaxApiError(
      typeof data.errors === 'string' ? data.errors : JSON.stringify(data.errors),
      { body: data }
    );
  }

  const d = data.data || {};
  return {
    awbNumber: d.awb_number,
    shadowfaxOrderId: d.id ? String(d.id) : undefined,
    status: d.status,
    statusDisplay: d.status_display,
    raw: data,
  };
}

// ── 3. Single Order Details (V4) ───────────────────────────────────────
async function trackOrder(awbNumber) {
  const data = await sfxFetch(`/v4/clients/orders/${encodeURIComponent(awbNumber)}/track/`);
  return {
    order: data.order_details,
    history: data.tracking_details || [],
    trackingUrl: data.order_details?.customer_track_url,
  };
}

// ── 4. Multiple Order Details (V4) ─────────────────────────────────────
async function trackMultipleOrders(awbNumbers) {
  const data = await sfxFetch('/v4/clients/bulk_track/', {
    method: 'POST',
    body: { awb_numbers: awbNumbers },
  });
  return data.data || [];
}

// ── 5. Update Order Data ───────────────────────────────────────────────
/**
 * Partial update of a placed Shadowfax order. Pass only the sections you
 * want to change (delivery_details / pickup_details / return_details /
 * order_details / status_update) — see the API doc for field-level update
 * rules (e.g. delivery_details can only be edited before OFD).
 */
async function updateOrderData(awbNumber, updates = {}) {
  return sfxFetch('/v3/clients/order_update/', {
    method: 'POST',
    body: { awb_number: awbNumber, ...updates },
  });
}

// ── 6. Order Cancellation ──────────────────────────────────────────────
/**
 * Cancels a Shadowfax order by AWB number (or client_order_id).
 * Returns { responseMsg, responseCode }. A responseCode of 200 means
 * cancelled immediately; 304 means queued for cancellation (still in
 * transit at time of request) — both are "success" outcomes from our
 * side, only "Order cannot be cancelled. Invalid state." (400, already
 * delivered) is a real failure.
 */
async function cancelOrder(requestId, cancelRemarks = 'Cancelled by customer/admin') {
  return sfxFetch('/v3/clients/orders/cancel/', {
    method: 'POST',
    body: { request_id: requestId, cancel_remarks: cancelRemarks },
  });
}

// ── 7. Escalation API ──────────────────────────────────────────────────
// Issue category codes per the API doc:
//   1 Delayed Delivery, 2 Expedite Pickup - Customer,
//   3 Expedite Pickup - Seller, 4 Status Mismatch, 5 Delivery Dispute
async function raiseEscalation(awbNumber, issueCategory) {
  return sfxFetch('/v1/clients/support/issue/', {
    method: 'POST',
    body: { awb_number: awbNumber, issue_category: issueCategory },
  });
}

// ── 8. Get POD Details ──────────────────────────────────────────────────
async function getPodDetails(awbNumbers) {
  const data = await sfxFetch('/v1/clients/pod_details/', {
    method: 'POST',
    body: { awb_numbers: awbNumbers },
  });
  return data.pod_details || {};
}

module.exports = {
  ShadowfaxApiError,
  STATUS_MAP,
  mapShadowfaxStatusToOrderStatus,
  checkPincodeServiceability,
  createWarehouseOrder,
  trackOrder,
  trackMultipleOrders,
  updateOrderData,
  cancelOrder,
  raiseEscalation,
  getPodDetails,
};
