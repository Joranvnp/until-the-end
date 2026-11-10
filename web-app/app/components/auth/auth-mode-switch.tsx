export function AuthModeSwitch({
  prompt,
  action,
  onClick,
}: {
  prompt: string;
  action: string;
  onClick: () => void;
}) {
  return (
    <p className="text-center text-sm leading-6 text-muted-foreground">
      {prompt}{" "}
      <button
        type="button"
        onClick={onClick}
        className="rounded-md font-semibold text-foreground underline-offset-4 transition-colors hover:text-foreground/80 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/45"
      >
        {action}
      </button>
    </p>
  );
}
