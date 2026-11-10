import { useAction } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "@convex/_generated/api";

export type PlanActions = {
  checkoutLoading: boolean;
  portalLoading: boolean;
  message: string | null;
  error: string | null;
  startCheckout: () => Promise<void>;
  openInvoicePortal: () => Promise<void>;
};

export function useAccountPlanActions(): PlanActions {
  const createCheckoutSession = useAction(
    api.payments.stripe.createCheckoutSession,
  );
  const confirmCheckoutSession = useAction(
    api.payments.stripe.confirmCheckoutSession,
  );
  const createBillingPortal = useAction(api.payments.stripe.createBillingPortal);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sessionId = new URLSearchParams(window.location.search).get(
      "checkout_session_id",
    );
    if (!sessionId) return;

    let cancelled = false;
    setCheckoutLoading(true);
    setError(null);
    confirmCheckoutSession({ sessionId })
      .then((result) => {
        if (cancelled) return;
        setMessage(
          result.paid
            ? "Stripe checkout confirmed."
            : "Stripe has not marked this payment as paid yet.",
        );
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(
            e instanceof Error
              ? e.message
              : "Unable to confirm Stripe checkout.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setCheckoutLoading(false);
          window.history.replaceState({}, "", "/account/plan");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [confirmCheckoutSession]);

  const startCheckout = async () => {
    if (checkoutLoading) return;
    setCheckoutLoading(true);
    setError(null);
    setMessage(null);
    try {
      const { url } = await createCheckoutSession({
        origin: window.location.origin,
        returnTarget: "accountPlan",
      });
      window.location.href = url;
    } catch (e: unknown) {
      setError(
        e instanceof Error ? e.message : "Unable to start Stripe checkout.",
      );
      setCheckoutLoading(false);
    }
  };

  const openInvoicePortal = async () => {
    if (portalLoading) return;
    setPortalLoading(true);
    setError(null);
    setMessage(null);
    try {
      const { url } = await createBillingPortal({
        origin: window.location.origin,
        returnTarget: "accountPlan",
      });
      window.location.href = url;
    } catch (e: unknown) {
      setError(
        e instanceof Error ? e.message : "Unable to open the invoice portal.",
      );
      setPortalLoading(false);
    }
  };

  return {
    checkoutLoading,
    portalLoading,
    message,
    error,
    startCheckout,
    openInvoicePortal,
  };
}
