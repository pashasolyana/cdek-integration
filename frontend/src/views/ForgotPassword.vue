<template>
  <div class="fp-page">
    <div class="fp-modal">
      <div class="fp-container">
        <!-- back only on step 2 -->
        <button v-if="step === 2" class="back-btn" aria-label="Назад" @click="goStep(1)">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path :d="mdiArrowLeft" />
          </svg>
        </button>

        <header class="fp-header">
          <h2 class="fp-title">
            {{ step === 1 ? 'Забыли пароль?' : 'Восстановление пароля' }}
          </h2>
          <p class="fp-subtitle" v-if="step === 1">
            Восстановите пароль и создавайте <br />
            заказы как компания
          </p>
          <p class="fp-subtitle" v-else>
            Код подтверждения был отправлен на номер <b>{{ maskedPhone }}</b>
          </p>
        </header>

        <!-- Шаг 1: ввод телефона -->
        <form v-if="step === 1" class="fp-form" novalidate @submit.prevent="onNext">
          <div class="form-field">
            <label class="field-label">Номер телефона</label>
            <input
              class="form-input"
              v-model="phone"
              type="tel"
              inputmode="tel"
              placeholder="+7(999)999-99-99"
              :class="inputClass(phoneValid, 'phone')"
              :aria-invalid="t.phone && !phoneValid"
              @blur="touch('phone')"
            />
            <p v-if="t.phone && !phoneValid" class="field-error">Формат RU: +7… / 8… / 7…</p>
          </div>

          <p v-if="serverError" class="server-error" role="alert">{{ serverError }}</p>

          <div class="actions">
            <button type="button" class="btn btn-outline" @click="onCancel">Отмена</button>
            <button type="submit" class="btn btn-primary" :disabled="loading || !phoneValid">
              {{ loading ? 'Отправляем…' : 'Далее' }}
            </button>
          </div>
        </form>

        <!-- Шаг 2: ввод кода -->
        <form v-else class="rv-form" novalidate @submit.prevent="onVerify">
          <label class="code-label">Введите код подтверждения ниже</label>

          <div class="code-inputs" :class="{ invalid: isInvalid }">
            <input
              v-for="(_, i) in code"
              :key="i"
              :ref="(el) => (codeRefs[i] = el as HTMLInputElement)"
              class="code-box"
              inputmode="numeric"
              maxlength="1"
              autocomplete="one-time-code"
              :aria-label="`Цифра ${i + 1}`"
              v-model="code[i]"
              @input="onDigitInput(i, $event)"
              @keydown.backspace.prevent="onBackspace(i)"
              @paste.prevent="onPaste"
            />
          </div>

          <p class="hint">Отправить код повторно можно через</p>
          <div class="timer" :class="{ active: !canResend }">{{ timeLeft }}</div>

          <button v-if="canResend" type="button" class="resend" @click="resend" :disabled="loading">
            Отправить код повторно
          </button>

          <p v-if="serverError" class="server-error" role="alert">{{ serverError }}</p>

          <button type="submit" class="btn btn-primary verify-btn" :disabled="!complete || loading">
            {{ loading ? 'Проверяем…' : 'Подтвердить телефон' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import apiService from '@/services/api'
import { mdiArrowLeft } from '@mdi/js'

/* шаги */
const step = ref<1 | 2>(1)
function goStep(s: 1 | 2) {
  step.value = s
}

/* роутер */
const router = useRouter()
const route = useRoute()

/* телефон */
const phone = ref<string>(String(route.query.phone || ''))
const loading = ref(false)
const serverError = ref<string | null>(null)

type Key = 'phone'
const t = ref<Record<Key, boolean>>({ phone: false })
function touch(k: Key) {
  t.value[k] = true
}
function inputClass(valid: boolean, k: Key) {
  return { 'is-invalid': t.value[k] && !valid, 'is-valid': t.value[k] && valid }
}
const onlyDigits = (s: string) => (s || '').replace(/\D/g, '')
const phoneValid = computed(() => {
  const d = onlyDigits(phone.value)
  return d.length === 11 && (d.startsWith('7') || d.startsWith('8'))
})
const maskedPhone = computed(() => {
  const d = (phone.value || '').replace(/\D/g, '')
  if (d.length < 11) return phone.value
  return `+7(${d.slice(1, 4)})***-**-${d.slice(-2)}`
})

/* шаг 1 */
function onCancel() {
  router.push('/login')
}

async function onNext() {
  serverError.value = null
  touch('phone')
  if (!phoneValid.value) return

  try {
    loading.value = true
    await apiService.getInstance().post('/auth/forgot', { phone: phone.value.trim() })
    goStep(2)
    focus(0)
    startTimer()
  } catch (err: any) {
    const msg = err?.response?.data?.message
    serverError.value = Array.isArray(msg) ? msg.join(', ') : msg || 'Не удалось отправить код'
  } finally {
    loading.value = false
  }
}

/* шаг 2: код */
const code = ref<string[]>(['', '', '', '', '', ''])
const codeRefs = ref<HTMLInputElement[]>([])
const isInvalid = ref(false)
const codeStr = computed(() => code.value.join(''))
const complete = computed(() => codeStr.value.length === 6)

function focus(i: number) {
  nextTick(() => codeRefs.value[i]?.focus())
}
function onDigitInput(i: number, e: Event) {
  const el = e.target as HTMLInputElement
  const v = el.value.replace(/\D/g, '').slice(0, 1)
  code.value[i] = v
  if (v && i < 5) focus(i + 1)
  isInvalid.value = false
}
function onBackspace(i: number) {
  if (code.value[i]) {
    code.value[i] = ''
  } else if (i > 0) {
    code.value[i - 1] = ''
    focus(i - 1)
  }
  isInvalid.value = false
}
function onPaste(e: ClipboardEvent) {
  const digits = (e.clipboardData?.getData('text') || '').replace(/\D/g, '').slice(0, 6)
  if (!digits) return
  for (let i = 0; i < 6; i++) code.value[i] = digits[i] || ''
  if (digits.length >= 6) focus(5)
  isInvalid.value = false
}

/* таймер и ресенд */
const duration = 60
const left = ref(duration)
let ticker: any = null
const canResend = computed(() => left.value <= 0)
const timeLeft = computed(() => {
  const s = Math.max(left.value, 0)
  const mm = Math.floor(s / 60)
  const ss = String(s % 60).padStart(2, '0')
  return `${mm}:${ss}`
})
function startTimer() {
  clearInterval(ticker)
  left.value = duration
  ticker = setInterval(() => {
    left.value--
    if (left.value <= 0) clearInterval(ticker)
  }, 1000)
}
async function resend() {
  try {
    loading.value = true
    serverError.value = null
    await apiService.getInstance().post('/auth/forgot', { phone: phone.value.trim() })
    startTimer()
  } catch (err: any) {
    const msg = err?.response?.data?.message
    serverError.value = Array.isArray(msg) ? msg.join(', ') : msg || 'Не удалось отправить код'
  } finally {
    loading.value = false
  }
}

async function onVerify() {
  if (!complete.value) return
  serverError.value = null
  isInvalid.value = false
  try {
    loading.value = true
    const { data } = await apiService.getInstance().post('/auth/forgot/verify', {
      phone: phone.value.trim(),
      code: codeStr.value,
    })
    alert(`Ваш новый пароль: ${data?.password}`) // при желании отправляйте по SMS и уберите alert
    router.push('/login')
  } catch (err: any) {
    isInvalid.value = true
    const msg = err?.response?.data?.message
    serverError.value = Array.isArray(msg)
      ? msg.join(', ')
      : msg || 'Неверный код или истёк срок действия'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (route.query.phone) {
    touch('phone')
    if (phoneValid.value) onNext()
  }
})
</script>

<style scoped>
/* Общий контейнер */
.fp-page {
  min-height: calc(100dvh - var(--header-current) - var(--footer-current));
  padding: 64px 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f4f4f4;
}

/* Карточка (увеличена) */
.fp-modal {
  width: clamp(420px, calc(100% - 14vw), 960px);
  background: #ffffff;
  border-radius: 28px;
  box-shadow:
    0 24px 60px rgba(15, 43, 81, 0.1),
    0 12px 24px rgba(15, 43, 81, 0.05);
  display: flex;
  justify-content: center;
}

.fp-container {
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  padding: 48px 72px 56px;
  position: relative;
}

/* Кнопка Назад только на шаге 2 */
.back-btn {
  position: absolute;
  left: 24px;
  top: 24px;
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  cursor: pointer;
}

.back-btn svg {
  width: 22px;
  height: 22px;
  fill: #9ca3af;
}

.back-btn:hover svg {
  fill: #6b7280;
}

/* Заголовок */
.fp-header {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.fp-title {
  font-size: 36px;
  font-weight: 700;
  color: #171717;
  margin: 0;
}

.fp-subtitle {
  font-size: 16px;
  color: #6b7280;
  margin: 0;
  line-height: 1.4;
}

/* Шаг 1 форма */
.fp-form {
  display: flex;
  flex-direction: column;
  gap: 22px;
  width: 100%;
  max-width: 600px;
  margin: 20px auto 0;
}

.form-field {
  display: flex;
  flex-direction: column;
}

.field-label {
  font-size: 12px;
  color: #111827;
  font-weight: 600;
  margin-bottom: 6px;
}

.form-input {
  height: 56px;
  padding: 0 18px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  font-size: 16px;
  color: #111827;
  background: #fff;
  transition:
    border-color 0.2s,
    box-shadow 0.2s,
    background 0.2s;
}

.form-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.08);
}

.form-input::placeholder {
  color: #9ca3af;
}

.is-invalid {
  border-color: #ef4444 !important;
  background: #fff7f7;
}

.is-valid {
  border-color: #34d399;
}

.field-error {
  margin-top: 6px;
  font-size: 12px;
  color: #ef4444;
}

.actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
  margin-top: 6px;
}

.btn {
  height: 56px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition:
    transform 0.2s,
    box-shadow 0.2s,
    background 0.2s,
    color 0.2s,
    border-color 0.2s;
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.08);
}

.btn-primary {
  background: #1f402e;
  border: 1px solid #1f402e;
  color: #fff;
}

.btn-primary:hover {
  background: #183323;
  border-color: #183323;
}

.btn-outline {
  background: #fff;
  border: 1.5px solid #1f402e;
  color: #1f402e;
}

.btn-outline:hover {
  background: #f6faf7;
}

.server-error {
  margin-top: -8px;
  color: #ef4444;
  font-size: 13px;
}

/* Шаг 2: код */
.rv-form {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
  max-width: 600px;
  margin: 24px auto 0;
}

.code-label {
  font-size: 14px;
  color: #111827;
  font-weight: 600;
}

.code-inputs {
  display: grid;
  grid-template-columns: repeat(6, 64px);
  justify-content: center;
  gap: 12px;
}

.code-box {
  width: 64px;
  height: 64px;
  text-align: center;
  font-size: 24px;
  font-weight: 700;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  outline: none;
  background: #f3f4f6;
  transition:
    border-color 0.2s,
    box-shadow 0.2s,
    background 0.2s;
}

.code-box:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.08);
  background: #fff;
}

.code-inputs.invalid .code-box {
  border-color: #ef4444 !important;
  background: #fff7f7;
}

.hint {
  margin-top: 4px;
  font-size: 12px;
  color: #6b7280;
}

.timer {
  font-size: 14px;
  color: #6b7280;
}

.timer.active {
  font-weight: 600;
  color: #111827;
}

.resend {
  margin-top: -4px;
  background: none;
  border: none;
  color: #2563eb;
  cursor: pointer;
  font-size: 14px;
}

.resend:hover {
  text-decoration: underline;
}

.verify-btn {
  max-width: 420px;
  margin-top: 6px;
}

@media (max-width: 768px) {
  .fp-container {
    padding: 36px 24px 36px;
  }

  .fp-title {
    font-size: 28px;
  }

  .fp-form {
    max-width: 100%;
  }

  .code-inputs {
    grid-template-columns: repeat(6, 48px);
    gap: 8px;
  }

  .code-box {
    width: 48px;
    height: 56px;
    font-size: 22px;
  }

  .btn {
    height: 50px;
  }
}
</style>
