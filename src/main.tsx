import { createRoot } from "react-dom/client";
import { lazy, Suspense, useState } from "react";
import { Splash } from "./components/Splash";
import { markAppInteractive, idleCallback } from "./lib/perf";
import "./index.css";

const App = lazy(() => import("./App"));

const SPLASH_KEY = "trak_splash_shown";

function Root() {
  const [showSplash, setShowSplash] = useState(() => {
    if (typeof window === "undefined") return false;
    return !sessionStorage.getItem(SPLASH_KEY);
  });
  return (
    <>
      <Suspense fallback={null}>
        <App />
      </Suspense>
      {showSplash && (
        <Splash
          minDurationMs={700}
          onDone={() => {
            idleCallback(() => sessionStorage.setItem(SPLASH_KEY, "1"));
            setShowSplash(false);
            markAppInteractive();
          }}
        />
      )}
    </>
  );
}

createRoot(document.getElementById("root")!).render(<Root />);
