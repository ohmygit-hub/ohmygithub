import { describe, expect, it } from 'vitest'
import {
  buildActionRunLogSections,
  splitActionJobLogIntoSections,
  type ActionRunLogStepReference,
} from './action-run-log-sections'

const STEPS: ActionRunLogStepReference[] = [
  createStep(1, 'Set up job', '2026-07-03T10:00:00Z', '2026-07-03T10:00:01Z'),
  createStep(2, 'Checkout', '2026-07-03T10:00:01Z', '2026-07-03T10:00:03Z'),
  createStep(3, 'Build image', '2026-07-03T10:00:04Z', '2026-07-03T10:00:06Z'),
  createStep(6, 'Post Checkout', '2026-07-03T10:00:07Z', '2026-07-03T10:00:07Z'),
  createStep(7, 'Complete job', '2026-07-03T10:00:08Z', '2026-07-03T10:00:08Z'),
]

const LOG_CONTENT = [
  '2026-07-03T10:00:00.1000000Z ##[group]Operating System',
  '2026-07-03T10:00:00.2000000Z Ubuntu 24.04',
  '2026-07-03T10:00:00.3000000Z ##[endgroup]',
  '2026-07-03T10:00:01.5000000Z ##[group]Run actions/checkout@v4',
  '2026-07-03T10:00:02.0000000Z Syncing repository',
  '2026-07-03T10:00:02.5000000Z ##[endgroup]',
  '2026-07-03T10:00:04.1000000Z ##[group]Run docker build .',
  '2026-07-03T10:00:05.0000000Z built ok',
  'continued output without timestamp',
  '2026-07-03T10:00:05.2000000Z ##[endgroup]',
  '2026-07-03T10:00:07.2000000Z Post job cleanup.',
  '2026-07-03T10:00:08.3000000Z Cleaning up orphan processes',
].join('\n')

describe('splitActionJobLogIntoSections', () => {
  it('creates one section per started step using step timestamps, even when step names never appear in the log', () => {
    const sections = splitActionJobLogIntoSections(LOG_CONTENT, STEPS)

    expect(sections.map((section) => section.title)).toEqual([
      'Set up job',
      'Checkout',
      'Build image',
      'Post Checkout',
      'Complete job',
    ])
    expect(sections.map((section) => section.step?.number)).toEqual([1, 2, 3, 6, 7])
  })

  it('assigns lines to the step whose time window contains them', () => {
    const sections = splitActionJobLogIntoSections(LOG_CONTENT, STEPS)

    const checkout = sections.find((section) => section.title === 'Checkout')
    expect(checkout?.content).toContain('Syncing repository')

    const postCheckout = sections.find((section) => section.title === 'Post Checkout')
    expect(postCheckout?.content).toBe('2026-07-03T10:00:07.2000000Z Post job cleanup.')

    const completeJob = sections.find((section) => section.title === 'Complete job')
    expect(completeJob?.content).toBe('2026-07-03T10:00:08.3000000Z Cleaning up orphan processes')
  })

  it('keeps lines without a timestamp in the current section', () => {
    const sections = splitActionJobLogIntoSections(LOG_CONTENT, STEPS)

    const build = sections.find((section) => section.title === 'Build image')
    expect(build?.content).toContain('continued output without timestamp')
  })

  it('renders group markers as headings and drops endgroup markers', () => {
    const sections = splitActionJobLogIntoSections(LOG_CONTENT, STEPS)

    const setUp = sections.find((section) => section.title === 'Set up job')
    expect(setUp?.content).toBe('# Operating System\n2026-07-03T10:00:00.2000000Z Ubuntu 24.04')
  })

  it('collects lines before the first step into a system section', () => {
    const content = [
      '2026-07-03T09:59:59.0000000Z Waiting for a runner to pick up this job...',
      '2026-07-03T10:00:00.1000000Z runner assigned',
    ].join('\n')

    const sections = splitActionJobLogIntoSections(content, STEPS)

    expect(sections[0].kind).toBe('system')
    expect(sections[0].content).toBe('2026-07-03T09:59:59.0000000Z Waiting for a runner to pick up this job...')
    expect(sections[1].title).toBe('Set up job')
  })

  it('assigns trailing lines to an in-progress final step without completedAt', () => {
    const steps = [
      createStep(1, 'Set up job', '2026-07-03T10:00:00Z', '2026-07-03T10:00:01Z'),
      createStep(2, 'Long build', '2026-07-03T10:00:02Z', null),
    ]
    const content = [
      '2026-07-03T10:00:00.5000000Z setup line',
      '2026-07-03T10:00:02.5000000Z building...',
      '2026-07-03T10:05:00.0000000Z still building...',
    ].join('\n')

    const sections = splitActionJobLogIntoSections(content, steps)

    expect(sections.map((section) => section.title)).toEqual(['Set up job', 'Long build'])
    expect(sections[1].content).toBe('2026-07-03T10:00:02.5000000Z building...\n2026-07-03T10:05:00.0000000Z still building...')
  })

  it('strips a leading BOM so the first line still matches its step', () => {
    const content = '﻿2026-07-03T10:00:00.0370188Z Current runner version: \'2.335.1\''

    const sections = splitActionJobLogIntoSections(content, STEPS)

    expect(sections).toHaveLength(1)
    expect(sections[0].title).toBe('Set up job')
  })

  it('ignores steps that never started', () => {
    const steps = [
      createStep(1, 'Set up job', '2026-07-03T10:00:00Z', '2026-07-03T10:00:01Z'),
      createStep(2, 'Skipped step', null, null),
    ]
    const content = '2026-07-03T10:00:00.5000000Z setup line'

    const sections = splitActionJobLogIntoSections(content, steps)

    expect(sections.map((section) => section.title)).toEqual(['Set up job'])
  })
})

describe('buildActionRunLogSections', () => {
  it('prefers structured per-step log entries when the log provides them', () => {
    const sections = buildActionRunLogSections(
      {
        content: 'unused combined text',
        steps: [
          { number: 1, title: 'Set up job', content: '2026-07-03T10:00:00.1000000Z setup line' },
          { number: 3, title: 'Build image', content: '2026-07-03T10:00:04.1000000Z build line' },
        ],
      },
      STEPS,
    )

    expect(sections.map((section) => section.title)).toEqual(['Set up job', 'Build image'])
    expect(sections[1].step?.number).toBe(3)
    expect(sections[1].step?.conclusion).toBe('success')
    expect(sections[1].content).toContain('build line')
  })

  it('skips structured entries with empty content', () => {
    const sections = buildActionRunLogSections(
      {
        content: '',
        steps: [
          { number: 1, title: 'Set up job', content: '2026-07-03T10:00:00.1000000Z setup line' },
          { number: 2, title: 'Checkout', content: '   \n' },
        ],
      },
      STEPS,
    )

    expect(sections.map((section) => section.title)).toEqual(['Set up job'])
  })

  it('falls back to timestamp splitting when the log has no structured entries', () => {
    const sections = buildActionRunLogSections({ content: LOG_CONTENT, steps: undefined }, STEPS)

    expect(sections.map((section) => section.title)).toEqual([
      'Set up job',
      'Checkout',
      'Build image',
      'Post Checkout',
      'Complete job',
    ])
  })

  it('returns no sections without a log', () => {
    expect(buildActionRunLogSections(null, STEPS)).toEqual([])
  })
})

function createStep(
  number: number,
  name: string,
  startedAt: string | null,
  completedAt: string | null,
): ActionRunLogStepReference {
  return {
    number,
    name,
    status: 'completed',
    conclusion: 'success',
    startedAt,
    completedAt,
  }
}
