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
    whatsappUrl: string;
    phone: string;
  };
}) {
  const waHref =
    cfg.whatsappUrl || (cfg.whatsapp ? `https://wa.me/${cfg.whatsapp}` : '');

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
              {waHref && (
                <li>
                  <a
                    className="decoration-electric decoration-2 underline-offset-4 hover:text-black hover:underline"
                    href={waHref}
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

      {waHref && (
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat with us on WhatsApp"
          title="Chat with us on WhatsApp"
          className="group fixed bottom-4 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg ring-2 ring-white transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:shadow-xl"
        >
          <svg
            viewBox="0 0 32 32"
            className="h-7 w-7 fill-current"
            aria-hidden="true"
          >
            <path d="M16.004 3C8.832 3 3 8.832 3 16.004c0 2.517.717 4.976 2.073 7.095L3.08 29l6.08-1.957a12.95 12.95 0 0 0 6.844 1.961h.005C23.176 29.004 29 23.172 29 16.004 29 8.832 23.176 3 16.004 3zm7.579 18.497c-.32.898-1.855 1.718-2.573 1.82-.656.094-1.484.134-2.396-.15-.552-.175-1.26-.408-2.164-.798-3.805-1.644-6.29-5.48-6.48-5.733-.19-.253-1.547-2.06-1.547-3.93 0-1.87.98-2.79 1.326-3.17.347-.38.758-.476 1.01-.476.253 0 .506.002.728.013.234.012.548-.089.858.655.32.767 1.088 2.652 1.183 2.843.095.19.158.412.032.665-.127.253-.19.411-.38.633-.19.222-.4.496-.57.666-.19.19-.388.396-.167.776.222.38.985 1.624 2.115 2.63 1.454 1.296 2.68 1.698 3.06 1.888.38.19.602.158.823-.095.222-.253.95-1.108 1.203-1.488.253-.38.506-.317.854-.19.348.127 2.212 1.043 2.592 1.233.38.19.633.285.728.443.095.158.095.918-.225 1.816z" />
          </svg>
        </a>
      )}
    </>
  );
}
