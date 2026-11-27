import type { Os } from './releases';

export function detectOs(): Os | null {
  const browser = navigator as Navigator & { userAgentData?: { platform?: string } };
  const platform = (browser.userAgentData?.platform || browser.platform || browser.userAgent).toLowerCase();
  if (/android|iphone|ipad/i.test(browser.userAgent)) return null;
  if (platform.includes('win')) return 'windows';
  if (platform.includes('mac')) return 'macos';
  if (platform.includes('linux') || platform.includes('x11')) return 'linux';
  return null;
}
