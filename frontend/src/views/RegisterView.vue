<template>
  <div class="register-page">
    <div class="register-modal">
      <div class="register-container">
        <div class="register-controls" v-if="currentStep === 2">
          <button type="button" class="back-button" aria-label="Назад" @click="goToStep(1)">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path :d="mdiArrowLeft" />
            </svg>
          </button>
        </div>

        <header class="register-header">
          <h2 class="register-title">
            {{ currentStep === 1 ? 'Регистрация' : 'Юридические реквизиты' }}
          </h2>
          <p class="register-subtitle" v-if="currentStep === 1">
            Зарегистрируйтесь и создавайте <br />
            заказы как компания
          </p>
          <p class="register-subtitle" v-else>
            Укажите данные организации, чтобы завершить регистрацию
          </p>
        </header>

        <!-- ===== ШАГ 1 ===== -->
        <form v-if="currentStep === 1" class="register-form" novalidate @submit.prevent="toJuridicalStep">
          <!-- Имя -->
          <div class="form-field">
            <label class="field-label">
              <span class="field-required">*</span><span class="field-header">Имя</span>
            </label>
            <input class="form-input" v-model="registerFormIndividual.name" type="text" placeholder="Иван"
              autocomplete="given-name" :class="inputClass(nameValid, 'name')" :aria-invalid="t.name && !nameValid"
              @blur="touch('name')" />
            <p v-if="t.name && !nameValid" class="field-error">Укажите имя</p>
          </div>

          <!-- Фамилия -->
          <div class="form-field">
            <label class="field-label">
              <span class="field-required">*</span><span class="field-header">Фамилия</span>
            </label>
            <input class="form-input" v-model="registerFormIndividual.surname" type="text" placeholder="Иванов"
              autocomplete="family-name" :class="inputClass(surnameValid, 'surname')"
              :aria-invalid="t.surname && !surnameValid" @blur="touch('surname')" />
            <p v-if="t.surname && !surnameValid" class="field-error">Укажите фамилию</p>
          </div>

          <!-- Почта (опц.) -->
          <div class="form-field">
            <label class="field-label">
              <span class="field-header">Почта</span>
            </label>
            <input class="form-input" v-model="registerFormIndividual.email" type="email"
              placeholder="example@example.ru" autocomplete="email"
              :class="inputClass(emailValid || !registerFormIndividual.email, 'email')"
              :aria-invalid="t.email && registerFormIndividual.email && !emailValid" @blur="touch('email')" />
            <p v-if="t.email && registerFormIndividual.email && !emailValid" class="field-error">Некорректный e-mail</p>
          </div>

          <!-- Телефон -->
          <div class="form-field">
            <label class="field-label">
              <span class="field-required">*</span><span class="field-header">Номер телефона</span>
            </label>
            <input class="form-input" v-model="registerFormIndividual.phone" type="tel" inputmode="tel"
              placeholder="+7(999)999-99-99" :class="inputClass(userPhoneValid, 'userPhone')"
              :aria-invalid="t.userPhone && !userPhoneValid" @blur="touch('userPhone')" />
            <p v-if="t.userPhone && !userPhoneValid" class="field-error">Формат RU: +7… / 8… / 7…</p>
          </div>

          <!-- Пароль -->
          <div class="form-field">
            <label class="field-label">
              <span class="field-required">*</span><span class="field-header">Пароль</span>
            </label>
            <input class="form-input" v-model="registerFormIndividual.password" type="password"
              :class="inputClass(allPwdRulesOk, 'password')" :aria-invalid="t.password && !allPwdRulesOk"
              @blur="touch('password')" />
          </div>

          <!-- Подтверждение -->
          <div class="form-field">
            <label class="field-label">
              <span class="field-required">*</span><span class="field-header">Подтвердите пароль</span>
            </label>
            <input class="form-input" v-model="registerFormIndividual.confirmPassword" type="password"
              :class="inputClass(passwordsMatch, 'confirm')" :aria-invalid="t.confirm && !passwordsMatch"
              @blur="touch('confirm')" />
            <p v-if="registerFormIndividual.confirmPassword !== ''" :class="passwordsMatch ? 'hint-ok' : 'hint-err'"
              class="confirm-hint" aria-live="polite">
              {{ passwordsMatch ? 'Пароли совпадают' : 'Пароли не совпадают' }}
            </p>
            <p v-if="t.password && !allPwdRulesOk" class="field-error">Пароль не соответствует правилам ниже</p>
          </div>

          <!-- Правила пароля -->
          <div class="password__container" aria-live="polite">
            <p class="password-header">Пароль должен содержать:</p>
            <div class="password-rules">
              <ul class="rules-col">
                <li :class="{ ok: hasMinLen }"><i aria-hidden="true"></i> Не менее 8 символов</li>
                <li :class="{ ok: hasDigit }"><i aria-hidden="true"></i> Цифры</li>
              </ul>
              <ul class="rules-col">
                <li :class="{ ok: hasUpper }"><i aria-hidden="true"></i> Заглавные буквы</li>
                <li :class="{ ok: hasLower }"><i aria-hidden="true"></i> Строчные буквы</li>
                <li :class="{ ok: hasSpecial }"><i aria-hidden="true"></i> Спецсимволы</li>
              </ul>
            </div>
          </div>

          <p v-if="serverError && currentStep === 1" class="server-error" role="alert">{{ serverError }}</p>

          <button type="submit" class="btn btn-primary registration-btn-main" :disabled="loading || !mainFormValid">
            {{ loading ? 'Проверка…' : 'Далее' }}
          </button>
          <div class="authorize">Есть аккаунт? <a href="/login">Авторизоваться</a></div>
        </form>

        <!-- ===== ШАГ 2 ===== -->
        <form v-else class="register-form" novalidate @submit.prevent="finishRegistration">
          <div class="form-field">
            <label class="field-label"><span class="field-required">*</span><span
                class="field-header">Тип</span></label>
            <input class="form-input" v-model="registerFormJuridical.companyType" type="text" placeholder="ООО/ИП"
              autocomplete="organization" :class="inputClass(companyTypeValid, 'companyType')"
              :aria-invalid="t.companyType && !companyTypeValid" @blur="touch('companyType')" />
            <p v-if="t.companyType && !companyTypeValid" class="field-error">Укажите «ООО» или «ИП»</p>
          </div>

          <div class="form-field">
            <label class="field-label"><span class="field-required">*</span><span
                class="field-header">Наименование</span></label>
            <input class="form-input" v-model="registerFormJuridical.companyName" type="text"
              placeholder="Наименование организации" autocomplete="organization"
              :class="inputClass(companyNameValid, 'companyName')" :aria-invalid="t.companyName && !companyNameValid"
              @blur="touch('companyName')" />
            <p v-if="t.companyName && !companyNameValid" class="field-error">Укажите наименование</p>
          </div>

          <div class="form-field">
            <label class="field-label"><span class="field-required">*</span><span
                class="field-header">ИНН</span></label>
            <input class="form-input" v-model="registerFormJuridical.inn" type="text" inputmode="numeric" maxlength="12"
              placeholder="ИНН" autocomplete="off" :class="inputClass(innValid, 'inn')"
              :aria-invalid="t.inn && !innValid" @blur="touch('inn')" />
            <p v-if="t.inn && !innValid" class="field-error">ИНН: {{ isIP ? '12' : '10' }} цифр</p>
          </div>

          <div class="form-field">
            <label class="field-label"><span class="field-required">*</span><span class="field-header">ФИО Юр.
                лица</span></label>
            <input class="form-input" v-model="registerFormJuridical.legalFullName" type="text"
              placeholder="ФИО Юридического лица" autocomplete="name"
              :class="inputClass(legalFullNameValid, 'legalFullName')"
              :aria-invalid="t.legalFullName && !legalFullNameValid" @blur="touch('legalFullName')" />
            <p v-if="t.legalFullName && !legalFullNameValid" class="field-error">Укажите ФИО</p>
          </div>

          <div class="form-field">
            <label class="field-label"><span class="field-required">*</span><span class="field-header">КПП (для
                ООО)</span></label>
            <input class="form-input" v-model="registerFormJuridical.kpp" type="text" inputmode="numeric" maxlength="9"
              placeholder="КПП" autocomplete="off" :class="inputClass(kppValidOrNotRequired, 'kpp')"
              :aria-invalid="t.kpp && !kppValidOrNotRequired" @blur="touch('kpp')" />
            <p v-if="t.kpp && !kppValidOrNotRequired" class="field-error">КПП: 9 цифр (для ООО)</p>
          </div>

          <div class="form-field">
            <label class="field-label"><span class="field-required">*</span><span
                class="field-header">ОГРН</span></label>
            <input class="form-input" v-model="registerFormJuridical.ogrn" type="text" inputmode="numeric"
              maxlength="15" placeholder="ОГРН" autocomplete="off" :class="inputClass(ogrnValid, 'ogrn')"
              :aria-invalid="t.ogrn && !ogrnValid" @blur="touch('ogrn')" />
            <p v-if="t.ogrn && !ogrnValid" class="field-error">ОГРН: {{ isIP ? '15' : '13' }} цифр</p>
          </div>

          <div class="form-field">
            <label class="field-label"><span class="field-header">Почта (опционально)</span></label>
            <input class="form-input" v-model="registerFormJuridical.email" type="email" placeholder="acc@company.ru"
              autocomplete="email"
              :class="inputClass(companyEmailValid || !registerFormJuridical.email, 'companyEmail')"
              :aria-invalid="t.companyEmail && registerFormJuridical.email && !companyEmailValid"
              @blur="touch('companyEmail')" />
            <p v-if="t.companyEmail && registerFormJuridical.email && !companyEmailValid" class="field-error">
              Некорректный e-mail</p>
          </div>

          <div class="form-field">
            <label class="field-label"><span class="field-header">Телефон (опционально)</span></label>
            <input class="form-input" v-model="registerFormJuridical.phone" type="tel" inputmode="tel"
              placeholder="+7(495)123-45-67"
              :class="inputClass(companyPhoneValid || !registerFormJuridical.phone, 'companyPhone')"
              :aria-invalid="t.companyPhone && registerFormJuridical.phone && !companyPhoneValid"
              @blur="touch('companyPhone')" />
            <p v-if="t.companyPhone && registerFormJuridical.phone && !companyPhoneValid" class="field-error">Формат RU:
              +7… / 8… / 7…</p>
          </div>

          <div class="form-field">
            <label class="field-label"><span class="field-required">*</span><span
                class="field-header">БИК</span></label>
            <input class="form-input" v-model="registerFormJuridical.bik" type="text" inputmode="numeric" maxlength="9"
              placeholder="БИК" autocomplete="off" :class="inputClass(bikValid, 'bik')"
              :aria-invalid="t.bik && !bikValid" @blur="touch('bik')" />
            <p v-if="t.bik && !bikValid" class="field-error">БИК: 9 цифр</p>
          </div>

          <div class="form-field">
            <label class="field-label"><span class="field-required">*</span><span class="field-header">Расчетный
                счёт</span></label>
            <input class="form-input" v-model="registerFormJuridical.settlementAccount" type="text" inputmode="numeric"
              maxlength="20" placeholder="Расчетный счёт" autocomplete="off" :class="inputClass(rsValid, 'rs')"
              :aria-invalid="t.rs && !rsValid" @blur="touch('rs')" />
            <p v-if="t.rs && !rsValid" class="field-error">Р/с: 20 цифр</p>
          </div>

          <div class="form-field">
            <label class="field-label"><span class="field-required">*</span><span class="field-header">Кор.
                счёт</span></label>
            <input class="form-input" v-model="registerFormJuridical.correspondentAccount" type="text"
              inputmode="numeric" maxlength="20" placeholder="Кор.счёт" autocomplete="off"
              :class="inputClass(ksValid, 'ks')" :aria-invalid="t.ks && !ksValid" @blur="touch('ks')" />
            <p v-if="t.ks && !ksValid" class="field-error">К/с: 20 цифр</p>
          </div>

          <div class="form-field">
            <label class="field-label"><span class="field-required">*</span><span class="field-header">Фактический
                адрес</span></label>
            <input class="form-input" v-model="registerFormJuridical.actualAddress" type="text"
              placeholder="Фактический адрес" autocomplete="street-address"
              :class="inputClass(actualAddrValid, 'actualAddress')" :aria-invalid="t.actualAddress && !actualAddrValid"
              @blur="touch('actualAddress')" />
            <p v-if="t.actualAddress && !actualAddrValid" class="field-error">Укажите адрес</p>
          </div>

          <div class="form-section-title">Юридический адрес</div>

          <div class="form-field">
            <label class="field-label"><span class="field-required">*</span><span
                class="field-header">Индекс</span></label>
            <input class="form-input" v-model="registerFormJuridical.legalIndex" type="text" inputmode="numeric"
              maxlength="6" placeholder="Индекс" autocomplete="postal-code"
              :class="inputClass(legalIndexValid, 'legalIndex')" :aria-invalid="t.legalIndex && !legalIndexValid"
              @blur="touch('legalIndex')" />
            <p v-if="t.legalIndex && !legalIndexValid" class="field-error">Индекс: 6 цифр</p>
          </div>

          <div class="form-field">
            <label class="field-label"><span class="field-required">*</span><span
                class="field-header">Город</span></label>
            <input class="form-input" v-model="registerFormJuridical.legalCity" type="text" placeholder="Город"
              autocomplete="address-level2" :class="inputClass(legalCityValid, 'legalCity')"
              :aria-invalid="t.legalCity && !legalCityValid" @blur="touch('legalCity')" />
            <p v-if="t.legalCity && !legalCityValid" class="field-error">Укажите город</p>
          </div>

          <div class="form-field">
            <label class="field-label"><span class="field-required">*</span><span
                class="field-header">Адрес</span></label>
            <input class="form-input" v-model="registerFormJuridical.legalAddress" type="text" placeholder="Адрес"
              autocomplete="street-address" :class="inputClass(legalAddrValid, 'legalAddress')"
              :aria-invalid="t.legalAddress && !legalAddrValid" @blur="touch('legalAddress')" />
            <p v-if="t.legalAddress && !legalAddrValid" class="field-error">Укажите адрес</p>
          </div>

          <p v-if="serverError && currentStep === 2" class="server-error" role="alert">{{ serverError }}</p>

          <button type="submit" class="btn btn-primary registration-btn-main" :disabled="loading || !jurFormValid">
            {{ loading ? 'Отправка…' : 'Завершить регистрацию' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { mdiArrowLeft } from '@mdi/js'
import apiService, { type RegisterPayload } from '@/services/api'
import { useRouter } from 'vue-router'

const router = useRouter()

/** Шаги */
const currentStep = ref<1 | 2>(1)
function goToStep(step: 1 | 2) { currentStep.value = step }

/** Состояния */
const loading = ref(false)
const serverError = ref<string | null>(null)

/** touched-стейт */
type TKey =
  | 'name' | 'surname' | 'email' | 'userPhone' | 'password' | 'confirm'
  | 'companyType' | 'companyName' | 'inn' | 'legalFullName' | 'kpp' | 'ogrn'
  | 'companyEmail' | 'companyPhone' | 'bik' | 'rs' | 'ks' | 'actualAddress'
  | 'legalIndex' | 'legalCity' | 'legalAddress'
const t = ref<Record<TKey, boolean>>({
  name: false, surname: false, email: false, userPhone: false, password: false, confirm: false,
  companyType: false, companyName: false, inn: false, legalFullName: false, kpp: false, ogrn: false,
  companyEmail: false, companyPhone: false, bik: false, rs: false, ks: false, actualAddress: false,
  legalIndex: false, legalCity: false, legalAddress: false
})
function touch(key: TKey) { t.value[key] = true }
function inputClass(valid: boolean, key: TKey) {
  return { 'is-invalid': t.value[key] && !valid, 'is-valid': t.value[key] && valid }
}

/** Формы */
const registerFormIndividual = ref({
  name: '', surname: '', email: '', phone: '', password: '', confirmPassword: ''
})
const registerFormJuridical = ref({
  companyType: '', companyName: '', inn: '', legalFullName: '', kpp: '', ogrn: '',
  email: '', phone: '', bik: '', settlementAccount: '', correspondentAccount: '',
  actualAddress: '', legalIndex: '', legalCity: '', legalAddress: ''
})

/** Валидаторы */
const onlyDigits = (s: string) => (s || '').replace(/\D/g, '')
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const nameValid = computed(() => registerFormIndividual.value.name.trim().length > 0)
const surnameValid = computed(() => registerFormIndividual.value.surname.trim().length > 0)
const emailValid = computed(() => !registerFormIndividual.value.email || EMAIL_RE.test(registerFormIndividual.value.email.trim()))
const userPhoneValid = computed(() => {
  const d = onlyDigits(registerFormIndividual.value.phone)
  return d.length === 11 && (d.startsWith('7') || d.startsWith('8'))
})

const pwd = computed(() => registerFormIndividual.value.password || '')
const hasMinLen = computed(() => pwd.value.length >= 8)
const hasDigit = computed(() => /\d/.test(pwd.value))
const hasUpper = computed(() => /[A-ZА-ЯЁ]/.test(pwd.value))
const hasLower = computed(() => /[a-zа-яё]/.test(pwd.value))
const hasSpecial = computed(() => /[^0-9A-Za-zА-Яа-яЁё_\s]/.test(pwd.value))
const passwordsMatch = computed(() =>
  registerFormIndividual.value.confirmPassword !== '' &&
  registerFormIndividual.value.password === registerFormIndividual.value.confirmPassword
)
const allPwdRulesOk = computed(() => hasMinLen.value && hasDigit.value && hasUpper.value && hasLower.value && hasSpecial.value)

const mainFormValid = computed(() =>
  nameValid.value && surnameValid.value && emailValid.value &&
  userPhoneValid.value && allPwdRulesOk.value && passwordsMatch.value
)

const companyTypeNormalized = computed(() => registerFormJuridical.value.companyType.trim().toUpperCase())
const isIP = computed(() => companyTypeNormalized.value === 'ИП')
const companyTypeValid = computed(() => ['ООО', 'ИП'].includes(companyTypeNormalized.value))
const companyNameValid = computed(() => registerFormJuridical.value.companyName.trim().length > 0)
const innValid = computed(() => {
  const d = onlyDigits(registerFormJuridical.value.inn)
  return isIP.value ? d.length === 12 : d.length === 10
})
const legalFullNameValid = computed(() => registerFormJuridical.value.legalFullName.trim().length > 0)
const kppValidOrNotRequired = computed(() => isIP.value ? true : onlyDigits(registerFormJuridical.value.kpp).length === 9)
const ogrnValid = computed(() => {
  const d = onlyDigits(registerFormJuridical.value.ogrn)
  return isIP.value ? d.length === 15 : d.length === 13
})
const companyEmailValid = computed(() => !registerFormJuridical.value.email || EMAIL_RE.test(registerFormJuridical.value.email.trim()))
const companyPhoneValid = computed(() => {
  if (!registerFormJuridical.value.phone) return true
  const d = onlyDigits(registerFormJuridical.value.phone)
  return d.length === 11 && (d.startsWith('7') || d.startsWith('8'))
})
const bikValid = computed(() => onlyDigits(registerFormJuridical.value.bik).length === 9)
const rsValid = computed(() => onlyDigits(registerFormJuridical.value.settlementAccount).length === 20)
const ksValid = computed(() => onlyDigits(registerFormJuridical.value.correspondentAccount).length === 20)
const actualAddrValid = computed(() => registerFormJuridical.value.actualAddress.trim().length > 0)
const legalIndexValid = computed(() => onlyDigits(registerFormJuridical.value.legalIndex).length === 6)
const legalCityValid = computed(() => registerFormJuridical.value.legalCity.trim().length > 0)
const legalAddrValid = computed(() => registerFormJuridical.value.legalAddress.trim().length > 0)

const jurFormValid = computed(() =>
  companyTypeValid.value && companyNameValid.value && innValid.value && legalFullNameValid.value &&
  kppValidOrNotRequired.value && ogrnValid.value && companyEmailValid.value && companyPhoneValid.value &&
  bikValid.value && rsValid.value && ksValid.value && actualAddrValid.value &&
  legalIndexValid.value && legalCityValid.value && legalAddrValid.value
)

/** Навигация */
function toJuridicalStep() {
  serverError.value = null
  Object.assign(t.value, { name: true, surname: true, email: true, userPhone: true, password: true, confirm: true })
  if (mainFormValid.value) goToStep(2)
}

async function finishRegistration() {
  serverError.value = null
  Object.assign(t.value, {
    companyType: true, companyName: true, inn: true, legalFullName: true, kpp: true, ogrn: true,
    companyEmail: true, companyPhone: true, bik: true, rs: true, ks: true, actualAddress: true,
    legalIndex: true, legalCity: true, legalAddress: true
  })
  if (!mainFormValid.value || !jurFormValid.value) return

  const u = registerFormIndividual.value
  const c = registerFormJuridical.value

  const payload: RegisterPayload = {
    user: {
      firstName: u.name.trim(),
      lastName: u.surname.trim(),
      email: u.email?.trim() || undefined,
      phone: u.phone.trim(),
      password: u.password
    },
    company: {
      companyType: companyTypeNormalized.value,
      companyName: c.companyName.trim(),
      inn: c.inn.trim(),
      kpp: isIP.value ? undefined : (c.kpp?.trim() || undefined),
      ogrn: c.ogrn.trim(),
      email: c.email?.trim() || undefined,
      phone: c.phone?.trim() || undefined,
      bik: c.bik.trim(),
      settlementAccount: c.settlementAccount.trim(),
      correspondentAccount: c.correspondentAccount.trim(),
      actualAddress: c.actualAddress.trim(),
      legalIndex: c.legalIndex.trim(),
      legalCity: c.legalCity.trim(),
      legalAddress: c.legalAddress.trim()
    }
  }

  try {
    loading.value = true
    await apiService.register(payload)
    router.push('/')
  } catch (err: any) {
    const msg = err?.response?.data?.message
    serverError.value = Array.isArray(msg) ? msg.join(', ') : (msg || 'Ошибка регистрации')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  padding: 40px 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f4f4f4;
}

.register-modal {
  width: clamp(254px, calc(100% - 40vw), 653px);
  background: #ffffff;
  border-radius: 32px;
  box-shadow: 0 20px 45px rgba(15, 43, 81, 0.08), 0 10px 18px rgba(15, 43, 81, 0.04);
  display: flex;
  justify-content: center;
  margin: 0;
}

.register-container {
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.register-controls {
  display: flex;
  justify-content: flex-start;
}

.back-button {
  width: 23px;
  height: 23px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  cursor: pointer;
  margin-top: 32px;
  margin-left: 15px;
}

.back-button svg {
  width: 23px;
  height: 23px;
  fill: #9c9c9c;
}

.back-button svg:hover {
  fill: black;
}

.register-header {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: clamp(0px, 3.33vw, 36px);
}

.register-title {
  font-size: 32px;
  font-weight: 700;
  color: #171717;
  margin: 0;
}

.register-subtitle {
  font-size: 16px;
  color: #6b7280;
  margin: 0;
  line-height: 1.4;
  margin-bottom: 10px;
}

.register-form {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 18px;
  width: 100%;
  max-width: 377px;
  min-width: 190px;
  margin: 0 auto;
  padding-bottom: 76px;
}

/* ---- поля и подписи ---- */
.form-field {
  display: flex;
  flex-direction: column;
}

/* ВЫРАВНИВАНИЕ ЛЕЙБЛА: убрали отрицательный отступ */
.field-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #111827;
  font-weight: 600;
  margin: 0 0 6px;
  /* вместо -6px */
  line-height: 1;
}

.field-required {
  color: #ef4444;
  font-size: 14px;
  line-height: 1;
  transform: translateY(-0.5px);
}

.field-header {
  font-weight: 600;
  font-size: 13px;
  line-height: 1;
}

.form-input {
  width: 100%;
  height: 48px;
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

/* Подсветка валидации */
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

/* Секции */
.form-section-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin-top: 8px;
  align-self: center;
  margin-bottom: 20px;
}

/* Кнопки */
.btn {
  width: 100%;
  height: 48px;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  text-transform: uppercase;
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.08);
}

.btn-primary {
  background: #1f402e;
  color: #ffffff;
}

.registration-btn-main {
  margin-top: 30px;
}

.btn-primary:hover {
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

.password__container {
  margin-top: 10px;
}

.password-header {
  font-size: 14px;
  margin: 0 0 8px;
  color: #000;
}

/* Правила пароля */
.password-rules {
  display: grid;
  grid-template-columns: 1fr 1fr;
  column-gap: 24px;
  row-gap: 12px;
}

.rules-col {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  row-gap: 12px;
}

.rules-col li {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  line-height: 1.2;
  color: #6b7280;
  transition: color .2s ease;
}

.rules-col li i {
  flex: 0 0 16px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid #9ca3af;
  position: relative;
  display: inline-block;
}

.rules-col li.ok {
  color: #2e8b57;
}

.rules-col li.ok i {
  border-color: #2e8b57;
}

.rules-col li.ok i::before,
.rules-col li.ok i::after {
  content: '';
  position: absolute;
  background: #2e8b57;
  border-radius: 1px;
}

.rules-col li.ok i::before {
  left: 4px;
  top: 7px;
  width: 2px;
  height: 5px;
  transform: rotate(45deg);
}

.rules-col li.ok i::after {
  left: 7px;
  top: 3px;
  width: 2px;
  height: 9px;
  transform: rotate(-45deg);
}

.confirm-hint {
  font-size: 12px;
  margin-top: 6px;
}

.hint-ok {
  color: #2e8b57;
}

.hint-err {
  color: #ef4444;
}

/* Ошибка сервера */
.server-error {
  margin-top: 10px;
  color: #ef4444;
  font-size: 13px;
}

/* адаптив */
@media (max-width: 420px) {
  .password-rules {
    grid-template-columns: 1fr;
    row-gap: 12px;
  }
}

@media (max-width: 768px) {
  .register-container {
    padding: 32px 24px 40px;
    gap: 24px;
  }

  .register-title {
    font-size: 26px;
  }

  .register-subtitle {
    font-size: 14px;
  }

  .back-button {
    width: 36px;
    height: 36px;
  }
}
</style>
