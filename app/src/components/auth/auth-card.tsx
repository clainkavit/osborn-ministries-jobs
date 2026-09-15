// Shared shell for the auth screens (Stage 21 sections 10, 13, 14, 25).
// Centered card, title, optional subtitle, slot for the form, slot for the
// footer link.

import type { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function AuthCard({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">{title}</CardTitle>
          {description ? (
            <CardDescription>{description}</CardDescription>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-6">
          {children}
          {footer ? (
            <div className="text-center text-sm text-muted-foreground">
              {footer}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
