import { Shield, Award, Gem } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export const Features = () => {
  const { t, language } = useLanguage();

  const features = [
    {
      icon: Shield,
      titleKey: "features.trusted.title",
      descriptionKey: "features.trusted.description"
    },
    {
      icon: Award,
      titleKey: "features.expert.title",
      descriptionKey: "features.expert.description"
    },
    {
      icon: Gem,
      titleKey: "features.premium.title",
      descriptionKey: "features.premium.description"
    }
  ];

  return (
    <section className="py-24 bg-navy/5 relative overflow-hidden">
      {/* Decorative pattern */}
      <div className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23D4AF37' fill-opacity='0.4'%3E%3Cpath d='M40 0l40 40-40 40L0 40 40 0zm0 20L20 40l20 20 20-20-20-20z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      
      <div className="container mx-auto px-4 relative">
        <div className="grid md:grid-cols-3 gap-12">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="text-center group hover:transform hover:scale-105 transition-all duration-300 bg-background/50 backdrop-blur-sm p-8 rounded-lg border border-gold/20 hover:border-gold/40 hover:shadow-lg hover:shadow-gold/10"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gold/20 to-gold/10 rounded-full mb-6 group-hover:from-gold group-hover:to-gold-dark group-hover:shadow-lg group-hover:shadow-gold/30 transition-all duration-300 border-2 border-gold/30">
                <feature.icon className="w-10 h-10 text-gold group-hover:text-navy transition-colors" />
              </div>
              <h3 className={`text-xl font-bold mb-4 text-navy ${language === 'ar' ? 'font-arabic' : ''}`}>
                {t(feature.titleKey)}
              </h3>
              <p className={`text-muted-foreground leading-relaxed ${language === 'ar' ? 'font-arabic text-lg' : ''}`}>
                {t(feature.descriptionKey)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
