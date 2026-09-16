function drawPixelSprite(ctx, x, y, matrix, palette, pixelSize = 3) {
  if (!matrix || !matrix.length) return;
  const startX = Math.floor(x - (matrix[0].length * pixelSize) / 2);
  const startY = Math.floor(y - (matrix.length * pixelSize) / 2);

  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[r].length; c++) {
      const char = matrix[r][c];
      if (char !== '.' && palette && palette[char]) {
        ctx.fillStyle = palette[char];
        ctx.fillRect(startX + c * pixelSize, startY + r * pixelSize, pixelSize, pixelSize);
      }
    }
  }
}

const palettes = {
  hero: {
    's': '#cccccc',
    'd': '#333333',
    'm': '#4a3728',
    'w': '#ffffff',
    'y': '#ffd700',
    'b': '#4169e1',
    'g': '#228b22',
    'r': '#8b0000',
    'p': '#800080',
    'f': '#ffdead',
    'k': '#111111'
  },
  monster: {
    'g': '#4d6350',
    'y': '#ffd700',
    'r': '#d1231b',
    'k': '#111111',
    'b': '#8b4513',
    't': '#deb887',
    'B': '#7a1515',
    'S': '#a0522d',
    's': '#a0522d',
    'M': '#708090',
    'a': '#5f9ea0',
    'f': '#f5deb3'
  }
};

const heroSprites = {
  warrior: [
    "....ssss..",
    "...ssddss.",
    "..sfffffs.",
    "..sfffff..",
    "..mmmmmm..",
    ".smmssmms.",
    ".smssssms.",
    "..s....s..",
    "..s....s..",
    ".ss....ss."
  ],
  paladin: [
    "....yyyy..",
    "...yssssy.",
    "..sfffffs.",
    "..sfyyff..",
    "..mmymmm..",
    ".smyyymms.",
    ".smssssms.",
    "..s....s..",
    "..s....s..",
    ".ss....ss."
  ],
  rogue: [
    "....gggg..",
    "...ggggg..",
    "..gfffffg.",
    "..gfffff..",
    "..gggggg..",
    ".gkkggkk..",
    ".gssssss..",
    "..s....s..",
    "..s....s..",
    ".ss....ss."
  ],
  mage: [
    "....bbbb..",
    "...bbbbbb.",
    "..bfffffb.",
    "..bfffff..",
    "..byyyyy..",
    ".bbbbbbbb.",
    ".bbbbbbbb.",
    "..b....b..",
    "..b....b..",
    ".bb....bb."
  ],
  necro: [
    "....kkkk..",
    "...kkkkkk.",
    "..kfffffk.",
    "..kfffff..",
    "..kkkkkk..",
    ".kkkkkkkk.",
    ".kssssssk.",
    "..s....s..",
    "..s....s..",
    ".ss....ss."
  ],
  druid: [
    "....gggrr.",
    "...grrrrr.",
    "..bfffffb.",
    "..bfffff..",
    "..bbbbbb..",
    ".bbbbbbbb.",
    ".bssssssb.",
    "..b....b..",
    "..b....b..",
    ".bb....bb."
  ]
};

const monsterSprites = {
  zombie: [
    "..gggggg..",
    ".gggggggg.",
    ".gygggygg.",
    ".gggggggg.",
    "..gggggg..",
    "..gg..gg..",
    ".gg....gg.",
    ".gg....gg."
  ],
  fallen: [
    "kk......kk",
    ".kk....kk.",
    "..rrrrrr..",
    ".ryrrryrr.",
    ".rrrrrrrr.",
    "..rrrrrr..",
    "..rr..rr..",
    ".rr....rr."
  ],
  quill_rat: [
    "...bbbbb..",
    "..bbttbbbb",
    ".bbttbbbbb",
    "bbbbbbbbbb",
    ".bbbbbbbb.",
    "..bb..bb.."
  ],
  cleaver: [
    "....BBBBBB....",
    "...BBBBBBBB...",
    "..BBffBBffBB..",
    "..BBfyBBfyBB..",
    "..BBBBBBBBBB..",
    "...SSSSSSSS...",
    "..SSSSSSSSSS..",
    ".SSSSSSSSSSSS.",
    ".SSBBssssBBSS.",
    ".SSBBssssBBSS.",
    "..SSMMMMMMSS..",
    "...MMMMMMMM...",
    "...B......B...",
    "..B........B.."
  ],
  scarab: [
    "..aaaaaa..",
    ".aaaaaaaa.",
    ".aayyyaa..",
    ".aaaaaaaa.",
    "..aaaaaa..",
    ".a.a.aa.a."
  ]
};

window.render8BitEntity = function(ctx, x, y, rawType, direction = 'down') {
  let t = (rawType || '').toLowerCase().trim();
  if (t === 'necromancer') t = 'necro';

  const alias = {
    rotwalker: 'zombie',
    hedge_imp: 'fallen',
    bramble_rat: 'quill_rat',
    fen_chanter: 'fallen',
    sand_scarab: 'scarab',
    dust_jackal: 'quill_rat',
    cinder_nomad: 'fallen',
    web_drone: 'scarab',
    fang_spider: 'scarab',
    temple_cultist: 'fallen',
    ash_raider: 'fallen',
    council_acolyte: 'fallen',
    horn_brute: 'zombie',
    ember_hound: 'quill_rat',
    void_thrall: 'zombie',
    keep_sentinel: 'fallen',
    crypt_warden: 'zombie',
    dune_hollow: 'scarab',
    venom_matron: 'scarab',
    hall_cleaver: 'cleaver',
    butcher: 'cleaver',
    council_shade: 'fallen',
    ash_sovereign: 'cleaver',
    last_ember: 'cleaver',
    fallen_shaman: 'fallen',
    shaman: 'fallen'
  };
  if (alias[t]) t = alias[t];

  let matrix, palette;
  let size = 3;

  if (heroSprites[t]) {
    matrix = heroSprites[t];
    palette = palettes.hero;
  } else if (monsterSprites[t]) {
    matrix = monsterSprites[t];
    palette = palettes.monster;
    if (t === 'cleaver') size = 4;
  } else {
    matrix = heroSprites.warrior;
    palette = palettes.hero;
  }

  drawPixelSprite(ctx, x, y, matrix, palette, size);
};

window.renderEntitySprite = window.render8BitEntity;
