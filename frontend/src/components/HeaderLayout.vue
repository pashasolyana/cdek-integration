<template>
  <header class="topbar">
    <div class="topbar__inner">
      <a class="brand" href="/">
        <span>BEGUN</span><span class="brand__ok">OK</span><span>.PRO</span>
      </a>

      <nav class="menu">
        <a href="#about">О нас</a>
        <a href="#contacts">Контакты</a>
        <a href="#offer">Оферта</a>
      </nav>

    </div>
  </header>
</template>

<script setup lang="ts"></script>

<style scoped>
:root{
  --h:56px;
  --bg:#dfeeda;          /* фон шапки как на референсе */
  --border:#cfe4c9;
  --brand:#0b0b0b;
  --ok:#16a34a;
  --link:#2a2f36;
  --btn:#3b82f6;
}

/* Шапка на всю ширину, фиксированная высота */
.topbar{
  height:var(--h);
  background:var(--bg);
  border-bottom:1px solid var(--border);
}

/* Строгое выравнивание: бренд | меню | баннер */
.topbar__inner{
  height:var(--h);
  max-width:1440px;
  margin:0 auto;
  padding:0 16px;
  display:grid;
  grid-template-columns:auto 1fr minmax(480px,600px);
  align-items:center;
  column-gap:24px;
}

.brand{
  color:var(--brand);
  text-decoration:none;
  white-space:nowrap;
  font-weight:800;
  font-size:28px;
  letter-spacing:.4px;
  line-height:1;
}
.brand__ok{ color:var(--ok); }

.menu{
  display:flex;
  gap:24px;
}
.menu a{
  color:var(--link);
  text-decoration:none;
  font-weight:500;
  font-size:15px;
}
.menu a:hover{ opacity:.75; }

/* Баннер как background, ничего не режется <img>-ом */
.promo{
  position:relative;
  height:44px;
  border-radius:12px;
  background: url('/images/promo.jpg') left center / cover no-repeat; /* помести файл в /public/images/promo.jpg */
  box-shadow: inset 0 0 0 1px rgba(0,0,0,.04);
}

/* Кнопка поверх баннера */
.promo__btn{
  position:absolute;
  right:12px;
  top:50%;
  transform:translateY(-50%);
  padding:6px 14px;
  border:0;
  border-radius:10px;
  background:var(--btn);
  color:#fff;
  font-weight:700;
  font-size:12px;
  line-height:1;
  cursor:pointer;
}
.promo__btn:hover{ filter:brightness(.96); }

/* Адаптив */
@media (max-width:1024px){
  .brand{ font-size:24px; }
  .topbar__inner{ grid-template-columns:auto 1fr 420px; }
}
@media (max-width:820px){
  .menu{ display:none; }
  .topbar__inner{ grid-template-columns:auto 1fr; }
}
</style>
