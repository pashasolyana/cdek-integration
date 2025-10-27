<template>
  <div class="register-page">
    <div class="register-modal">
      <div class="register-container">
        <!-- Кнопка назад (только на шагах 2 и 3) -->
        <button v-if="currentStep > 1" class="back-button" @click="goBack">
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path :d="mdiArrowLeft" fill="currentColor" />
          </svg>
        </button>

        <header class="register-header">
          <h2 class="register-title">Регистрация</h2>
          <p class="register-subtitle">
            Создайте аккаунт для работы<br />с сервисом доставки
          </p>
        </header>

        <!-- Шаг 1: Основные данные -->
        <form v-if="currentStep === 1" class="register-form" novalidate @submit.prevent="sendCode">
          <div class="form-field">
            <label class="field-label">Имя <span class="field-required">*</span></label>
            <input
              class="form-input"
              v-model="form.firstName"
              type="text"
              placeholder="Иван"
              :class="inputClass(nameValid, 'firstName')"
              @blur="touch('firstName')"
            />
            <p v-if="t.firstName && !nameValid" class="field-error">Имя обязательно</p>
          </div>

          <div class="form-field">
            <label class="field-label">Фамилия <span class="field-required">*</span></label>
            <input
              class="form-input"
              v-model="form.lastName"
              type="text"
              placeholder="Иванов"
              :class="inputClass(surnameValid, 'lastName')"
              @blur="touch('lastName')"
            />
            <p v-if="t.lastName && !surnameValid" class="field-error">Фамилия обязательна</p>
          </div>

          <div class="form-field">
            <label class="field-label">Email (необязательно)</label>
            <input
              class="form-input"
              v-model="form.email"
              type="email"
              placeholder="example@mail.com"
              :class="inputClass(emailValidOrEmpty, 'email')"
              @blur="touch('email')"
            />
            <p v-if="t.email && !emailValidOrEmpty" class="field-error">Некорректный email</p>
          </div>

          <div class="form-field">
            <label class="field-label">Номер телефона <span class="field-required">*</span></label>
            <input
              class="form-input"
              v-model="form.phone"
              type="tel"
              inputmode="tel"
              placeholder="+7(999)999-99-99"
              :class="inputClass(phoneValid, 'phone')"
              @blur="touch('phone')"
            />
            <p v-if="t.phone && !phoneValid" class="field-error">Формат RU: +7… / 8… / 7…</p>
          </div>

          <p v-if="serverError" class="server-error">{{ serverError }}</p>

          <button type="submit" class="btn btn-primary" :disabled="loading || !step1Valid">
            {{ loading ? 'Отправка...' : 'Получить код' }}
          </button>

          <div class="authorize">
            Уже есть аккаунт? <a href="/login">Войти</a>
          </div>
        </form>

        <!-- Шаг 2: Ввод SMS кода -->
        <div v-if="currentStep === 2" class="code-form">
          <p class="code-label">
            Введите код из SMS<br />
            <span class="masked-phone">{{ maskedPhone }}</span>
          </p>

          <div class="code-inputs" :class="{ invalid: isInvalid }">
            <input
              v-for="i in 6"
              :key="i"
              :ref="(el) => (codeRefs[i - 1] = el as HTMLInputElement)"
              type="text"
              inputmode="numeric"
              maxlength="1"
              class="code-box"
              :value="code[i - 1]"
              @input="(e) => onDigitInput(i - 1, e)"
              @keydown.backspace="() => onBackspace(i - 1)"
              @paste="onPaste"
            />
          </div>

          <p v-if="isInvalid" class="field-error" style="text-align: center; margin-top: 8px">
            Неверный код
          </p>

          <p class="hint">Не получили код?</p>

          <p v-if="!canResend" class="timer active">Повторная отправка через {{ timeLeft }}</p>

          <button v-else class="resend" @click="resendCode" :disabled="loading">
            {{ loading ? 'Отправка...' : 'Отправить снова' }}
          </button>

          <p v-if="serverError" class="server-error" style="margin-top: 12px">{{ serverError }}</p>

          <button
            class="btn btn-primary verify-btn"
            :disabled="!complete || loading"
            @click="verifyCode"
          >
            {{ loading ? 'Проверка...' : 'Продолжить' }}
          </button>
        </div>

        <!-- Шаг 3: Пароль -->
        <form v-if="currentStep === 3" class="register-form" novalidate @submit.prevent="finishRegistration">
          <div class="form-section-title">Создайте пароль</div>

          <div class="form-field">
            <label class="field-label">Пароль <span class="field-required">*</span></label>
            <input
              class="form-input"
              v-model="form.password"
              type="password"
              placeholder="Введите пароль"
              :class="inputClass(allPwdRulesOk, 'password')"
              @blur="touch('password')"
            />
          </div>

          <!-- Правила пароля -->
          <div class="password-rules">
            <div class="rules-col">
              <li :class="{ ok: hasMinLen }">
                <i></i>Минимум 8 символов
              </li>
              <li :class="{ ok: hasDigit }">
                <i></i>Хотя бы одна цифра
              </li>
              <li :class="{ ok: hasUpper }">
                <i></i>Заглавная буква
              </li>
            </div>
            <div class="rules-col">
              <li :class="{ ok: hasLower }">
                <i></i>Строчная буква
              </li>
              <li :class="{ ok: hasSpecial }">
                <i></i>Спецсимвол (!@#$%...)
              </li>
            </div>
          </div>

          <div class="form-field">
            <label class="field-label">Подтверждение пароля <span class="field-required">*</span></label>
            <input
              class="form-input"
              v-model="form.confirmPassword"
              type="password"
              placeholder="Повторите пароль"
              :class="inputClass(passwordsMatch, 'confirmPassword')"
              @blur="touch('confirmPassword')"
            />
            <p v-if="t.confirmPassword" class="confirm-hint" :class="passwordsMatch ? 'hint-ok' : 'hint-err'">
              {{ passwordsMatch ? '✓ Пароли совпадают' : '✗ Пароли не совпадают' }}
            </p>
          </div>

          <p v-if="serverError" class="server-error">{{ serverError }}</p>

          <button type="submit" class="btn btn-primary" :disabled="loading || !finalFormValid">
            {{ loading ? 'Регистрация...' : 'Завершить регистрацию' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { mdiArrowLeft } from '@mdi/js'
import apiService, { type RegisterPayload } from '@/services/api'
import { useRouter } from 'vue-router'

const router = useRouter()

/** Шаги */
const currentStep = ref<1 | 2 | 3>(1)

function goBack() {
  if (currentStep.value > 1) {
    currentStep.value = (currentStep.value - 1) as 1 | 2 | 3
    serverError.value = null
  }
}

/** Состояния */
const loading = ref(false)
const serverError = ref<string | null>(null)

/** Форма данных */
const form = ref({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
})

/** touched-стейт */
type TKey = 'firstName' | 'lastName' | 'email' | 'phone' | 'password' | 'confirmPassword'
const t = ref<Record<TKey, boolean>>({
  firstName: false,
  lastName: false,
  email: false,
  phone: false,
  password: false,
  confirmPassword: false,
})

function touch(key: TKey) {
  t.value[key] = true
}

function inputClass(valid: boolean, key: TKey) {
  return { 'is-invalid': t.value[key] && !valid, 'is-valid': t.value[key] && valid }
}

/** Валидаторы */
const onlyDigits = (s: string) => (s || '').replace(/\D/g, '')
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const nameValid = computed(() => form.value.firstName.trim().length > 0)
const surnameValid = computed(() => form.value.lastName.trim().length > 0)
const emailValidOrEmpty = computed(() => !form.value.email || EMAIL_RE.test(form.value.email.trim()))
const phoneValid = computed(() => {
  const d = onlyDigits(form.value.phone)
  return d.length === 11 && (d.startsWith('7') || d.startsWith('8'))
})

const pwd = computed(() => form.value.password || '')
const hasMinLen = computed(() => pwd.value.length >= 8)
const hasDigit = computed(() => /\d/.test(pwd.value))
const hasUpper = computed(() => /[A-ZА-ЯЁ]/.test(pwd.value))
const hasLower = computed(() => /[a-zа-яё]/.test(pwd.value))
const hasSpecial = computed(() => /[^0-9A-Za-zА-Яа-яЁё_\s]/.test(pwd.value))
const passwordsMatch = computed(() => form.value.password && form.value.password === form.value.confirmPassword)
const allPwdRulesOk = computed(() => 
  hasMinLen.value && hasDigit.value && hasUpper.value && hasLower.value && hasSpecial.value
)

const step1Valid = computed(() => nameValid.value && surnameValid.value && emailValidOrEmpty.value && phoneValid.value)
const finalFormValid = computed(() => allPwdRulesOk.value && passwordsMatch.value)

/** Шаг 1: Отправка кода */
async function sendCode() {
  serverError.value = null
  touch('firstName')
  touch('lastName')
  touch('email')
  touch('phone')

  if (!step1Valid.value) return

  try {
    loading.value = true
    const result = await apiService.sendRegistrationCode(form.value.phone.trim())
    
    // В dev режиме покажем код в консоли
    if (result.devCode) {
      console.log('DEV CODE:', result.devCode)
    }
    
    currentStep.value = 2
    startTimer()
  } catch (err: any) {
    const msg = err?.response?.data?.message
    serverError.value = Array.isArray(msg) ? msg.join(', ') : msg || 'Не удалось отправить код'
  } finally {
    loading.value = false
  }
}

/** Шаг 2: SMS код */
const code = ref<string[]>(['', '', '', '', '', ''])
const codeRefs = ref<HTMLInputElement[]>([])
const isInvalid = ref(false)
const codeStr = computed(() => code.value.join(''))
const complete = computed(() => codeStr.value.length === 6)

const maskedPhone = computed(() => {
  const d = (form.value.phone || '').replace(/\D/g, '')
  if (d.length < 11) return form.value.phone
  return `+7(${d.slice(1, 4)})***-**-${d.slice(-2)}`
})

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

/** Таймер и ресенд */
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
    left.value -= 1
    if (left.value <= 0) clearInterval(ticker)
  }, 1000)
}

async function resendCode() {
  try {
    loading.value = true
    serverError.value = null
    const result = await apiService.sendRegistrationCode(form.value.phone.trim())
    if (result.devCode) {
      console.log('DEV CODE:', result.devCode)
    }
    code.value = ['', '', '', '', '', '']
    isInvalid.value = false
    startTimer()
  } catch (err: any) {
    const msg = err?.response?.data?.message
    serverError.value = Array.isArray(msg) ? msg.join(', ') : msg || 'Не удалось отправить код'
  } finally {
    loading.value = false
  }
}

async function verifyCode() {
  if (!complete.value) return
  serverError.value = null
  isInvalid.value = false

  try {
    loading.value = true
    await apiService.verifyRegistrationCode(form.value.phone.trim(), codeStr.value)
    currentStep.value = 3
  } catch (err: any) {
    isInvalid.value = true
    const msg = err?.response?.data?.message
    serverError.value = Array.isArray(msg) ? msg.join(', ') : msg || 'Неверный код'
  } finally {
    loading.value = false
  }
}

/** Шаг 3: Завершение регистрации */
async function finishRegistration() {
  serverError.value = null
  touch('password')
  touch('confirmPassword')

  if (!finalFormValid.value) return

  try {
    loading.value = true
    
    const payload: RegisterPayload = {
      firstName: form.value.firstName.trim(),
      lastName: form.value.lastName.trim(),
      email: form.value.email.trim() || undefined,
      phone: form.value.phone.trim(),
      password: form.value.password,
    }

    await apiService.register(payload)
    router.push('/')
  } catch (err: any) {
    const msg = err?.response?.data?.message
    serverError.value = Array.isArray(msg) ? msg.join(', ') : msg || 'Ошибка регистрации'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-page {
  min-height: calc(100dvh - var(--header-current) - var(--footer-current));
  padding: 56px 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f4f4f4;
}

.register-modal {
  width: clamp(360px, calc(100% - 20vw), 880px);
  background: #ffffff;
  border-radius: 32px;
  box-shadow:
    0 22px 55px rgba(15, 43, 81, 0.1),
    0 12px 22px rgba(15, 43, 81, 0.05);
  display: flex;
  justify-content: center;
}

.register-container {
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  padding: 40px 56px 52px;
  position: relative;
}

.back-button {
  position: absolute;
  left: 24px;
  top: 24px;
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 0;
}

.back-button svg {
  width: 22px;
  height: 22px;
  fill: #9ca3af;
}

.back-button:hover svg {
  fill: #6b7280;
}

.register-header {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 0;
  margin-bottom: 8px;
}

.register-title {
  font-size: 34px;
  font-weight: 700;
  color: #171717;
  margin: 0;
}

.register-subtitle {
  font-size: 16px;
  color: #6b7280;
  margin: 0;
  line-height: 1.4;
}

.register-form {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 20px;
  width: 100%;
  max-width: 520px;
  margin: 0 auto;
  padding: 6px 0 72px;
}

.form-field {
  display: flex;
  flex-direction: column;
}

.field-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #111827;
  font-weight: 600;
  margin: 0 0 6px;
  line-height: 1;
}

.field-required {
  color: #ef4444;
  font-weight: 700;
}

.form-input {
  width: 100%;
  height: 52px;
  padding: 0 18px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #ffffff;
  font-size: 16px;
  color: #111827;
  box-sizing: border-box;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.form-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.08);
}

.form-input::placeholder {
  color: #9ca3af;
  font-size: 16px;
}

.is-invalid {
  border-color: #ef4444 !important;
  background: #fff7f7;
}

.is-valid {
  border-color: #34d399;
}

.field-error {
  margin: 6px 0 0;
  font-size: 12px;
  color: #ef4444;
}

.form-section-title {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 8px;
  padding-top: 12px;
}

.btn {
  width: 100%;
  height: 52px;
  border: none;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  text-transform: uppercase;
  border-radius: 12px;
}

.btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.08);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #1f402e;
  color: #ffffff;
}

.btn-primary:hover:not(:disabled) {
  background: #183323;
}

.authorize {
  text-align: center;
  margin-top: 8px;
  color: #ababab;
}

.authorize a {
  text-decoration: none;
  color: #ababab;
}

.authorize a:hover {
  text-decoration: underline;
}

.password-rules {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: -8px;
}

.rules-col {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rules-col li {
  font-size: 12px;
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 8px;
}

.rules-col li i {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1.5px solid #d1d5db;
  position: relative;
  flex-shrink: 0;
}

.rules-col li.ok {
  color: #059669;
}

.rules-col li.ok i {
  border-color: #059669;
  background: #059669;
}

.rules-col li.ok i::before,
.rules-col li.ok i::after {
  content: '';
  position: absolute;
  background: white;
  border-radius: 2px;
}

.rules-col li.ok i::before {
  width: 2px;
  height: 6px;
  left: 5px;
  top: 7px;
  transform: rotate(45deg);
}

.rules-col li.ok i::after {
  width: 2px;
  height: 10px;
  left: 8px;
  top: 2px;
  transform: rotate(-45deg);
}

.confirm-hint {
  margin-top: 6px;
  font-size: 12px;
}

.hint-ok {
  color: #059669;
}

.hint-err {
  color: #ef4444;
}

.server-error {
  color: #ef4444;
  font-size: 13px;
  text-align: center;
}

/* Шаг 2: SMS код */
.code-form {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
  max-width: 600px;
  margin: 24px auto 0;
  padding-bottom: 48px;
}

.code-label {
  font-size: 14px;
  color: #111827;
  font-weight: 600;
  text-align: center;
  line-height: 1.6;
}

.masked-phone {
  color: #6b7280;
  font-weight: 400;
  font-size: 13px;
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
  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
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
  margin-bottom: 0;
}

.timer {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
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
  padding: 0;
}

.resend:hover:not(:disabled) {
  text-decoration: underline;
}

.resend:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.verify-btn {
  max-width: 420px;
  margin-top: 6px;
}

@media (max-width: 768px) {
  .register-container {
    padding: 32px 24px 40px;
  }

  .register-title {
    font-size: 28px;
  }

  .register-form {
    max-width: 100%;
    padding-bottom: 48px;
  }

  .code-inputs {
    grid-template-columns: repeat(6, 48px);
    gap: 8px;
  }

  .code-box {
    width: 48px;
    height: 48px;
    font-size: 20px;
  }
}
</style>
