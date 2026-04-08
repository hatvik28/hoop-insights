/** ESPN CDN team logos (500px). Use abbreviation e.g. LAL, BOS. */
export const teamLogoUrl = (abbr: string | null | undefined) =>
  abbr ? `https://a.espncdn.com/i/teamlogos/nba/500/${abbr}.png` : null;

/** Player avatar: initials-based (reliable, no external ID needed). */
export const playerAvatarUrl = (name: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=96&background=1e3a5f&color=fff&bold=true&format=svg`;
