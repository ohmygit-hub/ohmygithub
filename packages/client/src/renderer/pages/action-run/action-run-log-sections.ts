export interface ActionRunLogStepReference {
  number: number
  name: string
  status?: GitHubActionRunStatus | null
  conclusion?: GitHubActionConclusion | null
  startedAt?: string | null
  completedAt?: string | null
}

export interface ActionRunLogSection {
  content: string
  id: string
  kind: 'step' | 'system'
  step: ActionRunLogStepReference | null
  title: string
}

export interface ActionRunLogStepEntry {
  number: number | null
  title: string
  content: string
}

export interface ActionRunLogInput {
  content: string
  steps?: ActionRunLogStepEntry[] | null
}

const TIMESTAMPED_GROUP_PATTERN = /^(?:\S+\s+)?(?:##\[group\]|::group::)(.*)$/
const TIMESTAMPED_END_GROUP_PATTERN = /^(?:\S+\s+)?(?:##\[endgroup\]|::endgroup::)\s*$/
const LINE_TIMESTAMP_PATTERN = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?)\s/

export function buildActionRunLogSections(
  log: ActionRunLogInput | null,
  steps: ActionRunLogStepReference[],
): ActionRunLogSection[] {
  if (!log) return []

  if (log.steps?.length) {
    return buildSectionsFromStepEntries(log.steps, steps)
  }

  return splitActionJobLogIntoSections(log.content, steps)
}

function buildSectionsFromStepEntries(
  entries: ActionRunLogStepEntry[],
  steps: ActionRunLogStepReference[],
): ActionRunLogSection[] {
  const sections: ActionRunLogSection[] = []

  for (const entry of entries) {
    const content = formatLogLines(entry.content.trimEnd().split(/\r?\n/)).join('\n').trimEnd()
    if (!content.trim()) continue

    const step = entry.number === null
      ? null
      : steps.find((item) => item.number === entry.number) ?? null

    sections.push({
      content,
      id: `step-log:${entry.number ?? entry.title}`,
      kind: 'step',
      step,
      title: step?.name ?? entry.title,
    })
  }

  return sections
}

export function splitActionJobLogIntoSections(
  content: string,
  steps: ActionRunLogStepReference[],
): ActionRunLogSection[] {
  const lines = content.replace(/^\uFEFF/, '').trimEnd().split(/\r?\n/)
  const timedSteps = steps
    .map((step) => ({ step, startedAt: parseTimestamp(step.startedAt) }))
    .filter((item): item is TimedStep => item.startedAt !== null)
    .sort((left, right) => (left.startedAt - right.startedAt) || (left.step.number - right.step.number))

  const sections: ActionRunLogSection[] = []
  let current = createSystemSection()
  let nextIndex = 0

  for (const line of lines) {
    const timestamp = parseTimestamp(line.match(LINE_TIMESTAMP_PATTERN)?.[1] ?? null)

    if (timestamp !== null) {
      // Catch up past steps that started in an earlier second, then enter at
      // most one step per line so steps sharing a start second each keep a
      // section instead of being skipped over.
      while (nextIndex + 1 < timedSteps.length && timedSteps[nextIndex + 1].startedAt <= timestamp - 1000) {
        nextIndex += 1
        flushSection(sections, current)
        current = createStepSection(timedSteps[nextIndex].step)
      }

      if (nextIndex < timedSteps.length && timedSteps[nextIndex].startedAt <= timestamp && current.kind === 'system') {
        flushSection(sections, current)
        current = createStepSection(timedSteps[nextIndex].step)
      } else if (nextIndex + 1 < timedSteps.length && timedSteps[nextIndex + 1].startedAt <= timestamp) {
        nextIndex += 1
        flushSection(sections, current)
        current = createStepSection(timedSteps[nextIndex].step)
      }
    }

    if (TIMESTAMPED_END_GROUP_PATTERN.test(line)) {
      continue
    }

    current.lines.push(formatLogLine(line))
  }

  flushSection(sections, current)

  return sections
}

interface TimedStep {
  step: ActionRunLogStepReference
  startedAt: number
}

function createSystemSection(): MutableLogSection {
  return {
    id: 'system',
    kind: 'system',
    lines: [],
    step: null,
    title: 'Setup / Other',
  }
}

function createStepSection(step: ActionRunLogStepReference): MutableLogSection {
  return {
    id: `step:${step.number}:${step.name}`,
    kind: 'step',
    lines: [],
    step,
    title: step.name,
  }
}

function flushSection(sections: ActionRunLogSection[], section: MutableLogSection): void {
  const content = section.lines.join('\n').trimEnd()
  if (!content) return

  sections.push({
    content,
    id: section.id,
    kind: section.kind,
    step: section.step,
    title: section.title,
  })
}

function formatLogLines(lines: string[]): string[] {
  return lines
    .filter((line) => !TIMESTAMPED_END_GROUP_PATTERN.test(line))
    .map((line) => formatLogLine(line))
}

function formatLogLine(line: string): string {
  const groupTitle = line.match(TIMESTAMPED_GROUP_PATTERN)?.[1]?.trim()

  return groupTitle ? `# ${groupTitle}` : line
}

function parseTimestamp(value: string | null | undefined): number | null {
  if (!value) return null

  const parsed = Date.parse(value)

  return Number.isNaN(parsed) ? null : parsed
}

interface MutableLogSection {
  id: string
  kind: 'step' | 'system'
  lines: string[]
  step: ActionRunLogStepReference | null
  title: string
}
