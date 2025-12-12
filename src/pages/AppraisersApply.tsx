import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";

const SPECIALIZATION_KEYS = [
  'luxuryWatches',
  'fineJewelry',
  'diamonds',
  'vintageTimepieces',
  'estateJewelry',
  'designerPieces',
] as const;

// Map translation keys to database values
const SPECIALIZATION_DB_VALUES: Record<string, string> = {
  'luxuryWatches': 'Luxury Watches',
  'fineJewelry': 'Fine Jewelry',
  'diamonds': 'Diamonds',
  'vintageTimepieces': 'Vintage Timepieces',
  'estateJewelry': 'Estate Jewelry',
  'designerPieces': 'Designer Pieces',
};

export default function AppraisersApply() {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedSpecializations, setSelectedSpecializations] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    full_name: "",
    email: user?.email || "",
    phone: "",
    years_of_experience: "",
    certifications: "",
    previous_employers: "",
    professional_references: "",
    cover_letter: "",
  });

  const handleSpecializationToggle = (specializationKey: string) => {
    setSelectedSpecializations(prev =>
      prev.includes(specializationKey)
        ? prev.filter(s => s !== specializationKey)
        : [...prev, specializationKey]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error(t('appraiserApply.signInError'));
      navigate("/auth");
      return;
    }

    if (selectedSpecializations.length === 0) {
      toast.error(t('appraiserApply.specializationError'));
      return;
    }

    setLoading(true);

    try {
      // Convert selected keys to database values
      const dbSpecializations = selectedSpecializations.map(key => SPECIALIZATION_DB_VALUES[key]);

      const { error } = await supabase
        .from("appraiser_applications")
        .insert({
          user_id: user.id,
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          years_of_experience: parseInt(formData.years_of_experience),
          specializations: dbSpecializations,
          certifications: formData.certifications,
          previous_employers: formData.previous_employers || null,
          professional_references: formData.professional_references || null,
          cover_letter: formData.cover_letter,
        });

      if (error) throw error;

      toast.success(t('appraiserApply.success'));
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Error submitting application:", error);
      toast.error(error.message || t('appraiserApply.error'));
    } finally {
      setLoading(false);
    }
  };

  const isRTL = language === 'ar';

  return (
    <div className={`min-h-screen flex flex-col bg-background ${isRTL ? 'font-arabic' : ''}`}>
      <Navigation />
      
      <main className="flex-1 container mx-auto px-4 py-12">
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle className="text-3xl font-display">{t('appraiserApply.title')}</CardTitle>
            <CardDescription>
              {t('appraiserApply.subtitle')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="full_name">{t('appraiserApply.fullName')} *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t('appraiserApply.email')} *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">{t('appraiserApply.phone')} *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="years_of_experience">{t('appraiserApply.experience')} *</Label>
                <Input
                  id="years_of_experience"
                  type="number"
                  min="0"
                  value={formData.years_of_experience}
                  onChange={(e) => setFormData({ ...formData, years_of_experience: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-3">
                <Label>{t('appraiserApply.specializations')} *</Label>
                <div className="grid grid-cols-2 gap-3">
                  {SPECIALIZATION_KEYS.map((key) => (
                    <div key={key} className="flex items-center space-x-2 rtl:space-x-reverse">
                      <Checkbox
                        id={key}
                        checked={selectedSpecializations.includes(key)}
                        onCheckedChange={() => handleSpecializationToggle(key)}
                      />
                      <Label
                        htmlFor={key}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {t(`appraiserApply.${key}`)}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="certifications">{t('appraiserApply.certifications')} *</Label>
                <Textarea
                  id="certifications"
                  value={formData.certifications}
                  onChange={(e) => setFormData({ ...formData, certifications: e.target.value })}
                  placeholder={t('appraiserApply.certificationsPlaceholder')}
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="previous_employers">{t('appraiserApply.previousEmployers')}</Label>
                <Textarea
                  id="previous_employers"
                  value={formData.previous_employers}
                  onChange={(e) => setFormData({ ...formData, previous_employers: e.target.value })}
                  placeholder={t('appraiserApply.previousEmployersPlaceholder')}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="professional_references">{t('appraiserApply.references')}</Label>
                <Textarea
                  id="professional_references"
                  value={formData.professional_references}
                  onChange={(e) => setFormData({ ...formData, professional_references: e.target.value })}
                  placeholder={t('appraiserApply.referencesPlaceholder')}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cover_letter">{t('appraiserApply.coverLetter')} *</Label>
                <Textarea
                  id="cover_letter"
                  value={formData.cover_letter}
                  onChange={(e) => setFormData({ ...formData, cover_letter: e.target.value })}
                  placeholder={t('appraiserApply.coverLetterPlaceholder')}
                  rows={6}
                  required
                />
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? t('appraiserApply.submitting') : t('appraiserApply.submit')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/")}
                >
                  {t('appraiserApply.cancel')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}