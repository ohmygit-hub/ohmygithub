import { describe, expect, it } from 'vitest'
import { mapIssueProjects } from './issues'

describe('mapIssueProjects', () => {
  it('maps a project item and a single-select Priority field', () => {
    const result = mapIssueProjects({
      projectItems: {
        nodes: [
          {
            id: 'item1',
            project: { title: 'Roadmap', url: 'https://github.com/orgs/x/projects/1' },
            fieldValues: {
              nodes: [
                { __typename: 'ProjectV2ItemFieldSingleSelectValue', name: 'High', field: { name: 'Priority' } },
                { __typename: 'ProjectV2ItemFieldTextValue', text: '', field: { name: 'Notes' } }
              ]
            }
          }
        ]
      }
    })
    expect(result).toEqual([
      {
        id: 'item1',
        title: 'Roadmap',
        url: 'https://github.com/orgs/x/projects/1',
        fields: [{ name: 'Priority', value: 'High' }]
      }
    ])
  })

  it('returns an empty array when there are no project items', () => {
    expect(mapIssueProjects({})).toEqual([])
    expect(mapIssueProjects({ projectItems: { nodes: [] } })).toEqual([])
  })
})
