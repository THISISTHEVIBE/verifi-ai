import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { createAuditLog, AuditActions } from "@/lib/audit";

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!STRIPE_WEBHOOK_SECRET) {
      console.warn("Stripe webhook secret not configured");
      return new Response("Webhook secret not configured", { status: 400 });
    }

    if (!signature) {
      return new Response("Missing stripe-signature header", { status: 400 });
    }

    // In production, you would verify the webhook signature here using Stripe SDK
    // For now, we'll parse the JSON directly (this is not secure for production)
    let event;
    try {
      event = JSON.parse(body);
    } catch (err) {
      return new Response("Invalid JSON", { status: 400 });
    }

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;
      
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response("Webhook handled", { status: 200 });

  } catch (error) {
    console.error("Webhook processing failed:", error);
    return new Response("Webhook processing failed", { status: 500 });
  }
}

async function handleCheckoutSessionCompleted(session: any) {
  try {
    const customerId = session.customer;
    const subscriptionId = session.subscription;
    
    // Find subscription by customer ID
    const subscription = await db.subscription.findFirst({
      where: { stripeCustomerId: customerId }
    });

    if (subscription) {
      await db.subscription.update({
        where: { id: subscription.id },
        data: {
          stripeSubscriptionId: subscriptionId,
          status: 'ACTIVE',
          currentPeriodStart: new Date(session.current_period_start * 1000),
          currentPeriodEnd: new Date(session.current_period_end * 1000),
        }
      });

      // Create audit log
      await createAuditLog({
        action: AuditActions.SUBSCRIPTION_UPDATED,
        details: {
          subscriptionId: subscription.id,
          stripeSubscriptionId: subscriptionId,
          status: 'ACTIVE',
          event: 'checkout.session.completed'
        }
      });
    }
  } catch (error) {
    console.error("Failed to handle checkout session completed:", error);
  }
}

async function handleSubscriptionUpdated(stripeSubscription: any) {
  try {
    const customerId = stripeSubscription.customer;
    
    // Find subscription by customer ID
    const subscription = await db.subscription.findFirst({
      where: { stripeCustomerId: customerId }
    });

    if (subscription) {
      const status = mapStripeStatus(stripeSubscription.status);
      
      await db.subscription.update({
        where: { id: subscription.id },
        data: {
          stripeSubscriptionId: stripeSubscription.id,
          status,
          currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
          currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
          cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
        }
      });

      // Create audit log
      await createAuditLog({
        action: AuditActions.SUBSCRIPTION_UPDATED,
        details: {
          subscriptionId: subscription.id,
          stripeSubscriptionId: stripeSubscription.id,
          status,
          event: 'subscription.updated'
        }
      });
    }
  } catch (error) {
    console.error("Failed to handle subscription updated:", error);
  }
}

async function handleSubscriptionDeleted(stripeSubscription: any) {
  try {
    const customerId = stripeSubscription.customer;
    
    // Find subscription by customer ID
    const subscription = await db.subscription.findFirst({
      where: { stripeCustomerId: customerId }
    });

    if (subscription) {
      await db.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'CANCELED',
          cancelAtPeriodEnd: false,
        }
      });

      // Create audit log
      await createAuditLog({
        action: AuditActions.SUBSCRIPTION_UPDATED,
        details: {
          subscriptionId: subscription.id,
          stripeSubscriptionId: stripeSubscription.id,
          status: 'CANCELED',
          event: 'subscription.deleted'
        }
      });
    }
  } catch (error) {
    console.error("Failed to handle subscription deleted:", error);
  }
}

async function handlePaymentSucceeded(invoice: any) {
  try {
    const customerId = invoice.customer;
    
    // Find subscription by customer ID
    const subscription = await db.subscription.findFirst({
      where: { stripeCustomerId: customerId }
    });

    if (subscription && subscription.status !== 'ACTIVE') {
      await db.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'ACTIVE',
        }
      });
    }

    // Create audit log
    await createAuditLog({
      action: AuditActions.SUBSCRIPTION_UPDATED,
      details: {
        subscriptionId: subscription?.id,
        customerId,
        invoiceId: invoice.id,
        amount: invoice.amount_paid,
        event: 'payment.succeeded'
      }
    });
  } catch (error) {
    console.error("Failed to handle payment succeeded:", error);
  }
}

async function handlePaymentFailed(invoice: any) {
  try {
    const customerId = invoice.customer;
    
    // Find subscription by customer ID
    const subscription = await db.subscription.findFirst({
      where: { stripeCustomerId: customerId }
    });

    if (subscription) {
      await db.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'PAST_DUE',
        }
      });
    }

    // Create audit log
    await createAuditLog({
      action: AuditActions.SUBSCRIPTION_UPDATED,
      details: {
        subscriptionId: subscription?.id,
        customerId,
        invoiceId: invoice.id,
        status: 'PAST_DUE',
        event: 'payment.failed'
      }
    });
  } catch (error) {
    console.error("Failed to handle payment failed:", error);
  }
}

function mapStripeStatus(stripeStatus: string): 'ACTIVE' | 'INACTIVE' | 'CANCELED' | 'PAST_DUE' {
  switch (stripeStatus) {
    case 'active':
      return 'ACTIVE';
    case 'canceled':
      return 'CANCELED';
    case 'past_due':
    case 'unpaid':
      return 'PAST_DUE';
    default:
      return 'INACTIVE';
  }
}
