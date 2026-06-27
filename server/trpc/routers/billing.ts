import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../base';
import { db } from '@/server/db';
import Razorpay from 'razorpay';
import crypto from 'crypto';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

const PLANS = {
  FREE: { price: 0, name: 'Free', features: ['1 workspace', '3 projects', '10 AI reviews/month'] },
  PRO: { price: 49900, name: 'Pro', features: ['Unlimited workspaces', 'Unlimited projects', 'Unlimited AI reviews', 'GitHub webhooks', 'Priority support'] },
};

export const billingRouter = createTRPCRouter({
  getSubscription: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ ctx, input }) => {
      const sub = await db.subscription.findUnique({
        where: { organizationId: input.organizationId },
      });
      return sub || { plan: 'FREE', status: 'active' };
    }),

  createOrder: protectedProcedure
    .input(z.object({ organizationId: z.string(), plan: z.enum(['PRO']) }))
    .mutation(async ({ ctx, input }) => {
      const amount = PLANS[input.plan].price;
      const order = await razorpay.orders.create({
        amount,
        currency: 'INR',
        receipt: `ord_${Date.now()}`,
      });
      return { orderId: order.id, amount, currency: 'INR', keyId: process.env.RAZORPAY_KEY_ID };
    }),

  verifyPayment: protectedProcedure
    .input(z.object({
      organizationId: z.string(),
      razorpayOrderId: z.string(),
      razorpayPaymentId: z.string(),
      razorpaySignature: z.string(),
      plan: z.enum(['PRO']),
    }))
    .mutation(async ({ ctx, input }) => {
      const body = input.razorpayOrderId + '|' + input.razorpayPaymentId;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
        .update(body)
        .digest('hex');

      if (expectedSignature !== input.razorpaySignature) {
        throw new Error('Invalid payment signature');
      }

      await db.subscription.upsert({
        where: { organizationId: input.organizationId },
        create: {
          organizationId: input.organizationId,
          plan: input.plan,
          status: 'active',
          razorpayOrderId: input.razorpayOrderId,
          razorpayPaymentId: input.razorpayPaymentId,
        },
        update: {
          plan: input.plan,
          status: 'active',
          razorpayOrderId: input.razorpayOrderId,
          razorpayPaymentId: input.razorpayPaymentId,
        },
      });

      return { success: true };
    }),

  cancelSubscription: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await db.subscription.upsert({
        where: { organizationId: input.organizationId },
        create: { organizationId: input.organizationId, plan: 'FREE', status: 'active' },
        update: { plan: 'FREE', status: 'active' },
      });
      return { success: true };
    }),
});