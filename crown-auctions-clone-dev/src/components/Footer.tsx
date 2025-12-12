import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Globe } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const REGIONS = [
  { value: 'global', label: '🌍 Global' },
  { value: 'QA', label: '🇶🇦 Qatar' },
  { value: 'AE', label: '🇦🇪 UAE' },
  { value: 'SA', label: '🇸🇦 Saudi Arabia' },
  { value: 'KW', label: '🇰🇼 Kuwait' },
  { value: 'BH', label: '🇧🇭 Bahrain' },
  { value: 'OM', label: '🇴🇲 Oman' },
  { value: 'EG', label: '🇪🇬 Egypt' },
  { value: 'GB', label: '🇬🇧 UK' },
  { value: 'FR', label: '🇫🇷 France' },
  { value: 'DE', label: '🇩🇪 Germany' },
  { value: 'CH', label: '🇨🇭 Switzerland' },
  { value: 'US', label: '🇺🇸 USA' },
  { value: 'SG', label: '🇸🇬 Singapore' },
  { value: 'HK', label: '🇭🇰 Hong Kong' },
];

export const Footer = () => {
  const { t, language } = useLanguage();
  const [selectedRegion, setSelectedRegion] = useState('global');

  useEffect(() => {
    const cachedRegion = localStorage.getItem('user_region');
    if (cachedRegion) {
      setSelectedRegion(cachedRegion);
    }
  }, []);

  const handleRegionChange = (newRegion: string) => {
    setSelectedRegion(newRegion);
    localStorage.setItem('user_region', newRegion);
    localStorage.setItem('user_region_timestamp', Date.now().toString());
    // Reload to apply new region
    window.location.reload();
  };

  return (
    <footer className="bg-surface-dark text-luxury-text py-12 relative overflow-hidden border-t-2 border-gold/30">
      {/* Decorative pattern */}
      <div className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l30 30-30 30L0 30 30 0zm0 10L10 30l20 20 20-20-20-20z' fill='%23D4AF37' fill-opacity='0.4'/%3E%3C/svg%3E")`,
        }}
      />
      
      <div className="container mx-auto px-4 relative">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className={`flex items-center mb-4 ${language === 'ar' ? 'space-x-reverse' : ''} space-x-2`}>
              <div className="w-8 h-8 bg-gold rounded-sm transform rotate-45 shadow-lg shadow-gold/30"></div>
              <h3 className={`text-xl font-bold ${language === 'ar' ? 'font-arabic' : ''}`}>CROWN AUCTIONS</h3>
            </div>
            <p className={`text-luxury-text/70 text-sm ${language === 'ar' ? 'font-arabic' : ''}`}>
              {t('footer.tagline')}
            </p>
          </div>
          
          <div>
            <h4 className={`font-bold mb-4 text-gold ${language === 'ar' ? 'font-arabic' : ''}`}>
              {t('footer.quickLinks')}
            </h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#home" className={`text-luxury-text/70 hover:text-gold transition-colors ${language === 'ar' ? 'font-arabic' : ''}`}>{t('nav.home')}</a></li>
              <li><a href="#about" className={`text-luxury-text/70 hover:text-gold transition-colors ${language === 'ar' ? 'font-arabic' : ''}`}>{t('nav.about')}</a></li>
              <li><a href="#buyers" className={`text-luxury-text/70 hover:text-gold transition-colors ${language === 'ar' ? 'font-arabic' : ''}`}>{t('footer.buyers')}</a></li>
              <li><a href="#sellers" className={`text-luxury-text/70 hover:text-gold transition-colors ${language === 'ar' ? 'font-arabic' : ''}`}>{t('footer.sellers')}</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className={`font-bold mb-4 text-gold ${language === 'ar' ? 'font-arabic' : ''}`}>
              {t('footer.services')}
            </h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className={`text-luxury-text/70 hover:text-gold transition-colors ${language === 'ar' ? 'font-arabic' : ''}`}>{t('footer.browseAuctions')}</a></li>
              <li><a href="#" className={`text-luxury-text/70 hover:text-gold transition-colors ${language === 'ar' ? 'font-arabic' : ''}`}>{t('footer.valuationServices')}</a></li>
              <li><a href="#" className={`text-luxury-text/70 hover:text-gold transition-colors ${language === 'ar' ? 'font-arabic' : ''}`}>{t('footer.sellWithUs')}</a></li>
              <li><a href="#" className={`text-luxury-text/70 hover:text-gold transition-colors ${language === 'ar' ? 'font-arabic' : ''}`}>{t('footer.authentication')}</a></li>
              <li><a href="/appraisers/apply" className={`text-luxury-text/70 hover:text-gold transition-colors ${language === 'ar' ? 'font-arabic' : ''}`}>{t('footer.becomeAppraiser')}</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className={`font-bold mb-4 text-gold ${language === 'ar' ? 'font-arabic' : ''}`}>
              {t('footer.contact')}
            </h4>
            <ul className={`space-y-2 text-sm text-luxury-text/70 ${language === 'ar' ? 'font-arabic' : ''}`}>
              <li>{t('footer.email')}: info@crownauctions.com</li>
              <li>{t('footer.phone')}: +61 123 456 789</li>
              <li>{t('footer.licensedAuctioneer')}</li>
              <li>ABN: 12 345 678 901</li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gold/30 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className={`text-sm text-luxury-text/60 ${language === 'ar' ? 'font-arabic' : ''}`}>
            &copy; {new Date().getFullYear()} {t('footer.copyright')}
          </p>
          
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-luxury-text/60" />
            <Select value={selectedRegion} onValueChange={handleRegionChange}>
              <SelectTrigger className="w-[140px] h-8 bg-transparent border-gold/30 text-luxury-text/70 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REGIONS.map(region => (
                  <SelectItem key={region.value} value={region.value}>
                    {region.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </footer>
  );
};
