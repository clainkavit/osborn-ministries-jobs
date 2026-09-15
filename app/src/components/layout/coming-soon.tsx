// Stage 21 sections 19-20. Placeholder body for nav routes whose features
// arrive in a later milestone. The route and nav entry exist now; the
// screen does not.

export function ComingSoon({ title }: { title: string }) {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Coming in the next stage.
      </p>
    </div>
  );
}
