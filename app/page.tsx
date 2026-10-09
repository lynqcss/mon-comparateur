import Link from "@/app/components/AppLink";
import { getTranslation } from "@/lib/i18n";
import GoogleShoppingMockup from "./components/GoogleShoppingMockup";
import ComparisonShowcase from "./components/ComparisonShowcase";

type HomeProps = {
  searchParams: Promise<{
    country?: string
    lang?: string
  }>
}

// Pictogrammes au trait des rayons (viewBox 24, tracé 1.5).
const CATEGORY_ICONS = {
  electronics: "M9 3v2m6-2v2M9 19v2m6-2v2M3 9h2m-2 6h2m14-6h2m-2 6h2M7 5h10a2 2 0 012 2v10a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2zm3 5h4v4h-4z",
  home: "M3 11.5L12 4l9 7.5M5.5 10v9.5h13V10M10 19.5v-5h4v5",
  fashion: "M8 4l-5 3 2 4 2-1v10h10V10l2 1 2-4-5-3a3 3 0 01-6 0z",
  beauty: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.200L5 10l5.2-1.800zM18.5 15.500l.7 2 2 .7-2 .7-.7 2-.700-2-2-.700 2-.700z",
  sport: "M6.5 6.500v11M3.5 9v6m14-8.500v11m3-8.500v6M6.5 12h11",
  tech: "M5 6.5A1.5 1.5 0 016.5 5h11A1.5 1.5 0 0119 6.500V15H5zM3 18h18M10 18l.5-1h3l.5 1",
}

export default async function Home({ searchParams }: HomeProps) {
  const { country, lang } = await searchParams;
  const selectedCountry = country === 'PL' ? 'PL' : 'FR';
  const selectedLang = lang || (selectedCountry === 'FR' ? 'fr' : 'en');
  const isFr = selectedLang === 'fr';
  const t = getTranslation(selectedLang);

  const categories = [
    { name: isFr ? "Électronique" : "Electronics", icon: CATEGORY_ICONS.electronics, search: "Appareils électroniques" },
    { name: isFr ? "Maison" : "Home", icon: CATEGORY_ICONS.home, search: "Maison et jardin" },
    { name: isFr ? "Mode" : "Fashion", icon: CATEGORY_ICONS.fashion, search: "Vêtements et accessoires" },
    { name: isFr ? "Beauté" : "Beauty", icon: CATEGORY_ICONS.beauty, search: "Santé et beauté" },
    { name: "Sport", icon: CATEGORY_ICONS.sport, search: "Équipements sportifs" },
    { name: isFr ? "High-Tech" : "Tech", icon: CATEGORY_ICONS.tech, search: "Appareils électroniques" },
  ];

  const buildUrl = (path: string, extra: Record<string, string> = {}) => {
    const sp = new URLSearchParams();
    sp.set('country', selectedCountry);
    sp.set('lang', selectedLang);
    Object.entries(extra).forEach(([k, v]) => sp.set(k, v));
    return `${path}?${sp.toString()}`;
  };

  return (
    <div className="flex flex-col bg-white dark:bg-zinc-950">
      {/* Hero */}
      <section className="relative pt-20 sm:pt-28">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[38rem] bg-[radial-gradient(45rem_30rem_at_top,theme(colors.zinc.100),transparent)] opacity-60 dark:bg-[radial-gradient(45rem_30rem_at_top,theme(colors.zinc.900),transparent)]" />

        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-6xl dark:text-white">
              {t.home.hero_title} <span className="text-gradient">{t.home.hero_title_gradient}</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-zinc-600 dark:text-zinc-400">
              {t.home.hero_subtitle}
            </p>

            <form action="/products" method="GET" className="mx-auto mt-10 flex w-full max-w-xl items-center gap-2 rounded-full border border-zinc-200 bg-white p-1.5 pl-5 shadow-[0_12px_40px_-12px_rgba(24,24,27,0.18)] transition-all focus-within:border-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:focus-within:border-white">
              <input type="hidden" name="country" value={selectedCountry} />
              <input type="hidden" name="lang" value={selectedLang} />
              <svg className="h-[18px] w-[18px] shrink-0 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path strokeLinecap="round" d="M20 20l-3.5-3.5" />
              </svg>
              <input
                type="text"
                name="q"
                placeholder={t.home.search_placeholder}
                aria-label={t.home.search_placeholder}
                className="w-full flex-1 border-none bg-transparent px-2 py-2.5 text-[15px] outline-none placeholder:text-zinc-400"
              />
              <button
                type="submit"
                className="shrink-0 rounded-full bg-zinc-900 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-zinc-800 active:scale-95 dark:bg-white dark:text-zinc-900"
              >
                {t.home.search_button}
              </button>
            </form>
          </div>

          <div className="mx-auto mt-16 max-w-5xl sm:mt-20">
            <ComparisonShowcase
              labels={t.home.showcase}
              locale={isFr ? 'fr-FR' : 'en-IE'}
            />
          </div>
        </div>
      </section>

      {/* Rayons */}
      <section className="pt-24 sm:pt-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">{t.home.categories_title}</h2>
              <p className="mt-2 text-zinc-600 dark:text-zinc-400">{t.home.categories_subtitle}</p>
            </div>
            <Link
              href={buildUrl('/products')}
              className="group inline-flex items-center gap-2 rounded-full border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-900 transition-colors hover:border-zinc-900 dark:border-zinc-800 dark:text-white dark:hover:border-white"
            >
              {t.home.view_all}
              <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-6-6l6 6-6 6" />
              </svg>
            </Link>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {categories.map((cat) => (
              <Link
                key={cat.name}
                href={buildUrl('/products', { rootCategory: cat.search })}
                className="group flex flex-col justify-between gap-10 rounded-2xl border border-zinc-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-white"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-100 text-zinc-900 transition-colors group-hover:bg-zinc-900 group-hover:text-white dark:bg-zinc-800 dark:text-white dark:group-hover:bg-white dark:group-hover:text-zinc-900">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d={cat.icon} />
                  </svg>
                </span>
                <span className="flex items-center justify-between gap-2">
                  <span className="text-[15px] font-semibold text-zinc-900 dark:text-white">{cat.name}</span>
                  <svg className="h-4 w-4 text-zinc-300 transition-all group-hover:translate-x-0.5 group-hover:text-zinc-900 dark:text-zinc-600 dark:group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 6l6 6-6 6" />
                  </svg>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Pour les marchands */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid items-center gap-x-14 gap-y-14 rounded-[2rem] border border-zinc-100 bg-zinc-50 p-8 dark:border-zinc-800 dark:bg-zinc-900/40 sm:p-12 lg:grid-cols-2 lg:p-16">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
                {isFr ? 'Pour les marchands' : 'For merchants'}
              </p>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
                {t.home.about_title}
              </h2>
              <p className="mt-5 leading-7 text-zinc-600 dark:text-zinc-400">
                {t.home.about_p1}
              </p>
              <ul className="mt-8 space-y-3.5">
                {t.home.about_features.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span className="text-[15px] font-medium text-zinc-800 dark:text-zinc-200">{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={buildUrl('/join')}
                className="group mt-10 inline-flex items-center gap-2 rounded-full bg-zinc-900 px-7 py-3.5 text-sm font-semibold text-white transition-all hover:bg-zinc-800 active:scale-95 dark:bg-white dark:text-zinc-900"
              >
                {t.nav.diffuse}
                <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-6-6l6 6-6 6" />
                </svg>
              </Link>
            </div>
            <div className="w-full min-w-0">
              <GoogleShoppingMockup labels={t.mockup} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
