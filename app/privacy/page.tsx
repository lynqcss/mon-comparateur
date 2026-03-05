import { getTranslation } from '@/lib/i18n'

type Props = {
    searchParams: Promise<{ lang?: string }>
}

export default async function PrivacyPage({ searchParams }: Props) {
    const { lang } = await searchParams
    const isEn = lang === 'en'

    return (
        <div className="mx-auto max-w-4xl px-4 py-24 sm:px-6 lg:px-8">
            <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white sm:text-5xl mb-12">
                {isEn ? 'Privacy' : 'Politique de'} <span className="text-gradient">{isEn ? 'Policy' : 'Confidentialité'}</span>
            </h1>

            <p className="text-sm text-zinc-500 mb-12">
                {isEn ? 'Last updated: January 24, 2026' : 'Dernière mise à jour : 24 Janvier 2026'}
            </p>

            <div className="prose prose-zinc dark:prose-invert max-w-none space-y-12 text-zinc-600 dark:text-zinc-400">
                <p>
                    {isEn
                        ? 'At Lynq CSS, we prioritize the protection of your personal data. This policy details how we treat the information collected during your browsing on our price comparison portal.'
                        : 'Chez Lynq CSS, nous accordons une priorité absolue à la protection de vos données personnelles. Cette politique détaille comment nous traitons les informations collectées lors de votre navigation sur notre portail de comparaison de prix.'}
                </p>

                <section>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">1. {isEn ? 'DATA COLLECTION' : 'COLLECTE DES DONNÉES'}</h2>
                    <p>
                        {isEn
                            ? 'We do not collect personally identifiable information (name, address, phone) from casual visitors. However, we automatically collect technical browsing data:'
                            : 'Nous ne collectons pas d\'informations personnelles identifiables (nom, adresse, téléphone) auprès des visiteurs occasionnels. Cependant, nous collectons automatiquement des données de navigation techniques :'}
                    </p>
                    <ul className="list-disc pl-5 space-y-2 mt-4">
                        <li>
                            <strong>{isEn ? 'Technical Information:' : 'Informations techniques :'}</strong> {isEn ? 'IP address (anonymized for security), browser type (User Agent), and operating system.' : 'Adresse IP (anonymisée pour la sécurité), type de navigateur (User Agent) et système d\'exploitation.'}
                        </li>
                        <li>
                            <strong>{isEn ? 'Browsing Data:' : 'Données de consultation :'}</strong> {isEn ? 'Pages viewed, searches performed on the site, and links to Partner Merchants clicked.' : 'Pages consultées, recherches opérées sur le site et liens vers les Marchands Partenaires cliqués.'}
                        </li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">2. {isEn ? 'USE OF DATA' : 'UTILISATION DES DONNÉES'}</h2>
                    <p className="mb-4">
                        {isEn
                            ? 'The collected data is used exclusively to:'
                            : 'Les données collectées sont utilisées exclusivement pour :'}
                    </p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>
                            <strong>{isEn ? 'Improve User Experience:' : 'Améliorer l\'expérience utilisateur :'}</strong> {isEn ? 'Optimize navigation and remember your language or country preferences.' : 'Optimiser la navigation et mémoriser vos préférences de langue ou de pays.'}
                        </li>
                        <li>
                            <strong>{isEn ? 'Security:' : 'Sécurité :'}</strong> {isEn ? 'Prevent fraud and ensure the technical stability of the service.' : 'Prévenir les fraudes et assurer la stabilité technique du service.'}
                        </li>
                        <li>
                            <strong>{isEn ? 'Statistics:' : 'Statistiques :'}</strong> {isEn ? 'Analyze the audience to improve our product catalog. We are committed to never selling your personal data to third parties.' : 'Analyser l\'audience pour améliorer notre catalogue de produits. Nous nous engageons à ne jamais vendre vos données personnelles à des tiers.'}
                        </li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">3. {isEn ? 'COOKIES AND TRACKERS' : 'COOKIES ET TRACEURS'}</h2>
                    <p>
                        {isEn
                            ? 'A cookie is a file saved on your terminal when accessing our services. Lynq CSS uses cookies for:'
                            : 'Un cookie est un fichier enregistré sur votre terminal lors de l\'accès à nos services. Lynq CSS utilise des cookies pour :'}
                    </p>
                    <ul className="list-disc pl-5 space-y-2 mt-4">
                        <li>
                            <strong>{isEn ? 'Functionality:' : 'Le fonctionnement :'}</strong> {isEn ? 'Remember your settings and preferences.' : 'Mémoriser vos réglages et préférences.'}
                        </li>
                        <li>
                            <strong>{isEn ? 'Analysis:' : 'L\'analyse :'}</strong> {isEn ? 'Understand how you interact with the site. You can configure your browser to refuse cookies, although this may limit certain features of the Site.' : 'Comprendre comment vous interagissez avec le site. Vous pouvez configurer votre navigateur pour refuser les cookies, bien que cela puisse limiter certaines fonctionnalités du Site.'}
                        </li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">4. {isEn ? 'RECIPIENTS AND STORAGE' : 'DESTINATAIRES ET STOCKAGE'}</h2>
                    <p>
                        {isEn
                            ? 'Data is stored securely. It may be processed by our technical providers, notably our host Vercel Inc., solely for the needs of the service.'
                            : 'Les données sont stockées de manière sécurisée. Elles peuvent être traitées par nos prestataires techniques, notamment notre hébergeur Vercel Inc., pour les seuls besoins du service.'}
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">5. {isEn ? 'YOUR RIGHTS (GDPR)' : 'VOS DROITS (RGPD)'}</h2>
                    <p className="mb-4">
                        {isEn
                            ? 'In accordance with the General Data Protection Regulation, you have the following rights regarding your personal data:'
                            : 'Conformément au Règlement Général sur la Protection des Données, vous disposez des droits suivants sur vos données personnelles :'}
                    </p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>{isEn ? 'Right of access and rectification.' : 'Droit d\'accès et de rectification.'}</li>
                        <li>{isEn ? 'Right to erasure (right to be forgotten).' : 'Droit à l\'effacement (droit à l\'oubli).'}</li>
                        <li>{isEn ? 'Right to restriction of processing.' : 'Droit à la limitation du traitement.'}</li>
                    </ul>
                    <p className="mt-4">
                        {isEn
                            ? 'To exercise these rights, contact us at: contact@lynq.css.'
                            : 'Pour exercer ces droits, contactez-nous à : contact@lynq.css.'}
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">6. {isEn ? 'CONTACT' : 'CONTACT'}</h2>
                    <p>
                        {isEn
                            ? 'For any questions regarding this policy or the protection of your data, you can contact our responsible officer at the following address: contact@lynq.css.'
                            : 'Pour toute question concernant cette politique ou la protection de vos données, vous pouvez contacter notre responsable à l\'adresse suivante : contact@lynq.css.'}
                    </p>
                </section>
            </div>
        </div>
    )
}
