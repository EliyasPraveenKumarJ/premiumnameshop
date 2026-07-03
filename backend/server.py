from dotenv import load_dotenv
from pathlib import Path
import os

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import asyncio
import logging
import uuid
import jwt
import bcrypt
from datetime import datetime, timezone, timedelta
from typing import List, Optional

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from pydantic import BaseModel, Field, EmailStr

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="PremiumNameShop API")
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

JWT_ALGORITHM = "HS256"


def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email, "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "access"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        try:
            oid = ObjectId(payload["sub"])
        except Exception:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = await db.users.find_one({"_id": oid})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user["_id"] = str(user["_id"])
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


# ----------------------- Models -----------------------
class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class DomainBase(BaseModel):
    name: str
    price: Optional[float] = None
    category: str = "General"
    tags: List[str] = []
    description: str = ""
    featured: bool = False
    status: str = "available"  # available | sold


class DomainCreate(DomainBase):
    pass


class DomainUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    description: Optional[str] = None
    featured: Optional[bool] = None
    status: Optional[str] = None


class Domain(DomainBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class OfferCreate(BaseModel):
    domain_id: Optional[str] = None
    domain_name: str
    name: str
    email: EmailStr
    offer_amount: Optional[float] = None
    message: str = ""


class Offer(OfferCreate):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    status: str = "new"  # new | read
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


# ----------------------- Email -----------------------
async def send_offer_email(offer: Offer):
    api_key = os.environ.get("RESEND_API_KEY", "").strip()
    if not api_key:
        logger.info("RESEND_API_KEY not set - skipping email notification.")
        return
    try:
        import resend
        resend.api_key = api_key
        price_line = f"<p><strong>Offer Amount:</strong> ${offer.offer_amount:,.0f}</p>" if offer.offer_amount else "<p><strong>Offer Amount:</strong> Not specified (price inquiry)</p>"
        html = f"""
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;">
          <h2 style="color:#111;">New Domain Inquiry — PremiumNameShop</h2>
          <p><strong>Domain:</strong> {offer.domain_name}</p>
          {price_line}
          <p><strong>From:</strong> {offer.name} ({offer.email})</p>
          <p><strong>Message:</strong><br/>{offer.message or '—'}</p>
          <hr/>
          <p style="color:#888;font-size:12px;">Received {offer.created_at}</p>
        </div>
        """
        params = {
            "from": os.environ.get("SENDER_EMAIL", "onboarding@resend.dev"),
            "to": [os.environ.get("NOTIFY_EMAIL", "yazziestech@gmail.com")],
            "subject": f"New Inquiry: {offer.domain_name}",
            "html": html,
        }
        await asyncio.to_thread(resend.Emails.send, params)
        logger.info("Offer email sent.")
    except Exception as e:
        logger.error(f"Failed to send offer email: {e}")


# ----------------------- Auth Routes -----------------------
@api_router.post("/auth/login")
async def login(payload: LoginRequest, response: Response):
    email = payload.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(str(user["_id"]), email)
    response.set_cookie("access_token", token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    return {"token": token, "user": {"email": email, "name": user.get("name", "Admin"), "role": user.get("role", "admin")}}


@api_router.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return {"email": user["email"], "name": user.get("name", "Admin"), "role": user.get("role", "admin")}


@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"ok": True}


# ----------------------- Domain Routes -----------------------
@api_router.get("/domains", response_model=List[Domain])
async def list_domains(q: Optional[str] = None, category: Optional[str] = None, status: Optional[str] = None, sort: Optional[str] = None):
    query = {}
    if q:
        query["name"] = {"$regex": q, "$options": "i"}
    if category and category != "All":
        query["category"] = category
    if status and status != "All":
        query["status"] = status
    docs = await db.domains.find(query, {"_id": 0}).to_list(1000)
    if sort == "price_asc":
        docs.sort(key=lambda d: (d.get("price") is None, d.get("price") or 0))
    elif sort == "price_desc":
        docs.sort(key=lambda d: (d.get("price") or 0), reverse=True)
    elif sort == "az":
        docs.sort(key=lambda d: d.get("name", "").lower())
    else:
        docs.sort(key=lambda d: (not d.get("featured", False), d.get("name", "").lower()))
    return docs


@api_router.get("/categories")
async def list_categories():
    cats = await db.domains.distinct("category")
    return sorted([c for c in cats if c])


@api_router.get("/stats")
async def stats(user: dict = Depends(get_current_user)):
    total = await db.domains.count_documents({})
    available = await db.domains.count_documents({"status": "available"})
    sold = await db.domains.count_documents({"status": "sold"})
    offers = await db.offers.count_documents({})
    new_offers = await db.offers.count_documents({"status": "new"})
    return {"total": total, "available": available, "sold": sold, "offers": offers, "new_offers": new_offers}


@api_router.post("/domains", response_model=Domain)
async def create_domain(payload: DomainCreate, user: dict = Depends(get_current_user)):
    domain = Domain(**payload.model_dump())
    await db.domains.insert_one(domain.model_dump())
    return domain


@api_router.put("/domains/{domain_id}", response_model=Domain)
async def update_domain(domain_id: str, payload: DomainUpdate, user: dict = Depends(get_current_user)):
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    existing = await db.domains.find_one({"id": domain_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Domain not found")
    await db.domains.update_one({"id": domain_id}, {"$set": updates})
    existing.update(updates)
    return existing


@api_router.delete("/domains/{domain_id}")
async def delete_domain(domain_id: str, user: dict = Depends(get_current_user)):
    res = await db.domains.delete_one({"id": domain_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Domain not found")
    return {"ok": True}


# ----------------------- Offer Routes -----------------------
@api_router.post("/offers", response_model=Offer)
async def create_offer(payload: OfferCreate):
    offer = Offer(**payload.model_dump())
    await db.offers.insert_one(offer.model_dump())
    asyncio.create_task(send_offer_email(offer))
    return offer


@api_router.get("/offers", response_model=List[Offer])
async def list_offers(user: dict = Depends(get_current_user)):
    docs = await db.offers.find({}, {"_id": 0}).to_list(1000)
    docs.sort(key=lambda d: d.get("created_at", ""), reverse=True)
    return docs


@api_router.patch("/offers/{offer_id}")
async def update_offer(offer_id: str, user: dict = Depends(get_current_user)):
    await db.offers.update_one({"id": offer_id}, {"$set": {"status": "read"}})
    return {"ok": True}


@api_router.delete("/offers/{offer_id}")
async def delete_offer(offer_id: str, user: dict = Depends(get_current_user)):
    await db.offers.delete_one({"id": offer_id})
    return {"ok": True}


@api_router.get("/")
async def root():
    return {"message": "PremiumNameShop API"}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


# ----------------------- Seeding -----------------------
SEED_DOMAINS = [
    "macrotrade.co", "uftcoin.com", "mythtrue.com", "chatwithaki.com", "hamcafe.com",
    "unreplaceablemind.com", "mobiai.app", "preciousoud.com", "TraderVI.com", "wordboard.app",
    "dnsbridge.com", "bixml.com", "traderbi.com", "buyermade.com", "dairyfeeds.com",
    "aiborders.com", "forsinger.com", "cellcircular.com", "batteryreclaim.com", "viewboards.com",
    "visualcgi.com", "FAQcentre.com", "omancafe.com", "sciencebath.com", "leaguesworldcup.com",
    "SunoLyrics.com", "SunoTones.com", "heartwatchpro.com", "gates2galaxy.com", "mayaring.com",
    "switchtech.net", "premiumnameshop.com", "chatmeta.net", "alarm.mobi", "yesusa.org",
    "reclawk.com", "declawk.com", "agentjustice.org", "algorithmicaccountability.org",
    "childrensdigitalrights.org", "automationrights.org", "agentconstitution.org",
    "travelsunscreen.com", "ispublic.com", "Juzz.ai", "shortly-ai.com", "playchatai.com",
    "dunepass.com", "luxurydunes.com", "mecanaecohotel.com", "moltfollow.com",
]

FEATURED = {"premiumnameshop.com", "tradervi.com", "juzz.ai", "sunolyrics.com", "mobiai.app", "luxurydunes.com", "ispublic.com", "shortly-ai.com"}
PRICES = {
    "premiumnameshop.com": 25000, "juzz.ai": 12000, "tradervi.com": 8500, "mobiai.app": 6500,
    "ispublic.com": 9000, "sunolyrics.com": 4500, "luxurydunes.com": 3500, "shortly-ai.com": 5000,
    "chatmeta.net": 2200, "aiborders.com": 1800, "playchatai.com": 1500,
}


def categorize(name: str):
    low = name.lower()
    ai_kw = ["ai", "chat", "bot", "agent", "algorithm", "automation"]
    fin_kw = ["coin", "trade", "trader", "buyer", "macro"]
    if low.endswith(".ai") or any(k in low for k in ai_kw):
        return "AI & Tech", ["AI", "Brandable"]
    if any(k in low for k in fin_kw):
        return "Finance & Crypto", ["Finance", "Brandable"]
    if low.endswith(".app"):
        return "Apps & SaaS", ["App", "Brandable"]
    if "cafe" in low or "hotel" in low or "oud" in low or "dune" in low or "ring" in low:
        return "Lifestyle & Travel", ["Brandable", "Premium"]
    if low.endswith(".org") or "rights" in low or "justice" in low or "constitution" in low:
        return "Rights & Governance", ["Org", "Authority"]
    return "Business & Brandable", ["Brandable"]


async def seed_admin():
    email = os.environ.get("ADMIN_EMAIL", "admin@example.com").lower()
    password = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.users.find_one({"email": email})
    if existing is None:
        await db.users.insert_one({"email": email, "password_hash": hash_password(password), "name": "Admin", "role": "admin", "created_at": datetime.now(timezone.utc).isoformat()})
        logger.info("Admin seeded.")
    elif not verify_password(password, existing["password_hash"]):
        await db.users.update_one({"email": email}, {"$set": {"password_hash": hash_password(password)}})
        logger.info("Admin password updated.")


async def seed_domains():
    count = await db.domains.count_documents({})
    if count > 0:
        return
    docs = []
    for name in SEED_DOMAINS:
        low = name.lower()
        cat, tags = categorize(name)
        if low in FEATURED and "Premium" not in tags:
            tags = tags + ["Premium"]
        d = Domain(
            name=name,
            price=PRICES.get(low),
            category=cat,
            tags=tags,
            description="",
            featured=low in FEATURED,
            status="available",
        )
        docs.append(d.model_dump())
    await db.domains.insert_many(docs)
    logger.info(f"Seeded {len(docs)} domains.")


@app.on_event("startup")
async def startup():
    print("Testing MongoDB...")
    print("MONGO_URL:", os.environ.get("MONGO_URL"))
    print("DB_NAME:", os.environ.get("DB_NAME"))
    result = await client.admin.command("ping")
    print(result)

    print("Server version:")
    build = await client.admin.command("buildInfo")
    print(build["version"])

    print("Done")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
