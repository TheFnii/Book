// Dessins du Petit Lenormand : traits d'encre et couleurs douces (repère 100 × 100).
const INK = '#3b2a1a';
const C = {
  red: '#c0564b', rose: '#e3a19a', gold: '#e2b44f', pale: '#f3dc92', green: '#7f9d5a', leaf: '#a9c283',
  blue: '#6f8fb8', sky: '#a9c1dc', grey: '#9aa0ab', light: '#cfd3da', brown: '#9a6a44', tan: '#d2a577',
  cream: '#f7eedb', orange: '#d98a45', purple: '#8f74b0', lilac: '#c4b2dc', dark: '#5d5f6b',
};

const star5 = (cx, cy, r, fill = C.gold) => {
  const p = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    p.push(`${(cx + Math.cos(a) * rr).toFixed(1)} ${(cy + Math.sin(a) * rr).toFixed(1)}`);
  }
  return `<path d="M${p.join('L')}Z" fill="${fill}"/>`;
};
const flower = (x, y, fill, heart = C.gold) => {
  let s = '';
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    s += `<circle cx="${(x + Math.cos(a) * 6).toFixed(1)}" cy="${(y + Math.sin(a) * 6).toFixed(1)}" r="5" fill="${fill}"/>`;
  }
  return s + `<circle cx="${x}" cy="${y}" r="3.6" fill="${heart}"/>`;
};
const bird = (x, y, fill, flip = false) => `<g transform="translate(${x} ${y})${flip ? ' scale(-1 1)' : ''}">
  <path d="M-12 2C-10-8 4-10 10-3C12 4 4 10-4 9C-8 8-11 6-12 2Z" fill="${fill}"/>
  <path d="M-11 3L-20 -2L-18 6Z" fill="${fill}"/>
  <circle cx="8" cy="-6" r="5.5" fill="${fill}"/>
  <path d="M13 -7L19 -5L13 -3" fill="${C.gold}"/>
  <circle cx="9" cy="-7" r="1" fill="${INK}" stroke="none"/>
  <path d="M-4 2C0 -2 4 -2 6 1" fill="none"/>
</g>`;

const ART = {
  1: `<path d="M26 88H74M30 88V81H70V88" fill="${C.tan}"/>
    <path d="M36 81C36 69 41 62 46 56C39 57 30 58 26 52C23 47 26 41 32 38L44 30C46 24 50 20 54 17L56 10L60 16C70 20 76 32 76 46C76 60 70 72 68 81Z" fill="${C.tan}"/>
    <path d="M59 17C67 23 71 33 71 46C71 58 67 68 64 78" fill="none"/>
    <circle cx="49" cy="30" r="2.2" fill="${INK}" stroke="none"/><circle cx="29.5" cy="46" r="1.3" fill="${INK}" stroke="none"/>`,
  2: `<path d="M50 50C54 64 58 76 68 88" fill="none" stroke="${C.green}" stroke-width="4"/>
    ${[0, 120, 240].map((r) => `<g transform="translate(50 48) rotate(${r})"><path d="M0 0C-5-6-19-12-17-23C-15-31-4-31 0-23C4-31 15-31 17-23C19-12 5-6 0 0Z" fill="${C.leaf}"/><path d="M0-3V-19" fill="none" stroke="${C.green}" stroke-width="2"/></g>`).join('')}`,
  3: `<path d="M50 62V14"/><path d="M50 14L62 18L50 22" fill="${C.red}"/>
    <path d="M53 20C66 30 72 44 72 56H53Z" fill="${C.cream}"/><path d="M47 26C38 34 32 46 30 56H47Z" fill="${C.cream}"/>
    <path d="M16 62H84L74 76H26Z" fill="${C.brown}"/>
    <path d="M10 84C18 79 26 89 34 84C42 79 50 89 58 84C66 79 74 89 82 84C85 82 88 82 90 83" fill="none" stroke="${C.blue}" stroke-width="3.4"/>`,
  4: `<path d="M64 38V24H71V44" fill="${C.brown}"/><path d="M26 48V86H74V48" fill="${C.cream}"/>
    <path d="M18 50L50 20L82 50Z" fill="${C.red}"/>
    <path d="M44 86V68H56V86" fill="${C.brown}"/><rect x="30" y="56" width="10" height="10" fill="${C.sky}"/><rect x="60" y="56" width="10" height="10" fill="${C.sky}"/>
    <path d="M12 86H88" fill="none"/>`,
  5: `<path d="M44 88C46 76 46 66 45 56H55C54 66 54 76 56 88Z" fill="${C.brown}"/>
    <path d="M36 88C42 86 44 84 45 80M64 88C58 86 56 84 55 80" fill="none"/>
    <path d="M30 52C16 52 16 32 30 32C30 18 46 12 54 20C63 11 81 19 76 33C89 38 85 58 71 55C64 64 38 64 30 52Z" fill="${C.green}"/>
    <path d="M40 40C44 36 48 36 50 40M58 44C62 40 66 40 68 44M34 46C36 44 38 44 40 46" fill="none" stroke="${C.leaf}" stroke-width="2.4"/>`,
  6: `<path d="M20 50C9 50 9 34 22 34C22 23 38 18 45 27C52 16 70 21 67 34C80 34 80 50 69 50Z" fill="${C.dark}"/>
    <path d="M36 74C26 74 26 60 38 60C38 50 53 46 59 54C66 45 82 50 79 61C90 61 90 74 80 74Z" fill="${C.light}"/>
    <path d="M30 58L27 66M44 82L41 90M62 82L59 90" fill="none" stroke="${C.blue}" stroke-width="2.6"/>`,
  7: `<path d="M24 84C12 84 12 68 24 68H66C80 68 80 50 66 50H38C24 50 24 32 38 32H58" fill="none" stroke="${INK}" stroke-width="11"/>
    <path d="M24 84C12 84 12 68 24 68H66C80 68 80 50 66 50H38C24 50 24 32 38 32H58" fill="none" stroke="${C.green}" stroke-width="6.5"/>
    <ellipse cx="64" cy="31" rx="9" ry="7" fill="${C.green}"/>
    <path d="M73 31L82 28M73 31L82 35" fill="none" stroke="${C.red}" stroke-width="2"/>
    <circle cx="65" cy="28.5" r="1.4" fill="${INK}" stroke="none"/>`,
  8: `<path d="M40 12H60L71 32L62 88H38L29 32Z" fill="${C.brown}"/>
    <path d="M41 18H59L66 33L59 82H41L34 33Z" fill="none" stroke="${C.tan}" stroke-width="1.6"/>
    <path d="M50 30V58M42 39H58" fill="none" stroke="${C.cream}" stroke-width="3.2"/>`,
  9: `<path d="M44 90L40 52M50 90V46M56 90L62 52" fill="none" stroke="${C.green}" stroke-width="3"/>
    <path d="M38 64C30 60 28 54 30 50C36 52 40 56 42 62M62 64C70 60 72 54 70 50C64 52 60 56 58 62" fill="${C.leaf}" stroke="${C.green}" stroke-width="2"/>
    <g stroke="${INK}" stroke-width="1.6">${flower(38, 44, C.rose)}${flower(62, 44, C.rose)}${flower(50, 30, C.lilac, C.pale)}</g>
    <path d="M42 74L58 82M58 74L42 82" fill="none" stroke="${C.red}" stroke-width="3.4"/>`,
  10: `<path d="M64 90C59 64 57 40 61 14" fill="none" stroke="${C.brown}" stroke-width="5"/>
    <path d="M61 14C61 14 60 90 64 90" fill="none"/>
    <path d="M60 15C44 10 24 16 13 32C28 25 44 23 59 25Z" fill="${C.light}"/>
    <path d="M57 52H72" fill="none" stroke="${C.brown}" stroke-width="5"/>`,
  11: `<path d="M24 88L44 60" fill="none" stroke="${INK}" stroke-width="9"/>
    <path d="M24 88L44 60" fill="none" stroke="${C.brown}" stroke-width="5"/>
    <circle cx="45" cy="59" r="3.4" fill="${C.gold}"/>
    <path d="M46 58C60 38 84 42 78 57C72 70 52 62 60 45C66 32 80 24 88 16" fill="none" stroke-width="2.6"/>
    <path d="M86 14L92 12M87 18L93 20" fill="none" stroke-width="2"/>`,
  12: `<path d="M10 72C36 64 62 68 90 58" fill="none" stroke="${C.brown}" stroke-width="4"/>
    <path d="M70 64L78 52M30 68L24 60" fill="none" stroke="${C.brown}" stroke-width="3"/>
    <g stroke-width="2.2">${bird(34, 54, C.sky)}${bird(66, 50, C.gold, true)}</g>`,
  13: `<path d="M70 58C74 48 72 40 76 30" fill="none" stroke-width="1.6"/><circle cx="77" cy="22" r="8" fill="${C.red}"/>
    <circle cx="48" cy="30" r="11" fill="${C.cream}"/>
    <path d="M38 26C40 16 56 14 59 26C54 22 46 22 38 26Z" fill="${C.tan}"/>
    <path d="M38 44H58L66 76H30Z" fill="${C.rose}"/>
    <path d="M40 50L28 60M58 50L70 58M42 76V88M54 76V88" fill="none"/>
    <circle cx="44" cy="31" r="1.2" fill="${INK}" stroke="none"/><circle cx="52" cy="31" r="1.2" fill="${INK}" stroke="none"/>
    <path d="M45 36C47 38 49 38 51 36" fill="none" stroke-width="1.6"/>`,
  14: `<path d="M50 82L30 54L25 20L42 36H58L75 20L70 54Z" fill="${C.orange}"/>
    <path d="M30 26L38 36M70 26L62 36" fill="none" stroke-width="2"/>
    <path d="M50 82L36 60L50 64L64 60Z" fill="${C.cream}"/>
    <path d="M38 50L45 52M62 50L55 52" fill="none" stroke-width="2.6"/>
    <circle cx="50" cy="79" r="3" fill="${INK}" stroke="none"/>`,
  15: `<circle cx="29" cy="31" r="10" fill="${C.brown}"/><circle cx="71" cy="31" r="10" fill="${C.brown}"/>
    <circle cx="29" cy="31" r="4.5" fill="${C.tan}" stroke="none"/><circle cx="71" cy="31" r="4.5" fill="${C.tan}" stroke="none"/>
    <circle cx="50" cy="55" r="27" fill="${C.brown}"/>
    <ellipse cx="50" cy="66" rx="13" ry="10" fill="${C.tan}"/>
    <ellipse cx="50" cy="61" rx="5" ry="3.6" fill="${INK}" stroke="none"/>
    <circle cx="40" cy="48" r="2.2" fill="${INK}" stroke="none"/><circle cx="60" cy="48" r="2.2" fill="${INK}" stroke="none"/>
    <path d="M50 65V70M45 72C48 74 52 74 55 72" fill="none" stroke-width="2"/>`,
  16: `${star5(50, 44, 21)}${star5(22, 22, 9, C.pale)}${star5(79, 24, 10, C.pale)}${star5(26, 76, 8, C.pale)}${star5(75, 74, 11)}
    <circle cx="36" cy="58" r="1.6" fill="${INK}" stroke="none"/><circle cx="64" cy="14" r="1.6" fill="${INK}" stroke="none"/><circle cx="50" cy="84" r="1.6" fill="${INK}" stroke="none"/><circle cx="86" cy="50" r="1.6" fill="${INK}" stroke="none"/><circle cx="14" cy="48" r="1.6" fill="${INK}" stroke="none"/>`,
  17: `<path d="M44 58L44 88M52 58L56 72L48 74" fill="none" stroke="${C.red}" stroke-width="3"/>
    <path d="M24 44C28 36 44 32 58 38C66 42 66 52 58 58C46 64 30 58 24 44Z" fill="${C.cream}"/>
    <path d="M24 44C30 50 40 54 50 52C40 58 30 56 24 44Z" fill="${INK}"/>
    <path d="M18 42L26 44L22 50" fill="${C.cream}"/>
    <path d="M58 40C66 32 66 24 62 18" fill="none" stroke-width="5"/>
    <path d="M58 40C66 32 66 24 62 18" fill="none" stroke="${C.cream}" stroke-width="2"/>
    <circle cx="62" cy="16" r="5.5" fill="${C.cream}"/>
    <path d="M66 14L86 20L66 19Z" fill="${C.orange}"/>
    <circle cx="62" cy="15" r="1.1" fill="${INK}" stroke="none"/>`,
  18: `<path d="M31 32C18 30 15 52 22 62C28 58 30 48 33 42Z" fill="${C.brown}"/><path d="M69 32C82 30 85 52 78 62C72 58 70 48 67 42Z" fill="${C.brown}"/>
    <path d="M32 34C32 20 68 20 68 34V56C68 72 32 72 32 56Z" fill="${C.tan}"/>
    <ellipse cx="50" cy="59" rx="12" ry="9" fill="${C.cream}"/>
    <ellipse cx="50" cy="54" rx="4.6" ry="3.4" fill="${INK}" stroke="none"/>
    <circle cx="41" cy="44" r="2.4" fill="${INK}" stroke="none"/><circle cx="59" cy="44" r="2.4" fill="${INK}" stroke="none"/>
    <path d="M47 64C48 69 52 69 53 64Z" fill="${C.red}" stroke-width="1.6"/>
    <path d="M34 72C44 78 56 78 66 72" fill="none" stroke="${C.red}" stroke-width="4"/><circle cx="50" cy="80" r="3.4" fill="${C.gold}"/>`,
  19: `<path d="M36 88V34H64V88Z" fill="${C.light}"/>
    <path d="M31 36V20H38V26H45V20H55V26H62V20H69V36Z" fill="${C.grey}"/>
    <path d="M46 54V46A4 4 0 0 1 54 46V54Z" fill="${C.sky}"/>
    <path d="M44 88V76A6 6 0 0 1 56 76V88" fill="${C.brown}"/>
    <path d="M50 20V8L60 11L50 14" fill="${C.red}"/>
    <path d="M36 64H44M56 64H64M40 44H44" fill="none" stroke-width="1.6"/>`,
  20: `<path d="M8 86H92" fill="none"/>
    <path d="M28 66V86M72 62V86" fill="none" stroke="${C.brown}" stroke-width="4"/>
    <circle cx="28" cy="52" r="15" fill="${C.green}"/><circle cx="72" cy="46" r="17" fill="${C.green}"/>
    <path d="M38 74H62M40 70H60M42 74V84M58 74V84" fill="none" stroke="${C.brown}" stroke-width="2.6"/>
    <g stroke-width="1.4">${flower(16, 84, C.rose)}${flower(86, 84, C.lilac, C.pale)}</g>`,
  21: `<path d="M6 86L36 28L50 52L63 34L94 86Z" fill="${C.grey}"/>
    <path d="M36 28L27 46L33 43L38 48L44 40Z" fill="#fff"/>
    <path d="M63 34L56 46L61 44L65 48L69 43Z" fill="#fff"/>`,
  22: `<path d="M50 92V58L26 16M50 58L74 16" fill="none" stroke="${INK}" stroke-width="14"/>
    <path d="M50 92V58L26 16M50 58L74 16" fill="none" stroke="${C.cream}" stroke-width="9"/>
    <path d="M50 88V78M50 70V64M44 48L40 41M56 48L60 41M34 30L31 25M66 30L69 25" fill="none" stroke="${C.tan}" stroke-width="2"/>
    <path d="M70 90V56" fill="none" stroke="${C.brown}" stroke-width="3"/>
    <path d="M70 60H84L88 64L84 68H70Z" fill="${C.tan}" stroke-width="2"/><path d="M70 72H58L54 76L58 80H70Z" fill="${C.tan}" stroke-width="2"/>`,
  23: `<path d="M22 72C22 52 42 44 60 50C70 54 76 62 78 68L86 72L77 75C66 80 32 82 22 72Z" fill="${C.grey}"/>
    <circle cx="59" cy="47" r="8" fill="${C.light}"/><circle cx="59" cy="47" r="4" fill="${C.rose}" stroke="none"/>
    <circle cx="72" cy="63" r="1.8" fill="${INK}" stroke="none"/><circle cx="86" cy="72" r="2" fill="${C.rose}" stroke="none"/>
    <path d="M22 72C10 70 10 86 24 86C32 86 30 78 22 80" fill="none" stroke-width="2.4"/>
    <path d="M80 70L92 66M80 74L92 76" fill="none" stroke-width="1.4"/>`,
  24: `<path d="M50 86C20 64 11 47 17 34C23 20 42 18 50 32C58 18 77 20 83 34C89 47 80 64 50 86Z" fill="${C.red}"/>
    <path d="M28 34C31 29 36 28 40 30" fill="none" stroke="${C.rose}" stroke-width="3"/>`,
  25: `<circle cx="50" cy="60" r="23" fill="none" stroke="${INK}" stroke-width="11"/>
    <circle cx="50" cy="60" r="23" fill="none" stroke="${C.gold}" stroke-width="6.5"/>
    <path d="M50 20L61 31L50 42L39 31Z" fill="${C.sky}"/>
    <path d="M39 31H61M50 20L45 31L50 42L55 31Z" fill="none" stroke-width="1.4"/>
    <path d="M72 18L74 24L80 26L74 28L72 34L70 28L64 26L70 24Z" fill="${C.pale}" stroke-width="1.4"/>`,
  26: `<path d="M24 20H70C74 20 76 22 76 26V80C76 84 74 86 70 86H24Z" fill="${C.red}"/>
    <path d="M24 20C20 20 20 24 20 28V82C20 84 22 86 24 86" fill="${C.cream}"/>
    <path d="M30 20V86" fill="none" stroke-width="2"/>
    <rect x="68" y="46" width="14" height="12" rx="2" fill="${C.gold}"/>
    <circle cx="50" cy="52" r="10" fill="none" stroke="${C.gold}" stroke-width="2.4"/>${star5(50, 52, 5.5)}`,
  27: `<path d="M16 30H84V76H16Z" fill="${C.cream}"/>
    <path d="M16 30L50 57L84 30" fill="none"/><path d="M16 76L42 54M84 76L58 54" fill="none" stroke-width="2"/>
    <circle cx="50" cy="57" r="7.5" fill="${C.red}"/>
    <path d="M47 57H53M50 54V60" fill="none" stroke="${C.rose}" stroke-width="1.6"/>`,
  28: `<path d="M22 88C22 66 35 55 50 55C65 55 78 66 78 88Z" fill="${C.blue}"/>
    <path d="M50 55L45 62L50 80L55 62Z" fill="${C.red}"/>
    <path d="M42 55L50 64L58 55" fill="${C.cream}" stroke-width="2"/>
    <circle cx="50" cy="38" r="13" fill="${C.cream}"/>
    <path d="M30 25H70M37 25V8H63V25" fill="${INK}"/><path d="M37 20H63" fill="none" stroke="${C.red}" stroke-width="2.6"/>
    <circle cx="45" cy="38" r="1.4" fill="${INK}" stroke="none"/><circle cx="55" cy="38" r="1.4" fill="${INK}" stroke="none"/>
    <path d="M45 44C48 46 52 46 55 44" fill="none" stroke-width="1.6"/>`,
  29: `<path d="M35 36C32 16 68 16 65 36C67 50 64 60 60 62H40C36 60 33 50 35 36Z" fill="${C.brown}"/>
    <path d="M24 88C24 67 37 57 50 57C63 57 76 67 76 88Z" fill="${C.purple}"/>
    <circle cx="50" cy="36" r="12" fill="${C.cream}"/>
    <path d="M38 32C42 22 58 22 62 32C56 27 44 27 38 32Z" fill="${C.brown}"/>
    <path d="M42 61C46 66 54 66 58 61" fill="none" stroke="${C.gold}" stroke-width="2.4"/><circle cx="50" cy="67" r="2.6" fill="${C.gold}"/>
    <circle cx="45.5" cy="37" r="1.3" fill="${INK}" stroke="none"/><circle cx="54.5" cy="37" r="1.3" fill="${INK}" stroke="none"/>
    <path d="M46 42C48 44 52 44 54 42" fill="none" stroke="${C.red}" stroke-width="1.6"/>`,
  30: `<path d="M50 90V40" fill="none" stroke="${C.green}" stroke-width="3.4"/>
    <path d="M50 72C38 68 31 58 31 48C42 52 48 62 50 72ZM50 82C62 78 69 68 69 58C58 62 52 72 50 82Z" fill="${C.leaf}" stroke="${C.green}" stroke-width="2"/>
    <path d="M50 42C40 42 27 36 24 22C36 24 45 31 50 42ZM50 42C60 42 73 36 76 22C64 24 55 31 50 42Z" fill="#fff"/>
    <path d="M50 42C42 32 44 16 50 8C56 16 58 32 50 42Z" fill="#fff"/>
    <path d="M50 42V30M46 42L42 30M54 42L58 30" fill="none" stroke="${C.gold}" stroke-width="1.8"/>`,
  31: `<g stroke="${C.gold}" stroke-width="4">${[...Array(12).keys()].map((i) => {
    const a = (i * Math.PI) / 6;
    const r1 = 27;
    const r2 = i % 2 ? 36 : 42;
    return `<path d="M${(50 + Math.cos(a) * r1).toFixed(1)} ${(50 + Math.sin(a) * r1).toFixed(1)}L${(50 + Math.cos(a) * r2).toFixed(1)} ${(50 + Math.sin(a) * r2).toFixed(1)}"/>`;
  }).join('')}</g>
    <circle cx="50" cy="50" r="20" fill="${C.gold}"/>
    <circle cx="44" cy="46" r="1.6" fill="${INK}" stroke="none"/><circle cx="56" cy="46" r="1.6" fill="${INK}" stroke="none"/>
    <path d="M43 55C47 59 53 59 57 55" fill="none" stroke-width="2"/>`,
  32: `<path d="M60 14C40 17 27 33 27 52C27 72 44 87 65 86C50 78 42 66 42 51C42 35 50 22 60 14Z" fill="${C.pale}"/>
    ${star5(70, 36, 7)}${star5(80, 62, 5)}${star5(64, 58, 3.6)}`,
  33: `<circle cx="31" cy="33" r="15" fill="none" stroke="${INK}" stroke-width="12"/>
    <circle cx="31" cy="33" r="15" fill="none" stroke="${C.gold}" stroke-width="7"/>
    <path d="M42 44L80 82" fill="none" stroke="${INK}" stroke-width="11"/><path d="M42 44L80 82" fill="none" stroke="${C.gold}" stroke-width="6"/>
    <path d="M66 68L57 77L62 82L71 73M74 76L68 82L72 86L78 80" fill="${C.gold}" stroke-width="2.4"/>`,
  34: `<path d="M18 34C28 22 50 22 60 34C50 46 28 46 18 34Z" fill="${C.sky}"/><path d="M60 34L74 24L72 34L74 44Z" fill="${C.sky}"/>
    <circle cx="27" cy="32" r="1.8" fill="${INK}" stroke="none"/><path d="M36 28C40 32 40 36 36 40" fill="none" stroke-width="1.6"/>
    <path d="M82 66C72 54 50 54 40 66C50 78 72 78 82 66Z" fill="${C.blue}"/><path d="M40 66L26 56L28 66L26 76Z" fill="${C.blue}"/>
    <circle cx="73" cy="64" r="1.8" fill="${INK}" stroke="none"/><path d="M64 60C60 64 60 68 64 72" fill="none" stroke-width="1.6"/>
    <circle cx="80" cy="38" r="2.6" fill="none" stroke-width="1.6"/><circle cx="86" cy="30" r="1.8" fill="none" stroke-width="1.4"/><circle cx="18" cy="60" r="2.2" fill="none" stroke-width="1.4"/>`,
  35: `<g fill="none" stroke="${INK}" stroke-width="10"><circle cx="50" cy="17" r="6"/><path d="M50 23V82M36 34H64M22 60C24 76 36 84 50 84C64 84 76 76 78 60"/></g>
    <g fill="none" stroke="${C.blue}" stroke-width="5"><circle cx="50" cy="17" r="6"/><path d="M50 23V82M36 34H64M22 60C24 76 36 84 50 84C64 84 76 76 78 60"/></g>
    <path d="M22 54L14 68L28 66ZM78 54L86 68L72 66Z" fill="${C.blue}"/>`,
  36: `<g stroke="${C.gold}" stroke-width="2" opacity=".8"><path d="M50 8V4M22 22L18 18M78 22L82 18M12 50H6M88 50H94"/></g>
    <path d="M43 12H57V34H77V47H57V90H43V47H23V34H43Z" fill="${C.purple}"/>
    <path d="M47 16V86M27 40H73" fill="none" stroke="${C.lilac}" stroke-width="1.6"/>`,
};

export function cardArt(n) {
  return `<svg class="le-art-svg" viewBox="0 0 100 100" aria-hidden="true"><g fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">${ART[n] || ''}</g></svg>`;
}

// Dos des cartes Lenormand (bordeaux et or).
export function lenormandBackSVG() {
  const sp = (cx, cy, r) => `M${cx} ${cy - r}Q${cx} ${cy} ${cx + r} ${cy}Q${cx} ${cy} ${cx} ${cy + r}Q${cx} ${cy} ${cx - r} ${cy}Q${cx} ${cy} ${cx} ${cy - r}Z`;
  let lattice = '';
  for (let x = -160; x <= 460; x += 26) lattice += `M${x} 0L${x + 320} 512M${x + 320} 0L${x} 512`;
  const corners = [[34, 34], [286, 34], [34, 478], [286, 478]].map(([x, y]) => `<path d="${sp(x, y, 9)}"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" width="640" height="1024">
  <defs>
    <linearGradient id="lg" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="320" y2="512">
      <stop offset="0" stop-color="#8a6424"/><stop offset=".2" stop-color="#f6dc92"/><stop offset=".4" stop-color="#b8883a"/>
      <stop offset=".55" stop-color="#fbe7a8"/><stop offset=".75" stop-color="#a97b30"/><stop offset="1" stop-color="#7d5a1f"/>
    </linearGradient>
    <radialGradient id="lb" cx=".5" cy=".45" r=".75"><stop offset="0" stop-color="#7a2433"/><stop offset=".6" stop-color="#561522"/><stop offset="1" stop-color="#330a13"/></radialGradient>
    <clipPath id="lc"><rect x="26" y="26" width="268" height="460" rx="8"/></clipPath>
  </defs>
  <rect width="320" height="512" rx="18" fill="url(#lb)"/>
  <g clip-path="url(#lc)"><path d="${lattice}" stroke="#e6c27a" stroke-opacity=".13" stroke-width="1.2" fill="none"/></g>
  <g fill="none" stroke="url(#lg)">
    <rect x="11" y="11" width="298" height="490" rx="12" stroke-width="2.6"/>
    <rect x="19" y="19" width="282" height="474" rx="9" stroke-width="1"/>
    <path d="M160 150L250 256L160 362L70 256Z" stroke-width="2.6"/>
    <path d="M160 170L233 256L160 342L87 256Z" stroke-width="1" stroke-dasharray="0 6" stroke-linecap="round"/>
    <circle cx="160" cy="256" r="38" stroke-width="1.6"/>
    <path d="M160 70V132M160 380V442" stroke-width="1.2"/>
  </g>
  <g fill="url(#lg)">
    ${corners}
    <path d="${sp(160, 256, 30)}"/>
    <path d="${sp(160, 92, 10)}"/><path d="${sp(160, 420, 10)}"/>
    <circle cx="160" cy="138" r="4"/><circle cx="160" cy="374" r="4"/>
    <path d="M160 238C150 226 136 236 144 248L160 262L176 248C184 236 170 226 160 238Z" fill="#561522" stroke="url(#lg)" stroke-width="2" transform="translate(0 -6)"/>
  </g>
</svg>`;
}

let backURL = null;
export function lenormandBackURL() {
  if (!backURL) backURL = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(lenormandBackSVG());
  return backURL;
}
