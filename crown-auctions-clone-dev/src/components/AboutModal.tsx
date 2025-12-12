import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Building2, Target, Users, Award, Clock, Globe, Mail, Send, Phone, MapPin, Instagram, Facebook, Twitter, Linkedin, MessageCircle, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

import teamJames from "@/assets/team-james-richardson.jpg";
import teamSarah from "@/assets/team-sarah-chen.jpg";
import teamMichael from "@/assets/team-michael-torres.jpg";

interface AboutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AboutModal = ({ open, onOpenChange }: AboutModalProps) => {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [isSending, setIsSending] = useState(false);

  const stats = [
    { icon: <Clock className="w-5 h-5" />, valueKey: 'about.stats.years', labelKey: 'about.stats.yearsLabel' },
    { icon: <Award className="w-5 h-5" />, valueKey: 'about.stats.auctions', labelKey: 'about.stats.auctionsLabel' },
    { icon: <Globe className="w-5 h-5" />, valueKey: 'about.stats.countries', labelKey: 'about.stats.countriesLabel' },
    { icon: <Users className="w-5 h-5" />, valueKey: 'about.stats.clients', labelKey: 'about.stats.clientsLabel' },
  ];

  const team = [
    { nameKey: 'about.team.member1.name', roleKey: 'about.team.member1.role', image: teamJames },
    { nameKey: 'about.team.member2.name', roleKey: 'about.team.member2.role', image: teamSarah },
    { nameKey: 'about.team.member3.name', roleKey: 'about.team.member3.role', image: teamMichael },
  ];

  const subjectOptions = [
    { key: 'about.contact.subjectGeneral', value: 'general' },
    { key: 'about.contact.subjectAuction', value: 'auction' },
    { key: 'about.contact.subjectSelling', value: 'selling' },
    { key: 'about.contact.subjectAppraisal', value: 'appraisal' },
  ];

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: t('about.contact.loginRequired'),
        variant: "destructive"
      });
      return;
    }

    if (!contactForm.name || !contactForm.email || !contactForm.subject || !contactForm.message) {
      return;
    }

    setIsSending(true);

    try {
      const { error } = await supabase.functions.invoke('send-contact-inquiry', {
        body: {
          name: contactForm.name,
          email: contactForm.email,
          subject: contactForm.subject,
          message: contactForm.message
        }
      });

      if (error) throw error;

      toast({
        title: t('about.contact.success'),
      });

      setContactForm({ name: "", email: "", subject: "", message: "" });
    } catch (error) {
      console.error("Error sending contact inquiry:", error);
      toast({
        title: t('about.contact.error'),
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] bg-background border-gold/20 p-0 overflow-hidden">
        {/* Decorative corners */}
        <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-gold/20 rounded-tl-lg pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-gold/20 rounded-tr-lg pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-gold/20 rounded-bl-lg pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-gold/20 rounded-br-lg pointer-events-none"></div>
        
        <ScrollArea className="max-h-[85vh]">
          <div className="p-6 pt-8">
            {/* Trustpilot Rating Badge */}
            <div className="flex flex-col items-center justify-center mb-6">
              <div className="flex items-center gap-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-7 h-7 bg-[#00b67a] flex items-center justify-center">
                    <Star className="w-4 h-4 text-white fill-white" />
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-semibold text-foreground ${language === 'ar' ? 'font-arabic' : ''}`}>
                  {t('about.trustpilot.excellent')}
                </span>
                <span className="text-sm text-muted-foreground">|</span>
                <span className={`text-sm text-muted-foreground ${language === 'ar' ? 'font-arabic' : ''}`}>
                  {t('about.trustpilot.reviews')}
                </span>
                <span className="text-sm text-muted-foreground">|</span>
                <span className="text-sm font-semibold text-[#00b67a]">Trustpilot</span>
              </div>
            </div>

            <DialogHeader>
              <DialogTitle className={`text-3xl font-bold text-center text-foreground ${
                language === 'ar' ? 'font-arabic' : 'font-serif'
              }`}>
                {t('about.title')}
              </DialogTitle>
            </DialogHeader>
            
            {/* Main Description */}
            <div className="py-6 text-center">
              <p className={`text-lg text-muted-foreground leading-relaxed ${
                language === 'ar' ? 'font-arabic text-xl' : ''
              }`}>
                {t('about.description')}
              </p>
              
              <div className="flex items-center justify-center gap-2 mt-6">
                <div className="h-1 w-12 bg-gold rounded-full"></div>
                <div className="w-3 h-3 bg-gold rounded-full rotate-45"></div>
                <div className="h-1 w-12 bg-gold rounded-full"></div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6">
              {stats.map((stat, index) => (
                <div 
                  key={index}
                  className="text-center p-4 rounded-xl bg-muted/30 border border-border/50 hover:border-gold/30 transition-all duration-300"
                >
                  <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-gold/10 flex items-center justify-center text-gold">
                    {stat.icon}
                  </div>
                  <div className={`text-2xl font-bold text-gold ${language === 'ar' ? 'font-arabic' : 'font-serif'}`}>
                    {t(stat.valueKey)}
                  </div>
                  <div className={`text-sm text-muted-foreground ${language === 'ar' ? 'font-arabic' : ''}`}>
                    {t(stat.labelKey)}
                  </div>
                </div>
              ))}
            </div>

            {/* Company History */}
            <div className="py-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center text-gold">
                  <Building2 className="w-5 h-5" />
                </div>
                <h3 className={`text-xl font-bold text-foreground ${language === 'ar' ? 'font-arabic' : 'font-serif'}`}>
                  {t('about.history.title')}
                </h3>
              </div>
              <p className={`text-muted-foreground leading-relaxed ${language === 'ar' ? 'font-arabic text-lg' : ''}`}>
                {t('about.history.content')}
              </p>
            </div>

            {/* Mission Statement */}
            <div className="py-6 px-6 rounded-2xl bg-gradient-to-br from-gold/5 to-gold/10 border border-gold/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center text-gold">
                  <Target className="w-5 h-5" />
                </div>
                <h3 className={`text-xl font-bold text-foreground ${language === 'ar' ? 'font-arabic' : 'font-serif'}`}>
                  {t('about.mission.title')}
                </h3>
              </div>
              <p className={`text-foreground/80 leading-relaxed italic ${language === 'ar' ? 'font-arabic text-lg' : ''}`}>
                "{t('about.mission.content')}"
              </p>
            </div>

            {/* Our Team */}
            <div className="py-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center text-gold">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className={`text-xl font-bold text-foreground ${language === 'ar' ? 'font-arabic' : 'font-serif'}`}>
                  {t('about.team.title')}
                </h3>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                {team.map((member, index) => (
                  <div 
                    key={index}
                    className="text-center p-4 rounded-xl bg-muted/30 border border-border/50 hover:border-gold/30 transition-all duration-300 group"
                  >
                    <div className="w-24 h-24 mx-auto mb-3 rounded-full overflow-hidden border-2 border-gold/30 group-hover:border-gold transition-all duration-300 shadow-lg">
                      <img 
                        src={member.image} 
                        alt={t(member.nameKey)}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                    <h4 className={`font-semibold text-foreground ${language === 'ar' ? 'font-arabic' : ''}`}>
                      {t(member.nameKey)}
                    </h4>
                    <p className={`text-sm text-muted-foreground ${language === 'ar' ? 'font-arabic' : ''}`}>
                      {t(member.roleKey)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Values */}
            <div className="py-6">
              <h3 className={`text-xl font-bold text-foreground mb-4 text-center ${language === 'ar' ? 'font-arabic' : 'font-serif'}`}>
                {t('about.values.title')}
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                {['about.values.value1', 'about.values.value2', 'about.values.value3'].map((valueKey, index) => (
                  <div 
                    key={index}
                    className="text-center p-4 rounded-xl border border-gold/20 bg-gold/5"
                  >
                    <span className={`text-foreground font-medium ${language === 'ar' ? 'font-arabic' : ''}`}>
                      {t(valueKey)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact Form Section */}
            <div className="py-6 mt-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center text-gold">
                  <Mail className="w-5 h-5" />
                </div>
                <h3 className={`text-xl font-bold text-foreground ${language === 'ar' ? 'font-arabic' : 'font-serif'}`}>
                  {t('about.contact.title')}
                </h3>
              </div>
              <p className={`text-muted-foreground mb-6 ${language === 'ar' ? 'font-arabic' : ''}`}>
                {t('about.contact.description')}
              </p>
              
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Input
                      placeholder={t('about.contact.name')}
                      value={contactForm.name}
                      onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                      className={`bg-muted/30 border-border/50 focus:border-gold/50 ${language === 'ar' ? 'font-arabic text-right' : ''}`}
                      required
                      maxLength={100}
                    />
                  </div>
                  <div>
                    <Input
                      type="email"
                      placeholder={t('about.contact.email')}
                      value={contactForm.email}
                      onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                      className={`bg-muted/30 border-border/50 focus:border-gold/50 ${language === 'ar' ? 'font-arabic text-right' : ''}`}
                      required
                      maxLength={255}
                    />
                  </div>
                </div>
                
                <Select
                  value={contactForm.subject}
                  onValueChange={(value) => setContactForm(prev => ({ ...prev, subject: value }))}
                >
                  <SelectTrigger className={`bg-muted/30 border-border/50 focus:border-gold/50 ${language === 'ar' ? 'font-arabic' : ''}`}>
                    <SelectValue placeholder={t('about.contact.subject')} />
                  </SelectTrigger>
                  <SelectContent>
                    {subjectOptions.map((option) => (
                      <SelectItem key={option.value} value={t(option.key)} className={language === 'ar' ? 'font-arabic' : ''}>
                        {t(option.key)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Textarea
                  placeholder={t('about.contact.message')}
                  value={contactForm.message}
                  onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                  className={`bg-muted/30 border-border/50 focus:border-gold/50 min-h-[120px] ${language === 'ar' ? 'font-arabic text-right' : ''}`}
                  required
                  maxLength={2000}
                />
                
                <Button
                  type="submit"
                  disabled={isSending || !user}
                  className="w-full bg-gold hover:bg-gold/90 text-background font-semibold"
                >
                  {isSending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin mr-2" />
                      {t('about.contact.sending')}
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      {t('about.contact.send')}
                    </>
                  )}
                </Button>
                
                {!user && (
                  <p className={`text-sm text-muted-foreground text-center ${language === 'ar' ? 'font-arabic' : ''}`}>
                    {t('about.contact.loginRequired')}
                  </p>
                )}
              </form>
            </div>

            {/* Footer with Social Media & Contact Info */}
            <div className="py-6 mt-4 border-t border-border/50">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Contact Information */}
                <div className="space-y-3">
                  <h4 className={`font-semibold text-foreground mb-4 ${language === 'ar' ? 'font-arabic' : ''}`}>
                    {t('about.footer.contactInfo')}
                  </h4>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center text-gold">
                      <Phone className="w-4 h-4" />
                    </div>
                    <span className={language === 'ar' ? 'font-arabic' : ''}>+974 4444 5555</span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center text-gold">
                      <Mail className="w-4 h-4" />
                    </div>
                    <span>info@crownauctions.qa</span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center text-gold">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <span className={language === 'ar' ? 'font-arabic' : ''}>{t('about.footer.address')}</span>
                  </div>
                </div>

                {/* Social Media Links */}
                <div>
                  <h4 className={`font-semibold text-foreground mb-4 ${language === 'ar' ? 'font-arabic' : ''}`}>
                    {t('about.footer.followUs')}
                  </h4>
                  <div className="flex gap-3">
                    <a 
                      href="https://instagram.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center text-gold hover:bg-gold hover:text-background transition-all duration-300"
                    >
                      <Instagram className="w-5 h-5" />
                    </a>
                    <a 
                      href="https://facebook.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center text-gold hover:bg-gold hover:text-background transition-all duration-300"
                    >
                      <Facebook className="w-5 h-5" />
                    </a>
                    <a 
                      href="https://twitter.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center text-gold hover:bg-gold hover:text-background transition-all duration-300"
                    >
                      <Twitter className="w-5 h-5" />
                    </a>
                    <a 
                      href="https://linkedin.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center text-gold hover:bg-gold hover:text-background transition-all duration-300"
                    >
                      <Linkedin className="w-5 h-5" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Business Hours & Live Chat */}
              <div className="grid md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-border/30">
                {/* Business Hours */}
                <div className="space-y-3">
                  <h4 className={`font-semibold text-foreground mb-4 flex items-center gap-2 ${language === 'ar' ? 'font-arabic' : ''}`}>
                    <Clock className="w-4 h-4 text-gold" />
                    {t('about.footer.businessHours')}
                  </h4>
                  <div className={`text-sm text-muted-foreground space-y-1 ${language === 'ar' ? 'font-arabic' : ''}`}>
                    <p>{t('about.footer.weekdays')}</p>
                    <p>{t('about.footer.saturday')}</p>
                    <p>{t('about.footer.sunday')}</p>
                  </div>
                </div>

                {/* Live Chat Status */}
                <div className="space-y-3">
                  <h4 className={`font-semibold text-foreground mb-4 flex items-center gap-2 ${language === 'ar' ? 'font-arabic' : ''}`}>
                    <MessageCircle className="w-4 h-4 text-gold" />
                    {t('about.footer.liveChat')}
                  </h4>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping opacity-75"></div>
                    </div>
                    <span className={`text-sm text-green-500 font-medium ${language === 'ar' ? 'font-arabic' : ''}`}>
                      {t('about.footer.chatOnline')}
                    </span>
                  </div>
                  <p className={`text-sm text-muted-foreground ${language === 'ar' ? 'font-arabic' : ''}`}>
                    {t('about.footer.chatHours')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
