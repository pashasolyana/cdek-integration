<template>
  <div class="login-page">
    <div class="login-modal">
      <div class="login-container">
        <header class="login-header">
          <h2 class="login-title">Авторизация</h2>
          <p class="login-subtitle">
            Авторизуйтесь и создавайте <br />
            заказы как компания
          </p>
        </header>

        <form class="login-form" novalidate @submit.prevent="onSubmit">
          <!-- Телефон -->
          <div class="form-field">
            <label class="field-label">Номер телефона</label>
            <input
              class="form-input"
              v-model="form.phone"
              type="tel"
              inputmode="tel"
              placeholder="+7(999)999-99-99"
              :class="inputClass(phoneValid, 'phone')"
              :aria-invalid="t.phone && !phoneValid"
              @blur="touch('phone')"
            />
            <p v-if="t.phone && !phoneValid" class="field-error">Формат RU: +7… / 8… / 7…</p>
          </div>

          <!-- Пароль -->
          <div class="form-field">
            <label class="field-label">Пароль</label>
            <div class="input-with-icon">
              <input
                class="form-input"
                :type="showPassword ? 'text' : 'password'"
                v-model="form.password"
                placeholder="Пароль"
                :class="inputClass(passwordValid, 'password')"
                :aria-invalid="t.password && !passwordValid"
                @blur="touch('password')"
              />
              <button
                type="button"
                class="toggle-visibility"
                :aria-label="showPassword ? 'Скрыть пароль' : 'Показать пароль'"
                @click="showPassword = !showPassword"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path :d="showPassword ? mdiEyeOff : mdiEye" />
                </svg>
              </button>
            </div>
            <p v-if="t.password && !passwordValid" class="field-error">Минимум 8 символов</p>
            <button type="button" class="forgot-link" @click="goForgot">Забыли пароль?</button>
          </div>

          <p v-if="serverError" class="server-error" role="alert">{{ serverError }}</p>

          <button type="submit" class="btn btn-primary login-btn" :disabled="loading || !formValid">
            {{ loading ? 'Входим…' : 'Авторизоваться' }}
          </button>

          <div class="authorize">Нет аккаунта? <a href="/r">Зарегистрироваться</a></div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import apiService from '@/services/api'
import { mdiEye, mdiEyeOff } from '@mdi/js'

const router = useRouter()
const goForgot = () => router.push('/forgot-password')
const form = ref({ phone: '', password: '' })
const showPassword = ref(false)
const loading = ref(false)
const serverError = ref<string | null>(null)

/** touched */
type Key = 'phone' | 'password'
const t = ref<Record<Key, boolean>>({ phone: false, password: false })
function touch(k: Key) {
  t.value[k] = true
}
function inputClass(valid: boolean, k: Key) {
  return { 'is-invalid': t.value[k] && !valid, 'is-valid': t.value[k] && valid }
}

/** валидаторы */
const onlyDigits = (s: string) => (s || '').replace(/\D/g, '')
const phoneValid = computed(() => {
  const d = onlyDigits(form.value.phone)
  return d.length === 11 && (d.startsWith('7') || d.startsWith('8'))
})
const passwordValid = computed(() => (form.value.password || '').length >= 8)
const formValid = computed(() => phoneValid.value && passwordValid.value)

/** submit */
async function onSubmit() {
  serverError.value = null
  touch('phone')
  touch('password')
  if (!formValid.value) return
  try {
    loading.value = true
    await apiService.login(form.value.phone.trim(), form.value.password)
    router.push('/')
  } catch (err: any) {
    const msg = err?.response?.data?.message
    serverError.value = Array.isArray(msg) ? msg.join(', ') : msg || 'Ошибка входа'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* Страница */
.login-page {
  min-height: calc(100dvh - var(--header-current) - var(--footer-current));
  padding: 56px 0;
  /* чуть больше воздуха сверху/снизу */
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f4f4f4;
}

/* КАРТОЧКА — сделана заметно больше */
.login-modal {
  width: clamp(360px, calc(100% - 20vw), 880px);
  /* раньше было до 653px */
  background: #ffffff;
  border-radius: 32px;
  box-shadow:
    0 22px 55px rgba(15, 43, 81, 0.1),
    0 12px 22px rgba(15, 43, 81, 0.05);
  display: flex;
  justify-content: center;
}

/* Внутренние отступы тоже увеличены */
.login-container {
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  padding: 40px 56px 52px;
}

.login-header {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 0;
  margin-bottom: 8px;
}

.login-title {
  font-size: 34px;
  font-weight: 700;
  color: #171717;
  margin: 0;
}

.login-subtitle {
  font-size: 16px;
  color: #6b7280;
  margin: 0;
  line-height: 1.4;
}

/* Форма стала шире */
.login-form {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 20px;
  width: 100%;
  max-width: 520px;
  /* раньше 377px */
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

.form-input {
  width: 100%;
  height: 52px;
  /* чуть выше */
  padding: 0 18px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #ffffff;
  font-size: 16px;
  color: #111827;
  box-sizing: border-box;
  outline: none;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease;
}

.form-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.08);
}

.form-input::placeholder {
  color: #9ca3af;
  font-size: 16px;
}

/* Поле пароля с глазом */
.input-with-icon {
  position: relative;
}

.toggle-visibility {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 0;
}

.toggle-visibility svg {
  width: 22px;
  height: 22px;
  fill: #9ca3af;
}

.toggle-visibility:hover svg {
  fill: #6b7280;
}

/* Валидация */
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

/* Кнопка */
.btn {
  width: 100%;
  height: 52px;
  /* выше под размер полей */
  border: none;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
  text-transform: uppercase;
  text-align: center;
  align-content: center;
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.08);
}

.btn-primary {
  background: #1f402e;
  color: #ffffff;
}

.btn-primary:hover {
  background: #183323;
}

.login-btn {
  margin-top: 2px;
}

.forgot-link {
  margin-top: 6px;
  align-self: flex-start;
  background: none;
  border: none;
  padding: 0;
  color: #6b7280;
  font-size: 12px;
  cursor: pointer;
}

.forgot-link:hover {
  text-decoration: underline;
  color: #374151;
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

/* Ошибка сервера */
.server-error {
  margin-top: 2px;
  color: #ef4444;
  font-size: 13px;
}

/* Мобила — card остаётся адаптивным и не расползается */
@media (max-width: 768px) {
  .login-container {
    padding: 32px 24px 40px;
  }

  .login-title {
    font-size: 28px;
  }

  .login-form {
    max-width: 100%;
    padding-bottom: 48px;
  }

  .form-input,
  .btn {
    height: 48px;
  }
}
</style>