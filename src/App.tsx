import { useEffect, useState } from 'react';
import { ThemeProvider } from './hooks/useTheme';
import { BackgroundCanvas } from './components/BackgroundCanvas';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Services } from './components/Services';
import { About } from './components/About';
import { Contact } from './components/Contact';
import { Footer } from './components/Footer';

function initialAnimPaused(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function AppContent() {
  const [animPaused, setAnimPaused] = useState(initialAnimPaused);

  // If the OS switches to reduced motion while the page is open, stop the animation.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) setAnimPaused(true);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return (
    <>
      <BackgroundCanvas paused={animPaused} onTogglePause={() => setAnimPaused((p) => !p)} />
      <div className="app-shell">
        <Header />
        <main id="main-content">
          <Hero />
          <Services />
          <About />
          <Contact />
        </main>
        <Footer />
      </div>
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
