import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CircleDot, Diamond, Watch, Gem, Link2, Sparkles, Star, ArrowLeft, ArrowRight, Circle, Square, Hexagon, Octagon, Leaf, FlaskConical, Box, Check, Upload, X, ImageIcon, CheckCircle2, Loader2, Package, FileText } from "lucide-react";
import type { LucideIcon } from "lucide-react";

// Watch brand images
import brandRolex from "@/assets/brand-rolex.png";
import brandBreitling from "@/assets/brand-breitling.png";
import brandCartier from "@/assets/brand-cartier.png";
import brandIwc from "@/assets/brand-iwc.png";
import brandOmega from "@/assets/brand-omega.png";
import brandPatek from "@/assets/brand-patek.png";
import brandAp from "@/assets/brand-ap.png";
import brandRichardmille from "@/assets/brand-richardmille.png";
import brandPanerai from "@/assets/brand-panerai.png";
import brandBreguet from "@/assets/brand-breguet.png";
import brandVacheron from "@/assets/brand-vacheron.png";
import brandChopard from "@/assets/brand-chopard.png";

interface NavigationMenuPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ItemType {
  id: string;
  label: string;
  labelAr: string;
  labelFr: string;
  icon: LucideIcon;
  hasSubOptions?: boolean;
}

interface SubOption {
  id: string;
  label: string;
  labelAr: string;
  labelFr: string;
  icon: LucideIcon;
}

interface DiamondType {
  id: string;
  label: string;
  labelAr: string;
  labelFr: string;
  icon: LucideIcon;
}

interface WatchBrand {
  id: string;
  label: string;
  image?: string;
  hasModels?: boolean;
}

interface WatchModel {
  id: string;
  label: string;
  labelAr: string;
  labelFr: string;
}

const itemTypes: ItemType[] = [
  { id: 'ring', label: 'Ring', labelAr: 'خاتم', labelFr: 'Bague', icon: CircleDot, hasSubOptions: true },
  { id: 'loose-diamond', label: 'Loose Diamond', labelAr: 'ألماس سائب', labelFr: 'Diamant en vrac', icon: Diamond, hasSubOptions: true },
  { id: 'watch', label: 'Watch', labelAr: 'ساعة', labelFr: 'Montre', icon: Watch, hasSubOptions: true },
  { id: 'necklace', label: 'Necklace', labelAr: 'قلادة', labelFr: 'Collier', icon: Gem, hasSubOptions: true },
  { id: 'bracelet', label: 'Bracelet', labelAr: 'سوار', labelFr: 'Bracelet', icon: Link2, hasSubOptions: true },
  { id: 'earrings', label: 'Earrings', labelAr: 'أقراط', labelFr: 'Boucles d\'oreilles', icon: Sparkles, hasSubOptions: true },
];

const ringSettings: SubOption[] = [
  { id: 'solitaire', label: 'Solitaire', labelAr: 'سوليتير', labelFr: 'Solitaire', icon: CircleDot },
  { id: 'bridal-set', label: 'Bridal Set', labelAr: 'طقم زفاف', labelFr: 'Ensemble nuptial', icon: Gem },
  { id: '3-stone', label: '3 Stone', labelAr: '3 أحجار', labelFr: '3 Pierres', icon: Diamond },
  { id: 'halo', label: 'Halo', labelAr: 'هالو', labelFr: 'Halo', icon: Sparkles },
  { id: 'other', label: 'Other', labelAr: 'أخرى', labelFr: 'Autre', icon: Star },
];

const diamondShapes: SubOption[] = [
  { id: 'round', label: 'Round', labelAr: 'دائري', labelFr: 'Rond', icon: Circle },
  { id: 'princess', label: 'Princess', labelAr: 'أميرة', labelFr: 'Princesse', icon: Square },
  { id: 'cushion', label: 'Cushion', labelAr: 'وسادة', labelFr: 'Coussin', icon: Square },
  { id: 'marquise', label: 'Marquise', labelAr: 'ماركيز', labelFr: 'Marquise', icon: Hexagon },
  { id: 'emerald', label: 'Emerald', labelAr: 'زمرد', labelFr: 'Émeraude', icon: Octagon },
  { id: 'other', label: 'Other', labelAr: 'أخرى', labelFr: 'Autre', icon: Star },
];

const caratRanges = [
  { id: '0-0.5', label: '0 - 0.5 ct', labelAr: '0 - 0.5 قيراط', labelFr: '0 - 0,5 ct' },
  { id: '0.5-1', label: '0.5 - 1 ct', labelAr: '0.5 - 1 قيراط', labelFr: '0,5 - 1 ct' },
  { id: '1-2', label: '1 - 2 ct', labelAr: '1 - 2 قيراط', labelFr: '1 - 2 ct' },
  { id: '2-3', label: '2 - 3 ct', labelAr: '2 - 3 قيراط', labelFr: '2 - 3 ct' },
  { id: '3-5', label: '3 - 5 ct', labelAr: '3 - 5 قيراط', labelFr: '3 - 5 ct' },
  { id: '5+', label: '5+ ct', labelAr: '5+ قيراط', labelFr: '5+ ct' },
];

const diamondTypes: DiamondType[] = [
  { id: 'natural', label: 'Natural', labelAr: 'طبيعي', labelFr: 'Naturel', icon: Leaf },
  { id: 'lab-grown', label: 'Lab grown', labelAr: 'مزروع مختبرياً', labelFr: 'Cultivé en labo', icon: FlaskConical },
  { id: 'gemstone', label: 'Gemstone', labelAr: 'حجر كريم', labelFr: 'Pierre précieuse', icon: Box },
];

const watchBrands: WatchBrand[] = [
  { id: 'rolex', label: 'Rolex', image: brandRolex, hasModels: true },
  { id: 'breitling', label: 'Breitling', image: brandBreitling, hasModels: true },
  { id: 'cartier', label: 'Cartier', image: brandCartier, hasModels: true },
  { id: 'iwc', label: 'IWC', image: brandIwc, hasModels: true },
  { id: 'omega', label: 'Omega', image: brandOmega, hasModels: true },
  { id: 'patek-philippe', label: 'Patek Philippe', image: brandPatek, hasModels: true },
  { id: 'audemars-piguet', label: 'Audemars Piguet', image: brandAp, hasModels: true },
  { id: 'richard-mille', label: 'Richard Mille', image: brandRichardmille, hasModels: true },
  { id: 'panerai', label: 'Panerai', image: brandPanerai, hasModels: true },
  { id: 'breguet', label: 'Breguet', image: brandBreguet, hasModels: true },
  { id: 'vacheron-constantin', label: 'Vacheron Constantin', image: brandVacheron, hasModels: true },
  { id: 'chopard', label: 'Chopard', image: brandChopard, hasModels: true },
  { id: 'other', label: 'Other' },
];

const rolexModels: WatchModel[] = [
  { id: 'datejust', label: 'Datejust', labelAr: 'ديت جست', labelFr: 'Datejust' },
  { id: 'day-date', label: 'Day Date', labelAr: 'داي ديت', labelFr: 'Day Date' },
  { id: 'daytona', label: 'Daytona', labelAr: 'دايتونا', labelFr: 'Daytona' },
  { id: 'gmt-master-ii', label: 'GMT Master II', labelAr: 'جي إم تي ماستر 2', labelFr: 'GMT Master II' },
  { id: 'oyster-perpetual', label: 'Oyster Perpetual', labelAr: 'أويستر بربتشوال', labelFr: 'Oyster Perpetual' },
  { id: 'sea-dweller', label: 'Sea-Dweller', labelAr: 'سي دويلر', labelFr: 'Sea-Dweller' },
  { id: 'sky-dweller', label: 'Sky-Dweller', labelAr: 'سكاي دويلر', labelFr: 'Sky-Dweller' },
  { id: 'submariner', label: 'Submariner', labelAr: 'صب مارينر', labelFr: 'Submariner' },
  { id: 'yacht-master', label: 'Yacht-Master', labelAr: 'يخت ماستر', labelFr: 'Yacht-Master' },
  { id: 'other', label: 'Other', labelAr: 'أخرى', labelFr: 'Autre' },
];

const breitlingModels: WatchModel[] = [
  { id: 'avenger', label: 'Avenger', labelAr: 'أفينجر', labelFr: 'Avenger' },
  { id: 'chronomat', label: 'Chronomat', labelAr: 'كرونومات', labelFr: 'Chronomat' },
  { id: 'colt', label: 'Colt', labelAr: 'كولت', labelFr: 'Colt' },
  { id: 'galactic', label: 'Galactic', labelAr: 'جالاكتيك', labelFr: 'Galactic' },
  { id: 'navitimer', label: 'Navitimer', labelAr: 'نافيتايمر', labelFr: 'Navitimer' },
  { id: 'premier', label: 'Premier', labelAr: 'بريمير', labelFr: 'Premier' },
  { id: 'professional', label: 'Professional', labelAr: 'بروفيشنال', labelFr: 'Professional' },
  { id: 'superocean', label: 'Superocean', labelAr: 'سوبر أوشن', labelFr: 'Superocean' },
  { id: 'superocean-heritage', label: 'Superocean Heritage', labelAr: 'سوبر أوشن هيريتج', labelFr: 'Superocean Heritage' },
  { id: 'transocean', label: 'Transocean', labelAr: 'ترانس أوشن', labelFr: 'Transocean' },
  { id: 'other', label: 'Other', labelAr: 'أخرى', labelFr: 'Autre' },
];

const cartierModels: WatchModel[] = [
  { id: 'baignoire', label: 'Baignoire', labelAr: 'بانيوار', labelFr: 'Baignoire' },
  { id: 'ballon-bleu', label: 'Ballon Bleu De Cartier', labelAr: 'بالون بلو دي كارتييه', labelFr: 'Ballon Bleu De Cartier' },
  { id: 'calibre', label: 'Calibre De Cartier', labelAr: 'كاليبر دي كارتييه', labelFr: 'Calibre De Cartier' },
  { id: 'cle', label: 'Cle De Cartier', labelAr: 'كليه دي كارتييه', labelFr: 'Clé De Cartier' },
  { id: 'drive', label: 'Drive De Cartier', labelAr: 'درايف دي كارتييه', labelFr: 'Drive De Cartier' },
  { id: 'pasha', label: 'Pasha De Cartier', labelAr: 'باشا دي كارتييه', labelFr: 'Pasha De Cartier' },
  { id: 'ronde', label: 'Ronde De Cartier', labelAr: 'روند دي كارتييه', labelFr: 'Ronde De Cartier' },
  { id: 'rotonde', label: 'Rotonde De Cartier', labelAr: 'روتوند دي كارتييه', labelFr: 'Rotonde De Cartier' },
  { id: 'santos', label: 'Santos De Cartier', labelAr: 'سانتوس دي كارتييه', labelFr: 'Santos De Cartier' },
  { id: 'tank', label: 'Tank', labelAr: 'تانك', labelFr: 'Tank' },
  { id: 'other', label: 'Other', labelAr: 'أخرى', labelFr: 'Autre' },
];

const iwcModels: WatchModel[] = [
  { id: 'aquatimer', label: 'Aquatimer', labelAr: 'أكواتايمر', labelFr: 'Aquatimer' },
  { id: 'big-pilots-watch', label: "Big Pilot's Watch", labelAr: 'ساعة الطيار الكبيرة', labelFr: "Big Pilot's Watch" },
  { id: 'da-vinci', label: 'Da Vinci', labelAr: 'دا فينشي', labelFr: 'Da Vinci' },
  { id: 'fliegerchronograph', label: 'Fliegerchronograph', labelAr: 'فليجركرونوغراف', labelFr: 'Fliegerchronograph' },
  { id: 'ingenieur', label: 'Ingenieur', labelAr: 'إنجينيور', labelFr: 'Ingenieur' },
  { id: 'pilots-watch', label: "Pilot's Watch", labelAr: 'ساعة الطيار', labelFr: "Pilot's Watch" },
  { id: 'portofino', label: 'Portofino', labelAr: 'بورتوفينو', labelFr: 'Portofino' },
  { id: 'portugieser', label: 'Portugieser', labelAr: 'بورتوجيزر', labelFr: 'Portugieser' },
  { id: 'spitfire', label: 'Spitfire', labelAr: 'سبيتفاير', labelFr: 'Spitfire' },
  { id: 'top-gun', label: 'Top Gun', labelAr: 'توب جان', labelFr: 'Top Gun' },
  { id: 'other', label: 'Other', labelAr: 'أخرى', labelFr: 'Autre' },
];

const omegaModels: WatchModel[] = [
  { id: 'aqua-terra', label: 'Aqua Terra', labelAr: 'أكوا تيرا', labelFr: 'Aqua Terra' },
  { id: 'constellation', label: 'Constellation', labelAr: 'كونستليشن', labelFr: 'Constellation' },
  { id: 'de-ville', label: 'De Ville', labelAr: 'دي فيل', labelFr: 'De Ville' },
  { id: 'seamaster', label: 'Seamaster', labelAr: 'سيماستر', labelFr: 'Seamaster' },
  { id: 'seamaster-bullhead', label: 'Seamaster Bullhead', labelAr: 'سيماستر بولهيد', labelFr: 'Seamaster Bullhead' },
  { id: 'seamaster-diver-300m', label: 'Seamaster Diver 300M', labelAr: 'سيماستر دايفر 300 متر', labelFr: 'Seamaster Diver 300M' },
  { id: 'seamaster-planet-ocean', label: 'Seamaster Planet Ocean', labelAr: 'سيماستر بلانيت أوشن', labelFr: 'Seamaster Planet Ocean' },
  { id: 'seamaster-ploprof', label: 'Seamaster Ploprof', labelAr: 'سيماستر بلوبروف', labelFr: 'Seamaster Ploprof' },
  { id: 'seamaster-railmaster', label: 'Seamaster Railmaster', labelAr: 'سيماستر ريلماستر', labelFr: 'Seamaster Railmaster' },
  { id: 'speedmaster', label: 'Speedmaster', labelAr: 'سبيدماستر', labelFr: 'Speedmaster' },
  { id: 'other', label: 'Other', labelAr: 'أخرى', labelFr: 'Autre' },
];

const patekPhilippeModels: WatchModel[] = [
  { id: 'aquanaut', label: 'Aquanaut', labelAr: 'أكوانوت', labelFr: 'Aquanaut' },
  { id: 'calatrava', label: 'Calatrava', labelAr: 'كالاترافا', labelFr: 'Calatrava' },
  { id: 'complications', label: 'Complications', labelAr: 'كومبليكيشنز', labelFr: 'Complications' },
  { id: 'golden-ellipse', label: 'Golden Ellipse', labelAr: 'جولدن إليبس', labelFr: 'Golden Ellipse' },
  { id: 'gondolo', label: 'Gondolo', labelAr: 'جوندولو', labelFr: 'Gondolo' },
  { id: 'grand-complications', label: 'Grand Complications', labelAr: 'جراند كومبليكيشنز', labelFr: 'Grandes Complications' },
  { id: 'nautilus', label: 'Nautilus', labelAr: 'نوتيلوس', labelFr: 'Nautilus' },
  { id: 'officers', label: 'Officers', labelAr: 'أوفيسرز', labelFr: 'Officers' },
  { id: 'travel-time', label: 'Travel Time', labelAr: 'ترافل تايم', labelFr: 'Travel Time' },
  { id: 'twenty-4', label: 'Twenty~4', labelAr: 'توينتي-4', labelFr: 'Twenty~4' },
  { id: 'other', label: 'Other', labelAr: 'أخرى', labelFr: 'Autre' },
];

const audemarsPiguetModels: WatchModel[] = [
  { id: 'code-11-59', label: 'Code 11.59', labelAr: 'كود 11.59', labelFr: 'Code 11.59' },
  { id: 'edward-piguet', label: 'Edward Piguet', labelAr: 'إدوارد بيجيه', labelFr: 'Edward Piguet' },
  { id: 'haute-joaillerie', label: 'Haute Joaillerie', labelAr: 'أوت جوايلري', labelFr: 'Haute Joaillerie' },
  { id: 'jules-audemars', label: 'Jules Audemars', labelAr: 'جول أوديمار', labelFr: 'Jules Audemars' },
  { id: 'millenary', label: 'Millenary', labelAr: 'ميلنيري', labelFr: 'Millenary' },
  { id: 'promesse', label: 'Promesse', labelAr: 'بروميس', labelFr: 'Promesse' },
  { id: 'royal-oak', label: 'Royal Oak', labelAr: 'رويال أوك', labelFr: 'Royal Oak' },
  { id: 'royal-oak-concept', label: 'Royal Oak Concept', labelAr: 'رويال أوك كونسبت', labelFr: 'Royal Oak Concept' },
  { id: 'royal-oak-offshore', label: 'Royal Oak Offshore', labelAr: 'رويال أوك أوفشور', labelFr: 'Royal Oak Offshore' },
  { id: 'tradition', label: 'Tradition', labelAr: 'تراديشن', labelFr: 'Tradition' },
  { id: 'other', label: 'Other', labelAr: 'أخرى', labelFr: 'Autre' },
];

const richardMilleModels: WatchModel[] = [
  { id: 'rm-010', label: 'RM 010', labelAr: 'RM 010', labelFr: 'RM 010' },
  { id: 'rm-011', label: 'RM 011', labelAr: 'RM 011', labelFr: 'RM 011' },
  { id: 'rm-016', label: 'RM 016', labelAr: 'RM 016', labelFr: 'RM 016' },
  { id: 'rm-027', label: 'RM 027', labelAr: 'RM 027', labelFr: 'RM 027' },
  { id: 'rm-029', label: 'RM 029', labelAr: 'RM 029', labelFr: 'RM 029' },
  { id: 'rm-030', label: 'RM 030', labelAr: 'RM 030', labelFr: 'RM 030' },
  { id: 'rm-035', label: 'RM 035', labelAr: 'RM 035', labelFr: 'RM 035' },
  { id: 'rm-052', label: 'RM 052', labelAr: 'RM 052', labelFr: 'RM 052' },
  { id: 'rm-055', label: 'RM 055', labelAr: 'RM 055', labelFr: 'RM 055' },
  { id: 'rm-50-03', label: 'RM 50-03', labelAr: 'RM 50-03', labelFr: 'RM 50-03' },
  { id: 'other', label: 'Other', labelAr: 'أخرى', labelFr: 'Autre' },
];

const paneraiModels: WatchModel[] = [
  { id: 'luminor', label: 'Luminor', labelAr: 'لومينور', labelFr: 'Luminor' },
  { id: 'luminor-1950', label: 'Luminor 1950', labelAr: 'لومينور 1950', labelFr: 'Luminor 1950' },
  { id: 'luminor-due', label: 'Luminor Due', labelAr: 'لومينور دو', labelFr: 'Luminor Due' },
  { id: 'luminor-gmt', label: 'Luminor GMT', labelAr: 'لومينور جي إم تي', labelFr: 'Luminor GMT' },
  { id: 'luminor-marina', label: 'Luminor Marina', labelAr: 'لومينور مارينا', labelFr: 'Luminor Marina' },
  { id: 'luminor-submersible', label: 'Luminor Submersible', labelAr: 'لومينور سبمرسيبل', labelFr: 'Luminor Submersible' },
  { id: 'mare-nostrum', label: 'Mare Nostrum', labelAr: 'ماري نوستروم', labelFr: 'Mare Nostrum' },
  { id: 'radiomir', label: 'Radiomir', labelAr: 'راديومير', labelFr: 'Radiomir' },
  { id: 'radiomir-1940', label: 'Radiomir 1940', labelAr: 'راديومير 1940', labelFr: 'Radiomir 1940' },
  { id: 'submersible', label: 'Submersible', labelAr: 'سبمرسيبل', labelFr: 'Submersible' },
  { id: 'other', label: 'Other', labelAr: 'أخرى', labelFr: 'Autre' },
];

const breguetModels: WatchModel[] = [
  { id: 'breguet-classique-dame', label: 'Breguet Classique Dame', labelAr: 'بريجيه كلاسيك دام', labelFr: 'Breguet Classique Dame' },
  { id: 'classique', label: 'Classique', labelAr: 'كلاسيك', labelFr: 'Classique' },
  { id: 'classique-complications', label: 'Classique Complications', labelAr: 'كلاسيك كومبليكيشنز', labelFr: 'Classique Complications' },
  { id: 'classique-grandes-complications', label: 'Classique Grandes Complications', labelAr: 'كلاسيك جراند كومبليكيشنز', labelFr: 'Classique Grandes Complications' },
  { id: 'heritage', label: 'Heritage', labelAr: 'هيريتج', labelFr: 'Héritage' },
  { id: 'la-tradition-breguet', label: 'La Tradition Breguet', labelAr: 'لا تراديشن بريجيه', labelFr: 'La Tradition Breguet' },
  { id: 'marine', label: 'Marine', labelAr: 'مارين', labelFr: 'Marine' },
  { id: 'reine-de-naples', label: 'Reine De Naples', labelAr: 'رين دي نابلز', labelFr: 'Reine de Naples' },
  { id: 'tradition', label: 'Tradition', labelAr: 'تراديشن', labelFr: 'Tradition' },
  { id: 'type-xx', label: 'Type XX', labelAr: 'تايب XX', labelFr: 'Type XX' },
  { id: 'other', label: 'Other', labelAr: 'أخرى', labelFr: 'Autre' },
];

const vacheronConstantinModels: WatchModel[] = [
  { id: 'egerie', label: 'Egerie', labelAr: 'إيجيري', labelFr: 'Égérie' },
  { id: 'fiftysix', label: 'Fiftysix', labelAr: 'فيفتي سكس', labelFr: 'Fiftysix' },
  { id: 'harmony', label: 'Harmony', labelAr: 'هارموني', labelFr: 'Harmony' },
  { id: 'historiques', label: 'Historiques', labelAr: 'هيستوريك', labelFr: 'Historiques' },
  { id: 'malte', label: 'Malte', labelAr: 'مالتي', labelFr: 'Malte' },
  { id: 'metiers-dart', label: "Métiers D'Art", labelAr: 'ميتييه دار', labelFr: "Métiers d'Art" },
  { id: 'overseas', label: 'Overseas', labelAr: 'أوفرسيز', labelFr: 'Overseas' },
  { id: 'patrimony', label: 'Patrimony', labelAr: 'باتريموني', labelFr: 'Patrimony' },
  { id: 'quai-de-lile', label: "Quai De L'Île", labelAr: 'كاي دي ليل', labelFr: "Quai de l'Île" },
  { id: 'traditionnelle', label: 'Traditionnelle', labelAr: 'تراديشيونيل', labelFr: 'Traditionnelle' },
  { id: 'other', label: 'Other', labelAr: 'أخرى', labelFr: 'Autre' },
];

const chopardModels: WatchModel[] = [
  { id: 'alpine-eagle', label: 'Alpine Eagle', labelAr: 'ألباين إيجل', labelFr: 'Alpine Eagle' },
  { id: 'classic', label: 'Classic', labelAr: 'كلاسيك', labelFr: 'Classic' },
  { id: 'classic-racing', label: 'Classic Racing', labelAr: 'كلاسيك ريسينج', labelFr: 'Classic Racing' },
  { id: 'happy-diamonds', label: 'Happy Diamonds', labelAr: 'هابي دايموندز', labelFr: 'Happy Diamonds' },
  { id: 'happy-sport', label: 'Happy Sport', labelAr: 'هابي سبورت', labelFr: 'Happy Sport' },
  { id: 'imperiale', label: 'Imperiale', labelAr: 'إمبريال', labelFr: 'Imperiale' },
  { id: 'luc', label: 'L.U.C', labelAr: 'إل يو سي', labelFr: 'L.U.C' },
  { id: 'luc-perpetual', label: 'L.U.C. Perpetual', labelAr: 'إل يو سي بربتشوال', labelFr: 'L.U.C. Perpetual' },
  { id: 'luc-xp', label: 'L.U.C. XP', labelAr: 'إل يو سي إكس بي', labelFr: 'L.U.C. XP' },
  { id: 'mille-miglia', label: 'Mille Miglia', labelAr: 'ميلي ميليا', labelFr: 'Mille Miglia' },
  { id: 'other', label: 'Other', labelAr: 'أخرى', labelFr: 'Autre' },
];

interface NecklaceBrand {
  id: string;
  label: string;
}

const necklaceBrands: NecklaceBrand[] = [
  { id: 'oscar-heyman', label: 'Oscar Heyman' },
  { id: 'cartier', label: 'Cartier' },
  { id: 'tiffany-co', label: 'Tiffany & Co.' },
  { id: 'harry-winston', label: 'Harry Winston' },
  { id: 'verdura', label: 'Verdura' },
  { id: 'van-cleef-arpels', label: 'Van Cleef & Arpels' },
  { id: 'david-webb', label: 'David Webb' },
  { id: 'buccellati', label: 'Buccellati' },
  { id: 'bvlgari', label: 'Bvlgari' },
  { id: 'graff', label: 'Graff' },
  { id: 'other', label: 'Other' },
];

interface BraceletBrand {
  id: string;
  label: string;
}

const braceletBrands: BraceletBrand[] = [
  { id: 'buccellati', label: 'Buccellati' },
  { id: 'harry-winston', label: 'Harry Winston' },
  { id: 'bvlgari', label: 'Bvlgari' },
  { id: 'cartier', label: 'Cartier' },
  { id: 'van-cleef-arpels', label: 'Van Cleef & Arpels' },
  { id: 'david-webb', label: 'David Webb' },
  { id: 'graff', label: 'Graff' },
  { id: 'tiffany-co', label: 'Tiffany & Co.' },
  { id: 'verdura', label: 'Verdura' },
  { id: 'oscar-heyman', label: 'Oscar Heyman' },
  { id: 'other', label: 'Other' },
];

interface EarringBrand {
  id: string;
  label: string;
}

const earringBrands: EarringBrand[] = [
  { id: 'oscar-heyman', label: 'Oscar Heyman' },
  { id: 'cartier', label: 'Cartier' },
  { id: 'tiffany-co', label: 'Tiffany & Co.' },
  { id: 'harry-winston', label: 'Harry Winston' },
  { id: 'verdura', label: 'Verdura' },
  { id: 'van-cleef-arpels', label: 'Van Cleef & Arpels' },
  { id: 'david-webb', label: 'David Webb' },
  { id: 'buccellati', label: 'Buccellati' },
  { id: 'bvlgari', label: 'Bvlgari' },
  { id: 'graff', label: 'Graff' },
  { id: 'other', label: 'Other' },
];

type Step = 'item-type' | 'ring-setting' | 'diamond-shape' | 'diamond-carat' | 'loose-diamond-shape' | 'loose-diamond-carat' | 'watch-brand' | 'watch-model' | 'box-paperwork' | 'necklace-brand' | 'bracelet-brand' | 'earring-brand' | 'signup' | 'thank-you';

export const NavigationMenuPopup = ({ open, onOpenChange }: NavigationMenuPopupProps) => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>('item-type');
  const [selectedItemType, setSelectedItemType] = useState<string>('');
  const [selectedSetting, setSelectedSetting] = useState<string>('');
  const [selectedShape, setSelectedShape] = useState<string>('');
  const [selectedCaratRange, setSelectedCaratRange] = useState<string>('');
  const [selectedDiamondType, setSelectedDiamondType] = useState<string>('natural');
  const [selectedWatchBrand, setSelectedWatchBrand] = useState<string>('');
  const [selectedWatchModel, setSelectedWatchModel] = useState<string>('');
  const [selectedNecklaceBrand, setSelectedNecklaceBrand] = useState<string>('');
  const [selectedBraceletBrand, setSelectedBraceletBrand] = useState<string>('');
  const [selectedEarringBrand, setSelectedEarringBrand] = useState<string>('');
  const [hasOriginalBox, setHasOriginalBox] = useState(false);
  const [hasPaperwork, setHasPaperwork] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Signup form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [agreeToMessages, setAgreeToMessages] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setStep('item-type');
      setSelectedItemType('');
      setSelectedSetting('');
      setSelectedShape('');
      setSelectedCaratRange('');
      setSelectedDiamondType('natural');
      setSelectedWatchBrand('');
      setSelectedWatchModel('');
      setSelectedNecklaceBrand('');
      setSelectedBraceletBrand('');
      setSelectedEarringBrand('');
      setHasOriginalBox(false);
      setHasPaperwork(false);
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
      setAgreeToMessages(false);
      setImages([]);
      setImagePreviews([]);
    }
    onOpenChange(isOpen);
  };

  const handleItemClick = (item: ItemType) => {
    if (item.hasSubOptions && item.id === 'ring') {
      setSelectedItemType('ring');
      setStep('ring-setting');
    } else if (item.hasSubOptions && item.id === 'loose-diamond') {
      setSelectedItemType('loose-diamond');
      setStep('loose-diamond-shape');
    } else if (item.hasSubOptions && item.id === 'watch') {
      setSelectedItemType('watch');
      setStep('watch-brand');
    } else if (item.hasSubOptions && item.id === 'necklace') {
      setSelectedItemType('necklace');
      setStep('necklace-brand');
    } else if (item.hasSubOptions && item.id === 'bracelet') {
      setSelectedItemType('bracelet');
      setStep('bracelet-brand');
    } else if (item.hasSubOptions && item.id === 'earrings') {
      setSelectedItemType('earrings');
      setStep('earring-brand');
    } else {
      handleClose(false);
      navigate(`/submit-auction?category=${item.id}`);
    }
  };

  const handleRingSettingClick = (settingId: string) => {
    setSelectedSetting(settingId);
    setStep('diamond-shape');
  };

  const handleDiamondShapeClick = (shapeId: string) => {
    setSelectedShape(shapeId);
    setStep('diamond-carat');
  };

  const handleLooseDiamondShapeClick = (shapeId: string) => {
    setSelectedShape(shapeId);
    setStep('loose-diamond-carat');
  };

  const handleContinue = () => {
    setStep('signup');
  };

  const handleLooseDiamondContinue = () => {
    setStep('signup');
  };

  const handleWatchBrandClick = (brandId: string) => {
    setSelectedWatchBrand(brandId);
    const brand = watchBrands.find(b => b.id === brandId);
    if (brand?.hasModels) {
      setStep('watch-model');
    } else {
      setStep('signup');
    }
  };

  const handleWatchModelClick = (modelId: string) => {
    setSelectedWatchModel(modelId);
    setStep('box-paperwork');
  };

  const handleBoxPaperworkContinue = () => {
    setStep('signup');
  };

  const handleNecklaceBrandClick = (brandId: string) => {
    setSelectedNecklaceBrand(brandId);
    setStep('box-paperwork');
  };

  const handleBraceletBrandClick = (brandId: string) => {
    setSelectedBraceletBrand(brandId);
    setStep('box-paperwork');
  };

  const handleEarringBrandClick = (brandId: string) => {
    setSelectedEarringBrand(brandId);
    setStep('box-paperwork');
  };

  const handleSignUp = async () => {
    setIsSubmitting(true);
    try {
      // Upload images to storage first
      const uploadedImageUrls: string[] = [];
      
      for (const image of images) {
        const fileExt = image.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `inquiries/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('item-inquiry-images')
          .upload(filePath, image);
        
        if (uploadError) {
          console.error('Error uploading image:', uploadError);
          continue;
        }
        
        const { data: { publicUrl } } = supabase.storage
          .from('item-inquiry-images')
          .getPublicUrl(filePath);
        
        uploadedImageUrls.push(publicUrl);
      }

      const { error } = await supabase.functions.invoke('send-item-inquiry', {
        body: {
          firstName,
          lastName,
          email,
          phone,
          itemType: selectedItemType || 'ring',
          ringSetting: selectedSetting,
          diamondShape: selectedShape,
          caratRange: selectedCaratRange,
          diamondType: selectedDiamondType,
          watchBrand: selectedWatchBrand,
          watchModel: selectedWatchModel,
          necklaceBrand: selectedNecklaceBrand,
          braceletBrand: selectedBraceletBrand,
          earringBrand: selectedEarringBrand,
          hasOriginalBox,
          hasPaperwork,
          imageCount: images.length,
          imageUrls: uploadedImageUrls,
        },
      });

      if (error) {
        console.error('Error sending inquiry:', error);
        toast({
          title: language === 'ar' ? 'خطأ' : language === 'fr' ? 'Erreur' : 'Error',
          description: language === 'ar' ? 'حدث خطأ. يرجى المحاولة مرة أخرى.' : language === 'fr' ? 'Une erreur s\'est produite. Veuillez réessayer.' : 'An error occurred. Please try again.',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      setStep('thank-you');
    } catch (err) {
      console.error('Error:', err);
      toast({
        title: language === 'ar' ? 'خطأ' : language === 'fr' ? 'Erreur' : 'Error',
        description: language === 'ar' ? 'حدث خطأ. يرجى المحاولة مرة أخرى.' : language === 'fr' ? 'Une erreur s\'est produite. Veuillez réessayer.' : 'An error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoginClick = () => {
    handleClose(false);
    navigate('/auth');
  };

  const handleThankYouClose = () => {
    handleClose(false);
  };

  const handleBack = () => {
    if (step === 'signup') {
      // Check which flow we came from
      if (selectedItemType === 'loose-diamond') {
        setStep('loose-diamond-carat');
      } else if (selectedItemType === 'watch') {
        setStep('box-paperwork');
      } else if (selectedItemType === 'necklace') {
        setStep('box-paperwork');
    } else if (selectedItemType === 'bracelet') {
        setStep('box-paperwork');
      } else if (selectedItemType === 'earrings') {
        setStep('box-paperwork');
      } else {
        setStep('diamond-carat');
      }
    } else if (step === 'earring-brand') {
      setStep('item-type');
    } else if (step === 'bracelet-brand') {
      setStep('item-type');
    } else if (step === 'necklace-brand') {
      setStep('item-type');
    } else if (step === 'box-paperwork') {
      // Check which flow we came from
      if (selectedItemType === 'earrings') {
        setStep('earring-brand');
      } else if (selectedItemType === 'bracelet') {
        setStep('bracelet-brand');
      } else if (selectedItemType === 'necklace') {
        setStep('necklace-brand');
      } else {
        const brand = watchBrands.find(b => b.id === selectedWatchBrand);
        if (brand?.hasModels) {
          setStep('watch-model');
        } else {
          setStep('watch-brand');
        }
      }
    } else if (step === 'watch-model') {
      setStep('watch-brand');
    } else if (step === 'watch-brand') {
      setStep('item-type');
    } else if (step === 'loose-diamond-carat') {
      setStep('loose-diamond-shape');
    } else if (step === 'loose-diamond-shape') {
      setStep('item-type');
    } else if (step === 'diamond-carat') {
      setStep('diamond-shape');
    } else if (step === 'diamond-shape') {
      setStep('ring-setting');
    } else {
      setStep('item-type');
    }
  };

  const getLabel = (item: ItemType | SubOption | DiamondType) => {
    switch (language) {
      case 'ar':
        return item.labelAr;
      case 'fr':
        return item.labelFr;
      default:
        return item.label;
    }
  };

  const getCaratLabel = (range: typeof caratRanges[0]) => {
    switch (language) {
      case 'ar':
        return range.labelAr;
      case 'fr':
        return range.labelFr;
      default:
        return range.label;
    }
  };

  const getTitle = () => {
    if (step === 'thank-you') {
      switch (language) {
        case 'ar':
          return 'شكراً لك!';
        case 'fr':
          return 'Merci!';
        default:
          return 'Thank You!';
      }
    }
    if (step === 'signup') {
      switch (language) {
        case 'ar':
          return 'اكتشف كم يمكنك الحصول عليه!';
        case 'fr':
          return 'Découvrez combien vous pouvez obtenir!';
        default:
          return 'See how much you can get!';
      }
    }
    if (step === 'diamond-carat' || step === 'loose-diamond-carat') {
      switch (language) {
        case 'ar':
          return 'رائع! ما هو وزن الألماس المركزي بالقيراط؟';
        case 'fr':
          return 'Super! Quel est le poids en carats de votre diamant central?';
        default:
          return 'Great! What is the carat weight of your center diamond?';
      }
    }
    if (step === 'diamond-shape' || step === 'loose-diamond-shape') {
      switch (language) {
        case 'ar':
          return 'ما هو شكل الألماس المركزي؟';
        case 'fr':
          return 'Quelle est la forme de votre diamant central?';
        default:
          return 'What is the shape of your center diamond?';
      }
    }
    if (step === 'watch-brand') {
      switch (language) {
        case 'ar':
          return 'ما هي ماركة ساعتك؟';
        case 'fr':
          return 'Quelle est la marque de votre montre?';
        default:
          return 'What is the brand of your watch?';
      }
    }
    if (step === 'watch-model') {
      switch (language) {
        case 'ar':
          return 'ما هو طراز ساعتك؟';
        case 'fr':
          return 'Quel est le modèle de votre montre?';
        default:
          return 'What is the model of your watch?';
      }
    }
    if (step === 'box-paperwork') {
      switch (language) {
        case 'ar':
          return 'هل لديك العلبة الأصلية والأوراق؟';
        case 'fr':
          return 'Avez-vous la boîte et les documents originaux?';
        default:
          return 'Do you have the original box and paperwork?';
      }
    }
    if (step === 'necklace-brand') {
      switch (language) {
        case 'ar':
          return 'ما هي ماركة قلادتك؟';
        case 'fr':
          return 'Quelle est la marque de votre collier?';
        default:
          return 'What brand is your necklace?';
      }
    }
    if (step === 'bracelet-brand') {
      switch (language) {
        case 'ar':
          return 'ما هي ماركة سوارك؟';
        case 'fr':
          return 'Quelle est la marque de votre bracelet?';
        default:
          return 'What brand is your bracelet?';
      }
    }
    if (step === 'earring-brand') {
      switch (language) {
        case 'ar':
          return 'ما هي ماركة أقراطك؟';
        case 'fr':
          return 'Quelle est la marque de vos boucles d\'oreilles?';
        default:
          return 'What brand is your earrings?';
      }
    }
    if (step === 'ring-setting') {
      switch (language) {
        case 'ar':
          return 'ما هو إعداد خاتمك؟';
        case 'fr':
          return 'Quel est le sertissage de votre bague?';
        default:
          return 'What is the setting of your ring?';
      }
    }
    switch (language) {
      case 'ar':
        return 'ما نوع المنتج لديك؟';
      case 'fr':
        return 'Quel type d\'article avez-vous?';
      default:
        return 'What type of item do you have?';
    }
  };

  const getSubtitle = () => {
    if (step === 'diamond-carat' || step === 'loose-diamond-carat' || step === 'signup' || step === 'box-paperwork') {
      return '';
    }
    switch (language) {
      case 'ar':
        return 'اختر خياراً أدناه';
      case 'fr':
        return 'Sélectionnez une option ci-dessous';
      default:
        return 'Select an option below';
    }
  };

  const getBadge = () => {
    if (step === 'thank-you') {
      switch (language) {
        case 'ar':
          return 'تم الإرسال';
        case 'fr':
          return 'Soumis';
        default:
          return 'Submitted';
      }
    }
    if (step === 'signup') {
      switch (language) {
        case 'ar':
          return 'التسجيل';
        case 'fr':
          return 'Inscription';
        default:
          return 'Sign Up';
      }
    }
    if (step === 'diamond-carat' || step === 'loose-diamond-carat') {
      switch (language) {
        case 'ar':
          return 'قيراط الألماس المركزي';
        case 'fr':
          return 'Carats du diamant central';
        default:
          return 'Center Diamond Carat';
      }
    }
    if (step === 'diamond-shape' || step === 'loose-diamond-shape') {
      switch (language) {
        case 'ar':
          return 'شكل الألماس المركزي';
        case 'fr':
          return 'Forme du diamant central';
        default:
          return 'Center Diamond Shape';
      }
    }
    if (step === 'ring-setting') {
      switch (language) {
        case 'ar':
          return 'إعداد الخاتم';
        case 'fr':
          return 'Sertissage de bague';
        default:
          return 'Ring Setting';
      }
    }
    if (step === 'watch-brand') {
      switch (language) {
        case 'ar':
          return 'ماركة الساعة';
        case 'fr':
          return 'Marque de montre';
        default:
          return 'Watch Brand';
      }
    }
    if (step === 'watch-model') {
      switch (language) {
        case 'ar':
          return 'طراز الساعة';
        case 'fr':
          return 'Modèle de montre';
        default:
          return 'Watch Model';
      }
    }
    if (step === 'box-paperwork') {
      switch (language) {
        case 'ar':
          return 'معلومات إضافية';
        case 'fr':
          return 'Informations supplémentaires';
        default:
          return 'Additional Info';
      }
    }
    if (step === 'necklace-brand') {
      switch (language) {
        case 'ar':
          return 'الماركة';
        case 'fr':
          return 'Marque';
        default:
          return 'Brand';
      }
    }
    if (step === 'bracelet-brand') {
      switch (language) {
        case 'ar':
          return 'الماركة';
        case 'fr':
          return 'Marque';
        default:
          return 'Brand';
      }
    }
    if (step === 'earring-brand') {
      switch (language) {
        case 'ar':
          return 'الماركة';
        case 'fr':
          return 'Marque';
        default:
          return 'Brand';
      }
    }
    switch (language) {
      case 'ar':
        return 'نوع المنتج';
      case 'fr':
        return 'Type d\'article';
      default:
        return 'Item Type';
    }
  };

  const getSelectPlaceholder = () => {
    switch (language) {
      case 'ar':
        return 'اختر نطاق القيراط';
      case 'fr':
        return 'Sélectionnez la plage de carats';
      default:
        return 'Select carat range';
    }
  };

  const getContinueLabel = () => {
    switch (language) {
      case 'ar':
        return 'متابعة';
      case 'fr':
        return 'Continuer';
      default:
        return 'Continue';
    }
  };

  const getSignUpLabel = () => {
    switch (language) {
      case 'ar':
        return 'التسجيل';
      case 'fr':
        return 'S\'inscrire';
      default:
        return 'Sign Up';
    }
  };

  const getFormLabels = () => {
    switch (language) {
      case 'ar':
        return {
          firstName: 'الاسم الأول *',
          lastName: 'اسم العائلة *',
          email: 'البريد الإلكتروني *',
          phone: 'رقم الهاتف *',
          agreement: 'أوافق على تلقي رسائل نصية بخصوص بيع سلعتي ورسائل ترويجية. قد تنطبق رسوم الرسائل والبيانات. *',
          alreadySignedUp: 'هل لديك حساب بالفعل؟',
          logIn: 'تسجيل الدخول',
          uploadImages: 'تحميل صور العنصر *',
          uploadHint: 'اسحب وأفلت أو انقر للتحميل',
          maxFiles: 'بحد أقصى 5 صور',
        };
      case 'fr':
        return {
          firstName: 'Prénom *',
          lastName: 'Nom de famille *',
          email: 'Email *',
          phone: 'Numéro de téléphone *',
          agreement: 'J\'accepte de recevoir des SMS concernant la vente de mon article et des messages promotionnels. Des frais de messagerie et de données peuvent s\'appliquer. *',
          alreadySignedUp: 'Déjà inscrit?',
          logIn: 'Se connecter',
          uploadImages: 'Télécharger des images de l\'article *',
          uploadHint: 'Glisser-déposer ou cliquer pour télécharger',
          maxFiles: 'Maximum 5 images',
        };
      default:
        return {
          firstName: 'First Name *',
          lastName: 'Last Name *',
          email: 'Email *',
          phone: 'Phone Number *',
          agreement: 'I agree to receive text messages regarding the sale of my item and promotional messages. Msg & data rates may apply. Msg frequency may vary. Reply STOP to end messages. *',
          alreadySignedUp: 'Already signed up?',
          logIn: 'Log in',
          uploadImages: 'Upload Item Images *',
          uploadHint: 'Drag & drop or click to upload',
          maxFiles: 'Maximum 5 images',
        };
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    const newFiles = Array.from(files).slice(0, 5 - images.length);
    const newImages = [...images, ...newFiles].slice(0, 5);
    setImages(newImages);
    
    // Create previews
    const newPreviews = newImages.map(file => URL.createObjectURL(file));
    setImagePreviews(newPreviews);
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setImages(newImages);
    setImagePreviews(newPreviews);
  };

  const formLabels = getFormLabels();
  const BackArrow = language === 'ar' ? ArrowRight : ArrowLeft;
  const showBackButton = step !== 'item-type';
  const isSignupValid = firstName.trim() && lastName.trim() && email.trim() && phone.trim() && agreeToMessages && images.length > 0;

  // Calculate progress based on item type and current step
  const getProgress = (): { current: number; total: number } => {
    if (step === 'thank-you') return { current: 5, total: 5 };
    
    // Ring flow: item-type -> ring-setting -> diamond-shape -> diamond-carat -> signup
    if (selectedItemType === 'ring') {
      const steps = ['item-type', 'ring-setting', 'diamond-shape', 'diamond-carat', 'signup'];
      const current = steps.indexOf(step) + 1;
      return { current: Math.max(current, 1), total: 5 };
    }
    
    // Loose diamond flow: item-type -> loose-diamond-shape -> loose-diamond-carat -> signup
    if (selectedItemType === 'loose-diamond') {
      const steps = ['item-type', 'loose-diamond-shape', 'loose-diamond-carat', 'signup'];
      const current = steps.indexOf(step) + 1;
      return { current: Math.max(current, 1), total: 4 };
    }
    
    // Watch flow: item-type -> watch-brand -> (watch-model) -> box-paperwork -> signup
    if (selectedItemType === 'watch') {
      const brand = watchBrands.find(b => b.id === selectedWatchBrand);
      if (brand?.hasModels && selectedWatchBrand) {
        const steps = ['item-type', 'watch-brand', 'watch-model', 'box-paperwork', 'signup'];
        const current = steps.indexOf(step) + 1;
        return { current: Math.max(current, 1), total: 5 };
      } else {
        const steps = ['item-type', 'watch-brand', 'box-paperwork', 'signup'];
        const current = steps.indexOf(step) + 1;
        return { current: Math.max(current, 1), total: 4 };
      }
    }
    
    // Necklace flow: item-type -> necklace-brand -> box-paperwork -> signup
    if (selectedItemType === 'necklace') {
      const steps = ['item-type', 'necklace-brand', 'box-paperwork', 'signup'];
      const current = steps.indexOf(step) + 1;
      return { current: Math.max(current, 1), total: 4 };
    }
    
    // Bracelet flow: item-type -> bracelet-brand -> box-paperwork -> signup
    if (selectedItemType === 'bracelet') {
      const steps = ['item-type', 'bracelet-brand', 'box-paperwork', 'signup'];
      const current = steps.indexOf(step) + 1;
      return { current: Math.max(current, 1), total: 4 };
    }
    
    // Earring flow: item-type -> earring-brand -> box-paperwork -> signup
    if (selectedItemType === 'earrings') {
      const steps = ['item-type', 'earring-brand', 'box-paperwork', 'signup'];
      const current = steps.indexOf(step) + 1;
      return { current: Math.max(current, 1), total: 4 };
    }
    
    // Default (item-type step)
    return { current: 1, total: 4 };
  };

  const progress = getProgress();
  const progressPercentage = (progress.current / progress.total) * 100;

  // Generate selection summary for signup form
  const getSelectionSummary = (): { label: string; value: string }[] => {
    const summary: { label: string; value: string }[] = [];
    
    // Item Type
    const itemType = itemTypes.find(i => i.id === selectedItemType);
    if (itemType) {
      const itemLabel = language === 'ar' ? 'النوع' : language === 'fr' ? 'Type' : 'Type';
      const itemValue = language === 'ar' ? itemType.labelAr : language === 'fr' ? itemType.labelFr : itemType.label;
      summary.push({ label: itemLabel, value: itemValue });
    }

    // Ring-specific selections
    if (selectedItemType === 'ring') {
      const setting = ringSettings.find(s => s.id === selectedSetting);
      if (setting) {
        const settingLabel = language === 'ar' ? 'الإعداد' : language === 'fr' ? 'Sertissage' : 'Setting';
        const settingValue = language === 'ar' ? setting.labelAr : language === 'fr' ? setting.labelFr : setting.label;
        summary.push({ label: settingLabel, value: settingValue });
      }
      const shape = diamondShapes.find(s => s.id === selectedShape);
      if (shape) {
        const shapeLabel = language === 'ar' ? 'الشكل' : language === 'fr' ? 'Forme' : 'Shape';
        const shapeValue = language === 'ar' ? shape.labelAr : language === 'fr' ? shape.labelFr : shape.label;
        summary.push({ label: shapeLabel, value: shapeValue });
      }
      const carat = caratRanges.find(c => c.id === selectedCaratRange);
      if (carat) {
        const caratLabel = language === 'ar' ? 'القيراط' : language === 'fr' ? 'Carat' : 'Carat';
        const caratValue = language === 'ar' ? carat.labelAr : language === 'fr' ? carat.labelFr : carat.label;
        summary.push({ label: caratLabel, value: caratValue });
      }
      const diamondType = diamondTypes.find(d => d.id === selectedDiamondType);
      if (diamondType) {
        const typeLabel = language === 'ar' ? 'نوع الألماس' : language === 'fr' ? 'Type de diamant' : 'Diamond Type';
        const typeValue = language === 'ar' ? diamondType.labelAr : language === 'fr' ? diamondType.labelFr : diamondType.label;
        summary.push({ label: typeLabel, value: typeValue });
      }
    }

    // Loose diamond selections - uses same state variables as ring (selectedShape, selectedCaratRange, selectedDiamondType)
    if (selectedItemType === 'loose-diamond') {
      const shape = diamondShapes.find(s => s.id === selectedShape);
      if (shape) {
        const shapeLabel = language === 'ar' ? 'الشكل' : language === 'fr' ? 'Forme' : 'Shape';
        const shapeValue = language === 'ar' ? shape.labelAr : language === 'fr' ? shape.labelFr : shape.label;
        summary.push({ label: shapeLabel, value: shapeValue });
      }
      const carat = caratRanges.find(c => c.id === selectedCaratRange);
      if (carat) {
        const caratLabel = language === 'ar' ? 'القيراط' : language === 'fr' ? 'Carat' : 'Carat';
        const caratValue = language === 'ar' ? carat.labelAr : language === 'fr' ? carat.labelFr : carat.label;
        summary.push({ label: caratLabel, value: caratValue });
      }
      const diamondType = diamondTypes.find(d => d.id === selectedDiamondType);
      if (diamondType) {
        const typeLabel = language === 'ar' ? 'نوع الألماس' : language === 'fr' ? 'Type de diamant' : 'Diamond Type';
        const typeValue = language === 'ar' ? diamondType.labelAr : language === 'fr' ? diamondType.labelFr : diamondType.label;
        summary.push({ label: typeLabel, value: typeValue });
      }
    }

    // Watch selections
    if (selectedItemType === 'watch') {
      const brand = watchBrands.find(b => b.id === selectedWatchBrand);
      if (brand) {
        const brandLabel = language === 'ar' ? 'العلامة التجارية' : language === 'fr' ? 'Marque' : 'Brand';
        summary.push({ label: brandLabel, value: brand.label });
      }
      if (selectedWatchModel) {
        const allModels = [...rolexModels, ...breitlingModels, ...cartierModels, ...iwcModels, ...omegaModels, ...patekPhilippeModels, ...audemarsPiguetModels, ...richardMilleModels, ...paneraiModels, ...breguetModels, ...vacheronConstantinModels, ...chopardModels];
        const model = allModels.find(m => m.id === selectedWatchModel);
        if (model) {
          const modelLabel = language === 'ar' ? 'الموديل' : language === 'fr' ? 'Modèle' : 'Model';
          const modelValue = language === 'ar' ? model.labelAr : language === 'fr' ? model.labelFr : model.label;
          summary.push({ label: modelLabel, value: modelValue });
        }
      }
    }

    // Necklace selections
    if (selectedItemType === 'necklace' && selectedNecklaceBrand) {
      const brand = necklaceBrands.find(b => b.id === selectedNecklaceBrand);
      if (brand) {
        const brandLabel = language === 'ar' ? 'العلامة التجارية' : language === 'fr' ? 'Marque' : 'Brand';
        summary.push({ label: brandLabel, value: brand.label });
      }
    }

    // Bracelet selections
    if (selectedItemType === 'bracelet' && selectedBraceletBrand) {
      const brand = braceletBrands.find(b => b.id === selectedBraceletBrand);
      if (brand) {
        const brandLabel = language === 'ar' ? 'العلامة التجارية' : language === 'fr' ? 'Marque' : 'Brand';
        summary.push({ label: brandLabel, value: brand.label });
      }
    }

    // Earring selections
    if (selectedItemType === 'earrings' && selectedEarringBrand) {
      const brand = earringBrands.find(b => b.id === selectedEarringBrand);
      if (brand) {
        const brandLabel = language === 'ar' ? 'العلامة التجارية' : language === 'fr' ? 'Marque' : 'Brand';
        summary.push({ label: brandLabel, value: brand.label });
      }
    }

    // Box & Paperwork (for items that have this step)
    if (['watch', 'necklace', 'bracelet', 'earrings'].includes(selectedItemType || '')) {
      const boxLabel = language === 'ar' ? 'العلبة الأصلية' : language === 'fr' ? 'Boîte originale' : 'Original Box';
      const boxValue = hasOriginalBox 
        ? (language === 'ar' ? 'نعم' : language === 'fr' ? 'Oui' : 'Yes')
        : (language === 'ar' ? 'لا' : language === 'fr' ? 'Non' : 'No');
      summary.push({ label: boxLabel, value: boxValue });

      const paperLabel = language === 'ar' ? 'الأوراق' : language === 'fr' ? 'Documents' : 'Paperwork';
      const paperValue = hasPaperwork 
        ? (language === 'ar' ? 'نعم' : language === 'fr' ? 'Oui' : 'Yes')
        : (language === 'ar' ? 'لا' : language === 'fr' ? 'Non' : 'No');
      summary.push({ label: paperLabel, value: paperValue });
    }

    return summary;
  };

  const selectionSummary = getSelectionSummary();

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[733px] max-h-[90vh] bg-[#f5f4f0] border-none p-0 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 bg-[#f5f4f0] pt-8 pb-6 px-8 text-center relative shadow-sm">
          {showBackButton && (
            <button
              onClick={handleBack}
              className={`absolute top-8 ${language === 'ar' ? 'right-8' : 'left-8'} p-2 text-muted-foreground hover:text-primary transition-colors`}
            >
              <BackArrow className="w-5 h-5" />
            </button>
          )}
          <span className="inline-block text-sm font-semibold text-primary uppercase tracking-wider mb-4">
            {getBadge()}
          </span>
          <h2 className={`text-3xl md:text-4xl font-light text-foreground mb-2 ${
            language === 'ar' ? 'font-arabic' : 'font-serif italic'
          }`}>
            {getTitle()}
          </h2>
          {getSubtitle() && (
            <DialogDescription className={`text-muted-foreground ${
              language === 'ar' ? 'font-arabic' : ''
            }`}>
              {getSubtitle()}
            </DialogDescription>
          )}
          
          {/* Progress Indicator */}
          {step !== 'thank-you' && (
            <div className="mt-6 px-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                <span>
                  {language === 'ar' ? `الخطوة ${progress.current} من ${progress.total}` : 
                   language === 'fr' ? `Étape ${progress.current} sur ${progress.total}` :
                   `Step ${progress.current} of ${progress.total}`}
                </span>
                <span>{Math.round(progressPercentage)}%</span>
              </div>
              <div className="h-1.5 bg-border/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          )}
        </div>
        
        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto">
        {/* Item Type List */}
        {step === 'item-type' && (
          <div className="px-6 pb-8 space-y-3">
            {itemTypes.map((item) => {
              const IconComponent = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`w-full flex items-center gap-4 p-4 bg-white rounded-lg border border-border/50 hover:border-primary/30 hover:shadow-md transition-all duration-200 group ${
                    language === 'ar' ? 'flex-row-reverse' : ''
                  }`}
                >
                  <div className="w-10 h-10 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                    <IconComponent className="w-6 h-6" strokeWidth={1.5} />
                  </div>
                  <span className={`text-foreground font-medium ${
                    language === 'ar' ? 'font-arabic' : ''
                  }`}>
                    {getLabel(item)}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Ring Setting List */}
        {step === 'ring-setting' && (
          <div className="px-6 pb-8 space-y-3">
            {ringSettings.map((setting) => {
              const IconComponent = setting.icon;
              return (
                <button
                  key={setting.id}
                  onClick={() => handleRingSettingClick(setting.id)}
                  className={`w-full flex items-center gap-4 p-4 bg-white rounded-lg border border-border/50 hover:border-primary/30 hover:shadow-md transition-all duration-200 group ${
                    language === 'ar' ? 'flex-row-reverse' : ''
                  }`}
                >
                  <div className="w-10 h-10 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                    <IconComponent className="w-6 h-6" strokeWidth={1.5} />
                  </div>
                  <span className={`text-foreground font-medium ${
                    language === 'ar' ? 'font-arabic' : ''
                  }`}>
                    {getLabel(setting)}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Diamond Shape List (Ring flow) */}
        {step === 'diamond-shape' && (
          <div className="px-6 pb-8 space-y-3">
            {diamondShapes.map((shape) => {
              const IconComponent = shape.icon;
              return (
                <button
                  key={shape.id}
                  onClick={() => handleDiamondShapeClick(shape.id)}
                  className={`w-full flex items-center gap-4 p-4 bg-white rounded-lg border border-border/50 hover:border-primary/30 hover:shadow-md transition-all duration-200 group ${
                    language === 'ar' ? 'flex-row-reverse' : ''
                  }`}
                >
                  <div className="w-10 h-10 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                    <IconComponent className="w-6 h-6" strokeWidth={1.5} />
                  </div>
                  <span className={`text-foreground font-medium ${
                    language === 'ar' ? 'font-arabic' : ''
                  }`}>
                    {getLabel(shape)}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Loose Diamond Shape List */}
        {step === 'loose-diamond-shape' && (
          <div className="px-6 pb-8 space-y-3">
            {diamondShapes.map((shape) => {
              const IconComponent = shape.icon;
              return (
                <button
                  key={shape.id}
                  onClick={() => handleLooseDiamondShapeClick(shape.id)}
                  className={`w-full flex items-center gap-4 p-4 bg-white rounded-lg border border-border/50 hover:border-primary/30 hover:shadow-md transition-all duration-200 group ${
                    language === 'ar' ? 'flex-row-reverse' : ''
                  }`}
                >
                  <div className="w-10 h-10 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                    <IconComponent className="w-6 h-6" strokeWidth={1.5} />
                  </div>
                  <span className={`text-foreground font-medium ${
                    language === 'ar' ? 'font-arabic' : ''
                  }`}>
                    {getLabel(shape)}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Watch Brand Selection */}
        {step === 'watch-brand' && (
          <div className="px-6 pb-8">
            <div className="grid grid-cols-4 gap-3">
              {watchBrands.map((brand) => {
                const isSelected = selectedWatchBrand === brand.id;
                return (
                  <button
                    key={brand.id}
                    onClick={() => handleWatchBrandClick(brand.id)}
                    className={`relative flex items-center justify-center p-4 bg-white rounded-lg border transition-all duration-200 aspect-square ${
                      isSelected 
                        ? 'border-primary shadow-md' 
                        : 'border-border/50 hover:border-primary/30 hover:shadow-md'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2">
                        <Check className="w-4 h-4 text-primary" />
                      </div>
                    )}
                    {brand.image ? (
                      <img 
                        src={brand.image} 
                        alt={brand.label} 
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <span className={`text-sm font-medium text-foreground ${
                        language === 'ar' ? 'font-arabic' : ''
                      }`}>
                        {brand.label}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Watch Model Selection */}
        {step === 'watch-model' && (
          <div className="px-6 pb-8 space-y-3">
            {(selectedWatchBrand === 'rolex' ? rolexModels : selectedWatchBrand === 'breitling' ? breitlingModels : selectedWatchBrand === 'cartier' ? cartierModels : selectedWatchBrand === 'iwc' ? iwcModels : selectedWatchBrand === 'omega' ? omegaModels : selectedWatchBrand === 'patek-philippe' ? patekPhilippeModels : selectedWatchBrand === 'audemars-piguet' ? audemarsPiguetModels : selectedWatchBrand === 'richard-mille' ? richardMilleModels : selectedWatchBrand === 'panerai' ? paneraiModels : selectedWatchBrand === 'breguet' ? breguetModels : selectedWatchBrand === 'vacheron-constantin' ? vacheronConstantinModels : chopardModels).map((model) => {
              return (
                <button
                  key={model.id}
                  onClick={() => handleWatchModelClick(model.id)}
                  className={`w-full flex items-center gap-4 p-4 bg-white rounded-lg border border-border/50 hover:border-primary/30 hover:shadow-md transition-all duration-200 group ${
                    language === 'ar' ? 'flex-row-reverse' : ''
                  }`}
                >
                  <span className={`text-foreground font-medium ${
                    language === 'ar' ? 'font-arabic' : ''
                  }`}>
                    {language === 'ar' ? model.labelAr : language === 'fr' ? model.labelFr : model.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Box & Paperwork Selection */}
        {step === 'box-paperwork' && (
          <div className="px-6 pb-8 space-y-4">
            <p className={`text-center text-muted-foreground text-sm mb-6 ${
              language === 'ar' ? 'font-arabic' : ''
            }`}>
              {language === 'ar' ? 'اختر خياراً أدناه' : language === 'fr' ? 'Sélectionnez une option ci-dessous' : 'Select an option below'}
            </p>
            
            {/* Original Box Checkbox */}
            <button
              onClick={() => setHasOriginalBox(!hasOriginalBox)}
              className={`w-full flex items-center justify-between p-4 bg-white rounded-lg border border-border/50 hover:border-primary/30 hover:shadow-md transition-all duration-200 ${
                language === 'ar' ? 'flex-row-reverse' : ''
              }`}
            >
              <div className={`flex items-center gap-3 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                <Package className="w-5 h-5 text-muted-foreground" />
                <span className={`text-foreground font-medium ${language === 'ar' ? 'font-arabic' : ''}`}>
                  {language === 'ar' ? 'العلبة الأصلية' : language === 'fr' ? 'Boîte originale' : 'Original box'}
                </span>
              </div>
              <div className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-all ${
                hasOriginalBox ? 'bg-primary border-primary' : 'border-border'
              }`}>
                {hasOriginalBox && <Check className="w-3 h-3 text-white" />}
              </div>
            </button>

            {/* Paperwork Checkbox */}
            <button
              onClick={() => setHasPaperwork(!hasPaperwork)}
              className={`w-full flex items-center justify-between p-4 bg-white rounded-lg border border-border/50 hover:border-primary/30 hover:shadow-md transition-all duration-200 ${
                language === 'ar' ? 'flex-row-reverse' : ''
              }`}
            >
              <div className={`flex items-center gap-3 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                <FileText className="w-5 h-5 text-muted-foreground" />
                <span className={`text-foreground font-medium ${language === 'ar' ? 'font-arabic' : ''}`}>
                  {language === 'ar' ? 'الأوراق' : language === 'fr' ? 'Documents' : 'Paperwork'}
                </span>
              </div>
              <div className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-all ${
                hasPaperwork ? 'bg-primary border-primary' : 'border-border'
              }`}>
                {hasPaperwork && <Check className="w-3 h-3 text-white" />}
              </div>
            </button>

            {/* Continue Button */}
            <div className="pt-4">
              <Button 
                onClick={handleBoxPaperworkContinue}
                className="w-full bg-primary hover:bg-primary/90 text-white py-3"
              >
                {getContinueLabel()}
                <ArrowRight className={`w-4 h-4 ${language === 'ar' ? 'mr-2 rotate-180' : 'ml-2'}`} />
              </Button>
            </div>
          </div>
        )}

        {/* Bracelet Brand Selection */}
        {step === 'bracelet-brand' && (
          <div className="px-6 pb-8">
            <div className="grid grid-cols-4 gap-3">
              {braceletBrands.map((brand) => {
                const isSelected = selectedBraceletBrand === brand.id;
                return (
                  <button
                    key={brand.id}
                    onClick={() => handleBraceletBrandClick(brand.id)}
                    className={`relative flex items-center justify-center p-4 bg-white rounded-lg border transition-all duration-200 min-h-[80px] ${
                      isSelected 
                        ? 'border-primary shadow-md' 
                        : 'border-border/50 hover:border-primary/30 hover:shadow-md'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2">
                        <Check className="w-4 h-4 text-primary" />
                      </div>
                    )}
                    <span className={`text-sm font-medium text-foreground text-center ${
                      language === 'ar' ? 'font-arabic' : ''
                    }`}>
                      {brand.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Necklace Brand Selection */}
        {step === 'necklace-brand' && (
          <div className="px-6 pb-8">
            <div className="grid grid-cols-4 gap-3">
              {necklaceBrands.map((brand) => {
                const isSelected = selectedNecklaceBrand === brand.id;
                return (
                  <button
                    key={brand.id}
                    onClick={() => handleNecklaceBrandClick(brand.id)}
                    className={`relative flex items-center justify-center p-4 bg-white rounded-lg border transition-all duration-200 min-h-[80px] ${
                      isSelected 
                        ? 'border-primary shadow-md' 
                        : 'border-border/50 hover:border-primary/30 hover:shadow-md'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2">
                        <Check className="w-4 h-4 text-primary" />
                      </div>
                    )}
                    <span className={`text-sm font-medium text-foreground text-center ${
                      language === 'ar' ? 'font-arabic' : ''
                    }`}>
                      {brand.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Earring Brand Selection */}
        {step === 'earring-brand' && (
          <div className="px-6 pb-8">
            <div className="grid grid-cols-4 gap-3">
              {earringBrands.map((brand) => {
                const isSelected = selectedEarringBrand === brand.id;
                return (
                  <button
                    key={brand.id}
                    onClick={() => handleEarringBrandClick(brand.id)}
                    className={`relative flex items-center justify-center p-4 bg-white rounded-lg border transition-all duration-200 min-h-[80px] ${
                      isSelected 
                        ? 'border-primary shadow-md' 
                        : 'border-border/50 hover:border-primary/30 hover:shadow-md'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2">
                        <Check className="w-4 h-4 text-primary" />
                      </div>
                    )}
                    <span className={`text-sm font-medium text-foreground text-center ${
                      language === 'ar' ? 'font-arabic' : ''
                    }`}>
                      {brand.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Diamond Carat Selection (Ring flow) */}
        {step === 'diamond-carat' && (
          <div className="px-6 pb-8 space-y-6">
            {/* Carat Range Dropdown */}
            <Select value={selectedCaratRange} onValueChange={setSelectedCaratRange}>
              <SelectTrigger className="w-full bg-white border-border/50 h-12">
                <SelectValue placeholder={getSelectPlaceholder()} />
              </SelectTrigger>
              <SelectContent className="bg-white z-50">
                {caratRanges.map((range) => (
                  <SelectItem key={range.id} value={range.id}>
                    {getCaratLabel(range)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Diamond Type Selection */}
            <div className={`flex gap-3 justify-center ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
              {diamondTypes.map((type) => {
                const IconComponent = type.icon;
                const isSelected = selectedDiamondType === type.id;
                return (
                  <button
                    key={type.id}
                    onClick={() => setSelectedDiamondType(type.id)}
                    className={`flex flex-col items-center gap-2 px-6 py-4 rounded-lg border transition-all duration-200 relative ${
                      isSelected 
                        ? 'bg-white border-primary/50 shadow-md' 
                        : 'bg-white border-border/50 hover:border-primary/30'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2">
                        <Check className="w-4 h-4 text-primary" />
                      </div>
                    )}
                    <IconComponent className={`w-6 h-6 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} strokeWidth={1.5} />
                    <span className={`text-sm font-medium ${
                      isSelected ? 'text-foreground' : 'text-muted-foreground'
                    } ${language === 'ar' ? 'font-arabic' : ''}`}>
                      {getLabel(type)}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Continue Button */}
            <Button
              onClick={handleContinue}
              disabled={!selectedCaratRange}
              className="w-full h-12 bg-muted-foreground hover:bg-foreground text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {getContinueLabel()}
              <ArrowRight className={`w-4 h-4 ${language === 'ar' ? 'mr-2 rotate-180' : 'ml-2'}`} />
            </Button>
          </div>
        )}

        {/* Loose Diamond Carat Selection */}
        {step === 'loose-diamond-carat' && (
          <div className="px-6 pb-8 space-y-6">
            {/* Carat Range Dropdown */}
            <Select value={selectedCaratRange} onValueChange={setSelectedCaratRange}>
              <SelectTrigger className="w-full bg-white border-border/50 h-12">
                <SelectValue placeholder={getSelectPlaceholder()} />
              </SelectTrigger>
              <SelectContent className="bg-white z-50">
                {caratRanges.map((range) => (
                  <SelectItem key={range.id} value={range.id}>
                    {getCaratLabel(range)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Diamond Type Selection */}
            <div className={`flex gap-3 justify-center ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
              {diamondTypes.map((type) => {
                const IconComponent = type.icon;
                const isSelected = selectedDiamondType === type.id;
                return (
                  <button
                    key={type.id}
                    onClick={() => setSelectedDiamondType(type.id)}
                    className={`flex flex-col items-center gap-2 px-6 py-4 rounded-lg border transition-all duration-200 relative ${
                      isSelected 
                        ? 'bg-white border-primary/50 shadow-md' 
                        : 'bg-white border-border/50 hover:border-primary/30'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2">
                        <Check className="w-4 h-4 text-primary" />
                      </div>
                    )}
                    <IconComponent className={`w-6 h-6 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} strokeWidth={1.5} />
                    <span className={`text-sm font-medium ${
                      isSelected ? 'text-foreground' : 'text-muted-foreground'
                    } ${language === 'ar' ? 'font-arabic' : ''}`}>
                      {getLabel(type)}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Continue Button */}
            <Button
              onClick={handleLooseDiamondContinue}
              disabled={!selectedCaratRange}
              className="w-full h-12 bg-muted-foreground hover:bg-foreground text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {getContinueLabel()}
              <ArrowRight className={`w-4 h-4 ${language === 'ar' ? 'mr-2 rotate-180' : 'ml-2'}`} />
            </Button>
          </div>
        )}

        {/* Signup Form */}
        {step === 'signup' && (
          <div className="px-6 pb-8 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Selection Summary */}
            {selectionSummary.length > 0 && (
              <div className="bg-primary/5 rounded-lg border border-primary/20 p-4">
                <p className={`text-xs font-semibold text-primary mb-3 uppercase tracking-wide ${language === 'ar' ? 'font-arabic text-right' : ''}`}>
                  {language === 'ar' ? 'ملخص اختياراتك' : language === 'fr' ? 'Résumé de vos choix' : 'Your Selections'}
                </p>
                <div className={`flex flex-wrap gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                  {selectionSummary.map((item, index) => (
                    <div 
                      key={index} 
                      className="inline-flex items-center gap-1.5 bg-white rounded-full px-3 py-1.5 border border-border/50 text-xs"
                    >
                      <span className={`text-muted-foreground ${language === 'ar' ? 'font-arabic' : ''}`}>
                        {item.label}:
                      </span>
                      <span className={`font-medium text-foreground ${language === 'ar' ? 'font-arabic' : ''}`}>
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Image Upload Section */}
            <div className="bg-white rounded-lg border border-border/50 p-4">
              <p className={`text-sm font-medium text-foreground mb-3 ${language === 'ar' ? 'font-arabic text-right' : ''}`}>
                {formLabels.uploadImages}
              </p>
              
              {/* Upload Area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border/50 rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className={`text-sm text-muted-foreground ${language === 'ar' ? 'font-arabic' : ''}`}>
                  {formLabels.uploadHint}
                </p>
                <p className={`text-xs text-muted-foreground/70 mt-1 ${language === 'ar' ? 'font-arabic' : ''}`}>
                  {formLabels.maxFiles}
                </p>
              </div>

              {/* Image Previews */}
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-5 gap-2 mt-3">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative aspect-square">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage(index);
                        }}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg border border-border/50 p-6 space-y-4">
              <Input
                type="text"
                placeholder={formLabels.firstName}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="border-0 border-b border-border/50 rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary"
                maxLength={100}
                required
              />
              <Input
                type="text"
                placeholder={formLabels.lastName}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="border-0 border-b border-border/50 rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary"
                maxLength={100}
                required
              />
              <Input
                type="email"
                placeholder={formLabels.email}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-0 border-b border-border/50 rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary"
                maxLength={255}
                required
              />
              <Input
                type="tel"
                placeholder={formLabels.phone}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="border-0 border-b border-border/50 rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary"
                maxLength={20}
                required
              />
              
              <div className={`flex items-start gap-3 pt-2 ${language === 'ar' ? 'flex-row-reverse text-right' : ''}`}>
                <Checkbox
                  id="agree-messages"
                  checked={agreeToMessages}
                  onCheckedChange={(checked) => setAgreeToMessages(checked as boolean)}
                  className="mt-1"
                  required
                />
                <label
                  htmlFor="agree-messages"
                  className={`text-xs text-muted-foreground leading-relaxed ${language === 'ar' ? 'font-arabic' : ''}`}
                >
                  {formLabels.agreement}
                </label>
              </div>
            </div>

            {/* Sign Up Button */}
            <Button
              onClick={handleSignUp}
              disabled={!isSignupValid || isSubmitting}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {language === 'ar' ? 'جاري الإرسال...' : language === 'fr' ? 'Envoi en cours...' : 'Submitting...'}
                </>
              ) : (
                getSignUpLabel()
              )}
            </Button>

            {/* Already signed up link */}
            <div className="text-center pt-2">
              <span className={`text-sm text-muted-foreground ${language === 'ar' ? 'font-arabic' : ''}`}>
                {formLabels.alreadySignedUp}{' '}
              </span>
              <button
                onClick={handleLoginClick}
                className="text-sm text-primary font-medium hover:underline"
              >
                {formLabels.logIn}
              </button>
            </div>
          </div>
        )}

        {/* Thank You Step */}
        {step === 'thank-you' && (
          <div className="px-6 pb-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
            </div>
            
            <p className={`text-muted-foreground mb-6 ${language === 'ar' ? 'font-arabic' : ''}`}>
              {language === 'ar' 
                ? 'لقد تلقينا طلبك وسنتواصل معك قريباً للحصول على تقييم مجاني لقطعتك.'
                : language === 'fr'
                ? 'Nous avons reçu votre demande et nous vous contacterons bientôt pour une évaluation gratuite de votre article.'
                : 'We have received your inquiry and will contact you shortly for a free evaluation of your item.'}
            </p>

            <p className={`text-sm text-muted-foreground/80 mb-8 ${language === 'ar' ? 'font-arabic' : ''}`}>
              {language === 'ar'
                ? 'تم إرسال رسالة تأكيد إلى بريدك الإلكتروني.'
                : language === 'fr'
                ? 'Un email de confirmation a été envoyé à votre adresse.'
                : 'A confirmation email has been sent to your address.'}
            </p>

            <Button
              onClick={handleThankYouClose}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {language === 'ar' ? 'إغلاق' : language === 'fr' ? 'Fermer' : 'Close'}
            </Button>
          </div>
        )}
        </div>
      </DialogContent>
    </Dialog>
  );
};