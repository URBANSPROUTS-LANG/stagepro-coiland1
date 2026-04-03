import { useMutation } from "@tanstack/react-query";
import { useActor } from "./useActor";

export type CheckoutSession = {
  id: string;
  url: string;
};

export function useCreateCheckoutSession() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (priceId: string): Promise<CheckoutSession> => {
      if (!actor) throw new Error("Actor not available");
      const baseUrl = `${window.location.protocol}//${window.location.host}`;
      const successUrl = `${baseUrl}?payment=success&plan=${priceId}`;
      const cancelUrl = `${baseUrl}?payment=cancelled`;
      // The stripe component adds createCheckoutSession to the actor
      const result = await (actor as any).createCheckoutSession(
        priceId,
        successUrl,
        cancelUrl,
      );
      const session = JSON.parse(result) as CheckoutSession;
      if (!session?.url) throw new Error("Stripe session missing url");
      return session;
    },
  });
}
