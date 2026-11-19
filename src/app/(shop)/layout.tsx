import { getHeaderCategories } from '@/lib/categories';
import { shopConfig } from '@/lib/constants';
import { ShopHeader } from '@/components/ShopHeader';
import { ShopFooter } from '@/components/ShopFooter';
import { PageTransition } from '@/components/ScrollReveal';

export const dynamic = 'force-dynamic';

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const cfg = shopConfig();
  const roots = await getHeaderCategories();

  return (
    <>
      <ShopHeader shopName={cfg.name} roots={roots} />
      <main>
        <PageTransition>{children}</PageTransition>
      </main>
      <ShopFooter cfg={cfg} />
    </>
  );
}
