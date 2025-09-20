<template>
  <div class="register-page">
    <!-- Верхняя зеленая секция -->
    <div class="top-section">
      <!-- Логотип -->
      <div class="logo-wrapper">
        <h1 class="logo">
          BEGUN<span class="logo-accent">OK</span>.PRO
        </h1>
      </div>

      <!-- Заголовок регистрации -->
      <div class="register-header">
        <h2 class="register-title">Регистрация</h2>
        <p class="register-subtitle">Зарегистрируйтесь, чтобы заработать на доставке</p>
      </div>

      <!-- Форма регистрации -->
      <div class="register-form">
        <div class="form-field">
          <label class="field-label">Логин</label>
          <input 
            class="form-input" 
            v-model="registerForm.phone" 
            type="text" 
            placeholder="+7 (___) ___-__-__" 
          />
          <span class="error-message">Номер номер неверный</span>
        </div>

        <button class="btn btn-blue">ПОЛУЧИТЬ ПАРОЛЬ</button>

        <div class="agreement">
          <label class="checkbox-wrapper">
            <input type="checkbox" v-model="registerForm.agreement" class="checkbox">
            <span class="checkmark"></span>
            Я согласен на обработку персональных данных и договором оферты
          </label>
        </div>

        <div class="sms-section">
          <div class="sms-inputs">
            <input class="sms-input" v-model="registerForm.sms1" type="text" maxlength="1" />
            <input class="sms-input" v-model="registerForm.sms2" type="text" maxlength="1" />
            <input class="sms-input" v-model="registerForm.sms3" type="text" maxlength="1" />
            <input class="sms-input" v-model="registerForm.sms4" type="text" maxlength="1" />
          </div>
          <p class="sms-hint">Пароль будет отправлен вам автоматически в SMS</p>
        </div>

        <button class="btn btn-purple registration-btn-main">РЕГИСТРАЦИЯ</button>
      </div>
    </div>

    <!-- Нижняя секция с текстом -->
    <div class="bottom-section">
      <div class="bottom-text">
        <h2 class="earn-title">ЗАРАБАТЫВАЙ</h2>
        <h2 class="delivery-title">НА ДОСТАВКЕ</h2>
        <button class="btn btn-blue registration-btn-mobile">РЕГИСТРАЦИЯ</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const registerForm = ref({
  phone: '',
  agreement: false,
  sms1: '',
  sms2: '',
  sms3: '',
  sms4: ''
})
</script>

<style scoped>

.register-page {
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
  margin-bottom: 20px;
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

.register-header {
  text-align: center;
  margin-bottom: 20px;
}

.register-title {
  font-size: 20px;
  font-weight: 600;
  color: #ffffff;
  margin: 0 0 8px 0;
}

.register-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
  line-height: 1.3;
}

/* Форма регистрации */
.register-form {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  width: 100%;
  max-width: 320px;
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

.form-input.error {
  border-color: #ff4444;
}

.form-input::placeholder {
  color: #999999;
  font-size: 24px;
}

.error-message {
  font-size: 12px;
  color: #ff4444;
  margin-top: 4px;
}

.btn {
  height: 39px;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  text-transform: uppercase;
}

.btn-blue {
  background: #2199C5;
  color: #ffffff;
  width: 200px;
}

.btn-blue:hover {
  background: #1e87ad;
}

.btn-purple {
  background: #8B5CF6;
  color: #ffffff;
  width: 200px;
}

.btn-purple:hover {
  background: #7C3AED;
}

.agreement {
  width: 280px;
  margin: 10px 0;
}

.checkbox-wrapper {
  display: flex;
  align-items: flex-start;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  line-height: 1.3;
}

.checkbox {
  margin-right: 8px;
  margin-top: 2px;
  flex-shrink: 0;
}

.sms-section {
  text-align: center;
  margin: 10px 0;
}

.sms-inputs {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-bottom: 8px;
}

.sms-input {
  width: 40px;
  height: 40px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  text-align: center;
  font-size: 18px;
  font-weight: 600;
  background: #ffffff;
  outline: none;
}

.sms-input:focus {
  border-color: #2199C5;
}

.sms-hint {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
  line-height: 1.2;
}

.registration-btn-main {
  display: block;
}

.registration-btn-mobile {
  margin-top: 20px;
  display: none;
}

</style>