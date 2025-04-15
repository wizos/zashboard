import { isMiddleScreen } from '@/helper/utils'
import { useCurrentElement } from '@vueuse/core'
import { onBeforeUnmount, onMounted, type ComputedRef } from 'vue'

export function useBounceOnVisible(className = 'bounce-in') {
  if (!isMiddleScreen.value) return

  const el = useCurrentElement() as ComputedRef<HTMLElement | null>
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        el.value?.classList.add(className)
        el.value!.style.opacity = 'unset'
      } else {
        el.value?.classList.remove(className)
        el.value!.style.opacity = '0'
      }
    },
    {
      threshold: 0,
      rootMargin: '10px 0px 10px 0px',
    },
  )

  onMounted(() => {
    if (!el.value) return

    el.value.style.opacity = '0'
    observer.observe(el.value)
  })

  onBeforeUnmount(() => {
    observer.disconnect()
  })
}
