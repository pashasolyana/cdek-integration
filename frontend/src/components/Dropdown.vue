<script setup lang="ts">
import { ref, defineProps, defineEmits, computed, watch } from 'vue'

const props = defineProps<{
  modelValue: string | null
  options: { value: string; label: string }[]
  placeholder: string
  width: string
  height: string
  disabled?: boolean
}>()

const emit = defineEmits(['update:modelValue'])

const isOpen = ref(false)
const selectedValue = ref(props.modelValue)

watch(
  () => props.modelValue,
  (newVal) => {
    selectedValue.value = newVal
  },
)

const selectedValueLabel = computed(() => {
  const found = props.options.find((o) => o.value === selectedValue.value)
  return found ? found.label : ''
})

const isDropdownEnabled = computed(() => props.disabled)

const toggle = () => {
  if (isDropdownEnabled.value) return
  isOpen.value = !isOpen.value
}

const selectOption = (option: { value: string; label: string }) => {
  if (isDropdownEnabled.value) return
  selectedValue.value = option.value
  emit('update:modelValue', option.value)
  isOpen.value = false
}
</script>

<template>
  <div
    class="dropdown"
    :class="{ disabled: isDropdownEnabled }"
    @click="toggle"
    :style="{ width: width, minHeight: height, border: isOpen ? '1px solid #344E41' : 'none' }"
  >
    <div class="dropdown-selected" :style="{ height: height }">
      <span :class="{ placeholder: !selectedValue }">
        {{ selectedValueLabel || placeholder }}
      </span>
      <span class="arrow">
        <svg
          width="18"
          height="11"
          viewBox="0 0 18 11"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M15.9355 0.739817L17.3521 2.15769L9.63194 9.88049C9.50824 10.005 9.36114 10.1038 9.1991 10.1712C9.03707 10.2386 8.8633 10.2733 8.68781 10.2733C8.51231 10.2733 8.33854 10.2386 8.17651 10.1712C8.01447 10.1038 7.86737 10.005 7.74367 9.88049L0.0195313 2.15769L1.43607 0.741153L8.6858 7.98955L15.9355 0.739817Z"
            fill="#344E41"
          />
        </svg>
      </span>
    </div>

    <ul v-if="isOpen" class="dropdown-options">
      <li class="option-placeholder">{{ placeholder }}</li>
      <li class="option" v-for="option in options" :key="option.value" @click.stop="selectOption(option)">
        {{ option.label }}
      </li>
    </ul>
  </div>
</template>

<style scoped>
.dropdown {
  position: relative;
  user-select: none;
  cursor: pointer;
  transition: opacity 0.2s ease;
  border-radius: 5px;
}

.dropdown.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.dropdown-selected {
  height: 100%;
  background-color: #ffffff;
  border-radius: 5px;
  padding: 6px 15px 6px 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
}

.placeholder {
  color: #aaa;
}

.dropdown-options {
  position: absolute;
  width: 100%;
  border-radius: 6px;
  margin-top: 2px;
  background: white;
  list-style: none;
  padding: 0;
  max-height: 150px;
  overflow-y: auto;
  z-index: 10;
}

.option-placeholder {
  opacity: 0.5;
  cursor: default;
  padding: 6px 10px;
}

.option {
  padding: 6px 10px;
}

.option:hover {
  background: #f0f0f0;
}
</style>
