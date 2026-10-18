const SCORES: { label: string; value: number }[] = [
  { label: 'Clarity', value: 68 },
  { label: 'Politeness', value: 91 },
  { label: 'Vocabulary', value: 63 },
];

const TICS = ['"du coup" ×4', '"en fait" ×3', '"voilà" ×2'];

/**
 * Static picture of the live verbal analysis panel shown during a voice
 * simulation. Exposed as a single labelled image. The transcript lines stay
 * in French because simulations are held in French.
 */
const VerbalPanelMock = () => (
  <div
    role="img"
    aria-label="Example of the live verbal analysis panel: session score 74 out of 100, clarity 68, politeness 91, vocabulary 63, an alert about filler words and a live tip."
    className="min-w-0 rounded-2xl border border-border bg-background p-5"
  >
    <div className="flex items-baseline justify-between gap-3">
      <span className="font-display text-base font-semibold text-text">
        Verbal analysis
      </span>
      <span className="font-display text-4xl font-extrabold leading-none tabular-nums text-text">
        74
        <small className="ml-1 font-body text-xs font-normal text-text-weaker">
          / 100 session
        </small>
      </span>
    </div>

    <div className="mt-4 grid gap-3">
      {SCORES.map(({ label, value }) => (
        <div
          key={label}
          className="grid grid-cols-[88px_minmax(0,1fr)_28px] items-center gap-2.5 text-[13px] text-text sm:grid-cols-[96px_minmax(0,1fr)_34px]"
        >
          <span>{label}</span>
          <span className="h-2 overflow-hidden rounded bg-surface-raised">
            <span
              className="block h-full rounded bg-accent"
              style={{ width: `${value}%` }}
            />
          </span>
          <span className="tabular-nums">{value}</span>
        </div>
      ))}
    </div>

    <p className="mt-3.5 text-[13px] text-text-weaker">
      Register: Professional · <span className="tabular-nums">Turn 6</span>
    </p>

    <div className="mt-3.5 rounded-md bg-warning-weak px-3 py-2.5 text-sm">
      <span className="mb-0.5 block font-display text-xs font-semibold text-warning-active">
        Alert
      </span>
      <span className="text-text">Four filler words in this answer.</span>
    </div>

    <div className="mt-3.5 rounded-md bg-accent-weak px-3 py-2.5 text-sm text-text">
      <span className="mb-0.5 block font-display text-xs font-semibold text-accent-active">
        Live tip
      </span>
      Open with the context of the project before the technical detail.
    </div>

    <div className="mt-3.5 text-[13px] text-text-weaker">Frequent tics</div>
    <div className="mt-2 flex flex-wrap gap-1.5">
      {TICS.map((tic) => (
        <span
          key={tic}
          lang="fr"
          className="rounded bg-surface-raised px-2 py-[3px] text-xs tabular-nums text-text"
        >
          {tic}
        </span>
      ))}
    </div>

    <div className="mt-3.5 grid gap-2 border-t border-border pt-3 text-sm text-text">
      <div className="grid grid-cols-[28px_minmax(0,1fr)] gap-2">
        <span className="font-display text-xs font-semibold leading-relaxed text-text-weaker">
          AI
        </span>
        <span lang="fr">
          Parlez-moi d&apos;une erreur que vous avez commise en projet.
        </span>
      </div>
      <div className="grid grid-cols-[28px_minmax(0,1fr)] gap-2">
        <span className="font-display text-xs font-semibold leading-relaxed text-text-weaker">
          You
        </span>
        <span lang="fr">
          Alors en fait, sur mon projet de fin d&apos;année, du coup l&apos;API
          tombait…
        </span>
      </div>
    </div>
  </div>
);

export default VerbalPanelMock;
