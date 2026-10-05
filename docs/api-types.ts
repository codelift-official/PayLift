// ============================================================
// Billify API — TypeScript Contracts
// Auto-generated from C# DTOs. Do not edit by hand.
// Regenerate whenever DTOs change.
//
// Wire format: camelCase (System.Text.Json default)
// Dates:       ISO 8601 with offset
//              e.g. "2026-09-30T14:32:15.1234567+05:30"
// Money:       number, 2 decimals, e.g. 1200.00
// IDs (Guid):  UUID v4 string
// IDs (int):   number (TenantID only)
// ============================================================

// ---------- Enums ----------

export type PaymentMode = 'Cash' | 'UPI' | 'Card';

export type ReturnExchangeType = 'Return' | 'Exchange';

export type ShopRole = 'BusinessAdmin' | 'Manager' | 'Staff';

export type GstRate = 0 | 5 | 12 | 18;

// ---------- Common ----------

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  firstPage: number;
  lastPage: number;
  hasNext: boolean;
  hasPrev: boolean;
  isFirstPage: boolean;
  isLastPage: boolean;
}

export interface GridItem {
  id: string;
  displayID: string;
  primaryText: string;
  secondaryText: string | null;
  amount: number;
  statusBadge: string;
  createdAt: string;
  tags: string[];
}

export interface GridQuery {
  search?: string | null;
  page?: number;
  pageSize?: number;
  sortBy?: string | null;
  sortDir?: string | null;
}

export interface ErrorResponse {
  error: string;
}

export interface MessageResponse {
  message: string;
}

export interface HealthResponse {
  status: string;
  version: string;
  timestamp: string;
  db?: boolean | null;
}

// ---------- Auth ----------

export interface LoginRequest {
  tenant: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  userID: string;
  tenantID: number;
  role: string;
  /** ID of the default shop created during business setup */
  defaultShopID?: string | null;
}

export interface SendOtpRequest {
  tenant: string;
  mobile: string;
}

export interface VerifyOtpRequest {
  tenant: string;
  mobile: string;
  code: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ForgotPasswordRequest {
  tenant: string;
  email: string;
}

export interface ResetPasswordRequest {
  tenant: string;
  token: string;
  newPassword: string;
}

// ---------- Business ----------

export interface CreateBusinessRequest {
  name: string;
  slug: string;
  gst?: string | null;
  ownerEmail: string;
  ownerMobile: string;
  ownerPassword: string;
}

export interface BusinessesResponse {
  id: number;
  name: string;
  slug: string;
  gst?: string | null;
  strictBillingMode: boolean;
  isActive: boolean;
}

export interface BusinessResponse {
  userID: string;
  tenantID: number;
  slug: string;
}

// ---------- Shop ----------

export interface CreateShopRequest {
  name: string;
  address: string;
  mobile: string;
  gst?: string | null;
  logoUrl?: string | null;
  exchangePolicyDays?: number | null;
  receiptFooter?: string | null;
  printerType?: string | null;
  printerName?: string | null;
  whatsAppEnabled?: boolean | null;
  notificationEmail?: string | null;
  notificationSms?: boolean | null;
}

export interface UpdateShopRequest {
  name: string;
  address: string;
  mobile: string;
  gst?: string | null;
  logoUrl?: string | null;
  exchangePolicyDays?: number | null;
  receiptFooter?: string | null;
  printerType?: string | null;
  printerName?: string | null;
  whatsAppEnabled?: boolean | null;
  notificationEmail?: string | null;
  notificationSms?: boolean | null;
}

export interface ShopResponse {
  id: string;
  businessID: number;
  name: string;
  address: string;
  mobile: string;
  gst?: string | null;
  logoUrl?: string | null;
  exchangePolicyDays: number;
  receiptFooter?: string | null;
  printerType?: string | null;
  printerName?: string | null;
  whatsAppEnabled: boolean;
  notificationEmail?: string | null;
  notificationSms: boolean;
  createdAt: string;
  updatedAt?: string | null;
}

// ---------- User ----------

export interface UserProfileResponse {
  userID: string;
  tenantID: number;
  email?: string | null;
  mobile: string;
  role: string;
  createdAt: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// ---------- Bill ----------

export interface BillItemRequest {
  itemName: string;
  qty: number;
  price: number;
  gstRate: number;
  discountPct?: number | null;
}

export interface PaymentRequest {
  mode: PaymentMode | string;
  amount: number;
}

export interface CreateBillRequest {
  shopID: string;
  customerName?: string | null;
  customerPhone?: string | null;
  items: BillItemRequest[];
  payments?: PaymentRequest[] | null;
  negotiatedTotal?: number | null;
  couponCodes?: string[] | null;
}

export interface BillItemResponse {
  id: string;
  itemName: string;
  qty: number;
  price: number;
  discountPct: number;
  originalPrice: number;
  discountAmount: number;
  taxableAmount?: number | null;
  gstRate: number;
  gstAmount?: number | null;
  lineTotal?: number | null;
  returnedQty?: number;
}

export interface PaymentResponse {
  id: string;
  mode: string;
  amount: number;
}

export interface BillResponse {
  id: string;
  businessID: number;
  shopID: string;
  billNumber: string;
  customerName?: string | null;
  customerPhone?: string | null;
  subtotal: number;
  discount: number;
  total: number;
  negotiatedTotal?: number | null;
  isStrictModeBill: boolean;
  createdAt: string;
  createdByUserID: string;
  items: BillItemResponse[];
  payments: PaymentResponse[];
  returns?: ReturnExchangeResponse[];
}

export interface BillSummaryResponse {
  id: string;
  displayID: string;
  primaryText: string;
  secondaryText: string | null;
  amount: number;
  statusBadge: string;
  createdAt: string;
  tags: string[];
}

export interface BillQuoteItemResponse {
  itemName: string;
  qty: number;
  price: number;
  discountPct: number;
  originalPrice: number;
  discountAmount: number;
  taxableAmount?: number | null;
  gstRate: number;
  gstAmount?: number | null;
  lineTotal?: number | null;
}

export interface BillQuoteResponse {
  subtotal: number;
  discount: number;
  total: number;
  negotiatedTotal?: number | null;
  isStrictModeBill: boolean;
  items: BillQuoteItemResponse[];
}

export interface BillListQuery {
  shopID?: string | null;
  fromDate?: string | null;
  toDate?: string | null;
  search?: string | null;
  page?: number;
  pageSize?: number;
}

// ---------- Receipt ----------

export interface ReceiptItemResponse {
  itemName: string;
  qty: number;
  price: number;
  discountAmount: number;
  taxableAmount: number;
  gstRate: number;
  gstAmount: number;
  lineTotal: number;
}

export interface GstLineResponse {
  gstRate: number;
  taxableAmount: number;
  gstAmount: number;
}

export interface ReceiptPaymentResponse {
  mode: string;
  amount: number;
}

export interface ReceiptResponse {
  shopName: string;
  shopAddress: string;
  shopMobile: string;
  shopGST?: string | null;
  shopLogoUrl?: string | null;
  billNumber: string;
  billDate: string;
  billTime: string;
  isStrictMode: boolean;
  customerName?: string | null;
  customerPhone?: string | null;
  items: ReceiptItemResponse[];
  subtotal: number;
  discount: number;
  total: number;
  negotiatedTotal?: number | null;
  gstBreakup: GstLineResponse[];
  payments: ReceiptPaymentResponse[];
  exchangePolicyDays: number;
  receiptFooter?: string | null;
}

export interface ThermalReceiptResponse {
  payload: string;
  encoding: string;
  width: number;
}

export interface WhatsAppReceiptResponse {
  message: string;
  waLink: string;
}

// ---------- Return ----------

export interface ReturnItemRequest {
  itemName: string;
  qty: number;
  amount: number;
  reason?: string | null;
}

export interface CreateReturnRequest {
  items: ReturnItemRequest[];
}

export interface ReturnExchangeResponse {
  id: string;
  originalBillID: string;
  type: string;
  itemName: string;
  qty: number;
  amount: number;
  reason?: string | null;
  createdAt: string;
  createdByUserID: string;
}

export interface ReturnSummaryResponse {
  id: string;
  displayID: string;
  primaryText: string;
  secondaryText?: string | null;
  amount: number;
  statusBadge: string;
  createdAt: string;
  tags: string[];
}

export interface ReturnGridQuery {
  shopID?: string | null;
  fromDate?: string | null;
  toDate?: string | null;
  type?: string | null;
  search?: string | null;
  page?: number;
  pageSize?: number;
  sortBy?: string | null;
  sortDir?: string | null;
}

// ---------- Report ----------

export interface ReportSummaryResponse {
  fromDate: string;
  toDate: string;
  totalSales: number;
  totalBills: number;
  discounts: number;
  returns: number;
  netSales: number;
  cash: number;
  upi: number;
  card: number;
  gstCollected: number;
}

export interface ReportQuery {
  shopID?: string | null;
  fromDate?: string | null;
  toDate?: string | null;
}

// ---------- Settings ----------

export interface PrinterSettingsRequest {
  printerType?: string | null;
  printerName?: string | null;
}

export interface NotificationSettingsRequest {
  whatsAppEnabled?: boolean | null;
  notificationEmail?: string | null;
  notificationSms?: boolean | null;
}

export interface ReceiptSettingsRequest {
  exchangePolicyDays?: number | null;
  receiptFooter?: string | null;
}

// ---------- Cache ----------

export interface CacheClearResult {
  cleared: boolean;
  tenantID?: number | null;
  keysRemoved: number;
}

export interface CacheClearRequest {
  confirm: string;
}

export interface CacheStatsResponse {
  tenantKeys: number;
  gridBillsKeys: number;
  gridReturnsKeys: number;
  gridReportsKeys: number;
}

// ---------- Platform ----------

export interface PlatformLoginRequest {
  email: string;
  password: string;
}

export interface PlatformCacheClearRequest {
  confirm: string;
}

export interface PlatformAuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  platformUserID: string;
  role: string;
  email: string;
}

export interface BusinessListItem {
  tenantID: number;
  name: string;
  slug: string;
  gst?: string | null;
  isActive: boolean;
  createdAt: string;
  shopCount: number;
  userCount: number;
}

export interface BusinessDetailResponse {
  tenantID: number;
  name: string;
  slug: string;
  gst?: string | null;
  isActive: boolean;
  strictBillingMode: boolean;
  createdAt: string;
  updatedAt?: string | null;
  shopCount: number;
  userCount: number;
}

export interface PlatformMetricsResponse {
  totalBusinesses: number;
  activeBusinesses: number;
  totalShops: number;
  totalUsers: number;
}

export interface MetricsResponse {
  ramBytes: number;
  threadCount: number;
  cacheEntries: number;
  cacheSizeBytes: number;
  uptime: string;
  requestCount: number;
  dbPoolStats: string;
}

export interface AuditLogResponse {
  id: string;
  platformUserID: string;
  action: string;
  targetTenantID?: number | null;
  detailsJson?: string | null;
  ipAddress?: string | null;
  createdAt: string;
}

