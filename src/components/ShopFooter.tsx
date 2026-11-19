import { Reveal } from './ScrollReveal';

export function ShopFooter({
  cfg,
}: {
  cfg: {
    name: string;
    address: string;
    hours: string;
    mapsUrl: string;
    whatsapp: string;
    phone: string;
  };
}) {
  return (
    <>
      <footer className="mt-16 bg-slate-100 text-slate-600">
        <div className="h-1 bg-electric" />
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-3">
          <Reveal variant="up" delay={0}>
            <img src="/images/logo.png" alt={cfg.name} className="h-20 w-auto sm:h-28" />
            <p className="mt-3 text-sm">
              Football jerseys for every fan. Pay with M-Pesa, get it delivered or pick it up.
            </p>
          </Reveal>
          <Reveal variant="up" delay={60} className="text-sm">
            <p className="font-semibold text-slate-900">Visit us</p>
            {cfg.address && <p className="mt-2">{cfg.address}</p>}
            <p className="mt-1">{cfg.hours}</p>
            {cfg.mapsUrl && (
              <a
                className="mt-2 inline-block font-semibold text-black underline decoration-electric decoration-2 underline-offset-4 transition-transform duration-200 hover:translate-x-0.5"
                href={cfg.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Get directions &rarr;
              </a>
            )}
          </Reveal>
          <Reveal variant="up" delay={120} className="text-sm">
            <p className="font-semibold text-slate-900">Help</p>
            <ul className="mt-2 space-y-1">
              {cfg.whatsapp && (
                <li>
                  <a
                    className="decoration-electric decoration-2 underline-offset-4 hover:text-black hover:underline"
                    href={`https://wa.me/${cfg.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    WhatsApp us
                  </a>
                </li>
              )}
              {cfg.phone && <li>{cfg.phone}</li>}
            </ul>
          </Reveal>
        </div>
        <div className="border-t border-slate-200 py-4 text-center text-xs text-slate-500">
          &copy; {new Date().getFullYear()} {cfg.name}
        </div>
      </footer>

      {cfg.whatsapp && (
        <a
          href={`https://wa.me/${cfg.whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-4 right-4 z-40 rounded-full bg-electric px-4 py-3 text-sm font-bold text-black shadow-lg ring-2 ring-black transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:brightness-95"
        >
          Order on WhatsApp
        </a>
      )}
    </>
  );
}
