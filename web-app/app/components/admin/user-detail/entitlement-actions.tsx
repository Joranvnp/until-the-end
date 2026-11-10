import { useMutation } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmAction } from "@/components/confirm-action";
import { api } from "@convex/_generated/api";

type Entitlement = FunctionReturnType<
  typeof api.admin.queries.getUserDetail
>["entitlements"][number];

export function EntitlementActions({ entitlement }: { entitlement: Entitlement }) {
  const setStatus = useMutation(api.admin.mutations.setEntitlementStatus);
  const isActive = entitlement.status === "active";

  return (
    <div className="flex justify-end gap-1.5">
      {isActive ? (
        <>
          <ConfirmAction
            trigger={
              <Button variant="outline" size="sm">
                Revoke
              </Button>
            }
            title="Revoke entitlement?"
            description="The user immediately loses access. This does not issue a refund."
            confirmLabel="Revoke"
            onConfirm={async () => {
              await setStatus({
                entitlementId: entitlement._id,
                status: "revoked",
              });
              toast.success("Entitlement revoked");
            }}
          />
          <ConfirmAction
            trigger={
              <Button variant="destructive" size="sm">
                Refund
              </Button>
            }
            title="Mark as refunded?"
            description="Records this purchase as refunded and removes access. Process the actual refund in Stripe / App Store separately."
            confirmLabel="Mark refunded"
            onConfirm={async () => {
              await setStatus({
                entitlementId: entitlement._id,
                status: "refunded",
              });
              toast.success("Marked as refunded");
            }}
          />
        </>
      ) : (
        <ConfirmAction
          trigger={
            <Button variant="outline" size="sm">
              Reactivate
            </Button>
          }
          title="Reactivate entitlement?"
          description="Restores access for this user."
          confirmLabel="Reactivate"
          confirmVariant="default"
          onConfirm={async () => {
            await setStatus({
              entitlementId: entitlement._id,
              status: "active",
            });
            toast.success("Entitlement reactivated");
          }}
        />
      )}
    </div>
  );
}
