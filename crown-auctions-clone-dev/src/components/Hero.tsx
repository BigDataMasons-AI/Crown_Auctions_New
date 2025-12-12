import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
// Fallback images
import heroImage1 from "@/assets/hero-luxury-auction.jpg";
import heroImage2 from "@/assets/hero-alibid.png";
import heroImage3 from "@/assets/hero-alibid-uae.png";
import heroImage4 from "@/assets/hero-alibid-qatar.png";
import { useLanguage } from "@/contexts/LanguageContext";
import { NavigationMenuPopup } from "./NavigationMenuPopup";

const fallbackImages = [heroImage1, heroImage2, heroImage3, heroImage4];

const steps = [
  {
    number: "1",
    titleKey: "hero.step1.title",
    descKey: "hero.step1.desc",
    titleFallback: "TELL US ABOUT YOUR ITEMS",
    descFallback: "Include photos and any relevant documents or certificates. Detailed information will improve our level of service."
  },
  {
    number: "2",
    titleKey: "hero.step2.title",
    descKey: "hero.step2.desc",
    titleFallback: "SCHEDULE A VISIT",
    descFallback: "Select a date and time to meet privately with our expert. Receive a free evaluation of your items with no obligation to sell."
  },
  {
    number: "3",
    titleKey: "hero.step3.title",
    descKey: "hero.step3.desc",
    titleFallback: "MEET WITH AN EXPERT TO RECEIVE AN OFFER",
    descFallback: "Upon review of your items, we'll provide a purchase offer. There are no fees or commissions for our service."
  },
  {
    number: "4",
    titleKey: "hero.step4.title",
    descKey: "hero.step4.desc",
    titleFallback: "GET PAID",
    descFallback: "Receive immediate payment by bank transfer."
  }
];

export const Hero = () => {
  const { t, language } = useLanguage();
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [heroImages, setHeroImages] = useState<string[]>(fallbackImages);
  const [autoScrollInterval, setAutoScrollInterval] = useState(8000);
  const [pauseOnHover, setPauseOnHover] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [userRegion, setUserRegion] = useState<string>('global');

  useEffect(() => {
    detectUserRegion();
    fetchHeroSettings();
  }, []);

  useEffect(() => {
    fetchHeroImages(userRegion);
  }, [userRegion]);

  const detectUserRegion = async () => {
    // Check localStorage cache first
    const cachedRegion = localStorage.getItem('user_region');
    const cacheTimestamp = localStorage.getItem('user_region_timestamp');
    const cacheMaxAge = 24 * 60 * 60 * 1000; // 24 hours

    if (cachedRegion && cacheTimestamp) {
      const age = Date.now() - parseInt(cacheTimestamp);
      if (age < cacheMaxAge) {
        setUserRegion(cachedRegion);
        console.log('Using cached region:', cachedRegion);
        return;
      }
    }

    try {
      const { data, error } = await supabase.functions.invoke('detect-region');
      if (error) throw error;
      if (data?.region) {
        setUserRegion(data.region);
        // Cache the result
        localStorage.setItem('user_region', data.region);
        localStorage.setItem('user_region_timestamp', Date.now().toString());
        console.log('Detected and cached region:', data.region, data.country);
      }
    } catch (error) {
      console.error('Error detecting region:', error);
      setUserRegion('global');
    }
  };

  const fetchHeroImages = async (region: string) => {
    try {
      // First try to get images for the specific region
      let { data, error } = await supabase
        .from('hero_images')
        .select('image_url, region')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      
      if (data && data.length > 0) {
        // Filter images: show region-specific + global images
        const filteredImages = data.filter(
          img => img.region === region || img.region === 'global'
        );
        
        if (filteredImages.length > 0) {
          setHeroImages(filteredImages.map(img => img.image_url));
        } else {
          // If no region match, show all images
          setHeroImages(data.map(img => img.image_url));
        }
      }
    } catch (error) {
      console.error('Error fetching hero images:', error);
    }
  };

  const fetchHeroSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('hero_settings')
        .select('auto_scroll_interval, pause_on_hover')
        .single();

      if (error) throw error;
      if (data) {
        setAutoScrollInterval(data.auto_scroll_interval);
        setPauseOnHover(data.pause_on_hover);
      }
    } catch (error) {
      console.error('Error fetching hero settings:', error);
    }
  };

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
    }, autoScrollInterval);
    return () => clearInterval(interval);
  }, [heroImages.length, autoScrollInterval, isPaused]);

  const goToPrevious = () => {
    setCurrentImageIndex((prev) => (prev - 1 + heroImages.length) % heroImages.length);
  };

  const goToNext = () => {
    setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
  };

  const goToSlide = (index: number) => {
    setCurrentImageIndex(index);
  };

  const handleMouseEnter = () => {
    if (pauseOnHover) setIsPaused(true);
  };

  const handleMouseLeave = () => {
    if (pauseOnHover) setIsPaused(false);
  };

  return (
    <section 
      id="home" 
      className="relative bg-surface-dark"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="h-full">
        <div className="grid lg:grid-cols-2 gap-0 items-stretch">
          {/* Left Side - Content */}
          <div className={`py-12 lg:py-20 px-8 lg:px-16 flex flex-col justify-center ${language === 'ar' ? 'lg:order-2' : ''}`}>
            <h2 className={`text-3xl md:text-4xl lg:text-5xl text-white mb-12 lg:mb-16 ${
              language === 'ar' ? 'font-arabic' : 'font-serif italic'
            }`}>
              {t('hero.howItWorks')}
            </h2>
            
            <div className="space-y-8 lg:space-y-10">
              {steps.map((step, index) => (
                <div key={index} className="flex gap-6 lg:gap-8">
                  <span className="text-4xl lg:text-5xl font-light text-[#4a4a4a] flex-shrink-0 w-8">
                    {step.number}
                  </span>
                  <div>
                    <h3 className={`text-sm lg:text-base font-semibold tracking-wider text-white mb-2 ${
                      language === 'ar' ? 'font-arabic' : ''
                    }`}>
                      {t(step.titleKey) !== step.titleKey ? t(step.titleKey) : step.titleFallback}
                    </h3>
                    <p className={`text-sm lg:text-base text-gray-400 leading-relaxed ${
                      language === 'ar' ? 'font-arabic' : ''
                    }`}>
                      {t(step.descKey) !== step.descKey ? t(step.descKey) : step.descFallback}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <Button 
              size="lg" 
              className="mt-10 lg:mt-14 bg-transparent text-white border border-white/40 hover:bg-white hover:text-[#1a1a1a] transition-all px-8 py-6 h-auto uppercase tracking-wider text-sm"
              onClick={() => setShowCategoryModal(true)}
            >
              {t('hero.cta')}
            </Button>
          </div>

          {/* Right Side - Image Carousel */}
          <div className={`relative min-h-[300px] lg:min-h-0 overflow-hidden ${language === 'ar' ? 'lg:order-1' : ''}`}>
            {/* Images */}
            {heroImages.map((img, index) => (
              <img 
                key={index}
                src={img}
                alt={`Hero ${index + 1}`}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-[2000ms] ${
                  currentImageIndex === index ? 'opacity-100' : 'opacity-0'
                }`}
              />
            ))}

            {/* Navigation Arrows */}
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/40 backdrop-blur-sm border border-white/20 text-white hover:bg-black/60 transition-all"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/40 backdrop-blur-sm border border-white/20 text-white hover:bg-black/60 transition-all"
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Navigation Dots */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
              {heroImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    currentImageIndex === index 
                      ? 'bg-white scale-125' 
                      : 'bg-white/40 hover:bg-white/60'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <NavigationMenuPopup 
        open={showCategoryModal} 
        onOpenChange={setShowCategoryModal} 
      />
    </section>
  );
};
