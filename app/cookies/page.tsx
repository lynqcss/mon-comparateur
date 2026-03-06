import { getTranslation } from '@/lib/i18n'

type Props = {
    searchParams: Promise<{ lang?: string }>
}

export default async function CookiesPage({ searchParams }: Props) {
    const { lang } = await searchParams
    const isEn = lang === 'en'

    return (
        <div className="mx-auto max-w-4xl px-4 py-24 sm:px-6 lg:px-8">
            <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white sm:text-5xl mb-12">
                {isEn ? 'Cookie Use' : 'Utilisation des Cookies'} – Lynq CSS
            </h1>

            <p className="text-sm text-zinc-500 mb-12">
                {isEn ? 'Last updated: January 24, 2026' : 'Dernière mise à jour : 24 Janvier 2026'}
            </p>

            <div className="prose prose-zinc dark:prose-invert max-w-none space-y-12 text-zinc-600 dark:text-zinc-400">
                <p>
                    {isEn
                        ? 'This page explains how Lynq CSS uses cookies and similar technologies to ensure the proper functioning of its comparison shopping service.'
                        : 'Cette page explique comment Lynq CSS utilise les cookies et technologies similaires pour assurer le bon fonctionnement de son service de comparaison de prix.'}
                </p>

                <section>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">1. {isEn ? 'WHAT ARE COOKIES?' : 'QU\'EST-CE QUE LES COOKIES ?'}</h2>
                    <p>
                        {isEn
                            ? 'Cookies are small text files stored on your terminal (computer, smartphone, tablet) when you visit a website. They are widely used to make websites work more efficiently and provide information to site owners.'
                            : 'Les cookies sont de petits fichiers texte stockés sur votre terminal (ordinateur, smartphone, tablette) lorsque vous visitez un site web. Ils sont largement utilisés pour faire fonctionner les sites plus efficacement et fournir des informations aux propriétaires du site.'}
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">2. {isEn ? 'HOW WE USE COOKIES' : 'COMMENT NOUS UTILISONS LES COOKIES'}</h2>
                    <p className="mb-4">
                        {isEn
                            ? 'Lynq CSS primarily uses technical and functional cookies to:'
                            : 'Lynq CSS utilise principalement des cookies techniques et fonctionnels pour :'}
                    </p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>
                            <strong>{isEn ? 'Remember Your Preferences:' : 'Mémoriser vos préférences :'}</strong> {isEn ? 'Store your language and country choices for a personalized experience on subsequent visits.' : 'Conserver vos choix de langue et de pays pour une expérience personnalisée lors de vos prochaines visites.'}
                        </li>
                        <li>
                            <strong>{isEn ? 'Ensure Security:' : 'Assurer la sécurité :'}</strong> {isEn ? 'Protect the site against fraud and ensure the technical stability of the service.' : 'Protéger le site contre les fraudes et assurer la stabilité technique du service.'}
                        </li>
                        <li>
                            <strong>{isEn ? 'Performance:' : 'Performance :'}</strong> {isEn ? 'Measure page load speeds to optimize browsing.' : 'Mesurer la rapidité d\'affichage des pages pour optimiser la navigation.'}
                        </li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">3. {isEn ? 'THIRD-PARTY COOKIES' : 'COOKIES TIERS'}</h2>
                    <p>
                        {isEn
                            ? 'To date, Lynq CSS limits the use of third-party cookies. However, we may use analytics tools (such as Google Analytics) that place their own cookies to help us understand site audience anonymously. These cookies do not allow us to identify you personally.'
                            : 'À ce jour, Lynq CSS limite l\'usage de cookies tiers. Toutefois, nous pouvons être amenés à utiliser des outils d\'analyse (comme Google Analytics) qui placent leurs propres cookies pour nous aider à comprendre l\'audience du site de manière anonyme. Ces cookies ne permettent pas de vous identifier personnellement.'}
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">4. {isEn ? 'MANAGING YOUR PREFERENCES' : 'GÉRER VOS PRÉFÉRENCES'}</h2>
                    <p>
                        {isEn
                            ? 'Most web browsers allow you to control or block cookies through their settings.'
                            : 'La plupart des navigateurs web vous permettent de contrôler ou de bloquer les cookies via leurs paramètres.'}
                    </p>
                    <p className="mt-4">
                        {isEn
                            ? 'You can configure your browser to notify you of the presence of cookies or to refuse them systematically.'
                            : 'Vous pouvez configurer votre navigateur pour être informé de la présence de cookies ou pour les refuser systématiquement.'}
                    </p>
                    <p className="mt-4 italic">
                        {isEn
                            ? 'Note: If you choose to disable cookies, some features of Lynq CSS may not work correctly.'
                            : 'Note : Si vous choisissez de désactiver les cookies, certaines fonctionnalités de Lynq CSS pourraient ne pas fonctionner correctement.'}
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">5. {isEn ? 'CONTACT' : 'CONTACT'}</h2>
                    <p>
                        {isEn
                            ? 'For any questions about our cookie management, you can write to us at: contact@lynq-css.com.'
                            : 'Pour toute question sur notre gestion des cookies, vous pouvez nous écrire à : contact@lynq-css.com.'}
                    </p>
                </section>
            </div>
        </div>
    )
}
