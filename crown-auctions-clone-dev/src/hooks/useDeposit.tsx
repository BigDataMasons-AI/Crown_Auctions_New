import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Deposit {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: string;
  paypal_order_id: string;
  created_at: string;
}

export const useDeposit = () => {
  const { user } = useAuth();
  const [hasDeposit, setHasDeposit] = useState(false);
  const [deposit, setDeposit] = useState<Deposit | null>(null);
  const [loading, setLoading] = useState(true);

  const checkDeposit = async () => {
    if (!user) {
      setHasDeposit(false);
      setDeposit(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("paypal-deposit", {
        body: { action: "check-deposit" },
      });

      if (error) throw error;
      
      setHasDeposit(data.hasDeposit);
      setDeposit(data.deposit);
    } catch (error) {
      console.error("Error checking deposit:", error);
      setHasDeposit(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkDeposit();
  }, [user]);

  const createDepositOrder = async (): Promise<{ orderId: string; approveUrl: string } | null> => {
    try {
      const { data, error } = await supabase.functions.invoke("paypal-deposit", {
        body: { action: "create-order" },
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error creating deposit order:", error);
      return null;
    }
  };

  const captureDeposit = async (orderId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke("paypal-deposit", {
        body: { action: "capture-order", orderId },
      });

      if (error) throw error;
      
      if (data.success) {
        await checkDeposit();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error capturing deposit:", error);
      return false;
    }
  };

  return {
    hasDeposit,
    deposit,
    loading,
    checkDeposit,
    createDepositOrder,
    captureDeposit,
  };
};
