import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export const Testimonials = () => {
  const { t } = useLanguage();
  
  const testimonials = [
    {
      textKey: 'testimonials.1.text',
      authorKey: 'testimonials.1.author',
      rating: 5
    },
    {
      textKey: 'testimonials.2.text',
      authorKey: 'testimonials.2.author',
      rating: 5
    },
    {
      textKey: 'testimonials.3.text',
      authorKey: 'testimonials.3.author',
      rating: 5
    }
  ];

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">{t('testimonials.title')}</h2>
          <div className="w-24 h-1 bg-gold mx-auto"></div>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <Card 
              key={index} 
              className="border-2 hover:border-gold transition-all duration-300 hover:shadow-lg"
            >
              <CardContent className="pt-6">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-[#D4AF37] text-[#D4AF37]" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-6 italic">
                  "{t(testimonial.textKey)}"
                </p>
                <p className="font-semibold text-gold">— {t(testimonial.authorKey)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
