import { useState, useEffect, useRef } from 'react';
import Hero from './components/Hero';
import LiveDemo from './components/LiveDemo';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import { Analytics } from '@vercel/analytics/react';

const HF_SPACE_URL = "https://CihanEmre-ModelsSpace.hf.space";

const LOADING_MESSAGES = [
  "Model initializing...",
  "Service waking up...",
  "Loading neural network...",
  "Almost ready...",
];

function App() {
  const [modelReady, setModelReady] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const msgInterval = setInterval(() => {
      setLoadingMsgIdx((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 1800);

    let prog = 0;
    progressRef.current = setInterval(() => {
      prog += 1.5;
      setLoadingProgress(Math.min(prog, 95));
    }, 300);

    const ping = async () => {
      try {
        const [res] = await Promise.all([
          fetch(`${HF_SPACE_URL}/health`),
          new Promise((resolve) => setTimeout(resolve, 2500)),
        ]);
        if ((res as Response).ok) {
          if (progressRef.current) clearInterval(progressRef.current);
          setLoadingProgress(100);
          setLoadingMsgIdx(3);
          setTimeout(() => setModelReady(true), 600);
        } else {
          setTimeout(ping, 3000);
        }
      } catch {
        setTimeout(ping, 3000);
      }
    };

    setTimeout(ping, 1000);

    return () => {
      clearInterval(msgInterval);
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, []);

  const loadingMessage = LOADING_MESSAGES[loadingMsgIdx];

  return (
    <>
      <Sidebar />
      <div className="main-content" style={{ marginLeft: "var(--sidebar-width)" }}>
        <Hero
          onDemoClick={() =>
            document.getElementById("live-demo")?.scrollIntoView({ behavior: "smooth" })
          }
          loadingProgress={loadingProgress}
          loadingMessage={loadingMessage}
          modelReady={modelReady}
        />
        <LiveDemo
          modelReady={modelReady}
          loadingProgress={loadingProgress}
          loadingMessage={loadingMessage}
        />
      </div>
      <Navbar />
      <Analytics />
    </>
  );
}

export default App;
