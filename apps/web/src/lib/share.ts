/** X の投稿画面を開くURL。文章とリンクが入った状態で開き、投稿前に編集できる */
export function xShareUrl({
  title,
  moodLabel,
  pageUrl,
}: {
  title: string;
  moodLabel?: string;
  pageUrl: string;
}): string {
  const text = moodLabel
    ? `「${moodLabel}」気分で選んだ今夜の一本は『${title}』`
    : `今夜の一本は『${title}』`;
  const params = new URLSearchParams({ text, url: pageUrl, hashtags: "キブンシネマ" });
  return `https://x.com/intent/tweet?${params}`;
}
