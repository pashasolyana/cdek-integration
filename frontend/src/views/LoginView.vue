<template>
  <div class="login-page">
    <!-- Верхняя зеленая секция -->
    <div class="top-section">
      <!-- Логотип -->
      <div class="logo-wrapper">
        <h1 class="logo">
          BEGUN<span class="logo-accent">OK</span>.PRO
        </h1>
      </div>

      <!-- Форма входа -->
      <div class="login-form">
        <div class="form-field">
          <label class="field-label">Логин</label>
          <input 
            class="form-input" 
            v-model="loginForm.phone" 
            type="text" 
            placeholder="+7 (___) ___-__-__" 
          />
        </div>
        
        <div class="form-field">
          <label class="field-label">Пароль</label>
          <input 
            class="form-input" 
            v-model="loginForm.password" 
            type="password" 
          />
        </div>
        
        <button class="btn btn-green">ВОЙТИ</button>
        <button class="btn btn-blue desktop-registration">РЕГИСТРАЦИЯ</button>
        
        <button class="forgot-link">Восстановить пароль</button>
      </div>
    </div>

    <!-- Нижняя секция с текстом -->
    <div class="bottom-section">
      <div class="bottom-text">
        <h2 class="earn-title">ЗАРАБАТЫВАЙ</h2>
        <h2 class="delivery-title">НА ДОСТАВКЕ</h2>
        <button class="btn btn-blue registration-btn">РЕГИСТРАЦИЯ</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const loginForm = ref({
  phone: '',
  password: ''
})
</script>

<style scoped>

.login-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background: #ffffff;
}


.top-section {
  background: #BDD6B2;
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
  color: #BDD6B2;
  margin-top: -15px;
}

.logo-wrapper {
  margin-bottom: 40px;
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
  font-size: 24px;
  color: #333333;
  box-sizing: border-box;
  outline: none;
}

.form-input::placeholder {
  color: #999999;
  font-size: 24px;
}

.btn {
  width: 200px;
  height: 39px;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  text-transform: uppercase;
}

.btn-green {
  background: #1CA459;
  color: #ffffff;
}

.btn-green:hover {
  background: #169447;
}

.btn-blue {
  background: #2199C5;
  color: #ffffff;
}

.btn-blue:hover {
  background: #1e87ad;
}

.forgot-link {
  background: none;
  border: none;
  color: #5159FF;
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
    padding-bottom: 12px;  /* поднимаем нижний блок выше */
  }

  /* прямые грани клином */
  .top-section::before {
    content: "";
    position: absolute;
    inset: 0;
    background: #BDD6B2;
    /* высота клина: где сходятся прямые линии */
    clip-path: polygon(0 0, 100% 0, 100% 79.5%, 50% 100%, 0 79.5%);
    z-index: 1;
  }

  /* аккуратное закругление в центре (небольшой «носик») */
  .top-section::after {
    content: "";
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    bottom: -22px;               /* насколько выступает вниз */
    width: 240px;                /* ширина дуги (прямые грани останутся) */
    height: 66px;                /* «острота» дуги: меньше — острее, больше — мягче */
    background: #BDD6B2;
    border-radius: 999px;        /* эллипс */
    z-index: 1;
    pointer-events: none;
  }

  /* контент поверх фигур */
  .top-section > * { position: relative; z-index: 2; }

  /* без зазора между секциями */
  .bottom-section {
    margin-top: -22px;           /* совпадает с bottom у ::after */
    padding-top: 22px;
  }

  /* остальной мобильный тюнинг как раньше */
  .desktop-registration { display: none; }
  .registration-btn { display: block; width: 100%; max-width: 220px; margin: 16px auto 0; }

  .login-form { width: 220px; align-items: stretch; gap: 10px; }
  .form-field { width: 100%; }
  .field-label { margin-top: 6px; }
  .logo { font-size: 28px; }
  .form-input { height: 34px; font-size: 16px; padding: 0 12px; }
  .form-input::placeholder { font-size: 16px; }
  .btn { height: 34px; font-size: 13px; width: 100%; }
  .forgot-link { font-size: 13px; margin-top: 6px; align-self: center; }

  .earn-title { font-size: 28px; margin: 0; }
  .delivery-title { font-size: 36px; margin-top: -8px; }
  .logo-wrapper { margin-top: 4vh; margin-bottom: 3vh; }
}
</style>