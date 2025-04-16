import { isMiddleScreen } from '@/helper/utils'
import { scrollAnimationEffect } from '@/store/settings'
import { useCurrentElement, useElementVisibility } from '@vueuse/core'
import { onMounted, watch } from 'vue'

export function useBounceOnVisible(className = 'bounce-in') {
  if (!isMiddleScreen.value || !scrollAnimationEffect.value) return

  const el = useCurrentElement<HTMLElement>()
  const visible = useElementVisibility(el)

  onMounted(() => {
    if (!el.value) return

    el.value.style.opacity = '0'

    watch(
      visible,
      (value) => {
        if (value) {
          el.value?.classList.add(className)
          el.value!.style.opacity = 'unset'
        } else {
          el.value?.classList.remove(className)
          el.value!.style.opacity = '0'
        }
      },
      { immediate: true },
    )
  })
}
