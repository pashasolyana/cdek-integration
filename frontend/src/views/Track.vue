<!-- src/views/TrackView.vue -->
<template>
    <div class="trk-page">
        <div class="trk-modal">
            <div class="trk-container">
                <header class="trk-header">
                    <h2 class="trk-title">Отслеживание заказа</h2>
                    <p class="trk-subtitle">Введите номер отправления СДЭК и получите статусы</p>
                </header>

                <form class="trk-form" @submit.prevent="onSubmit" novalidate>
                    <div class="form-field">
                        <label class="field-label">Номер отправления</label>
                        <input class="form-input" v-model="number" type="text" inputmode="numeric"
                            placeholder="10162191938"
                            :class="{ 'is-invalid': touched && !valid, 'is-valid': touched && valid }"
                            @blur="touched = true" />
                        <p v-if="touched && !valid" class="field-error">Только цифры, 10–14 символов</p>
                    </div>

                    <p v-if="serverError" class="server-error" role="alert">{{ serverError }}</p>

                    <div class="actions">
                        <button type="button" class="btn btn-outline" @click="goBack">Назад</button>
                        <button type="submit" class="btn btn-primary" :disabled="!valid || loading">
                            {{ loading ? 'Ищем…' : 'Найти' }}
                        </button>
                    </div>
                </form>

                <!-- Результат -->
                <section v-if="result" class="result">
                    <div class="meta">
                        <div class="meta-row">
                            <span>№ СДЭК:</span> <b>{{ entity.cdek_number || entity.number }}</b>
                        </div>
                        <div class="meta-row">
                            <span>Маршрут:</span>
                            <b>{{ entity.from_location?.city }} → {{ entity.to_location?.city }}</b>
                        </div>
                        <div class="meta-row" v-if="entity.delivery_date">
                            <span>Дата вручения:</span> <b>{{ formatDate(entity.delivery_date) }}</b>
                        </div>
                    </div>

                    <h3 class="statuses-title">Статусы</h3>
                    <ul class="timeline" v-if="sortedStatuses.length">
                        <li v-for="s in sortedStatuses" :key="s.code + s.date_time" class="tl-item">
                            <div class="dot"></div>
                            <div class="tl-content">
                                <div class="tl-row">
                                    <span class="tl-name">{{ s.name }}</span>
                                    <span class="tl-date">{{ formatDateTime(s.date_time) }}</span>
                                </div>
                                <div class="tl-sub">
                                    <span class="tl-city" v-if="s.city">{{ s.city }}</span>
                                    <span class="tl-code">код: {{ s.code }}</span>
                                </div>
                            </div>
                        </li>
                    </ul>
                    <p v-else class="empty">Статусы не найдены</p>
                </section>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import apiService from '@/services/api'

const router = useRouter()
const route = useRoute()

const number = ref<string>(String(route.query.number || ''))
const touched = ref(false)
const loading = ref(false)
const serverError = ref<string | null>(null)
const result = ref<any>(null)

const valid = computed(() => /^\d{10,14}$/.test(number.value.trim()))
const entity = computed(() => result.value?.data?.entity || {})
const statuses = computed<any[]>(() => entity.value?.statuses || [])
const sortedStatuses = computed(() =>
    [...statuses.value].sort((a, b) => new Date(b.date_time).getTime() - new Date(a.date_time).getTime()),
)

function formatDate(d: string) {
    const dt = new Date(d)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${pad(dt.getDate())}.${pad(dt.getMonth() + 1)}.${dt.getFullYear()}`
}
function formatDateTime(d: string) {
    const dt = new Date(d)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${pad(dt.getDate())}.${pad(dt.getMonth() + 1)}.${dt.getFullYear()} ${pad(dt.getHours())}:${pad(dt.getMinutes())}`
}

function goBack() {
    router.push('/')
}

async function onSubmit() {
    touched.value = true
    serverError.value = null
    result.value = null
    if (!valid.value) return

    try {
        loading.value = true
        // при необходимости поменяйте путь на ваш
        const { data } = await apiService.getInstance().get('cdek/orders', {
            params: { cdek_number: number.value.trim() },
        })
        if (!data?.success) throw new Error(data?.message || 'Не удалось получить данные')
        result.value = data
    } catch (e: any) {
        serverError.value = e?.response?.data?.message || e?.message || 'Ошибка запроса'
    } finally {
        loading.value = false
    }
}


</script>

<style scoped>
.trk-page {
    min-height: 100vh;
    padding: 64px 0;
    display: flex;
    justify-content: center;
    align-items: center;
    background: #f4f4f4;
}

.trk-modal {
    width: clamp(420px, calc(100% - 14vw), 960px);
    background: #fff;
    border-radius: 28px;
    box-shadow: 0 24px 60px rgba(15, 43, 81, .10), 0 12px 24px rgba(15, 43, 81, .05);
    display: flex;
    justify-content: center;
}

.trk-container {
    width: 100%;
    box-sizing: border-box;
    padding: 48px 72px 56px;
}

.trk-header {
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.trk-title {
    font-size: 36px;
    font-weight: 700;
    color: #171717;
    margin: 0;
}

.trk-subtitle {
    color: #6b7280;
    margin: 0;
}

.trk-form {
    display: flex;
    flex-direction: column;
    gap: 20px;
    width: 100%;
    max-width: 560px;
    margin: 18px auto 0;
}

.form-field {
    display: flex;
    flex-direction: column;
}

.field-label {
    font-size: 12px;
    color: #111827;
    font-weight: 600;
    margin-bottom: 6px;
}

.form-input {
    height: 56px;
    padding: 0 18px;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    font-size: 16px;
    transition: border-color .2s, box-shadow .2s, background .2s;
}

.form-input:focus {
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, .08);
}

.is-invalid {
    border-color: #ef4444 !important;
    background: #fff7f7;
}

.is-valid {
    border-color: #34d399;
}

.field-error {
    margin-top: 6px;
    font-size: 12px;
    color: #ef4444;
}

.actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
}

.btn {
    height: 56px;
    border-radius: 12px;
    font-weight: 700;
    font-size: 15px;
    cursor: pointer;
    transition: transform .2s, box-shadow .2s, background .2s, border-color .2s;
}

.btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, .08);
}

.btn-primary {
    background: #1f402e;
    border: 1px solid #1f402e;
    color: #fff;
}

.btn-primary:hover {
    background: #183323;
    border-color: #183323;
}

.btn-outline {
    background: #fff;
    border: 1.5px solid #1f402e;
    color: #1f402e;
}

.btn-outline:hover {
    background: #f6faf7;
}

.server-error {
    color: #ef4444;
    font-size: 13px;
}

/* результат */
.result {
    max-width: 720px;
    margin: 20px auto 0;
}

.meta {
    display: grid;
    gap: 6px;
    margin-bottom: 16px;
    color: #374151;
}

.meta-row span {
    color: #6b7280;
    margin-right: 6px;
}

/* таймлайн статусов */
.statuses-title {
    font-size: 18px;
    margin: 14px 0 10px;
    color: #111827;
}

.timeline {
    position: relative;
    list-style: none;
    padding: 0;
    margin: 0;
}

.tl-item {
    display: flex;
    gap: 12px;
    position: relative;
    padding-left: 10px;
}

.tl-item+.tl-item {
    margin-top: 14px;
}

.dot {
    width: 10px;
    height: 10px;
    background: #1f402e;
    border-radius: 50%;
    position: relative;
    top: 8px;
    flex: 0 0 10px;
}

.tl-content {
    flex: 1;
    border-left: 2px solid #e5e7eb;
    padding-left: 12px;
    margin-left: -6px;
}

.tl-row {
    display: flex;
    justify-content: space-between;
    gap: 12px;
}

.tl-name {
    font-weight: 600;
    color: #111827;
}

.tl-date {
    color: #6b7280;
}

.tl-sub {
    display: flex;
    gap: 10px;
    color: #6b7280;
    font-size: 13px;
}

.tl-code {
    opacity: .8;
}

.empty {
    color: #6b7280;
}

@media (max-width: 768px) {
    .trk-container {
        padding: 36px 24px 36px;
    }

    .trk-title {
        font-size: 28px;
    }

    .btn {
        height: 50px;
    }
}
</style>
