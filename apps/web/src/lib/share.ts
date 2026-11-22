import type { Dict } from "@/i18n";

/** X の投稿画面を開くURL。文章とリンクが入った状態で開き、投稿前に編集できる */
export function xShareUrl({
  t,
  title,
  moodLabel,
  pageUrl,
}: {
  t: Dict;
  title: string;
  moodLabel?: string;
  pageUrl: string;
}): string {
  const text = moodLabel ? t.share.withMood(moodLabel, title) : t.share.plain(title);
  const params = new URLSearchParams({ text, url: pageUrl, hashtags: t.share.hashtag });
  return `https://x.com/intent/tweet?${params}`;
}
