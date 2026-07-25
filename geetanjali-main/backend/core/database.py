"""Centralized database connection and collection accessors."""
import os
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "geetanjali_db")

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]


async def create_indexes():
    """Create all required indexes on startup."""
    # Existing indexes
    await db.users.create_index("email", unique=True)
    await db.staff.create_index("name", unique=True)
    await db.skus.create_index("name", unique=True)
    await db.pos_transactions.create_index([("date", 1), ("invoice_number", 1)])
    await db.payouts.create_index([("staff_id", 1), ("payout_date", 1)], unique=True)

    # New indexes — Attendance
    await db.attendance.create_index([("staff_id", 1), ("date", 1)], unique=True)
    await db.attendance.create_index("date")
    await db.attendance.create_index("status")

    # New indexes — Stock Audits
    await db.stock_audits.create_index("audit_date")
    await db.stock_audits.create_index("status")

    # New indexes — Service Recipes
    await db.service_recipes.create_index("service_name", unique=True)

    # New indexes — Service Consumption Log
    await db.service_consumption_log.create_index("date")
    await db.service_consumption_log.create_index("service_name")
    await db.service_consumption_log.create_index("staff_id")

    # New indexes — Budgets
    await db.budgets.create_index([("month", 1), ("category", 1)], unique=True)

    # New indexes — Purchase Orders
    await db.purchase_orders.create_index("po_number", unique=True)
    await db.purchase_orders.create_index("vendor_id")
    await db.purchase_orders.create_index("status")
    await db.purchase_orders.create_index("expected_delivery")

    # New indexes — Vendor Contracts
    await db.vendor_contracts.create_index("vendor_id")
    await db.vendor_contracts.create_index("status")


async def close_connection():
    """Close the MongoDB connection."""
    client.close()
