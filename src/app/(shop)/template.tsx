// Re-mounts on every client navigation, so each page fades in (260ms,
// opacity only: no layout shift; off under reduced motion via globals.css).
export default function ShopTemplate({ children }: { children: React.ReactNode }) {
  return <div className="page-in">{children}</div>;
}
