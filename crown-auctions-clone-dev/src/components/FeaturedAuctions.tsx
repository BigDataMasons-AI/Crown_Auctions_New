import { useState, useEffect } from "react";
import { AuctionCard } from "./AuctionCard";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

type Category = "all" | "jewellery" | "watches" | "diamonds";

interface AuctionItem {
  id: string;
  title: string;
  image: string;
  startingPrice: number;
  currentBid: number;
  endTime: Date;
  category: string;
  bids: number;
  status?: string;
}

export const FeaturedAuctions = () => {
  const [selectedCategory, setSelectedCategory] = useState<Category>("all");
  const [auctions, setAuctions] = useState<AuctionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    const fetchApprovedAuctions = async () => {
      setLoading(true);
      try {
        // Fetch approved auctions from the public view
        const { data: auctionsData, error: auctionsError } = await supabase
          .from('auctions_public')
          .select('*')
          .eq('approval_status', 'approved')
          .in('status', ['active', 'pending'])
          .order('created_at', { ascending: false })
          .limit(12);

        if (auctionsError) {
          console.error('Error fetching auctions:', auctionsError);
          return;
        }

        if (auctionsData && auctionsData.length > 0) {
          // Get bid counts for each auction
          const auctionIds = auctionsData.map(a => a.id).filter(Boolean);
          const { data: bidsData } = await supabase
            .from('bids')
            .select('auction_id')
            .in('auction_id', auctionIds);

          const bidCounts: Record<string, number> = {};
          bidsData?.forEach(bid => {
            bidCounts[bid.auction_id] = (bidCounts[bid.auction_id] || 0) + 1;
          });

          const formattedAuctions: AuctionItem[] = auctionsData.map(auction => ({
            id: auction.id || '',
            title: auction.title || '',
            image: auction.image_urls?.[0] || '/placeholder.svg',
            startingPrice: Number(auction.starting_price) || 0,
            currentBid: Number(auction.current_bid) || 0,
            endTime: new Date(auction.end_time || Date.now()),
            category: auction.category || 'jewellery',
            bids: bidCounts[auction.id || ''] || 0,
            status: auction.status || 'active',
          }));

          setAuctions(formattedAuctions);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchApprovedAuctions();
  }, []);

  const filteredAuctions =
    selectedCategory === "all"
      ? auctions
      : auctions.filter((auction) => 
          auction.category.toLowerCase().includes(selectedCategory.toLowerCase())
        );

  return (
    <section id="auctions" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">{t('featured.title')}</h2>
          <p className="text-muted-foreground text-lg mb-8">
            {t('featured.subtitle')}
          </p>
          <div className="w-24 h-1 bg-gold mx-auto"></div>
        </div>

        <Tabs
          defaultValue="all"
          className="mb-12"
          onValueChange={(value) => setSelectedCategory(value as Category)}
        >
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-4 h-12">
            <TabsTrigger value="all" className="text-sm font-medium">
              {t('featured.all')}
            </TabsTrigger>
            <TabsTrigger value="jewellery" className="text-sm font-medium">
              {t('featured.jewellery')}
            </TabsTrigger>
            <TabsTrigger value="watches" className="text-sm font-medium">
              {t('featured.watches')}
            </TabsTrigger>
            <TabsTrigger value="diamonds" className="text-sm font-medium">
              {t('featured.diamonds')}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square w-full rounded-lg" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 animate-fade-in">
            {filteredAuctions.map((auction) => (
              <AuctionCard key={auction.id} {...auction} />
            ))}
          </div>
        )}

        {!loading && filteredAuctions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              {t('featured.noAuctions')}
            </p>
          </div>
        )}
      </div>
    </section>
  );
};
