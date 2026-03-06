import { getTranslation } from '@/lib/i18n'

type Props = {
    searchParams: Promise<{ lang?: string }>
}

export default async function LegalPage({ searchParams }: Props) {
    const { lang } = await searchParams
    const isEn = lang === 'en'

    return (
        <div className="mx-auto max-w-4xl px-4 py-24 sm:px-6 lg:px-8">
            <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white sm:text-5xl mb-12">
                {isEn ? 'Legal' : 'Mentions'} <span className="text-gradient">{isEn ? 'Mentions' : 'Légales'}</span>
            </h1>

            <div className="prose prose-zinc dark:prose-invert max-w-none space-y-12 text-zinc-600 dark:text-zinc-400">
                <section>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">1. {isEn ? 'SITE PUBLISHER' : 'ÉDITEUR DU SITE'}</h2>
                    <p>
                        {isEn
                            ? 'The Lynq CSS website is published by the company Lynq CSS, specialized in price comparison services.'
                            : 'Le site Lynq CSS est édité par la société Lynq CSS, spécialisée dans les services de comparaison de prix.'}
                    </p>
                    <ul className="list-none pl-0 space-y-2 mt-4">
                        <li><strong>{isEn ? 'Legal Form:' : 'Forme juridique :'}</strong> {isEn ? '[Ex: SAS / SARL] with a capital of [Amount] €' : '[Ex: SAS / SARL] au capital de [Montant] €'}</li>
                        <li><strong>{isEn ? 'Headquarters:' : 'Siège social :'}</strong> 123 Avenue des Champs-Élysées, 75008 Paris</li>
                        <li><strong>SIREN :</strong> [Numéro SIREN à compléter]</li>
                        <li><strong>RCS :</strong> [Ville, ex: Paris]</li>
                        <li><strong>{isEn ? 'Intracommunity VAT:' : 'TVA Intracommunautaire :'}</strong> [Numéro de TVA]</li>
                        <li><strong>Email :</strong> contact@lynq-css.com</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">2. {isEn ? 'PUBLICATION DIRECTOR' : 'DIRECTEUR DE LA PUBLICATION'}</h2>
                    <p>
                        {isEn
                            ? 'The publication director of the site is Clement, in his capacity as manager.'
                            : 'Le directeur de la publication du site est Clement, en sa qualité de dirigeant.'}
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">3. {isEn ? 'HOSTING' : 'HÉBERGEMENT'}</h2>
                    <p>
                        {isEn
                            ? 'The site is hosted by Vercel Inc.:'
                            : 'Le site est hébergé par la société Vercel Inc. :'}
                    </p>
                    <ul className="list-none pl-0 space-y-2 mt-2">
                        <li><strong>{isEn ? 'Address:' : 'Adresse :'}</strong> 340 S Lemon Ave #1135, Walnut, CA 91789, USA</li>
                        <li><strong>{isEn ? 'Website:' : 'Site web :'}</strong> https://vercel.com</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">4. {isEn ? 'INTELLECTUAL PROPERTY' : 'PROPRIÉTÉ INTELLECTUELLE'}</h2>
                    <p>
                        {isEn
                            ? 'All elements constituting the site (logos, graphics, texts) are the exclusive property of Lynq CSS. Any reproduction or representation, total or partial, of the site or one of its elements, without the express authorization of the publisher, is prohibited.'
                            : 'L’ensemble des éléments constituant le site (logos, graphismes, textes) est la propriété exclusive de Lynq CSS. Toute reproduction ou représentation, totale ou partielle, du site ou de l’un de ses éléments, sans l’autorisation expresse de l\'éditeur, est interdite.'}
                    </p>
                    <p className="mt-4">
                        {isEn
                            ? 'The visuals and product descriptions indexed belong exclusively to the respective Partner Merchants.'
                            : 'Les visuels et descriptifs des produits indexés appartiennent exclusivement aux Marchands Partenaires respectifs.'}
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">5. {isEn ? 'PERSONAL DATA' : 'DONNÉES PERSONNELLES'}</h2>
                    <p>
                        {isEn
                            ? 'In accordance with the General Data Protection Regulation (GDPR), the user has a right of access, rectification, and deletion of data concerning them. These rights are exercised via the address: contact@lynq-css.com. For more information, please consult our Privacy Policy.'
                            : 'Conformément au Règlement Général sur la Protection des Données (RGPD), l\'utilisateur dispose d\'un droit d\'accès, de rectification et de suppression des données le concernant. Ces droits s\'exercent via l\'adresse : contact@lynq-css.com. Pour plus d\'informations, veuillez consulter notre Politique de Confidentialité.'}
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">6. {isEn ? 'CONTACT' : 'CONTACT'}</h2>
                    <p>
                        {isEn
                            ? 'For any complaint, question, or reporting of illicit content, you can contact us:'
                            : 'Pour toute réclamation, question ou signalement de contenu illicite, vous pouvez nous contacter :'}
                    </p>
                    <ul className="list-none pl-0 space-y-2 mt-2">
                        <li><strong>{isEn ? 'By email:' : 'Par e-mail :'}</strong> contact@lynq-css.com</li>
                    </ul>
                </section>
            </div>
        </div>
    )
}
