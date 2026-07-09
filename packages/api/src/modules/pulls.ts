import type { GitHubOctokit } from '../transport'
import type {
  ClosePullRequestOptions,
  CreatePullRequestCommentOptions,
  GetPullRequestDetailOptions,
  RequestPullRequestReviewersOptions,
  GitHubActor,
  GitHubCiState,
  GitHubCommitFile,
  GitHubIssueMilestone,
  GitHubIssueProjectItem,
  GitHubIssueReaction,
  GitHubReactionUser,
  GitHubIssueSubscription,
  GitHubPullRequest,
  GitHubPullRequestComment,
  GitHubPullRequestCommitSummary,
  GitHubPullRequestDetail,
  GitHubPullRequestLinkedIssue,
  GitHubPullRequestMergeMethod,
  GitHubPullRequestReviewComment,
  GitHubPullRequestReviewDecision,
  GitHubPullRequestReviewRequest,
  GitHubPullRequestReviewState,
  GitHubPullRequestReviewSummary,
  GitHubPullRequestReviewerType,
  GitHubPullRequestSearchResult,
  GitHubPullRequestSearchState,
  GitHubPullRequestState,
  GitHubPullRequestTimelineEvent,
  GitHubPullRequestTimelineReference,
  GitHubRepositoryCommitPage,
  ListPullRequestCategoryOptions,
  ListPullRequestCommitsOptions,
  ListRepositoryWorkspaceItemsOptions,
  ListWorkspaceItemsOptions,
  MarkPullRequestReadyForReviewOptions,
  MergePullRequestOptions,
  SearchRepositoryPullRequestsOptions,
  SubmitPullRequestReviewOptions,
  UpdatePullRequestCommentOptions,
  UpdatePullRequestOptions
} from '../types'
import {
  createWorkItemKey,
  listInboxWorkItemReferences,
  listUnreadWorkItemKeys,
  mapLabels,
  normalizeActor,
  normalizeLimit,
  splitRepositoryName,
  type GraphQLWorkItemBase
} from './work-items'
import {
  fetchCommitCiStates,
  mapRepositoryCommit,
  type CommitListItemResponse
} from './repositories'

interface GraphQLPullRequestNode extends GraphQLWorkItemBase {
  isDraft: boolean
  merged: boolean
  statusCheckRollup?: {
    state?: string | null
  } | null
}

interface GraphQLActorNode {
  __typename?: string | null
  login: string
  avatarUrl?: string | null
}

interface GraphQLTeamReviewerNode {
  __typename?: string
  slug?: string | null
  name?: string | null
  avatarUrl?: string | null
}

type GraphQLReviewerNode = (GraphQLActorNode & { __typename?: string }) | GraphQLTeamReviewerNode

interface GraphQLReactionGroup {
  content: string
  reactors: {
    totalCount: number
    nodes?: Array<GraphQLReactorNode | null> | null
  }
  viewerHasReacted?: boolean
}

interface GraphQLReactorNode {
  login?: string | null
  name?: string | null
  avatarUrl?: string | null
}

interface GraphQLMilestoneNode {
  id: string
  number: number
  title: string
  description?: string | null
  dueOn?: string | null
  state: string
  url: string
}

interface GraphQLIssueCommentNode {
  id: string
  databaseId?: number | null
  body: string
  createdAt: string
  updatedAt: string
  authorAssociation: string
  url: string
  author: GraphQLActorNode | null
  reactionGroups?: GraphQLReactionGroup[] | null
  viewerCanUpdate?: boolean | null
}

interface RestIssueCommentNode {
  id: number
  node_id?: string | null
  body?: string | null
  created_at?: string | null
  updated_at?: string | null
  author_association?: string | null
  html_url?: string | null
  user?: {
    login?: string | null
    avatar_url?: string | null
  } | null
}

interface GraphQLRepositoryNode {
  nameWithOwner: string
  url: string
}

interface GraphQLLinkedIssueNode {
  id: string
  title: string
  number: number
  state: string
  stateReason?: string | null
  url: string
  repository: {
    nameWithOwner: string
  }
}

interface GraphQLReviewRequestNode {
  id: string
  asCodeOwner: boolean
  requestedReviewer?: GraphQLReviewerNode | null
}

interface GraphQLPullRequestReviewNode {
  id: string
  body: string
  createdAt: string
  updatedAt: string
  submittedAt?: string | null
  authorAssociation: string
  url: string
  state: string
  author: GraphQLActorNode | null
}

interface GraphQLReviewCommentNode {
  id: string
  body: string
  createdAt: string
  updatedAt: string
  url?: string | null
  path: string
  diffHunk?: string | null
  line?: number | null
  originalLine?: number | null
  startLine?: number | null
  outdated?: boolean | null
  replyTo?: { id: string } | null
  author: GraphQLActorNode | null
  reactionGroups?: GraphQLReactionGroup[] | null
}

interface GraphQLTimelineSourceNode {
  __typename?: string
  title?: string | null
  number?: number | null
  url?: string | null
  repository?: {
    nameWithOwner: string
  } | null
}

interface GraphQLCommitNode {
  oid?: string | null
  abbreviatedOid?: string | null
  messageHeadline?: string | null
  authoredDate?: string | null
  committedDate?: string | null
  author?: GraphQLGitActorNode | null
  statusCheckRollup?: {
    state?: string | null
  } | null
  url?: string | null
}

interface GraphQLGitActorNode {
  name?: string | null
  avatarUrl?: string | null
  user?: GraphQLActorNode | null
}

interface GraphQLPullRequestTimelineNode {
  __typename?: string
  id?: string | null
  actor?: GraphQLActorNode | null
  createdAt?: string | null
  body?: string | null
  text?: string | null
  url?: string | null
  state?: string | null
  author?: GraphQLActorNode | null
  authorAssociation?: string | null
  submittedAt?: string | null
  assignee?: GraphQLActorNode | null
  label?: {
    name?: string | null
  } | null
  milestoneTitle?: string | null
  previousTitle?: string | null
  currentTitle?: string | null
  currentRefName?: string | null
  previousRefName?: string | null
  refName?: string | null
  ref?: {
    name?: string | null
  } | null
  baseRefName?: string | null
  headRefName?: string | null
  mergeRefName?: string | null
  oldBase?: string | null
  newBase?: string | null
  reason?: string | null
  beforeCommit?: GraphQLCommitNode | null
  afterCommit?: GraphQLCommitNode | null
  mergeRef?: {
    name?: string | null
  } | null
  mergeQueue?: {
    url?: string | null
  } | null
  commit?: GraphQLCommitNode | null
  requestedReviewer?: GraphQLReviewerNode | null
  dismissalMessage?: string | null
  previousReviewState?: string | null
  review?: GraphQLPullRequestReviewNode | null
  source?: GraphQLTimelineSourceNode | null
  subject?: GraphQLTimelineSourceNode | null
  comments?: {
    nodes?: Array<GraphQLReviewCommentNode | null> | null
  } | null
  lockReason?: string | null
  fromRepository?: {
    nameWithOwner?: string | null
  } | null
  canonical?: GraphQLTimelineSourceNode | null
  deployment?: {
    environment?: string | null
  } | null
  deploymentStatus?: {
    state?: string | null
    deployment?: {
      environment?: string | null
    } | null
  } | null
  discussion?: {
    title?: string | null
    number?: number | null
    url?: string | null
  } | null
  project?: {
    title?: string | null
    url?: string | null
  } | null
  previousStatus?: string | null
  status?: string | null
}

interface GraphQLPullRequestDetailNode extends GraphQLPullRequestNode {
  createdAt: string
  closedAt?: string | null
  mergedAt?: string | null
  mergedBy?: GraphQLActorNode | null
  body: string
  additions: number
  deletions: number
  changedFiles: number
  checksUrl?: string | null
  headRefOid?: string | null
  baseRefName: string
  headRefName: string
  baseRepository?: GraphQLRepositoryNode | null
  headRepository?: GraphQLRepositoryNode | null
  isCrossRepository: boolean
  maintainerCanModify: boolean
  mergeable?: string | null
  mergeStateStatus?: string | null
  reviewDecision?: string | null
  assignees?: {
    nodes?: Array<GraphQLActorNode | null> | null
  } | null
  milestone?: GraphQLMilestoneNode | null
  participants?: {
    nodes?: Array<GraphQLActorNode | null> | null
  } | null
  reviewRequests?: {
    nodes?: Array<GraphQLReviewRequestNode | null> | null
  } | null
  latestReviews?: {
    nodes?: Array<GraphQLPullRequestReviewNode | null> | null
  } | null
  closingIssuesReferences?: {
    nodes?: Array<GraphQLLinkedIssueNode | null> | null
  } | null
  comments?: {
    nodes?: Array<GraphQLIssueCommentNode | null> | null
  } | null
  timelineItems?: {
    nodes?: Array<GraphQLPullRequestTimelineNode | null> | null
  } | null
  reactionGroups?: GraphQLReactionGroup[] | null
  viewerCanUpdate?: boolean | null
  viewerCanClose?: boolean | null
  viewerCanReopen?: boolean | null
  viewerCanMergeAsAdmin?: boolean | null
  locked?: boolean | null
  viewerSubscription?: string | null
  projectItems?: {
    nodes?: Array<{
      id: string
      project?: { title: string, url?: string | null } | null
      fieldValues?: {
        nodes?: Array<{
          __typename?: string
          name?: string | null
          text?: string | null
          number?: number | null
          field?: { name?: string | null } | null
        } | null> | null
      } | null
    } | null> | null
  } | null
}

interface ViewerPullRequestsResponse {
  search: {
    nodes?: Array<GraphQLPullRequestNode | null> | null
  }
}

interface RepositoryPullRequestsResponse {
  repository: {
    pullRequests: {
      nodes?: Array<GraphQLPullRequestNode | null> | null
    }
  } | null
}

interface PullRequestByNumberResponse {
  repository: {
    pullRequest: GraphQLPullRequestNode | null
  } | null
}

interface PullRequestNodesResponse {
  nodes?: Array<GraphQLPullRequestNode | null> | null
}

interface MarkPullRequestReadyForReviewResponse {
  markPullRequestReadyForReview?: {
    pullRequest?: {
      id: string
    } | null
  } | null
}

interface PullRequestDetailResponse {
  repository: {
    pullRequest: GraphQLPullRequestDetailNode | null
    mergeCommitAllowed?: boolean | null
    squashMergeAllowed?: boolean | null
    rebaseMergeAllowed?: boolean | null
    viewerDefaultMergeMethod?: string | null
  } | null
}

interface SearchPullRequestItem {
  node_id?: string | null
}

interface SearchPullRequestsResponse {
  incomplete_results?: boolean
  items?: SearchPullRequestItem[]
  total_count?: number
}

const pullRequestFields = `
  fragment PullRequestFields on PullRequest {
    id
    title
    number
    state
    url
    updatedAt
    isDraft
    merged
    author {
      __typename
      login
      avatarUrl
    }
    repository {
      nameWithOwner
    }
    labels(first: 8) {
      nodes {
        name
        color
        description
      }
    }
    statusCheckRollup {
      state
    }
  }
`

const viewerPullRequestsQuery = `
  query ViewerPullRequests($searchQuery: String!, $first: Int!) {
    search(query: $searchQuery, type: ISSUE, first: $first) {
      nodes {
        ...PullRequestFields
      }
    }
  }

  ${pullRequestFields}
`

const repositoryPullRequestsQuery = `
  query RepositoryPullRequests($owner: String!, $repo: String!, $first: Int!) {
    repository(owner: $owner, name: $repo) {
      pullRequests(first: $first, states: [OPEN], orderBy: { field: CREATED_AT, direction: DESC }) {
        nodes {
          ...PullRequestFields
        }
      }
    }
  }

  ${pullRequestFields}
`

const pullRequestByNumberQuery = `
  query PullRequestByNumber($owner: String!, $repo: String!, $number: Int!) {
    repository(owner: $owner, name: $repo) {
      pullRequest(number: $number) {
        ...PullRequestFields
      }
    }
  }

  ${pullRequestFields}
`

const pullRequestNodesQuery = `
  query PullRequestNodes($ids: [ID!]!) {
    nodes(ids: $ids) {
      ...PullRequestFields
    }
  }

  ${pullRequestFields}
`

const pullRequestDetailQuery = `
  query PullRequestDetail($owner: String!, $repo: String!, $number: Int!) {
    repository(owner: $owner, name: $repo) {
      pullRequest(number: $number) {
        ...PullRequestFields
        createdAt
        closedAt
        mergedAt
        mergedBy {
          __typename
          login
          avatarUrl
        }
        body
        additions
        deletions
        changedFiles
        checksUrl
        headRefOid
        baseRefName
        headRefName
        baseRepository {
          nameWithOwner
          url
        }
        headRepository {
          nameWithOwner
          url
        }
        isCrossRepository
        maintainerCanModify
        mergeable
        mergeStateStatus
        reviewDecision
        assignees(first: 10) {
          nodes {
            login
            avatarUrl
          }
        }
        milestone {
          id
          number
          title
          description
          dueOn
          state
          url
        }
        participants(first: 10) {
          nodes {
            login
            avatarUrl
          }
        }
        reviewRequests(first: 10) {
          nodes {
            id
            asCodeOwner
            requestedReviewer {
              __typename
              ... on User {
                login
                avatarUrl
              }
              ... on Mannequin {
                login
                avatarUrl
              }
              ... on Team {
                slug
                name
                avatarUrl
              }
            }
          }
        }
        latestReviews(first: 10) {
          nodes {
            id
            body
            createdAt
            updatedAt
            submittedAt
            authorAssociation
            url
            state
            author {
              __typename
              login
              avatarUrl
            }
          }
        }
        closingIssuesReferences(first: 10) {
          nodes {
            id
            title
            number
            state
            stateReason
            url
            repository {
              nameWithOwner
            }
          }
        }
        comments(last: 100) {
          nodes {
            id
            databaseId
            body
            createdAt
            updatedAt
            authorAssociation
            url
            viewerCanUpdate
            author {
              __typename
              login
              avatarUrl
            }
            reactionGroups {
              content
              reactors(first: 20) {
                totalCount
                nodes {
                  ... on User {
                    login
                    name
                    avatarUrl
                  }
                  ... on Bot {
                    login
                    avatarUrl
                  }
                  ... on Mannequin {
                    login
                    avatarUrl
                  }
                  ... on Organization {
                    login
                    name
                    avatarUrl
                  }
                }
              }
              viewerHasReacted
            }
          }
        }
        timelineItems(
          first: 80
          itemTypes: [
            ASSIGNED_EVENT
            UNASSIGNED_EVENT
            LABELED_EVENT
            UNLABELED_EVENT
            CLOSED_EVENT
            REOPENED_EVENT
            RENAMED_TITLE_EVENT
            CROSS_REFERENCED_EVENT
            MENTIONED_EVENT
            REVIEW_REQUESTED_EVENT
            REVIEW_REQUEST_REMOVED_EVENT
            REVIEW_DISMISSED_EVENT
            READY_FOR_REVIEW_EVENT
            CONVERT_TO_DRAFT_EVENT
            PULL_REQUEST_COMMIT
            MERGED_EVENT
            BASE_REF_CHANGED_EVENT
            BASE_REF_DELETED_EVENT
            BASE_REF_FORCE_PUSHED_EVENT
            HEAD_REF_DELETED_EVENT
            HEAD_REF_FORCE_PUSHED_EVENT
            HEAD_REF_RESTORED_EVENT
            AUTOMATIC_BASE_CHANGE_FAILED_EVENT
            AUTOMATIC_BASE_CHANGE_SUCCEEDED_EVENT
            AUTO_MERGE_ENABLED_EVENT
            AUTO_MERGE_DISABLED_EVENT
            AUTO_REBASE_ENABLED_EVENT
            AUTO_SQUASH_ENABLED_EVENT
            ADDED_TO_MERGE_QUEUE_EVENT
            REMOVED_FROM_MERGE_QUEUE_EVENT
            MILESTONED_EVENT
            DEMILESTONED_EVENT
            CONNECTED_EVENT
            DISCONNECTED_EVENT
            COMMENT_DELETED_EVENT
            REFERENCED_EVENT
            PULL_REQUEST_REVIEW
            LOCKED_EVENT
            UNLOCKED_EVENT
            PINNED_EVENT
            UNPINNED_EVENT
            TRANSFERRED_EVENT
            MARKED_AS_DUPLICATE_EVENT
            UNMARKED_AS_DUPLICATE_EVENT
            DEPLOYED_EVENT
            DEPLOYMENT_ENVIRONMENT_CHANGED_EVENT
            CONVERTED_TO_DISCUSSION_EVENT
            ADDED_TO_PROJECT_V2_EVENT
            REMOVED_FROM_PROJECT_V2_EVENT
            PROJECT_V2_ITEM_STATUS_CHANGED_EVENT
          ]
        ) {
          nodes {
            __typename
            ... on AssignedEvent {
              id
              actor {
                __typename
                login
                avatarUrl
              }
              createdAt
              assignee {
                ... on Bot {
                  login
                  avatarUrl
                }
                ... on Mannequin {
                  login
                  avatarUrl
                }
                ... on Organization {
                  login
                  avatarUrl
                }
                ... on User {
                  login
                  avatarUrl
                }
              }
            }
            ... on UnassignedEvent {
              id
              actor {
                __typename
                login
                avatarUrl
              }
              createdAt
              assignee {
                ... on Bot {
                  login
                  avatarUrl
                }
                ... on Mannequin {
                  login
                  avatarUrl
                }
                ... on Organization {
                  login
                  avatarUrl
                }
                ... on User {
                  login
                  avatarUrl
                }
              }
            }
            ... on LabeledEvent {
              id
              actor {
                __typename
                login
                avatarUrl
              }
              createdAt
              label {
                name
              }
            }
            ... on UnlabeledEvent {
              id
              actor {
                __typename
                login
                avatarUrl
              }
              createdAt
              label {
                name
              }
            }
            ... on ClosedEvent {
              id
              actor {
                __typename
                login
                avatarUrl
              }
              createdAt
            }
            ... on ReopenedEvent {
              id
              actor {
                __typename
                login
                avatarUrl
              }
              createdAt
            }
            ... on RenamedTitleEvent {
              id
              actor {
                __typename
                login
                avatarUrl
              }
              createdAt
              previousTitle
              currentTitle
            }
            ... on CrossReferencedEvent {
              id
              actor {
                __typename
                login
                avatarUrl
              }
              createdAt
              source {
                __typename
                ... on Issue {
                  title
                  number
                  url
                  repository {
                    nameWithOwner
                  }
                }
                ... on PullRequest {
                  title
                  number
                  url
                  repository {
                    nameWithOwner
                  }
                }
              }
            }
            ... on MentionedEvent {
              id
              actor {
                __typename
                login
                avatarUrl
              }
              createdAt
            }
            ... on PullRequestReview {
              id
              body
              createdAt
              updatedAt
              submittedAt
              authorAssociation
              url
              state
              author {
                __typename
                login
                avatarUrl
              }
              comments(first: 50) {
                nodes {
                  id
                  body
                  createdAt
                  updatedAt
                  url
                  path
                  diffHunk
                  line
                  originalLine
                  startLine
                  outdated
                  replyTo {
                    id
                  }
                  author {
                    __typename
                    login
                    avatarUrl
                  }
                  reactionGroups {
                    content
                    reactors(first: 20) {
                      totalCount
                      nodes {
                        ... on User {
                          login
                          name
                          avatarUrl
                        }
                        ... on Bot {
                          login
                          avatarUrl
                        }
                        ... on Mannequin {
                          login
                          avatarUrl
                        }
                        ... on Organization {
                          login
                          name
                          avatarUrl
                        }
                      }
                    }
                    viewerHasReacted
                  }
                }
              }
            }
            ... on ReviewRequestedEvent {
              id
              actor {
                __typename
                login
                avatarUrl
              }
              createdAt
              requestedReviewer {
                __typename
                ... on User {
                  login
                  avatarUrl
                }
                ... on Mannequin {
                  login
                  avatarUrl
                }
                ... on Team {
                  slug
                  name
                  avatarUrl
                }
              }
            }
            ... on ReviewRequestRemovedEvent {
              id
              actor {
                __typename
                login
                avatarUrl
              }
              createdAt
              requestedReviewer {
                __typename
                ... on User {
                  login
                  avatarUrl
                }
                ... on Mannequin {
                  login
                  avatarUrl
                }
                ... on Team {
                  slug
                  name
                  avatarUrl
                }
              }
            }
            ... on ReviewDismissedEvent {
              id
              actor {
                __typename
                login
                avatarUrl
              }
              createdAt
              dismissalMessage
              previousReviewState
              url
              review {
                id
                body
                createdAt
                updatedAt
                submittedAt
                authorAssociation
                url
                state
                author {
                  __typename
                  login
                  avatarUrl
                }
              }
            }
            ... on ReadyForReviewEvent {
              id
              actor {
                __typename
                login
                avatarUrl
              }
              createdAt
              url
            }
            ... on ConvertToDraftEvent {
              id
              actor {
                __typename
                login
                avatarUrl
              }
              createdAt
              url
            }
            ... on PullRequestCommit {
              id
              url
              commit {
                oid
                abbreviatedOid
                messageHeadline
                authoredDate
                committedDate
                url
                statusCheckRollup {
                  state
                }
                author {
                  name
                  avatarUrl
                  user {
                    login
                    avatarUrl
                  }
                }
              }
            }
            ... on MergedEvent {
              id
              actor {
                __typename
                login
                avatarUrl
              }
              createdAt
              mergeRefName
              url
              commit {
                oid
                abbreviatedOid
                url
              }
            }
            ... on BaseRefChangedEvent {
              id
              actor {
                __typename
                login
                avatarUrl
              }
              createdAt
              previousRefName
              currentRefName
            }
            ... on BaseRefDeletedEvent {
              id
              actor {
                __typename
                login
                avatarUrl
              }
              createdAt
              baseRefName
            }
            ... on BaseRefForcePushedEvent {
              id
              actor {
                __typename
                login
                avatarUrl
              }
              createdAt
              ref {
                name
              }
              beforeCommit {
                oid
                abbreviatedOid
                url
              }
              afterCommit {
                oid
                abbreviatedOid
                url
              }
            }
            ... on HeadRefDeletedEvent {
              id
              actor {
                __typename
                login
                avatarUrl
              }
              createdAt
              headRefName
            }
            ... on HeadRefForcePushedEvent {
              id
              actor {
                __typename
                login
                avatarUrl
              }
              createdAt
              ref {
                name
              }
              beforeCommit {
                oid
                abbreviatedOid
                url
              }
              afterCommit {
                oid
                abbreviatedOid
                url
              }
            }
            ... on HeadRefRestoredEvent {
              id
              actor {
                __typename
                login
                avatarUrl
              }
              createdAt
            }
            ... on AutomaticBaseChangeFailedEvent {
              id
              actor {
                __typename
                login
                avatarUrl
              }
              createdAt
              oldBase
              newBase
            }
            ... on AutomaticBaseChangeSucceededEvent {
              id
              actor {
                __typename
                login
                avatarUrl
              }
              createdAt
              oldBase
              newBase
            }
            ... on AutoMergeEnabledEvent {
              id
              actor {
                __typename
                login
                avatarUrl
              }
              createdAt
            }
            ... on AutoMergeDisabledEvent {
              id
              actor {
                __typename
                login
                avatarUrl
              }
              createdAt
              reason
            }
            ... on AutoRebaseEnabledEvent {
              id
              actor {
                __typename
                login
                avatarUrl
              }
              createdAt
            }
            ... on AutoSquashEnabledEvent {
              id
              actor {
                __typename
                login
                avatarUrl
              }
              createdAt
            }
            ... on AddedToMergeQueueEvent {
              id
              actor {
                __typename
                login
                avatarUrl
              }
              createdAt
              mergeQueue {
                url
              }
            }
            ... on RemovedFromMergeQueueEvent {
              id
              actor {
                __typename
                login
                avatarUrl
              }
              createdAt
              reason
              beforeCommit {
                oid
                abbreviatedOid
                url
              }
              mergeQueue {
                url
              }
            }
            ... on MilestonedEvent {
              id
              actor {
                __typename
                login
                avatarUrl
              }
              createdAt
              milestoneTitle
            }
            ... on DemilestonedEvent {
              id
              actor {
                __typename
                login
                avatarUrl
              }
              createdAt
              milestoneTitle
            }
            ... on ConnectedEvent {
              id
              actor {
                __typename
                login
                avatarUrl
              }
              createdAt
              source {
                __typename
                ... on Issue {
                  title
                  number
                  url
                  repository {
                    nameWithOwner
                  }
                }
                ... on PullRequest {
                  title
                  number
                  url
                  repository {
                    nameWithOwner
                  }
                }
              }
              subject {
                __typename
                ... on Issue {
                  title
                  number
                  url
                  repository {
                    nameWithOwner
                  }
                }
                ... on PullRequest {
                  title
                  number
                  url
                  repository {
                    nameWithOwner
                  }
                }
              }
            }
            ... on DisconnectedEvent {
              id
              actor {
                __typename
                login
                avatarUrl
              }
              createdAt
              source {
                __typename
                ... on Issue {
                  title
                  number
                  url
                  repository {
                    nameWithOwner
                  }
                }
                ... on PullRequest {
                  title
                  number
                  url
                  repository {
                    nameWithOwner
                  }
                }
              }
              subject {
                __typename
                ... on Issue {
                  title
                  number
                  url
                  repository {
                    nameWithOwner
                  }
                }
                ... on PullRequest {
                  title
                  number
                  url
                  repository {
                    nameWithOwner
                  }
                }
              }
            }
            ... on CommentDeletedEvent {
              id
              actor {
                __typename
                login
                avatarUrl
              }
              createdAt
            }
            ... on ReferencedEvent {
              id
              actor {
                __typename
                login
                avatarUrl
              }
              createdAt
              commit {
                oid
                abbreviatedOid
                url
              }
              subject {
                __typename
                ... on Issue {
                  title
                  number
                  url
                  repository {
                    nameWithOwner
                  }
                }
                ... on PullRequest {
                  title
                  number
                  url
                  repository {
                    nameWithOwner
                  }
                }
              }
            }
            ... on LockedEvent {
              id
              actor {
                __typename
                login
                avatarUrl
              }
              createdAt
              lockReason
            }
            ... on UnlockedEvent {
              id
              actor {
                __typename
                login
                avatarUrl
              }
              createdAt
            }
            ... on PinnedEvent {
              id
              actor {
                __typename
                login
                avatarUrl
              }
              createdAt
            }
            ... on UnpinnedEvent {
              id
              actor {
                __typename
                login
                avatarUrl
              }
              createdAt
            }
            ... on TransferredEvent {
              id
              actor {
                __typename
                login
                avatarUrl
              }
              createdAt
              fromRepository {
                nameWithOwner
              }
            }
            ... on MarkedAsDuplicateEvent {
              id
              actor {
                __typename
                login
                avatarUrl
              }
              createdAt
              canonical {
                __typename
                ... on Issue {
                  title
                  number
                  url
                  repository {
                    nameWithOwner
                  }
                }
                ... on PullRequest {
                  title
                  number
                  url
                  repository {
                    nameWithOwner
                  }
                }
              }
            }
            ... on UnmarkedAsDuplicateEvent {
              id
              actor {
                __typename
                login
                avatarUrl
              }
              createdAt
              canonical {
                __typename
                ... on Issue {
                  title
                  number
                  url
                  repository {
                    nameWithOwner
                  }
                }
                ... on PullRequest {
                  title
                  number
                  url
                  repository {
                    nameWithOwner
                  }
                }
              }
            }
            ... on DeployedEvent {
              id
              actor {
                __typename
                login
                avatarUrl
              }
              createdAt
              deployment {
                environment
              }
            }
            ... on DeploymentEnvironmentChangedEvent {
              id
              actor {
                __typename
                login
                avatarUrl
              }
              createdAt
              deploymentStatus {
                state
                deployment {
                  environment
                }
              }
            }
            ... on ConvertedToDiscussionEvent {
              id
              actor {
                __typename
                login
                avatarUrl
              }
              createdAt
              discussion {
                title
                number
                url
              }
            }
            ... on AddedToProjectV2Event {
              id
              actor {
                __typename
                login
                avatarUrl
              }
              createdAt
              project {
                title
                url
              }
            }
            ... on RemovedFromProjectV2Event {
              id
              actor {
                __typename
                login
                avatarUrl
              }
              createdAt
              project {
                title
                url
              }
            }
            ... on ProjectV2ItemStatusChangedEvent {
              id
              actor {
                __typename
                login
                avatarUrl
              }
              createdAt
              previousStatus
              status
              project {
                title
                url
              }
            }
          }
        }
        reactionGroups {
          content
          reactors(first: 20) {
            totalCount
            nodes {
              ... on User {
                login
                name
                avatarUrl
              }
              ... on Bot {
                login
                avatarUrl
              }
              ... on Mannequin {
                login
                avatarUrl
              }
              ... on Organization {
                login
                name
                avatarUrl
              }
            }
          }
          viewerHasReacted
        }
        viewerCanUpdate
        viewerCanClose
        viewerCanReopen
        viewerCanMergeAsAdmin
        locked
        viewerSubscription
        projectItems(first: 10) {
          nodes {
            id
            project { title url }
            fieldValues(first: 20) {
              nodes {
                __typename
                ... on ProjectV2ItemFieldSingleSelectValue { name field { ... on ProjectV2SingleSelectField { name } } }
                ... on ProjectV2ItemFieldTextValue { text field { ... on ProjectV2FieldCommon { name } } }
                ... on ProjectV2ItemFieldNumberValue { number field { ... on ProjectV2FieldCommon { name } } }
              }
            }
          }
        }
      }
      mergeCommitAllowed
      squashMergeAllowed
      rebaseMergeAllowed
      viewerDefaultMergeMethod
    }
  }

  ${pullRequestFields}
`

const markPullRequestReadyForReviewMutation = `
  mutation MarkPullRequestReadyForReview($pullRequestId: ID!) {
    markPullRequestReadyForReview(input: { pullRequestId: $pullRequestId }) {
      pullRequest {
        id
      }
    }
  }
`

const MAX_SEARCH_RESULTS = 1000

export class PullsApi {
  constructor(private readonly octokit: GitHubOctokit) {}

  async listPullRequestCategory(options: ListPullRequestCategoryOptions): Promise<GitHubPullRequest[]> {
    const limit = normalizeLimit(options.limit)
    const { data: viewer } = await this.octokit.rest.users.getAuthenticated()

    if (options.category === 'inbox') {
      const references = await listInboxWorkItemReferences(this.octokit, 'pull-request', limit)
      const unreadKeys = await listUnreadWorkItemKeys(this.octokit)
      const nodes = await Promise.all(
        references.map((reference) => this.fetchPullRequestByReference(reference).catch(() => null))
      )

      return dedupePullRequests(mapPullRequestNodes(nodes.filter(isOpenPullRequestNode), unreadKeys)).slice(0, limit)
    }

    return this.searchPullRequests(categorySearchQuery(options.category, viewer.login), limit)
  }

  async listViewerPullRequests(options: ListWorkspaceItemsOptions = {}): Promise<GitHubPullRequest[]> {
    const limit = normalizeLimit(options.limit)
    const { data: viewer } = await this.octokit.rest.users.getAuthenticated()
    return this.searchPullRequests(
      `is:pr is:open archived:false involves:${viewer.login} sort:updated-desc`,
      limit
    )
  }

  async listRepositoryPullRequests(options: ListRepositoryWorkspaceItemsOptions): Promise<GitHubPullRequest[]> {
    const limit = normalizeLimit(options.limit)
    const response = await this.octokit.graphql<RepositoryPullRequestsResponse>(
      repositoryPullRequestsQuery,
      {
        owner: options.owner,
        repo: options.repo,
        first: limit
      }
    )
    const unreadKeys = await listUnreadWorkItemKeys(this.octokit)

    return mapPullRequestNodes(response.repository?.pullRequests.nodes, unreadKeys)
  }

  async searchRepositoryPullRequests(
    options: SearchRepositoryPullRequestsOptions
  ): Promise<GitHubPullRequestSearchResult> {
    const page = normalizePage(options.page)
    const perPage = normalizeLimit(options.perPage)
    const state = normalizeSearchState(options.state)
    const searchQuery = repositorySearchQuery({
      owner: options.owner,
      repo: options.repo,
      search: options.search,
      state,
    })
    const response = await this.octokit.request('GET /search/issues', {
      q: searchQuery,
      sort: 'created',
      order: 'desc',
      page,
      per_page: perPage,
    })
    const payload = response.data as SearchPullRequestsResponse
    const ids = (payload.items ?? [])
      .map((item) => item.node_id)
      .filter(isString)
    const unreadKeys = await listUnreadWorkItemKeys(this.octokit)
    const pullRequests = await this.fetchPullRequestNodes(ids, unreadKeys)
    const totalCount = payload.total_count ?? pullRequests.length

    return {
      items: pullRequests,
      totalCount,
      page,
      perPage,
      hasNextPage: page * perPage < Math.min(totalCount, MAX_SEARCH_RESULTS),
      incompleteResults: Boolean(payload.incomplete_results),
    }
  }

  async getPullRequestDetail(options: GetPullRequestDetailOptions): Promise<GitHubPullRequestDetail> {
    const response = await this.octokit.graphql<PullRequestDetailResponse>(
      pullRequestDetailQuery,
      {
        owner: options.owner,
        repo: options.repo,
        number: options.number
      }
    )
    const pullRequest = response.repository?.pullRequest

    if (!pullRequest) {
      throw new Error('Pull request not found')
    }

    const unreadKeys = await listUnreadWorkItemKeys(this.octokit)

    return mapPullRequestDetailNode(pullRequest, unreadKeys, response.repository)
  }

  async createPullRequestComment(options: CreatePullRequestCommentOptions): Promise<GitHubPullRequestComment> {
    const response = await this.octokit.rest.issues.createComment({
      owner: options.owner,
      repo: options.repo,
      issue_number: options.number,
      body: options.body
    })

    return mapRestIssueComment(response.data)
  }

  async updatePullRequest(options: UpdatePullRequestOptions): Promise<void> {
    const hasPullFields = options.title !== undefined || options.body !== undefined || options.state !== undefined
    const hasIssueFields = options.assignees !== undefined || options.labels !== undefined || options.milestone !== undefined

    if (hasPullFields) {
      await this.octokit.rest.pulls.update({
        owner: options.owner,
        repo: options.repo,
        pull_number: options.number,
        ...(options.title !== undefined ? { title: options.title } : {}),
        ...(options.body !== undefined ? { body: options.body } : {}),
        ...(options.state !== undefined ? { state: options.state } : {})
      })
    }

    if (hasIssueFields) {
      await this.octokit.rest.issues.update({
        owner: options.owner,
        repo: options.repo,
        issue_number: options.number,
        ...(options.assignees !== undefined ? { assignees: options.assignees } : {}),
        ...(options.labels !== undefined ? { labels: options.labels } : {}),
        ...(options.milestone !== undefined ? { milestone: options.milestone } : {})
      })
    }
  }

  async closePullRequest(options: ClosePullRequestOptions): Promise<void> {
    await this.octokit.rest.issues.update({
      owner: options.owner,
      repo: options.repo,
      issue_number: options.number,
      state: 'closed'
    })
  }

  async requestPullRequestReviewers(options: RequestPullRequestReviewersOptions): Promise<void> {
    if (options.removeReviewers.length > 0) {
      await this.octokit.rest.pulls.removeRequestedReviewers({
        owner: options.owner, repo: options.repo, pull_number: options.number, reviewers: options.removeReviewers
      })
    }
    if (options.reviewers.length > 0) {
      await this.octokit.rest.pulls.requestReviewers({
        owner: options.owner, repo: options.repo, pull_number: options.number, reviewers: options.reviewers
      })
    }
  }

  async markPullRequestReadyForReview(options: MarkPullRequestReadyForReviewOptions): Promise<void> {
    await this.octokit.graphql<MarkPullRequestReadyForReviewResponse>(
      markPullRequestReadyForReviewMutation,
      {
        pullRequestId: normalizePullRequestNodeId(options.id)
      }
    )
  }

  async mergePullRequest(options: MergePullRequestOptions): Promise<void> {
    await this.octokit.rest.pulls.merge({
      owner: options.owner,
      repo: options.repo,
      pull_number: options.number,
      merge_method: options.method,
      ...(options.expectedHeadSha ? { sha: options.expectedHeadSha } : {}),
      ...(options.commitTitle ? { commit_title: options.commitTitle } : {}),
      ...(options.commitMessage ? { commit_message: options.commitMessage } : {})
    })
  }

  async listPullRequestFiles(options: GetPullRequestDetailOptions): Promise<GitHubCommitFile[]> {
    const files = await this.octokit.paginate(
      this.octokit.rest.pulls.listFiles,
      {
        owner: options.owner,
        repo: options.repo,
        pull_number: options.number,
        per_page: 100
      }
    )

    return files.flatMap((file): GitHubCommitFile[] => {
      if (!file.filename) return []

      const status: GitHubCommitFile['status'] =
        file.status === 'added'
        || file.status === 'removed'
        || file.status === 'renamed'
        || file.status === 'changed'
          ? file.status
          : 'modified'

      return [{
        filename: file.filename,
        previousFilename: file.previous_filename,
        status,
        additions: file.additions ?? 0,
        deletions: file.deletions ?? 0,
        patch: file.patch
      }]
    })
  }

  async listPullRequestCommits(options: ListPullRequestCommitsOptions): Promise<GitHubRepositoryCommitPage> {
    const page = Math.max(1, Math.floor(options.page ?? 1))
    const perPage = Math.max(1, Math.min(100, Math.floor(options.perPage ?? 30)))
    const response = await this.octokit.rest.pulls.listCommits({
      owner: options.owner,
      repo: options.repo,
      pull_number: options.number,
      page,
      per_page: perPage
    })
    const baseItems = (response.data as CommitListItemResponse[]).map((item) =>
      mapRepositoryCommit(options, item)
    )
    const ciStates = await fetchCommitCiStates(this.octokit, options, baseItems.map((item) => item.sha))
    const items = baseItems.map((item) => ({
      ...item,
      ciState: ciStates.get(item.sha) ?? null
    }))

    return {
      items,
      page,
      perPage,
      hasPreviousPage: page > 1,
      hasNextPage: items.length === perPage
    }
  }

  async submitPullRequestReview(options: SubmitPullRequestReviewOptions): Promise<void> {
    await this.octokit.rest.pulls.createReview({
      owner: options.owner,
      repo: options.repo,
      pull_number: options.number,
      event: options.event,
      ...(options.body ? { body: options.body } : {})
    })
  }

  async updatePullRequestComment(options: UpdatePullRequestCommentOptions): Promise<void> {
    await this.octokit.rest.issues.updateComment({
      owner: options.owner,
      repo: options.repo,
      comment_id: normalizeIssueCommentId(options.commentId),
      body: options.body
    })
  }

  private async searchPullRequests(searchQuery: string, limit: number): Promise<GitHubPullRequest[]> {
    const response = await this.octokit.graphql<ViewerPullRequestsResponse>(
      viewerPullRequestsQuery,
      {
        first: limit,
        searchQuery
      }
    )
    const unreadKeys = await listUnreadWorkItemKeys(this.octokit)

    return dedupePullRequests(mapPullRequestNodes(response.search.nodes, unreadKeys))
  }

  private async fetchPullRequestByReference(reference: {
    owner: string
    repo: string
    number: number
  }): Promise<GraphQLPullRequestNode | null> {
    const response = await this.octokit.graphql<PullRequestByNumberResponse>(
      pullRequestByNumberQuery,
      {
        owner: reference.owner,
        repo: reference.repo,
        number: reference.number
      }
    )

    return response.repository?.pullRequest ?? null
  }

  private async fetchPullRequestNodes(
    ids: string[],
    unreadKeys: Set<string>
  ): Promise<GitHubPullRequest[]> {
    if (ids.length === 0) return []

    const response = await this.octokit.graphql<PullRequestNodesResponse>(
      pullRequestNodesQuery,
      { ids }
    )

    return mapPullRequestNodes(response.nodes, unreadKeys)
  }
}

function isOpenPullRequestNode(node: GraphQLPullRequestNode | null): node is GraphQLPullRequestNode {
  return Boolean(node) && node?.state === 'OPEN'
}

function categorySearchQuery(category: ListPullRequestCategoryOptions['category'], login: string): string {
  if (category === 'created-by-me') {
    return `is:pr is:open archived:false author:${login} sort:updated-desc`
  }

  if (category === 'needs-review') {
    return `is:pr is:open archived:false review-requested:${login} sort:updated-desc`
  }

  return `is:pr is:open archived:false mentions:${login} sort:updated-desc`
}

function repositorySearchQuery(options: {
  owner: string
  repo: string
  search?: string
  state: GitHubPullRequestSearchState
}): string {
  const parts = [
    `repo:${options.owner}/${options.repo}`,
    'is:pr',
  ]

  if (options.state === 'open') {
    parts.push('is:open')
  } else if (options.state === 'closed') {
    parts.push('is:closed')
  }

  const search = options.search?.trim()
  if (search) {
    parts.push(search)
  }

  return parts.join(' ')
}

function normalizePage(value: number | undefined): number {
  return Math.min(Math.max(Math.round(value ?? 1), 1), 50)
}

function normalizeSearchState(
  value: SearchRepositoryPullRequestsOptions['state']
): GitHubPullRequestSearchState {
  if (value === 'closed' || value === 'all') return value

  return 'open'
}

function isString(value: string | null | undefined): value is string {
  return Boolean(value)
}

function mapPullRequestNodes(
  nodes: Array<GraphQLPullRequestNode | null> | null | undefined,
  unreadKeys: Set<string>
): GitHubPullRequest[] {
  return (nodes ?? []).flatMap((node) => {
    if (!node) return []

    const repository = splitRepositoryName(node.repository.nameWithOwner)

    return [
      {
        id: `pull-request:${node.id}`,
        owner: repository.owner,
        repo: repository.repo,
        repository: repository.repository,
        number: node.number,
        title: node.title,
        state: normalizePullRequestState(node),
        ciState: normalizeCiState(node.statusCheckRollup?.state),
        author: normalizeActor(node.author),
        updatedAt: node.updatedAt,
        labels: mapLabels(node.labels),
        url: node.url,
        hasUpdates: unreadKeys.has(createWorkItemKey('pull-request', repository.repository, node.number))
      }
    ]
  })
}

function mapPullRequestDetailNode(
  node: GraphQLPullRequestDetailNode,
  unreadKeys: Set<string>,
  repositoryNode?: PullRequestDetailResponse['repository']
): GitHubPullRequestDetail {
  const repository = splitRepositoryName(node.repository.nameWithOwner)
  const ciState = normalizeCiState(node.statusCheckRollup?.state)
  const mergePolicy = resolvePullRequestMergeMethods({
    mergeCommitAllowed: repositoryNode?.mergeCommitAllowed ?? false,
    squashMergeAllowed: repositoryNode?.squashMergeAllowed ?? false,
    rebaseMergeAllowed: repositoryNode?.rebaseMergeAllowed ?? false,
    viewerDefaultMergeMethod: normalizeMergeMethod(repositoryNode?.viewerDefaultMergeMethod)
  })

  return {
    id: `pull-request:${node.id}`,
    nodeId: node.id,
    owner: repository.owner,
    repo: repository.repo,
    repository: repository.repository,
    number: node.number,
    title: node.title,
    state: normalizePullRequestState(node),
    ciState,
    author: normalizeActor(node.author),
    createdAt: node.createdAt,
    updatedAt: node.updatedAt,
    closedAt: node.closedAt ?? null,
    mergedAt: node.mergedAt ?? null,
    mergedBy: mapOptionalActor(node.mergedBy) ?? null,
    body: node.body,
    labels: mapLabels(node.labels),
    assignees: mapActorNodes(node.assignees?.nodes),
    milestone: mapMilestone(node.milestone),
    participants: mapActorNodes(node.participants?.nodes),
    reviewRequests: mapReviewRequests(node.reviewRequests?.nodes),
    latestReviews: mapReviews(node.latestReviews?.nodes),
    reviewDecision: normalizeReviewDecision(node.reviewDecision),
    baseBranch: {
      name: node.baseRefName,
      repository: node.baseRepository?.nameWithOwner ?? null,
      url: node.baseRepository?.url ?? null
    },
    headBranch: {
      name: node.headRefName,
      repository: node.headRepository?.nameWithOwner ?? null,
      url: node.headRepository?.url ?? null
    },
    headSha: node.headRefOid ?? null,
    isCrossRepository: node.isCrossRepository,
    maintainerCanModify: node.maintainerCanModify,
    diffStats: {
      additions: node.additions,
      deletions: node.deletions,
      changedFiles: node.changedFiles
    },
    status: {
      ciState,
      checksUrl: node.checksUrl ?? null,
      mergeStateStatus: node.mergeStateStatus ?? null,
      mergeable: node.mergeable ?? null
    },
    mergePolicy,
    linkedIssues: mapLinkedIssues(node.closingIssuesReferences?.nodes),
    comments: mapComments(node.comments?.nodes),
    timelineEvents: mapTimelineEvents(node.timelineItems?.nodes),
    reactions: mapReactions(node.reactionGroups),
    url: node.url,
    hasUpdates: unreadKeys.has(createWorkItemKey('pull-request', repository.repository, node.number)),
    viewerCanUpdate: node.viewerCanUpdate ?? false,
    viewerCanClose: node.viewerCanClose ?? false,
    viewerCanReopen: node.viewerCanReopen ?? false,
    viewerCanMergeAsAdmin: node.viewerCanMergeAsAdmin ?? false,
    locked: node.locked ?? false,
    viewerSubscription: normalizePullRequestSubscription(node.viewerSubscription),
    projects: mapPullRequestProjects(node),
  }
}

function normalizePullRequestNodeId(id: string): string {
  return id.startsWith('pull-request:') ? id.slice('pull-request:'.length) : id
}

function mapActorNodes(
  nodes: Array<GraphQLActorNode | null> | null | undefined
): GitHubActor[] {
  return (nodes ?? []).flatMap((actor) => {
    if (!actor?.login) return []

    return [normalizeActor(actor)]
  })
}

function mapOptionalActor(actor: GraphQLActorNode | null | undefined): GitHubActor | undefined {
  if (!actor?.login) return undefined

  return normalizeActor(actor)
}

function mapMilestone(
  milestone: GraphQLMilestoneNode | null | undefined
): GitHubIssueMilestone | null {
  if (!milestone) return null

  return {
    id: milestone.id,
    number: milestone.number,
    title: milestone.title,
    description: milestone.description ?? null,
    dueOn: milestone.dueOn ?? null,
    state: milestone.state === 'CLOSED' ? 'closed' : 'open',
    url: milestone.url
  }
}

function mapComments(
  nodes: Array<GraphQLIssueCommentNode | null> | null | undefined
): GitHubPullRequestComment[] {
  return (nodes ?? []).flatMap((comment) => {
    if (!comment) return []

    return [
      {
        id: `pull-request-comment:${comment.databaseId ?? comment.id}`,
        nodeId: comment.id,
        author: normalizeActor(comment.author),
        body: comment.body,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        authorAssociation: comment.authorAssociation,
        reactions: mapReactions(comment.reactionGroups),
        url: comment.url,
        viewerCanUpdate: comment.viewerCanUpdate ?? false
      }
    ]
  })
}

function mapRestIssueComment(comment: RestIssueCommentNode): GitHubPullRequestComment {
  return {
    id: `pull-request-comment:${comment.id}`,
    nodeId: comment.node_id ?? '',
    author: {
      login: comment.user?.login ?? 'unknown',
      avatarUrl: comment.user?.avatar_url ?? undefined
    },
    body: comment.body ?? '',
    createdAt: comment.created_at ?? '',
    updatedAt: comment.updated_at ?? comment.created_at ?? '',
    authorAssociation: comment.author_association ?? 'NONE',
    reactions: [],
    url: comment.html_url ?? '',
    viewerCanUpdate: true
  }
}

interface PullRequestMergeMethodResolutionOptions {
  mergeCommitAllowed: boolean
  squashMergeAllowed: boolean
  rebaseMergeAllowed: boolean
  viewerDefaultMergeMethod?: GitHubPullRequestMergeMethod | null
}

export function resolvePullRequestMergeMethods(options: PullRequestMergeMethodResolutionOptions): {
  methods: GitHubPullRequestMergeMethod[]
  defaultMethod: GitHubPullRequestMergeMethod | null
} {
  const methods: GitHubPullRequestMergeMethod[] = []

  if (options.mergeCommitAllowed) methods.push('merge')
  if (options.squashMergeAllowed) methods.push('squash')
  if (options.rebaseMergeAllowed) methods.push('rebase')

  const defaultMethod = options.viewerDefaultMergeMethod && methods.includes(options.viewerDefaultMergeMethod)
    ? options.viewerDefaultMergeMethod
    : methods[0] ?? null

  return { methods, defaultMethod }
}

function normalizeMergeMethod(value: string | null | undefined): GitHubPullRequestMergeMethod | null {
  if (value === 'MERGE' || value === 'merge') return 'merge'
  if (value === 'SQUASH' || value === 'squash') return 'squash'
  if (value === 'REBASE' || value === 'rebase') return 'rebase'

  return null
}

function normalizeIssueCommentId(value: string | number): number {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) return value

  const raw = String(value)
  const numericPart = raw.includes(':') ? raw.split(':').at(-1) : raw
  const parsed = Number(numericPart)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error('Pull request comment id must be a positive integer')
  }

  return parsed
}

function mapReactions(
  groups: GraphQLReactionGroup[] | null | undefined
): GitHubIssueReaction[] {
  return (groups ?? []).flatMap((group) => {
    const count = group.reactors.totalCount

    if (count <= 0 && !group.viewerHasReacted) return []

    return [
      {
        content: normalizeReactionContent(group.content),
        count,
        viewerHasReacted: group.viewerHasReacted || undefined,
        reactors: mapReactors(group.reactors.nodes)
      }
    ]
  })
}

function mapReactors(
  nodes: Array<GraphQLReactorNode | null> | null | undefined
): GitHubReactionUser[] {
  return (nodes ?? []).flatMap((node) => {
    if (!node?.login) return []

    return [
      {
        login: node.login,
        name: node.name ?? null,
        avatarUrl: node.avatarUrl ?? null
      }
    ]
  })
}

function mapReviewRequests(
  nodes: Array<GraphQLReviewRequestNode | null> | null | undefined
): GitHubPullRequestReviewRequest[] {
  return (nodes ?? []).flatMap((request) => {
    const reviewer = mapReviewer(request?.requestedReviewer)
    if (!request || !reviewer) return []

    return [
      {
        id: `pull-request-review-request:${request.id}`,
        reviewer: reviewer.actor,
        reviewerType: reviewer.type,
        asCodeOwner: request.asCodeOwner
      }
    ]
  })
}

function mapReviews(
  nodes: Array<GraphQLPullRequestReviewNode | null> | null | undefined
): GitHubPullRequestReviewSummary[] {
  return (nodes ?? []).flatMap((review) => {
    if (!review) return []

    return [
      {
        id: `pull-request-review:${review.id}`,
        author: normalizeActor(review.author),
        state: normalizeReviewState(review.state),
        body: review.body,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
        submittedAt: review.submittedAt ?? null,
        authorAssociation: review.authorAssociation,
        url: review.url
      }
    ]
  })
}

function mapReviewComments(
  nodes: Array<GraphQLReviewCommentNode | null> | null | undefined
): GitHubPullRequestReviewComment[] {
  return (nodes ?? []).flatMap((comment) => {
    if (!comment) return []

    return [
      {
        id: `pull-request-review-comment:${comment.id}`,
        nodeId: comment.id,
        author: normalizeActor(comment.author),
        body: comment.body,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        url: comment.url ?? null,
        path: comment.path,
        diffHunk: comment.diffHunk ?? null,
        line: comment.line ?? null,
        originalLine: comment.originalLine ?? null,
        startLine: comment.startLine ?? null,
        outdated: comment.outdated ?? false,
        isReply: Boolean(comment.replyTo),
        reactions: mapReactions(comment.reactionGroups)
      }
    ]
  })
}

function mapLinkedIssues(
  nodes: Array<GraphQLLinkedIssueNode | null> | null | undefined
): GitHubPullRequestLinkedIssue[] {
  return (nodes ?? []).flatMap((issue) => {
    if (!issue) return []

    const repository = splitRepositoryName(issue.repository.nameWithOwner)

    return [
      {
        id: `issue:${issue.id}`,
        owner: repository.owner,
        repo: repository.repo,
        repository: repository.repository,
        number: issue.number,
        title: issue.title,
        state: normalizeIssueState(issue),
        url: issue.url
      }
    ]
  })
}

function mapTimelineEvents(
  nodes: Array<GraphQLPullRequestTimelineNode | null> | null | undefined
): GitHubPullRequestTimelineEvent[] {
  return (nodes ?? []).flatMap((node, index): GitHubPullRequestTimelineEvent[] => {
    if (!node) return []

    const base = {
      id: node.id ? `pull-request-event:${node.id}` : `pull-request-event:${node.__typename ?? 'generic'}:${index}`,
      actor: normalizeActor(node.actor ?? node.author ?? null),
      createdAt: node.submittedAt ?? node.createdAt ?? ''
    }

    if (node.__typename === 'PullRequestCommit') {
      const commit = mapPullRequestCommit(node)
      if (!commit) return []

      return [
        {
          ...base,
          type: 'committed' as const,
          actor: commit.author,
          createdAt: commit.committedDate,
          afterCommit: commit.abbreviatedOid,
          url: commit.url,
          commit
        }
      ]
    }

    if (node.__typename === 'AssignedEvent') {
      return [{ ...base, type: 'assigned' as const, assignee: mapOptionalActor(node.assignee) }]
    }

    if (node.__typename === 'UnassignedEvent') {
      return [{ ...base, type: 'unassigned' as const, assignee: mapOptionalActor(node.assignee) }]
    }

    if (node.__typename === 'LabeledEvent') {
      return [{ ...base, type: 'labeled' as const, label: node.label?.name ?? null }]
    }

    if (node.__typename === 'UnlabeledEvent') {
      return [{ ...base, type: 'unlabeled' as const, label: node.label?.name ?? null }]
    }

    if (node.__typename === 'ClosedEvent') {
      return [{ ...base, type: 'closed' as const }]
    }

    if (node.__typename === 'ReopenedEvent') {
      return [{ ...base, type: 'reopened' as const }]
    }

    if (node.__typename === 'RenamedTitleEvent') {
      return [{ ...base, type: 'renamed' as const, from: node.previousTitle ?? null, to: node.currentTitle ?? null }]
    }

    if (node.__typename === 'CrossReferencedEvent') {
      return [{ ...base, type: 'cross-referenced' as const, source: mapTimelineSource(node.source), url: node.source?.url ?? null }]
    }

    if (node.__typename === 'MentionedEvent') {
      return [{ ...base, type: 'mentioned' as const }]
    }

    if (node.__typename === 'PullRequestReview') {
      return [
        {
          ...base,
          type: 'reviewed' as const,
          body: node.body ?? null,
          reviewState: normalizeReviewState(node.state),
          reviewComments: mapReviewComments(node.comments?.nodes),
          url: node.url ?? null
        }
      ]
    }

    if (node.__typename === 'ReviewRequestedEvent') {
      const reviewer = mapReviewer(node.requestedReviewer)
      return [
        {
          ...base,
          type: 'review-requested' as const,
          reviewer: reviewer?.actor,
          reviewerType: reviewer?.type
        }
      ]
    }

    if (node.__typename === 'ReviewRequestRemovedEvent') {
      const reviewer = mapReviewer(node.requestedReviewer)
      return [
        {
          ...base,
          type: 'review-request-removed' as const,
          reviewer: reviewer?.actor,
          reviewerType: reviewer?.type
        }
      ]
    }

    if (node.__typename === 'ReviewDismissedEvent') {
      return [
        {
          ...base,
          type: 'review-dismissed' as const,
          body: node.dismissalMessage ?? null,
          reviewState: normalizeReviewState(node.previousReviewState ?? node.review?.state),
          reviewer: mapOptionalActor(node.review?.author),
          url: node.url ?? node.review?.url ?? null
        }
      ]
    }

    if (node.__typename === 'ReadyForReviewEvent') {
      return [{ ...base, type: 'ready-for-review' as const, url: node.url ?? null }]
    }

    if (node.__typename === 'ConvertToDraftEvent') {
      return [{ ...base, type: 'convert-to-draft' as const, url: node.url ?? null }]
    }

    if (node.__typename === 'MergedEvent') {
      return [
        {
          ...base,
          type: 'merged' as const,
          ref: node.mergeRefName ?? null,
          afterCommit: commitLabel(node.commit),
          url: node.url ?? node.commit?.url ?? null
        }
      ]
    }

    if (node.__typename === 'BaseRefChangedEvent') {
      return [{ ...base, type: 'base-ref-changed' as const, from: node.previousRefName ?? null, to: node.currentRefName ?? null }]
    }

    if (node.__typename === 'BaseRefDeletedEvent') {
      return [{ ...base, type: 'base-ref-deleted' as const, ref: node.baseRefName ?? null }]
    }

    if (node.__typename === 'BaseRefForcePushedEvent') {
      return [
        {
          ...base,
          type: 'base-ref-force-pushed' as const,
          ref: node.ref?.name ?? null,
          beforeCommit: commitLabel(node.beforeCommit),
          afterCommit: commitLabel(node.afterCommit),
          url: node.afterCommit?.url ?? node.beforeCommit?.url ?? null
        }
      ]
    }

    if (node.__typename === 'HeadRefDeletedEvent') {
      return [{ ...base, type: 'head-ref-deleted' as const, ref: node.headRefName ?? null }]
    }

    if (node.__typename === 'HeadRefForcePushedEvent') {
      return [
        {
          ...base,
          type: 'head-ref-force-pushed' as const,
          ref: node.ref?.name ?? null,
          beforeCommit: commitLabel(node.beforeCommit),
          afterCommit: commitLabel(node.afterCommit),
          url: node.afterCommit?.url ?? node.beforeCommit?.url ?? null
        }
      ]
    }

    if (node.__typename === 'HeadRefRestoredEvent') {
      return [{ ...base, type: 'head-ref-restored' as const }]
    }

    if (node.__typename === 'AutomaticBaseChangeFailedEvent') {
      return [
        {
          ...base,
          type: 'automatic-base-change-failed' as const,
          from: node.oldBase ?? null,
          to: node.newBase ?? null
        }
      ]
    }

    if (node.__typename === 'AutomaticBaseChangeSucceededEvent') {
      return [
        {
          ...base,
          type: 'automatic-base-change-succeeded' as const,
          from: node.oldBase ?? null,
          to: node.newBase ?? null
        }
      ]
    }

    if (node.__typename === 'AutoMergeEnabledEvent') {
      return [{ ...base, type: 'auto-merge-enabled' as const }]
    }

    if (node.__typename === 'AutoMergeDisabledEvent') {
      return [{ ...base, type: 'auto-merge-disabled' as const, reason: node.reason ?? null }]
    }

    if (node.__typename === 'AutoRebaseEnabledEvent') {
      return [{ ...base, type: 'auto-rebase-enabled' as const }]
    }

    if (node.__typename === 'AutoSquashEnabledEvent') {
      return [{ ...base, type: 'auto-squash-enabled' as const }]
    }

    if (node.__typename === 'AddedToMergeQueueEvent') {
      return [{ ...base, type: 'added-to-merge-queue' as const, url: node.mergeQueue?.url ?? null }]
    }

    if (node.__typename === 'RemovedFromMergeQueueEvent') {
      return [
        {
          ...base,
          type: 'removed-from-merge-queue' as const,
          beforeCommit: commitLabel(node.beforeCommit),
          reason: node.reason ?? null,
          url: node.mergeQueue?.url ?? null
        }
      ]
    }

    if (node.__typename === 'MilestonedEvent') {
      return [{ ...base, type: 'milestoned' as const, milestone: node.milestoneTitle ?? null }]
    }

    if (node.__typename === 'DemilestonedEvent') {
      return [{ ...base, type: 'demilestoned' as const, milestone: node.milestoneTitle ?? null }]
    }

    if (node.__typename === 'ConnectedEvent') {
      return [{ ...base, type: 'connected' as const, source: mapTimelineSource(node.source ?? node.subject) }]
    }

    if (node.__typename === 'DisconnectedEvent') {
      return [{ ...base, type: 'disconnected' as const, source: mapTimelineSource(node.source ?? node.subject) }]
    }

    if (node.__typename === 'CommentDeletedEvent') {
      return [{ ...base, type: 'comment-deleted' as const }]
    }

    if (node.__typename === 'ReferencedEvent') {
      return [
        {
          ...base,
          type: 'referenced' as const,
          afterCommit: commitLabel(node.commit),
          url: node.commit?.url ?? null,
          source: mapTimelineSource(node.subject)
        }
      ]
    }

    if (node.__typename === 'LockedEvent') {
      return [{ ...base, type: 'locked' as const, reason: node.lockReason ?? null }]
    }

    if (node.__typename === 'UnlockedEvent') {
      return [{ ...base, type: 'unlocked' as const }]
    }

    if (node.__typename === 'PinnedEvent') {
      return [{ ...base, type: 'pinned' as const }]
    }

    if (node.__typename === 'UnpinnedEvent') {
      return [{ ...base, type: 'unpinned' as const }]
    }

    if (node.__typename === 'TransferredEvent') {
      return [{ ...base, type: 'transferred' as const, from: node.fromRepository?.nameWithOwner ?? null }]
    }

    if (node.__typename === 'MarkedAsDuplicateEvent') {
      return [{ ...base, type: 'marked-as-duplicate' as const, source: mapTimelineSource(node.canonical) }]
    }

    if (node.__typename === 'UnmarkedAsDuplicateEvent') {
      return [{ ...base, type: 'unmarked-as-duplicate' as const, source: mapTimelineSource(node.canonical) }]
    }

    if (node.__typename === 'DeployedEvent') {
      return [{ ...base, type: 'deployed' as const, to: node.deployment?.environment ?? null }]
    }

    if (node.__typename === 'DeploymentEnvironmentChangedEvent') {
      return [
        {
          ...base,
          type: 'deployment-environment-changed' as const,
          to: node.deploymentStatus?.deployment?.environment ?? null,
          reason: node.deploymentStatus?.state ?? null
        }
      ]
    }

    if (node.__typename === 'ConvertedToDiscussionEvent') {
      return [
        {
          ...base,
          type: 'converted-to-discussion' as const,
          url: node.discussion?.url ?? null,
          source: node.discussion
            ? {
                type: 'discussion',
                number: node.discussion.number ?? undefined,
                title: node.discussion.title ?? undefined,
                url: node.discussion.url ?? null
              }
            : undefined
        }
      ]
    }

    if (node.__typename === 'AddedToProjectV2Event') {
      return [{ ...base, type: 'added-to-project' as const, to: node.project?.title ?? null, url: node.project?.url ?? null }]
    }

    if (node.__typename === 'RemovedFromProjectV2Event') {
      return [{ ...base, type: 'removed-from-project' as const, from: node.project?.title ?? null, url: node.project?.url ?? null }]
    }

    if (node.__typename === 'ProjectV2ItemStatusChangedEvent') {
      return [
        {
          ...base,
          type: 'project-status-changed' as const,
          from: node.previousStatus ?? null,
          to: node.status ?? null,
          label: node.project?.title ?? null,
          url: node.project?.url ?? null
        }
      ]
    }

    return [
      {
        ...base,
        type: 'generic' as const,
        text: node.__typename ?? 'TimelineEvent',
        url: node.url ?? null
      }
    ]
  })
}

function mapTimelineSource(
  source: GraphQLTimelineSourceNode | null | undefined
): GitHubPullRequestTimelineReference | undefined {
  if (!source) return undefined

  return {
    type: normalizeTimelineSourceType(source.__typename),
    repository: source.repository?.nameWithOwner,
    number: source.number ?? undefined,
    title: source.title ?? undefined,
    url: source.url ?? null
  }
}

function mapReviewer(
  reviewer: GraphQLReviewerNode | null | undefined
): { actor: GitHubActor, type: GitHubPullRequestReviewerType } | null {
  if (!reviewer) return null

  if ('login' in reviewer && reviewer.login) {
    return {
      actor: {
        login: reviewer.login,
        avatarUrl: reviewer.avatarUrl ?? undefined
      },
      type: normalizeReviewerType(reviewer.__typename)
    }
  }

  const slug = 'slug' in reviewer ? reviewer.slug : null
  const name = 'name' in reviewer ? reviewer.name : null
  const login = slug || name
  if (!login) return null

  return {
    actor: {
      login,
      avatarUrl: reviewer.avatarUrl ?? undefined
    },
    type: normalizeReviewerType(reviewer.__typename)
  }
}

function normalizeReviewerType(value: string | null | undefined): GitHubPullRequestReviewerType {
  if (value === 'User') return 'user'
  if (value === 'Team') return 'team'
  if (value === 'Mannequin') return 'mannequin'

  return 'unknown'
}

function dedupePullRequests(pullRequests: GitHubPullRequest[]): GitHubPullRequest[] {
  const seen = new Set<string>()
  const result: GitHubPullRequest[] = []

  for (const pullRequest of pullRequests) {
    const key = createWorkItemKey('pull-request', pullRequest.repository, pullRequest.number)
    if (seen.has(key)) continue
    seen.add(key)
    result.push(pullRequest)
  }

  return result
}

function normalizePullRequestState(node: GraphQLPullRequestNode): GitHubPullRequestState {
  if (node.merged || node.state === 'MERGED') return 'merged'
  if (node.state === 'CLOSED') return 'closed'
  if (node.isDraft) return 'draft'

  return 'open'
}

function normalizeCiState(value: string | null | undefined): GitHubCiState | null {
  if (value === 'SUCCESS') return 'success'
  if (value === 'FAILURE' || value === 'ERROR') return 'failure'
  if (value === 'PENDING' || value === 'EXPECTED') return 'pending'

  return null
}

function normalizeIssueState(node: GraphQLLinkedIssueNode): 'open' | 'completed' | 'not_planned' {
  if (node.state !== 'CLOSED') return 'open'
  if (node.stateReason === 'COMPLETED') return 'completed'

  return 'not_planned'
}

function normalizeReviewDecision(value: string | null | undefined): GitHubPullRequestReviewDecision | null {
  if (value === 'APPROVED') return 'approved'
  if (value === 'CHANGES_REQUESTED') return 'changes_requested'
  if (value === 'REVIEW_REQUIRED') return 'review_required'

  return null
}

function normalizeReviewState(value: string | null | undefined): GitHubPullRequestReviewState {
  if (value === 'APPROVED') return 'approved'
  if (value === 'CHANGES_REQUESTED') return 'changes_requested'
  if (value === 'DISMISSED') return 'dismissed'
  if (value === 'PENDING') return 'pending'

  return 'commented'
}

function normalizeReactionContent(content: string): string {
  const reactionContent: Record<string, string> = {
    THUMBS_UP: 'thumbs-up',
    THUMBS_DOWN: 'thumbs-down',
    LAUGH: 'laugh',
    HOORAY: 'hooray',
    CONFUSED: 'confused',
    HEART: 'heart',
    ROCKET: 'rocket',
    EYES: 'eyes'
  }

  return reactionContent[content] ?? content.toLowerCase()
}

function normalizeTimelineSourceType(type: string | undefined): string {
  if (type === 'PullRequest') return 'pull-request'
  if (type === 'Issue') return 'issue'

  return type ?? 'unknown'
}

function mapPullRequestCommit(
  node: GraphQLPullRequestTimelineNode
): GitHubPullRequestCommitSummary | null {
  const commit = node.commit
  const abbreviatedOid = commitLabel(commit)
  const oid = commit?.oid ?? abbreviatedOid
  if (!oid || !abbreviatedOid) return null

  const author = mapCommitAuthor(commit?.author)
  const committedDate = commit?.committedDate ?? commit?.authoredDate ?? node.createdAt ?? ''

  return {
    id: node.id ?? `pull-request-commit:${oid}`,
    oid,
    abbreviatedOid,
    messageHeadline: commit?.messageHeadline?.trim() || abbreviatedOid,
    authoredDate: commit?.authoredDate ?? committedDate,
    committedDate,
    author: author.actor,
    authorIsGitHubUser: author.isGitHubUser,
    ciState: normalizeCiState(commit?.statusCheckRollup?.state),
    url: commit?.url ?? node.url ?? ''
  }
}

function mapCommitAuthor(
  actor: GraphQLGitActorNode | null | undefined
): { actor: GitHubActor; isGitHubUser: boolean } {
  if (actor?.user?.login) {
    return {
      actor: normalizeActor(actor.user),
      isGitHubUser: true
    }
  }

  return {
    actor: {
      login: actor?.name?.trim() || 'unknown',
      avatarUrl: actor?.avatarUrl ?? undefined
    },
    isGitHubUser: false
  }
}

function commitLabel(commit: GraphQLCommitNode | null | undefined): string | null {
  return commit?.abbreviatedOid ?? commit?.oid?.slice(0, 7) ?? null
}

export function mapPullRequestProjects(
  node: Pick<GraphQLPullRequestDetailNode, 'projectItems'>
): GitHubIssueProjectItem[] {
  const itemNodes = (node.projectItems?.nodes ?? []).filter(
    (item): item is NonNullable<typeof item> => Boolean(item?.project)
  )
  return itemNodes.map((item) => {
    const fieldNodes = (item.fieldValues?.nodes ?? []).filter((f): f is NonNullable<typeof f> => Boolean(f))
    const fields = fieldNodes.flatMap((field) => {
      const name = field.field?.name
      const value = field.name ?? field.text ?? (typeof field.number === 'number' ? String(field.number) : null)
      return name && value ? [{ name, value }] : []
    })
    return { id: item.id, title: item.project?.title ?? '', url: item.project?.url ?? null, fields }
  })
}

function normalizePullRequestSubscription(value: string | null | undefined): GitHubIssueSubscription | null {
  if (value === 'SUBSCRIBED' || value === 'UNSUBSCRIBED' || value === 'IGNORED') return value
  return null
}
