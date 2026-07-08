import { useQuery } from '@pinia/colada'

function requireActivityBridge() {
  if (!window.ohMyGithub?.activity) {
    throw new Error('GitHub activity bridge is unavailable')
  }

  return window.ohMyGithub.activity
}

export function useActivityFeedQuery() {
  return useQuery<GitHubFeedEventPage>({
    key: ['github', 'activity', 'received-events'],
    // 对齐 GitHub 建议的 feed 轮询间隔：数据超过 60s 视为过期，
    // 在挂载 / 窗口聚焦 / 网络重连时自动 refetch（与 Inbox 相同的智能刷新）。
    staleTime: 1000 * 60,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
    query: async () => requireActivityBridge().listReceivedEvents({ page: 1 }),
  })
}

export async function fetchActivityFeedPage(page: number): Promise<GitHubFeedEventPage> {
  return requireActivityBridge().listReceivedEvents({ page })
}

export async function fetchActivityRepoCards(
  fullNames: string[],
): Promise<Record<string, GitHubFeedRepoCard | null>> {
  return requireActivityBridge().getRepositoryCards(fullNames)
}

export async function fetchActivityPushCounts(
  refs: Array<{ key: string, repoFullName: string, before: string, head: string }>,
): Promise<Record<string, number | null>> {
  return requireActivityBridge().getPushCommitCounts(refs)
}
