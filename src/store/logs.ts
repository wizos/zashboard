import { fetchLogsAPI } from '@/api'
import { LOG_LEVEL } from '@/constant'
import type { Log, LogWithSeq } from '@/types'
import { useStorage } from '@vueuse/core'
import dayjs from 'dayjs'
import { throttle } from 'lodash'
import { computed, ref, watch } from 'vue'
import { logRetentionLimit, sourceIPLabelList } from './settings'

export const logs = ref<LogWithSeq[]>([])
export const logFilter = ref('')
export const isPaused = ref(false)
export const logLevel = useStorage<string>('config/log-level', LOG_LEVEL.Info)
export const logPrefixFilter = ref('')
export const logPrefixOptions = computed(() => {
  const starts: string[] = []

  for (const log of logs.value) {
    const index = log.payload.indexOf(' ')
    const start = index === -1 ? log.payload : log.payload.slice(0, index)

    if (!starts.includes(start)) {
      starts.push(start)
    }
  }

  return starts.sort()
})

let cancel: () => void
let logsTemp: LogWithSeq[] = []

const sliceLogs = throttle(() => {
  logs.value = logsTemp.concat(logs.value).slice(0, logRetentionLimit.value)
  logsTemp = []
}, 500)

const ipSourceMatchs: [RegExp, string][] = []
const restructMatchs = () => {
  ipSourceMatchs.length = 0
  for (const { key, label } of sourceIPLabelList.value) {
    if (key.startsWith('/')) continue
    const regex = new RegExp(key + ':', 'ig')

    ipSourceMatchs.push([regex, `${key} (${label}) :`])
  }
}

watch(
  sourceIPLabelList,
  () => {
    restructMatchs()
  },
  {
    immediate: true,
  },
)

export const initLogs = () => {
  cancel?.()
  logs.value = []
  logsTemp = []

  let idx = 1
  const ws = fetchLogsAPI<Log>({
    level: logLevel.value,
  })

  const unwatch = watch(ws.data, (data) => {
    if (!data) return

    if (isPaused.value) {
      idx++
      return
    }

    for (const [regex, label] of ipSourceMatchs) {
      data.payload = data.payload.replace(regex, label)
    }

    logsTemp.unshift({
      ...data,
      time: dayjs().format('HH:mm:ss'),
      seq: idx++,
    })

    sliceLogs()
  })

  cancel = () => {
    unwatch()
    ws.close()
  }
}
