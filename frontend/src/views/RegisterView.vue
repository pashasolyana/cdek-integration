<template>
  <div class="register-page">
    <div class="register-modal">
      <div class="register-container">
        <div class="register-controls">
          <button type="button" class="back-button" aria-label="Назад">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path :d="mdiArrowLeft" />
            </svg>
          </button>
        </div>

        <header class="register-header">
          <h2 class="register-title">Регистрация</h2>
          <p class="register-subtitle">
            Зарегистрируйтесь и создавайте <br />
            заказы как компания
          </p>
        </header>

        <form v-if="isJuridical" class="register-form" novalidate>
          <div class="form-field">
            <label class="field-label">
              <span class="field-required">*</span>
            </label>
            <input
              class="form-input"
              v-model="registerFormJuridical.companyType"
              type="text"
              placeholder="ООО/ИП"
              autocomplete="organization"
            />
          </div>

          <div class="form-field">
            <label class="field-label">
              <span class="field-required">*</span>
            </label>
            <input
              class="form-input"
              v-model="registerFormJuridical.companyName"
              type="text"
              placeholder="Наименование организации"
              autocomplete="organization"
            />
          </div>

          <div class="form-field">
            <label class="field-label">
              <span class="field-required">*</span>
            </label>
            <input
              class="form-input"
              v-model="registerFormJuridical.inn"
              type="text"
              inputmode="numeric"
              maxlength="12"
              placeholder="ИНН"
              autocomplete="off"
            />
          </div>

          <div class="form-field">
            <label class="field-label">
              <span class="field-required">*</span>
            </label>
            <input
              class="form-input"
              v-model="registerFormJuridical.legalFullName"
              type="text"
              placeholder="ФИО Юридического лица"
              autocomplete="name"
            />
          </div>

          <div class="form-field">
            <label class="field-label">
              <span class="field-required">*</span>
            </label>
            <input
              class="form-input"
              v-model="registerFormJuridical.kpp"
              type="text"
              inputmode="numeric"
              maxlength="9"
              placeholder="КПП"
              autocomplete="off"
            />
          </div>

          <div class="form-field">
            <label class="field-label">
              <span class="field-required">*</span>
            </label>
            <input
              class="form-input"
              v-model="registerFormJuridical.ogrn"
              type="text"
              inputmode="numeric"
              maxlength="13"
              placeholder="ОГРН"
              autocomplete="off"
            />
          </div>

          <div class="form-field">
            <label class="field-label">
              <span class="field-required">*</span>
            </label>
            <input
              class="form-input"
              v-model="registerFormJuridical.email"
              type="email"
              placeholder="Почта"
              autocomplete="email"
            />
          </div>

          <div class="form-field">
            <label class="field-label">
              <span class="field-required">*</span>
            </label>
            <input
              class="form-input"
              v-model="registerFormJuridical.phone"
              type="tel"
              inputmode="tel"
              placeholder="Телефон"
            />
          </div>

          <div class="form-field">
            <label class="field-label">
              <span class="field-required">*</span>
            </label>
            <input
              class="form-input"
              v-model="registerFormJuridical.bik"
              type="text"
              inputmode="numeric"
              maxlength="9"
              placeholder="БИК"
              autocomplete="off"
            />
          </div>

          <div class="form-field">
            <label class="field-label">
              <span class="field-required">*</span>
            </label>
            <input
              class="form-input"
              v-model="registerFormJuridical.settlementAccount"
              type="text"
              inputmode="numeric"
              maxlength="20"
              placeholder="Расчетный счёт"
              autocomplete="off"
            />
          </div>

          <div class="form-field">
            <label class="field-label">
              <span class="field-required">*</span>
            </label>
            <input
              class="form-input"
              v-model="registerFormJuridical.correspondentAccount"
              type="text"
              inputmode="numeric"
              maxlength="20"
              placeholder="Кор.счёт"
              autocomplete="off"
            />
          </div>

          <div class="form-field">
            <label class="field-label">
              <span class="field-required">*</span>
            </label>
            <input
              class="form-input"
              v-model="registerFormJuridical.actualAddress"
              type="text"
              placeholder="Фактический адрес"
              autocomplete="street-address"
            />
          </div>

          <div class="form-section-title">Юридический адрес</div>

          <div class="form-field">
            <label class="field-label">
              <span class="field-required">*</span>
            </label>
            <input
              class="form-input"
              v-model="registerFormJuridical.legalIndex"
              type="text"
              inputmode="numeric"
              maxlength="6"
              placeholder="Индекс"
              autocomplete="postal-code"
            />
          </div>

          <div class="form-field">
            <label class="field-label">
              <span class="field-required">*</span>
            </label>
            <input
              class="form-input"
              v-model="registerFormJuridical.legalCity"
              type="text"
              placeholder="Город"
              autocomplete="address-level2"
            />
          </div>

          <div class="form-field">
            <label class="field-label">
              <span class="field-required">*</span>
            </label>
            <input
              class="form-input"
              v-model="registerFormJuridical.legalAddress"
              type="text"
              placeholder="Адрес"
              autocomplete="street-address"
            />
          </div>

          <button type="button" class="btn btn-primary registration-btn-main">
            Зарегистрироваться
          </button>
        </form>

        <form v-else class="register-form" :class="!isJuridical ? 'register_jur' : ''" novalidate>
          <div class="form-field">
            <label class="field-label" :class="!isJuridical ? 'label__center' : ''">
              <span class="field-required">*</span>
              <span class="field-header">Имя</span>
            </label>
            <input
              class="form-input"
              v-model="registerFormIndividual.name"
              type="text"
              placeholder="Иван"
              autocomplete="organization"
            />
          </div>

          <div class="form-field">
            <label class="field-label" :class="!isJuridical ? 'label__center' : ''">
              <span class="field-required">*</span>
              <span class="field-header">Фамилия</span>
            </label>
            <input
              class="form-input"
              v-model="registerFormIndividual.surname"
              type="text"
              placeholder="Иванов"
              autocomplete="family-name"
            />
          </div>

          <div class="form-field">
            <label class="field-label" :class="!isJuridical ? 'label__center' : ''">
              <span class="field-header">Почта</span>
            </label>
            <input
              class="form-input"
              v-model="registerFormIndividual.email"
              type="email"
              placeholder="example@example.ru"
              autocomplete="email"
            />
          </div>

          <div class="form-field">
            <label class="field-label" :class="!isJuridical ? 'label__center' : ''">
              <span class="field-required">*</span>
              <span class="field-header">Номер телефона</span>
            </label>
            <input
              class="form-input"
              v-model="registerFormIndividual.phone"
              type="tel"
              inputmode="tel"
              placeholder="+7(999)999-99-99"
            />
          </div>

          <div class="form-field">
            <label class="field-label" :class="!isJuridical ? 'label__center' : ''">
              <span class="field-required">*</span>
              <span class="field-header">Пароль</span>
            </label>
            <input class="form-input" v-model="registerFormIndividual.password" type="password" />
          </div>

          <div class="form-field">
            <label class="field-label" :class="!isJuridical ? 'label__center' : ''">
              <span class="field-required">*</span>
              <span class="field-header">Подтвердите пароль</span>
            </label>
            <input
              class="form-input"
              v-model="registerFormIndividual.confirmPassword"
              type="password"
            />
          </div>
          <div class="password__container" aria-live="polite">
            <p class="password-header">Пароль должен содержать:</p>

            <div class="password-rules">
              <ul class="rules-col">
                <li :class="{ ok: hasMinLen }"><i aria-hidden="true"></i> Не менее 8 символов</li>
                <li :class="{ ok: hasDigit }"><i aria-hidden="true"></i> Цифры</li>
              </ul>

              <div class="rules-divider" aria-hidden="true"></div>

              <ul class="rules-col">
                <li :class="{ ok: hasUpper }"><i aria-hidden="true"></i> Заглавные буквы</li>
                <li :class="{ ok: hasSpecial }"><i aria-hidden="true"></i> Специальные символы</li>
              </ul>
            </div>
          </div>
          <button type="button" class="btn btn-primary registration-btn-main">
            Зарегистрироваться
          </button>
          <div class="authorize">Есть аккаунт? <a href="/login">Авторизоваться</a></div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { mdiArrowLeft } from '@mdi/js'

const registerFormJuridical = ref({
  companyType: '',
  companyName: '',
  inn: '',
  legalFullName: '',
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

const registerFormIndividual = ref({
  name: '',
  surname: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
})

const isJuridical = ref(false)

const pwd = computed(() => registerFormIndividual.value.password || '')

const hasMinLen = computed(() => pwd.value.length >= 8)
const hasDigit = computed(() => /\d/.test(pwd.value))
const hasUpper = computed(() => /[A-ZА-ЯЁ]/.test(pwd.value)) // латиница + кириллица
const hasSpecial = computed(() => /[^0-9A-Za-zА-Яа-яЁё_\s]/.test(pwd.value)) // любой «небуквенно-цифровой»
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
  box-shadow:
    0 20px 45px rgba(15, 43, 81, 0.08),
    0 10px 18px rgba(15, 43, 81, 0.04);
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

.back-button svg:hover {
  fill: black;
}
.back-button svg {
  width: 23px;
  height: 23px;
  fill: #9c9c9c;
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

.register_jur {
  gap: 0 !important;
}

.form-field {
  display: flex;
  flex-direction: column;
}

.field-label {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 12px;
  color: #000;
  font-weight: 500;
  margin-bottom: -6px;
}

.label__center {
  margin-bottom: 10px;
}

.field-required {
  color: #ef4444;
  font-size: 16px;
  line-height: 1;
}

.field-header {
  font-weight: bold;
  font-size: 14px;
  margin-top: 10px;
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
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.form-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.08);
}

.form-input::placeholder {
  color: #9ca3af;
  font-size: 16px;
}

.form-section-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin-top: 8px;
  align-self: center;
  margin-bottom: 20px;
}

.btn {
  width: 100%;
  height: 48px;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
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
  a {
    text-decoration: none;
    color: #ababab;
  }
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

.password-rules {
  display: flex;
  align-items: flex-start;
  gap: 24px;
  position: relative;
}

.rules-col {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Базовый вид пункта */
.rules-col li {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #6b8a6b;
  font-size: 12px;
  line-height: 1.2;
}

/* Иконка-стрелочка вместо кружка */
.rules-col li i {
  width: 16px;
  height: 16px;
  position: relative;
  display: inline-block;
}

/* Рисуем V-образную стрелку (chevron down) двумя линиями */
.rules-col li i::before,
.rules-col li i::after {
  content: '';
  position: absolute;
  top: 6px; /* вертикальное положение штрихов */
  width: 8px;
  height: 2px;
  background: #6b8a6b; /* цвет «ожидания» */
  transition: background 0.2s ease;
}

/* левая «лапка» */
.rules-col li i::before {
  left: 1px;
  transform: rotate(45deg);
}

/* правая «лапка» */
.rules-col li i::after {
  left: 7px;
  transform: rotate(-45deg);
}

/* Когда правило выполнено — красим текст и стрелку в зелёный */
.rules-col li.ok {
  color: #2e8b57;
}
.rules-col li.ok i::before,
.rules-col li.ok i::after {
  background: #2e8b57;
}

/* Адаптив: на узких экранах убираем разделитель и уменьшаем отступы */
@media (max-width: 420px) {
  .password-rules {
    gap: 16px;
  }
  .rules-divider {
    display: none;
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
