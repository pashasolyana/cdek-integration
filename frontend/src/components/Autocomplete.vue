<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

interface Suggestion {
  value: string
  label: string
  data?: any
}

interface Props {
  modelValue: string
  placeholder?: string
  width?: string
  height?: string
  disabled?: boolean
  suggestions: Suggestion[]
  loading?: boolean
  error?: string
  minChars?: number
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'select', suggestion: Suggestion): void
  (e: 'input', value: string): void
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '',
  width: '100%',
  height: '54px',
  disabled: false,
  loading: false,
  error: '',
  minChars: 2
})

const emit = defineEmits<Emits>()

const inputRef = ref<HTMLInputElement | null>(null)
const dropdownRef = ref<HTMLElement | null>(null)
const showDropdown = ref(false)
const selectedIndex = ref(-1)
const isFocused = ref(false)

const internalValue = computed({
  get: () => props.modelValue,
  set: (value: string) => {
    emit('update:modelValue', value)
    emit('input', value)
  }
})

const shouldShowSuggestions = computed(() => {
  return (
    showDropdown.value &&
    props.suggestions.length > 0 &&
    internalValue.value.length >= props.minChars &&
    !props.disabled
  )
})

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  internalValue.value = target.value
  selectedIndex.value = -1
  showDropdown.value = true
}

const handleFocus = () => {
  isFocused.value = true
  if (internalValue.value.length >= props.minChars && props.suggestions.length > 0) {
    showDropdown.value = true
  }
}

const handleBlur = () => {
  isFocused.value = false
  // Задержка чтобы клик по элементу успел сработать
  setTimeout(() => {
    showDropdown.value = false
  }, 200)
}

const selectSuggestion = (suggestion: Suggestion) => {
  internalValue.value = suggestion.label
  emit('select', suggestion)
  showDropdown.value = false
  selectedIndex.value = -1
}

const handleKeyDown = (event: KeyboardEvent) => {
  if (!shouldShowSuggestions.value) return

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      selectedIndex.value = Math.min(selectedIndex.value + 1, props.suggestions.length - 1)
      break
    case 'ArrowUp':
      event.preventDefault()
      selectedIndex.value = Math.max(selectedIndex.value - 1, -1)
      break
    case 'Enter':
      event.preventDefault()
      if (selectedIndex.value >= 0) {
        selectSuggestion(props.suggestions[selectedIndex.value])
      }
      break
    case 'Escape':
      showDropdown.value = false
      selectedIndex.value = -1
      break
  }
}

const handleClickOutside = (event: MouseEvent) => {
  if (
    inputRef.value &&
    dropdownRef.value &&
    !inputRef.value.contains(event.target as Node) &&
    !dropdownRef.value.contains(event.target as Node)
  ) {
    showDropdown.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

watch(() => props.suggestions, () => {
  if (isFocused.value && internalValue.value.length >= props.minChars) {
    showDropdown.value = props.suggestions.length > 0
  }
})
</script>

<template>
  <div class="autocomplete-wrapper" :style="{ width }">
    <div class="input-container">
      <input
        ref="inputRef"
        v-model="internalValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :class="{ 'has-error': error, 'is-loading': loading }"
        :style="{ height }"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
        @keydown="handleKeyDown"
      />
      <div v-if="loading" class="loading-spinner">
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="8" cy="8" r="6" stroke="#344E41" stroke-width="2" stroke-dasharray="10 5">
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 8 8"
              to="360 8 8"
              dur="1s"
              repeatCount="indefinite"
            />
          </circle>
        </svg>
      </div>
    </div>

    <transition name="dropdown">
      <div
        v-if="shouldShowSuggestions"
        ref="dropdownRef"
        class="suggestions-dropdown"
        :style="{ width }"
      >
        <div
          v-for="(suggestion, index) in suggestions"
          :key="index"
          :class="['suggestion-item', { selected: index === selectedIndex }]"
          @click="selectSuggestion(suggestion)"
          @mouseenter="selectedIndex = index"
        >
          {{ suggestion.label }}
        </div>
      </div>
    </transition>

    <div v-if="error" class="error-message">{{ error }}</div>
  </div>
</template>

<style scoped>
.autocomplete-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  background-color: white;
  border-radius: 5px;
}

.input-container {
  position: relative;
}

input {
  width: 100%;
  padding: 15px 40px 15px 20px;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 14px;
  font-family: 'Montserrat', sans-serif;
  transition: all 0.3s ease;
}

input:focus {
  outline: none;
  border-color: #344e41;
  box-shadow: 0 0 0 2px rgba(52, 78, 65, 0.1);
}

input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
  color: #999;
}

input.has-error {
  border-color: #dc3545;
}

input.has-error:focus {
  box-shadow: 0 0 0 2px rgba(220, 53, 69, 0.1);
}

.loading-spinner {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.suggestions-dropdown {
  position: absolute;
  top: calc(100% + 5px);
  left: 0;
  background: white;
  border: 1px solid #ccc;
  border-radius: 5px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-height: 300px;
  overflow-y: auto;
  z-index: 1000;
}

.suggestion-item {
  padding: 12px 20px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  font-size: 14px;
  border-bottom: 1px solid #f0f0f0;
}

.suggestion-item:last-child {
  border-bottom: none;
}

.suggestion-item:hover,
.suggestion-item.selected {
  background-color: #f0f5f3;
}

.error-message {
  color: #dc3545;
  font-size: 12px;
  margin-top: 5px;
  margin-left: 5px;
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
