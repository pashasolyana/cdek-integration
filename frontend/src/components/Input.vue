<script setup lang="ts">
const props = defineProps({
  type: {
    type: String,
    default: 'text',
    validator: (value: string) => {
      return ['text', 'number', 'date', 'email', 'password'].includes(value)
    },
  },
  value: {
    type: [String, Number],
    default: '',
  },
  placeholder: {
    type: String,
    default: '',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  width: {
    type: String,
  },
  height: {
    type: String,
  },
  border: {
    type: String,
    default: 'none',
  },
})
</script>

<template>
  <div
    class="input-container"
    :style="{ width: props.width, height: props.height, border: props.border }"
  >
    <input
      :type="props.type"
      :value="props.value"
      :placeholder="props.placeholder"
      :disabled="props.disabled"
    />
  </div>
</template>

<style scoped>
.input-container {
  display: flex;
  flex-direction: column;
  border-radius: 5px;
}

input {
  width: 100%;
  height: 100%;
  padding: 10px;
  border-radius: 5px;
  border-width: 0px;
  font-size: 16px;
  outline: none;
  padding-left: 20px;
  padding-right: 10px;
}
</style>
