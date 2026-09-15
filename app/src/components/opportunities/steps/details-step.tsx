"use client";

// Step 2 -- Details. Title, organization, location, description. Location
// is optional and never blocks Publish (Champion §23 item 1).

import { useState } from "react";
import { saveOpportunityDetails } from "@/lib/opportunities/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { OpportunityStepProps } from "../opportunity-wizard";

export function DetailsStep({ opportunity, bindNext }: OpportunityStepProps) {
  const [title, setTitle] = useState(opportunity.title);
  const [organizationName, setOrganizationName] = useState(
    opportunity.organizationName,
  );
  const [location, setLocation] = useState(opportunity.location ?? "");
  const [description, setDescription] = useState(opportunity.description ?? "");
  const [error, setError] = useState<string | null>(null);

  bindNext(async () => {
    setError(null);
    const res = await saveOpportunityDetails(opportunity.id, {
      title,
      organizationName,
      location: location.trim() || null,
      description: description.trim() || null,
    });
    if (!res.success) {
      setError(res.error);
      return { success: false, error: res.error };
    }
    return { success: true };
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Details</h2>
        <p className="text-sm text-muted-foreground">
          Basic information about this opportunity.
        </p>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="space-y-1.5">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Driver"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="organizationName">Organization</Label>
        <Input
          id="organizationName"
          value={organizationName}
          onChange={(e) => setOrganizationName(e.target.value)}
          placeholder="e.g. Osborn Ministries"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Optional — e.g. Mwanza"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          placeholder="Optional — describe the opportunity"
          className="w-full rounded-md border bg-transparent p-2 text-sm"
        />
      </div>
    </div>
  );
}
