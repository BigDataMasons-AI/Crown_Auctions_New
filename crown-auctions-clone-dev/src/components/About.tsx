import { useLanguage } from "@/contexts/LanguageContext";

export const About = () => {
  const { t, language } = useLanguage();

  return (
    <section id="about" className="py-24 bg-background relative overflow-hidden">
      {/* Decorative corners */}
      <div className="absolute top-0 left-0 w-32 h-32 border-t-2 border-l-2 border-gold/20"></div>
      <div className="absolute top-0 right-0 w-32 h-32 border-t-2 border-r-2 border-gold/20"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 border-b-2 border-l-2 border-gold/20"></div>
      <div className="absolute bottom-0 right-0 w-32 h-32 border-b-2 border-r-2 border-gold/20"></div>
      
      <div className="container mx-auto px-4 relative">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className={`text-4xl font-bold mb-6 text-navy ${language === 'ar' ? 'font-arabic' : 'font-serif'}`}>
            {t('about.title')}
          </h2>
          <p className={`text-lg text-muted-foreground leading-relaxed mb-8 ${
            language === 'ar' ? 'font-arabic text-xl' : ''
          }`}>
            {t('about.description')}
          </p>
          <div className="flex items-center justify-center gap-2">
            <div className="h-1 w-12 bg-gold rounded-full"></div>
            <div className="w-3 h-3 bg-gold rounded-full rotate-45"></div>
            <div className="h-1 w-12 bg-gold rounded-full"></div>
          </div>
        </div>
      </div>
    </section>
  );
};
