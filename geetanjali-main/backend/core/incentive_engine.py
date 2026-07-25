"""Incentive configuration defaults and calculation engine."""
from typing import List, Dict, Any
from core.database import db

DEFAULT_CONFIG = {
    "id": "master",
    "staff_daily_tiers": [
        {"min": 2500, "max": 4999, "bonus": 100},
        {"min": 5000, "max": 7999, "bonus": 200},
        {"min": 8000, "max": 9999, "bonus": 350},
        {"min": 10000, "max": 14999, "bonus": 500},
        {"min": 15000, "max": 17999, "bonus": 700},
        {"min": 18000, "max": 99999999, "bonus": 1000},
    ],
    "video_review_bonus": 50,
    "staff_monthly_multipliers": [
        {"min_ratio": 4, "max_ratio": 5, "pct": 3},
        {"min_ratio": 5, "max_ratio": 6, "pct": 5},
        {"min_ratio": 6, "max_ratio": 9999, "pct": 6},
    ],
    "retail_commission_pct": 0,
    "product_incentives": [
        # Kerastase
        {"brand": "kerastase", "pattern": "shampoo", "amount": 150},
        {"brand": "kerastase", "pattern": "fresh affair", "amount": 150},
        {"brand": "kerastase", "pattern": "elixer ultimate l'huile original serum (30ml)", "amount": 100},
        {"brand": "kerastase", "pattern": "elixer ultimate l'huile original serum refil", "amount": 150},
        {"brand": "kerastase", "pattern": "elixer ultimate l'huile original serum (75ml)", "amount": 200},
        {"brand": "kerastase", "pattern": "masque", "amount": 200},
        {"brand": "kerastase", "pattern": "mask", "amount": 200},
        {"brand": "kerastase", "pattern": "nutritive 8h", "amount": 200},
        {"brand": "kerastase", "pattern": "stimuliste", "amount": 200},
        {"brand": "kerastase", "pattern": "initialiste", "amount": 200},
        {"brand": "kerastase", "pattern": "genesis anti hair-fall", "amount": 200},
        {"brand": "kerastase", "pattern": "genesis ampoules", "amount": 250},
        {"brand": "kerastase", "pattern": "cure apaisante", "amount": 200},
        {"brand": "kerastase", "pattern": "cure densifique", "amount": 750},
        {"brand": "kerastase", "pattern": "cure anti-chute", "amount": 750},
        # Loreal
        {"brand": "loreal", "pattern": "metal dx shampoo", "amount": 100},
        {"brand": "loreal", "pattern": "metal dx hair mask", "amount": 100},
        {"brand": "loreal", "pattern": "absolut repair molecular shampoo", "amount": 60},
        {"brand": "loreal", "pattern": "absolut repair molecular masque", "amount": 100},
        {"brand": "loreal", "pattern": "absolut repair molecular serum", "amount": 60},
        {"brand": "loreal", "pattern": "aminexil", "amount": 150},
        {"brand": "loreal", "pattern": "serioxyl", "amount": 150},
        {"brand": "loreal", "pattern": "shampoo", "amount": 50},
        {"brand": "loreal", "pattern": "masque", "amount": 50},
        {"brand": "loreal", "pattern": "mask", "amount": 50},
        # Redken
        {"brand": "redken", "pattern": "", "amount": 100},
        # K18
        {"brand": "k18", "pattern": "5ml", "amount": 50},
        {"brand": "k18", "pattern": "50ml", "amount": 150},
        # Moroccan
        {"brand": "moroccan", "pattern": "light treatment oil", "amount": 150},
        {"brand": "moroccan", "pattern": "", "amount": 100},
        # Olaplex
        {"brand": "olaplex", "pattern": "no. 3 bond repair", "amount": 150},
        {"brand": "olaplex", "pattern": "no. 6", "amount": 150},
        {"brand": "olaplex", "pattern": "no. 7", "amount": 150},
        {"brand": "olaplex", "pattern": "", "amount": 100},
        # De Fabulous / Kerafusion
        {"brand": "de fabulous", "pattern": "", "amount": 100},
        {"brand": "kerafusion", "pattern": "", "amount": 100},
        # Kanpeki
        {"brand": "kanpeki", "pattern": "", "amount": 100},
        # Guinot slabs
        {"brand": "guinot", "pattern": "", "max_price": 3499, "amount": 150},
        {"brand": "guinot", "pattern": "", "min_price": 3500, "max_price": 4499, "amount": 200},
        {"brand": "guinot", "pattern": "", "min_price": 4500, "max_price": 6999, "amount": 350},
        {"brand": "guinot", "pattern": "", "min_price": 7000, "amount": 500},
        # Thalgo slabs
        {"brand": "thalgo", "pattern": "", "max_price": 4999, "amount": 100},
        {"brand": "thalgo", "pattern": "", "min_price": 5000, "amount": 200},
    ],
    "gift_card_commission_pct": 3,
    "membership_commission_pct": 2,
    "package_commission_pct": 2,
    "manager_milestones": [
        {"min_revenue": 1800000, "bonus_per_manager": 5000},
        {"min_revenue": 2000000, "bonus_per_manager": 7000},
        {"min_revenue": 2500000, "bonus_per_manager": 10000},
        {"min_revenue": 3000000, "bonus_per_manager": 20000},
    ],
    "inventory": {
        "lead_time_days": 4,
        "safety_buffer_pct": 50,
    },
}


async def get_config() -> dict:
    """Retrieve the master config from DB, or fall back to defaults."""
    cfg = await db.config.find_one({"id": "master"}, {"_id": 0})
    return cfg or DEFAULT_CONFIG


def calc_daily_bonus(service_revenue: float, tiers: List[dict]) -> Dict[str, Any]:
    """Calculate daily bonus based on service revenue and tier brackets."""
    tier_hit = None
    for t in sorted(tiers, key=lambda x: x["min"]):
        if service_revenue >= t["min"] and service_revenue <= t["max"]:
            tier_hit = t
    return {
        "service_revenue": round(service_revenue, 2),
        "tier": tier_hit,
        "bonus": tier_hit["bonus"] if tier_hit else 0,
    }


def calc_monthly_bonus(monthly_service_rev: float, salary: float, mults: List[dict]) -> Dict[str, Any]:
    """Calculate monthly efficiency bonus based on revenue-to-salary ratio."""
    if salary <= 0:
        return {"ratio": 0, "pct": 0, "amount": 0}
    ratio = monthly_service_rev / salary
    hit = None
    for m in sorted(mults, key=lambda x: x["min_ratio"]):
        if ratio >= m["min_ratio"] and ratio < m["max_ratio"]:
            hit = m
    return {
        "ratio": round(ratio, 2),
        "pct": hit["pct"] if hit else 0,
        "amount": round(monthly_service_rev * (hit["pct"] / 100), 2) if hit else 0,
    }


def calc_manager_bonus(month_revenue: float, milestones: List[dict]) -> Dict[str, Any]:
    """Calculate manager milestone bonus based on total salon revenue."""
    hit = None
    for m in sorted(milestones, key=lambda x: x["min_revenue"]):
        if month_revenue >= m["min_revenue"]:
            hit = m
    return {
        "month_revenue": round(month_revenue, 2),
        "milestone": hit,
        "bonus": hit["bonus_per_manager"] if hit else 0,
    }


def calc_product_incentive(item_name: str, brand: str, net_price: float, qty: float, rules: List[dict], mappings: Dict[str, dict] = None) -> float:
    """Find first matching rule and return per-unit incentive × qty."""
    if not item_name or qty <= 0:
        return 0.0
    item_key = item_name.strip().lower()

    if mappings and item_key in mappings:
        map_entry = mappings[item_key]
        return float(map_entry.get("amount", 0)) * qty

    name_lc = item_key
    brand_lc = (brand or "").lower()
    aliases = {
        "kerastase": ["k chroma", "k genesis", "k reflection", "k nutritive", "k specifique",
                       "k densifique", "k blond", "k discipline", "k resistance", "k elixir",
                       "k initialiste", "k symbiose", "k first", " keras", "elixir ultime", "kerastase"],
        "loreal": ["l'oreal", "loreal", "serie expert", "absolut repair", "metal dx",
                    "aminexil", "serioxyl", "vitamino", "inoa", "majirel"],
        "redken": ["redken", "acidic", "extreme", "all soft"],
        "olaplex": ["olaplex", "bond maintenance"],
        "moroccan": ["moroccan", "moroccanoil"],
        "k18": ["k18"],
        "kanpeki": ["kanpeki"],
        "guinot": ["guinot"],
        "thalgo": ["thalgo"],
        "de fabulous": ["de fabulous"],
        "kerafusion": ["kerafusion"],
    }
    unit_price = net_price / qty if qty else 0
    for rule in rules:
        rb = (rule.get("brand") or "").lower()
        if rb:
            hit = rb in name_lc or rb in brand_lc
            if not hit:
                for a in aliases.get(rb, []):
                    if a in name_lc:
                        hit = True
                        break
            if not hit:
                continue
        pat = (rule.get("pattern") or "").lower()
        if pat:
            pat_aliases = {"shampoo": ["shmp", "shampooing"], "masque": ["mask", "masq"],
                            "conditioner": ["cond"], "serum": ["srm"]}
            hit_pat = pat in name_lc
            if not hit_pat:
                for a in pat_aliases.get(pat, []):
                    if a in name_lc:
                        hit_pat = True
                        break
            if not hit_pat:
                continue
        mn = rule.get("min_price")
        mx = rule.get("max_price")
        if mn is not None and unit_price < mn:
            continue
        if mx is not None and unit_price > mx:
            continue
        return float(rule.get("amount", 0)) * qty
    return 0.0


async def staff_day_product_incentive(staff_name: str, day: str, rules: List[dict]) -> float:
    """Sum product incentive for all Product-type POS rows this staff sold on a day."""
    total = 0.0
    async for r in db.pos_transactions.find({"date": day, "type": "Product", "staff.name": staff_name}, {"_id": 0}):
        share = next((s["pct"] for s in r.get("staff", []) if s["name"] == staff_name), 100) / 100
        brand = ""
        sku = await db.skus.find_one({"name": r.get("item_name", "").strip()})
        if sku:
            brand = sku.get("vendor_name") or sku.get("category") or ""
        total += calc_product_incentive(r.get("item_name", ""), brand, r.get("net_price", 0), r.get("quantity", 1), rules) * share
    return round(total, 2)
