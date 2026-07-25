"""Staff management & attendance router — NEW endpoints only.
The existing GET /api/staff endpoint stays in server.py untouched.
"""
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional
from core.database import db
from core.helpers import get_current_user, require_role, now_utc, new_id
from core.models import StaffCreateIn, StaffUpdateIn, ClockInIn, ClockOutIn, AttendanceManualIn

router = APIRouter(prefix="/api", tags=["staff-ext"])
log = logging.getLogger("lss.staff")


# ── Staff CRUD (new endpoints — create, update, performance) ──
@router.post("/staff")
async def create_staff(payload: StaffCreateIn, user: dict = Depends(require_role("owner", "admin"))):
    existing = await db.staff.find_one({"name": payload.name.strip()})
    if existing:
        raise HTTPException(400, "Staff member with this name already exists")
    doc = {
        "id": new_id(),
        "name": payload.name.strip(),
        "email": payload.email or "",
        "phone": payload.phone or "",
        "base_salary": payload.base_salary,
        "role": payload.role,
        "department": payload.department or "",
        "hire_date": payload.hire_date,
        "is_active": True,
        "shift_schedule": payload.shift_schedule or {"default_start": "10:00", "default_end": "19:00"},
        "performance_metrics": {
            "avg_client_retention_pct": 0,
            "avg_upsell_conversion_pct": 0,
            "avg_service_completion_min": 0,
        },
        "created_at": now_utc(),
    }
    await db.staff.insert_one(doc)
    doc.pop("_id", None)
    return doc


@router.put("/staff/{staff_id}")
async def update_staff(staff_id: str, payload: StaffUpdateIn, user: dict = Depends(require_role("owner", "admin"))):
    existing = await db.staff.find_one({"id": staff_id})
    if not existing:
        raise HTTPException(404, "Staff not found")
    updates = {k: v for k, v in payload.model_dump(exclude_none=True).items()}
    if not updates:
        raise HTTPException(400, "No fields to update")
    await db.staff.update_one({"id": staff_id}, {"$set": updates})
    updated = await db.staff.find_one({"id": staff_id}, {"_id": 0})
    return updated


@router.get("/staff/{staff_id}/performance")
async def staff_performance(staff_id: str):
    """Individual staff performance analytics."""
    staff = await db.staff.find_one({"id": staff_id}, {"_id": 0})
    if not staff:
        raise HTTPException(404, "Staff not found")

    # Revenue aggregation
    pipeline = [
        {"$match": {"staff.name": staff["name"]}},
        {"$unwind": "$staff"},
        {"$match": {"staff.name": staff["name"]}},
        {"$group": {
            "_id": "$type",
            "revenue": {"$sum": {"$multiply": ["$net_price", {"$divide": ["$staff.pct", 100]}]}},
            "count": {"$sum": 1},
        }},
    ]
    result = await db.pos_transactions.aggregate(pipeline).to_list(10)
    service_rev = sum(r["revenue"] for r in result if str(r["_id"]).lower() == "service")
    service_count = sum(r["count"] for r in result if str(r["_id"]).lower() == "service")
    retail_rev = sum(r["revenue"] for r in result if str(r["_id"]).lower() == "product")
    retail_count = sum(r["count"] for r in result if str(r["_id"]).lower() == "product")

    # Unique client count
    client_pipeline = [
        {"$match": {"staff.name": staff["name"]}},
        {"$group": {"_id": "$client"}},
        {"$count": "total"},
    ]
    client_result = await db.pos_transactions.aggregate(client_pipeline).to_list(1)
    unique_clients = client_result[0]["total"] if client_result else 0

    # Attendance summary
    attendance_days = await db.attendance.count_documents({"staff_id": staff_id, "status": "present"})

    return {
        "staff": staff,
        "total_service_revenue": round(service_rev, 2),
        "total_retail_revenue": round(retail_rev, 2),
        "total_services_performed": service_count,
        "total_products_sold": retail_count,
        "unique_clients_served": unique_clients,
        "avg_ticket_value": round(service_rev / service_count, 2) if service_count > 0 else 0,
        "days_present": attendance_days,
    }


# ── Attendance ─────────────────────────────────────────────────
@router.post("/attendance/clock-in")
async def clock_in(payload: ClockInIn, user: dict = Depends(get_current_user)):
    staff = await db.staff.find_one({"id": payload.staff_id})
    if not staff:
        raise HTTPException(404, "Staff not found")
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    existing = await db.attendance.find_one({"staff_id": payload.staff_id, "date": today})
    if existing and existing.get("clock_in"):
        raise HTTPException(400, "Already clocked in today")
    now = now_utc()
    if existing:
        await db.attendance.update_one(
            {"id": existing["id"]},
            {"$set": {"clock_in": now, "status": "present", "notes": payload.notes or existing.get("notes", "")}},
        )
    else:
        await db.attendance.insert_one({
            "id": new_id(),
            "staff_id": payload.staff_id,
            "staff_name": staff["name"],
            "date": today,
            "clock_in": now,
            "clock_out": None,
            "hours_worked": 0,
            "status": "present",
            "overtime_hours": 0,
            "notes": payload.notes or "",
            "created_at": now,
        })
    return {"ok": True, "staff_name": staff["name"], "clock_in": now, "date": today}


@router.post("/attendance/clock-out")
async def clock_out(payload: ClockOutIn, user: dict = Depends(get_current_user)):
    staff = await db.staff.find_one({"id": payload.staff_id})
    if not staff:
        raise HTTPException(404, "Staff not found")
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    record = await db.attendance.find_one({"staff_id": payload.staff_id, "date": today})
    if not record or not record.get("clock_in"):
        raise HTTPException(400, "No clock-in found for today")
    if record.get("clock_out"):
        raise HTTPException(400, "Already clocked out today")
    now = now_utc()
    clock_in_dt = datetime.fromisoformat(record["clock_in"])
    clock_out_dt = datetime.fromisoformat(now)
    hours = (clock_out_dt - clock_in_dt).total_seconds() / 3600
    standard_hours = 9.0
    overtime = max(0, hours - standard_hours)
    await db.attendance.update_one(
        {"id": record["id"]},
        {"$set": {
            "clock_out": now,
            "hours_worked": round(hours, 2),
            "overtime_hours": round(overtime, 2),
            "notes": payload.notes or record.get("notes", ""),
        }},
    )
    return {"ok": True, "staff_name": staff["name"], "clock_out": now, "hours_worked": round(hours, 2), "overtime": round(overtime, 2)}


@router.post("/attendance/manual")
async def manual_attendance(payload: AttendanceManualIn, user: dict = Depends(require_role("owner", "admin", "manager"))):
    """Manually mark attendance for a staff member on a specific date."""
    staff = await db.staff.find_one({"id": payload.staff_id})
    if not staff:
        raise HTTPException(404, "Staff not found")
    existing = await db.attendance.find_one({"staff_id": payload.staff_id, "date": payload.date})
    hours = 0.0
    if payload.clock_in and payload.clock_out:
        try:
            ci = datetime.fromisoformat(payload.clock_in)
            co = datetime.fromisoformat(payload.clock_out)
            hours = (co - ci).total_seconds() / 3600
        except Exception:
            pass
    doc = {
        "staff_id": payload.staff_id,
        "staff_name": staff["name"],
        "date": payload.date,
        "clock_in": payload.clock_in,
        "clock_out": payload.clock_out,
        "hours_worked": round(hours, 2),
        "status": payload.status,
        "overtime_hours": max(0, round(hours - 9.0, 2)),
        "notes": payload.notes or "",
    }
    if existing:
        await db.attendance.update_one({"id": existing["id"]}, {"$set": doc})
        return {"ok": True, "updated": True}
    else:
        doc["id"] = new_id()
        doc["created_at"] = now_utc()
        await db.attendance.insert_one(doc)
        return {"ok": True, "created": True}


@router.get("/attendance")
async def list_attendance(
    date: Optional[str] = None,
    staff_id: Optional[str] = None,
    month: Optional[str] = None,
    limit: int = 500,
):
    q = {}
    if date:
        q["date"] = date
    if staff_id:
        q["staff_id"] = staff_id
    if month:
        q["date"] = {"$regex": f"^{month}"}
    docs = await db.attendance.find(q, {"_id": 0}).sort("date", -1).limit(limit).to_list(limit)
    return docs


@router.get("/attendance/summary")
async def attendance_summary(month: str):
    """Monthly attendance summary per staff member with salary calculation."""
    staff_list = await db.staff.find({}, {"_id": 0}).to_list(500)
    summaries = []
    for s in staff_list:
        pipeline = [
            {"$match": {"staff_id": s["id"], "date": {"$regex": f"^{month}"}}},
            {"$group": {
                "_id": "$status",
                "count": {"$sum": 1},
                "total_hours": {"$sum": "$hours_worked"},
                "total_overtime": {"$sum": "$overtime_hours"},
            }},
        ]
        result = await db.attendance.aggregate(pipeline).to_list(10)
        present = sum(r["count"] for r in result if r["_id"] == "present")
        absent = sum(r["count"] for r in result if r["_id"] == "absent")
        half_day = sum(r["count"] for r in result if r["_id"] == "half_day")
        leave = sum(r["count"] for r in result if r["_id"] == "leave")
        total_hours = sum(r["total_hours"] for r in result)
        total_overtime = sum(r["total_overtime"] for r in result)

        base = s.get("base_salary", 0)
        effective_days = present + half_day * 0.5
        calculated_salary = round(base / 30 * effective_days, 2)

        summaries.append({
            "staff_id": s["id"],
            "staff_name": s["name"],
            "base_salary": base,
            "days_present": present,
            "days_absent": absent,
            "days_half_day": half_day,
            "days_leave": leave,
            "total_hours": round(total_hours, 2),
            "total_overtime": round(total_overtime, 2),
            "effective_days": effective_days,
            "calculated_salary": calculated_salary,
        })
    return {"month": month, "summaries": summaries}
