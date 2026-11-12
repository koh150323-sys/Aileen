export function formatPrice(price: number, currency: string = 'USD'): string {
  if (currency === '%') {
    return `${price.toFixed(3)}%`;
  }
  
  if (price < 1) {
    return price.toFixed(4);
  } else if (price < 10) {
    return price.toFixed(3);
  } else if (price < 1000) {
    return price.toFixed(2);
  } else {
    return price.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
}

export function formatChange(change: number, currency: string = 'USD'): string {
  const prefix = change > 0 ? '+' : '';
  if (currency === '%') {
    return `${prefix}${change.toFixed(3)}%`;
  }
  if (Math.abs(change) < 0.01) {
    return `${prefix}${change.toFixed(4)}`;
  }
  return `${prefix}${change.toFixed(2)}`;
}

export function formatPercent(percent: number): string {
  const prefix = percent > 0 ? '+' : '';
  return `${prefix}${percent.toFixed(2)}%`;
}

export function formatCompactNumber(num: number | undefined): string {
  if (num === undefined || num === 0) return '—';
  if (num >= 1e12) {
    return `$${(num / 1e12).toFixed(2)}T`;
  }
  if (num >= 1e9) {
    return `$${(num / 1e9).toFixed(2)}B`;
  }
  if (num >= 1e6) {
    return `$${(num / 1e6).toFixed(2)}M`;
  }
  if (num >= 1e3) {
    return `$${(num / 1e3).toFixed(2)}K`;
  }
  return num.toLocaleString('en-US');
}

export function formatVolume(num: number | undefined): string {
  if (!num) return '—';
  if (num >= 1e9) {
    return `${(num / 1e9).toFixed(2)}B`;
  }
  if (num >= 1e6) {
    return `${(num / 1e6).toFixed(2)}M`;
  }
  if (num >= 1e3) {
    return `${(num / 1e3).toFixed(1)}K`;
  }
  return num.toString();
}
