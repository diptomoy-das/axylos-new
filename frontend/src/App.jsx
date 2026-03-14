import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import HowItWorks from './components/HowItWorks';
import LiveDashboard from './components/LiveDashboard';
import Architecture from './components/Architecture';
import CTA from './components/CTA';
import Footer from './components/Footer';

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <LiveDashboard />
        <Architecture />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
