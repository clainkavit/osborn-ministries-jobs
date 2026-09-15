// Stage 27 (M5) -- the Create Opportunity wizard page. Only reachable for a
// DRAFT opportunity -- a Published one has no edit path (Champion §23 item
// 7). Always starts at Step 1 (Champion §23 item 5, no computed resume).

import { notFound, redirect } from "next/navigation";
import { getOpportunityForAdmin } from "@/lib/opportunities/queries";
import { OpportunityWizard } from "@/components/opportunities/opportunity-wizard";

export default async function EditOpportunityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const opportunity = await getOpportunityForAdmin(id);
  if (!opportunity) notFound();

  // Champion §23 item 7: Published content is never editable through this
  // wizard -- only DRAFT. Send the admin to the detail/manage view instead.
  if (opportunity.status !== "DRAFT") {
    redirect(`/admin/opportunities/${id}`);
  }

  return <OpportunityWizard opportunity={opportunity} />;
}
