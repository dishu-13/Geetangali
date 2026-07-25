"""Pydantic models (request/response schemas) for all modules."""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


# ── Auth ──────────────────────────────────────────────────────────
class LoginIn(BaseModel):
    email: str
    password: str


# ── Inventory ─────────────────────────────────────────────────────
class CheckoutIn(BaseModel):
    sku_id: str
    quantity: float
    notes: Optional[str] = ""


class ReceiveIn(BaseModel):
    sku_id: str
    quantity: float
    unit_cost: float = 0
    expiry_date: Optional[str] = None


class PurchaseInvoiceLineIn(BaseModel):
    sku_id: str
    quantity: float
    unit_cost: float
    expiry_date: Optional[str] = None


class PurchaseInvoiceIn(BaseModel):
    invoice_number: str
    vendor: str
    invoice_date: str
    lines: List[PurchaseInvoiceLineIn]
    notes: Optional[str] = ""


class SKUCreateIn(BaseModel):
    name: str
    category: str = "Uncategorized"
    unit_cost: float = 0
    unit_price: float = 0
    opening_store_qty: float = 0
    opening_floor_qty: float = 0
    opening_expiry: Optional[str] = None


class TransferIn(BaseModel):
    sku_id: str
    from_location: str  # store | floor | retail
    to_location: str    # store | floor | retail
    quantity: float
    notes: Optional[str] = ""


# ── Payouts ───────────────────────────────────────────────────────
class ConfirmPayoutIn(BaseModel):
    staff_id: str
    payout_date: str
    amount: float
    breakdown: Dict[str, Any]


# ── Config ────────────────────────────────────────────────────────
class ConfigUpdateIn(BaseModel):
    staff_daily_tiers: Optional[List[Dict[str, Any]]] = None
    video_review_bonus: Optional[float] = None
    staff_monthly_multipliers: Optional[List[Dict[str, Any]]] = None
    retail_commission_pct: Optional[float] = None
    manager_milestones: Optional[List[Dict[str, Any]]] = None
    inventory: Optional[Dict[str, Any]] = None
    product_incentives: Optional[List[Dict[str, Any]]] = None


# ── Vendors ───────────────────────────────────────────────────────
class VendorIn(BaseModel):
    name: str
    lead_time_days: int = 4
    contact: Optional[str] = ""
    email: Optional[str] = ""
    phone: Optional[str] = ""
    address: Optional[str] = ""
    gst_number: Optional[str] = ""
    payment_terms: Optional[Dict[str, Any]] = None
    discount_tiers: Optional[List[Dict[str, Any]]] = None
    notes: Optional[str] = ""


class VendorUpdateIn(BaseModel):
    name: Optional[str] = None
    lead_time_days: Optional[int] = None
    contact: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    gst_number: Optional[str] = None
    payment_terms: Optional[Dict[str, Any]] = None
    discount_tiers: Optional[List[Dict[str, Any]]] = None
    reliability_rating: Optional[float] = None
    notes: Optional[str] = None


# ── Staff ─────────────────────────────────────────────────────────
class StaffCreateIn(BaseModel):
    name: str
    email: Optional[str] = ""
    phone: Optional[str] = ""
    base_salary: float = 25000
    role: str = "staff"
    department: Optional[str] = ""
    hire_date: Optional[str] = None
    shift_schedule: Optional[Dict[str, str]] = None


class StaffUpdateIn(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    base_salary: Optional[float] = None
    role: Optional[str] = None
    department: Optional[str] = None
    is_active: Optional[bool] = None
    shift_schedule: Optional[Dict[str, str]] = None


# ── Attendance ────────────────────────────────────────────────────
class ClockInIn(BaseModel):
    staff_id: str
    notes: Optional[str] = ""


class ClockOutIn(BaseModel):
    staff_id: str
    notes: Optional[str] = ""


class AttendanceManualIn(BaseModel):
    staff_id: str
    date: str  # YYYY-MM-DD
    status: str  # present | absent | half_day | leave
    clock_in: Optional[str] = None
    clock_out: Optional[str] = None
    notes: Optional[str] = ""


# ── Stock Audit ───────────────────────────────────────────────────
class AuditStartIn(BaseModel):
    audit_date: Optional[str] = None  # defaults to today


class AuditItemIn(BaseModel):
    sku_id: str
    actual_qty: float
    discrepancy_reason: Optional[str] = None  # spill | waste | theft | unrecorded_usage | count_error
    notes: Optional[str] = ""


class AuditSubmitIn(BaseModel):
    items: List[AuditItemIn]


# ── COGS & Service Recipes ───────────────────────────────────────
class RecipeIngredientIn(BaseModel):
    sku_id: str
    quantity_per_service: float
    unit: str = "ml"  # ml | gm | pcs


class ServiceRecipeIn(BaseModel):
    service_name: str
    category: Optional[str] = ""
    ingredients: List[RecipeIngredientIn]


class ConsumptionLogIn(BaseModel):
    service_name: str
    staff_id: Optional[str] = None
    date: Optional[str] = None  # defaults to today
    ingredients_used: Optional[List[Dict[str, Any]]] = None  # override recipe quantities
    pos_transaction_id: Optional[str] = None


# ── Budgets ───────────────────────────────────────────────────────
class BudgetLineItemIn(BaseModel):
    sku_id: str
    budgeted_qty: float
    budgeted_cost: float


class BudgetCreateIn(BaseModel):
    month: str  # YYYY-MM
    category: str = "all"
    budgeted_amount: float
    budgeted_units: Optional[float] = 0
    line_items: Optional[List[BudgetLineItemIn]] = None


# ── Purchase Orders ──────────────────────────────────────────────
class POLineIn(BaseModel):
    sku_id: str
    quantity: float
    unit_cost: float


class PurchaseOrderCreateIn(BaseModel):
    vendor_id: str
    lines: List[POLineIn]
    expected_delivery: Optional[str] = None
    notes: Optional[str] = ""


class POStatusUpdateIn(BaseModel):
    status: str  # requested | ordered | in_transit | delivered | stocked | cancelled
    notes: Optional[str] = ""


# ── Vendor Contracts ─────────────────────────────────────────────
class VendorContractIn(BaseModel):
    vendor_id: str
    contract_number: Optional[str] = ""
    start_date: str
    end_date: str
    terms: Optional[str] = ""
    discount_structure: Optional[List[Dict[str, Any]]] = None
    minimum_order_frequency: Optional[str] = None
    sla_delivery_days: Optional[int] = None
    penalty_clause: Optional[str] = ""
