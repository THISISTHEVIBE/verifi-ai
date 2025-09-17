import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { createAuditLog, AuditActions } from "@/lib/audit";

// Stripe configuration
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY;

// Price IDs (these would be configured in Stripe dashboard)
const PRICE_IDS = {
  PAY_PER_CONTRACT: process.env.STRIPE_PRICE_PAY_PER_CONTRACT || 'price_pay_per_contract',
  PROFESSIONAL: process.env.STRIPE_PRICE_PROFESSIONAL || 'price_professional',
  ENTERPRISE: process.env.STRIPE_PRICE_ENTERPRISE || 'price_enterprise',
};

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireAuth();
    const body = await req.json();
    const { plan, mode = 'subscription' } = body;

    // Validate plan
    if (!plan || !['PAY_PER_CONTRACT', 'PROFESSIONAL', 'ENTERPRISE'].includes(plan)) {
      return new Response(JSON.stringify({ 
        error: "invalid_plan",
        message: "Plan must be one of: PAY_PER_CONTRACT, PROFESSIONAL, ENTERPRISE" 
      }), { status: 400 });
    }

    // Get user's default organization
    const defaultOrg = user.defaultOrg;
    if (!defaultOrg) {
      return new Response(JSON.stringify({ 
        error: "no_default_org",
        message: "User must have a default organization" 
      }), { status: 400 });
    }

    // Check if Stripe is configured
    if (!STRIPE_SECRET_KEY) {
      return new Response(JSON.stringify({ 
        error: "stripe_not_configured",
        message: "Stripe is not configured. Set STRIPE_SECRET_KEY environment variable." 
      }), { status: 500 });
    }

    // Get or create Stripe customer
    let subscription = await db.subscription.findFirst({
      where: { orgId: defaultOrg.id }
    });

    let customerId = subscription?.stripeCustomerId;

    // For now, return a mock checkout session (in production, use actual Stripe SDK)
    const mockCheckoutSession = {
      id: `cs_mock_${Date.now()}`,
      url: `https://checkout.stripe.com/pay/cs_mock_${Date.now()}#fidkdWxOYHwnPyd1blpxYHZxWjA0VGxOTXFhNWJhbTVKN2xfbGJxYkFVNjVqVjJGNGNKQnJGNnxLTXRLRWJLQGNLZGNKTDRdNGJfNnxMTGJLNGJdNnxMTGJLNGJdNnxMTGJL`,
      customer: customerId || `cus_mock_${Date.now()}`,
      mode: mode,
      success_url: `${getBaseUrl(req)}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${getBaseUrl(req)}/cancel`,
    };

    // Create or update subscription record
    if (!subscription) {
      subscription = await db.subscription.create({
        data: {
          orgId: defaultOrg.id,
          stripeCustomerId: mockCheckoutSession.customer,
          plan: plan as any,
          status: 'INACTIVE',
        }
      });
    } else {
      subscription = await db.subscription.update({
        where: { id: subscription.id },
        data: {
          stripeCustomerId: mockCheckoutSession.customer,
          plan: plan as any,
        }
      });
    }

    // Create audit log
    await createAuditLog({
      userId: user.id,
      action: AuditActions.SUBSCRIPTION_CREATED,
      details: {
        plan,
        mode,
        orgId: defaultOrg.id,
        checkoutSessionId: mockCheckoutSession.id,
      },
      request: req
    });

    return new Response(JSON.stringify({
      checkoutUrl: mockCheckoutSession.url,
      sessionId: mockCheckoutSession.id,
    }), { 
      status: 200, 
      headers: { "content-type": "application/json" } 
    });

  } catch (error) {
    console.error("Checkout creation failed:", error);
    return new Response(JSON.stringify({ 
      error: "checkout_failed",
      message: "Failed to create checkout session" 
    }), { status: 500 });
  }
}

function getBaseUrl(req: NextRequest): string {
  const protocol = req.headers.get('x-forwarded-proto') || 'http';
  const host = req.headers.get('host') || 'localhost:3000';
  return `${protocol}://${host}`;
}
