import httpx
from bs4 import BeautifulSoup
from typing import Dict, List, Any, Optional
import logging
import re
from datetime import datetime, timezone

logger = logging.getLogger("captrack.gmp")

class GMPService:
    """Aggregates authentic live Grey Market Premium (GMP) data directly from InvestorGain live report tables."""

    def __init__(self):
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
        }
        self._cached_table: Optional[List[tuple]] = None
        self._cache_timestamp: float = 0.0

    async def fetch_investorgain_table(self) -> List[tuple]:
        """Fetches and parses the complete live InvestorGain GMP table."""
        now_ts = datetime.now(timezone.utc).timestamp()
        if self._cached_table and (now_ts - self._cache_timestamp) < 600:  # Cache for 10 minutes
            return self._cached_table

        entries = []
        try:
            url = "https://www.investorgain.com/report/live-ipo-gmp/331/"
            async with httpx.AsyncClient(headers=self.headers, timeout=10.0, follow_redirects=True) as client:
                res = await client.get(url)
                if res.status_code == 200:
                    soup = BeautifulSoup(res.text, "html.parser")
                    table = soup.find("table")
                    if table:
                        for row in table.find_all("tr"):
                            cols = [td.text.strip().encode("ascii", "ignore").decode() for td in row.find_all(["td", "th"])]
                            if len(cols) >= 2:
                                name = cols[0]
                                gmp_text = cols[1]
                                m = re.search(r'([0-9]+(?:\.[0-9]+)?)\s*\(([-+]?[0-9]+(?:\.[0-9]+)?)\%\)', gmp_text)
                                if m:
                                    entries.append((name, float(m.group(1)), float(m.group(2))))
                                else:
                                    entries.append((name, 0.0, 0.0))
            self._cached_table = entries
            self._cache_timestamp = now_ts
        except Exception as e:
            logger.error(f"Error fetching InvestorGain live GMP table: {e}")

        return entries

    async def fetch_gmp(self, ipo_name: str, issue_price: float) -> Dict[str, Any]:
        """
        Fetches authentic live GMP, calculates estimated listing price and percentage return.
        """
        table_entries = await self.fetch_investorgain_table()
        gmp_val = 0.0
        est_gain_percent = 0.0

        if ipo_name and table_entries:
            first_word = ipo_name.split()[0].lower()
            clean_ipo_name = re.sub(r'[^a-zA-Z0-9]', '', ipo_name.lower())
            
            for inv_name, gmp, pct in table_entries:
                clean_inv_name = re.sub(r'[^a-zA-Z0-9]', '', inv_name.lower().replace("ipo", "").replace("sme", ""))
                if (len(first_word) > 2 and first_word in inv_name.lower()) or (clean_ipo_name in clean_inv_name):
                    gmp_val = gmp
                    est_gain_percent = pct
                    break

        est_listing_price = round(issue_price + gmp_val, 2)
        if est_gain_percent == 0.0 and issue_price > 0 and gmp_val > 0:
            est_gain_percent = round((gmp_val / issue_price) * 100, 2)

        return {
            "gmp_amount": gmp_val,
            "est_listing_price": est_listing_price,
            "estimated_gain_percent": est_gain_percent,
            "source": "investorgain.com",
            "recorded_at": datetime.now(timezone.utc).strftime("%Y-%m-%d")
        }

gmp_service = GMPService()
