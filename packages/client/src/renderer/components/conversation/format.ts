import type { ConversationActor } from './types'

const compactDateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
})

export function formatConversationDate(value?: string | null): string | null {
  const date = parseConversationDate(value)
  if (!date) return value?.trim() || null

  return compactDateFormatter.format(date)
}

export function toConversationDateTime(value?: string | null): string | undefined {
  return parseConversationDate(value)?.toISOString()
}

export function getActorFallback(actor?: ConversationActor | null): string {
  const login = actor?.login.trim()
  if (!login) return '?'

  return login.slice(0, 1).toUpperCase()
}

export function hasRenderableText(value?: string | null): value is string {
  return Boolean(value?.trim())
}

function parseConversationDate(value?: string | null): Date | null {
  const trimmedValue = value?.trim()
  if (!trimmedValue) return null

  const date = new Date(trimmedValue)
  if (Number.isNaN(date.getTime())) return null

  return date
}
