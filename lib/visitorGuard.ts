const BOT_PATTERN =
  /(bot|crawl|spider|slurp|headless|bingpreview|facebookexternalhit|slackbot|telegrambot|whatsapp|discordbot|python-requests|curl|wget|axios|node-fetch|google-inspectiontool)/i;

/** 봇/스크립트/빈 User-Agent면 true(집계 스킵 대상). */
export function isBotUserAgent(ua: string): boolean {
  if (!ua || ua.trim() === '') return true;
  return BOT_PATTERN.test(ua);
}
