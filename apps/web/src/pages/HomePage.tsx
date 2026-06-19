import { MarketingLayout } from '../components/marketing/MarketingLayout';
import { HeroSection } from '../components/marketing/HeroSection';
import { FeaturesSection } from '../components/marketing/FeaturesSection';
import { HowItWorksSection } from '../components/marketing/HowItWorksSection';
import { CtaSection } from '../components/marketing/CtaSection';
import { Footer } from '../components/marketing/Footer';

export function HomePage() {
  return (
    <MarketingLayout>
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <CtaSection />
      <Footer />
    </MarketingLayout>
  );
}
