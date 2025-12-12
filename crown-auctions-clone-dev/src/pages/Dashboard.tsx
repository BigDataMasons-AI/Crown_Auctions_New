import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDeposit } from '@/hooks/useDeposit';
import { supabase } from '@/integrations/supabase/client';
import { Navigation } from '@/components/Navigation';
import { AuctionComparisonView } from '@/components/AuctionComparisonView';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, Heart, Gavel, FileText, Clock, CheckCircle, XCircle, Trash2, Download, CreditCard, DollarSign, RefreshCw } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { user, signOut, loading: authLoading } = useAuth();
  const { t, language } = useLanguage();
  const { hasDeposit, deposit, loading: depositLoading, createDepositOrder, checkDeposit } = useDeposit();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [savedAuctions, setSavedAuctions] = useState<any[]>([]);
  const [bids, setBids] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [originalSubmissions, setOriginalSubmissions] = useState<Map<string, any>>(new Map());
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [withdrawing, setWithdrawing] = useState<string | null>(null);
  const [depositProcessing, setDepositProcessing] = useState(false);
  const [refundRequesting, setRefundRequesting] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [depositTransactions, setDepositTransactions] = useState<any[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      const [profileRes, savedRes, bidsRes, submissionsRes, transactionsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user!.id).single(),
        supabase.from('saved_auctions').select('*').eq('user_id', user!.id).order('saved_at', { ascending: false }),
        supabase.from('bids').select('*').eq('user_id', user!.id).eq('status', 'active').order('bid_time', { ascending: false }),
        supabase.from('auctions').select('*').eq('submitted_by', user!.id).order('created_at', { ascending: false }),
        supabase.from('deposit_transactions').select('*').eq('user_id', user!.id).order('created_at', { ascending: false })
      ]);

      if (profileRes.data) setProfile(profileRes.data);
      if (savedRes.data) setSavedAuctions(savedRes.data);
      if (transactionsRes.data) setDepositTransactions(transactionsRes.data);
      if (submissionsRes.data) {
        setSubmissions(submissionsRes.data);
        
        // Fetch original submissions for resubmissions
        const resubmissions = submissionsRes.data.filter((s: any) => s.original_submission_id);
        if (resubmissions.length > 0) {
          const originalIds = resubmissions.map((s: any) => s.original_submission_id).filter(Boolean);
          const { data: originals } = await supabase
            .from('auctions')
            .select('*')
            .in('id', originalIds);

          if (originals) {
            const originalsMap = new Map(originals.map(o => [o.id, o]));
            setOriginalSubmissions(originalsMap);
          }
        }
      }
      
      if (bidsRes.data) {
        // Get unique auctions and fetch current highest bid for each
        const uniqueAuctions = Array.from(new Set(bidsRes.data.map(b => b.auction_id)));
        const enrichedBids = await Promise.all(
          uniqueAuctions.map(async (auctionId) => {
            const userBidsForAuction = bidsRes.data.filter(b => b.auction_id === auctionId);
            const userHighestBid = Math.max(...userBidsForAuction.map(b => b.bid_amount));
            const userLatestBid = userBidsForAuction[0];
            
            // Get current highest bid for this auction
            const { data: highestBidData } = await supabase
              .from('bids')
              .select('bid_amount, user_id')
              .eq('auction_id', auctionId)
              .eq('status', 'active')
              .order('bid_amount', { ascending: false })
              .limit(1)
              .single();
            
            const isWinning = highestBidData?.user_id === user!.id;
            
            return {
              ...userLatestBid,
              userHighestBid,
              currentHighestBid: highestBidData?.bid_amount || userHighestBid,
              isWinning,
              totalBids: userBidsForAuction.length
            };
          })
        );
        
        setBids(enrichedBids);
      }
    } catch (error: any) {
      toast.error('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUpdating(true);

    const formData = new FormData(e.currentTarget);
    const updates = {
      full_name: formData.get('fullName') as string,
      phone: formData.get('phone') as string,
    };

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user!.id);

    if (error) {
      toast.error('Failed to update profile');
    } else {
      toast.success('Profile updated successfully');
      fetchUserData();
    }

    setUpdating(false);
  };

  const handleRemoveSaved = async (id: string) => {
    const { error } = await supabase
      .from('saved_auctions')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to remove from watchlist');
    } else {
      toast.success('Removed from watchlist');
      setSavedAuctions(savedAuctions.filter(a => a.id !== id));
    }
  };

  const handleWithdrawSubmission = async (submission: any) => {
    if (!confirm(`Are you sure you want to withdraw "${submission.title}"? This action cannot be undone.`)) {
      return;
    }

    setWithdrawing(submission.id);
    try {
      // Delete images from storage if they exist
      if (submission.image_urls && submission.image_urls.length > 0) {
        for (const imageUrl of submission.image_urls) {
          try {
            // Extract the path from the full URL
            const url = new URL(imageUrl);
            const path = url.pathname.split('/auction-images/')[1];
            
            if (path) {
              await supabase.storage
                .from('auction-images')
                .remove([path]);
            }
          } catch (error) {
            console.error('Error deleting image:', error);
            // Continue with submission deletion even if image deletion fails
          }
        }
      }

      // Delete the submission
      const { error } = await supabase
        .from('auctions')
        .delete()
        .eq('id', submission.id);

      if (error) throw error;

      // Send withdrawal confirmation email
      const { error: emailError } = await supabase.functions.invoke('send-submission-withdrawal-email', {
        body: {
          auctionTitle: submission.title,
          auctionId: submission.id,
          userEmail: profile?.email || user?.email,
          userName: profile?.full_name,
          submittedDate: submission.created_at,
          category: submission.category,
          description: submission.description,
          startingPrice: submission.starting_price,
          minimumIncrement: submission.minimum_increment
        }
      });

      if (emailError) {
        console.error('Failed to send withdrawal confirmation email:', emailError);
        // Don't fail the withdrawal if email fails
      }

      toast.success('Submission withdrawn successfully. Confirmation email sent.');
      setSubmissions(submissions.filter(s => s.id !== submission.id));
    } catch (error: any) {
      console.error('Error withdrawing submission:', error);
      toast.error('Failed to withdraw submission');
    } finally {
      setWithdrawing(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  if (!user) return null;

  const initials = profile?.full_name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase() || user.email?.[0].toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-gold text-background text-xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className={`text-3xl font-bold ${language === 'ar' ? 'font-arabic' : ''}`}>{profile?.full_name || t('dashboard.user')}</h1>
                <p className="text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <Button variant="outline" onClick={signOut} className={language === 'ar' ? 'font-arabic' : ''}>
              {t('dashboard.signOut')}
            </Button>
          </div>

          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="profile" className={language === 'ar' ? 'font-arabic' : ''}>{t('dashboard.profile')}</TabsTrigger>
              <TabsTrigger value="deposit" className={language === 'ar' ? 'font-arabic' : ''}>
                <CreditCard className="h-4 w-4 mr-1" />
                Deposit
              </TabsTrigger>
              <TabsTrigger value="submissions" className={language === 'ar' ? 'font-arabic' : ''}>{t('dashboard.mySubmissions')} ({submissions.length})</TabsTrigger>
              <TabsTrigger value="watchlist" className={language === 'ar' ? 'font-arabic' : ''}>{t('dashboard.watchlist')} ({savedAuctions.length})</TabsTrigger>
              <TabsTrigger value="bids" className={language === 'ar' ? 'font-arabic' : ''}>{t('dashboard.myBids')} ({bids.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className={language === 'ar' ? 'font-arabic' : ''}>{t('dashboard.profileInfo')}</CardTitle>
                  <CardDescription className={language === 'ar' ? 'font-arabic' : ''}>{t('dashboard.updateDetails')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className={language === 'ar' ? 'font-arabic' : ''}>{t('dashboard.fullName')}</Label>
                      <Input
                        id="fullName"
                        name="fullName"
                        defaultValue={profile?.full_name || ''}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className={language === 'ar' ? 'font-arabic' : ''}>{t('dashboard.email')}</Label>
                      <Input
                        id="email"
                        value={user.email || ''}
                        disabled
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className={language === 'ar' ? 'font-arabic' : ''}>{t('dashboard.phone')}</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        defaultValue={profile?.phone || ''}
                      />
                    </div>
                    <Button type="submit" disabled={updating} className={language === 'ar' ? 'font-arabic' : ''}>
                      {updating ? t('dashboard.updating') : t('dashboard.updateProfile')}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="deposit" className="mt-6">
              <div className="grid gap-6">
                {/* Deposit Status Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-gold" />
                      Bidding Deposit
                    </CardTitle>
                    <CardDescription>
                      A refundable deposit is required to place bids on auctions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {depositLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-gold" />
                      </div>
                    ) : hasDeposit && deposit ? (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                          <div className="flex items-center gap-3">
                            <CheckCircle className="h-8 w-8 text-green-500" />
                            <div>
                              <p className="font-semibold text-green-700 dark:text-green-400">Deposit Active</p>
                              <p className="text-sm text-muted-foreground">You can place bids on any auction</p>
                            </div>
                          </div>
                          <Badge variant="secondary" className="bg-green-500/20 text-green-700 border-green-500/30">
                            Active
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-muted/50 rounded-lg">
                            <p className="text-sm text-muted-foreground mb-1">Amount</p>
                            <p className="text-2xl font-bold text-gold">
                              ${Number(deposit.amount).toFixed(2)} {deposit.currency}
                            </p>
                          </div>
                          <div className="p-4 bg-muted/50 rounded-lg">
                            <p className="text-sm text-muted-foreground mb-1">Deposited On</p>
                            <p className="font-semibold">
                              {new Date(deposit.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="border-t pt-6">
                          <h4 className="font-semibold mb-3">Request Refund</h4>
                          <p className="text-sm text-muted-foreground mb-4">
                            You can request a refund if you no longer wish to bid. Refunds are processed within 5-7 business days.
                          </p>
                          <div className="space-y-3">
                            <div>
                              <Label htmlFor="refund-reason">Reason for refund (optional)</Label>
                              <Textarea
                                id="refund-reason"
                                placeholder="Please let us know why you're requesting a refund..."
                                value={refundReason}
                                onChange={(e) => setRefundReason(e.target.value)}
                                className="mt-2"
                              />
                            </div>
                            <Button
                              variant="outline"
                              className="text-destructive hover:text-destructive"
                              disabled={refundRequesting}
                              onClick={async () => {
                                if (!confirm('Are you sure you want to request a refund? You will not be able to place bids until you make a new deposit.')) return;
                                
                                setRefundRequesting(true);
                                try {
                                  // Update deposit status to refund_requested
                                  const { error } = await supabase
                                    .from('user_deposits')
                                    .update({ 
                                      status: 'refund_requested',
                                      updated_at: new Date().toISOString()
                                    })
                                    .eq('user_id', user!.id);
                                  
                                  if (error) throw error;

                                  // Log the refund request transaction
                                  if (deposit) {
                                    await supabase.from('deposit_transactions').insert({
                                      deposit_id: deposit.id,
                                      user_id: user!.id,
                                      transaction_type: 'refund_requested',
                                      amount: deposit.amount,
                                      currency: deposit.currency,
                                      description: refundReason || 'Refund request submitted by user',
                                    });
                                  }
                                  
                                  toast.success('Refund request submitted. Our team will process it within 5-7 business days.');
                                  checkDeposit();
                                  fetchUserData();
                                } catch (error) {
                                  console.error('Error requesting refund:', error);
                                  toast.error('Failed to submit refund request. Please try again.');
                                } finally {
                                  setRefundRequesting(false);
                                }
                              }}
                            >
                              {refundRequesting ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Submitting...
                                </>
                              ) : (
                                <>
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                  Request Refund
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                          <div className="flex items-center gap-3">
                            <DollarSign className="h-8 w-8 text-yellow-600" />
                            <div>
                              <p className="font-semibold text-yellow-700 dark:text-yellow-400">No Deposit</p>
                              <p className="text-sm text-muted-foreground">Make a deposit to start bidding</p>
                            </div>
                          </div>
                          <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-700 border-yellow-500/30">
                            Required
                          </Badge>
                        </div>

                        <div className="p-4 bg-gold/5 border border-gold/30 rounded-lg">
                          <h4 className="font-semibold mb-2">Why is a deposit required?</h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• Ensures serious bidders only</li>
                            <li>• Fully refundable if you don't win</li>
                            <li>• Applied to your winning bid amount</li>
                            <li>• Secure payment via PayPal</li>
                          </ul>
                        </div>

                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <p className="font-semibold text-lg">$100.00 USD</p>
                            <p className="text-sm text-muted-foreground">Refundable bidding deposit</p>
                          </div>
                          <Button
                            variant="gold"
                            disabled={depositProcessing}
                            onClick={async () => {
                              setDepositProcessing(true);
                              const result = await createDepositOrder();
                              if (result) {
                                window.location.href = result.approveUrl;
                              } else {
                                toast.error('Failed to create deposit. Please try again.');
                                setDepositProcessing(false);
                              }
                            }}
                          >
                            {depositProcessing ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <CreditCard className="h-4 w-4 mr-2" />
                                Pay with PayPal
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Transaction History */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-gold" />
                      Transaction History
                    </CardTitle>
                    <CardDescription>
                      Your deposit and refund activity
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {depositTransactions.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No transactions yet</p>
                    ) : (
                      <div className="space-y-3">
                        {depositTransactions.map((transaction) => (
                          <div 
                            key={transaction.id} 
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                transaction.transaction_type === 'deposit_completed' 
                                  ? 'bg-green-500/20 text-green-500'
                                  : transaction.transaction_type === 'refund_approved'
                                  ? 'bg-blue-500/20 text-blue-500'
                                  : transaction.transaction_type === 'refund_requested'
                                  ? 'bg-yellow-500/20 text-yellow-600'
                                  : transaction.transaction_type === 'refund_rejected'
                                  ? 'bg-red-500/20 text-red-500'
                                  : 'bg-muted text-muted-foreground'
                              }`}>
                                {transaction.transaction_type === 'deposit_completed' ? (
                                  <DollarSign className="h-5 w-5" />
                                ) : transaction.transaction_type === 'refund_approved' ? (
                                  <CheckCircle className="h-5 w-5" />
                                ) : transaction.transaction_type === 'refund_requested' ? (
                                  <RefreshCw className="h-5 w-5" />
                                ) : transaction.transaction_type === 'refund_rejected' ? (
                                  <XCircle className="h-5 w-5" />
                                ) : (
                                  <CreditCard className="h-5 w-5" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium">
                                  {transaction.transaction_type === 'deposit_created' && 'Deposit Initiated'}
                                  {transaction.transaction_type === 'deposit_completed' && 'Deposit Completed'}
                                  {transaction.transaction_type === 'refund_requested' && 'Refund Requested'}
                                  {transaction.transaction_type === 'refund_approved' && 'Refund Approved'}
                                  {transaction.transaction_type === 'refund_rejected' && 'Refund Rejected'}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(transaction.created_at).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`font-semibold ${
                                transaction.transaction_type.includes('refund') ? 'text-blue-500' : 'text-green-500'
                              }`}>
                                {transaction.transaction_type.includes('refund') ? '-' : '+'}
                                ${Number(transaction.amount).toFixed(2)}
                              </p>
                              <p className="text-xs text-muted-foreground">{transaction.currency}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="submissions" className="mt-6">
              <div className="grid gap-4">
                {submissions.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className={`text-muted-foreground mb-2 ${language === 'ar' ? 'font-arabic' : ''}`}>{t('dashboard.noSubmissions')}</p>
                      <Button asChild className={`mt-4 ${language === 'ar' ? 'font-arabic' : ''}`}>
                        <Link to="/submit-auction">{t('dashboard.submitFirst')}</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {submissions.filter(s => s.approval_status === 'pending').length > 0 && (
                      <div className="space-y-4">
                        <h3 className={`text-lg font-semibold flex items-center gap-2 ${language === 'ar' ? 'font-arabic' : ''}`}>
                          <Clock className="h-5 w-5 text-yellow-500" />
                          {t('dashboard.pendingReview')} ({submissions.filter(s => s.approval_status === 'pending').length})
                        </h3>
                        {submissions
                          .filter(s => s.approval_status === 'pending')
                          .map((submission) => (
                            <Card key={submission.id}>
                              <CardContent className="p-6">
                                <div className="flex items-start gap-4">
                                  {submission.image_urls && submission.image_urls.length > 0 && (
                                    <img 
                                      src={submission.image_urls[0]} 
                                      alt={submission.title}
                                      className="w-24 h-24 object-cover rounded-lg"
                                    />
                                  )}
                                  <div className="flex-1">
                                    <div className="flex items-start justify-between gap-4 mb-2">
                                       <div>
                                         <h4 className="font-semibold text-lg">{submission.title}</h4>
                                         <p className="text-sm text-muted-foreground">{submission.category}</p>
                                       </div>
                                       <Badge variant="secondary" className={`bg-yellow-500/10 text-yellow-700 border-yellow-500/20 ${language === 'ar' ? 'font-arabic' : ''}`}>
                                         <Clock className="h-3 w-3 mr-1" />
                                         {t('dashboard.pending')}
                                       </Badge>
                                       {submission.original_submission_id && (
                                         <Badge variant="outline" className={`bg-gold/10 text-gold border-gold/30 ${language === 'ar' ? 'font-arabic' : ''}`}>
                                           {t('dashboard.resubmission')}
                                         </Badge>
                                       )}
                                     </div>
                                    <div className={`space-y-1 text-sm text-muted-foreground ${language === 'ar' ? 'font-arabic' : ''}`}>
                                      <p>{t('dashboard.startingPrice')}: ${Number(submission.starting_price).toLocaleString()}</p>
                                      <p>{t('dashboard.submitted')}: {new Date(submission.created_at).toLocaleDateString()}</p>
                                    </div>
                                     <p className={`text-sm text-muted-foreground mt-2 italic ${language === 'ar' ? 'font-arabic' : ''}`}>
                                       {t('dashboard.pendingMessage')}
                                     </p>
                                     {submission.original_submission_id && originalSubmissions.get(submission.original_submission_id) && (
                                       <div className="mt-3">
                                         <AuctionComparisonView
                                           original={originalSubmissions.get(submission.original_submission_id)!}
                                           resubmitted={submission}
                                           adminComments={submission.admin_comparison_comments}
                                           isAdmin={false}
                                         />
                                       </div>
                                     )}
                                     <Button
                                      variant="outline" 
                                      size="sm" 
                                      className={`mt-3 text-destructive hover:text-destructive ${language === 'ar' ? 'font-arabic' : ''}`}
                                      onClick={() => handleWithdrawSubmission(submission)}
                                      disabled={withdrawing === submission.id}
                                    >
                                      {withdrawing === submission.id ? (
                                        <>
                                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                          {t('dashboard.withdrawing')}
                                        </>
                                      ) : (
                                        <>
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          {t('dashboard.withdrawSubmission')}
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                      </div>
                    )}

                    {submissions.filter(s => s.approval_status === 'approved').length > 0 && (
                      <div className="space-y-4 mt-6">
                        <h3 className={`text-lg font-semibold flex items-center gap-2 ${language === 'ar' ? 'font-arabic' : ''}`}>
                          <CheckCircle className="h-5 w-5 text-gold" />
                          {t('dashboard.approvedLive')} ({submissions.filter(s => s.approval_status === 'approved').length})
                        </h3>
                        {submissions
                          .filter(s => s.approval_status === 'approved')
                          .map((submission) => (
                            <Card key={submission.id} className="border-gold/30">
                              <CardContent className="p-6">
                                <div className="flex items-start gap-4">
                                  {submission.image_urls && submission.image_urls.length > 0 && (
                                    <img 
                                      src={submission.image_urls[0]} 
                                      alt={submission.title}
                                      className="w-24 h-24 object-cover rounded-lg"
                                    />
                                  )}
                                  <div className="flex-1">
                                     <div className="flex items-start justify-between gap-4 mb-2">
                                       <div>
                                         <h4 className="font-semibold text-lg">{submission.title}</h4>
                                         <p className="text-sm text-muted-foreground">{submission.category}</p>
                                       </div>
                                       <div className="flex gap-2">
                                         <Badge className={`bg-gold hover:bg-gold/90 ${language === 'ar' ? 'font-arabic' : ''}`}>
                                           <CheckCircle className="h-3 w-3 mr-1" />
                                           {t('dashboard.live')}
                                         </Badge>
                                         {submission.original_submission_id && (
                                           <Badge variant="outline" className={`bg-gold/10 text-gold border-gold/30 ${language === 'ar' ? 'font-arabic' : ''}`}>
                                             {t('dashboard.resubmission')}
                                           </Badge>
                                         )}
                                       </div>
                                     </div>
                                     <div className={`space-y-1 text-sm text-muted-foreground ${language === 'ar' ? 'font-arabic' : ''}`}>
                                       <p>{t('dashboard.startingPrice')}: ${Number(submission.starting_price).toLocaleString()}</p>
                                       <p>{t('dashboard.currentBid')}: ${Number(submission.current_bid).toLocaleString()}</p>
                                       <p>{t('dashboard.approved')}: {new Date(submission.approved_at || submission.created_at).toLocaleDateString()}</p>
                                       <p>{t('dashboard.ends')}: {new Date(submission.end_time).toLocaleDateString()}</p>
                                     </div>
                                     {submission.original_submission_id && originalSubmissions.get(submission.original_submission_id) && (
                                       <div className="mt-3">
                                         <AuctionComparisonView
                                           original={originalSubmissions.get(submission.original_submission_id)!}
                                           resubmitted={submission}
                                           adminComments={submission.admin_comparison_comments}
                                           isAdmin={false}
                                         />
                                       </div>
                                     )}
                                     <div className="flex items-center gap-2 mt-3">
                                       <Button asChild size="sm" className={language === 'ar' ? 'font-arabic' : ''}>
                                         <Link to={`/auction/${submission.id}`}>{t('dashboard.viewAuction')}</Link>
                                       </Button>
                                       {submission.shipping_label_url && (
                                         <Button 
                                           variant="outline" 
                                           size="sm"
                                           asChild
                                           className={language === 'ar' ? 'font-arabic' : ''}
                                         >
                                           <a 
                                             href={submission.shipping_label_url} 
                                             target="_blank" 
                                             rel="noopener noreferrer"
                                             download
                                           >
                                             <Download className="h-4 w-4 mr-2" />
                                             {t('dashboard.downloadShippingLabel') || 'Shipping Label'}
                                           </a>
                                         </Button>
                                       )}
                                     </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                      </div>
                    )}

                    {submissions.filter(s => s.approval_status === 'rejected').length > 0 && (
                      <div className="space-y-4 mt-6">
                        <h3 className={`text-lg font-semibold flex items-center gap-2 ${language === 'ar' ? 'font-arabic' : ''}`}>
                          <XCircle className="h-5 w-5 text-destructive" />
                          {t('dashboard.notApproved')} ({submissions.filter(s => s.approval_status === 'rejected').length})
                        </h3>
                        {submissions
                          .filter(s => s.approval_status === 'rejected')
                          .map((submission) => (
                            <Card key={submission.id} className="border-destructive/30">
                              <CardContent className="p-6">
                                <div className="flex items-start gap-4">
                                  {submission.image_urls && submission.image_urls.length > 0 && (
                                    <img 
                                      src={submission.image_urls[0]} 
                                      alt={submission.title}
                                      className="w-24 h-24 object-cover rounded-lg opacity-60"
                                    />
                                  )}
                                  <div className="flex-1">
                                    <div className="flex items-start justify-between gap-4 mb-2">
                                      <div>
                                        <h4 className="font-semibold text-lg">{submission.title}</h4>
                                        <p className="text-sm text-muted-foreground">{submission.category}</p>
                                      </div>
                                      <Badge variant="destructive" className={language === 'ar' ? 'font-arabic' : ''}>
                                        <XCircle className="h-3 w-3 mr-1" />
                                        {t('dashboard.rejected')}
                                      </Badge>
                                    </div>
                                    <div className={`space-y-1 text-sm text-muted-foreground mb-3 ${language === 'ar' ? 'font-arabic' : ''}`}>
                                      <p>{t('dashboard.startingPrice')}: ${Number(submission.starting_price).toLocaleString()}</p>
                                      <p>{t('dashboard.submitted')}: {new Date(submission.created_at).toLocaleDateString()}</p>
                                    </div>
                                    {submission.rejection_reason && (
                                      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 mb-3">
                                        <p className={`text-sm font-medium text-destructive mb-1 ${language === 'ar' ? 'font-arabic' : ''}`}>{t('dashboard.rejectionReason')}:</p>
                                        <p className="text-sm text-muted-foreground">{submission.rejection_reason}</p>
                                      </div>
                                    )}
                                    <Button asChild size="sm" variant="outline" className={language === 'ar' ? 'font-arabic' : ''}>
                                      <Link to="/submit-auction">{t('dashboard.submitAnother')}</Link>
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </TabsContent>

            <TabsContent value="watchlist" className="mt-6">
              <div className="grid gap-4">
                {savedAuctions.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Heart className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className={`text-muted-foreground ${language === 'ar' ? 'font-arabic' : ''}`}>{t('dashboard.noSavedAuctions')}</p>
                      <Button asChild className={`mt-4 ${language === 'ar' ? 'font-arabic' : ''}`}>
                        <Link to="/">{t('dashboard.browseAuctions')}</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  savedAuctions.map((auction) => (
                    <Card key={auction.id}>
                      <CardContent className="flex items-center justify-between p-6">
                        <div>
                          <h3 className={`font-semibold ${language === 'ar' ? 'font-arabic' : ''}`}>{t('dashboard.auction')} #{auction.auction_id}</h3>
                          <p className={`text-sm text-muted-foreground ${language === 'ar' ? 'font-arabic' : ''}`}>
                            {t('dashboard.savedOn')} {new Date(auction.saved_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveSaved(auction.id)}
                          className={language === 'ar' ? 'font-arabic' : ''}
                        >
                          {t('dashboard.remove')}
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="bids" className="mt-6">
              <div className="grid gap-4">
                {bids.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Gavel className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className={`text-muted-foreground ${language === 'ar' ? 'font-arabic' : ''}`}>{t('dashboard.noActiveBids')}</p>
                      <Button asChild className={`mt-4 ${language === 'ar' ? 'font-arabic' : ''}`}>
                        <Link to="/">{t('dashboard.browseAuctions')}</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  bids.map((bid: any) => (
                    <Card key={bid.id} className={bid.isWinning ? 'border-gold/50' : 'border-destructive/30'}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <h3 className={`font-semibold ${language === 'ar' ? 'font-arabic' : ''}`}>{t('dashboard.auction')} #{bid.auction_id}</h3>
                              <Badge 
                                variant={bid.isWinning ? 'default' : 'destructive'}
                                className={`${bid.isWinning ? 'bg-gold hover:bg-gold/90' : ''} ${language === 'ar' ? 'font-arabic' : ''}`}
                              >
                                {bid.isWinning ? `🏆 ${t('dashboard.winning')}` : `⚠️ ${t('dashboard.outbid')}`}
                              </Badge>
                            </div>
                            <div className={`space-y-1 text-sm text-muted-foreground ${language === 'ar' ? 'font-arabic' : ''}`}>
                              <p>{t('dashboard.yourHighestBid')}: ${Number(bid.userHighestBid).toLocaleString()}</p>
                              <p>{t('dashboard.currentHighest')}: ${Number(bid.currentHighestBid).toLocaleString()}</p>
                              <p>{t('dashboard.lastBid')}: {new Date(bid.bid_time).toLocaleString()}</p>
                              {bid.totalBids > 1 && (
                                <p className="text-xs">{bid.totalBids} {t('dashboard.bidsPlaced')}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Button asChild size="sm" variant={bid.isWinning ? 'outline' : 'default'} className={language === 'ar' ? 'font-arabic' : ''}>
                              <Link to={`/auction/${bid.auction_id}`}>
                                {bid.isWinning ? t('dashboard.view') : t('dashboard.rebidNow')}
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
