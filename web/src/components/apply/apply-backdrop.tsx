// Quiet processing backdrop for the apply/hunt pages: a dim, blurred screenshot
// under a moss dot-grid, signed by a faint Petal Seal. The old drifting
// gradient halos + screen/multiply blend machinery were AI theatre (and
// violated Verdara's no-gradient/no-glass rules) — removed. Fixed so content
// scrolls over it. Pure CSS, GPU transforms, respects prefers-reduced-motion.
const CSS = `
.co-bd{position:fixed;top:0;right:0;bottom:0;left:0;z-index:0;overflow:hidden;pointer-events:none;background:var(--bg)}
@media(min-width:768px){.co-bd{left:15rem}}
.co-bd__img{position:absolute;inset:-15%;width:130%;height:130%;object-fit:cover;object-position:center top;filter:blur(40px) saturate(0.9);opacity:.14;transition:opacity .9s ease}
.co-bd__tint{position:absolute;inset:0;background:color-mix(in srgb, var(--bg) 80%, transparent)}
.co-bd__dots{position:absolute;inset:0;
  background-image:radial-gradient(circle, color-mix(in srgb, var(--color-moss) 22%, transparent) 1px, transparent 1.7px);
  background-size:24px 24px;
  -webkit-mask-image:radial-gradient(140% 110% at 50% 38%, #000 50%, transparent 100%);
  mask-image:radial-gradient(140% 110% at 50% 38%, #000 50%, transparent 100%);
  opacity:.5}
.co-bd__seal{position:absolute;right:-6rem;bottom:-8rem;width:34rem;height:34rem;color:var(--color-moss);opacity:.05;pointer-events:none}
.co-bd.is-intense .co-bd__img{opacity:.20}
.co-bd.is-intense .co-bd__dots{opacity:.65}
.co-bd.is-soft .co-bd__img{opacity:.10}
.co-bd.is-soft .co-bd__dots{opacity:.40}
@keyframes co-rise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
.co-rise{animation:co-rise .5s ease both}
@media (prefers-reduced-motion: reduce){.co-rise{animation:none}}
`;

export function ApplyBackdrop({ image, intense }: { image?: string; intense: boolean }) {
  return (
    <div aria-hidden className={`co-bd ${intense ? "is-intense" : "is-soft"}`}>
      <style>{CSS}</style>
      {image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" className="co-bd__img" />
      )}
      <div className="co-bd__tint" />
      <div className="co-bd__dots" />
    </div>
  );
}
