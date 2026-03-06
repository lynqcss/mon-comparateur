import Link from 'next/link'

export default function NotFound() {
    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
            <div className="text-8xl mb-6">🔍</div>
            <h1 className="text-4xl font-black tracking-tight text-zinc-900">
                Page introuvable
            </h1>
            <p className="mt-4 max-w-md text-lg text-zinc-500">
                Désolé, la page que vous recherchez n&apos;existe pas ou a été déplacée.
            </p>
            <div className="mt-10">
                <Link
                    href="/"
                    className="inline-flex rounded-full bg-zinc-900 px-10 py-4 text-base font-bold text-white shadow-lg transition-all hover:bg-zinc-800 hover:scale-105 active:scale-95"
                >
                    Retour à l&apos;accueil
                </Link>
            </div>
        </div>
    )
}
