import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

export const LanguageSwitcher = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-1">
      <Button
        variant={language === 'en' ? 'gold' : 'gold-outline'}
        size="sm"
        onClick={() => setLanguage('en')}
        className="min-w-[50px] px-2"
      >
        EN
      </Button>
      <Button
        variant={language === 'fr' ? 'gold' : 'gold-outline'}
        size="sm"
        onClick={() => setLanguage('fr')}
        className="min-w-[50px] px-2"
      >
        FR
      </Button>
      <Button
        variant={language === 'ar' ? 'gold' : 'gold-outline'}
        size="sm"
        onClick={() => setLanguage('ar')}
        className="min-w-[50px] px-2 font-arabic"
      >
        عربي
      </Button>
    </div>
  );
};
