import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Recording, WorkspaceConfig } from "@/lib/workspaces/types";
import { isModuleEnabled } from "@/lib/workspaces/fixtures";
import {
  askAlfredPreviewAllowsAction,
  recordingArtifactLabel,
} from "@/lib/workspaces/shell";

function statusLabel(status: Recording["status"]) {
  return status.replace("-", " ");
}

function RecordingsModule({ config }: { config: WorkspaceConfig }) {
  const recordings = config.recordings;

  return (
    <section id="recordings" className="mission-panel scroll-mt-24">
      <header className="mission-panel-header">
        <div>
          <p className="eyebrow">Recordings</p>
          <h2 className="font-heading text-xl">Capture queue</h2>
        </div>
        <Badge variant="outline">Metadata only</Badge>
      </header>
      <div className="space-y-3 p-4">
        {recordings.length === 0 ? (
          <div className="panel-empty py-8">
            <p className="text-sm text-muted-foreground">
              No recordings in this preview. Empty is truthful — nothing was ingested.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {recordings.map((recording) => (
              <li
                key={recording.id}
                className="flex flex-col gap-2 py-3 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="space-y-1">
                  <p className="font-medium">{recording.filename}</p>
                  <p className="font-mono text-[11px] tracking-wider text-muted-foreground uppercase">
                    {statusLabel(recording.status)}
                    {recording.durationSeconds != null
                      ? ` · ${recording.durationSeconds}s listed`
                      : null}
                  </p>
                  {recording.note ? (
                    <p className="text-sm text-muted-foreground">{recording.note}</p>
                  ) : null}
                  <p className="font-mono text-[10px] tracking-wider text-primary uppercase">
                    {recordingArtifactLabel(recording.artifactPresent)}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!recording.artifactPresent}
                >
                  {recording.artifactPresent ? "Open" : "Open (preview)"}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function SubjectsModule({ config }: { config: WorkspaceConfig }) {
  return (
    <section id="subjects" className="mission-panel scroll-mt-24">
      <header className="mission-panel-header">
        <div>
          <p className="eyebrow">Subjects</p>
          <h2 className="font-heading text-xl">Class slots</h2>
        </div>
      </header>
      <div className="space-y-3 p-4">
        {config.subjects.length === 0 ? (
          <div className="panel-empty py-8">
            <p className="text-sm text-muted-foreground">
              No subjects configured for this workspace preview.
            </p>
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {config.subjects.map((subject) => (
              <li
                key={subject.id}
                className="rounded-lg bg-background/60 p-4 ring-1 ring-foreground/10"
              >
                <p className="font-heading text-lg">{subject.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{subject.summary}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function AskAlfredModule() {
  const canAsk = askAlfredPreviewAllowsAction();

  return (
    <section id="ask-alfred" className="mission-panel scroll-mt-24">
      <header className="mission-panel-header">
        <div>
          <p className="eyebrow">Ask Alfred</p>
          <h2 className="font-heading text-xl">Local assistant intake</h2>
        </div>
        <Badge variant="secondary">Preview · offline</Badge>
      </header>
      <div className="space-y-3 p-4">
        <p className="text-sm leading-6 text-muted-foreground">
          Alfred chat, transcription, and retrieval are not connected in this preview.
          The control is visible so the student layout can be reviewed; it does not
          send questions, write storage, or imply recordings are transcribed.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            disabled={!canAsk}
            aria-label="Ask Alfred (preview disabled)"
            placeholder="Unavailable until authenticated Alfred intake exists"
            className="h-10 flex-1 rounded-md border bg-background px-3 text-sm text-muted-foreground"
          />
          <Button disabled={!canAsk}>Ask (preview)</Button>
        </div>
      </div>
    </section>
  );
}

export function StudentDashboard({ config }: { config: WorkspaceConfig }) {
  return (
    <div className="flex flex-col gap-8">
      <section className="space-y-3">
        <p className="eyebrow">Student workspace · shared components</p>
        <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
          {config.displayName}
        </h1>
        <p className="max-w-2xl text-base leading-7 text-muted-foreground">
          {config.tagline}
        </p>
        <p className="font-mono text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
          Owner fixture {config.ownerId} · UI config is not authorization
        </p>
      </section>

      <div className="flex flex-col gap-6">
        {isModuleEnabled(config, "recordings") ? (
          <RecordingsModule config={config} />
        ) : null}
        {isModuleEnabled(config, "subjects") ? (
          <SubjectsModule config={config} />
        ) : null}
        {isModuleEnabled(config, "ask-alfred") ? <AskAlfredModule /> : null}
      </div>
    </div>
  );
}
