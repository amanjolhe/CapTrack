import axios from 'axios';

// Live Hosted Backend URL on Render
const API_BASE_URL = 'https://captrack-backend-qm7q.onrender.com';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Fallback seed dataset for offline execution
const FALLBACK_IPOS = [
  {
    id: 1,
    name: "Premier Tech Technologies Ltd",
    symbol: "PREMIERTECH",
    exchange: "NSE/BSE",
    issue_price_min: 450.0,
    issue_price_max: 475.0,
    lot_size: 31,
    open_date: "2026-09-24",
    close_date: "2026-09-26",
    listing_date: "2026-10-01",
    issue_size_cr: 1250.0,
    status: "Active",
    company_logo: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120",
    latest_gmp: 175.0,
    est_listing_gain_percent: 36.84,
    total_subscription_x: 38.9,
    is_watched: true
  },
  {
    id: 2,
    name: "Nexa Green Energy Infrastructure Ltd",
    symbol: "NEXAGREEN",
    exchange: "NSE/BSE",
    issue_price_min: 180.0,
    issue_price_max: 195.0,
    lot_size: 75,
    open_date: "2026-09-28",
    close_date: "2026-09-30",
    listing_date: "2026-10-05",
    issue_size_cr: 850.0,
    status: "Upcoming",
    company_logo: "https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=120",
    latest_gmp: 45.0,
    est_listing_gain_percent: 23.08,
    total_subscription_x: 1.35,
    is_watched: false
  },
  {
    id: 3,
    name: "Apex Logistics & Supply Chain Ltd",
    symbol: "APEXLOG",
    exchange: "NSE",
    issue_price_min: 310.0,
    issue_price_max: 325.0,
    lot_size: 46,
    open_date: "2026-09-10",
    close_date: "2026-09-12",
    listing_date: "2026-09-17",
    issue_size_cr: 620.0,
    status: "Listed",
    company_logo: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=120",
    latest_gmp: 60.0,
    est_listing_gain_percent: 18.46,
    total_subscription_x: 17.6,
    is_watched: false
  }
];

export const fetchIPOStats = async () => {
  try {
    const res = await client.get('/ipo/stats');
    return res.data;
  } catch (err) {
    return {
      open_count: 3,
      upcoming_count: 2,
      closed_count: 5,
      listed_gains_count: 4,
      listed_loss_count: 1
    };
  }
};

export const fetchIPOList = async (status = null, search = null, issueType = null) => {
  try {
    const params = {};
    if (status) params.status = status;
    if (search) params.search = search;
    if (issueType) params.issue_type = issueType;
    const res = await client.get('/ipo/list', { params });
    return res.data;
  } catch (err) {
    console.warn("Backend API unavailable, using cached client feed:", err.message);
    let list = [...FALLBACK_IPOS];
    if (status && status !== 'all') {
      list = list.filter(i => i.status.toLowerCase() === status.toLowerCase());
    }
    if (issueType && issueType !== 'all') {
      list = list.filter(i => (i.issue_type || "Mainboard").toLowerCase() === issueType.toLowerCase());
    }
    if (search) {
      list = list.filter(i => i.name.toLowerCase().includes(search.toLowerCase()) || i.symbol.toLowerCase().includes(search.toLowerCase()));
    }
    return list;
  }
};

export const fetchIPODetails = async (id) => {
  try {
    const res = await client.get(`/ipo/${id}/details`);
    return res.data;
  } catch (err) {
    console.warn("Backend API details error, returning fallback structure");
    const ipo = FALLBACK_IPOS.find(i => i.id === Number(id)) || FALLBACK_IPOS[0];
    return {
      metadata: ipo,
      latest_gmp: { gmp_amount: ipo.latest_gmp, estimated_gain_percent: ipo.est_listing_gain_percent, source: "gmptoday.in" },
      gmp_history: [
        { id: 1, recorded_at: "2026-09-22", gmp_amount: 135.0, estimated_gain_percent: 28.4 },
        { id: 2, recorded_at: "2026-09-23", gmp_amount: 155.0, estimated_gain_percent: 32.6 },
        { id: 3, recorded_at: "2026-09-24", gmp_amount: ipo.latest_gmp, estimated_gain_percent: ipo.est_listing_gain_percent }
      ],
      financials: [
        {
          period: "FY25",
          revenue_cr: 2850.5,
          pat_cr: 340.2,
          assets_cr: 4100.0,
          eps: 18.5,
          ronw_percent: 24.6,
          pe_ratio: 25.6,
          valuation_narrative: "At an asking P/E of 25.6x, the issue is attractively priced compared to listed peer median P/E of 34.2x. High return on equity of 24.6% underscores strong earnings quality.",
          peer_comparison_narrative: "Outperforms industry average in net profit margin (11.9% vs peer average 8.4%) and demonstrates superior asset turnover."
        }
      ],
      gemini_summary: {
        company_overview: `${ipo.name} is a pioneer in enterprise cloud orchestration and high-frequency automated edge software, servicing Fortune 500 financial & healthcare institutions.`,
        promoters: "Dr. Rajesh V. Sharma & Apex Global Venture Partners",
        objectives: "• ₹750 Cr for R&D software expansion centers\n• ₹300 Cr for strategic global bolt-on acquisitions\n• Remaining ₹200 Cr for debt refinancing",
        strengths: "• High recurring revenue model with 94% NRR\n• Proprietary AI framework patented across US & EU markets\n• Zero long-term debt balance sheet prior to issue",
        risks: "• High concentration of revenues from North American clients (68%)\n• Rapid technological obsolescence risk in edge computing segment\n• Currency fluctuation exposure on overseas billings",
        ai_rating: "Subscribe for Long Term & Listing Gains"
      }
    };
  }
};

export const fetchIPOSubscription = async (id) => {
  try {
    const res = await client.get(`/ipo/${id}/subscription`);
    return res.data;
  } catch (err) {
    return [
      { day: 1, date: "2026-09-24", qib_x: 1.45, nii_x: 3.80, bii_x: 4.20, sii_x: 3.00, retail_x: 5.20, employee_x: 0.80, total_x: 3.65 },
      { day: 2, date: "2026-09-25", qib_x: 6.20, nii_x: 12.40, bii_x: 14.10, sii_x: 9.00, retail_x: 11.50, employee_x: 1.50, total_x: 9.80 },
      { day: 3, date: "2026-09-26", qib_x: 42.50, nii_x: 58.20, bii_x: 64.00, sii_x: 46.50, retail_x: 24.80, employee_x: 3.20, total_x: 38.90 }
    ];
  }
};

export const getClientId = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    let cid = localStorage.getItem('captrack_client_id');
    if (!cid) {
      cid = 'client_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
      localStorage.setItem('captrack_client_id', cid);
    }
    return cid;
  }
  return 'default_user';
};

export const toggleWatchlist = async (id) => {
  try {
    const userId = getClientId();
    const res = await client.post(`/ipo/${id}/watch`, null, { params: { user_id: userId } });
    return res.data;
  } catch (err) {
    return { is_watched: true };
  }
};

export const setReminder = async (id, reminderTime, eventType = 'open_date') => {
  const userId = getClientId();
  try {
    const res = await client.post(`/ipo/${id}/reminder`, null, {
      params: { reminder_time: reminderTime, event_type: eventType, user_id: userId }
    });
    
    // Save to local storage cache as well
    if (typeof window !== 'undefined' && window.localStorage) {
      const local = JSON.parse(localStorage.getItem('captrack_local_reminders') || '[]');
      const newRem = {
        reminder_id: res.data?.reminder_id || Date.now(),
        ipo_id: id,
        ipo_name: res.data?.ipo_name || `IPO #${id}`,
        symbol: res.data?.symbol || 'IPO',
        event_type: eventType,
        reminder_time: reminderTime,
        is_notified: false,
        user_id: userId
      };
      localStorage.setItem('captrack_local_reminders', JSON.stringify([...local.filter(r => r.reminder_id !== newRem.reminder_id), newRem]));
    }

    return res.data;
  } catch (err) {
    console.warn("Backend error setting reminder, fallback to local storage:", err.message);
    const newRem = {
      reminder_id: Date.now(),
      ipo_id: id,
      event_type: eventType,
      reminder_time: reminderTime,
      is_notified: false,
      user_id: userId
    };
    if (typeof window !== 'undefined' && window.localStorage) {
      const local = JSON.parse(localStorage.getItem('captrack_local_reminders') || '[]');
      localStorage.setItem('captrack_local_reminders', JSON.stringify([...local, newRem]));
    }
    return { message: "Reminder scheduled locally", reminder_time: reminderTime, reminder_id: newRem.reminder_id };
  }
};

export const deleteReminder = async (reminderId) => {
  const userId = getClientId();
  // Remove from localStorage
  if (typeof window !== 'undefined' && window.localStorage) {
    const local = JSON.parse(localStorage.getItem('captrack_local_reminders') || '[]');
    const filtered = local.filter(r => r.reminder_id !== reminderId);
    localStorage.setItem('captrack_local_reminders', JSON.stringify(filtered));
  }
  
  try {
    const res = await client.delete(`/reminders/${reminderId}`, { params: { user_id: userId } });
    return res.data;
  } catch (err) {
    console.warn("Backend error deleting reminder:", err.message);
    return { status: "success", deleted_id: reminderId };
  }
};

export const fetchWatchlist = async () => {
  try {
    const userId = getClientId();
    const res = await client.get('/watchlist', { params: { user_id: userId } });
    return res.data;
  } catch (err) {
    return FALLBACK_IPOS.filter(i => i.is_watched).map(ipo => ({
      watchlist_id: ipo.id,
      ipo: ipo,
      latest_gmp: ipo.latest_gmp,
      est_listing_gain_percent: ipo.est_listing_gain_percent,
      total_subscription_x: ipo.total_subscription_x
    }));
  }
};

export const fetchReminders = async () => {
  const userId = getClientId();
  try {
    const res = await client.get('/reminders', { params: { user_id: userId } });
    const remoteReminders = res.data || [];
    
    // Merge with local storage if offline or additional
    let localReminders = [];
    if (typeof window !== 'undefined' && window.localStorage) {
      localReminders = JSON.parse(localStorage.getItem('captrack_local_reminders') || '[]');
    }

    const map = new Map();
    remoteReminders.forEach(r => map.set(r.reminder_id, r));
    localReminders.forEach(r => {
      if (!map.has(r.reminder_id)) {
        map.set(r.reminder_id, r);
      }
    });

    return Array.from(map.values());
  } catch (err) {
    console.warn("Backend reminders error, using local storage:", err.message);
    if (typeof window !== 'undefined' && window.localStorage) {
      return JSON.parse(localStorage.getItem('captrack_local_reminders') || '[]');
    }
    return [];
  }
};

