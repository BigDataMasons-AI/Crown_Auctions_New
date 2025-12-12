import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, CheckCircle, Loader2 } from "lucide-react";
import { useDeposit } from "@/hooks/useDeposit";
import { toast } from "sonner";

interface AuthDialogProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const AuthDialog = ({ children, open, onOpenChange }: AuthDialogProps) => {
  const { signIn, signUp, user } = useAuth();
  const { hasDeposit, createDepositOrder, captureDeposit, checkDeposit } = useDeposit();
  const [internalOpen, setInternalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"auth" | "deposit" | "processing" | "success">("auth");
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);

  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setIsOpen = isControlled ? onOpenChange! : setInternalOpen;

  // Reset step when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setStep("auth");
      setPendingOrderId(null);
    }
  }, [isOpen]);

  // Check URL params for PayPal return
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");
    
    if (token && user && !hasDeposit) {
      setIsOpen(true);
      setStep("processing");
      handlePayPalReturn(token);
      // Clean URL
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [user, hasDeposit]);

  const handlePayPalReturn = async (orderId: string) => {
    const success = await captureDeposit(orderId);
    if (success) {
      setStep("success");
      toast.success("Deposit successful! You can now place bids.");
      setTimeout(() => {
        setIsOpen(false);
      }, 2000);
    } else {
      setStep("deposit");
      toast.error("Payment could not be completed. Please try again.");
    }
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const { error } = await signIn(email, password);
    setIsLoading(false);
    if (!error) {
      // Check if user has deposit after sign in
      await checkDeposit();
      setIsOpen(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const fullName = formData.get("fullName") as string;
    const { error } = await signUp(email, password, fullName);
    setIsLoading(false);
    if (!error) {
      // Show deposit step after successful signup
      setStep("deposit");
    }
  };

  const handlePayDeposit = async () => {
    setIsLoading(true);
    const result = await createDepositOrder();
    setIsLoading(false);
    
    if (result) {
      setPendingOrderId(result.orderId);
      // Redirect to PayPal
      window.location.href = result.approveUrl;
    } else {
      toast.error("Failed to create deposit order. Please try again.");
    }
  };

  const handleSkipDeposit = () => {
    toast.info("You can add a deposit later from your dashboard to start bidding.");
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md bg-white border-border z-[100]">
        {step === "auth" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-foreground text-center text-xl">
                Welcome to Crown Auctions
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-center">
                Sign in to your account or create a new one
              </DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-muted">
                <TabsTrigger
                  value="signin"
                  className="data-[state=active]:bg-gold data-[state=active]:text-white"
                >
                  Sign In
                </TabsTrigger>
                <TabsTrigger
                  value="signup"
                  className="data-[state=active]:bg-gold data-[state=active]:text-white"
                >
                  Sign Up
                </TabsTrigger>
              </TabsList>
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="text-foreground">
                      Email
                    </Label>
                    <Input
                      id="signin-email"
                      name="email"
                      type="email"
                      placeholder="your@email.com"
                      required
                      className="bg-white border-border text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password" className="text-foreground">
                      Password
                    </Label>
                    <Input
                      id="signin-password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      required
                      className="bg-white border-border text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="gold"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name" className="text-foreground">
                      Full Name
                    </Label>
                    <Input
                      id="signup-name"
                      name="fullName"
                      type="text"
                      placeholder="John Doe"
                      required
                      className="bg-white border-border text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-foreground">
                      Email
                    </Label>
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      placeholder="your@email.com"
                      required
                      className="bg-white border-border text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-foreground">
                      Password
                    </Label>
                    <Input
                      id="signup-password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      required
                      className="bg-white border-border text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="gold"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </>
        )}

        {step === "deposit" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-foreground text-center text-xl">
                Bidding Deposit Required
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-center">
                A refundable $100 deposit is required to place bids
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 mt-4">
              <div className="p-4 bg-gold/10 border border-gold/30 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <CreditCard className="w-6 h-6 text-gold" />
                  <span className="font-semibold text-foreground">$100.00 USD</span>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Fully refundable if you don't win</li>
                  <li>• Applied to your winning bid</li>
                  <li>• Secure payment via PayPal</li>
                </ul>
              </div>
              
              <Button
                onClick={handlePayDeposit}
                variant="gold"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Pay with PayPal
                  </>
                )}
              </Button>
              
              <Button
                onClick={handleSkipDeposit}
                variant="ghost"
                className="w-full text-muted-foreground hover:text-foreground"
              >
                Skip for now
              </Button>
            </div>
          </>
        )}

        {step === "processing" && (
          <div className="py-8 text-center">
            <Loader2 className="w-12 h-12 text-gold mx-auto animate-spin mb-4" />
            <DialogTitle className="text-foreground text-xl mb-2">
              Processing Payment
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Please wait while we confirm your deposit...
            </DialogDescription>
          </div>
        )}

        {step === "success" && (
          <div className="py-8 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <DialogTitle className="text-foreground text-xl mb-2">
              Deposit Successful!
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              You can now place bids on any auction.
            </DialogDescription>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
