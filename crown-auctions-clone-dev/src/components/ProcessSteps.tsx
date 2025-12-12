import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { FileText, Truck, Settings, Monitor, Banknote, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { NavigationMenuPopup } from './NavigationMenuPopup';

import processStep1 from '@/assets/process-step-1-form.jpg';
import processStep2 from '@/assets/process-step-2-shipping.jpg';
import processStep3 from '@/assets/process-step-3-preparation.jpg';
import processStep4 from '@/assets/process-step-4-auction.jpg';
import processStep5 from '@/assets/process-step-5-payment.jpg';
import fedexLogo from '@/assets/fedex-logo.jpg';
import webrotateLogo from '@/assets/webrotate-logo.jpg';
import igiLogo from '@/assets/igi-logo.jpg';
import paymentMethodsLogo from '@/assets/payment-methods-3.jpg';
import brandRolex from '@/assets/brand-rolex.png';
import brandCartier from '@/assets/brand-cartier.png';
import brandPatek from '@/assets/brand-patek.png';
import brandOmega from '@/assets/brand-omega.png';
import brandAP from '@/assets/brand-ap.png';
import brandBreitling from '@/assets/brand-breitling.png';

interface Step {
  number: string;
  titleKey: string;
  descriptionKey: string;
  detailsKeys: string[];
  icon: React.ReactNode;
  image: string;
}

const steps: Step[] = [
  {
    number: '01',
    titleKey: 'process.step1.title',
    descriptionKey: 'process.step1.description',
    detailsKeys: ['process.step1.detail1', 'process.step1.detail2', 'process.step1.detail3'],
    icon: <FileText className="w-6 h-6" />,
    image: processStep1,
  },
  {
    number: '02',
    titleKey: 'process.step2.title',
    descriptionKey: 'process.step2.description',
    detailsKeys: ['process.step2.detail1', 'process.step2.detail2', 'process.step2.detail3'],
    icon: <Truck className="w-6 h-6" />,
    image: processStep2,
  },
  {
    number: '03',
    titleKey: 'process.step3.title',
    descriptionKey: 'process.step3.description',
    detailsKeys: ['process.step3.detail1', 'process.step3.detail2', 'process.step3.detail3'],
    icon: <Settings className="w-6 h-6" />,
    image: processStep3,
  },
  {
    number: '04',
    titleKey: 'process.step4.title',
    descriptionKey: 'process.step4.description',
    detailsKeys: ['process.step4.detail1', 'process.step4.detail2', 'process.step4.detail3'],
    icon: <Monitor className="w-6 h-6" />,
    image: processStep4,
  },
  {
    number: '05',
    titleKey: 'process.step5.title',
    descriptionKey: 'process.step5.description',
    detailsKeys: ['process.step5.detail1', 'process.step5.detail2', 'process.step5.detail3'],
    icon: <Banknote className="w-6 h-6" />,
    image: processStep5,
  },
];

export const ProcessSteps = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  const isRTL = language === 'ar';

  // Handle scroll detection
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const containerWidth = container.clientWidth;
      let newActiveStep: number;
      
      if (isRTL) {
        // For RTL, scrollLeft is negative or we calculate from the right
        const maxScroll = container.scrollWidth - containerWidth;
        const scrollPosition = Math.abs(container.scrollLeft);
        newActiveStep = Math.round(scrollPosition / containerWidth);
      } else {
        const scrollLeft = container.scrollLeft;
        newActiveStep = Math.round(scrollLeft / containerWidth);
      }
      
      setActiveStep(Math.min(Math.max(newActiveStep, 0), steps.length - 1));
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [isRTL]);

  // Auto-play functionality
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setActiveStep((prev) => {
        const nextStep = prev < steps.length - 1 ? prev + 1 : 0;
        scrollToStep(nextStep);
        return nextStep;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [isPaused, activeStep]);

  const scrollToStep = (index: number) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    const containerWidth = container.clientWidth;
    
    if (isRTL) {
      // For RTL, scroll position is negative
      container.scrollTo({
        left: -index * containerWidth,
        behavior: 'smooth'
      });
    } else {
      container.scrollTo({
        left: index * containerWidth,
        behavior: 'smooth'
      });
    }
  };

  const scrollNext = () => {
    if (activeStep < steps.length - 1) {
      scrollToStep(activeStep + 1);
    } else {
      scrollToStep(0);
    }
  };

  const scrollPrev = () => {
    if (activeStep > 0) {
      scrollToStep(activeStep - 1);
    } else {
      scrollToStep(steps.length - 1);
    }
  };

  return (
    <section 
      className="relative bg-gradient-to-b from-background via-navy-dark/5 to-background py-20"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Section Header */}
      <div className="container mx-auto px-4 text-center mb-12">
        <span className="inline-block px-4 py-2 bg-gold/10 border border-gold/30 rounded-full text-gold text-sm font-medium mb-6">
          {t('process.badge')}
        </span>
        <h2 className={`text-4xl md:text-5xl font-bold text-foreground mb-6 ${
          language === 'ar' ? 'font-arabic' : 'font-serif'
        }`}>
          {t('process.title')}
        </h2>
        <p className={`text-lg text-muted-foreground max-w-2xl mx-auto ${
          language === 'ar' ? 'font-arabic text-xl' : ''
        }`}>
          {t('process.subtitle')}
        </p>
      </div>

      {/* Step Flow Timeline */}
      <div className="container mx-auto px-4 mb-8">
        <div className={`flex items-center justify-center gap-1 sm:gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <button
                onClick={() => scrollToStep(index)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full transition-all duration-500 ${
                  activeStep === index 
                    ? 'bg-gold text-white scale-105 shadow-lg shadow-gold/30' 
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                }`}
              >
                <span className={`transition-transform duration-300 ${activeStep === index ? 'scale-110' : ''}`}>
                  {step.icon}
                </span>
                <span className={`text-sm font-medium hidden md:inline ${
                  language === 'ar' ? 'font-arabic' : ''
                }`}>
                  {t(step.titleKey)}
                </span>
              </button>
              {index < steps.length - 1 && (
                <div className={`w-4 sm:w-8 lg:w-12 h-0.5 mx-1 transition-all duration-500 ${
                  isRTL 
                    ? (index < activeStep ? 'bg-gold' : 'bg-muted-foreground/30')
                    : (index < activeStep ? 'bg-gold' : 'bg-muted-foreground/30')
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      <div className="container mx-auto px-4 relative">
        <Button
          variant="outline"
          size="icon"
          onClick={scrollPrev}
          disabled={activeStep === 0}
          className={`absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-background/80 backdrop-blur-sm border-gold/30 hover:bg-gold hover:text-white transition-all duration-300 ${
            activeStep === 0 ? 'opacity-30 cursor-not-allowed' : 'opacity-100'
          }`}
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={scrollNext}
          disabled={activeStep === steps.length - 1}
          className={`absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-background/80 backdrop-blur-sm border-gold/30 hover:bg-gold hover:text-white transition-all duration-300 ${
            activeStep === steps.length - 1 ? 'opacity-30 cursor-not-allowed' : 'opacity-100'
          }`}
        >
          <ChevronRight className="w-5 h-5" />
        </Button>

        {/* Horizontal Scroll Container */}
        <div
          ref={scrollContainerRef}
          className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          {steps.map((step, index) => (
            <div
              key={step.number}
              ref={(el) => (stepRefs.current[index] = el)}
              className="flex-shrink-0 w-full snap-center px-4 sm:px-8 lg:px-16"
            >
              <div className={`grid lg:grid-cols-2 gap-8 lg:gap-12 items-center max-w-6xl mx-auto transition-all duration-700 ${
                activeStep === index ? 'opacity-100 scale-100' : 'opacity-50 scale-95'
              }`}>
                {/* Image */}
                <div className={`relative group ${index % 2 === 1 ? 'lg:order-2' : ''}`}>
                  <div className="relative overflow-hidden rounded-2xl shadow-2xl">
                    <div className="absolute inset-0 bg-gradient-to-t from-navy-dark/80 via-transparent to-transparent z-10" />
                    <img
                      src={step.image}
                      alt={t(step.titleKey)}
                      className="w-full h-[300px] lg:h-[400px] object-cover transform group-hover:scale-105 transition-transform duration-700"
                    />
                    
                    {/* Step Number Overlay */}
                    <div className="absolute top-4 left-4 z-20">
                      <span className="text-6xl lg:text-8xl font-serif font-bold text-gold/30">
                        {step.number}
                      </span>
                    </div>
                  </div>
                  
                  {/* Decorative Element */}
                  <div className="absolute -bottom-3 -right-3 w-20 h-20 border-2 border-gold/30 rounded-2xl -z-10 transition-transform duration-500 group-hover:translate-x-1 group-hover:translate-y-1" />
                  
                  {/* IGI Logo for Fill Out Form Step */}
                  {index === 0 && (
                    <div className="absolute bottom-4 right-4 z-20">
                      <img 
                        src={igiLogo} 
                        alt="International Gemological Institute" 
                        className="h-16 w-auto object-contain bg-white rounded-lg px-3 py-2 shadow-lg grayscale"
                      />
                    </div>
                  )}
                  
                  {/* FedEx Logo for Shipping Step */}
                  {index === 1 && (
                    <div className="absolute bottom-4 right-4 z-20">
                      <img 
                        src={fedexLogo} 
                        alt="FedEx" 
                        className="h-8 w-auto object-contain bg-white/90 rounded px-2 py-1"
                      />
                    </div>
                  )}
                  
                  {/* WebRotate 360 Logo for Prep for Sale Step */}
                  {index === 2 && (
                    <div className="absolute bottom-4 right-4 z-20">
                      <img 
                        src={webrotateLogo} 
                        alt="WebRotate 360" 
                        className="h-16 w-auto object-contain bg-white rounded-lg px-3 py-2 shadow-lg grayscale"
                      />
                    </div>
                  )}
                  
                  {/* Watch Brand Logos for Online Auction Step */}
                  {index === 3 && (
                    <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-lg">
                      <img src={brandRolex} alt="Rolex" className="h-16 w-auto object-contain" />
                      <img src={brandCartier} alt="Cartier" className="h-16 w-auto object-contain" />
                      <img src={brandPatek} alt="Patek Philippe" className="h-16 w-auto object-contain" />
                      <img src={brandOmega} alt="Omega" className="h-16 w-auto object-contain" />
                      <img src={brandAP} alt="Audemars Piguet" className="h-16 w-auto object-contain" />
                      <img src={brandBreitling} alt="Breitling" className="h-16 w-auto object-contain" />
                    </div>
                  )}
                  
                  {/* Payment Methods Logo for Get Paid Step */}
                  {index === 4 && (
                    <div className="absolute bottom-4 right-4 z-20">
                      <img 
                        src={paymentMethodsLogo} 
                        alt="Payment Methods" 
                        className="h-12 w-auto object-contain bg-white rounded-lg px-3 py-2 shadow-lg"
                      />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className={`${index % 2 === 1 ? 'lg:order-1' : ''}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center text-gold">
                      {step.icon}
                    </div>
                    <div>
                      <span className="text-gold font-medium text-xs tracking-wider uppercase">
                        {t('process.stepLabel')} {step.number}
                      </span>
                      <h3 className={`text-2xl lg:text-3xl font-bold text-foreground ${
                        language === 'ar' ? 'font-arabic' : 'font-serif'
                      }`}>
                        {t(step.titleKey)}
                      </h3>
                    </div>
                  </div>

                  <p className={`text-muted-foreground mb-6 ${
                    language === 'ar' ? 'font-arabic text-lg' : ''
                  }`}>
                    {t(step.descriptionKey)}
                  </p>

                  {/* Detail Cards */}
                  <div className="space-y-3">
                    {step.detailsKeys.map((detailKey, detailIndex) => (
                      <div
                        key={detailKey}
                        className="p-3 rounded-xl bg-muted/30 border border-border/50 hover:border-gold/30 transition-all duration-300 hover:shadow-md hover:scale-[1.01]"
                        style={{ 
                          animationDelay: `${detailIndex * 100}ms`,
                          opacity: activeStep === index ? 1 : 0.5,
                          transform: activeStep === index ? 'translateX(0)' : 'translateX(-10px)',
                          transition: `all 0.5s ease ${detailIndex * 0.1}s`
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-5 h-5 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-gold" />
                          </div>
                          <p className={`text-sm text-foreground ${
                            language === 'ar' ? 'font-arabic' : ''
                          }`}>
                            {t(detailKey)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Step Indicator Dots */}
      <div className="flex items-center justify-center gap-3 mt-8">
        {steps.map((_, index) => (
          <button
            key={index}
            onClick={() => scrollToStep(index)}
            className={`transition-all duration-500 rounded-full ${
              activeStep === index
                ? 'w-8 h-2 bg-gold'
                : 'w-2 h-2 bg-muted-foreground/40 hover:bg-gold/60'
            }`}
          />
        ))}
      </div>

      {/* Progress Bar */}
      <div className="container mx-auto px-4 mt-8">
        <div className="max-w-md mx-auto h-1 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-gold to-gold-light transition-all duration-500 ease-out rounded-full"
            style={{ width: `${((activeStep + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Get Started CTA */}
      <div className="container mx-auto px-4 mt-12 text-center">
        {user ? (
          <Button 
            variant="gold" 
            size="lg" 
            asChild 
            className="group px-8 py-6 text-lg font-semibold shadow-lg shadow-gold/30 hover:shadow-xl hover:shadow-gold/40 transition-all duration-300"
          >
            <Link to="/submit-auction">
              {t('process.cta')}
              <ArrowRight className={`ml-2 h-5 w-5 transition-transform group-hover:translate-x-1 ${isRTL ? 'rotate-180 mr-2 ml-0' : ''}`} />
            </Link>
          </Button>
        ) : (
          <Button 
            variant="gold" 
            size="lg" 
            onClick={() => setShowCategoryModal(true)}
            className="group px-8 py-6 text-lg font-semibold shadow-lg shadow-gold/30 hover:shadow-xl hover:shadow-gold/40 transition-all duration-300"
          >
            {t('process.cta')}
            <ArrowRight className={`ml-2 h-5 w-5 transition-transform group-hover:translate-x-1 ${isRTL ? 'rotate-180 mr-2 ml-0' : ''}`} />
          </Button>
        )}
        <p className={`text-muted-foreground mt-4 ${language === 'ar' ? 'font-arabic' : ''}`}>
          {t('process.ctaSubtext')}
        </p>
      </div>

      <NavigationMenuPopup 
        open={showCategoryModal} 
        onOpenChange={setShowCategoryModal} 
      />

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
};
