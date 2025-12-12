import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSavedAuctions } from "@/hooks/useSavedAuctions";
import { Heart, Award, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface AuctionCardProps {
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

export const AuctionCard = ({
  id,
  title,
  image,
  startingPrice,
  currentBid,
  category,
  bids,
}: AuctionCardProps) => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { toggleSaveAuction, isSaved } = useSavedAuctions();

  const handleSaveClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleSaveAuction(id);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(language === 'ar' ? "ar-QA" : "en-AU", {
      style: "currency",
      currency: "QAR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Show "Popular" badge if item has bids
  const isPopular = bids > 0;
  const displayCategory = t(`featured.${category}`);

  return (
    <div 
      className="group cursor-pointer"
      onClick={() => navigate(`/auction/${id}`)}
    >
      {/* Image Container */}
      <div className="relative aspect-square bg-muted/50 rounded-lg overflow-hidden mb-3">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Popular Badge - Top Left */}
        {isPopular && (
          <Badge className="absolute top-3 left-3 bg-gold text-white text-xs font-medium px-2 py-1">
            Popular
          </Badge>
        )}
        
        {/* Favorite Heart - Top Right */}
        <button
          onClick={handleSaveClick}
          className={cn(
            "absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all",
            "bg-white/90 hover:bg-white shadow-sm",
            isSaved(id) ? "text-red-500" : "text-muted-foreground hover:text-red-500"
          )}
        >
          <Heart 
            className={cn(
              "h-4 w-4",
              isSaved(id) && "fill-current"
            )}
          />
        </button>
      </div>
      
      {/* Text Content */}
      <div className="space-y-1.5">
        <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-gold transition-colors">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-1">
          {displayCategory}
        </p>
        
        {/* Price */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-foreground">
              {formatPrice(currentBid > 0 ? currentBid : startingPrice)}
            </p>
            <p className="text-xs text-muted-foreground">Plus shipping</p>
          </div>
        </div>
        
        {/* Tags Row */}
        <div className="flex items-center gap-2 pt-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Award className="h-3.5 w-3.5" />
            <span>Certified optional</span>
          </div>
          <Badge variant="outline" className="text-xs px-2 py-0.5 font-normal">
            <User className="h-3 w-3 mr-1" />
            Private Seller
          </Badge>
        </div>
      </div>
    </div>
  );
};
