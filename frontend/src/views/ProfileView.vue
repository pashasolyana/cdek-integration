<template>
  <div class="profile-page">
    <div class="profile-modal">
      <div class="profile-container">
        <header class="profile-header">
          <h2 class="profile-title">Личный кабинет</h2>
          <p class="profile-subtitle">
            Управление данными компании<br />
            для работы с СДЭК
          </p>
        </header>

        <!-- Загрузка -->
        <div v-if="initialLoading" class="loading-state">
          <div class="spinner"></div>
          <p>Загрузка данных...</p>
        </div>

        <!-- Форма компании -->
        <form v-else class="profile-form" novalidate @submit.prevent="saveCompany">
          <div class="form-section">
            <h3 class="section-title">Основная информация</h3>

            <div class="form-row">
              <div class="form-field">
                <label class="field-label">Тип компании <span class="field-required">*</span></label>
                <select
                  class="form-input"
                  v-model="form.companyType"
                  @blur="touch('companyType')"
                >
                  <option value="ООО">ООО</option>
                  <option value="ИП">ИП</option>
                  <option value="АО">АО</option>
                  <option value="ПАО">ПАО</option>
                </select>
              </div>

              <div class="form-field">
                <label class="field-label">Название компании <span class="field-required">*</span></label>
                <input
                  class="form-input"
                  v-model="form.companyName"
                  type="text"
                  placeholder="ООО «Моя компания»"
                  :class="inputClass(nameValid, 'companyName')"
                  @blur="touch('companyName')"
                />
                <p v-if="t.companyName && !nameValid" class="field-error">Название обязательно</p>
              </div>
            </div>

            <div class="form-row">
              <div class="form-field">
                <label class="field-label">ИНН <span class="field-required">*</span></label>
                <input
                  class="form-input"
                  v-model="form.inn"
                  type="text"
                  inputmode="numeric"
                  placeholder="1234567890"
                  maxlength="12"
                  :class="inputClass(innValid, 'inn')"
                  @blur="touch('inn')"
                />
                <p v-if="t.inn && !innValid" class="field-error">ИНН: 10 или 12 цифр</p>
              </div>

              <div class="form-field">
                <label class="field-label">КПП (для юр. лиц)</label>
                <input
                  class="form-input"
                  v-model="form.kpp"
                  type="text"
                  inputmode="numeric"
                  placeholder="123456789"
                  maxlength="9"
                  :class="inputClass(kppValidOrEmpty, 'kpp')"
                  @blur="touch('kpp')"
                />
                <p v-if="t.kpp && !kppValidOrEmpty" class="field-error">КПП: 9 цифр</p>
              </div>
            </div>

            <div class="form-field">
              <label class="field-label">ОГРН <span class="field-required">*</span></label>
              <input
                class="form-input"
                v-model="form.ogrn"
                type="text"
                inputmode="numeric"
                placeholder="1234567890123"
                maxlength="15"
                :class="inputClass(ogrnValid, 'ogrn')"
                @blur="touch('ogrn')"
              />
              <p v-if="t.ogrn && !ogrnValid" class="field-error">ОГРН: 13 или 15 цифр</p>
            </div>

            <div class="form-row">
              <div class="form-field">
                <label class="field-label">Email компании</label>
                <input
                  class="form-input"
                  v-model="form.email"
                  type="email"
                  placeholder="company@example.com"
                />
              </div>

              <div class="form-field">
                <label class="field-label">Телефон компании</label>
                <input
                  class="form-input"
                  v-model="form.phone"
                  type="tel"
                  placeholder="+7(999)999-99-99"
                />
              </div>
            </div>
          </div>

          <div class="form-section">
            <h3 class="section-title">Юридический адрес</h3>

            <div class="form-row">
              <div class="form-field">
                <label class="field-label">Индекс <span class="field-required">*</span></label>
                <input
                  class="form-input"
                  v-model="form.legalIndex"
                  type="text"
                  inputmode="numeric"
                  placeholder="123456"
                  maxlength="6"
                  :class="inputClass(legalIndexValid, 'legalIndex')"
                  @blur="touch('legalIndex')"
                />
                <p v-if="t.legalIndex && !legalIndexValid" class="field-error">Индекс: 6 цифр</p>
              </div>

              <div class="form-field">
                <label class="field-label">Город <span class="field-required">*</span></label>
                <input
                  class="form-input"
                  v-model="form.legalCity"
                  type="text"
                  placeholder="Москва"
                  :class="inputClass(legalCityValid, 'legalCity')"
                  @blur="touch('legalCity')"
                />
                <p v-if="t.legalCity && !legalCityValid" class="field-error">Город обязателен</p>
              </div>
            </div>

            <div class="form-field">
              <label class="field-label">Адрес <span class="field-required">*</span></label>
              <input
                class="form-input"
                v-model="form.legalAddress"
                type="text"
                placeholder="ул. Примерная, д. 1"
                :class="inputClass(legalAddressValid, 'legalAddress')"
                @blur="touch('legalAddress')"
              />
              <p v-if="t.legalAddress && !legalAddressValid" class="field-error">
                Адрес обязателен
              </p>
            </div>
          </div>

          <div class="form-section">
            <h3 class="section-title">Фактический адрес</h3>

            <div class="form-field">
              <label class="field-label">Адрес <span class="field-required">*</span></label>
              <input
                class="form-input"
                v-model="form.actualAddress"
                type="text"
                placeholder="ул. Фактическая, д. 2"
                :class="inputClass(actualAddressValid, 'actualAddress')"
                @blur="touch('actualAddress')"
              />
              <p v-if="t.actualAddress && !actualAddressValid" class="field-error">
                Адрес обязателен
              </p>
            </div>
          </div>

          <div class="form-section">
            <h3 class="section-title">Банковские реквизиты</h3>

            <div class="form-field">
              <label class="field-label">БИК <span class="field-required">*</span></label>
              <input
                class="form-input"
                v-model="form.bik"
                type="text"
                inputmode="numeric"
                placeholder="044525225"
                maxlength="9"
                :class="inputClass(bikValid, 'bik')"
                @blur="touch('bik')"
              />
              <p v-if="t.bik && !bikValid" class="field-error">БИК: 9 цифр</p>
            </div>

            <div class="form-field">
              <label class="field-label">Расчетный счет <span class="field-required">*</span></label>
              <input
                class="form-input"
                v-model="form.settlementAccount"
                type="text"
                inputmode="numeric"
                placeholder="40702810000000000000"
                maxlength="20"
                :class="inputClass(settlementAccountValid, 'settlementAccount')"
                @blur="touch('settlementAccount')"
              />
              <p v-if="t.settlementAccount && !settlementAccountValid" class="field-error">
                Расчетный счет: 20 цифр
              </p>
            </div>

            <div class="form-field">
              <label class="field-label">Корр. счет <span class="field-required">*</span></label>
              <input
                class="form-input"
                v-model="form.correspondentAccount"
                type="text"
                inputmode="numeric"
                placeholder="30101810400000000225"
                maxlength="20"
                :class="inputClass(correspondentAccountValid, 'correspondentAccount')"
                @blur="touch('correspondentAccount')"
              />
              <p v-if="t.correspondentAccount && !correspondentAccountValid" class="field-error">
                Корр. счет: 20 цифр
              </p>
            </div>
          </div>

          <p v-if="serverError" class="server-error">{{ serverError }}</p>
          <p v-if="successMessage" class="success-message">{{ successMessage }}</p>

          <div class="form-actions">
            <button type="submit" class="btn btn-primary" :disabled="loading || !formValid">
              {{ loading ? 'Сохранение...' : hasCompany ? 'Обновить данные' : 'Создать компанию' }}
            </button>

            <button
              v-if="hasCompany"
              type="button"
              class="btn btn-danger"
              :disabled="loading"
              @click="confirmDelete"
            >
              Удалить компанию
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import apiService, { type CompanyPayload } from '@/services/api'

/** Состояния */
const initialLoading = ref(true)
const loading = ref(false)
const serverError = ref<string | null>(null)
const successMessage = ref<string | null>(null)
const hasCompany = ref(false)

/** Форма данных */
const form = ref<CompanyPayload>({
  companyType: 'ООО',
  companyName: '',
  inn: '',
  kpp: '',
  ogrn: '',
  email: '',
  phone: '',
  bik: '',
  settlementAccount: '',
  correspondentAccount: '',
  actualAddress: '',
  legalIndex: '',
  legalCity: '',
  legalAddress: '',
})

/** touched-стейт */
type TKey = keyof CompanyPayload
const t = ref<Record<TKey, boolean>>({
  companyType: false,
  companyName: false,
  inn: false,
  kpp: false,
  ogrn: false,
  email: false,
  phone: false,
  bik: false,
  settlementAccount: false,
  correspondentAccount: false,
  actualAddress: false,
  legalIndex: false,
  legalCity: false,
  legalAddress: false,
})

function touch(key: TKey) {
  t.value[key] = true
}

function inputClass(valid: boolean, key: TKey) {
  return { 'is-invalid': t.value[key] && !valid, 'is-valid': t.value[key] && valid }
}

/** Валидаторы */
const onlyDigits = (s: string) => (s || '').replace(/\D/g, '')

const nameValid = computed(() => form.value.companyName.trim().length > 0)
const innValid = computed(() => {
  const d = onlyDigits(form.value.inn)
  return d.length === 10 || d.length === 12
})
const kppValidOrEmpty = computed(() => {
  const d = onlyDigits(form.value.kpp || '')
  return !d || d.length === 9
})
const ogrnValid = computed(() => {
  const d = onlyDigits(form.value.ogrn)
  return d.length === 13 || d.length === 15
})
const legalIndexValid = computed(() => {
  const d = onlyDigits(form.value.legalIndex)
  return d.length === 6
})
const legalCityValid = computed(() => form.value.legalCity.trim().length > 0)
const legalAddressValid = computed(() => form.value.legalAddress.trim().length > 0)
const actualAddressValid = computed(() => form.value.actualAddress.trim().length > 0)
const bikValid = computed(() => {
  const d = onlyDigits(form.value.bik)
  return d.length === 9
})
const settlementAccountValid = computed(() => {
  const d = onlyDigits(form.value.settlementAccount)
  return d.length === 20
})
const correspondentAccountValid = computed(() => {
  const d = onlyDigits(form.value.correspondentAccount)
  return d.length === 20
})

const formValid = computed(
  () =>
    nameValid.value &&
    innValid.value &&
    kppValidOrEmpty.value &&
    ogrnValid.value &&
    legalIndexValid.value &&
    legalCityValid.value &&
    legalAddressValid.value &&
    actualAddressValid.value &&
    bikValid.value &&
    settlementAccountValid.value &&
    correspondentAccountValid.value
)

/** Загрузка данных компании */
async function loadCompany() {
  try {
    initialLoading.value = true
    serverError.value = null
    const data = await apiService.getCompany()
    
    if (data) {
      hasCompany.value = true
      form.value = { ...data }
    } else {
      hasCompany.value = false
    }
  } catch (err: any) {
    // 404 - компании нет, это нормально
    if (err?.response?.status === 404) {
      hasCompany.value = false
      // Не показываем ошибку, просто разрешаем создать компанию
    } else {
      const msg = err?.response?.data?.message
      serverError.value = Array.isArray(msg) ? msg.join(', ') : msg || 'Не удалось загрузить данные'
    }
  } finally {
    // ВАЖНО: всегда выключаем загрузку
    initialLoading.value = false
  }
}

/** Сохранение компании */
async function saveCompany() {
  serverError.value = null
  successMessage.value = null

  // Touch all fields
  Object.keys(t.value).forEach((key) => touch(key as TKey))

  if (!formValid.value) return

  try {
    loading.value = true

    if (hasCompany.value) {
      await apiService.updateCompany(form.value)
      successMessage.value = 'Данные компании успешно обновлены'
    } else {
      await apiService.createCompany(form.value)
      hasCompany.value = true
      successMessage.value = 'Компания успешно создана'
    }

    // Скрыть сообщение через 3 секунды
    setTimeout(() => {
      successMessage.value = null
    }, 3000)
  } catch (err: any) {
    const msg = err?.response?.data?.message
    serverError.value = Array.isArray(msg) ? msg.join(', ') : msg || 'Не удалось сохранить данные'
  } finally {
    loading.value = false
  }
}

/** Удаление компании */
function confirmDelete() {
  if (confirm('Вы уверены, что хотите удалить данные компании? Это действие нельзя отменить.')) {
    deleteCompany()
  }
}

async function deleteCompany() {
  try {
    loading.value = true
    serverError.value = null
    successMessage.value = null

    await apiService.deleteCompany()

    // Очистить форму
    hasCompany.value = false
    form.value = {
      companyType: 'ООО',
      companyName: '',
      inn: '',
      kpp: '',
      ogrn: '',
      email: '',
      phone: '',
      bik: '',
      settlementAccount: '',
      correspondentAccount: '',
      actualAddress: '',
      legalIndex: '',
      legalCity: '',
      legalAddress: '',
    }

    // Сбросить touched
    Object.keys(t.value).forEach((key) => {
      t.value[key as TKey] = false
    })

    successMessage.value = 'Компания успешно удалена'
    setTimeout(() => {
      successMessage.value = null
    }, 3000)
  } catch (err: any) {
    const msg = err?.response?.data?.message
    serverError.value = Array.isArray(msg) ? msg.join(', ') : msg || 'Не удалось удалить компанию'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadCompany()
})
</script>

<style scoped>
.profile-page {
  min-height: calc(100dvh - var(--header-current) - var(--footer-current));
  padding: 56px 0;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  background: #f4f4f4;
}

.profile-modal {
  width: clamp(360px, calc(100% - 10vw), 1000px);
  background: #ffffff;
  border-radius: 32px;
  box-shadow:
    0 22px 55px rgba(15, 43, 81, 0.1),
    0 12px 22px rgba(15, 43, 81, 0.05);
  display: flex;
  justify-content: center;
  margin: 0 20px;
}

.profile-container {
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  padding: 40px 56px 52px;
  position: relative;
}

.profile-header {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 32px;
}

.profile-title {
  font-size: 34px;
  font-weight: 700;
  color: #171717;
  margin: 0;
}

.profile-subtitle {
  font-size: 16px;
  color: #6b7280;
  margin: 0;
  line-height: 1.4;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 80px 20px;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e5e7eb;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-state p {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.profile-form {
  display: flex;
  flex-direction: column;
  gap: 32px;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.section-title {
  font-size: 20px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 4px;
  padding-bottom: 8px;
  border-bottom: 2px solid #e5e7eb;
}

.form-field {
  display: flex;
  flex-direction: column;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
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

.form-input:disabled {
  background: #f9fafb;
  color: #9ca3af;
  cursor: not-allowed;
}

.form-input::placeholder {
  color: #9ca3af;
  font-size: 16px;
}

select.form-input {
  cursor: pointer;
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

.server-error {
  color: #ef4444;
  font-size: 13px;
  text-align: center;
  margin: 0;
}

.success-message {
  color: #059669;
  font-size: 13px;
  text-align: center;
  margin: 0;
  font-weight: 600;
}

.form-actions {
  display: flex;
  gap: 16px;
  margin-top: 8px;
}

.btn {
  flex: 1;
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

.btn-danger {
  background: #ef4444;
  color: #ffffff;
}

.btn-danger:hover:not(:disabled) {
  background: #dc2626;
}

@media (max-width: 768px) {
  .profile-container {
    padding: 32px 24px 40px;
  }

  .profile-title {
    font-size: 28px;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column;
  }
}
</style>
