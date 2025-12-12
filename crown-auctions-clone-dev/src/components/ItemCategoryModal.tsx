import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from 'react-router-dom';
import { Diamond, Watch, Gem, Link2, Crown, Sparkles } from "lucide-react";

interface ItemCategoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const categories = [
  {
    id: 'diamonds',
    titleKey: 'itemCategory.diamonds',
    descKey: 'itemCategory.diamondsDesc',
    icon: Diamond,
  },
  {
    id: 'watches',
    titleKey: 'itemCategory.watches',
    descKey: 'itemCategory.watchesDesc',
    icon: Watch,
  },
  {
    id: 'jewelry',
    titleKey: 'itemCategory.jewelry',
    descKey: 'itemCategory.jewelryDesc',
    icon: Gem,
  },
  {
    id: 'rings',
    titleKey: 'itemCategory.rings',
    descKey: 'itemCategory.ringsDesc',
    icon: Link2,
  },
  {
    id: 'luxury',
    titleKey: 'itemCategory.luxury',
    descKey: 'itemCategory.luxuryDesc',
    icon: Crown,
  },
  {
    id: 'other',
    titleKey: 'itemCategory.other',
    descKey: 'itemCategory.otherDesc',
    icon: Sparkles,
  },
];

export const ItemCategoryModal = ({ open, onOpenChange }: ItemCategoryModalProps) => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  const handleCategoryClick = (categoryId: string) => {
    onOpenChange(false);
    navigate(`/submit-auction?category=${categoryId}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-background/98 backdrop-blur-xl border-gold/20 p-0 overflow-hidden">
        {/* Header with decorative gradient */}
        <div className="relative bg-gradient-to-br from-navy-dark via-navy to-navy-dark p-8 border-b border-gold/20">
          <div className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 0l20 20-20 20L0 20 20 0zm0 8L8 20l12 12 12-12-12-12z' fill='%23D4AF37' fill-opacity='0.3'/%3E%3C/svg%3E")`,
              backgroundSize: '40px 40px'
            }}
          />
          <DialogHeader className="relative z-10">
            <DialogTitle className={`text-2xl md:text-3xl font-bold text-center text-luxury-text ${
              language === 'ar' ? 'font-arabic' : 'font-serif'
            }`}>
              {t('itemCategory.title')}
            </DialogTitle>
            <p className={`text-center text-luxury-text/70 mt-2 ${
              language === 'ar' ? 'font-arabic' : ''
            }`}>
              {t('itemCategory.subtitle')}
            </p>
          </DialogHeader>
        </div>
        
        {/* Category Grid */}
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {categories.map((category) => {
              const IconComponent = category.icon;
              const isHovered = hoveredCategory === category.id;
              
              return (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category.id)}
                  onMouseEnter={() => setHoveredCategory(category.id)}
                  onMouseLeave={() => setHoveredCategory(null)}
                  className={`group relative flex flex-col items-center justify-center p-6 rounded-xl border transition-all duration-300 ${
                    isHovered 
                      ? 'bg-gold/10 border-gold shadow-lg shadow-gold/20 scale-[1.02]' 
                      : 'bg-muted/30 border-border/50 hover:border-gold/50'
                  }`}
                >
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 transition-all duration-300 ${
                    isHovered 
                      ? 'bg-gold text-white' 
                      : 'bg-gold/10 text-gold'
                  }`}>
                    <IconComponent className="w-7 h-7" />
                  </div>
                  <h3 className={`font-semibold text-foreground text-center mb-1 ${
                    language === 'ar' ? 'font-arabic' : ''
                  }`}>
                    {t(category.titleKey)}
                  </h3>
                  <p className={`text-xs text-muted-foreground text-center ${
                    language === 'ar' ? 'font-arabic' : ''
                  }`}>
                    {t(category.descKey)}
                  </p>
                  
                  {/* Hover indicator */}
                  <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gold transition-all duration-300 ${
                    isHovered ? 'w-3/4' : ''
                  }`} />
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Footer hint */}
        <div className="px-6 pb-6">
          <p className={`text-center text-sm text-muted-foreground ${
            language === 'ar' ? 'font-arabic' : ''
          }`}>
            {t('itemCategory.hint')}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
