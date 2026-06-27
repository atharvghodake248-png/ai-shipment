'use client';

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { trpc } from '@/trpc/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Zap, Crown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

declare global {
  interface Window { Razorpay: any; }
}

const PLANS = [
  {
    id: 'FREE',
    name: 'Free',
    price: '₹0',
    period: 'forever',
    icon: Zap,
    color: 'border-slate-200',
    badge: null,
    features: ['1 workspace', '3 projects', '10 AI reviews/month', 'GitHub integration', 'Basic Kanban board'],
  },
  {
    id: 'PRO',
    name: 'Pro',
    price: '₹499',
    period: 'per month',
    icon: Crown,
    color: 'border-violet-400',
    badge: 'Most Popular',
    features: ['Unlimited workspaces', 'Unlimited projects', 'Unlimited AI reviews', 'GitHub webhooks', 'Priority support', 'Advanced analytics'],
  },
];

export default function BillingPage() {
  const searchParams = useSearchParams();
  const orgId = searchParams.get('org');
  const [loading, setLoading] = useState(false);

  const { data: subscription, refetch } = trpc.billing.getSubscription.useQuery(
    { organizationId: orgId! },
    { enabled: !!orgId }
  );

  const createOrder = trpc.billing.createOrder.useMutation();
  const verifyPayment = trpc.billing.verifyPayment.useMutation({
    onSuccess: () => {
      toast.success('Upgraded to Pro! 🎉');
      refetch();
      setLoading(false);
    },
  });
  const cancelSub = trpc.billing.cancelSubscription.useMutation({
    onSuccess: () => {
      toast.success('Downgraded to Free plan');
      refetch();
    },
  });

  const handleUpgrade = async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const order = await createOrder.mutateAsync({ organizationId: orgId, plan: 'PRO' });

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      document.body.appendChild(script);

      script.onload = () => {
        const rzp = new window.Razorpay({
          key: order.keyId,
          amount: order.amount,
          currency: order.currency,
          order_id: order.orderId,
          name: 'ShipFlow AI',
          description: 'Pro Plan Subscription',
          theme: { color: '#7c3aed' },
          handler: async (response: any) => {
            await verifyPayment.mutateAsync({
              organizationId: orgId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              plan: 'PRO',
            });
          },
          modal: { ondismiss: () => setLoading(false) },
        });
        rzp.open();
      };
    } catch {
      toast.error('Failed to create order');
      setLoading(false);
    }
  };

  const currentPlan = subscription?.plan || 'FREE';

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Crown className="w-7 h-7 text-violet-600" />
          Billing & Plans
        </h1>
        <p className="text-muted-foreground mt-1">
          Current plan: <span className="font-medium text-foreground">{currentPlan}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {PLANS.map((plan) => {
          const Icon = plan.icon;
          const isCurrent = currentPlan === plan.id;
          return (
            <Card key={plan.id} className={`relative border-2 ${isCurrent ? plan.color : 'border-slate-100'}`}>
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-violet-600 text-white">{plan.badge}</Badge>
                </div>
              )}
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon className={`w-5 h-5 ${plan.id === 'PRO' ? 'text-violet-600' : 'text-slate-400'}`} />
                  {plan.name}
                </CardTitle>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground text-sm">/{plan.period}</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                {isCurrent ? (
                  <Button disabled className="w-full" variant="outline">
                    Current Plan
                  </Button>
                ) : plan.id === 'PRO' ? (
                  <Button
                    className="w-full bg-violet-600 hover:bg-violet-700"
                    onClick={handleUpgrade}
                    disabled={loading}
                  >
                    {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</> : 'Upgrade to Pro'}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => cancelSub.mutate({ organizationId: orgId! })}
                    disabled={cancelSub.isPending}
                  >
                    Downgrade to Free
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-slate-50">
        <CardContent className="py-4">
          <p className="text-sm text-muted-foreground text-center">
            🔒 Payments secured by Razorpay. Test mode active — use card <strong>4111 1111 1111 1111</strong> for testing.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}