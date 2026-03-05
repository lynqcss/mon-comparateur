import { getTranslation } from '@/lib/i18n'

type Props = {
    searchParams: Promise<{ lang?: string }>
}

export default async function TermsPage({ searchParams }: Props) {
    const { lang } = await searchParams
    const isEn = lang === 'en'

    return (
        <div className="mx-auto max-w-4xl px-4 py-24 sm:px-6 lg:px-8">
            <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white sm:text-5xl mb-12">
                {isEn ? 'Terms of Use' : 'Conditions Générales d\'Utilisation'} – Lynq CSS
            </h1>

            <p className="text-sm text-zinc-500 mb-12">
                {isEn ? 'Last updated: January 24, 2026' : 'Dernière mise à jour : 24 Janvier 2026'}
            </p>

            <div className="prose prose-zinc dark:prose-invert max-w-none space-y-12 text-zinc-600 dark:text-zinc-400">
                <section>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">1. {isEn ? 'INTRODUCTION' : 'INTRODUCTION'}</h2>
                    <p>
                        {isEn
                            ? 'This document (hereinafter the "ToU") defines the terms and conditions of use of the Lynq CSS website (hereinafter the "Site"). By accessing or using our services, you acknowledge having read these conditions and agree to comply with them without reservation. If you do not accept these conditions, please do not use the Site.'
                            : 'Le présent document (ci-après les « CGU ») définit les modalités et conditions d\'utilisation du site web Lynq CSS (ci-après le « Site »). En accédant à nos services ou en les utilisant, vous reconnaissez avoir pris connaissance des présentes conditions et vous engagez à les respecter sans réserve. Si vous n\'acceptez pas ces conditions, veuillez ne pas utiliser le Site.'}
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">2. {isEn ? 'DEFINITIONS' : 'DÉFINITIONS'}</h2>
                    <div className="space-y-4">
                        <p><strong>{isEn ? 'CSS (Comparison Shopping Service):' : 'CSS (Service de Comparaison de Prix) :'}</strong> {isEn ? 'Service allowing the display of product offers from third-party merchants on Google search results pages.' : 'Service permettant d\'afficher les offres de produits de commerçants tiers sur les pages de résultats du moteur de recherche Google.'}</p>
                        <p><strong>{isEn ? 'Partner Merchant:' : 'Marchand Partenaire :'}</strong> {isEn ? 'Third-party e-commerce site whose products are referenced on Lynq CSS via a direct or indirect partnership contract.' : 'Site e-commerce tiers dont les produits sont référencés sur Lynq CSS via un contrat de partenariat direct ou indirect.'}</p>
                        <p><strong>{isEn ? 'User / Visitor:' : 'Utilisateur / Visiteur :'}</strong> {isEn ? 'Any natural or legal person accessing the Site or using Lynq CSS services.' : 'Toute personne physique ou morale accédant au Site ou utilisant les services de Lynq CSS.'}</p>
                        <p><strong>{isEn ? 'Browsing Data:' : 'Données de navigation :'}</strong> {isEn ? 'Information related to the connection of your terminal (computer, smartphone, tablet) during consultation of the Site.' : 'Informations liées à la connexion de votre terminal (ordinateur, smartphone, tablette) lors de la consultation du Site.'}</p>
                    </div>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">3. {isEn ? 'SERVICE AND OPERATION' : 'LE SERVICE ET FONCTIONNEMENT'}</h2>
                    <p className="mb-4">
                        {isEn
                            ? 'Lynq CSS is a referencing platform for products offered by our Partner Merchant Sites.'
                            : 'Lynq CSS est une plateforme de référencement de produits proposés par nos Sites Marchands Partenaires.'}
                    </p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>
                            <strong>{isEn ? 'Partial View:' : 'Vision Partielle :'}</strong> {isEn ? 'The displayed results constitute only a partial view of the offers available on the market for equivalent products. We offer regularly updated offers from our clients.' : 'Les résultats affichés ne constituent qu\'une vision partielle des offres disponibles sur le marché pour des produits équivalents. Nous proposons des offres mises à jour régulièrement en provenance de nos clients.'}
                        </li>
                        <li>
                            <strong>{isEn ? 'Independence:' : 'Indépendance :'}</strong> {isEn ? 'Lynq CSS is not the seller of referenced products and cannot be held responsible for transactions made on third-party sites.' : 'Lynq CSS n\'est pas le vendeur des produits référencés et ne peut être tenu responsable des transactions effectuées sur les sites tiers.'}
                        </li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">4. {isEn ? 'LIMITATION OF LIABILITY' : 'LIMITATION DE RESPONSABILITÉ'}</h2>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>
                            <strong>{isEn ? 'Accuracy of Information:' : 'Exactitude des informations :'}</strong> {isEn ? 'Although we strive to update data, we do not guarantee the completeness, truthfulness, or accuracy of prices and descriptions from Partner Sites.' : 'Bien que nous nous efforcions de mettre à jour les données, nous ne garantissons pas l\'exhaustivité, la véracité ou l\'exactitude des prix et descriptifs issus des Sites Partenaires.'}
                        </li>
                        <li>
                            <strong>{isEn ? 'Price Evolution:' : 'Évolution des prix :'}</strong> {isEn ? 'Product prices may change over time or be incorrectly indicated by the merchant. In case of discrepancy, the price displayed on the Partner Merchant site prevails.' : 'Les prix des produits peuvent évoluer dans le temps ou être mal renseignés par le marchand. En cas de divergence, le prix affiché sur le site du Marchand Partenaire fait foi.'}
                        </li>
                        <li>
                            <strong>{isEn ? 'Third-Party Links:' : 'Liens Tiers :'}</strong> {isEn ? 'Lynq CSS declines all responsibility regarding the availability or content of third-party sites linked by the Services. The user assumes all risks arising from the use of these sites.' : 'Lynq CSS décline toute responsabilité concernant la disponibilité ou le contenu des sites tiers vers lesquels les Services renvoient. L\'utilisateur assume tous les risques découlant de l\'utilisation de ces sites.'}
                        </li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">5. {isEn ? 'PROPERTY RIGHTS' : 'DROITS DE PROPRIÉTÉ'}</h2>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>
                            <strong>{isEn ? 'Lynq CSS Property:' : 'Propriété de Lynq CSS :'}</strong> {isEn ? 'All rights, titles, and interests related to the Services (logos, domain names, design) remain the exclusive property of Lynq CSS.' : 'Tout droit, titre et intérêt lié aux Services (logos, noms de domaine, design) reste la propriété exclusive de Lynq CSS.'}
                        </li>
                        <li>
                            <strong>{isEn ? 'Merchants Property:' : 'Propriété des Marchands :'}</strong> {isEn ? 'Trademarks, images, and product descriptions remain the exclusive property of their respective holders. Lynq CSS acts only as a technical indexer.' : 'Les marques, images et descriptifs produits restent la propriété exclusive de leurs détenteurs respectifs. Lynq CSS n\'agit qu\'en tant qu\'indexeur technique.'}
                        </li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">6. {isEn ? 'PROTECTION OF MINORS' : 'PROTECTION DES MINEURS'}</h2>
                    <p>
                        {isEn
                            ? 'Lynq CSS may index information related to product offers for adults. By using the Services, you confirm being of legal age in your country of residence or having parental authorization.'
                            : 'Lynq CSS peut indexer des informations relatives à des offres de produits destinés aux adultes. En utilisant les Services, vous confirmez être majeur dans votre pays de résidence ou disposer d\'une autorisation parentale.'}
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">7. {isEn ? 'MODIFICATION OF SERVICE AND TOU' : 'MODIFICATION DU SERVICE ET DES CGU'}</h2>
                    <p>
                        {isEn
                            ? 'Lynq CSS reserves the right to modify the design, functionalities, or these ToU at any time. Modifications take effect immediately upon posting. Continuing to use the service after modification implies your acceptance of the new conditions.'
                            : 'Lynq CSS se réserve le droit de modifier à tout moment le design, les fonctionnalités ou les présentes CGU. Les modifications entrent en vigueur dès leur mise en ligne. Le fait de continuer à utiliser le service après modification implique votre acceptation des nouvelles conditions.'}
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">8. {isEn ? 'APPLICABLE LAW AND JURISDICTION' : 'DROIT APPLICABLE ET JURIDICTION'}</h2>
                    <p>
                        {isEn
                            ? 'These ToU are governed and interpreted in accordance with French law. In the event of a dispute relating to their validity or execution, and after failure of an amicable solution, the courts of the jurisdiction of our registered office shall have sole competence.'
                            : 'Les présentes CGU sont régies et interprétées conformément au droit français. En cas de litige relatif à leur validité ou exécution, et après échec d\'une solution amiable, les tribunaux du ressort de notre siège social seront seuls compétents.'}
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">9. {isEn ? 'CONTACT' : 'CONTACT'}</h2>
                    <p>
                        {isEn
                            ? 'For any question regarding these ToU, you can contact us at the following address: contact@lynq-css.com.'
                            : 'Pour toute question concernant ces CGU, vous pouvez nous contacter à l\'adresse suivante : contact@lynq-css.com.'}
                    </p>
                </section>
            </div>
        </div>
    )
}
