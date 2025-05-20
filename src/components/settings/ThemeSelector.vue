<template>
  <div class="join-item input input-sm w-48 p-0">
    <button
      class="h-full w-full cursor-pointer text-left indent-4"
      :popovertarget="`popover-${id}`"
      :style="`anchor-name: --${id}`"
    >
      {{ theme }}
    </button>
    <ul
      class="dropdown card mt-2 h-96 w-48"
      popover
      :id="`popover-${id}`"
      :style="`position-anchor: --${id}`"
    >
      <li
        v-for="themeName in themes"
        :key="themeName"
        @click="theme = themeName"
        class="hover:bg-base-200 flex cursor-pointer items-center gap-2 p-2"
        :data-theme="themeName"
      >
        <div class="bg-primary rounded-field h-3 w-5 shadow"></div>
        <span :class="{ 'font-bold': theme === themeName }">{{ themeName }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ALL_THEME } from '@/constant'
import { customThemes } from '@/store/settings'
import { v4 as uuid } from 'uuid'
import { computed } from 'vue'

const id = uuid()
const theme = defineModel<string>('value', {
  type: String,
  required: true,
})

const themes = computed(() => {
  if (customThemes.value.length) {
    return [...ALL_THEME, ...customThemes.value.map((theme) => theme.name)]
  }

  return ALL_THEME
})
</script>
