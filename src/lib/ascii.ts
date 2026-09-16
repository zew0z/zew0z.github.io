/** Shared ASCII ornaments - keep these short so they don't dominate mobile. */

export const ZEW0Z_BANNER = [
  '███████╗███████╗██╗    ██╗ ██████╗ ███████╗',
  '╚══███╔╝██╔════╝██║    ██║██╔═████╗╚══███╔╝',
  '  ███╔╝ █████╗  ██║ █╗ ██║██║██╔██║  ███╔╝ ',
  ' ███╔╝  ██╔══╝  ██║███╗██║████╔╝██║ ███╔╝  ',
  '███████╗███████╗╚███╔███╔╝╚██████╔╝███████╗',
  '╚══════╝╚══════╝ ╚══╝╚══╝  ╚═════╝ ╚══════╝',
].join('\n');

export const ZEW0Z_BANNER_SM = [
  '███████╗███████╗██╗    ██╗ ██████╗ ███████╗',
  '╚══███╔╝██╔════╝██║    ██║██╔═████╗╚══███╔╝',
  '  ███╔╝ █████╗  ██║ █╗ ██║██║██╔██║  ███╔╝ ',
  ' ███╔╝  ██╔══╝  ██║███╗██║████╔╝██║ ███╔╝  ',
  '███████╗███████╗╚███╔███╔╝╚██████╔╝███████╗',
  '╚══════╝╚══════╝ ╚══╝╚══╝  ╚═════╝ ╚══════╝',
].join('\n');

export const SKULL = [
  '     .ed"""" """$$$$be.',
  '   -"           ^""**$$$e.',
  ' ."                   \'$$$c',
  '/                      "4$$b',
  'd  3                     $$$$',
  '$  *                   .$$$$$$',
].join('\n');

export const DIVIDER = '────────────────────────────────────────';

export const DIVIDER_HASH = '# # # # # # # # # # # # # # # # # # # #';

export const BOX_TOP = '┌──────────────────────────────────────┐';
export const BOX_BOT = '└──────────────────────────────────────┘';

/** Compact mark for the writeups destination card */
export const WRITEUPS_MARK = [
  '┌─ notes ─┐',
  '│ ▓▓▓░░░░ │',
  '│ ▓▓▓▓▓░░ │',
  '│ ▓▓▓▓▓▓▓ │',
  '│ spoiler │',
  '└─ gated ─┘',
].join('\n');

/** Compact mark for the portfolio destination card */
export const PORTFOLIO_MARK = [
  '┌─ work/ ─┐',
  '│ sectape │',
  '│ shopify │',
  '│ clients │',
  '│ agents  │',
  '└─ ship ──┘',
].join('\n');

export function promptPath(path = '~'): string {
  return `guest@zew0z:${path}$`;
}
