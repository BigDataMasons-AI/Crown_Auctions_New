import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock, Shield, Award, ChevronLeft, AlertCircle, LogIn, CreditCard, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";
import { useAuctionBids } from "@/hooks/useAuctionBids";
import { useAuth } from "@/contexts/AuthContext";
import { useBidNotifications } from "@/contexts/BidNotificationContext";
import { useAdmin } from "@/hooks/useAdmin";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDeposit } from "@/hooks/useDeposit";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { BidHistoryChart } from "@/components/BidHistoryChart";
import { AuthDialog } from "@/components/AuthDialog";
import { ImageMagnifier } from "@/components/ImageMagnifier";
import { DetailedSpecifications } from "@/components/DetailedSpecifications";
import diamondRing from "@/assets/auction-diamond-ring.jpg";
import swissWatch from "@/assets/auction-swiss-watch.jpg";
import necklace from "@/assets/auction-necklace.jpg";
import rolex from "@/assets/auction-rolex.jpg";
import earrings from "@/assets/auction-earrings.jpg";
import looseDiamond from "@/assets/auction-loose-diamond.jpg";

interface AuctionItem {
  id: string;
  title: string;
  images: string[];
  startingPrice: number;
  currentBid: number;
  endTime: Date;
  category: string;
  description: string;
  specifications: { label: string; value: string }[];
  certificates: { name: string; issuer: string; date: string }[];
  bidHistory: { bidder: string; amount: number; time: Date }[];
  minimumIncrement: number;
}

const auctionData: Record<string, AuctionItem> = {
  "1": {
    id: "1",
    title: "Platinum Diamond Solitaire Ring - 2.5 Carat",
    images: [diamondRing, diamondRing, diamondRing],
    startingPrice: 8500,
    currentBid: 12800,
    endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000),
    category: "Jewellery",
    description: "Exquisite platinum solitaire ring featuring a brilliant 2.5 carat diamond. The center stone is GIA certified with excellent cut, color grade F, and VS1 clarity. Set in a classic 6-prong platinum band.",
    specifications: [
      { label: "Metal", value: "950 Platinum" },
      { label: "Diamond Weight", value: "2.5 Carats" },
      { label: "Color Grade", value: "F (Colorless)" },
      { label: "Clarity", value: "VS1 (Very Slightly Included)" },
      { label: "Cut", value: "Excellent" },
      { label: "Ring Size", value: "6 (Resizable)" },
    ],
    certificates: [
      { name: "GIA Diamond Report", issuer: "Gemological Institute of America", date: "2024-01-15" },
      { name: "Platinum Hallmark", issuer: "Australian Assay Office", date: "2024-02-01" },
    ],
    bidHistory: [
      { bidder: "Bidder #42", amount: 12800, time: new Date(Date.now() - 1000 * 60 * 15) },
      { bidder: "Bidder #31", amount: 12500, time: new Date(Date.now() - 1000 * 60 * 45) },
      { bidder: "Bidder #42", amount: 12200, time: new Date(Date.now() - 1000 * 60 * 120) },
      { bidder: "Bidder #18", amount: 11800, time: new Date(Date.now() - 1000 * 60 * 180) },
    ],
    minimumIncrement: 200,
  },
  "2": {
    id: "2",
    title: "Swiss Chronograph Watch - Black Leather Strap",
    images: [swissWatch, swissWatch, swissWatch],
    startingPrice: 3200,
    currentBid: 4950,
    endTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000),
    category: "Watches",
    description: "Premium Swiss-made automatic chronograph with a sophisticated black dial and genuine leather strap. Features include date display, tachymeter bezel, and water resistance to 100 meters.",
    specifications: [
      { label: "Listing Code", value: "SWISS2024" },
      { label: "Brand", value: "Swiss Manufacture" },
      { label: "Model", value: "Chronograph Classic" },
      { label: "Reference Number", value: "CH-2024-BLK" },
      { label: "Year of Production", value: "2024" },
      { label: "Condition", value: "New" },
      { label: "Scope of Delivery", value: "Original box, original papers" },
      { label: "Gender", value: "Men's watch/Unisex" },
      { label: "Location", value: "United States" },
      { label: "Movement", value: "Automatic Chronograph" },
      { label: "Caliber", value: "SW500" },
      { label: "Power Reserve", value: "48 h" },
      { label: "Number of Jewels", value: "25" },
      { label: "Case Material", value: "Stainless Steel" },
      { label: "Case Diameter", value: "42 mm" },
      { label: "Water Resistance", value: "10 ATM" },
      { label: "Bezel Material", value: "Stainless Steel" },
      { label: "Crystal", value: "Sapphire crystal" },
      { label: "Dial", value: "Black" },
      { label: "Dial Numerals", value: "Arabic numerals" },
      { label: "Bracelet Material", value: "Leather" },
      { label: "Bracelet Color", value: "Black" },
      { label: "Clasp", value: "Fold clasp" },
      { label: "Clasp Material", value: "Steel" },
      { label: "Chronograph", value: "Yes" },
    ],
    certificates: [
      { name: "Swiss Made Certificate", issuer: "Federation of the Swiss Watch Industry", date: "2023-11-20" },
      { name: "Warranty Card", issuer: "Manufacturer", date: "2024-01-05" },
    ],
    bidHistory: [
      { bidder: "Bidder #29", amount: 4950, time: new Date(Date.now() - 1000 * 60 * 25) },
      { bidder: "Bidder #15", amount: 4800, time: new Date(Date.now() - 1000 * 60 * 60) },
      { bidder: "Bidder #29", amount: 4650, time: new Date(Date.now() - 1000 * 60 * 95) },
    ],
    minimumIncrement: 150,
  },
  "3": {
    id: "3",
    title: "18K Gold Diamond Pendant Necklace",
    images: [necklace, necklace, necklace],
    startingPrice: 2800,
    currentBid: 3650,
    endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
    category: "Jewellery",
    description: "Elegant 18K yellow gold necklace featuring a stunning diamond pendant. The design showcases a cluster of brilliant-cut diamonds totaling 0.85 carats, set in a classic teardrop shape.",
    specifications: [
      { label: "Metal", value: "18K Yellow Gold" },
      { label: "Total Diamond Weight", value: "0.85 Carats" },
      { label: "Diamond Quality", value: "G Color, VS Clarity" },
      { label: "Chain Length", value: "18 inches (Adjustable)" },
      { label: "Pendant Size", value: "22mm x 15mm" },
      { label: "Clasp Type", value: "Lobster Claw" },
    ],
    certificates: [
      { name: "Gold Assay Certificate", issuer: "Australian Assay Office", date: "2024-01-10" },
    ],
    bidHistory: [
      { bidder: "Bidder #56", amount: 3650, time: new Date(Date.now() - 1000 * 60 * 10) },
      { bidder: "Bidder #44", amount: 3500, time: new Date(Date.now() - 1000 * 60 * 75) },
    ],
    minimumIncrement: 100,
  },
  "4": {
    id: "4",
    title: "Vintage Rolex Datejust - 18K Gold",
    images: [rolex, rolex, rolex],
    startingPrice: 15000,
    currentBid: 22500,
    endTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000),
    category: "Watches",
    description: "Iconic vintage Rolex Datejust in 18K yellow gold with champagne dial. This timepiece represents the pinnacle of Swiss watchmaking, featuring the legendary Rolex automatic movement and classic jubilee bracelet.",
    specifications: [
      { label: "Listing Code", value: "ROLEX1995" },
      { label: "Brand", value: "Rolex" },
      { label: "Model", value: "Datejust" },
      { label: "Reference Number", value: "16238" },
      { label: "Year of Production", value: "1995" },
      { label: "Condition", value: "Very Good" },
      { label: "Scope of Delivery", value: "Original box, original papers" },
      { label: "Gender", value: "Men's watch/Unisex" },
      { label: "Location", value: "United States, Florida" },
      { label: "Movement", value: "Automatic" },
      { label: "Caliber", value: "3135" },
      { label: "Power Reserve", value: "48 h" },
      { label: "Number of Jewels", value: "31" },
      { label: "Case Material", value: "18K Yellow Gold" },
      { label: "Case Diameter", value: "36 mm" },
      { label: "Case Thickness", value: "12 mm" },
      { label: "Water Resistance", value: "10 ATM" },
      { label: "Bezel Material", value: "18K Yellow Gold" },
      { label: "Crystal", value: "Sapphire crystal" },
      { label: "Dial", value: "Champagne" },
      { label: "Dial Numerals", value: "Roman numerals" },
      { label: "Bracelet Material", value: "18K Yellow Gold" },
      { label: "Bracelet Color", value: "Gold" },
      { label: "Clasp", value: "Hidden fold clasp" },
      { label: "Clasp Material", value: "18K Yellow Gold" },
      { label: "Date Display", value: "Yes" },
    ],
    certificates: [
      { name: "Rolex Service Papers", issuer: "Authorized Rolex Service Center", date: "2023-10-15" },
      { name: "Authenticity Certificate", issuer: "Crown Auctions", date: "2024-02-20" },
    ],
    bidHistory: [
      { bidder: "Bidder #73", amount: 22500, time: new Date(Date.now() - 1000 * 60 * 8) },
      { bidder: "Bidder #61", amount: 22000, time: new Date(Date.now() - 1000 * 60 * 35) },
      { bidder: "Bidder #73", amount: 21500, time: new Date(Date.now() - 1000 * 60 * 88) },
      { bidder: "Bidder #55", amount: 21000, time: new Date(Date.now() - 1000 * 60 * 142) },
    ],
    minimumIncrement: 500,
  },
  "5": {
    id: "5",
    title: "Sapphire & Diamond Drop Earrings - White Gold",
    images: [earrings, earrings, earrings],
    startingPrice: 5500,
    currentBid: 7200,
    endTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 15 * 60 * 60 * 1000),
    category: "Jewellery",
    description: "Stunning pair of drop earrings crafted in 18K white gold, featuring vivid blue sapphires surrounded by brilliant-cut diamonds. The perfect combination of elegance and sophistication.",
    specifications: [
      { label: "Metal", value: "18K White Gold" },
      { label: "Sapphire Weight", value: "3.2 Carats Total" },
      { label: "Diamond Weight", value: "0.65 Carats Total" },
      { label: "Sapphire Origin", value: "Ceylon (Sri Lanka)" },
      { label: "Earring Length", value: "28mm" },
      { label: "Closure Type", value: "Secure Post & Butterfly" },
    ],
    certificates: [
      { name: "Gemstone Certificate", issuer: "GIA", date: "2024-01-22" },
      { name: "Gold Hallmark", issuer: "Australian Assay Office", date: "2024-02-05" },
    ],
    bidHistory: [
      { bidder: "Bidder #38", amount: 7200, time: new Date(Date.now() - 1000 * 60 * 12) },
      { bidder: "Bidder #27", amount: 7000, time: new Date(Date.now() - 1000 * 60 * 52) },
      { bidder: "Bidder #38", amount: 6800, time: new Date(Date.now() - 1000 * 60 * 105) },
    ],
    minimumIncrement: 200,
  },
  "6": {
    id: "6",
    title: "GIA Certified 3.2 Carat Loose Diamond - VS1",
    images: [looseDiamond, looseDiamond, looseDiamond],
    startingPrice: 18000,
    currentBid: 24800,
    endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000),
    category: "Diamonds",
    description: "Exceptional GIA certified loose diamond weighing 3.2 carats. This stunning stone features an excellent cut grade, E color (colorless), and VS1 clarity. Perfect for custom jewelry creation.",
    specifications: [
      { label: "Carat Weight", value: "3.20 ct" },
      { label: "Shape", value: "Round Brilliant" },
      { label: "Color Grade", value: "E (Colorless)" },
      { label: "Clarity", value: "VS1" },
      { label: "Cut Grade", value: "Excellent" },
      { label: "Polish", value: "Excellent" },
      { label: "Symmetry", value: "Excellent" },
      { label: "Fluorescence", value: "None" },
    ],
    certificates: [
      { name: "GIA Diamond Grading Report", issuer: "Gemological Institute of America", date: "2024-02-10" },
    ],
    bidHistory: [
      { bidder: "Bidder #82", amount: 24800, time: new Date(Date.now() - 1000 * 60 * 5) },
      { bidder: "Bidder #69", amount: 24000, time: new Date(Date.now() - 1000 * 60 * 28) },
      { bidder: "Bidder #82", amount: 23500, time: new Date(Date.now() - 1000 * 60 * 65) },
      { bidder: "Bidder #74", amount: 23000, time: new Date(Date.now() - 1000 * 60 * 110) },
    ],
    minimumIncrement: 500,
  },
};

export default function AuctionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const { t, language } = useLanguage();
  const [selectedImage, setSelectedImage] = useState(0);
  const [bidAmount, setBidAmount] = useState("");
  const [auctionStatus, setAuctionStatus] = useState<string | null>(null);
  const [auctionApprovalStatus, setAuctionApprovalStatus] = useState<string | null>(null);
  const [dbAuction, setDbAuction] = useState<AuctionItem | null>(null);
  const [loading, setLoading] = useState(true);
  const { bids, loading: bidsLoading, currentHighestBid, placeBid } = useAuctionBids(id);
  const { trackAuction } = useBidNotifications();
  const { hasDeposit, loading: depositLoading, createDepositOrder } = useDeposit();
  const [depositProcessing, setDepositProcessing] = useState(false);

  // Certificate name translation mapping
  const getCertNameKey = (name: string): string | null => {
    const certNameMap: Record<string, string> = {
      'GIA Diamond Report': 'cert.giaReport',
      'GIA Diamond Grading Report': 'cert.giaReport',
      'Platinum Hallmark': 'cert.platinumHallmark',
      'Swiss Made Certificate': 'cert.swissMade',
      'Warranty Card': 'cert.warranty',
      'Gold Assay Certificate': 'cert.goldAssay',
      'Gold Hallmark': 'cert.goldAssay',
      'Authenticity Report': 'cert.authenticityReport',
      'Appraisal Report': 'cert.appraisalReport',
      'Insurance Valuation': 'cert.insuranceValuation',
    };
    return certNameMap[name] || null;
  };

  // Certificate issuer translation mapping
  const getCertIssuerKey = (issuer: string): string | null => {
    const certIssuerMap: Record<string, string> = {
      'Gemological Institute of America': 'cert.issuer.gia',
      'GIA': 'cert.issuer.gia',
      'Australian Assay Office': 'cert.issuer.australianAssay',
      'Federation of the Swiss Watch Industry': 'cert.issuer.swissWatch',
      'Manufacturer': 'cert.issuer.manufacturer',
      'International Gemological Institute': 'cert.issuer.igi',
      'IGI': 'cert.issuer.igi',
      'HRD Antwerp': 'cert.issuer.hrd',
    };
    return certIssuerMap[issuer] || null;
  };

  // First check mock data, then database
  const mockAuction = id ? auctionData[id] : null;
  const auction = dbAuction || mockAuction;

  // Fetch auction data from database
  useEffect(() => {
    const fetchAuction = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('auctions')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (error) throw error;
        if (data) {
          setAuctionStatus(data.status);
          setAuctionApprovalStatus(data.approval_status);
          
          // Transform database auction to AuctionItem format
          const transformedAuction: AuctionItem = {
            id: data.id,
            title: data.title,
            images: data.image_urls?.length > 0 ? data.image_urls : ['/placeholder.svg'],
            startingPrice: Number(data.starting_price) || 0,
            currentBid: Number(data.current_bid) || 0,
            endTime: new Date(data.end_time),
            category: data.category,
            description: data.description,
            specifications: Array.isArray(data.specifications) 
              ? (data.specifications as { label: string; value: string }[]) 
              : [],
            certificates: Array.isArray(data.certificates) 
              ? (data.certificates as { name: string; issuer: string; date: string }[]) 
              : [],
            bidHistory: [],
            minimumIncrement: Number(data.minimum_increment) || 100,
          };
          setDbAuction(transformedAuction);
        }
      } catch (error) {
        console.error('Error fetching auction:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAuction();

    // Set up real-time subscription for status changes
    const channel = supabase
      .channel(`auction-${id}-status`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'auctions',
          filter: `id=eq.${id}`
        },
        (payload) => {
          if (payload.new) {
            setAuctionStatus(payload.new.status);
            setAuctionApprovalStatus(payload.new.approval_status);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);
  
  // Update current bid based on database bids
  const displayCurrentBid = currentHighestBid || auction?.currentBid || 0;

  if (loading) {
    return (
      <div className={`min-h-screen flex flex-col ${language === 'ar' ? 'font-arabic' : ''}`}>
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading auction...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!auction) {
    return (
      <div className={`min-h-screen flex flex-col ${language === 'ar' ? 'font-arabic' : ''}`}>
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">{t('auctionDetail.notFound')}</h1>
            <Button onClick={() => navigate("/")} variant="gold">
              {t('auctionDetail.returnHome')}
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const minimumBid = displayCurrentBid + (auction?.minimumIncrement || 100);

  const handlePlaceBid = async () => {
    if (!user) {
      toast({
        title: t('auctionDetail.signInRequired'),
        description: t('auctionDetail.signInToBid'),
        variant: "destructive",
      });
      return;
    }

    const bidValue = parseFloat(bidAmount);
    
    if (!bidAmount || isNaN(bidValue)) {
      toast({
        title: t('auctionDetail.invalidBid'),
        description: t('auctionDetail.enterValidBid'),
        variant: "destructive",
      });
      return;
    }

    const success = await placeBid(bidValue, minimumBid);
    if (success && id) {
      // Track this auction for outbid notifications
      trackAuction(id, bidValue);
      setBidAmount("");
    }
  };

  return (
    <div className={`min-h-screen flex flex-col ${language === 'ar' ? 'font-arabic' : ''}`}>
      <Navigation />
      
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-6 hover:text-gold"
          >
            <ChevronLeft className={`w-4 h-4 ${language === 'ar' ? 'ml-2 rotate-180' : 'mr-2'}`} />
            {t('auctionDetail.backToAuctions')}
          </Button>

          <div className="grid lg:grid-cols-2 gap-12 mb-12">
            {/* Image Gallery */}
            <div className="space-y-4">
              <div className="aspect-square overflow-hidden rounded-lg bg-muted">
                <ImageMagnifier
                  src={auction.images[selectedImage]}
                  alt={auction.title}
                  className="w-full h-full"
                  magnifierSize={400}
                  zoomLevel={2.5}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                {auction.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square overflow-hidden rounded-lg border-2 transition-all ${
                      selectedImage === index
                        ? "border-gold"
                        : "border-transparent hover:border-muted-foreground/20"
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${auction.title} view ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Auction Details & Bidding */}
            <div className="space-y-6">
              <div>
                <Badge className="mb-3">{t(`category.${auction.category.toLowerCase()}`) !== `category.${auction.category.toLowerCase()}` ? t(`category.${auction.category.toLowerCase()}`) : auction.category}</Badge>
                <h1 className="text-4xl font-bold mb-4">{auction.title}</h1>
                <h2 className="text-lg font-semibold text-muted-foreground mb-2">{t('auctionDetail.description')}</h2>
                <p className="text-muted-foreground text-lg">{auction.description}</p>
              </div>

              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex justify-between items-center pb-4 border-b">
                    <span className="text-sm text-muted-foreground">{t('auctionDetail.startingPrice')}:</span>
                    <span className="font-medium">{formatPrice(auction.startingPrice)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-semibold">{t('auctionDetail.currentBid')}:</span>
                    <span className="text-3xl font-bold text-gold">
                      {formatPrice(displayCurrentBid)}
                    </span>
                  </div>
                  {bids.length > 0 && (
                    <div className="text-sm text-muted-foreground pt-2">
                      {bids.length} {bids.length === 1 ? t('auctionDetail.bidPlaced') : t('auctionDetail.bidsPlaced')}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-lg pt-2">
                    <Clock className="w-5 h-5 text-gold" />
                    <span className="font-medium">{t('auctionDetail.endsIn')} 2d 5h 23m</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('auctionDetail.placeYourBid')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {auctionStatus === 'paused' && (
                    <div className="p-4 border border-yellow-500 rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-yellow-900 dark:text-yellow-200">{t('auctionDetail.auctionPaused')}</p>
                          <p className="text-sm text-yellow-800 dark:text-yellow-300 mt-1">
                            {t('auctionDetail.auctionPausedMessage')}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  {isAdmin ? (
                    <div className="p-4 border border-muted rounded-lg bg-muted/30">
                      <p className="text-sm text-muted-foreground">
                        {t('auctionDetail.adminCannotBid')}
                      </p>
                    </div>
                  ) : auctionStatus === 'paused' ? null : (
                    <>
                      {!user && (
                        <div className="p-4 border border-gold/30 rounded-lg bg-gold/5 space-y-3">
                          <p className="text-sm text-muted-foreground text-center">
                            {t('auctionDetail.signInToBid')}
                          </p>
                          <AuthDialog>
                            <Button variant="gold" className="w-full">
                              <LogIn className="mr-2 h-4 w-4" />
                              Sign In to Bid
                            </Button>
                          </AuthDialog>
                        </div>
                      )}
                      {user && !hasDeposit && !depositLoading && (
                        <div className="p-4 border border-gold/30 rounded-lg bg-gold/5 space-y-3">
                          <div className="flex items-center gap-2 mb-2">
                            <CreditCard className="w-5 h-5 text-gold" />
                            <span className="font-medium text-luxury-text">Deposit Required</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            A refundable $100 deposit is required to place bids.
                          </p>
                          <Button 
                            variant="gold" 
                            className="w-full"
                            disabled={depositProcessing}
                            onClick={async () => {
                              setDepositProcessing(true);
                              const result = await createDepositOrder();
                              if (result) {
                                window.location.href = result.approveUrl;
                              } else {
                                sonnerToast.error("Failed to create deposit. Please try again.");
                                setDepositProcessing(false);
                              }
                            }}
                          >
                            {depositProcessing ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <CreditCard className="mr-2 h-4 w-4" />
                                Pay $100 Deposit
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                      <div>
                        <Label htmlFor="bid-amount">{t('auctionDetail.yourBidAmount')}</Label>
                        <Input
                          id="bid-amount"
                          type="number"
                          placeholder={formatPrice(minimumBid)}
                          value={bidAmount}
                          onChange={(e) => setBidAmount(e.target.value)}
                          className="mt-2"
                          min={minimumBid}
                          step={auction.minimumIncrement}
                          disabled={auctionStatus !== 'active' || !user || !hasDeposit}
                        />
                        <p className="text-sm text-muted-foreground mt-2">
                          {t('auctionDetail.minimumBid')}: {formatPrice(minimumBid)} ({t('auctionDetail.increment')}: {formatPrice(auction.minimumIncrement)})
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm">{t('auctionDetail.quickBid')}</Label>
                        <div className="grid grid-cols-3 gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setBidAmount(minimumBid.toString())}
                            className="hover:border-gold hover:text-gold transition-colors"
                            disabled={auctionStatus !== 'active' || !user || !hasDeposit}
                          >
                            {t('auctionDetail.minBid')}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setBidAmount((minimumBid + auction.minimumIncrement).toString())}
                            className="hover:border-gold hover:text-gold transition-colors"
                            disabled={auctionStatus !== 'active' || !user || !hasDeposit}
                          >
                            +{formatPrice(auction.minimumIncrement)}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setBidAmount((minimumBid + auction.minimumIncrement * 2).toString())}
                            className="hover:border-gold hover:text-gold transition-colors"
                            disabled={auctionStatus !== 'active' || !user || !hasDeposit}
                          >
                            +{formatPrice(auction.minimumIncrement * 2)}
                          </Button>
                        </div>
                      </div>

                      {user && hasDeposit ? (
                        <Button 
                          onClick={handlePlaceBid} 
                          variant="gold" 
                          size="lg" 
                          className="w-full"
                          disabled={auctionStatus !== 'active'}
                        >
                          {auctionStatus !== 'active' ? t('auctionDetail.biddingDisabled') : t('auctionDetail.placeBid')}
                        </Button>
                      ) : (
                        <Button 
                          variant="gold" 
                          size="lg" 
                          className="w-full opacity-50 cursor-not-allowed"
                          disabled
                        >
                          {!user ? t('auctionDetail.signInRequired') : 'Deposit Required to Bid'}
                        </Button>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Detailed Specifications */}
          <DetailedSpecifications 
            specifications={auction.specifications} 
            category={auction.category} 
          />

          {/* Authentication Certificates */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-gold" />
                {t('auctionDetail.authentication')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {auction.certificates.map((cert, index) => {
                  const certNameKey = getCertNameKey(cert.name);
                  const certIssuerKey = getCertIssuerKey(cert.issuer);
                  return (
                    <div key={index} className="p-4 bg-muted/50 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-lg">
                            {certNameKey ? t(certNameKey) : cert.name}
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {t('auctionDetail.issuedBy')}: {certIssuerKey ? t(certIssuerKey) : cert.issuer}
                          </p>
                        </div>
                        <Badge variant="secondary">{cert.date}</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Bid History */}
          <Card>
            <CardHeader>
              <CardTitle>{t('auctionDetail.bidHistory')}</CardTitle>
            </CardHeader>
            <CardContent>
              {bidsLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  {t('auctionDetail.loadingBidHistory')}
                </div>
              ) : bids.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {t('auctionDetail.noBidsYet')}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('auctionDetail.bidder')}</TableHead>
                      <TableHead>{t('auctionDetail.bidAmount')}</TableHead>
                      <TableHead>{t('auctionDetail.time')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bids.map((bid, index) => (
                      <TableRow key={bid.id} className={index === 0 ? "bg-accent/5" : ""}>
                        <TableCell className="font-medium">
                          {bid.user_id === user?.id ? t('auctionDetail.you') : `${t('auctionDetail.bidder')} #${bid.user_id.slice(0, 6)}`}
                          {index === 0 && (
                            <Badge variant="secondary" className={`${language === 'ar' ? 'mr-2' : 'ml-2'} text-xs`}>
                              {t('auctionDetail.highest')}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-bold text-gold">
                          {formatPrice(bid.bid_amount)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDistanceToNow(new Date(bid.bid_time), { addSuffix: true })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Bid Analytics Chart */}
          <BidHistoryChart 
            bids={bids} 
            startingPrice={auction.startingPrice}
            auctionEndTime={auction.endTime}
            category={auction.category}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}