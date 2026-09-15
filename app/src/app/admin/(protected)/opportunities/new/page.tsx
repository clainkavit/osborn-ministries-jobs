// Stage 27 (M5) -- Create Opportunity entry. Collects Type (the wizard's
// own Step 1 input), creates the DRAFT row via createOpportunity, then
// redirects into the wizard for that draft (/admin/opportunities/[id]/edit,
// which always starts at Step 1 per Champion §23 item 5 -- reopening the
// same draft would then re-collect Type again, which is fine: Step 1 is
// re-savable like any other step while still DRAFT).

import { redirect } from "next/navigation";
import { createOpportunity } from "@/lib/opportunities/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

async function startOpportunity(formData: FormData) {
  "use server";
  const type = formData.get("type");
  const res = await createOpportunity({ type });
  if (!res.success) {
    // Extremely unlikely (only an auth/db failure reaches here -- Type
    // itself is always one of three radio values). Fall back to the list.
    redirect("/admin/opportunities");
  }
  redirect(`/admin/opportunities/${res.data.id}/edit`);
}

const OPTIONS = [
  {
    value: "EMPLOYMENT",
    label: "Employment",
    hint: "A company or organization needs employees.",
  },
  {
    value: "CHURCH",
    label: "Church Opportunity",
    hint: "A church department needs a professional.",
  },
  {
    value: "SERVICE",
    label: "Service",
    hint: "Someone needs a professional service.",
  },
] as const;

export default function NewOpportunityPage() {
  return (
    <div className="mx-auto max-w-lg space-y-6 py-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          Create opportunity
        </h1>
        <p className="text-sm text-muted-foreground">
          Start by choosing the opportunity type.
        </p>
      </div>

      <form action={startOpportunity} className="space-y-4">
        <div className="space-y-2">
          {OPTIONS.map((o) => (
            <label
              key={o.value}
              className="flex cursor-pointer items-start gap-3 rounded-md border p-3 has-[:checked]:border-primary"
            >
              <input
                type="radio"
                name="type"
                value={o.value}
                defaultChecked={o.value === "EMPLOYMENT"}
                className="mt-1"
              />
              <span>
                <Label className="cursor-pointer">{o.label}</Label>
                <p className="text-xs text-muted-foreground">{o.hint}</p>
              </span>
            </label>
          ))}
        </div>
        <Button type="submit">Continue</Button>
      </form>
    </div>
  );
}
