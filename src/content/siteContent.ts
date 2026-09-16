export const site = {
  name: 'Tural Daşdəmirov',
  title: 'Proqramçı və İT tərəfdaşı',
  subtitle: 'Excel təlimçisi',
  location: 'Bakı, Azərbaycan',
  email: 'tural@asanexcel.com',
  phone: '+994 55 814 77 97',
  phoneRaw: '994558147797',
  telUrl: 'tel:+994558147797',
  whatsappUrl: 'https://wa.me/994558147797',
  mailtoUrl: 'mailto:tural@asanexcel.com',
  monogram: 'td.',
} as const;

export const navItems = [
  { label: 'Xidmətlər', href: '#xidmetler' },
  { label: 'Haqqımda', href: '#haqqimda' },
  { label: 'Əlaqə', href: '#elaqe' },
] as const;

export const hero = {
  headline: ['İdeyalarınızı', 'rəqəmsal həllə', 'çevirirəm.'],
  description:
    'Mən Tural. Veb saytlar, AI dəstəkli layihələr və biznes proqramları hazırlayıram. Texnologiyanı işiniz üçün daha faydalı edirəm.',
  ctaPrimary: { label: 'Layihəni danışaq', href: '#elaqe' },
  ctaSecondary: { label: 'Xidmətlərə bax', href: '#xidmetler' },
  availability: 'Layihələr üçün açığam',
} as const;

function whatsAppLink(message: string): string {
  return `${site.whatsappUrl}?text=${encodeURIComponent(message)}`;
}

export const services = [
  {
    id: 'web',
    title: 'Veb saytlar',
    description:
      'Korporativ saytlar, tanıtım səhifələri, portfoliolar və onlayn mağazalar.',
    whatsappMessage: 'Salam, Tural. Veb sayt layihəsi haqqında danışmaq istəyirəm.',
  },
  {
    id: 'panels',
    title: 'İdarəetmə panelləri',
    description:
      'Daxili iş sistemləri, hesabat lövhələri, sifariş və müştəri idarəetmə panelləri.',
    whatsappMessage:
      'Salam, Tural. İdarəetmə paneli layihəsi haqqında danışmaq istəyirəm.',
  },
  {
    id: 'erp',
    title: 'Biznes proqramları',
    description:
      'Stok, alış, satış, müştəri və ödəniş prosesləri üçün ERP/CRM həlləri.',
    whatsappMessage:
      'Salam, Tural. Biznes proqramı (ERP/CRM) layihəsi haqqında danışmaq istəyirəm.',
  },
  {
    id: 'ai',
    title: 'AI dəstəkli layihələr',
    description:
      'AI köməkçiləri, sənəd və məlumat emalı, təkrarlanan işlərin avtomatlaşdırılması.',
    whatsappMessage:
      'Salam, Tural. AI dəstəkli layihə haqqında məlumat almaq istəyirəm.',
  },
  {
    id: 'bots',
    title: 'Telegram botları və inteqrasiyalar',
    description:
      'Sifariş qəbulu, bildiriş və sorğu botları; sistemlər arası məlumat mübadiləsi.',
    whatsappMessage:
      'Salam, Tural. Telegram botu və ya inteqrasiya layihəsi haqqında danışmaq istəyirəm.',
  },
  {
    id: 'mobile',
    title: 'Mobil tətbiqlər',
    description:
      'Biznes prosesləri, sifariş və izləmə üçün Android və iOS tətbiqləri.',
    whatsappMessage:
      'Salam, Tural. Mobil tətbiq layihəsi haqqında danışmaq istəyirəm.',
  },
  {
    id: 'desktop',
    title: 'Masaüstü proqramlar',
    description:
      'Windows üçün uçot, anbar və ofis proseslərini idarə edən proqramlar.',
    whatsappMessage:
      'Salam, Tural. Masaüstü proqram layihəsi haqqında danışmaq istəyirəm.',
  },
  {
    id: 'excel',
    title: 'Excel təlimi və avtomatlaşdırma',
    description:
      'Praktik təlim, avtomatik hesabatlar, makrolar və məlumat emalı həlləri.',
    whatsappMessage:
      'Salam, Tural. Excel təlimi və avtomatlaşdırma haqqında məlumat almaq istəyirəm.',
  },
  {
    id: 'support',
    title: 'Aylıq onlayn İT dəstəyi',
    description:
      'Uzaqdan texniki dəstək; həcm və saatlar müştəriyə görə müəyyən edilir.',
    whatsappMessage:
      'Salam, Tural. Aylıq onlayn İT dəstəyi haqqında danışmaq istəyirəm.',
  },
].map((s) => ({ ...s, whatsappUrl: whatsAppLink(s.whatsappMessage) }));

export const about = {
  paragraphs: [
    'C#/.NET, SQL, Excel təlimi və avtomatlaşdırma sahəsində praktik təcrübəm var. Biznes proseslərini anlayıb, onlara uyğun proqram həlləri qurmağa diqqət yetirirəm.',
    'Hazırda veb və AI layihələri üzərində işləyirəm. Texnologiya seçməzdən əvvəl iş ehtiyacını anlamaq və mərhələli irəliləmək mənim üçün əsas prinsiplərdir.',
    'Excel təlimçisi kimi praktik, tətbiq oluna bilən bilik ötürməyə üstünlük verirəm. Eyni zamanda müştərilərə aylıq onlayn İT dəstəyi təklif edirəm.',
  ],
} as const;

export const contact = {
  headline: 'Növbəti layihənizi birlikdə quraq.',
  description:
    'İş təklifləri, tərəfdaşlıq, Excel təlimi, layihə və aylıq dəstək sorğularına açığam. Yazın, birlikdə uyğun həll tapaq.',
  whatsappLabel: 'WhatsApp-da yaz',
  emailLabel: 'E-poçt göndər',
  whatsappMessage:
    'Salam, Tural. Layihə / işbirliyi haqqında danışmaq istəyirəm.',
  whatsappUrl: whatsAppLink(
    'Salam, Tural. Layihə / işbirliyi haqqında danışmaq istəyirəm.',
  ),
} as const;
