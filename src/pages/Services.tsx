import { useState } from 'react';
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Diamond, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const navigationItems = {
  'Our Service': [
    { label: 'How it Works', link: '/how-it-works' },
    { label: 'FAQs', link: '/faqs' },
    { label: 'Accepted Jewelry', link: '/accepted-jewelry' },
    { label: 'Selling Safely', link: '/selling-safely' },
  ],
  'Explore': [
    { label: 'Diamond Grading', link: '/diamond-grading' },
    { label: 'Sell Jewelry', link: '/sell-jewelry' },
    { label: 'Sell Diamond Ring', link: '/sell-diamond-ring' },
    { label: 'Sell Engagement Ring', link: '/sell-engagement-ring' },
    { label: 'Sell Watches', link: '/sell-watches' },
    { label: 'Diamond Appraisal', link: '/diamond-appraisal' },
  ],
  'Company': [
    { label: 'About Us', link: '/about' },
    { label: 'Reviews', link: '/reviews' },
    { label: 'Careers', link: '/careers' },
    { label: 'Contact Us', link: '/contact' },
    { label: 'Press', link: '/press' },
  ],
};

const Services = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [expandedSection, setExpandedSection] = useState<string | null>('Our Service');

  const handleLinkClick = (link: string) => {
    navigate(link);
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-dark via-navy to-navy-dark">
      {/* Decorative Pattern */}
      <div className="fixed inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l30 30-30 30L0 30 30 0zm0 10L10 30l20 20 20-20-20-20z' fill='%23D4AF37' fill-opacity='0.3'/%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-8 text-luxury-text/70 hover:text-gold hover:bg-gold/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gold/10 border border-gold/30 mb-6">
            <Diamond className="w-8 h-8 text-gold" />
          </div>
          <h1 className={`text-4xl md:text-5xl font-bold text-luxury-text mb-4 ${
            language === 'ar' ? 'font-arabic' : 'font-serif'
          }`}>
            {t('itemCategory.title')}
          </h1>
          <p className={`text-lg text-luxury-text/70 max-w-2xl mx-auto ${
            language === 'ar' ? 'font-arabic' : ''
          }`}>
            {t('itemCategory.subtitle')}
          </p>
        </div>

        {/* Navigation Sections */}
        <div className="space-y-4 mb-12">
          {Object.entries(navigationItems).map(([category, items]) => (
            <div key={category} className="bg-background/5 backdrop-blur-sm rounded-xl border border-gold/10 overflow-hidden">
              <button
                onClick={() => toggleSection(category)}
                className="w-full flex items-center justify-between p-5 hover:bg-gold/5 transition-all duration-300"
              >
                <span className={`font-semibold text-luxury-text uppercase tracking-wider text-base ${
                  language === 'ar' ? 'font-arabic' : ''
                }`}>
                  {category}
                </span>
                <ChevronDown 
                  className={`w-5 h-5 text-gold transition-transform duration-300 ${
                    expandedSection === category ? 'rotate-180' : ''
                  }`} 
                />
              </button>
              
              {/* Dropdown Items */}
              <div className={`overflow-hidden transition-all duration-300 ${
                expandedSection === category ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
              }`}>
                <div className="border-t border-gold/10">
                  {items.map((item, index) => (
                    <button
                      key={item.label}
                      onClick={() => handleLinkClick(item.link)}
                      className={`w-full text-left px-6 py-4 text-luxury-text/80 hover:bg-gold/10 hover:text-gold hover:pl-8 transition-all duration-200 ${
                        index !== items.length - 1 ? 'border-b border-gold/5' : ''
                      } ${language === 'ar' ? 'font-arabic text-right hover:pr-8 hover:pl-6' : ''}`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <div className="text-center">
          <Button
            variant="gold"
            size="lg"
            onClick={() => navigate('/submit-auction')}
            className="px-12 py-6 h-auto text-base uppercase shadow-lg shadow-gold/30 hover:shadow-gold/50"
          >
            Start Selling
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Services;
