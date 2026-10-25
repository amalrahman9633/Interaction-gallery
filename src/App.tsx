import { lazy, Suspense } from "react";
import { parse, usePathname } from "./gallery/router";
import Gallery from "./gallery/Gallery";

// Dev-only: the playground is stripped from production builds.
const Playground = import.meta.env.DEV ? lazy(() => import("./playground/Playground")) : null;

export default function App() {
  const route = parse(usePathname());

  if (route.name === "playground" && Playground) {
    return (
      <Suspense fallback={null}>
        <Playground slug={route.slug} />
      </Suspense>
    );
  }

  return <Gallery openSlug={route.name === "gallery" ? route.slug : undefined} />;
}
