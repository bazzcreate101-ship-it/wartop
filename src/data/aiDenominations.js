const aiImage = (slug) => `/gassets/ai/${slug}.webp`;

const markedUpPrice = (basePrice, markupPercent) => {
  const price = Math.round(basePrice * (1 + markupPercent / 100));
  return { originalPrice: price, price, markupPercent };
};

export const aiDenominations = [
  {
    id: 'ai-chatgpt-go-3-bulan',
    name: 'ChatGPT Go — 3 Bulan',
    ...markedUpPrice(26000, 8),
    points: 28,
    stock: 6,
    accessType: 'Akun private',
    sourceTitle: 'CHATGPT GO 3 BULAN',
    duration: '3 bulan',
    warranty: 'Garansi penuh selama masa aktif',
    image: aiImage('chatgpt-go-3-bulan'),
    description: 'Akun ChatGPT Go private untuk chat harian, rangkuman, ide konten, belajar, dan pekerjaan ringan. Masa aktif 3 bulan; produk berupa akses akun, bukan saldo API.'
  },
  {
    id: 'ai-chatgpt-plus-1-bulan-garansi-5-hari',
    name: 'ChatGPT Plus — 1 Bulan',
    ...markedUpPrice(42000, 6),
    points: 45,
    stock: 12,
    accessType: 'Akun private',
    sourceTitle: 'CHATGPT PLUS',
    duration: '30 hari',
    warranty: 'Garansi login 5 hari',
    image: aiImage('chatgpt-plus-1-bulan-garansi-2-hari'),
    description: 'Akun ChatGPT Plus private untuk coding, analisis file, penulisan, riset, dan produktivitas intensif. Masa aktif 30 hari dengan garansi login 5 hari; bukan kredit OpenAI API.'
  },
  {
    id: 'ai-claude-pro-1-bulan',
    name: 'Claude Pro — 1 Bulan',
    ...markedUpPrice(115000, 11),
    points: 128,
    stock: 10,
    accessType: 'Akun private',
    sourceTitle: 'CLAUDE PRO',
    duration: '30 hari',
    warranty: 'Garansi penuh selama masa aktif',
    image: aiImage('ai-claude-pro'),
    description: 'Akun Claude Pro private untuk membaca dokumen panjang, menyusun tulisan, coding, brainstorming, dan analisis kerja. Cocok untuk penggunaan rutin selama 30 hari.'
  },
  {
    id: 'ai-claude-max-1-bulan',
    name: 'Claude Max — 1 Bulan',
    ...markedUpPrice(980000, 4),
    points: 1019,
    stock: 8,
    accessType: 'Akun private',
    sourceTitle: 'CLAUDE MAX',
    duration: '30 hari',
    warranty: 'Garansi penuh selama masa aktif',
    image: aiImage('ai-claude-pro'),
    description: 'Akun Claude Max private untuk beban kerja lebih intensif seperti riset mendalam, dokumen besar, coding panjang, dan workflow profesional selama 30 hari.'
  },
  {
    id: 'ai-gemini-pro-12-bulan',
    name: 'Gemini Pro — 12 Bulan',
    ...markedUpPrice(96000, 9),
    points: 105,
    stock: 10,
    accessType: 'Aktivasi akun private',
    sourceTitle: 'GEMINI PRO',
    duration: '12 bulan',
    warranty: 'Garansi aktivasi 1 bulan',
    image: aiImage('ai-gemini-pro'),
    description: 'Aktivasi Gemini Pro pada akun private untuk analisis, menulis, belajar, coding, dan produktivitas layanan Google. Masa aktif 12 bulan dengan garansi aktivasi 1 bulan.'
  },
  {
    id: 'ai-gemini-pro-24-bulan',
    name: 'Gemini Pro — 24 Bulan',
    ...markedUpPrice(187000, 5),
    points: 196,
    stock: 9,
    accessType: 'Aktivasi akun private',
    sourceTitle: 'GEMINI PRO',
    duration: '24 bulan',
    warranty: 'Garansi aktivasi 3 bulan',
    image: aiImage('ai-gemini-pro'),
    description: 'Paket jangka panjang Gemini Pro untuk belajar, riset, coding, analisis, dan kerja produktif di ekosistem Google. Masa aktif 24 bulan dengan garansi aktivasi 3 bulan.'
  },
  {
    id: 'ai-grok-plus-1-bulan',
    name: 'Grok Plus — 1 Bulan',
    ...markedUpPrice(47000, 7),
    points: 50,
    stock: 11,
    accessType: 'Akun private',
    sourceTitle: 'GROK PLUS',
    duration: '30 hari',
    warranty: 'Garansi penuh selama masa aktif',
    image: aiImage('ai-grok-super'),
    description: 'Akun Grok Plus private untuk tanya jawab cepat, eksplorasi topik, riset tren, ide konten, dan produktivitas harian selama 30 hari.'
  }
];
