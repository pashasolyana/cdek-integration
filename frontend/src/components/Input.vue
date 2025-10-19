<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  modelValue?: string | number
  type?: 'text' | 'number' | 'date' | 'email' | 'password' | 'tel'
  placeholder?: string
  disabled?: boolean
  width?: string
  height?: string
  error?: string
}

interface Emits {
  (e: 'update:modelValue', value: string): void
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  modelValue: '',
  placeholder: '',
  disabled: false,
  error: '',
})

const emit = defineEmits<Emits>()

const internalValue = computed({
  get: () => props.modelValue,
  set: (value: string | number) => {
    emit('update:modelValue', String(value))
  }
})

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  internalValue.value = target.value
}
</script>

<template>
  <div class="input-container" :style="{ width: props.width, height: props.height }">
    <input
      class="input-field"
      :type="props.type"
      :value="internalValue"
      :placeholder="props.placeholder"
      :disabled="props.disabled"
      :class="{ 'has-error': !!props.error }"
      @input="handleInput"
    />
    <div v-if="props.error" class="error-message">{{ props.error }}</div>
  </div>
</template>

<style scoped>
.input-container {
  display: flex;
  flex-direction: column;
}

.input-field {
  width: 100%;
  height: 100%;
  padding: 15px 20px;
  border-radius: 5px;
  border: 1px solid #ccc;
  font-size: 14px;
  font-family: 'Montserrat', sans-serif;
  outline: none;
  transition: all 0.3s ease;
  background: white;
}

.input-field:focus {
  border-color: #344e41;
  box-shadow: 0 0 0 2px rgba(52, 78, 65, 0.1);
}

.input-field:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
  color: #999;
}

.input-field::placeholder {
  color: #aaa;
}

.input-field.has-error {
  border-color: #dc3545;
}

.input-field.has-error:focus {
  box-shadow: 0 0 0 2px rgba(220, 53, 69, 0.1);
}

.error-message {
  color: #dc3545;
  font-size: 12px;
  margin-top: 5px;
  margin-left: 5px;
}
</style>
