import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Upload, Trash2, ArrowUp, ArrowDown, Image as ImageIcon, GripVertical, Globe } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface HeroImage {
  id: string;
  image_url: string;
  display_order: number;
  is_active: boolean;
  region: string;
  created_at: string;
}

const REGIONS = [
  { value: 'global', label: '🌍 Global (All Regions)' },
  // GCC Countries
  { value: 'QA', label: '🇶🇦 Qatar' },
  { value: 'AE', label: '🇦🇪 UAE' },
  { value: 'SA', label: '🇸🇦 Saudi Arabia' },
  { value: 'KW', label: '🇰🇼 Kuwait' },
  { value: 'BH', label: '🇧🇭 Bahrain' },
  { value: 'OM', label: '🇴🇲 Oman' },
  // Middle East & North Africa
  { value: 'EG', label: '🇪🇬 Egypt' },
  { value: 'JO', label: '🇯🇴 Jordan' },
  { value: 'LB', label: '🇱🇧 Lebanon' },
  { value: 'MA', label: '🇲🇦 Morocco' },
  // Europe
  { value: 'GB', label: '🇬🇧 United Kingdom' },
  { value: 'FR', label: '🇫🇷 France' },
  { value: 'DE', label: '🇩🇪 Germany' },
  { value: 'IT', label: '🇮🇹 Italy' },
  { value: 'ES', label: '🇪🇸 Spain' },
  { value: 'CH', label: '🇨🇭 Switzerland' },
  { value: 'NL', label: '🇳🇱 Netherlands' },
  { value: 'BE', label: '🇧🇪 Belgium' },
  // Americas
  { value: 'US', label: '🇺🇸 United States' },
  { value: 'CA', label: '🇨🇦 Canada' },
  // Asia Pacific
  { value: 'SG', label: '🇸🇬 Singapore' },
  { value: 'HK', label: '🇭🇰 Hong Kong' },
  { value: 'JP', label: '🇯🇵 Japan' },
  { value: 'AU', label: '🇦🇺 Australia' },
  { value: 'IN', label: '🇮🇳 India' },
];

export function HeroImagesManager() {
  const { t } = useLanguage();
  const [heroImages, setHeroImages] = useState<HeroImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedRegion, setSelectedRegion] = useState('global');
  const [autoScrollInterval, setAutoScrollInterval] = useState(8000);
  const [pauseOnHover, setPauseOnHover] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    fetchHeroImages();
    fetchHeroSettings();
  }, []);

  const fetchHeroSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('hero_settings')
        .select('auto_scroll_interval, pause_on_hover')
        .single();

      if (error) throw error;
      if (data) {
        setAutoScrollInterval(data.auto_scroll_interval);
        setPauseOnHover(data.pause_on_hover);
      }
    } catch (error) {
      console.error('Error fetching hero settings:', error);
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const { error } = await supabase
        .from('hero_settings')
        .update({ 
          auto_scroll_interval: autoScrollInterval,
          pause_on_hover: pauseOnHover
        })
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Update any row

      if (error) throw error;
      toast.success('Hero settings saved');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const fetchHeroImages = async () => {
    try {
      const { data, error } = await supabase
        .from('hero_images')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setHeroImages(data || []);
    } catch (error) {
      console.error('Error fetching hero images:', error);
      toast.error('Failed to load hero images');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select an image file');
      return;
    }

    setUploading(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `hero-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('hero-images')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('hero-images')
        .getPublicUrl(fileName);

      // Get max display order
      const maxOrder = heroImages.length > 0 
        ? Math.max(...heroImages.map(img => img.display_order)) 
        : -1;

      const { error: insertError } = await supabase
        .from('hero_images')
        .insert({
          image_url: publicUrl,
          display_order: maxOrder + 1,
          is_active: true,
          region: selectedRegion
        });

      if (insertError) throw insertError;

      toast.success('Hero image uploaded successfully');
      setSelectedFile(null);
      setSelectedRegion('global');
      fetchHeroImages();
    } catch (error) {
      console.error('Error uploading hero image:', error);
      toast.error('Failed to upload hero image');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (image: HeroImage) => {
    if (!confirm('Are you sure you want to delete this hero image?')) return;

    try {
      // Extract filename from URL
      const urlParts = image.image_url.split('/');
      const fileName = urlParts[urlParts.length - 1];

      // Delete from storage
      await supabase.storage
        .from('hero-images')
        .remove([fileName]);

      // Delete from database
      const { error } = await supabase
        .from('hero_images')
        .delete()
        .eq('id', image.id);

      if (error) throw error;

      toast.success('Hero image deleted');
      fetchHeroImages();
    } catch (error) {
      console.error('Error deleting hero image:', error);
      toast.error('Failed to delete hero image');
    }
  };

  const handleToggleActive = async (image: HeroImage) => {
    try {
      const { error } = await supabase
        .from('hero_images')
        .update({ is_active: !image.is_active })
        .eq('id', image.id);

      if (error) throw error;

      toast.success(`Image ${!image.is_active ? 'activated' : 'deactivated'}`);
      fetchHeroImages();
    } catch (error) {
      console.error('Error toggling hero image:', error);
      toast.error('Failed to update hero image');
    }
  };

  const handleRegionChange = async (image: HeroImage, newRegion: string) => {
    try {
      const { error } = await supabase
        .from('hero_images')
        .update({ region: newRegion })
        .eq('id', image.id);

      if (error) throw error;

      toast.success(`Region updated to ${REGIONS.find(r => r.value === newRegion)?.label || newRegion}`);
      fetchHeroImages();
    } catch (error) {
      console.error('Error updating region:', error);
      toast.error('Failed to update region');
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    await swapOrder(index, index - 1);
  };

  const handleMoveDown = async (index: number) => {
    if (index === heroImages.length - 1) return;
    await swapOrder(index, index + 1);
  };

  const swapOrder = async (fromIndex: number, toIndex: number) => {
    try {
      const fromImage = heroImages[fromIndex];
      const toImage = heroImages[toIndex];

      await supabase
        .from('hero_images')
        .update({ display_order: toImage.display_order })
        .eq('id', fromImage.id);

      await supabase
        .from('hero_images')
        .update({ display_order: fromImage.display_order })
        .eq('id', toImage.id);

      toast.success('Order updated');
      fetchHeroImages();
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Auto-Scroll Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            ⏱️ Auto-Scroll Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="auto-scroll-interval">Auto-Scroll Interval (milliseconds)</Label>
              <Input
                id="auto-scroll-interval"
                type="number"
                min={1000}
                max={30000}
                step={500}
                value={autoScrollInterval}
                onChange={(e) => setAutoScrollInterval(Number(e.target.value))}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Current: {(autoScrollInterval / 1000).toFixed(1)} seconds between slides
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label htmlFor="pause-on-hover" className="text-base font-medium">Pause on Hover</Label>
              <p className="text-sm text-muted-foreground">
                Pause the carousel when users hover over it
              </p>
            </div>
            <Switch
              id="pause-on-hover"
              checked={pauseOnHover}
              onCheckedChange={setPauseOnHover}
            />
          </div>
          <Button 
            onClick={handleSaveSettings} 
            disabled={savingSettings}
            className="w-full sm:w-auto"
          >
            {savingSettings ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Settings'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload New Hero Image
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1">
                <Label htmlFor="hero-image">Select Image</Label>
                <Input
                  id="hero-image"
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="mt-1"
                />
              </div>
              <div className="w-full sm:w-48">
                <Label htmlFor="region-select">Target Region</Label>
                <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                  <SelectTrigger className="mt-1">
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
              <Button 
                onClick={handleUpload} 
                disabled={!selectedFile || uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </>
                )}
              </Button>
            </div>
            {selectedFile && (
              <p className="text-sm text-muted-foreground">
                Selected: {selectedFile.name}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Images List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Hero Images ({heroImages.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {heroImages.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No hero images uploaded yet. Upload your first image above.
            </p>
          ) : (
            <div className="space-y-4">
              {heroImages.map((image, index) => (
                <div 
                  key={image.id}
                  className={`flex items-center gap-4 p-4 border rounded-lg ${
                    !image.is_active ? 'opacity-50 bg-muted/50' : ''
                  }`}
                >
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      className="h-8 w-8"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleMoveDown(index)}
                      disabled={index === heroImages.length - 1}
                      className="h-8 w-8"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-2 text-muted-foreground">
                    <GripVertical className="h-5 w-5" />
                    <span className="font-mono text-sm">#{index + 1}</span>
                  </div>

                  <div className="relative h-20 w-32 rounded-md overflow-hidden bg-muted">
                    <img
                      src={image.image_url}
                      alt={`Hero image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {image.image_url.split('/').pop()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Added: {new Date(image.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="w-40">
                    <Select 
                      value={image.region || 'global'} 
                      onValueChange={(value) => handleRegionChange(image, value)}
                    >
                      <SelectTrigger className="h-9">
                        <Globe className="h-3 w-3 mr-1" />
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

                  <div className="flex items-center gap-2">
                    <Label htmlFor={`active-${image.id}`} className="text-sm">
                      Active
                    </Label>
                    <Switch
                      id={`active-${image.id}`}
                      checked={image.is_active}
                      onCheckedChange={() => handleToggleActive(image)}
                    />
                  </div>

                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDelete(image)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
