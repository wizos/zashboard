<template>
  <div
    class="relative h-20 cursor-pointer"
    ref="cardWrapperRef"
    @click="handlerGroupClick"
    @touchmove="preventDefault"
    @wheel="preventDefault"
  >
    <div
      v-if="modalMode"
      class="fixed inset-0 z-40 overflow-hidden bg-black/30 transition-all duration-300"
    ></div>
    <div
      class="card absolute overflow-hidden transition-[height,width,left,top,right,bottom] duration-200 will-change-[height,width,left,top,right,bottom]"
      :class="blurIntensity < 5 && 'backdrop-blur-sm!'"
      :style="cardStyle"
      @contextmenu.prevent.stop="handlerLatencyTest"
      @transitionend="handlerTransitionEnd"
      ref="cardRef"
    >
      <div class="flex h-20 shrink-0 flex-col p-2 pb-1">
        <div class="flex flex-1">
          <div class="flex flex-1 flex-col gap-0.5 overflow-hidden">
            <div class="text-md truncate">
              {{ proxyGroup.name }}
            </div>
            <div class="text-base-content/80 flex items-center gap-1 truncate">
              <ProxyGroupNow
                :name="proxyGroup.name"
                :mobile="true"
              />
            </div>
          </div>
          <ProxyIcon
            v-if="proxyGroup?.icon"
            :icon="proxyGroup.icon"
            size="small"
            class="h-10 w-10! shrink-0"
          />
        </div>

        <div class="flex items-center">
          <div class="flex flex-1 items-center gap-1 truncate">
            <span class="text-base-content/60 shrink-0 text-xs">
              {{ proxyGroup.type }} ({{ proxiesCount }})
            </span>
            <button
              v-if="manageHiddenGroup"
              class="btn btn-circle btn-xs z-10"
              @click.stop="handlerGroupToggle"
            >
              <EyeIcon
                v-if="!hiddenGroup"
                class="h-3 w-3"
              />
              <EyeSlashIcon
                v-else
                class="h-3 w-3"
              />
            </button>
          </div>
          <LatencyTag
            :class="twMerge('bg-base-200/50 z-10 hover:shadow-sm')"
            :loading="isLatencyTesting"
            :name="proxyGroup.now"
            :group-name="proxyGroup.name"
            @click.stop="handlerLatencyTest"
          />
        </div>
      </div>

      <div
        v-if="modalMode"
        class="overflow-x-hidden overflow-y-auto overscroll-contain p-2"
        style="width: calc(100vw - 1rem)"
        ref="cardContentRef"
        @touchmove.stop="preventDefaultForContent"
        @wheel.stop="preventDefaultForContent"
      >
        <Component
          :is="groupProxiesByProvider ? ProxiesByProvider : ProxiesContent"
          :name="name"
          :now="proxyGroup.now"
          :render-proxies="renderProxies"
          :show-full-content="showAllContent"
          style="max-height: unset !important"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useBounceOnVisible } from '@/composables/bouncein'
import { useRenderProxies } from '@/composables/renderProxies'
import { isHiddenGroup } from '@/helper'
import { hiddenGroupMap, proxyGroupLatencyTest, proxyMap } from '@/store/proxies'
import { blurIntensity, groupProxiesByProvider, manageHiddenGroup } from '@/store/settings'
import { EyeIcon, EyeSlashIcon } from '@heroicons/vue/24/outline'
import { twMerge } from 'tailwind-merge'
import { computed, nextTick, ref } from 'vue'
import LatencyTag from './LatencyTag.vue'
import ProxiesByProvider from './ProxiesByProvider.vue'
import ProxiesContent from './ProxiesContent.vue'
import ProxyGroupNow from './ProxyGroupNow.vue'
import ProxyIcon from './ProxyIcon.vue'

const props = defineProps<{
  name: string
}>()
const proxyGroup = computed(() => proxyMap.value[props.name])
const allProxies = computed(() => proxyGroup.value.all ?? [])
const { proxiesCount, renderProxies } = useRenderProxies(allProxies, props.name)
const isLatencyTesting = ref(false)

const modalMode = ref(false)
const showAllContent = ref(modalMode.value)

const cardWrapperRef = ref()
const cardRef = ref()
const cardContentRef = ref()
const overflowY = ref(false)

const INIT_STYLE = {
  width: '100%',
  height: '100%',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 10,
}
const cardStyle = ref<Record<string, string | number>>({
  ...INIT_STYLE,
})
const calcCardStyle = () => {
  if (!cardWrapperRef.value) return
  if (!modalMode.value) {
    const style: Record<string, string | number> = {
      width: '100%',
      height: '100%',
      zIndex: 50,
    }

    ;['top', 'left', 'right', 'bottom'].forEach((key) => {
      if (Reflect.has(cardStyle.value, key)) {
        style[key] = 0
      }
    })

    cardStyle.value = style
    return
  }

  const { x, y, height, bottom, top } = cardWrapperRef.value.getBoundingClientRect()
  const { innerHeight, innerWidth } = window
  const safeArea = innerHeight * 0.15
  const leftRightKey = x < innerWidth / 3 ? 'left' : 'right'
  const topBottomKey = y + height / 2 < innerHeight / 2 ? 'top' : 'bottom'

  const verticalOffset = topBottomKey === 'top' ? top : innerHeight - bottom
  let topBottomValue = 0

  if (topBottomKey === 'top') {
    if (y < safeArea) {
      topBottomValue = safeArea - y
    }
  } else {
    if (y + height > innerHeight - safeArea) {
      topBottomValue = y + height - (innerHeight - safeArea)
    }
  }

  cardStyle.value = {
    width: 'calc(100vw - 1rem)',
    maxHeight: `calc(100dvh - ${Math.max(safeArea, verticalOffset)}px - 6rem)`,
    [leftRightKey]: 0,
    [topBottomKey]: topBottomValue + 'px',
    zIndex: 50,
  }
}

const handlerTransitionEnd = () => {
  showAllContent.value = modalMode.value
  if (!modalMode.value) {
    cardStyle.value = {
      ...INIT_STYLE,
    }
  } else {
    nextTick(() => {
      overflowY.value = cardContentRef.value.scrollHeight > cardContentRef.value.clientHeight
    })
  }
}

const handlerGroupClick = async () => {
  modalMode.value = !modalMode.value
  calcCardStyle()
}

const handlerLatencyTest = async () => {
  if (isLatencyTesting.value) return

  isLatencyTesting.value = true
  try {
    await proxyGroupLatencyTest(props.name)
    isLatencyTesting.value = false
  } catch {
    isLatencyTesting.value = false
  }
}
const hiddenGroup = computed({
  get: () => isHiddenGroup(props.name),
  set: (value: boolean) => {
    hiddenGroupMap.value[props.name] = value
  },
})

const handlerGroupToggle = () => {
  hiddenGroup.value = !hiddenGroup.value
}

const preventDefault = (e: Event) => {
  if (modalMode.value) {
    e.preventDefault()
  }
}

const preventDefaultForContent = (e: Event) => {
  if (!overflowY.value) {
    e.preventDefault()
  }
}

useBounceOnVisible(cardRef)
</script>
