/**
* Centralized currency configuration
* This is the single source of truth for all currency-related data
*/
import { COUNTRIES } from './countries';

export interface CurrencyConfig {
    code: string;
    symbol: string;
    name: string;
}

export const CURRENCIES: Record<string, CurrencyConfig> = {
    USD: { code: "USD", symbol: "$", name: "US Dollar" },
    EUR: { code: "EUR", symbol: "€", name: "Euro" },
    GBP: { code: "GBP", symbol: "£", name: "British Pound" },
    PKR: { code: "PKR", symbol: "₨. ", name: "Pakistani Rupee" },
    AZN: { code: "AZN", symbol: "₼", name: "Azerbaijani Manat" },
    INR: { code: "INR", symbol: "₹", name: "Indian Rupee" },
    AED: { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
    SAR: { code: "SAR", symbol: "﷼", name: "Saudi Riyal" },
    BDT: { code: "BDT", symbol: "৳", name: "Bangladeshi Taka" },
    CNY: { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
    JPY: { code: "JPY", symbol: "¥", name: "Japanese Yen" },
    KRW: { code: "KRW", symbol: "₩", name: "South Korean Won" },
    SGD: { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
    MYR: { code: "MYR", symbol: "RM", name: "Malaysian Ringgit" },
    THB: { code: "THB", symbol: "฿", name: "Thai Baht" },
    IDR: { code: "IDR", symbol: "Rp", name: "Indonesian Rupiah" },
    PHP: { code: "PHP", symbol: "₱", name: "Philippine Peso" },
    VND: { code: "VND", symbol: "₫", name: "Vietnamese Dong" },
    EGP: { code: "EGP", symbol: "E£", name: "Egyptian Pound" },
    ZAR: { code: "ZAR", symbol: "R", name: "South African Rand" },
    NGN: { code: "NGN", symbol: "₦", name: "Nigerian Naira" },
    KES: { code: "KES", symbol: "KSh", name: "Kenyan Shilling" },
    BRL: { code: "BRL", symbol: "R$", name: "Brazilian Real" },
    MXN: { code: "MXN", symbol: "$", name: "Mexican Peso" },
    ARS: { code: "ARS", symbol: "$", name: "Argentine Peso" },
    CLP: { code: "CLP", symbol: "$", name: "Chilean Peso" },
    COP: { code: "COP", symbol: "$", name: "Colombian Peso" },
    PEN: { code: "PEN", symbol: "S/.", name: "Peruvian Sol" },
    NZD: { code: "NZD", symbol: "$", name: "New Zealand Dollar" },
    CAD: { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
    AUD: { code: "AUD", symbol: "A$", name: "Australian Dollar" },
};

/**
* Get currency symbol for a given currency code
*/
export function getCurrencySymbol(currencyCode: string = "USD"): string {
    return CURRENCIES[currencyCode]?.symbol || currencyCode;
}

/**
* Get currency name for a given currency code
*/
export function getCurrencyName(currencyCode: string = "USD"): string {
    return CURRENCIES[currencyCode]?.name || currencyCode;
}

/**
* Get full currency config for a given currency code
*/
export function getCurrencyConfig(
    currencyCode: string = "USD"
): CurrencyConfig {
    return CURRENCIES[currencyCode] || CURRENCIES.USD;
}

/**
* Get all available currencies as an array
*/
export function getAllCurrencies(): CurrencyConfig[] {
    return Object.values(CURRENCIES);
}

/**
* Get currency codes as an array
*/
export function getCurrencyCodes(): string[] {
    return Object.keys(CURRENCIES);
}

/**
 * Format price using the restaurant's country currency.
 * 
 * @param amount - The price amount
 * @param countryCode - The country code of the restaurant (e.g. 'US', 'PK')
 * @returns Formatted price string
 */
export function formatPrice(amount: any, currencyOrCountryCode?: string | null): string {
    // Robustly handle string amounts like "$15" by stripping non-numeric characters
    let numericAmount = amount;
    if (typeof amount === 'string') {
        numericAmount = amount.replace(/[^0-9.]/g, '');
    }
    
    const safeAmount = Number(numericAmount || 0);

    if (isNaN(safeAmount)) {
        return currencyOrCountryCode ? `${getCurrencySymbol(currencyOrCountryCode)}0.00` : "$0.00";
    }

    if (!currencyOrCountryCode) {
        // If amount already had a symbol, it's partially formatted, return as-is with basic normalization
        return `$${safeAmount.toFixed(2)}`;
    }

    // 1. Check if it's a valid Currency Code (e.g. "AZN")
    if (CURRENCIES[currencyOrCountryCode]) {
        const symbol = CURRENCIES[currencyOrCountryCode].symbol;
        const spacing = symbol.length > 1 && !symbol.endsWith(' ') ? ' ' : '';
        return `${symbol}${spacing}${safeAmount.toFixed(2)}`;
    }

    // 2. If it's a 3-letter code but not in our list, use it as the symbol
    if (currencyOrCountryCode.length === 3) {
        return `${currencyOrCountryCode} ${safeAmount.toFixed(2)}`;
    }

    // 3. Check if it's a valid Country Code (e.g. "AZ") -> Resolve to Currency Code
    const country = COUNTRIES.find(c => c.code === currencyOrCountryCode);
    if (country) {
        const currencyCode = country.currencyCode;
        const symbol = getCurrencySymbol(currencyCode);
        const spacing = symbol.length > 1 && !symbol.endsWith(' ') ? ' ' : '';
        return `${symbol}${spacing}${safeAmount.toFixed(2)}`;
    }

    // Fallback: Use the code provided as prefix or USD if all else fails
    return `${currencyOrCountryCode} ${safeAmount.toFixed(2)}`;
}

/**
 * Get Currency Symbol from Country Code
 */
export function getSymbolFromCountry(countryCode?: string | null): string {
    if (!countryCode) return "$";
    const country = COUNTRIES.find(c => c.code === countryCode);
    const currencyCode = country ? country.currencyCode : "USD";
    return getCurrencySymbol(currencyCode);
}
