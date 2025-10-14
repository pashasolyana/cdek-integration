<script setup lang="ts">
import Dropdown from '@/components/Dropdown.vue'
import Input from '@/components/Input.vue'
import { ref } from 'vue'

let selectedOption1 = ref<string | null>(null)
let selectedOption2 = ref<string | null>(null)
let selectedOption3 = ref<string | null>(null)
</script>

<template>
  <main class="main-container">
    <h1>Оформить заказ</h1>
    <section class="dropdawn-section">
      <Dropdown
        :options="[
          { value: 'option1', label: 'Option 1' },
          { value: 'option2', label: 'Option 2' },
          { value: 'option3', label: 'Option 3' },
        ]"
        v-model="selectedOption1"
        placeholder="Торговая компания"
        width="625px"
        height="54px"
      />
      <Dropdown
        :options="[
          { value: 'option1', label: 'Option 1' },
          { value: 'option2', label: 'Option 2' },
          { value: 'option3', label: 'Option 3' },
        ]"
        v-model="selectedOption2"
        placeholder="Способ доставки"
        width="625px"
        height="54px"
      />
    </section>
    <section class="address-section">
      <section class="required-address-section">
        <div class="required-address-inputs">
          <Input height="54px" width="308px" placeholder="Город" disabled />
          <Input height="54px" width="308px" placeholder="Адрес" disabled />
        </div>
        <div class="map">
          <p>Указать на карте</p>
          <svg
            width="19"
            height="19"
            viewBox="0 0 19 19"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M15.1438 8.22777C15.1438 11.842 11.1343 15.6061 9.78793 16.7686C9.6625 16.8629 9.50982 16.9139 9.35289 16.9139C9.19596 16.9139 9.04328 16.8629 8.91785 16.7686C7.57147 15.6061 3.56201 11.842 3.56201 8.22777C3.56201 6.69193 4.17212 5.219 5.25812 4.133C6.34412 3.047 7.81705 2.43689 9.35289 2.43689C10.8887 2.43689 12.3617 3.047 13.4477 4.133C14.5337 5.219 15.1438 6.69193 15.1438 8.22777Z"
              stroke="#344E41"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M9.35273 10.3993C10.5521 10.3993 11.5243 9.42706 11.5243 8.22773C11.5243 7.0284 10.5521 6.05615 9.35273 6.05615C8.1534 6.05615 7.18115 7.0284 7.18115 8.22773C7.18115 9.42706 8.1534 10.3993 9.35273 10.3993Z"
              stroke="#344E41"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
      </section>
      <section class="extra-address-section">
        <Input height="54px" width="308px" placeholder="Квартира" disabled />
        <Input height="54px" width="308px" placeholder="Индекс" disabled />
      </section>
    </section>
    <section class="customer-seller-section">
      <section class="customer-section">
        <h4>Данные заказчика</h4>
        <Input height="54px" width="625px" placeholder="ФИО" disabled />
        <Input height="54px" width="625px" placeholder="Телефон" disabled />
      </section>
      <section class="seller-section">
        <h4>Данные продавца</h4>
        <Input height="54px" width="625px" placeholder="ФИО" disabled />
        <Input height="54px" width="625px" placeholder="Телефон" disabled />
      </section>
    </section>
    <section class="values-section">
      <Dropdown
        :options="[
          { value: 'option1', label: 'Option 1' },
          { value: 'option2', label: 'Option 2' },
          { value: 'option3', label: 'Option 3' },
        ]"
        v-model="selectedOption3"
        placeholder="Тип вложения"
        width="234px"
        height="54px"
      />
      <Input height="54px" width="234px" placeholder="Вес(гр)" />
      <Input height="54px" width="234px" placeholder="Длина(см)" />
      <Input height="54px" width="234px" placeholder="Ширина(см)" />
      <Input height="54px" width="234px" placeholder="Высота(см)" />
      <div class="plus">
        <svg
          width="39"
          height="25"
          viewBox="0 0 39 25"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <line x1="12" y1="11.5" x2="27" y2="11.5" stroke="black" />
          <line x1="19.5" y1="4" x2="19.5" y2="19" stroke="black" />
        </svg>
      </div>
    </section>
    <section class="proccesing-section">
      <section class="first-proccesing-section">
        <Input height="54px" width="308px" placeholder="Оценочная стоимость" disabled />
        <button class="submit-proccessing-btn">Рассчитать</button>
      </section>
      <section class="second-proccesing-section">
        <Input height="54px" width="415px" placeholder="Сумма" disabled />
        <Input height="54px" width="415px" placeholder="Доставка" disabled />
        <Input height="54px" width="415px" placeholder="Наценка" disabled />
      </section>
    </section>
    <section class="confirmation-section">
      <Input height="54px" width="308px" placeholder="Итого" disabled />
      <button class="submit-confirmation-btn">Сделать заказ</button>
    </section>
  </main>
</template>

<style scoped>
.main-container {
  padding: 30px 20px 20px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100dvw;
  height: calc(100dvh - 68 - 56);
}

.dropdawn-section {
  margin-top: 40px;
  display: flex;
  gap: 10px;
}

.address-section {
  margin-top: 20px;
  display: flex;
  gap: 10px;
}

.required-address-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.required-address-inputs {
  display: flex;
  gap: 10px;
}

.map {
  display: flex;
  align-items: flex-end;
  justify-content: end;
  cursor: pointer;

  p {
    display: flex;
    font-size: 12px;
  }

  svg {
    display: flex;
  }
}

.extra-address-section {
  display: flex;
  gap: 10px;
}

.customer-seller-section {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.customer-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.seller-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

h4 {
  margin-left: 30px;
}

.values-section {
  margin-top: 20px;
  display: flex;
  gap: 10px;
}

.plus {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.proccesing-section {
  margin-top: 40px;
  display: flex;
  flex-direction: column;
}

.first-proccesing-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
}

.submit-proccessing-btn {
  width: 308px;
  height: 54px;
  background-color: #344e41;
  border: none;
  border-radius: 5px;
  color: white;
  font-size: 16px;
  cursor: pointer;
}

.second-proccesing-section {
  margin-top: 30px;
  display: flex;
  gap: 10px;
}

.confirmation-section {
  margin-top: 40px;
  display: flex;
  gap: 20px;
}

.submit-confirmation-btn {
  width: 308px;
  height: 54px;
  background-color: #344e41;
  border: none;
  border-radius: 5px;
  color: white;
  font-size: 16px;
  cursor: pointer;
}
</style>
