"""Batch-level inventory helpers — FIFO consumption, movement, and transfer logic."""
import uuid
from core.database import db
from core.helpers import now_utc


async def consume_batches(sku: dict, location: str, qty_needed: float) -> float:
    """FIFO by expiry_date (None last). Returns qty actually consumed."""
    batches = sku.get("batches") or []
    loc_batches = [b for b in batches if b.get("location") == location and b["qty"] > 0]
    loc_batches.sort(key=lambda b: (b.get("expiry_date") or "9999-12-31", b.get("received_at") or ""))
    remaining = qty_needed
    for b in loc_batches:
        if remaining <= 0:
            break
        take = min(b["qty"], remaining)
        b["qty"] -= take
        remaining -= take
    consumed = qty_needed - remaining
    if consumed <= 0:
        return 0
    new_batches = [b for b in batches if b["qty"] > 0]
    store_total = sum(b["qty"] for b in new_batches if b.get("location") == "store")
    floor_total = sum(b["qty"] for b in new_batches if b.get("location") == "floor")
    retail_total = sum(b["qty"] for b in new_batches if b.get("location") == "retail")
    await db.skus.update_one(
        {"id": sku["id"]},
        {"$set": {"batches": new_batches, "store_qty": store_total, "floor_qty": floor_total, "retail_qty": retail_total}},
    )
    return consumed


async def move_batches(sku: dict, from_loc: str, to_loc: str, qty: float) -> float:
    """Move qty from one location to another, FIFO by expiry. Returns moved qty."""
    batches = sku.get("batches") or []
    src = [b for b in batches if b.get("location") == from_loc and b["qty"] > 0]
    src.sort(key=lambda b: (b.get("expiry_date") or "9999-12-31", b.get("received_at") or ""))
    remaining = qty
    for b in src:
        if remaining <= 0:
            break
        take = min(b["qty"], remaining)
        b["qty"] -= take
        batches.append({
            "id": str(uuid.uuid4()),
            "qty": take,
            "location": to_loc,
            "expiry_date": b.get("expiry_date"),
            "unit_cost": b.get("unit_cost", sku.get("unit_cost", 0)),
            "invoice_id": b.get("invoice_id"),
            "received_at": now_utc(),
        })
        remaining -= take
    moved = qty - remaining
    if moved <= 0:
        return 0
    new_batches = [b for b in batches if b["qty"] > 0]
    store_total = sum(b["qty"] for b in new_batches if b.get("location") == "store")
    floor_total = sum(b["qty"] for b in new_batches if b.get("location") == "floor")
    retail_total = sum(b["qty"] for b in new_batches if b.get("location") == "retail")
    await db.skus.update_one(
        {"id": sku["id"]},
        {"$set": {"batches": new_batches, "store_qty": store_total, "floor_qty": floor_total, "retail_qty": retail_total}},
    )
    return moved


def recompute_location_totals(batches: list) -> dict:
    """Recompute store/floor/retail totals from batch list."""
    active = [b for b in batches if b["qty"] > 0]
    return {
        "store_qty": sum(b["qty"] for b in active if b.get("location") == "store"),
        "floor_qty": sum(b["qty"] for b in active if b.get("location") == "floor"),
        "retail_qty": sum(b["qty"] for b in active if b.get("location") == "retail"),
    }
