<template>
  <div class="login-page">
    <!-- Верхняя зеленая секция -->
    <div class="top-section">
      <!-- Логотип -->
      <div class="logo-wrapper">
        <h1 class="logo">BEGUN<span class="logo-accent">OK</span>.PRO</h1>
      </div>

      <div class="login-header">
        <p>Регистрирация</p>
        <p>Зарегистрируйтесь, чтобы</p>
        <p>зарабатывать на доставке</p>
      </div>

      <!-- Форма входа -->
      <div class="login-form">
        <div class="form-field">
          <label class="field-label">Логин</label>
          <input
            class="form-input"
            v-model="loginForm.phone"
            type="tel"
            inputmode="tel"
            placeholder="+7 (___) ___-__-__"
            v-maska="'+7 (###) ###-##-##'"
          />
        </div>
        <v-btn class="btn btn-blue desktop-registration">Получить пароль</v-btn>

        <!-- Consent checkbox -->
        <div class="form-field consent">
          <label class="checkbox">
            <input type="checkbox" class="checkbox-input" v-model="agreed" />
            <span>
              Я согласен на обработку
              <p>
                персональных данных, с
                <a href="/#about" target="_blank" rel="noopener">правилами </a>
              </p>
              <a href="/#about" target="_blank" rel="noopener"> пользования</a>
              и
              <a href="/#offer" target="_blank" rel="noopener">договором оферты</a>.
            </span>
          </label>
        </div>

        <div class="form-field">
          <label class="field-label">Пароль</label>
          <input
            class="form-input"
            v-model="loginForm.password"
            placeholder="Пароль из SMS"
            autocomplete="one-time-code"
            v-maska="'******'"
          />
        </div>

        <v-btn class="btn btn-green" :disabled="true">Регистрация</v-btn>
        <button class="forgot-link">Восстановить пароль</button>
      </div>
    </div>

    <!-- Нижняя секция с текстом -->
    <div class="bottom-section">
      <div class="bottom-text">
        <h2 class="earn-title">ЗАРАБАТЫВАЙ</h2>
        <h2 class="delivery-title">НА ДОСТАВКЕ</h2>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const loginForm = ref({
  phone: '',
  password: '',
})

const agreed = ref(false)
</script>

<style scoped>
.login-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background: #ffffff;
}

.login-header {
  text-align: center;
  color: #ffffff;
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 20px;

  p:first-child {
    color: #000000;
  }
}

.top-section {
  background: #bdd6b2;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  flex: 1;
  clip-path: polygon(0 0, 100% 0, 100% 79%, 50% 100.3%, 0 79%);
  padding-bottom: 70px;
}

.bottom-section {
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 80px 20px 60px;
  margin-top: 10px;
  min-height: 200px;
}

.bottom-text {
  text-align: center;
}

.earn-title {
  font-size: 32px;
  font-weight: 700;
  color: #333333;
}

.delivery-title {
  font-size: 40px;
  font-weight: 700;
  color: #bdd6b2;
  margin-top: -15px;
}

.logo-wrapper {
  margin-bottom: 10px;
  margin-top: 5vh;
}

.logo {
  font-family: 'Source Sans Pro', sans-serif;
  font-size: 64px;
  font-weight: 700;
  color: #ffffff;
  margin: 0;
  letter-spacing: 2px;
  text-align: center;
}

.logo-accent {
  color: #000000;
  font-weight: 700;
}

/* Форма входа */
.login-form {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.form-field {
  display: flex;
  flex-direction: column;
  width: 280px;
}

.field-label {
  font-size: 10px;
  color: #616161;
  margin-bottom: 4px;
  font-weight: 400;
  margin-top: 15px;
}

.form-input {
  width: 100%;
  height: 50px;
  padding: 0 16px;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  background: #ffffff;
  font-size: 16px;
  color: #333333;
  box-sizing: border-box;
  outline: none;
  text-align: center;
}

.form-input::placeholder {
  color: #999999;
  font-size: 16px;
}

.consent {
  width: 280px;
  font-size: 12px;
  color: #616161;
  line-height: 1.3;
}
.consent .checkbox {
  display: flex;
  align-items: flex-start;
  gap: 20px;
}

/* Белый чекбокс + чёрная галочка */
.checkbox-input {
  /* сбрасываем нативный вид */
  -webkit-appearance: none;
  appearance: none;

  width: 18px !important;
  height: 18px !important;
  margin-top: 2px;
  display: inline-block;
  vertical-align: top;
  cursor: pointer;
  border: none;

  /* белый фон и чёрная рамка */
  background-color: #fff;

  border-radius: 4px;
  align-self: center;

  /* плавность (необязательно) */
  transition:
    box-shadow 120ms ease-in-out,
    border-color 120ms ease-in-out;
}

/* оставляем фон белым даже в checked */
.checkbox-input:checked {
  background-color: #fff;
}

/* рисуем чёрную галочку поверх */
.checkbox-input:checked::after {
  content: '';
  position: absolute;
  /* чтобы позиционирование работало, делаем родителя позиционируемым */
}
.checkbox-input {
  position: relative;
}
.checkbox-input:checked::after {
  inset: 0;
  background-repeat: no-repeat;
  background-position: center;
  background-size: 14px 14px;
  /* векторная чёрная галочка */
  background-image: url("data:image/svg+xml;utf8,\
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>\
<path d='M20 6L9 17l-5-5' fill='none' stroke='black' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'/>\
</svg>");
}

/* фокус-обводка с клавиатуры */
.checkbox-input:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px #00000033;
}

.consent input[type='checkbox'] {
  width: 16px;
  height: 16px;
  margin-top: 2px;
}
.consent a {
  color: #5159ff;
  text-decoration: underline;
}

.btn {
  width: 200px;
  height: 39px;
  border: none;
  font-size: 15px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  text-transform: uppercase;
  text-align: center;
  align-content: center;
}

.btn-green {
  background: #1ca459;
  color: #ffffff;
}

.btn-green:hover {
  background: #169447;
}

.btn-blue {
  background: #2199c5;
  color: #ffffff;
}

.btn-blue:hover {
  background: #1e87ad;
}

.forgot-link {
  background: none;
  border: none;
  color: #5159ff;
  font-size: 20px;
  cursor: pointer;
  text-decoration: none;
  margin-top: 8px;
}

.forgot-link:hover {
  text-decoration: underline;
}

.registration-btn {
  margin-top: 20px;
  display: none;
}

.desktop-registration {
  display: block;
}

/* Мобильная адаптация */
@media (max-width: 768px) {
  .top-section {
    position: relative;
    background: transparent !important;
    padding-bottom: 12px; /* поднимаем нижний блок выше */
  }

  /* прямые грани клином */
  .top-section::before {
    content: '';
    position: absolute;
    inset: 0;
    background: #bdd6b2;
    /* высота клина: где сходятся прямые линии */
    clip-path: polygon(0 0, 100% 0, 100% 79.5%, 50% 100%, 0 79.5%);
    z-index: 1;
  }

  /* аккуратное закругление в центре (небольшой «носик») */
  .top-section::after {
    content: '';
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    bottom: -22px; /* насколько выступает вниз */
    width: 240px; /* ширина дуги (прямые грани останутся) */
    height: 66px; /* «острота» дуги: меньше — острее, больше — мягче */
    background: #bdd6b2;
    border-radius: 999px; /* эллипс */
    z-index: 1;
    pointer-events: none;
  }

  /* контент поверх фигур */
  .top-section > * {
    position: relative;
    z-index: 2;
  }

  /* без зазора между секциями */
  .bottom-section {
    margin-top: -22px; /* совпадает с bottom у ::after */
    padding-top: 22px;
  }

  /* остальной мобильный тюнинг как раньше */
  .desktop-registration {
    display: none;
  }
  .registration-btn {
    display: block;
    width: 100%;
    max-width: 220px;
    margin: 16px auto 0;
  }

  .login-form {
    width: 220px;
    align-items: stretch;
    gap: 10px;
  }
  .form-field {
    width: 100%;
  }
  .field-label {
    margin-top: 6px;
  }
  .logo {
    font-size: 28px;
  }
  .form-input {
    height: 34px;
    font-size: 16px;
    padding: 0 12px;
  }
  .form-input::placeholder {
    font-size: 16px;
  }
  .consent {
    width: 100%;
    font-size: 11px;
  }
  .btn {
    height: 34px;
    font-size: 13px;
    width: 100%;
  }
  .forgot-link {
    font-size: 13px;
    margin-top: 6px;
    align-self: center;
  }

  .earn-title {
    font-size: 28px;
    margin: 0;
  }
  .delivery-title {
    font-size: 36px;
    margin-top: -8px;
  }
  .logo-wrapper {
    margin-top: 4vh;
    margin-bottom: 3vh;
  }
}
</style>
