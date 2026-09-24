from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import datetime, timezone

def get_utc_now():
    return datetime.now(timezone.utc)

class IPOBase(SQLModel):
    name: str
    symbol: str
    exchange: str = "NSE/BSE"
    issue_price_min: float
    issue_price_max: float
    lot_size: int
    open_date: str
    close_date: str
    listing_date: Optional[str] = None
    issue_size_cr: float
    status: str = "Active"  # Active, Upcoming, Closed, Listed
    issue_type: str = "Mainboard"  # Mainboard, SME
    prospectus_url: Optional[str] = None
    company_logo: Optional[str] = None

class IPO(IPOBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=get_utc_now)
    updated_at: datetime = Field(default_factory=get_utc_now)

    # Relationships
    gmp_history: List["IPOGMPHistory"] = Relationship(back_populates="ipo")
    subscriptions: List["IPOSubscription"] = Relationship(back_populates="ipo")
    financials: List["IPOFinancials"] = Relationship(back_populates="ipo")
    gemini_summary: Optional["IPOGeminiSummary"] = Relationship(back_populates="ipo")

class IPOGMPHistory(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    ipo_id: int = Field(foreign_key="ipo.id")
    gmp_amount: float
    est_listing_price: float
    estimated_gain_percent: float
    source: str = "gmptoday.in"
    recorded_at: str  # YYYY-MM-DD or datetime string

    ipo: Optional[IPO] = Relationship(back_populates="gmp_history")

class IPOSubscription(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    ipo_id: int = Field(foreign_key="ipo.id")
    day: int
    date: str
    qib_x: float = 0.0
    nii_x: float = 0.0
    bii_x: float = 0.0  # Big NII (>10L)
    sii_x: float = 0.0  # Small NII (2L-10L)
    retail_x: float = 0.0
    employee_x: float = 0.0
    total_x: float = 0.0

    ipo: Optional[IPO] = Relationship(back_populates="subscriptions")

class IPOFinancials(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    ipo_id: int = Field(foreign_key="ipo.id")
    period: str  # e.g., FY23, FY24, FY25 (Q3)
    revenue_cr: float
    pat_cr: float
    assets_cr: float
    eps: float
    ronw_percent: float
    pe_ratio: float
    valuation_narrative: Optional[str] = None
    peer_comparison_narrative: Optional[str] = None

    ipo: Optional[IPO] = Relationship(back_populates="financials")

class IPOGeminiSummary(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    ipo_id: int = Field(foreign_key="ipo.id")
    company_overview: str
    promoters: str
    objectives: str
    strengths: str  # JSON or newline bullet list
    risks: str      # JSON or newline bullet list
    ai_rating: str = "Subscribe for Long Term"  # Subscribe, Apply for Listing Gains, Avoid, Neutral
    generated_at: datetime = Field(default_factory=get_utc_now)

    ipo: Optional[IPO] = Relationship(back_populates="gemini_summary")

class Watchlist(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = "default_user"
    ipo_id: int = Field(foreign_key="ipo.id")
    created_at: datetime = Field(default_factory=get_utc_now)

class IPOReminder(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = "default_user"
    ipo_id: int = Field(foreign_key="ipo.id")
    reminder_time: str  # ISO Format string or YYYY-MM-DD HH:MM
    event_type: str     # open_date, close_date, allotment
    is_notified: bool = False
    created_at: datetime = Field(default_factory=get_utc_now)
