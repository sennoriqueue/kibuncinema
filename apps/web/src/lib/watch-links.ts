/**
 * 配信サービスの名前（TMDB の provider_name）から、そのサービスで作品名を検索するURLを作る。
 *
 * TMDB の API は作品ページへの直リンクを返さないため、各サービスの検索結果に飛ばす。
 * 国（region）によってサイトのアドレスが違うものは、国ごとに分ける。
 * 一覧にないサービスは null を返す（画面では TMDB の視聴ページに飛ばす）。
 * 各サービスの URL の形は変わることがあるので、リンクが切れたらここを直す。
 */
type Region = "JP" | "US" | "KR";

const AMAZON: Record<Region, string> = {
  JP: "https://www.amazon.co.jp/s?k={q}&i=instant-video",
  US: "https://www.amazon.com/s?k={q}&i=instant-video",
  KR: "https://www.primevideo.com/search?phrase={q}",
};

const SEARCH_URLS: { match: RegExp; url: (q: string, region: Region) => string }[] = [
  { match: /^netflix/i, url: (q) => `https://www.netflix.com/search?q=${q}` },
  { match: /amazon prime video|^amazon video/i, url: (q, r) => AMAZON[r].replace("{q}", q) },
  { match: /^u-next/i, url: (q) => `https://video.unext.jp/freeword?query=${q}` },
  { match: /^disney plus|^disney\+/i, url: (q) => `https://www.disneyplus.com/search?q=${q}` },
  { match: /^apple tv/i, url: (q, r) => `https://tv.apple.com/${r.toLowerCase()}/search?term=${q}` },
  { match: /^google play/i, url: (q) => `https://play.google.com/store/search?q=${q}&c=movies` },
  { match: /^youtube/i, url: (q) => `https://www.youtube.com/results?search_query=${q}` },
  { match: /^abema/i, url: (q) => `https://abema.tv/search?q=${q}` },
];

export function providerSearchUrl(providerName: string, title: string, region: string): string | null {
  const r: Region = region === "US" || region === "KR" ? region : "JP";
  const hit = SEARCH_URLS.find((s) => s.match.test(providerName));
  return hit ? hit.url(encodeURIComponent(title), r) : null;
}

/** 表示名を短くする（TMDB の名前は "Amazon Prime Video with Ads" のように長いことがある） */
export function providerLabel(name: string): string {
  return name.replace(/\s+with ads$/i, "").replace(/^Amazon Prime Video$/i, "Prime Video");
}
