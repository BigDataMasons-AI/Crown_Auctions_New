import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/hooks/useAdmin";
import { Link } from "react-router-dom";
import { User, ShieldCheck, Plus } from "lucide-react";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";
import { AboutModal } from "./AboutModal";
import { AuthDialog } from "./AuthDialog";

export const Navigation = () => {
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const { t } = useLanguage();
  const [aboutModalOpen, setAboutModalOpen] = useState(false);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2 rtl:space-x-reverse">
              <div className="w-8 h-8 bg-gold rounded-sm transform rotate-45 shadow-lg shadow-gold/30"></div>
              <h1 className="text-2xl font-bold tracking-tight text-gold">CROWN AUCTIONS</h1>
            </Link>
            
            <div className="hidden md:flex items-center space-x-6 rtl:space-x-reverse">
              <Link to="/" className="text-sm font-medium text-gold hover:text-gold-dark transition-colors">
                {t('nav.home')}
              </Link>
              <button 
                onClick={() => setAboutModalOpen(true)}
                className="text-sm font-medium text-gold hover:text-gold-dark transition-colors"
              >
                {t('nav.about')}
              </button>
              <a href="#auctions" className="text-sm font-medium text-gold hover:text-gold-dark transition-colors">
                {t('nav.browseAuctions')}
              </a>
              <LanguageSwitcher />
              {user ? (
                <div className="flex items-center gap-2 ml-4">
                  <Button variant="outline" size="sm" asChild className="border-gold text-gold hover:bg-gold hover:text-white">
                    <Link to="/submit-auction">
                      <Plus className="mr-2 h-4 w-4" />
                      SUBMIT ITEM
                    </Link>
                  </Button>
                  {isAdmin && (
                    <Button variant="outline" size="sm" asChild className="border-gold text-gold hover:bg-gold hover:text-white">
                      <Link to="/admin">
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        ADMIN
                      </Link>
                    </Button>
                  )}
                  <Button variant="gold" size="sm" asChild>
                    <Link to="/dashboard">
                      <User className="mr-2 h-4 w-4" />
                      DASHBOARD
                    </Link>
                  </Button>
                </div>
              ) : (
                <AuthDialog>
                  <Button variant="gold" size="sm" className="ml-4">SIGN IN</Button>
                </AuthDialog>
              )}
            </div>
          </div>
        </div>
      </nav>

      <AboutModal open={aboutModalOpen} onOpenChange={setAboutModalOpen} />
    </>
  );
};
