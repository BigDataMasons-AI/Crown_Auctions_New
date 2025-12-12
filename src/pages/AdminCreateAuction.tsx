import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/hooks/useAdmin';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, X, Upload } from 'lucide-react';
import { z } from 'zod';

const auctionSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000),
  category: z.string().min(1, 'Category is required'),
  starting_price: z.number().positive('Starting price must be greater than 0'),
  minimum_increment: z.number().positive('Minimum increment must be greater than 0'),
  start_time: z.string(),
  end_time: z.string(),
});

interface SpecField {
  label: string;
  value: string;
}

interface CertField {
  name: string;
  issuer: string;
}

export default function AdminCreateAuction() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { id: auctionId } = useParams();
  const isEditMode = !!auctionId;
  
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(isEditMode);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const [specifications, setSpecifications] = useState<SpecField[]>([{ label: '', value: '' }]);
  const [certificates, setCertificates] = useState<CertField[]>([{ name: '', issuer: '' }]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    starting_price: '',
    minimum_increment: '',
    start_time: '',
    end_time: '',
    customer_id: '',
    customer_phone: '',
  });

  // Load auction data if editing
  useEffect(() => {
    if (isEditMode && auctionId && user) {
      loadAuctionData();
    }
  }, [isEditMode, auctionId, user]);

  const loadAuctionData = async () => {
    try {
      const { data, error } = await supabase
        .from('auctions')
        .select('*')
        .eq('id', auctionId)
        .single();

      if (error) throw error;

      // Check if auction is editable (pending/scheduled only)
      if (data.status !== 'pending') {
        toast.error(t('adminCreateAuction.onlyScheduledEditable'));
        navigate('/admin');
        return;
      }

      // Set form data
      const startTime = new Date(data.start_time);
      const endTime = new Date(data.end_time);
      
      setFormData({
        title: data.title,
        description: data.description,
        category: data.category,
        starting_price: data.starting_price.toString(),
        minimum_increment: data.minimum_increment.toString(),
        start_time: startTime.toISOString().slice(0, 16),
        end_time: endTime.toISOString().slice(0, 16),
        customer_id: data.customer_id || '',
        customer_phone: data.customer_phone || '',
      });

      setExistingImageUrls(data.image_urls || []);
      setImagePreviews(data.image_urls || []);
      setSpecifications(
        Array.isArray(data.specifications) && data.specifications.length > 0 
          ? (data.specifications as unknown as SpecField[])
          : [{ label: '', value: '' }]
      );
      setCertificates(
        Array.isArray(data.certificates) && data.certificates.length > 0 
          ? (data.certificates as unknown as CertField[])
          : [{ name: '', issuer: '' }]
      );
    } catch (error: any) {
      console.error('Error loading auction:', error);
      toast.error(t('adminCreateAuction.loadAuctionError'));
      navigate('/admin');
    } finally {
      setLoading(false);
    }
  };

  // Redirect if not admin
  if (!authLoading && !adminLoading && (!user || !isAdmin)) {
    navigate('/admin');
    return null;
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 5) {
      toast.error(t('adminCreateAuction.maxImagesError'));
      return;
    }

    setImages(prev => [...prev, ...files]);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
    setExistingImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const addSpecification = () => {
    setSpecifications([...specifications, { label: '', value: '' }]);
  };

  const removeSpecification = (index: number) => {
    setSpecifications(specifications.filter((_, i) => i !== index));
  };

  const updateSpecification = (index: number, field: 'label' | 'value', value: string) => {
    const updated = [...specifications];
    updated[index][field] = value;
    setSpecifications(updated);
  };

  const addCertificate = () => {
    setCertificates([...certificates, { name: '', issuer: '' }]);
  };

  const removeCertificate = (index: number) => {
    setCertificates(certificates.filter((_, i) => i !== index));
  };

  const updateCertificate = (index: number, field: 'name' | 'issuer', value: string) => {
    const updated = [...certificates];
    updated[index][field] = value;
    setCertificates(updated);
  };

  const uploadImages = async () => {
    const uploadedUrls: string[] = [];
    
    for (const image of images) {
      const fileExt = image.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('auction-images')
        .upload(filePath, image);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('auction-images')
        .getPublicUrl(filePath);

      uploadedUrls.push(publicUrl);
    }

    return uploadedUrls;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      
      const customerId = formData.get('customer_id') as string;
      if (!customerId || customerId.trim().length === 0) {
        toast.error(t('adminCreateAuction.customerIdRequired') || 'Customer ID is required');
        setSubmitting(false);
        return;
      }

      const customerPhone = formData.get('customer_phone') as string;

      const auctionData = {
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        category: formData.get('category') as string,
        starting_price: parseFloat(formData.get('starting_price') as string),
        minimum_increment: parseFloat(formData.get('minimum_increment') as string),
        start_time: formData.get('start_time') as string,
        end_time: formData.get('end_time') as string,
        customer_id: customerId.trim(),
        customer_phone: customerPhone?.trim() || null,
      };

      // Validate
      auctionSchema.parse(auctionData);

      // Validate dates
      const startTime = new Date(auctionData.start_time);
      const endTime = new Date(auctionData.end_time);
      if (endTime <= startTime) {
        toast.error(t('adminCreateAuction.endTimeError'));
        setSubmitting(false);
        return;
      }

      // Validate images (need at least existing or new images)
      if (images.length === 0 && existingImageUrls.length === 0) {
        toast.error(t('adminCreateAuction.uploadImageError'));
        setSubmitting(false);
        return;
      }

      // Upload new images if any
      let imageUrls = [...existingImageUrls];
      if (images.length > 0) {
        const newImageUrls = await uploadImages();
        imageUrls = [...existingImageUrls, ...newImageUrls];
      }

      // Filter empty specifications and certificates
      const validSpecs = specifications.filter(s => s.label && s.value);
      const validCerts = certificates.filter(c => c.name && c.issuer);

      // Determine if auction should be active or pending (scheduled)
      const now = new Date();
      const isScheduled = startTime > now;
      const auctionStatus = isScheduled ? 'pending' : 'active';
      
      if (isEditMode) {
        // Update existing auction
        const { error: updateError } = await supabase
          .from('auctions')
          .update({
            title: auctionData.title,
            description: auctionData.description,
            category: auctionData.category,
            starting_price: auctionData.starting_price,
            minimum_increment: auctionData.minimum_increment,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            image_urls: imageUrls,
            specifications: validSpecs.length > 0 ? (validSpecs as any) : null,
            certificates: validCerts.length > 0 ? (validCerts as any) : null,
            status: auctionStatus,
            customer_id: auctionData.customer_id,
            customer_phone: auctionData.customer_phone,
          })
          .eq('id', auctionId);

        if (updateError) throw updateError;

        if (isScheduled) {
          toast.success(`${t('adminCreateAuction.auctionUpdatedScheduled')} ${startTime.toLocaleString()}`);
        } else {
          toast.success(t('adminCreateAuction.auctionUpdatedLive'));
        }
      } else {
        // Create new auction
        const newAuctionId = crypto.randomUUID();
        const { error: insertError } = await supabase
          .from('auctions')
          .insert([{
            id: newAuctionId,
            title: auctionData.title,
            description: auctionData.description,
            category: auctionData.category,
            starting_price: auctionData.starting_price,
            current_bid: 0,
            minimum_increment: auctionData.minimum_increment,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            image_urls: imageUrls,
            specifications: validSpecs.length > 0 ? (validSpecs as any) : null,
            certificates: validCerts.length > 0 ? (validCerts as any) : null,
            submitted_by: user!.id,
            approval_status: 'approved',
            approved_by: user!.id,
            approved_at: new Date().toISOString(),
            status: auctionStatus,
            customer_id: auctionData.customer_id,
            customer_phone: auctionData.customer_phone,
          }]);

        if (insertError) throw insertError;

        if (isScheduled) {
          toast.success(`${t('adminCreateAuction.auctionScheduled')} ${startTime.toLocaleString()}`);
        } else {
          toast.success(t('adminCreateAuction.auctionCreatedLive'));
        }
      }
      navigate('/admin');
    } catch (error: any) {
      console.error('Error creating auction:', error);
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(error.message || t('adminCreateAuction.createError'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || adminLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className={`min-h-screen bg-background ${language === 'ar' ? 'font-arabic' : ''}`}>
      <Navigation />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">{isEditMode ? t('adminCreateAuction.editScheduledAuction') : t('adminCreateAuction.createNewAuction')}</CardTitle>
            <p className="text-muted-foreground">
              {isEditMode ? t('adminCreateAuction.editDescription') : t('adminCreateAuction.createDescription')}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">{t('adminCreateAuction.basicInformation')}</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="customer_id">{t('adminCreateAuction.customerId') || 'Customer ID'} *</Label>
                  <Input
                    id="customer_id"
                    name="customer_id"
                    placeholder={t('adminCreateAuction.customerIdPlaceholder') || 'Enter unique customer identification number'}
                    required
                    maxLength={50}
                    value={formData.customer_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, customer_id: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('adminCreateAuction.customerIdHelp') || 'A unique identifier to track this auction\'s customer'}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customer_phone">{t('adminCreateAuction.customerPhone') || 'Customer Phone'}</Label>
                  <Input
                    id="customer_phone"
                    name="customer_phone"
                    type="tel"
                    placeholder={t('adminCreateAuction.customerPhonePlaceholder') || 'Enter customer phone number'}
                    maxLength={20}
                    value={formData.customer_phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, customer_phone: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">{t('adminCreateAuction.title')} *</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder={t('adminCreateAuction.titlePlaceholder')}
                    required
                    maxLength={200}
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">{t('adminCreateAuction.category')} *</Label>
                  <Select 
                    name="category" 
                    required 
                    value={formData.category}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('adminCreateAuction.selectCategory')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="watches">{t('adminCreateAuction.watches')}</SelectItem>
                      <SelectItem value="jewelry">{t('adminCreateAuction.jewelry')}</SelectItem>
                      <SelectItem value="diamonds">{t('adminCreateAuction.diamonds')}</SelectItem>
                      <SelectItem value="luxury-items">{t('adminCreateAuction.luxuryItems')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">{t('adminCreateAuction.description')} *</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder={t('adminCreateAuction.descriptionPlaceholder')}
                    rows={6}
                    required
                    maxLength={2000}
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
              </div>

              {/* Pricing */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">{t('adminCreateAuction.schedulingPricing')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('adminCreateAuction.schedulingNote')}
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="starting_price">{t('adminCreateAuction.startingPrice')} *</Label>
                    <Input
                      id="starting_price"
                      name="starting_price"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder={t('adminCreateAuction.startingPricePlaceholder')}
                      required
                      value={formData.starting_price}
                      onChange={(e) => setFormData(prev => ({ ...prev, starting_price: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="minimum_increment">{t('adminCreateAuction.minimumIncrement')} *</Label>
                    <Input
                      id="minimum_increment"
                      name="minimum_increment"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder={t('adminCreateAuction.minimumIncrementPlaceholder')}
                      required
                      value={formData.minimum_increment}
                      onChange={(e) => setFormData(prev => ({ ...prev, minimum_increment: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_time">{t('adminCreateAuction.startTime')} *</Label>
                    <Input
                      id="start_time"
                      name="start_time"
                      type="datetime-local"
                      required
                      value={formData.start_time}
                      onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="end_time">{t('adminCreateAuction.endTime')} *</Label>
                    <Input
                      id="end_time"
                      name="end_time"
                      type="datetime-local"
                      required
                      value={formData.end_time}
                      onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              {/* Images */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">{t('adminCreateAuction.images')} *</h3>
                <p className="text-sm text-muted-foreground">{t('adminCreateAuction.imagesNote')}</p>
                
                <div className="space-y-4">
                  <Label htmlFor="images" className="cursor-pointer">
                    <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-gold transition-colors">
                      <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        {t('adminCreateAuction.clickToUpload')}
                      </p>
                    </div>
                    <Input
                      id="images"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </Label>

                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-40 object-cover rounded-lg"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeImage(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          {index === 0 && (
                            <div className="absolute bottom-2 left-2 bg-gold text-white text-xs px-2 py-1 rounded">
                              {t('adminCreateAuction.mainImage')}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Specifications */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">{t('adminCreateAuction.specifications')}</h3>
                  <Button type="button" variant="outline" onClick={addSpecification}>
                    {t('adminCreateAuction.addSpecification')}
                  </Button>
                </div>
                <div className="space-y-3">
                  {specifications.map((spec, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder={t('adminCreateAuction.labelPlaceholder')}
                        value={spec.label}
                        onChange={(e) => updateSpecification(index, 'label', e.target.value)}
                      />
                      <Input
                        placeholder={t('adminCreateAuction.valuePlaceholder')}
                        value={spec.value}
                        onChange={(e) => updateSpecification(index, 'value', e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSpecification(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Certificates */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">{t('adminCreateAuction.certificates')}</h3>
                  <Button type="button" variant="outline" onClick={addCertificate}>
                    {t('adminCreateAuction.addCertificate')}
                  </Button>
                </div>
                <div className="space-y-3">
                  {certificates.map((cert, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder={t('adminCreateAuction.certificateNamePlaceholder')}
                        value={cert.name}
                        onChange={(e) => updateCertificate(index, 'name', e.target.value)}
                      />
                      <Input
                        placeholder={t('adminCreateAuction.issuerPlaceholder')}
                        value={cert.issuer}
                        onChange={(e) => updateCertificate(index, 'issuer', e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeCertificate(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-gold hover:bg-gold/90"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isEditMode ? t('adminCreateAuction.updatingAuction') : t('adminCreateAuction.creatingAuction')}
                    </>
                  ) : (
                    isEditMode ? t('adminCreateAuction.updateAuction') : t('adminCreateAuction.createAuction')
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/admin')}
                  disabled={submitting}
                >
                  {t('adminCreateAuction.cancel')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
