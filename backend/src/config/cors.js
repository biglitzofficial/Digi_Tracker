const config = require('./index');

function getAllowedOrigins() {
  const origins = [...config.cors.origin];
  if (config.appUrl) {
    try {
      const appOrigin = new URL(config.appUrl).origin;
      if (!origins.includes(appOrigin)) origins.push(appOrigin);
    } catch {
      // ignore invalid APP_URL
    }
  }
  return origins;
}

function getAllowedDomainSuffixes() {
  const suffixes = new Set();
  if (config.cors.allowedDomain) suffixes.add(config.cors.allowedDomain);

  for (const origin of getAllowedOrigins()) {
    try {
      const { hostname } = new URL(origin);
      const parts = hostname.split('.').filter(Boolean);
      if (parts.length >= 2) suffixes.add(parts.slice(-2).join('.'));
    } catch {
      // ignore invalid origin URL
    }
  }
  return [...suffixes];
}

function isOriginAllowed(origin) {
  if (!origin) return true;

  if (getAllowedOrigins().includes(origin)) return true;

  try {
    const { hostname, protocol } = new URL(origin);
    if (protocol !== 'http:' && protocol !== 'https:') return false;

    for (const suffix of getAllowedDomainSuffixes()) {
      if (hostname === suffix || hostname.endsWith(`.${suffix}`)) return true;
    }
  } catch {
    return false;
  }

  return false;
}

module.exports = { getAllowedOrigins, getAllowedDomainSuffixes, isOriginAllowed };
