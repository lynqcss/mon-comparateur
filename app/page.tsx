import Link from "next/link";
import { getTranslation } from "@/lib/i18n";

type HomeProps = {
  searchParams: Promise<{
    country?: string
    lang?: string
  }>
}

export default async function Home({ searchParams }: HomeProps) {
  const { country, lang } = await searchParams;
  const selectedCountry = country === 'PL' ? 'PL' : 'FR';
  const selectedLang = lang || (selectedCountry === 'FR' ? 'fr' : 'en');
  const t = getTranslation(selectedLang);

  const categories = [
    { name: selectedLang === 'fr' ? "Electronique" : "Electronics", icon: "🔌", color: "bg-zinc-50 text-zinc-900", search: "Electronics" },
    { name: selectedLang === 'fr' ? "Maison" : "Home", icon: "🏠", color: "bg-zinc-50 text-zinc-900", search: "Home & Garden" },
    { name: selectedLang === 'fr' ? "Mode" : "Fashion", icon: "👜", color: "bg-zinc-50 text-zinc-900", search: "Apparel & Accessories" },
    { name: selectedLang === 'fr' ? "Beauté" : "Beauty", icon: "✨", color: "bg-zinc-50 text-zinc-900", search: "Health & Beauty" },
    { name: selectedLang === 'fr' ? "Sport" : "Sport", icon: "🏀", color: "bg-zinc-50 text-zinc-900", search: "Sporting Goods" },
    { name: selectedLang === 'fr' ? "High-Tech" : "Tech", icon: "📷", color: "bg-zinc-50 text-zinc-900", search: "Cameras & Optics" },
  ];

  const buildUrl = (path: string, extra: Record<string, string> = {}) => {
    const sp = new URLSearchParams();
    sp.set('country', selectedCountry);
    sp.set('lang', selectedLang);
    Object.entries(extra).forEach(([k, v]) => sp.set(k, v));
    return `${path}?${sp.toString()}`;
  };

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white py-24 dark:bg-zinc-950 sm:py-32">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45rem_50rem_at_top,theme(colors.zinc.100),white)] opacity-20 dark:bg-[radial-gradient(45rem_50rem_at_top,theme(colors.zinc.900),theme(colors.zinc.950))]" />

        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-6xl dark:text-white">
              {t.home.hero_title} <span className="text-gradient">{t.home.hero_title_gradient}</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-zinc-600 dark:text-zinc-400">
              {t.home.hero_subtitle}
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-y-6 sm:flex-row sm:gap-x-4">
              <form action="/products" method="GET" className="flex w-full max-w-lg items-center gap-2 rounded-full border border-zinc-200 bg-white p-1.5 shadow-xl transition-all focus-within:ring-2 focus-within:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:focus-within:ring-white">
                <input type="hidden" name="country" value={selectedCountry} />
                <input type="hidden" name="lang" value={selectedLang} />
                <input
                  type="text"
                  name="q"
                  placeholder={t.home.search_placeholder}
                  className="w-full flex-1 border-none bg-transparent px-4 py-2 text-sm outline-none placeholder:text-zinc-400"
                />
                <button
                  type="submit"
                  className="hidden rounded-full bg-zinc-900 px-8 py-2.5 text-sm font-bold text-white transition-all hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 sm:block"
                >
                  {t.home.search_button}
                </button>
              </form>
            </div>

            <p className="mt-4 text-xs text-zinc-400">
              {t.home.search_footer}
            </p>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="bg-zinc-50/20 py-24 dark:bg-zinc-900/10">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">{t.home.categories_title}</h2>
              <p className="mt-2 text-zinc-600 dark:text-zinc-400">{t.home.categories_subtitle}</p>
            </div>
            <Link href={buildUrl('/products')} className="text-sm font-bold text-zinc-900 dark:text-white hover:underline">
              {t.home.view_all}
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {categories.map((cat) => (
              <Link
                key={cat.name}
                href={buildUrl('/products', { rootCategory: cat.search })}
                className="group relative flex flex-col items-center justify-center rounded-2xl bg-white p-8 border border-zinc-100 shadow-sm transition-all hover:border-zinc-200 hover:shadow-md dark:bg-zinc-900 dark:border-zinc-800 dark:hover:border-zinc-700"
              >
                <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-xl text-2xl ${cat.color} transition-transform group-hover:scale-110 shadow-sm`}>
                  {cat.icon}
                </div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">{cat.name}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-x-12 gap-y-16 lg:grid-cols-2 items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
                {t.home.about_title}
              </h2>
              <div className="mt-6 space-y-6 text-zinc-600 dark:text-zinc-400 leading-relaxed">
                <p>
                  {t.home.about_p1}
                </p>
                <ul className="space-y-4">
                  {t.home.about_features.map((item) => (
                    <li key={item} className="flex items-center gap-3">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-sm font-bold">{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="pt-4">
                  <Link href={buildUrl('/admin/merchants')} className="inline-flex items-center rounded-full bg-zinc-900 px-8 py-4 text-sm font-bold text-white shadow-xl transition-all hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 active:scale-95">
                    {t.nav.diffuse}
                  </Link>
                </div>
              </div>
            </div>
            <div className="relative aspect-video overflow-hidden rounded-3xl border border-zinc-100 bg-zinc-100 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-zinc-200 to-zinc-400 dark:from-zinc-800 dark:to-zinc-950">
                <div className="text-center p-8 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                  <span className="text-xs font-black uppercase tracking-widest text-white/60">{t.home.partner_view}</span>
                  <h3 className="mt-2 text-2xl font-bold text-white">{t.home.dashboard}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
