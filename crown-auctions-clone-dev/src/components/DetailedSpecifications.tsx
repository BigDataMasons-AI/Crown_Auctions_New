import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, Info, Settings, Watch, Package, CircleDot, MapPin, CheckCircle, ExternalLink } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface SpecificationGroup {
  title: string;
  titleKey: string;
  icon: React.ReactNode;
  items: { label: string; value: string }[];
}

interface DetailedSpecificationsProps {
  specifications: { label: string; value: string }[];
  category: string;
}

// Map common spec labels to translation keys
const specLabelMap: Record<string, string> = {
  'brand': 'spec.brand',
  'model': 'spec.model',
  'reference number': 'spec.referenceNumber',
  'year of production': 'spec.yearOfProduction',
  'condition': 'spec.condition',
  'scope of delivery': 'spec.scopeOfDelivery',
  'gender': 'spec.gender',
  'location': 'spec.location',
  'movement': 'spec.movement',
  'caliber': 'spec.caliber',
  'power reserve': 'spec.powerReserve',
  'number of jewels': 'spec.numberOfJewels',
  'case material': 'spec.caseMaterial',
  'case diameter': 'spec.caseDiameter',
  'case thickness': 'spec.caseThickness',
  'water resistance': 'spec.waterResistance',
  'bezel material': 'spec.bezelMaterial',
  'crystal': 'spec.crystal',
  'dial': 'spec.dial',
  'dial numerals': 'spec.dialNumerals',
  'bracelet material': 'spec.braceletMaterial',
  'bracelet color': 'spec.braceletColor',
  'clasp': 'spec.clasp',
  'clasp material': 'spec.claspMaterial',
  'chronograph': 'spec.chronograph',
  'date display': 'spec.dateDisplay',
  'listing code': 'spec.listingCode',
  'metal': 'spec.metal',
  'diamond weight': 'spec.diamondWeight',
  'color grade': 'spec.colorGrade',
  'clarity': 'spec.clarity',
  'cut': 'spec.cut',
  'ring size': 'spec.ringSize',
  'carat weight': 'spec.caratWeight',
  'shape': 'spec.shape',
  'polish': 'spec.polish',
  'symmetry': 'spec.symmetry',
  'fluorescence': 'spec.fluorescence',
  'chain length': 'spec.chainLength',
  'pendant size': 'spec.pendantSize',
  'clasp type': 'spec.claspType',
  'total diamond weight': 'spec.totalDiamondWeight',
  'diamond quality': 'spec.diamondQuality',
  'sapphire weight': 'spec.sapphireWeight',
  'sapphire origin': 'spec.sapphireOrigin',
  'earring length': 'spec.earringLength',
  'closure type': 'spec.closureType',
};

export const DetailedSpecifications = ({ specifications, category }: DetailedSpecificationsProps) => {
  const { t, language } = useLanguage();
  const isWatch = category?.toLowerCase().includes('watch') || category?.toLowerCase() === 'watches';

  // Helper function to translate spec labels
  const translateLabel = (label: string): string => {
    const key = specLabelMap[label.toLowerCase()];
    if (key) {
      const translated = t(key);
      return translated !== key ? translated : label;
    }
    return label;
  };
  
  // Try to organize specifications into groups based on common labels
  const organizeSpecs = () => {
    const basicInfo: { label: string; value: string }[] = [];
    const caliber: { label: string; value: string }[] = [];
    const caseSpecs: { label: string; value: string }[] = [];
    const braceletSpecs: { label: string; value: string }[] = [];
    const functions: { label: string; value: string }[] = [];
    const other: { label: string; value: string }[] = [];

    specifications.forEach(spec => {
      const label = spec.label.toLowerCase();
      
      // Basic Info keywords
      if (['brand', 'model', 'reference', 'year', 'condition', 'gender', 'location', 'price', 'availability', 'listing code', 'scope of delivery', 'box', 'papers'].some(k => label.includes(k))) {
        basicInfo.push(spec);
      }
      // Caliber keywords
      else if (['movement', 'caliber', 'power reserve', 'jewels', 'frequency'].some(k => label.includes(k))) {
        caliber.push(spec);
      }
      // Case keywords
      else if (['case', 'diameter', 'water resistance', 'bezel', 'crystal', 'dial', 'numerals', 'thickness', 'lug'].some(k => label.includes(k))) {
        caseSpecs.push(spec);
      }
      // Bracelet keywords
      else if (['bracelet', 'strap', 'clasp', 'buckle', 'band'].some(k => label.includes(k))) {
        braceletSpecs.push(spec);
      }
      // Functions keywords
      else if (['chronograph', 'date', 'gmt', 'moon phase', 'alarm', 'minute repeater', 'tourbillon', 'perpetual', 'annual'].some(k => label.includes(k))) {
        functions.push(spec);
      }
      else {
        other.push(spec);
      }
    });

    return { basicInfo, caliber, caseSpecs, braceletSpecs, functions, other };
  };

  const { basicInfo, caliber, caseSpecs, braceletSpecs, functions, other } = organizeSpecs();

  // If not a watch or few specs, show simple layout
  if (!isWatch || specifications.length < 4) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-gold" />
            {t('specs.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {specifications.map((spec, index) => (
              <div key={index} className="flex justify-between py-2 border-b border-border/50">
                <span className="font-medium text-muted-foreground">{translateLabel(spec.label)}</span>
                <span className="text-foreground">{spec.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const specGroups: SpecificationGroup[] = [
    {
      title: t('specs.basicInfo'),
      titleKey: 'specs.basicInfo',
      icon: <Info className="w-5 h-5" />,
      items: basicInfo.length > 0 ? basicInfo : [
        ...specifications.slice(0, Math.min(6, specifications.length))
      ]
    },
    {
      title: t('specs.caliber'),
      titleKey: 'specs.caliber',
      icon: <Settings className="w-5 h-5" />,
      items: caliber
    },
    {
      title: t('specs.case'),
      titleKey: 'specs.case',
      icon: <Watch className="w-5 h-5" />,
      items: caseSpecs
    },
    {
      title: t('specs.braceletStrap'),
      titleKey: 'specs.braceletStrap',
      icon: <CircleDot className="w-5 h-5" />,
      items: braceletSpecs
    },
    {
      title: t('specs.functions'),
      titleKey: 'specs.functions',
      icon: <CheckCircle className="w-5 h-5" />,
      items: functions
    }
  ].filter(group => group.items.length > 0);

  // Add remaining specs to "Other" if there are any
  if (other.length > 0) {
    specGroups.push({
      title: t('specs.otherDetails'),
      titleKey: 'specs.otherDetails',
      icon: <Package className="w-5 h-5" />,
      items: other
    });
  }

  return (
    <div className="space-y-6 mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Award className="w-6 h-6 text-gold" />
        <h2 className={`text-2xl font-bold ${language === 'ar' ? 'font-arabic' : 'font-serif'}`}>
          {t('specs.title')}
        </h2>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {specGroups.map((group, groupIndex) => (
          <Card key={groupIndex} className="overflow-hidden">
            <CardHeader className="bg-muted/30 py-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="text-gold">{group.icon}</span>
                {group.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {group.items.map((item, index) => (
                  <div 
                    key={index} 
                    className="flex justify-between items-center px-4 py-3 hover:bg-muted/10 transition-colors"
                  >
                    <span className="text-sm text-muted-foreground">{translateLabel(item.label)}</span>
                    <span className="text-sm font-medium text-foreground text-right max-w-[60%]">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Condition Note */}
      <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-green-800 dark:text-green-200">{t('specs.conditionVerified')}</p>
              <p className="text-sm text-green-700 dark:text-green-300">
                {t('specs.conditionMessage')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product Safety Link */}
      <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/20">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{t('specs.productSafety')}</span>
        </div>
        <a 
          href="#" 
          className="text-sm text-primary hover:underline flex items-center gap-1"
        >
          {t('specs.showInfo')}
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};