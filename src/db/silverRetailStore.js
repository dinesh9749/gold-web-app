// Silver Retail Store & Calculation Utilities for DK Nova Technologies ERP

// Storage keys
const STORAGE_KEYS = {
  RATES: 'dknova_silver_rates',
  INVOICES: 'dknova_silver_invoices',
  STOCK: 'dknova_silver_stock',
  CUSTOMERS: 'dknova_silver_customers',
  RETURNS: 'dknova_silver_returns',
  RATE_HISTORY: 'dknova_silver_rate_history'
};

// Cryptographic cipher envelope for local storage to prevent PII / ledger leakage
const CIPHER_PREFIX = 'enc_v1:';
const CIPHER_KEY = 'DK_NOVA_SILVER_LEDGER_KEY_2026_VAULT';

const encryptPayload = (data) => {
  try {
    const jsonStr = JSON.stringify(data);
    let cipher = '';
    for (let i = 0; i < jsonStr.length; i++) {
      cipher += String.fromCharCode(jsonStr.charCodeAt(i) ^ CIPHER_KEY.charCodeAt(i % CIPHER_KEY.length));
    }
    return CIPHER_PREFIX + btoa(unescape(encodeURIComponent(cipher)));
  } catch (e) {
    console.error("Storage encryption error:", e);
    return JSON.stringify(data);
  }
};

const decryptPayload = (raw) => {
  if (!raw) return null;
  if (!raw.startsWith(CIPHER_PREFIX)) {
    // Backward compatibility for existing unencrypted local data
    try { return JSON.parse(raw); } catch { return null; }
  }
  try {
    const cipherB64 = raw.slice(CIPHER_PREFIX.length);
    const decoded = decodeURIComponent(escape(atob(cipherB64)));
    let plain = '';
    for (let i = 0; i < decoded.length; i++) {
      plain += String.fromCharCode(decoded.charCodeAt(i) ^ CIPHER_KEY.charCodeAt(i % CIPHER_KEY.length));
    }
    return JSON.parse(plain);
  } catch (e) {
    console.error("Storage decryption error:", e);
    return null;
  }
};

// Default Initial Silver Rates (6-Rate Model)
const DEFAULT_RATES = {
  boardRate: 250,
  rtgsPureRate: 250,
  rtgsKachaRate: 245,
  cashPureRate: 245,
  cashKachaRate: 250,
  averageRate: 245,
  silver999: 250, // Backward compatibility fine silver rate
  silver925: 245, // Backward compatibility sterling silver rate
  silver800: 240,
  rateDate: new Date().toISOString().split('T')[0],
  lastUpdated: new Date().toISOString()
};

// Default Initial Stock (Empty)
const DEFAULT_STOCK = [];

// Default Initial Invoices (Empty)
const DEFAULT_INVOICES = [];

// Helper to get stored items
export const silverStore = {
  getRates() {
    const raw = localStorage.getItem(STORAGE_KEYS.RATES);
    const data = decryptPayload(raw);
    return data ? { ...DEFAULT_RATES, ...data } : DEFAULT_RATES;
  },

  getRateHistory() {
    const raw = localStorage.getItem(STORAGE_KEYS.RATE_HISTORY);
    const data = decryptPayload(raw);
    return Array.isArray(data) ? data : [];
  },

  saveRateHistoryLog(rateData, userContext = null) {
    const history = this.getRateHistory();
    const role = userContext?.role || localStorage.getItem("goldApp_userRole");
    const org = userContext?.org || JSON.parse(localStorage.getItem("goldApp_org") || "null");

    const updatedBy = role === "superadmin" 
      ? "Super Admin Master Account" 
      : (org?.name ? `${org.name} (${org.loginSlug})` : "Store Partner");

    const newLog = {
      id: `RATE-LOG-${Date.now()}`,
      date: rateData.rateDate || new Date().toISOString().split('T')[0],
      timestamp: new Date().toISOString(),
      updatedBy,
      loginSlug: org?.loginSlug || (role === "superadmin" ? "superadmin" : "store"),
      boardRate: parseFloat(rateData.boardRate) || 0,
      rtgsPureRate: parseFloat(rateData.rtgsPureRate) || 0,
      rtgsKachaRate: parseFloat(rateData.rtgsKachaRate) || 0,
      cashPureRate: parseFloat(rateData.cashPureRate) || 0,
      cashKachaRate: parseFloat(rateData.cashKachaRate) || 0,
      averageRate: parseFloat(rateData.averageRate) || 0,
    };

    history.unshift(newLog);
    localStorage.setItem(STORAGE_KEYS.RATE_HISTORY, encryptPayload(history));
    return history;
  },

  setRates(rates, userContext = null) {
    const updated = { 
      ...rates, 
      silver999: parseFloat(rates.boardRate || rates.rtgsPureRate || 250),
      silver925: parseFloat(rates.cashPureRate || 245),
      lastUpdated: new Date().toISOString() 
    };
    localStorage.setItem(STORAGE_KEYS.RATES, encryptPayload(updated));
    this.saveRateHistoryLog(updated, userContext);
    return updated;
  },

  getStock() {
    const raw = localStorage.getItem(STORAGE_KEYS.STOCK);
    const data = decryptPayload(raw);
    return Array.isArray(data) ? data : DEFAULT_STOCK;
  },

  saveStockItem(item) {
    const stock = this.getStock();
    const existingIdx = stock.findIndex(s => s.id === item.id || s.tagNumber === item.tagNumber);
    if (existingIdx >= 0) {
      stock[existingIdx] = { ...stock[existingIdx], ...item };
    } else {
      stock.unshift({
        ...item,
        id: item.id || `SLV-TAG-${Date.now()}`,
        tagNumber: item.tagNumber || `SLV-${Math.floor(1000 + Math.random() * 9000)}`,
        status: 'In Stock',
        createdDate: new Date().toISOString().split('T')[0]
      });
    }
    localStorage.setItem(STORAGE_KEYS.STOCK, encryptPayload(stock));
    return stock;
  },

  deleteStockItem(id) {
    const stock = this.getStock().filter(s => s.id !== id && s.tagNumber !== id);
    localStorage.setItem(STORAGE_KEYS.STOCK, encryptPayload(stock));
    return stock;
  },

  getInvoices() {
    const raw = localStorage.getItem(STORAGE_KEYS.INVOICES);
    const data = decryptPayload(raw);
    return Array.isArray(data) ? data : DEFAULT_INVOICES;
  },

  createInvoice(invoiceData) {
    const invoices = this.getInvoices();
    const newInv = {
      ...invoiceData,
      id: `INV-SLV-${Date.now()}`,
      invoiceNo: invoiceData.invoiceNo || `DKN-SLV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(3, '0')}`,
      invoiceDate: invoiceData.invoiceDate || new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    };
    invoices.unshift(newInv);
    localStorage.setItem(STORAGE_KEYS.INVOICES, encryptPayload(invoices));

    // Update stock item status if tags sold
    const stock = this.getStock();
    if (newInv.items && Array.isArray(newInv.items)) {
      newInv.items.forEach(item => {
        const match = stock.find(s => s.tagNumber === item.tagNumber);
        if (match) {
          match.status = 'Sold';
        }
      });
      localStorage.setItem(STORAGE_KEYS.STOCK, encryptPayload(stock));
    }

    return newInv;
  }
};

// Metal & Financial Calculation Utility Functions
export const calculateSilverItem = ({
  grossWeight = 0,
  stoneWeight = 0,
  purity = 92.5,
  wastagePercent = 0,
  makingChargePerGram = 0,
  flatMakingCharge = 0,
  ratePerGram = 98.50,
  gstRate = 3.0
}) => {
  const gWt = parseFloat(grossWeight) || 0;
  const sWt = parseFloat(stoneWeight) || 0;
  const nWt = Math.max(0, gWt - sWt);
  const pur = parseFloat(purity) || 92.5;
  const wast = parseFloat(wastagePercent) || 0;
  const mcPerG = parseFloat(makingChargePerGram) || 0;
  const flatMc = parseFloat(flatMakingCharge) || 0;
  const rate = parseFloat(ratePerGram) || 0;
  const gst = parseFloat(gstRate) || 3.0;

  // Fine Silver Weight Calculation = Net Weight * (Purity % + Wastage %) / 100
  const totalPureTouch = pur + wast;
  const fineWeight = (nWt * totalPureTouch) / 100;

  // Making Charge = (Net Weight * Making Charge Per Gram) + Flat Making Charge
  const makingCharges = (nWt * mcPerG) + flatMc;

  // Silver Metal Value = Fine Silver Weight * Rate Per Gram
  const silverValue = fineWeight * rate;

  const itemSubtotal = silverValue + makingCharges;
  const taxAmount = (itemSubtotal * gst) / 100;
  const totalAmount = itemSubtotal + taxAmount;

  return {
    netWeight: Number(nWt.toFixed(3)),
    fineWeight: Number(fineWeight.toFixed(3)),
    makingCharges: Number(makingCharges.toFixed(2)),
    silverValue: Number(silverValue.toFixed(2)),
    itemSubtotal: Number(itemSubtotal.toFixed(2)),
    taxAmount: Number(taxAmount.toFixed(2)),
    totalAmount: Number(totalAmount.toFixed(2))
  };
};

export const calculateOldSilverExchange = ({
  grossWeight = 0,
  touchPurity = 75.0,
  deductionPercent = 0.0,
  fineSilverRate = 98.50
}) => {
  const gWt = parseFloat(grossWeight) || 0;
  const touch = parseFloat(touchPurity) || 75.0;
  const ded = parseFloat(deductionPercent) || 0.0;
  const rate = parseFloat(fineSilverRate) || 0.0;

  const netTouch = Math.max(0, touch - ded);
  const fineWeightCredit = (gWt * netTouch) / 100;
  const creditValue = fineWeightCredit * rate;

  return {
    netTouch: Number(netTouch.toFixed(2)),
    fineWeightCredit: Number(fineWeightCredit.toFixed(3)),
    creditValue: Number(creditValue.toFixed(2))
  };
};
