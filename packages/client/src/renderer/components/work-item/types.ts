export interface WorkItemLabel {
  id?: string | number
  name: string
}

export type WorkItemLabelInput = string | WorkItemLabel

export type WorkItemState =
  | 'open'
  | 'closed'
  | 'completed'
  | 'not_planned'
  | 'draft'
  | 'merged'
  | (string & {})
