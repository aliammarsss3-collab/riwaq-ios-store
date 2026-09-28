// Adapted from webipagui normalization/grouping and GithubStore release mapping.
// See THIRD_PARTY_NOTICES.md and licenses/ for original MIT notices.
export function httpsURL(value) {
  try { const u = new URL(value); return u.protocol === 'https:' && !u.username && !u.password ? u.href : ''; } catch { return ''; }
}
export function compareVersionsDesc(a, b) {
  const pa = String(a || '').split(/[.\-]/).map(x => parseInt(x, 10));
  const pb = String(b || '').split(/[.\-]/).map(x => parseInt(x, 10));
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = Number.isNaN(pa[i]) || pa[i] === undefined ? 0 : pa[i];
    const nb = Number.isNaN(pb[i]) || pb[i] === undefined ? 0 : pb[i];
    if (na !== nb) return nb - na;
  }
  return String(b || '').localeCompare(String(a || ''));
}
export function validateConfig(config) {
  if (!config || !Array.isArray(config.sources) || !config.name) throw Error('اسم المتجر وقائمة المصادر مطلوبان');
  const ids = new Set();
  for (const s of config.sources) {
    if (!s.id || ids.has(s.id)) throw Error('معرّف المصدر مفقود أو مكرر');
    ids.add(s.id);
    if (!['altstore', 'github'].includes(s.type) || !httpsURL(s.url)) throw Error('نوع المصدر أو رابطه غير صالح');
    if (s.type === 'github' && !/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?$/.test(s.url)) throw Error('أدخل رابط مستودع GitHub فقط');
    if (!Array.isArray(s.apps)) throw Error('قائمة التطبيقات المصرح بها مطلوبة');
    const bundles = new Set();
    for (const a of s.apps) {
      if (!/^[\w-]+(?:\.[\w-]+)+$/.test(a.bundleIdentifier || '') || bundles.has(a.bundleIdentifier)) throw Error('معرّف التطبيق مفقود أو مكرر');
      bundles.add(a.bundleIdentifier);
      if (a.rightsConfirmed !== true || !httpsURL(a.permissionURL) || !a.permissionNote?.trim()) throw Error('يجب تأكيد إذن التوزيع وتوثيقه لكل تطبيق');
      if (!Array.isArray(a.downloadHosts) || !a.downloadHosts.length || a.downloadHosts.some(h => !/^[a-z0-9.-]+$/.test(h) || h.includes('..'))) throw Error('حدد نطاقات التنزيل المسموح بها');
      if (s.type === 'github' && (!a.assetPattern || a.assetPattern === '*')) throw Error('حدد نمط ملف IPA المقصود');
    }
  }
  return config;
}
export function allowedDownload(value, approval) {
  const url = httpsURL(value);
  return url && approval.downloadHosts.includes(new URL(url).hostname) ? url : '';
}
export function normalizeApp(raw, approval, source) {
  const versions = (Array.isArray(raw.versions) && raw.versions.length ? raw.versions : [raw]).map(v => ({
    version: String(v.version || raw.version || 'unknown'),
    date: v.date || raw.date || '', size: Number(v.size ?? raw.size) || 0,
    minOSVersion: String(v.minOSVersion || raw.minOSVersion || ''),
    downloadURL: allowedDownload(v.downloadURL || v.downloadUrl || raw.downloadURL || raw.downloadUrl, approval),
    localizedDescription: String(v.localizedDescription || ''),
    sourceID: source.id, sourceName: source.name || source.id, permissionURL: approval.permissionURL
  })).filter(v => v.downloadURL);
  return { name: String(approval.name || raw.name || approval.bundleIdentifier), bundleIdentifier: approval.bundleIdentifier,
    developerName: String(raw.developerName || raw.developer || ''), subtitle: String(raw.subtitle || ''),
    localizedDescription: String(raw.localizedDescription || raw.description || ''),
    iconURL: httpsURL(raw.iconURL || raw.iconUrl || ''), category: approval.category || 'أدوات', versions };
}
export function normalizeSource(data, source) {
  if (!Array.isArray(data.apps)) throw Error('المصدر لا يحتوي قائمة apps');
  const approvals = new Map(source.apps.map(a => [a.bundleIdentifier, a]));
  return data.apps.flatMap(raw => {
    if (!raw || typeof raw !== 'object') return [];
    const a = approvals.get(raw.bundleIdentifier || raw.bundleID || raw.bundleId);
    return a ? [normalizeApp(raw, a, source)] : [];
  }).filter(a => a.versions.length);
}
export function mergeApps(apps) {
  const grouped = new Map();
  for (const app of apps) {
    if (!grouped.has(app.bundleIdentifier)) grouped.set(app.bundleIdentifier, {...app, versions: []});
    const target = grouped.get(app.bundleIdentifier);
    for (const v of app.versions) if (!target.versions.some(x => x.version === v.version && x.downloadURL === v.downloadURL)) target.versions.push(v);
  }
  for (const app of grouped.values()) app.versions.sort((a,b) => (Date.parse(b.date) || 0) - (Date.parse(a.date) || 0) || compareVersionsDesc(a.version,b.version));
  return [...grouped.values()].sort((a,b) => a.name.localeCompare(b.name, 'ar'));
}
function glob(pattern, name) {
  const escaped = pattern.split('*').map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*');
  return new RegExp('^' + escaped + '$', 'i').test(name);
}
export function fromRelease(release, source) {
  if (release.draft || release.prerelease) throw Error('الإصدار غير مستقر');
  const assets = (release.assets || []).filter(a => /\.ipa$/i.test(a.name || '')).sort((a,b) => Number(/debug|symbols|dsyms/i.test(a.name)) - Number(/debug|symbols|dsyms/i.test(b.name)) || b.size-a.size);
  return source.apps.map(a => {
    const matches = assets.filter(asset => glob(a.assetPattern, asset.name));
    if (matches.length !== 1) throw Error('نمط ملف IPA يجب أن يطابق ملفًا واحدًا لكل تطبيق');
    const asset = matches[0];
    return normalizeApp({name:a.name,developerName:source.url.split('/')[3],iconURL:a.iconURL,
      localizedDescription:release.body || '',versions:[{version:String(release.tag_name || '').replace(/^v/, ''),
      date:release.published_at,downloadURL:asset.browser_download_url,size:asset.size,localizedDescription:release.body || ''}]}, a, source);
  }).filter(a => a.versions.length);
}
