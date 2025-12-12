import { ShieldCheck } from "lucide-react";
import paymentMethodsImg from "@/assets/payment-methods.jpg";
import paymentMethods2Img from "@/assets/payment-methods-2.jpg";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const PaymentMethods = () => {
  return (
    <div className="mt-4 pt-4 border-t border-border space-y-4">
      <p className="text-sm text-muted-foreground mb-2">Accepted Payment Methods</p>
      <TooltipProvider>
        <div className="flex flex-wrap items-center gap-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <img 
                src={paymentMethodsImg} 
                alt="Accepted payment methods" 
                className="h-8 object-contain cursor-pointer transition-opacity hover:opacity-80"
              />
            </TooltipTrigger>
            <TooltipContent>
              <p>Credit/Debit Cards, Apple Pay, Wire Transfer & Affirm</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <img 
                src={paymentMethods2Img} 
                alt="Additional payment methods" 
                className="h-8 object-contain cursor-pointer transition-opacity hover:opacity-80"
              />
            </TooltipTrigger>
            <TooltipContent>
              <p>Visa, Mastercard, Amex, Apple Pay, Wire Transfer & Affirm</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>

      {/* Buyer Protection */}
      <div className="flex items-start gap-3 pt-2">
        <ShieldCheck className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-foreground">Buyer Protection</p>
          <p className="text-sm text-muted-foreground">
            Thanks to our Buyer Protection, your purchase is fully covered. If something goes wrong, we're there to help.{" "}
            <a 
              href="#" 
              className="text-primary hover:underline"
            >
              Learn more
            </a>
          </p>
        </div>
      </div>

      {/* Seller Protection */}
      <div className="flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-foreground">Seller Protection</p>
          <p className="text-sm text-muted-foreground">
            Our Seller Protection ensures secure transactions and guaranteed payments. We handle disputes so you can sell with confidence.{" "}
            <a 
              href="#" 
              className="text-primary hover:underline"
            >
              Learn more
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
