'use client';

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { trpc } from '@/trpc/client';
import { CheckCircle, Zap, Crown, Loader2, Lock } from 'lucide-react';
import { toast } from 'sonner';

declare global { interface Window { Razorpay: any; } }

const PLANS = [
  {
    id: 'FREE', name: 'Free', price: '₹0', period: 'forever', icon: Zap,
    gradient: 'from-zinc-700 to-zinc-800',
    features: ['1 workspace', '3 projects', '10 AI reviews/month', 'GitHub integration', 'Basic Kanban board'],
  },
  {
    id: 'PRO', name: 'Pro', price: '₹499', period: 'per month', icon: Crown,
    gradient: 'from-violet-600 to-indigo-600',
    badge: 'Most Popular',
    features: ['Unlimited workspaces', 'Unlimited projects', 'Unlimited AI reviews', 'GitHub webhooks', 'Priority support', 'Advanced analytics'],
  },
];

export default function BillingPage() {
  const searchParams = useSearchParams();
  const orgId = searchParams.get('org');
  const [loading, setLoading] = useState(false);

  const { data: subscription, refetch } = trpc.billing.getSubscription.useQuery(
    { organizationId: orgId! }, { enabled: !!orgId }
  );
  const createOrder = trpc.billing.createOrder.useMutation();
  const verifyPayment = trpc.billing.verifyPayment.useMutation({
    onSuccess: () => { toast.success('Upgraded to Pro! 🎉'); refetch(); setLoading(false); },
  });
  const cancelSub = trpc.billing.cancelSubscription.useMutation({
    onSuccess: () => { toast.success('Downgraded to Free plan'); refetch(); },
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
          key: order.keyId, amount: order.amount, currency: order.currency,
          order_id: order.orderId, name: 'ShipFlow AI', description: 'Pro Plan',
          theme: { color: '#7c3aed' },
          handler: async (response: any) => {
            await verifyPayment.mutateAsync({
              organizationId: orgId, razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id, razorpaySignature: response.razorpay_signature, plan: 'PRO',
            });
          },
          modal: { ondismiss: () => setLoading(false) },
        });
        rzp.open();
      };
    } catch { toast.error('Failed to create order'); setLoading(false); }
  };

  const currentPlan = subscription?.plan || 'FREE';

  return (
    <div className="min-h-screen bg-[#09090B] text-white">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Crown className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Billing & Plans</h1>
            <p className="text-zinc-500 text-sm">Current plan: <span className="text-white font-medium">{currentPlan}</span></p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            const isCurrent = currentPlan === plan.id;
            return (
              <div key={plan.id} className={`relative rounded-2xl border-2 transition-all duration-300 overflow-hidden ${
                isCurrent ? 'border-violet-500/40 bg-violet-600/5' : 'border-zinc-800 bg-zinc-900/70'
              } ${plan.id === 'PRO' ? 'shadow-xl shadow-violet-500/10' : ''}`}>
                {plan.badge && (
                  <div className="absolute top-4 right-4">
                    <span className="text-xs font-semibold bg-violet-600 text-white px-3 py-1 rounded-full">{plan.badge}</span>
                  </div>
                )}
                <div className="p-6 border-b border-zinc-800">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center shadow-lg`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-semibold text-white text-lg">{plan.name}</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white">{plan.price}</span>
                    <span className="text-zinc-500 text-sm">/{plan.period}</span>
                  </div>
                </div>
                <div className="p-6">
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-sm text-zinc-400">
                        <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />{f}
                      </li>
                    ))}
                  </ul>
                  {isCurrent ? (
                    <button disabled className="w-full h-11 bg-zinc-800 border border-zinc-700 text-zinc-500 font-medium rounded-xl cursor-not-allowed text-sm">
                      Current Plan
                    </button>
                  ) : plan.id === 'PRO' ? (
                    <button onClick={handleUpgrade} disabled={loading}
                      className="w-full h-11 bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 text-white font-semibold rounded-xl transition-all hover:-translate-y-0.5 shadow-xl shadow-violet-500/20 disabled:opacity-50 flex items-center justify-center gap-2">
                      {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Processing...</> : 'Upgrade to Pro'}
                    </button>
                  ) : (
                    <button onClick={() => cancelSub.mutate({ organizationId: orgId! })} disabled={cancelSub.isPending}
                      className="w-full h-11 bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 font-medium rounded-xl transition-all text-sm flex items-center justify-center gap-2">
                      {cancelSub.isPending && <Loader2 className="w-4 h-4 animate-spin" />}Downgrade to Free
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-3 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4">
          <Lock className="w-4 h-4 text-zinc-500 shrink-0" />
          <p className="text-sm text-zinc-500">
            Payments secured by Razorpay. Test mode — use card <span className="text-zinc-300 font-mono">4111 1111 1111 1111</span>
          </p>
        </div>
      </div>
    </div>
  );
}