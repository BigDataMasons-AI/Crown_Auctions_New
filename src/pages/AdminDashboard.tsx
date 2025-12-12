import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/hooks/useAdmin';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Navigation } from '@/components/Navigation';
import { AuctionComparisonView } from '@/components/AuctionComparisonView';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2, Check, X, Clock, Eye, Play, Pause, Plus, Edit, Users, Inbox, Mail, Phone, Filter, Calendar, ChevronLeft, ChevronRight, ZoomIn, Search, Upload, FileText, CreditCard, DollarSign, RefreshCw, Image as ImageIcon } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { HeroImagesManager } from '@/components/admin/HeroImagesManager';

interface Auction {
  id: string;
  title: string;
  category: string;
  description: string;
  starting_price: number;
  current_bid: number;
  minimum_increment: number;
  approval_status: string;
  status: string;
  submitted_by: string;
  created_at: string;
  start_time: string;
  end_time: string;
  image_urls: string[];
  rejection_reason: string | null;
  original_submission_id: string | null;
  admin_comparison_comments: string | null;
  shipping_label_url: string | null;
  customer_id: string | null;
}

interface ItemInquiry {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  item_type: string;
  ring_setting: string | null;
  diamond_shape: string | null;
  carat_range: string | null;
  diamond_type: string | null;
  watch_brand: string | null;
  watch_model: string | null;
  necklace_brand: string | null;
  bracelet_brand: string | null;
  earring_brand: string | null;
  has_original_box: boolean;
  has_paperwork: boolean;
  image_count: number;
  image_urls: string[];
  status: string;
  admin_notes: string | null;
  created_at: string;
}

interface Deposit {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: string;
  paypal_order_id: string;
  paypal_capture_id: string | null;
  created_at: string;
  updated_at: string;
  refunded_at: string | null;
  user_email?: string;
  user_name?: string;
}

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [originalAuctions, setOriginalAuctions] = useState<Map<string, Auction>>(new Map());
  const [adminComments, setAdminComments] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [savingComments, setSavingComments] = useState<Set<string>>(new Set());
  const [appraiserApplications, setAppraiserApplications] = useState<any[]>([]);
  const [reviewNotes, setReviewNotes] = useState<{ [key: string]: string }>({});
  const [itemInquiries, setItemInquiries] = useState<ItemInquiry[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [processingDeposit, setProcessingDeposit] = useState<string | null>(null);
  
  // Inbox filter state
  const [inboxItemTypeFilter, setInboxItemTypeFilter] = useState<string>('all');
  const [inboxStatusFilter, setInboxStatusFilter] = useState<string>('all');
  const [inboxDateFrom, setInboxDateFrom] = useState<string>('');
  const [inboxDateTo, setInboxDateTo] = useState<string>('');
  const [inboxSearchQuery, setInboxSearchQuery] = useState<string>('');
  
  // Auction filter state
  const [auctionCustomerIdFilter, setAuctionCustomerIdFilter] = useState<string>('');
  
  // Image gallery modal state
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [showGallery, setShowGallery] = useState(false);
  
  // Inquiry detail modal state
  const [selectedInquiry, setSelectedInquiry] = useState<ItemInquiry | null>(null);
  const [showInquiryDetail, setShowInquiryDetail] = useState(false);
  const [inquiryAdminNotes, setInquiryAdminNotes] = useState('');
  const [savingInquiryNotes, setSavingInquiryNotes] = useState(false);
  
  // Shipping label approval modal state
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [approveAuction, setApproveAuction] = useState<Auction | null>(null);
  const [shippingLabelFile, setShippingLabelFile] = useState<File | null>(null);
  const [uploadingLabel, setUploadingLabel] = useState(false);

  const openGallery = (images: string[], startIndex: number = 0) => {
    setGalleryImages(images);
    setGalleryIndex(startIndex);
    setShowGallery(true);
  };

  const closeGallery = () => {
    setShowGallery(false);
    setGalleryImages([]);
    setGalleryIndex(0);
  };

  const nextImage = () => {
    setGalleryIndex((prev) => (prev + 1) % galleryImages.length);
  };

  const prevImage = () => {
    setGalleryIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  useEffect(() => {
    if (!authLoading && !adminLoading) {
      if (!user || !isAdmin) {
        toast.error('Access denied. Admin privileges required.');
        navigate('/');
      }
    }
  }, [user, isAdmin, authLoading, adminLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchAuctions();
      fetchAppraiserApplications();
      fetchItemInquiries();
      fetchDeposits();
      
      // Set up real-time subscription
      const channel = supabase
        .channel('admin-auctions')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'auctions'
          },
          () => {
            fetchAuctions();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isAdmin]);

  const fetchAppraiserApplications = async () => {
    try {
      const { data, error } = await supabase
        .from("appraiser_applications")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAppraiserApplications(data || []);
    } catch (error) {
      console.error("Error fetching appraiser applications:", error);
      toast.error("Failed to load appraiser applications");
    }
  };

  const fetchItemInquiries = async () => {
    try {
      const { data, error } = await supabase
        .from("item_inquiries")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setItemInquiries((data || []) as ItemInquiry[]);
    } catch (error) {
      console.error("Error fetching item inquiries:", error);
      toast.error("Failed to load item inquiries");
    }
  };

  const fetchDeposits = async () => {
    try {
      const { data: depositsData, error } = await supabase
        .from("user_deposits")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch user profiles for each deposit
      const depositsWithUsers = await Promise.all(
        (depositsData || []).map(async (deposit) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("email, full_name")
            .eq("id", deposit.user_id)
            .single();
          
          return {
            ...deposit,
            user_email: profile?.email || 'Unknown',
            user_name: profile?.full_name || 'Unknown User'
          };
        })
      );

      setDeposits(depositsWithUsers as Deposit[]);
    } catch (error) {
      console.error("Error fetching deposits:", error);
      toast.error("Failed to load deposits");
    }
  };

  const handleProcessRefund = async (depositId: string, action: 'approve' | 'reject') => {
    setProcessingDeposit(depositId);
    try {
      const deposit = deposits.find(d => d.id === depositId);
      if (!deposit) throw new Error("Deposit not found");

      if (action === 'approve') {
        // Call PayPal refund API via edge function
        const { data, error } = await supabase.functions.invoke("paypal-deposit", {
          body: { action: "process-refund", depositId },
        });

        if (error) throw error;
        
        if (data?.success) {
          toast.success(`Refund processed via PayPal (ID: ${data.refundId})`);
        } else {
          throw new Error(data?.error || "Refund failed");
        }
      } else {
        // Reject: just update status back to active
        const { error } = await supabase
          .from("user_deposits")
          .update({
            status: "active",
            updated_at: new Date().toISOString()
          })
          .eq("id", depositId);

        if (error) throw error;

        // Log the rejection transaction
        await supabase.from("deposit_transactions").insert({
          deposit_id: depositId,
          user_id: deposit.user_id,
          transaction_type: "refund_rejected",
          amount: deposit.amount,
          currency: deposit.currency,
          description: "Refund request rejected by admin",
        });

        toast.success('Refund request rejected');
      }

      // Send email notification to user
      try {
        await supabase.functions.invoke("send-refund-status-email", {
          body: {
            depositId,
            status: action === 'approve' ? 'approved' : 'rejected',
            amount: deposit.amount,
            currency: deposit.currency,
            language: language,
          },
        });
      } catch (emailError) {
        console.error("Failed to send refund status email:", emailError);
        // Don't fail the whole operation if email fails
      }
      
      fetchDeposits();
    } catch (error: any) {
      console.error("Error processing refund:", error);
      toast.error(error.message || "Failed to process refund");
    } finally {
      setProcessingDeposit(null);
    }
  };

  const refundRequestedDeposits = deposits.filter(d => d.status === 'refund_requested');

  const handleUpdateInquiryStatus = async (inquiryId: string, status: string) => {
    try {
      const { error } = await supabase
        .from("item_inquiries")
        .update({ status, reviewed_by: user?.id, reviewed_at: new Date().toISOString() })
        .eq("id", inquiryId);

      if (error) throw error;
      toast.success(`Inquiry marked as ${status}`);
      fetchItemInquiries();
    } catch (error) {
      console.error("Error updating inquiry:", error);
      toast.error("Failed to update inquiry");
    }
  };

  const handleReviewApplication = async (applicationId: string, status: "approved" | "rejected") => {
    setProcessing(true);
    try {
      const application = appraiserApplications.find(app => app.id === applicationId);
      if (!application) throw new Error("Application not found");

      const adminNotes = reviewNotes[applicationId] || "";
      
      const { error } = await supabase
        .from("appraiser_applications")
        .update({
          status,
          admin_notes: adminNotes,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", applicationId);

      if (error) throw error;

      // Send email notification
      const { error: emailError } = await supabase.functions.invoke('send-appraiser-status-email', {
        body: {
          applicantEmail: application.email,
          applicantName: application.full_name,
          status: status,
          adminNotes: adminNotes
        }
      });

      if (emailError) {
        console.error('Failed to send email notification:', emailError);
        toast.error('Application updated but email notification failed');
      } else {
        toast.success(`Application ${status === "approved" ? "approved" : "rejected"} and email sent`);
      }

      fetchAppraiserApplications();
    } catch (error: any) {
      console.error("Error reviewing application:", error);
      toast.error("Failed to review application");
    } finally {
      setProcessing(false);
    }
  };

  const fetchAuctions = async () => {
    try {
      const { data, error } = await supabase
        .from('auctions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAuctions(data || []);

      // Initialize admin comments map
      const commentsMap = new Map<string, string>();
      (data || []).forEach(auction => {
        if (auction.admin_comparison_comments) {
          commentsMap.set(auction.id, auction.admin_comparison_comments);
        }
      });
      setAdminComments(commentsMap);

      // Fetch original submissions for resubmissions
      const resubmissions = (data || []).filter(a => a.original_submission_id);
      if (resubmissions.length > 0) {
        const originalIds = resubmissions.map(a => a.original_submission_id).filter(Boolean);
        const { data: originals, error: originalsError } = await supabase
          .from('auctions')
          .select('*')
          .in('id', originalIds);

        if (!originalsError && originals) {
          const originalsMap = new Map(originals.map(o => [o.id, o]));
          setOriginalAuctions(originalsMap);
        }
      }
    } catch (error: any) {
      toast.error('Failed to load auctions');
      console.error('Error fetching auctions:', error);
    } finally {
      setLoading(false);
    }
  };

  const openApproveDialog = (auction: Auction) => {
    setApproveAuction(auction);
    setShippingLabelFile(null);
    setShowApproveDialog(true);
  };

  const handleApproveWithLabel = async () => {
    if (!approveAuction) return;
    if (!shippingLabelFile) {
      toast.error('Please upload a shipping label');
      return;
    }

    setUploadingLabel(true);
    try {
      // Upload shipping label to storage
      const fileExt = shippingLabelFile.name.split('.').pop();
      const filePath = `${approveAuction.id}/shipping-label.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('auction-images')
        .upload(filePath, shippingLabelFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('auction-images')
        .getPublicUrl(filePath);

      // Get user details
      const { data: profileData } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', approveAuction.submitted_by)
        .single();

      // Update auction status with shipping label
      const { error } = await supabase
        .from('auctions')
        .update({
          approval_status: 'approved',
          approved_by: user!.id,
          approved_at: new Date().toISOString(),
          status: 'active',
          shipping_label_url: publicUrl
        })
        .eq('id', approveAuction.id);

      if (error) throw error;

      // Log the admin action
      await supabase
        .from('admin_activity_log' as any)
        .insert({
          admin_user_id: user!.id,
          auction_id: approveAuction.id,
          action_type: 'approve',
          auction_title: approveAuction.title
        });

      // Send approval email
      if (profileData?.email) {
        const { error: emailError } = await supabase.functions.invoke('send-auction-status-email', {
          body: {
            auctionId: approveAuction.id,
            auctionTitle: approveAuction.title,
            status: 'approved',
            userEmail: profileData.email,
            userName: profileData.full_name
          }
        });

        if (emailError) {
          console.error('Failed to send approval email:', emailError);
        }
      }
      
      toast.success('Auction approved with shipping label');
      setShowApproveDialog(false);
      setApproveAuction(null);
      setShippingLabelFile(null);
      fetchAuctions();
    } catch (error: any) {
      toast.error('Failed to approve auction');
      console.error('Error approving auction:', error);
    } finally {
      setUploadingLabel(false);
    }
  };

  const handleReject = async () => {
    if (!selectedAuction || !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setProcessing(true);
    try {
      // Get user details
      const { data: profileData } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', selectedAuction.submitted_by)
        .single();

      // Update auction status
      const { error } = await supabase
        .from('auctions')
        .update({
          approval_status: 'rejected',
          approved_by: user!.id,
          approved_at: new Date().toISOString(),
          status: 'rejected',
          rejection_reason: rejectionReason
        })
        .eq('id', selectedAuction.id);

      if (error) throw error;

      // Log the admin action
      await supabase
        .from('admin_activity_log' as any)
        .insert({
          admin_user_id: user!.id,
          auction_id: selectedAuction.id,
          action_type: 'reject',
          auction_title: selectedAuction.title
        });

      // Send rejection email
      if (profileData?.email) {
        const { error: emailError } = await supabase.functions.invoke('send-auction-status-email', {
          body: {
            auctionId: selectedAuction.id,
            auctionTitle: selectedAuction.title,
            status: 'rejected',
            rejectionReason: rejectionReason,
            userEmail: profileData.email,
            userName: profileData.full_name
          }
        });

        if (emailError) {
          console.error('Failed to send rejection email:', emailError);
        }
      }
      
      toast.success('Auction rejected');
      setShowRejectDialog(false);
      setRejectionReason('');
      setSelectedAuction(null);
      fetchAuctions();
    } catch (error: any) {
      toast.error('Failed to reject auction');
      console.error('Error rejecting auction:', error);
    } finally {
      setProcessing(false);
    }
  };

  const openRejectDialog = (auction: Auction) => {
    setSelectedAuction(auction);
    setShowRejectDialog(true);
  };

  const handleAdminCommentChange = (auctionId: string, comment: string) => {
    setAdminComments(prev => {
      const newMap = new Map(prev);
      newMap.set(auctionId, comment);
      return newMap;
    });
  };

  const saveAdminComment = async (auctionId: string) => {
    setSavingComments(prev => new Set(prev).add(auctionId));
    
    try {
      const { error } = await supabase
        .from('auctions')
        .update({
          admin_comparison_comments: adminComments.get(auctionId) || null
        })
        .eq('id', auctionId);

      if (error) throw error;
      
      toast.success('Comment saved successfully');
    } catch (error: any) {
      console.error('Error saving admin comment:', error);
      toast.error('Failed to save comment');
    } finally {
      setSavingComments(prev => {
        const newSet = new Set(prev);
        newSet.delete(auctionId);
        return newSet;
      });
    }
  };

  const handleStartAuction = async (auctionId: string) => {
    setProcessing(true);
    try {
      const auction = auctions.find(a => a.id === auctionId);
      if (!auction) throw new Error('Auction not found');

      const { error } = await supabase
        .from('auctions')
        .update({ status: 'active' })
        .eq('id', auctionId);

      if (error) throw error;

      // Log the admin action
      await supabase
        .from('admin_activity_log' as any)
        .insert({
          admin_user_id: user!.id,
          auction_id: auctionId,
          action_type: 'start',
          auction_title: auction.title
        });
      
      toast.success('Auction started! Bidding is now enabled.');
      fetchAuctions();
    } catch (error: any) {
      toast.error('Failed to start auction');
      console.error('Error starting auction:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handlePauseAuction = async (auctionId: string) => {
    setProcessing(true);
    try {
      const auction = auctions.find(a => a.id === auctionId);
      if (!auction) throw new Error('Auction not found');

      const { error } = await supabase
        .from('auctions')
        .update({ status: 'paused' })
        .eq('id', auctionId);

      if (error) throw error;

      // Log the admin action
      await supabase
        .from('admin_activity_log' as any)
        .insert({
          admin_user_id: user!.id,
          auction_id: auctionId,
          action_type: 'pause',
          auction_title: auction.title
        });
      
      toast.success('Auction paused. Bidding is now disabled.');
      fetchAuctions();
    } catch (error: any) {
      toast.error('Failed to pause auction');
      console.error('Error pausing auction:', error);
    } finally {
      setProcessing(false);
    }
  };

  if (authLoading || adminLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  if (!isAdmin) return null;

  // Filter auctions by customer ID
  const filterByCustomerId = (auctionList: Auction[]) => {
    if (!auctionCustomerIdFilter.trim()) return auctionList;
    const searchTerm = auctionCustomerIdFilter.toLowerCase().trim();
    return auctionList.filter(a => 
      a.customer_id?.toLowerCase().includes(searchTerm)
    );
  };

  const pendingAuctions = filterByCustomerId(auctions.filter(a => a.approval_status === 'pending'));
  const approvedAuctions = filterByCustomerId(auctions.filter(a => a.approval_status === 'approved'));
  const rejectedAuctions = filterByCustomerId(auctions.filter(a => a.approval_status === 'rejected'));
  const scheduledAuctions = filterByCustomerId(auctions.filter(a => 
    a.approval_status === 'approved' && 
    a.status === 'pending' && 
    new Date(a.start_time) > new Date()
  ));

  const AuctionCard = ({ auction }: { auction: Auction }) => {
    const isScheduled = auction.approval_status === 'approved' && 
                        auction.status === 'pending' && 
                        new Date(auction.start_time) > new Date();
    
    const formatPrice = (price: number) => {
      return language === 'ar' 
        ? price.toLocaleString('ar-QA', { style: 'currency', currency: 'QAR', maximumFractionDigits: 0 })
        : `$${price.toLocaleString()}`;
    };
    
    return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <CardTitle className="text-xl">{auction.title}</CardTitle>
              <Badge variant={
                auction.approval_status === 'approved' ? 'default' : 
                auction.approval_status === 'rejected' ? 'destructive' : 
                'secondary'
              }>
                {auction.approval_status === 'approved' ? t('admin.approved') :
                 auction.approval_status === 'rejected' ? t('admin.rejected') :
                 t('admin.pending')}
              </Badge>
              {isScheduled && (
                <Badge variant="outline" className="bg-blue-600/10 text-blue-600 border-blue-600/30">
                  🕐 {t('admin.scheduled')}
                </Badge>
              )}
              {auction.approval_status === 'approved' && !isScheduled && (
                <Badge variant={
                  auction.status === 'active' ? 'default' : 
                  auction.status === 'paused' ? 'secondary' : 
                  'outline'
                }
                className={
                  auction.status === 'active' ? 'bg-green-600 hover:bg-green-700' :
                  auction.status === 'paused' ? 'bg-yellow-600 hover:bg-yellow-700' :
                  ''
                }>
                  {auction.status === 'active' ? `🟢 ${t('admin.live')}` : 
                   auction.status === 'paused' ? `⏸️ ${t('auction.paused')}` : 
                   auction.status}
                </Badge>
              )}
              {auction.original_submission_id && (
                <Badge variant="outline" className="bg-gold/10 text-gold border-gold/30">
                  {t('admin.resubmission')}
                </Badge>
              )}
            </div>
            <div className="space-y-1 text-sm text-muted-foreground">
              {auction.customer_id && (
                <p className="font-medium text-primary">
                  {t('admin.customerId') || 'Customer ID'}: {auction.customer_id}
                </p>
              )}
              <p>{t('admin.category')}: {auction.category}</p>
              <p>{t('admin.startingPrice')}: {formatPrice(Number(auction.starting_price))}</p>
              <p>{t('admin.currentBid')}: {formatPrice(Number(auction.current_bid))}</p>
              {isScheduled ? (
                <p className="text-blue-600 font-medium">
                  {t('admin.scheduledStart')}: {new Date(auction.start_time).toLocaleString(language === 'ar' ? 'ar-QA' : 'en-US')}
                </p>
              ) : (
                <p>{t('admin.submitted')}: {new Date(auction.created_at).toLocaleDateString(language === 'ar' ? 'ar-QA' : 'en-US')}</p>
              )}
            </div>
          </div>
          {auction.image_urls && auction.image_urls.length > 0 && (
            <img 
              src={auction.image_urls[0]} 
              alt={auction.title}
              className="w-24 h-24 object-cover rounded-lg"
            />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {auction.description}
        </p>
        {auction.rejection_reason && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm font-medium text-destructive mb-1">{t('admin.rejectionReason')}:</p>
            <p className="text-sm text-muted-foreground">{auction.rejection_reason}</p>
          </div>
        )}
        {auction.original_submission_id && originalAuctions.get(auction.original_submission_id) && (
          <div className="mb-4">
            <AuctionComparisonView
              original={originalAuctions.get(auction.original_submission_id)!}
              resubmitted={auction}
              adminComments={adminComments.get(auction.id)}
              onAdminCommentChange={(comment) => handleAdminCommentChange(auction.id, comment)}
              isAdmin={true}
            />
            <div className="mt-3 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => saveAdminComment(auction.id)}
                disabled={savingComments.has(auction.id)}
              >
                {savingComments.has(auction.id) ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('admin.saving')}
                  </>
                ) : (
                  t('admin.saveComment')
                )}
              </Button>
            </div>
          </div>
        )}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/auction/${auction.id}`)}
          >
            <Eye className="h-4 w-4 mr-2" />
            {t('admin.viewDetails')}
          </Button>
          {isScheduled && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/admin/edit-auction/${auction.id}`)}
              className="border-blue-600 text-blue-600 hover:bg-blue-50"
            >
              <Edit className="h-4 w-4 mr-2" />
              {t('admin.edit')}
            </Button>
          )}
          {auction.approval_status === 'pending' && (
            <>
              <Button
                variant="default"
                size="sm"
                onClick={() => openApproveDialog(auction)}
                disabled={processing}
                className="bg-gold hover:bg-gold/90"
              >
                <Check className="h-4 w-4 mr-2" />
                {t('admin.approve')}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => openRejectDialog(auction)}
                disabled={processing}
              >
                <X className="h-4 w-4 mr-2" />
                {t('admin.reject')}
              </Button>
            </>
          )}
          {auction.approval_status === 'approved' && (
            <>
              {auction.status === 'active' ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePauseAuction(auction.id)}
                  disabled={processing}
                  className="border-yellow-600 text-yellow-600 hover:bg-yellow-50"
                >
                  <Pause className="h-4 w-4 mr-2" />
                  {t('admin.pauseAuction')}
                </Button>
              ) : auction.status === 'paused' ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStartAuction(auction.id)}
                  disabled={processing}
                  className="border-green-600 text-green-600 hover:bg-green-50"
                >
                  <Play className="h-4 w-4 mr-2" />
                  {t('admin.resumeAuction')}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStartAuction(auction.id)}
                  disabled={processing}
                  className="border-green-600 text-green-600 hover:bg-green-50"
                >
                  <Play className="h-4 w-4 mr-2" />
                  {t('admin.startAuction')}
                </Button>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-24">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">{t('admin.title')}</h1>
              <p className="text-muted-foreground">{t('admin.subtitle')}</p>
            </div>
            <Button
              onClick={() => navigate('/admin/create-auction')}
              className="bg-gold hover:bg-gold/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('admin.createAuction')}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('admin.pendingReview')}</p>
                    <p className="text-3xl font-bold">{pendingAuctions.length}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('admin.approved')}</p>
                    <p className="text-3xl font-bold">{approvedAuctions.length}</p>
                  </div>
                  <Check className="h-8 w-8 text-gold" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('admin.scheduled')}</p>
                    <p className="text-3xl font-bold">{scheduledAuctions.length}</p>
                  </div>
                  <Clock className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Inbox/Inquiry</p>
                    <p className="text-3xl font-bold">{itemInquiries.filter(i => i.status === 'pending').length}</p>
                  </div>
                  <Inbox className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('admin.rejected')}</p>
                    <p className="text-3xl font-bold">{rejectedAuctions.length}</p>
                  </div>
                  <X className="h-8 w-8 text-destructive" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Customer ID Search Filter */}
          <Card className="mb-4">
            <CardContent className="py-4">
              <div className="flex items-center gap-4">
                <div className="flex-1 max-w-[350px]">
                  <Label className="text-xs text-muted-foreground mb-1 block">
                    {t('admin.searchByCustomerId') || 'Search by Customer ID'}
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder={t('admin.customerIdPlaceholder') || 'Enter customer ID...'}
                      value={auctionCustomerIdFilter}
                      onChange={(e) => setAuctionCustomerIdFilter(e.target.value)}
                      className="h-9 pl-8"
                      maxLength={50}
                    />
                  </div>
                </div>
                {auctionCustomerIdFilter && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setAuctionCustomerIdFilter('')}
                    className="text-muted-foreground hover:text-foreground mt-5"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid w-full grid-cols-8">
              <TabsTrigger value="pending">
                {t('admin.pending')} ({pendingAuctions.length})
              </TabsTrigger>
              <TabsTrigger value="inbox">
                Inbox/Inquiry ({itemInquiries.filter(i => i.status === 'pending').length})
              </TabsTrigger>
              <TabsTrigger value="scheduled">
                {t('admin.scheduled')} ({scheduledAuctions.length})
              </TabsTrigger>
              <TabsTrigger value="approved">
                {t('admin.approved')} ({approvedAuctions.length})
              </TabsTrigger>
              <TabsTrigger value="appraisers">
                {t('admin.appraisers')} ({appraiserApplications.length})
              </TabsTrigger>
              <TabsTrigger value="rejected">
                {t('admin.rejected')} ({rejectedAuctions.length})
              </TabsTrigger>
              <TabsTrigger value="deposits">
                <CreditCard className="h-4 w-4 mr-1" />
                Deposits ({refundRequestedDeposits.length})
              </TabsTrigger>
              <TabsTrigger value="hero-images">
                <ImageIcon className="h-4 w-4 mr-1" />
                Hero Images
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="mt-6">
              <div className="grid gap-4">
                {pendingAuctions.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">{t('admin.noPending')}</p>
                    </CardContent>
                  </Card>
                ) : (
                  pendingAuctions.map((auction) => (
                    <AuctionCard key={auction.id} auction={auction} />
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="inbox" className="mt-6">
              {/* Filters */}
              <Card className="mb-4">
                <CardContent className="py-4">
                  <div className="flex flex-wrap items-end gap-4">
                    {/* Search */}
                    <div className="flex-1 min-w-[200px] max-w-[300px]">
                      <Label className="text-xs text-muted-foreground mb-1 block">Search Customer</Label>
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder="Name, email or phone..."
                          value={inboxSearchQuery}
                          onChange={(e) => setInboxSearchQuery(e.target.value)}
                          className="h-9 pl-8"
                          maxLength={100}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Filter className="h-4 w-4" />
                      <span className="font-medium">Filters:</span>
                    </div>
                    
                    <div className="flex-1 min-w-[150px] max-w-[200px]">
                      <Label className="text-xs text-muted-foreground mb-1 block">Item Type</Label>
                      <Select value={inboxItemTypeFilter} onValueChange={setInboxItemTypeFilter}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="All Types" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          <SelectItem value="ring">Ring</SelectItem>
                          <SelectItem value="loose-diamond">Loose Diamond</SelectItem>
                          <SelectItem value="watch">Watch</SelectItem>
                          <SelectItem value="necklace">Necklace</SelectItem>
                          <SelectItem value="bracelet">Bracelet</SelectItem>
                          <SelectItem value="earrings">Earrings</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex-1 min-w-[150px] max-w-[200px]">
                      <Label className="text-xs text-muted-foreground mb-1 block">Status</Label>
                      <Select value={inboxStatusFilter} onValueChange={setInboxStatusFilter}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="contacted">Contacted</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="dismissed">Dismissed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex-1 min-w-[130px] max-w-[180px]">
                      <Label className="text-xs text-muted-foreground mb-1 block">From Date</Label>
                      <div className="relative">
                        <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="date"
                          value={inboxDateFrom}
                          onChange={(e) => setInboxDateFrom(e.target.value)}
                          className="h-9 pl-8"
                        />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-[130px] max-w-[180px]">
                      <Label className="text-xs text-muted-foreground mb-1 block">To Date</Label>
                      <div className="relative">
                        <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="date"
                          value={inboxDateTo}
                          onChange={(e) => setInboxDateTo(e.target.value)}
                          className="h-9 pl-8"
                        />
                      </div>
                    </div>
                    
                    {(inboxItemTypeFilter !== 'all' || inboxStatusFilter !== 'all' || inboxDateFrom || inboxDateTo || inboxSearchQuery) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setInboxItemTypeFilter('all');
                          setInboxStatusFilter('all');
                          setInboxDateFrom('');
                          setInboxDateTo('');
                          setInboxSearchQuery('');
                        }}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Clear
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid gap-4">
                {(() => {
                  const filteredInquiries = itemInquiries.filter((inquiry) => {
                    // Search filter (name, email, phone)
                    if (inboxSearchQuery.trim()) {
                      const query = inboxSearchQuery.toLowerCase().trim();
                      const fullName = `${inquiry.first_name} ${inquiry.last_name}`.toLowerCase();
                      const email = inquiry.email.toLowerCase();
                      const phone = inquiry.phone.toLowerCase();
                      if (!fullName.includes(query) && !email.includes(query) && !phone.includes(query)) {
                        return false;
                      }
                    }
                    // Item type filter
                    if (inboxItemTypeFilter !== 'all' && inquiry.item_type !== inboxItemTypeFilter) {
                      return false;
                    }
                    // Status filter
                    if (inboxStatusFilter !== 'all' && inquiry.status !== inboxStatusFilter) {
                      return false;
                    }
                    // Date from filter
                    if (inboxDateFrom) {
                      const inquiryDate = new Date(inquiry.created_at).toISOString().split('T')[0];
                      if (inquiryDate < inboxDateFrom) return false;
                    }
                    // Date to filter
                    if (inboxDateTo) {
                      const inquiryDate = new Date(inquiry.created_at).toISOString().split('T')[0];
                      if (inquiryDate > inboxDateTo) return false;
                    }
                    return true;
                  });
                  
                  if (filteredInquiries.length === 0) {
                    return (
                      <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                          <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
                          <p className="text-muted-foreground">
                            {itemInquiries.length === 0 ? 'No item inquiries yet' : 'No inquiries match the current filters'}
                          </p>
                        </CardContent>
                      </Card>
                    );
                  }
                  
                  return filteredInquiries.map((inquiry) => (
                    <Card key={inquiry.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          {/* Customer Images */}
                          {inquiry.image_urls && inquiry.image_urls.length > 0 && (
                            <div className="flex-shrink-0">
                              <div 
                                className="grid grid-cols-2 gap-2 w-32 cursor-pointer group"
                                onClick={() => openGallery(inquiry.image_urls, 0)}
                              >
                                {inquiry.image_urls.slice(0, 4).map((url, index) => (
                                  <div key={index} className="relative aspect-square">
                                    <img
                                      src={url}
                                      alt={`Item image ${index + 1}`}
                                      className="w-full h-full object-cover rounded-lg border border-border/50 transition-opacity group-hover:opacity-80"
                                    />
                                    {index === 0 && (
                                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 rounded-lg flex items-center justify-center transition-all opacity-0 group-hover:opacity-100">
                                        <ZoomIn className="h-5 w-5 text-white" />
                                      </div>
                                    )}
                                    {index === 3 && inquiry.image_urls.length > 4 && (
                                      <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center text-white text-xs font-medium">
                                        +{inquiry.image_urls.length - 4}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <CardTitle className="text-xl capitalize">{inquiry.item_type}</CardTitle>
                              <Badge variant={
                                inquiry.status === 'pending' ? 'secondary' :
                                inquiry.status === 'contacted' ? 'default' :
                                inquiry.status === 'completed' ? 'outline' :
                                'destructive'
                              }>
                                {inquiry.status}
                              </Badge>
                            </div>
                            <div className="space-y-1 text-sm text-muted-foreground">
                              <p className="font-medium text-foreground">{inquiry.first_name} {inquiry.last_name}</p>
                              <p className="flex items-center gap-1"><Mail className="h-3 w-3" /> {inquiry.email}</p>
                              <p className="flex items-center gap-1"><Phone className="h-3 w-3" /> {inquiry.phone}</p>
                              <p>Submitted: {new Date(inquiry.created_at).toLocaleString(language === 'ar' ? 'ar-QA' : 'en-US')}</p>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                          {inquiry.ring_setting && (
                            <div className="bg-muted/50 rounded px-2 py-1 text-sm">
                              <span className="text-muted-foreground">Setting:</span> {inquiry.ring_setting}
                            </div>
                          )}
                          {inquiry.diamond_shape && (
                            <div className="bg-muted/50 rounded px-2 py-1 text-sm">
                              <span className="text-muted-foreground">Shape:</span> {inquiry.diamond_shape}
                            </div>
                          )}
                          {inquiry.carat_range && (
                            <div className="bg-muted/50 rounded px-2 py-1 text-sm">
                              <span className="text-muted-foreground">Carat:</span> {inquiry.carat_range}
                            </div>
                          )}
                          {inquiry.diamond_type && (
                            <div className="bg-muted/50 rounded px-2 py-1 text-sm">
                              <span className="text-muted-foreground">Type:</span> {inquiry.diamond_type}
                            </div>
                          )}
                          {inquiry.watch_brand && (
                            <div className="bg-muted/50 rounded px-2 py-1 text-sm">
                              <span className="text-muted-foreground">Brand:</span> {inquiry.watch_brand}
                            </div>
                          )}
                          {inquiry.watch_model && (
                            <div className="bg-muted/50 rounded px-2 py-1 text-sm">
                              <span className="text-muted-foreground">Model:</span> {inquiry.watch_model}
                            </div>
                          )}
                          {inquiry.necklace_brand && (
                            <div className="bg-muted/50 rounded px-2 py-1 text-sm">
                              <span className="text-muted-foreground">Brand:</span> {inquiry.necklace_brand}
                            </div>
                          )}
                          {inquiry.bracelet_brand && (
                            <div className="bg-muted/50 rounded px-2 py-1 text-sm">
                              <span className="text-muted-foreground">Brand:</span> {inquiry.bracelet_brand}
                            </div>
                          )}
                          {inquiry.earring_brand && (
                            <div className="bg-muted/50 rounded px-2 py-1 text-sm">
                              <span className="text-muted-foreground">Brand:</span> {inquiry.earring_brand}
                            </div>
                          )}
                          {(inquiry.item_type === 'watch' || inquiry.item_type === 'necklace' || inquiry.item_type === 'bracelet' || inquiry.item_type === 'earrings') && (
                            <>
                              <div className="bg-muted/50 rounded px-2 py-1 text-sm">
                                <span className="text-muted-foreground">Box:</span> {inquiry.has_original_box ? '✓ Yes' : '✗ No'}
                              </div>
                              <div className="bg-muted/50 rounded px-2 py-1 text-sm">
                                <span className="text-muted-foreground">Papers:</span> {inquiry.has_paperwork ? '✓ Yes' : '✗ No'}
                              </div>
                            </>
                          )}
                          <div className="bg-muted/50 rounded px-2 py-1 text-sm">
                            <span className="text-muted-foreground">Images:</span> {inquiry.image_count}
                          </div>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {inquiry.status === 'pending' && (
                            <>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleUpdateInquiryStatus(inquiry.id, 'contacted')}
                                className="bg-gold hover:bg-gold/90"
                              >
                                <Check className="h-4 w-4 mr-2" />
                                Mark Contacted
                              </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUpdateInquiryStatus(inquiry.id, 'dismissed')}
                              >
                                <X className="h-4 w-4 mr-2" />
                                Dismiss
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => {
                                  setSelectedInquiry(inquiry);
                                  setInquiryAdminNotes(inquiry.admin_notes || '');
                                  setShowInquiryDetail(true);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </Button>
                            </>
                          )}
                          {inquiry.status === 'contacted' && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleUpdateInquiryStatus(inquiry.id, 'completed')}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Check className="h-4 w-4 mr-2" />
                              Mark Completed
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ));
                })()}
              </div>
            </TabsContent>

            <TabsContent value="scheduled" className="mt-6">
              <div className="grid gap-4">
                {scheduledAuctions.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">{t('admin.noScheduled')}</p>
                    </CardContent>
                  </Card>
                ) : (
                  scheduledAuctions.map((auction) => (
                    <AuctionCard key={auction.id} auction={auction} />
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="approved" className="mt-6">
              <div className="grid gap-4">
                {approvedAuctions.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Check className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">{t('admin.noApproved')}</p>
                    </CardContent>
                  </Card>
                ) : (
                  approvedAuctions.map((auction) => (
                    <AuctionCard key={auction.id} auction={auction} />
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="appraisers" className="mt-6">
              <div className="grid gap-4">
                {appraiserApplications.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Users className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">{t('admin.noAppraisers')}</p>
                    </CardContent>
                  </Card>
                ) : (
                  appraiserApplications.map((application) => (
                    <Card key={application.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle>{application.full_name}</CardTitle>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge
                                variant={
                                  application.status === "approved"
                                    ? "default"
                                    : application.status === "rejected"
                                    ? "destructive"
                                    : "secondary"
                                }
                              >
                                {application.status === 'approved' ? t('admin.approved') :
                                 application.status === 'rejected' ? t('admin.rejected') :
                                 t('admin.pending')}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium">{t('admin.appraiser.email')}:</span> {application.email}
                            </div>
                            <div>
                              <span className="font-medium">{t('admin.appraiser.phone')}:</span> {application.phone}
                            </div>
                            <div>
                              <span className="font-medium">{t('admin.appraiser.experience')}:</span> {application.years_of_experience} {t('admin.appraiser.years')}
                            </div>
                            <div>
                              <span className="font-medium">{t('admin.appraiser.applied')}:</span>{" "}
                              {new Date(application.created_at).toLocaleDateString(language === 'ar' ? 'ar-QA' : 'en-US')}
                            </div>
                          </div>

                          <div>
                            <span className="font-medium text-sm">{t('admin.appraiser.specializations')}:</span>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {application.specializations.map((spec: string) => (
                                <Badge key={spec} variant="outline">
                                  {spec}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div>
                            <span className="font-medium text-sm">{t('admin.appraiser.certifications')}:</span>
                            <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                              {application.certifications}
                            </p>
                          </div>

                          {application.previous_employers && (
                            <div>
                              <span className="font-medium text-sm">{t('admin.appraiser.previousEmployers')}:</span>
                              <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                                {application.previous_employers}
                              </p>
                            </div>
                          )}

                          {application.professional_references && (
                            <div>
                              <span className="font-medium text-sm">{t('admin.appraiser.references')}:</span>
                              <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                                {application.professional_references}
                              </p>
                            </div>
                          )}

                          <div>
                            <span className="font-medium text-sm">{t('admin.appraiser.coverLetter')}:</span>
                            <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                              {application.cover_letter}
                            </p>
                          </div>

                          {application.status === "pending" && (
                            <div className="space-y-3 pt-4 border-t">
                              <div>
                                <Label htmlFor={`notes-${application.id}`}>{t('admin.appraiser.adminNotes')}</Label>
                                <Textarea
                                  id={`notes-${application.id}`}
                                  placeholder={t('admin.appraiser.notesPlaceholder')}
                                  value={reviewNotes[application.id] || ""}
                                  onChange={(e) =>
                                    setReviewNotes({
                                      ...reviewNotes,
                                      [application.id]: e.target.value,
                                    })
                                  }
                                  rows={2}
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => handleReviewApplication(application.id, "approved")}
                                  disabled={processing}
                                  className="flex-1 bg-gold hover:bg-gold/90"
                                >
                                  <Check className="h-4 w-4 mr-2" />
                                  {t('admin.approve')}
                                </Button>
                                <Button
                                  onClick={() => handleReviewApplication(application.id, "rejected")}
                                  disabled={processing}
                                  variant="destructive"
                                  className="flex-1"
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  {t('admin.reject')}
                                </Button>
                              </div>
                            </div>
                          )}

                          {application.status !== "pending" && application.admin_notes && (
                            <div className="pt-4 border-t">
                              <span className="font-medium text-sm">{t('admin.appraiser.adminNotes')}:</span>
                              <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                                {application.admin_notes}
                              </p>
                              <p className="text-xs text-muted-foreground mt-2">
                                {t('admin.appraiser.reviewedOn')} {new Date(application.reviewed_at).toLocaleDateString(language === 'ar' ? 'ar-QA' : 'en-US')}
                              </p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="rejected" className="mt-6">
              <div className="grid gap-4">
                {rejectedAuctions.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <X className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">{t('admin.noRejected')}</p>
                    </CardContent>
                  </Card>
                ) : (
                  rejectedAuctions.map((auction) => (
                    <AuctionCard key={auction.id} auction={auction} />
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="deposits" className="mt-6">
              <div className="space-y-6">
                {/* Refund Requests Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <RefreshCw className="h-5 w-5 text-yellow-500" />
                    Pending Refund Requests ({refundRequestedDeposits.length})
                  </h3>
                  
                  {refundRequestedDeposits.length === 0 ? (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No pending refund requests</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-4">
                      {refundRequestedDeposits.map((deposit) => (
                        <Card key={deposit.id} className="border-yellow-500/50">
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
                                    Refund Requested
                                  </Badge>
                                </div>
                                <h4 className="font-semibold">{deposit.user_name}</h4>
                                <p className="text-sm text-muted-foreground">{deposit.user_email}</p>
                                <div className="flex items-center gap-4 text-sm">
                                  <span className="flex items-center gap-1">
                                    <DollarSign className="h-4 w-4" />
                                    {deposit.amount} {deposit.currency}
                                  </span>
                                  <span className="text-muted-foreground">
                                    Deposited: {new Date(deposit.created_at).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  Order ID: {deposit.paypal_order_id}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  className="bg-gold hover:bg-gold/90"
                                  disabled={processingDeposit === deposit.id}
                                  onClick={() => handleProcessRefund(deposit.id, 'approve')}
                                >
                                  {processingDeposit === deposit.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <>
                                      <Check className="h-4 w-4 mr-1" />
                                      Approve Refund
                                    </>
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={processingDeposit === deposit.id}
                                  onClick={() => handleProcessRefund(deposit.id, 'reject')}
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                {/* All Deposits Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    All Deposits ({deposits.length})
                  </h3>
                  
                  {deposits.length === 0 ? (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No deposits found</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardContent className="pt-6">
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-2 px-3 font-medium">User</th>
                                <th className="text-left py-2 px-3 font-medium">Amount</th>
                                <th className="text-left py-2 px-3 font-medium">Status</th>
                                <th className="text-left py-2 px-3 font-medium">Date</th>
                                <th className="text-left py-2 px-3 font-medium">PayPal Order</th>
                              </tr>
                            </thead>
                            <tbody>
                              {deposits.map((deposit) => (
                                <tr key={deposit.id} className="border-b last:border-0">
                                  <td className="py-3 px-3">
                                    <div>
                                      <p className="font-medium">{deposit.user_name}</p>
                                      <p className="text-xs text-muted-foreground">{deposit.user_email}</p>
                                    </div>
                                  </td>
                                  <td className="py-3 px-3">
                                    ${deposit.amount} {deposit.currency}
                                  </td>
                                  <td className="py-3 px-3">
                                    <Badge 
                                      variant="outline" 
                                      className={
                                        deposit.status === 'completed' 
                                          ? 'bg-green-500/10 text-green-600 border-green-500/30' 
                                          : deposit.status === 'refund_requested'
                                          ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30'
                                          : deposit.status === 'refunded'
                                          ? 'bg-blue-500/10 text-blue-600 border-blue-500/30'
                                          : 'bg-gray-500/10 text-gray-600 border-gray-500/30'
                                      }
                                    >
                                      {deposit.status === 'completed' ? 'Active' : 
                                       deposit.status === 'refund_requested' ? 'Refund Requested' :
                                       deposit.status === 'refunded' ? 'Refunded' : deposit.status}
                                    </Badge>
                                  </td>
                                  <td className="py-3 px-3 text-muted-foreground">
                                    {new Date(deposit.created_at).toLocaleDateString()}
                                  </td>
                                  <td className="py-3 px-3">
                                    <code className="text-xs bg-muted px-1 py-0.5 rounded">
                                      {deposit.paypal_order_id.slice(0, 12)}...
                                    </code>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="hero-images" className="mt-6">
              <HeroImagesManager />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.rejectDialog.title')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              {t('admin.rejectDialog.description')}
            </p>
            <Textarea
              placeholder={t('admin.rejectDialog.placeholder')}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setRejectionReason('');
                setSelectedAuction(null);
              }}
            >
              {t('admin.rejectDialog.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={processing || !rejectionReason.trim()}
            >
              {processing ? t('admin.rejectDialog.rejecting') : t('admin.rejectDialog.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Gallery Modal */}
      <Dialog open={showGallery} onOpenChange={setShowGallery}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none">
          <div className="relative w-full h-[90vh] flex items-center justify-center">
            {/* Close button */}
            <button
              onClick={closeGallery}
              className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X className="h-6 w-6 text-white" />
            </button>

            {/* Image counter */}
            <div className="absolute top-4 left-4 z-50 px-3 py-1.5 rounded-full bg-white/10 text-white text-sm font-medium">
              {galleryIndex + 1} / {galleryImages.length}
            </div>

            {/* Previous button */}
            {galleryImages.length > 1 && (
              <button
                onClick={prevImage}
                className="absolute left-4 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <ChevronLeft className="h-8 w-8 text-white" />
              </button>
            )}

            {/* Main image */}
            {galleryImages[galleryIndex] && (
              <img
                src={galleryImages[galleryIndex]}
                alt={`Gallery image ${galleryIndex + 1}`}
                className="max-w-full max-h-full object-contain"
              />
            )}

            {/* Next button */}
            {galleryImages.length > 1 && (
              <button
                onClick={nextImage}
                className="absolute right-4 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <ChevronRight className="h-8 w-8 text-white" />
              </button>
            )}

            {/* Thumbnail strip */}
            {galleryImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 p-2 bg-white/10 rounded-lg">
                {galleryImages.map((url, index) => (
                  <button
                    key={index}
                    onClick={() => setGalleryIndex(index)}
                    className={`w-12 h-12 rounded-md overflow-hidden border-2 transition-all ${
                      index === galleryIndex ? 'border-white scale-110' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={url}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Inquiry Detail Modal */}
      <Dialog open={showInquiryDetail} onOpenChange={setShowInquiryDetail}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 capitalize">
              <Eye className="h-5 w-5" />
              {selectedInquiry?.item_type} Inquiry Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedInquiry && (
            <div className="space-y-6 py-4">
              {/* Customer Images */}
              {selectedInquiry.image_urls && selectedInquiry.image_urls.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3 text-sm text-muted-foreground uppercase tracking-wide">Submitted Images</h4>
                  <div 
                    className="grid grid-cols-3 gap-3 cursor-pointer"
                    onClick={() => openGallery(selectedInquiry.image_urls, 0)}
                  >
                    {selectedInquiry.image_urls.map((url, index) => (
                      <div key={index} className="relative aspect-square group">
                        <img
                          src={url}
                          alt={`Item image ${index + 1}`}
                          className="w-full h-full object-cover rounded-lg border border-border/50 transition-opacity group-hover:opacity-80"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 rounded-lg flex items-center justify-center transition-all opacity-0 group-hover:opacity-100">
                          <ZoomIn className="h-6 w-6 text-white" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact Information */}
              <div>
                <h4 className="font-medium mb-3 text-sm text-muted-foreground uppercase tracking-wide">Contact Information</h4>
                <div className="grid grid-cols-2 gap-4 bg-muted/30 rounded-lg p-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Full Name</span>
                    <p className="font-medium">{selectedInquiry.first_name} {selectedInquiry.last_name}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Email</span>
                    <p className="font-medium flex items-center gap-1">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {selectedInquiry.email}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Phone</span>
                    <p className="font-medium flex items-center gap-1">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      {selectedInquiry.phone}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Submitted</span>
                    <p className="font-medium">
                      {new Date(selectedInquiry.created_at).toLocaleString(language === 'ar' ? 'ar-QA' : 'en-US')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Item Details */}
              <div>
                <h4 className="font-medium mb-3 text-sm text-muted-foreground uppercase tracking-wide">Item Details</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/30 rounded-lg px-4 py-3">
                    <span className="text-sm text-muted-foreground">Item Type</span>
                    <p className="font-medium capitalize">{selectedInquiry.item_type}</p>
                  </div>
                  
                  {selectedInquiry.ring_setting && (
                    <div className="bg-muted/30 rounded-lg px-4 py-3">
                      <span className="text-sm text-muted-foreground">Ring Setting</span>
                      <p className="font-medium">{selectedInquiry.ring_setting}</p>
                    </div>
                  )}
                  
                  {selectedInquiry.diamond_shape && (
                    <div className="bg-muted/30 rounded-lg px-4 py-3">
                      <span className="text-sm text-muted-foreground">Diamond Shape</span>
                      <p className="font-medium">{selectedInquiry.diamond_shape}</p>
                    </div>
                  )}
                  
                  {selectedInquiry.carat_range && (
                    <div className="bg-muted/30 rounded-lg px-4 py-3">
                      <span className="text-sm text-muted-foreground">Carat Range</span>
                      <p className="font-medium">{selectedInquiry.carat_range}</p>
                    </div>
                  )}
                  
                  {selectedInquiry.diamond_type && (
                    <div className="bg-muted/30 rounded-lg px-4 py-3">
                      <span className="text-sm text-muted-foreground">Diamond Type</span>
                      <p className="font-medium">{selectedInquiry.diamond_type}</p>
                    </div>
                  )}
                  
                  {selectedInquiry.watch_brand && (
                    <div className="bg-muted/30 rounded-lg px-4 py-3">
                      <span className="text-sm text-muted-foreground">Watch Brand</span>
                      <p className="font-medium">{selectedInquiry.watch_brand}</p>
                    </div>
                  )}
                  
                  {selectedInquiry.watch_model && (
                    <div className="bg-muted/30 rounded-lg px-4 py-3">
                      <span className="text-sm text-muted-foreground">Watch Model</span>
                      <p className="font-medium">{selectedInquiry.watch_model}</p>
                    </div>
                  )}
                  
                  {selectedInquiry.necklace_brand && (
                    <div className="bg-muted/30 rounded-lg px-4 py-3">
                      <span className="text-sm text-muted-foreground">Necklace Brand</span>
                      <p className="font-medium">{selectedInquiry.necklace_brand}</p>
                    </div>
                  )}
                  
                  {selectedInquiry.bracelet_brand && (
                    <div className="bg-muted/30 rounded-lg px-4 py-3">
                      <span className="text-sm text-muted-foreground">Bracelet Brand</span>
                      <p className="font-medium">{selectedInquiry.bracelet_brand}</p>
                    </div>
                  )}
                  
                  {selectedInquiry.earring_brand && (
                    <div className="bg-muted/30 rounded-lg px-4 py-3">
                      <span className="text-sm text-muted-foreground">Earring Brand</span>
                      <p className="font-medium">{selectedInquiry.earring_brand}</p>
                    </div>
                  )}
                  
                  {(selectedInquiry.item_type === 'watch' || selectedInquiry.item_type === 'necklace' || selectedInquiry.item_type === 'bracelet' || selectedInquiry.item_type === 'earrings') && (
                    <>
                      <div className="bg-muted/30 rounded-lg px-4 py-3">
                        <span className="text-sm text-muted-foreground">Original Box</span>
                        <p className="font-medium">{selectedInquiry.has_original_box ? '✓ Yes' : '✗ No'}</p>
                      </div>
                      <div className="bg-muted/30 rounded-lg px-4 py-3">
                        <span className="text-sm text-muted-foreground">Paperwork</span>
                        <p className="font-medium">{selectedInquiry.has_paperwork ? '✓ Yes' : '✗ No'}</p>
                      </div>
                    </>
                  )}
                  
                  <div className="bg-muted/30 rounded-lg px-4 py-3">
                    <span className="text-sm text-muted-foreground">Images Submitted</span>
                    <p className="font-medium">{selectedInquiry.image_count}</p>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div>
                <h4 className="font-medium mb-3 text-sm text-muted-foreground uppercase tracking-wide">Status</h4>
                <Badge variant={
                  selectedInquiry.status === 'pending' ? 'secondary' :
                  selectedInquiry.status === 'contacted' ? 'default' :
                  selectedInquiry.status === 'completed' ? 'outline' :
                  'destructive'
                } className="text-sm">
                  {selectedInquiry.status}
                </Badge>
              </div>

              {/* Admin Notes */}
              <div>
                <h4 className="font-medium mb-3 text-sm text-muted-foreground uppercase tracking-wide">Admin Notes</h4>
                <Textarea
                  placeholder="Add notes about this inquiry..."
                  value={inquiryAdminNotes}
                  onChange={(e) => setInquiryAdminNotes(e.target.value)}
                  rows={3}
                  className="mb-2"
                />
                <Button
                  size="sm"
                  variant="outline"
                  disabled={savingInquiryNotes}
                  onClick={async () => {
                    if (!selectedInquiry) return;
                    setSavingInquiryNotes(true);
                    try {
                      const { error } = await supabase
                        .from('item_inquiries')
                        .update({ admin_notes: inquiryAdminNotes })
                        .eq('id', selectedInquiry.id);
                      
                      if (error) throw error;
                      toast.success('Notes saved successfully');
                      fetchItemInquiries();
                    } catch (error) {
                      console.error('Error saving notes:', error);
                      toast.error('Failed to save notes');
                    } finally {
                      setSavingInquiryNotes(false);
                    }
                  }}
                >
                  {savingInquiryNotes ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  Save Notes
                </Button>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            {selectedInquiry?.status === 'pending' && (
              <>
                <Button
                  variant="default"
                  onClick={() => {
                    handleUpdateInquiryStatus(selectedInquiry.id, 'contacted');
                    setShowInquiryDetail(false);
                  }}
                  className="bg-gold hover:bg-gold/90"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Mark Contacted
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    handleUpdateInquiryStatus(selectedInquiry.id, 'dismissed');
                    setShowInquiryDetail(false);
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Dismiss
                </Button>
              </>
            )}
            <Button variant="ghost" onClick={() => setShowInquiryDetail(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Shipping Label Approval Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Shipping Label to Approve</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Approving: <span className="font-medium text-foreground">{approveAuction?.title}</span>
            </p>
            
            <div className="space-y-2">
              <Label htmlFor="shipping-label">Shipping Label (Required)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="shipping-label"
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) => setShippingLabelFile(e.target.files?.[0] || null)}
                  className="flex-1"
                />
              </div>
              {shippingLabelFile && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Selected: {shippingLabelFile.name} ({(shippingLabelFile.size / 1024).toFixed(1)} KB)
                  </p>
                  {shippingLabelFile.type.startsWith('image/') ? (
                    <div className="border rounded-lg p-2 bg-muted/30">
                      <img 
                        src={URL.createObjectURL(shippingLabelFile)} 
                        alt="Shipping label preview"
                        className="max-h-48 w-full object-contain rounded"
                      />
                    </div>
                  ) : shippingLabelFile.type === 'application/pdf' ? (
                    <div className="border rounded-lg p-4 bg-muted/30 flex items-center justify-center">
                      <div className="text-center">
                        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">PDF Document</p>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowApproveDialog(false);
                setApproveAuction(null);
                setShippingLabelFile(null);
              }}
              disabled={uploadingLabel}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApproveWithLabel}
              disabled={uploadingLabel || !shippingLabelFile}
              className="bg-gold hover:bg-gold/90"
            >
              {uploadingLabel ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload & Approve
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
