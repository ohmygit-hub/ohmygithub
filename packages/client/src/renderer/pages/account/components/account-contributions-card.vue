<script setup lang="ts">
import type { EChartsOption } from 'echarts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { use } from 'echarts/core'
import { HeatmapChart } from 'echarts/charts'
import { CalendarComponent, TooltipComponent, VisualMapComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import VChart from 'vue-echarts'
import { CircleDot, GitCommitHorizontal, GitPullRequest, MessageSquareText } from 'lucide-vue-next'
import { Skeleton } from '@oh-my-github/ui'
import { cssColorVar, useChartThemeVersion } from '@/components/charts/chart-theme'

use([
  CalendarComponent,
  CanvasRenderer,
  HeatmapChart,
  TooltipComponent,
  VisualMapComponent,
])

const props = defineProps<{
  contributions: GitHubAccountContributionYear | null
  hasError: boolean
  isLoading: boolean
  selectedYear: number | null
  years: number[]
}>()

const emit = defineEmits<{
  'update:selectedYear': [year: number]
}>()

const { locale, t } = useI18n()
const themeVersion = useChartThemeVersion()

interface ContributionChartTheme {
  background: string
  border: string
  card: string
  emptyCell: string
  foreground: string
  greenBorder: string
  greenDeep: string
  greenSoft: string
  greenSoftActive: string
  mutedForeground: string
}

const stats = computed(() => {
  const contributions = props.contributions
  if (!contributions) return []

  return [
    {
      id: 'commits',
      icon: GitCommitHorizontal,
      label: t('account.contributions.stats.commits'),
      value: contributions.commitContributions,
    },
    {
      id: 'pullRequests',
      icon: GitPullRequest,
      label: t('account.contributions.stats.pullRequests'),
      value: contributions.pullRequestContributions,
    },
    {
      id: 'reviews',
      icon: MessageSquareText,
      label: t('account.contributions.stats.reviews'),
      value: contributions.pullRequestReviewContributions,
    },
    {
      id: 'issues',
      icon: CircleDot,
      label: t('account.contributions.stats.issues'),
      value: contributions.issueContributions,
    },
  ]
})
const chartData = computed<Array<[string, number]>>(() => {
  if (!props.contributions) return []

  return props.contributions.weeks.flatMap((week) =>
    week.days.map((day) => [day.date, day.contributionCount] as [string, number])
  )
})
const maxContributionCount = computed(() =>
  Math.max(1, ...chartData.value.map((item) => item[1]))
)
const weekdayLabels = computed(() => {
  const formatter = new Intl.DateTimeFormat(locale.value, { weekday: 'short' })

  return Array.from({ length: 7 }, (_, index) =>
    formatter.format(new Date(Date.UTC(2026, 0, 4 + index)))
  )
})
const monthLabels = computed(() => {
  const formatter = new Intl.DateTimeFormat(locale.value, { month: 'short' })

  return Array.from({ length: 12 }, (_, index) =>
    formatter.format(new Date(Date.UTC(2026, index, 1)))
  )
})
const calendarRange = computed<[string, string]>(() => {
  const year = props.contributions?.year ?? new Date().getFullYear()

  return [`${year}-01-01`, `${year}-12-31`]
})
const chartCellSize = 14
const chartTopPadding = 26
const chartLeftPadding = 46
const chartRightPadding = 14
const chartBottomPadding = 8
const chartWidth = computed(() =>
  chartLeftPadding + chartRightPadding + Math.max(53, props.contributions?.weeks.length ?? 53) * chartCellSize
)
const chartHeight = computed(() =>
  chartTopPadding + chartBottomPadding + 7 * chartCellSize
)
const chartTheme = computed(() => {
  themeVersion.value

  return readContributionChartTheme()
})
const chartOption = computed<EChartsOption>(() => {
  const theme = chartTheme.value

  return {
    animation: false,
    backgroundColor: 'transparent',
    calendar: {
      cellSize: [chartCellSize, chartCellSize],
      dayLabel: {
        color: theme.mutedForeground,
        firstDay: 0,
        fontSize: 11,
        margin: 8,
        nameMap: weekdayLabels.value,
        position: 'start',
        show: true,
      },
      itemStyle: {
        borderColor: theme.card,
        borderWidth: 2,
        color: theme.emptyCell,
      },
      left: chartLeftPadding,
      monthLabel: {
        color: theme.mutedForeground,
        fontSize: 11,
        margin: 10,
        nameMap: monthLabels.value,
        position: 'start',
        show: true,
      },
      orient: 'horizontal',
      range: calendarRange.value,
      splitLine: {
        lineStyle: {
          color: theme.border,
          width: 1,
        },
        show: false,
      },
      top: chartTopPadding,
      yearLabel: {
        show: false,
      },
    },
    series: [
      {
        coordinateSystem: 'calendar',
        data: chartData.value,
        calendarIndex: 0,
        emphasis: {
          itemStyle: {
            borderColor: theme.foreground,
            borderWidth: 1,
          },
        },
        itemStyle: {
          borderColor: theme.card,
          borderRadius: 3,
          borderWidth: 2,
        },
        type: 'heatmap',
      },
    ],
    tooltip: {
      appendToBody: true,
      backgroundColor: theme.background,
      borderColor: theme.border,
      borderWidth: 1,
      confine: true,
      formatter: formatTooltip,
      padding: [6, 8],
      textStyle: {
        color: theme.foreground,
        fontSize: 12,
      },
    },
    visualMap: {
      inRange: {
        color: heatmapColors(theme),
      },
      max: Math.max(9, maxContributionCount.value),
      min: 0,
      show: false,
    },
  }
})

function formatNumber(value: number): string {
  return new Intl.NumberFormat().format(value)
}

function dayTitle(date: string, contributionCount: number): string {
  return t('account.contributions.dayTitle', {
    count: formatNumber(contributionCount),
    date: formatContributionDate(date),
  })
}

function formatContributionDate(value: string): string {
  return new Intl.DateTimeFormat(locale.value, {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00Z`))
}

function formatTooltip(params: unknown): string {
  const data = isTooltipParams(params) ? params.data : null
  if (!Array.isArray(data)) return ''

  const date = String(data[0] ?? '')
  const count = Number(data[1] ?? 0)

  return dayTitle(date, count)
}

function isTooltipParams(value: unknown): value is { data?: unknown } {
  return typeof value === 'object' && value !== null && 'data' in value
}

function heatmapColors(theme: ContributionChartTheme): string[] {
  return [
    theme.emptyCell,
    theme.greenSoft,
    theme.greenSoftActive,
    theme.greenBorder,
    theme.greenDeep,
  ]
}

function readContributionChartTheme(): ContributionChartTheme {
  return {
    background: cssColorVar('--popover', '#171717'),
    border: cssColorVar('--border', 'rgb(64 64 64)'),
    card: cssColorVar('--card', '#171717'),
    emptyCell: cssColorVar('--muted', '#262626'),
    foreground: cssColorVar('--foreground', '#e5e5e5'),
    greenBorder: cssColorVar('--accent-green-border', '#28683d'),
    greenDeep: cssColorVar('--accent-green-deep', '#9be9a8'),
    greenSoft: cssColorVar('--accent-green-soft', '#0e4429'),
    greenSoftActive: cssColorVar('--accent-green-soft-active', '#006d32'),
    mutedForeground: cssColorVar('--muted-foreground', '#a3a3a3'),
  }
}

</script>

<template>
  <section class="grid gap-3 rounded-lg border border-border bg-card p-4">
    <div class="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div class="grid min-w-0 gap-1">
        <h2 class="select-none truncate text-label font-medium text-foreground">
          {{ contributions
            ? t('account.contributions.title', { count: formatNumber(contributions.totalContributions), year: contributions.year })
            : t('account.contributions.heading') }}
        </h2>
        <p class="select-none text-body text-muted-foreground">
          {{ t('account.contributions.description') }}
        </p>
      </div>

      <div
        v-if="years.length > 0"
        class="flex min-w-0 gap-1 overflow-x-auto"
      >
        <button
          v-for="year in years"
          :key="year"
          :class="[
            'h-8 shrink-0 rounded-lg px-3 text-body font-medium outline-hidden transition-colors hover:bg-muted/70 focus-visible:ring-2 focus-visible:ring-ring/30',
            selectedYear === year ? 'bg-foreground text-background' : 'text-muted-foreground',
          ]"
          type="button"
          @click="emit('update:selectedYear', year)"
        >
          {{ year }}
        </button>
      </div>
    </div>

    <div
      v-if="isLoading && !contributions"
      class="grid gap-3"
    >
      <Skeleton class="h-28 rounded-lg" />
      <div class="grid gap-2 sm:grid-cols-4">
        <Skeleton
          v-for="index in 4"
          :key="index"
          class="h-16 rounded-lg"
        />
      </div>
    </div>

    <div
      v-else-if="hasError && !contributions"
      class="rounded-lg border border-dashed border-border p-4 text-body text-muted-foreground"
    >
      {{ t('account.contributions.error') }}
    </div>

    <template v-else-if="contributions">
      <div class="overflow-x-auto rounded-lg border border-border p-3">
        <VChart
          autoresize
          :option="chartOption"
          :style="{
            height: `${chartHeight}px`,
            width: `${chartWidth}px`,
          }"
        />

        <div class="mt-3 flex items-center justify-end gap-1 text-body text-muted-foreground">
          <span>{{ t('account.contributions.less') }}</span>
          <span class="size-2.5 rounded-sm bg-muted" />
          <span class="size-2.5 rounded-sm bg-[var(--accent-green-soft)]" />
          <span class="size-2.5 rounded-sm bg-[var(--accent-green-soft-active)]" />
          <span class="size-2.5 rounded-sm bg-[var(--accent-green-border)]" />
          <span class="size-2.5 rounded-sm bg-[var(--accent-green-deep)]" />
          <span>{{ t('account.contributions.more') }}</span>
        </div>
      </div>

      <div class="grid gap-2 sm:grid-cols-4">
        <div
          v-for="item in stats"
          :key="item.id"
          class="grid gap-1 rounded-lg border border-border p-3"
        >
          <div class="flex min-w-0 select-none items-center gap-2 text-body font-medium text-muted-foreground">
            <component
              :is="item.icon"
              class="size-3.5 shrink-0"
            />
            <span class="truncate">{{ item.label }}</span>
          </div>
          <div class="truncate text-control font-semibold text-foreground">
            {{ formatNumber(item.value) }}
          </div>
        </div>
      </div>
    </template>
  </section>
</template>
