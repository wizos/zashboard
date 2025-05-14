import { isSingBox } from '@/api'
import { LOG_LEVEL } from '@/constant'
import { isMiddleScreen } from '@/helper/utils'
import {
  initLogs,
  isPaused,
  logFilter,
  logLevel,
  logPrefixFilter,
  logPrefixOptions,
  logs,
} from '@/store/logs'
import { logRetentionLimit, logSearchHistory } from '@/store/settings'
import { PauseIcon, PlayIcon, WrenchScrewdriverIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import { debounce } from 'lodash'
import { computed, defineComponent, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import DialogWrapper from '../common/DialogWrapper.vue'
import TextInput from '../common/TextInput.vue'

export default defineComponent({
  props: {
    horizontal: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    const { t } = useI18n()
    const settingsModel = ref(false)
    const insertLogSearchHistory = debounce((log: string) => {
      if (!log) {
        return
      }

      const idx = logSearchHistory.value.indexOf(log)

      if (idx !== -1) {
        logSearchHistory.value.splice(idx, 1)
      }

      logSearchHistory.value.unshift(log)
      if (logSearchHistory.value.length > 5) {
        logSearchHistory.value.pop()
      }
    }, 1500)

    watch(logFilter, insertLogSearchHistory)

    const logLevels = computed(() => {
      if (isSingBox.value) {
        return Object.values(LOG_LEVEL)
      }
      return [LOG_LEVEL.Debug, LOG_LEVEL.Info, LOG_LEVEL.Warning, LOG_LEVEL.Error, LOG_LEVEL.Silent]
    })

    return () => {
      const levelSelect = (
        <select
          class={['join-item select select-sm']}
          v-model={logLevel.value}
          onChange={initLogs}
        >
          {logLevels.value.map((opt) => (
            <option
              key={opt}
              value={opt}
            >
              {opt}
            </option>
          ))}
        </select>
      )
      const searchInput = (
        <TextInput
          v-model={logFilter.value}
          beforeClose={true}
          class="flex-1"
          placeholder={`${t('search')} | Regex`}
          clearable={true}
          menus={logSearchHistory.value}
          menusDeleteable={true}
          onUpdate:menus={(val) => (logSearchHistory.value = val)}
        />
      )

      const logPrefixSelect = (
        <select
          class={['join-item select select-sm w-36', !props.horizontal && 'w-full']}
          v-model={logPrefixFilter.value}
        >
          <option value="">{t('all')}</option>
          {logPrefixOptions.value.map((opt) => (
            <option
              key={opt}
              value={opt}
            >
              {opt}
            </option>
          ))}
        </select>
      )

      const settingsModal = (
        <>
          <button
            class={'btn btn-circle btn-sm'}
            onClick={() => (settingsModel.value = true)}
          >
            <WrenchScrewdriverIcon class="h-4 w-4" />
          </button>
          <DialogWrapper v-model={settingsModel.value}>
            <div class="flex flex-col gap-4 p-2 text-sm">
              <div class="flex items-center gap-2">
                {t('logRetentionLimit')}
                <input
                  class="input input-sm w-20"
                  type="number"
                  max="9999"
                  v-model={logRetentionLimit.value}
                />
              </div>
            </div>
          </DialogWrapper>
        </>
      )

      const buttons = (
        <div class="flex items-center gap-2">
          {settingsModal}
          <button
            class="btn btn-circle btn-sm"
            onClick={() => (isPaused.value = !isPaused.value)}
          >
            {isPaused.value ? <PlayIcon class="h-4 w-4" /> : <PauseIcon class="h-4 w-4" />}
          </button>
          <button
            class="btn btn-circle btn-sm"
            onClick={() => (logs.value = [])}
          >
            <XMarkIcon class="h-4 w-4" />
          </button>
        </div>
      )

      if (props.horizontal) {
        if (isMiddleScreen.value) {
          return (
            <div class="flex flex-col items-center justify-between gap-2 p-2">
              <div class="flex w-full items-center justify-between gap-2">
                {logPrefixSelect}
                {buttons}
              </div>
              <div class="join w-full">
                {levelSelect}
                {searchInput}
              </div>
            </div>
          )
        }
        return (
          <div class="flex items-center justify-between gap-2 p-2">
            <div class="join max-w-128 flex-1">
              {levelSelect}
              {logPrefixSelect}
              {searchInput}
            </div>
            {buttons}
          </div>
        )
      }
      return (
        <div class="flex w-full flex-col items-center gap-2 p-2">
          <div class="flex w-full items-center gap-2">
            {logPrefixSelect}
            {buttons}
          </div>
          <div class="join w-full">
            {levelSelect}
            {searchInput}
          </div>
        </div>
      )
    }
  },
})
