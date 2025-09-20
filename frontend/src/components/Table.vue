<template>
  <div class="shipments-table" @keydown.esc="closeFilter">
    <div class="table-wrap">
      <table class="grid">
        <thead>
          <tr>
            <th class="col-check">
              <label class="checkbox">
                <input type="checkbox" :checked="allChecked" @change="toggleAll($event)" />
                <span></span>
              </label>
            </th>
            <th
              v-for="col in visibleColumns"
              :key="col.key"
              :class="['th', 'col-' + col.key, col.align ? 'align-' + col.align : '']"
              :style="col.width ? { width: col.width + 'px' } : null"
              @click="col.sortable && changeSort(col.key)"
            >
              <div class="th-inner" :class="{ clickable: col.sortable }">
                <span class="label">{{ col.label }}</span>
                <span v-if="col.sortable" class="sort">
                  <i class="asc" :class="{ active: sort.key === col.key && sort.dir === 'asc' }" />
                  <i class="desc" :class="{ active: sort.key === col.key && sort.dir === 'desc' }" />
                </span>
                <button class="filter-btn" :class="{ active: isFiltered(col.key) }" @click.stop="openFilter(col.key, $event)">
                  <svg viewBox="0 0 24 24" class="funnel" aria-hidden="true"><path d="M3 5h18l-7.5 8v4.5L9 19v-6L3 5z"/></svg>
                </button>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, i) in pagedRows" :key="row.id ?? i">
            <td class="col-check">
              <label class="checkbox">
                <input type="checkbox" :checked="selectedIds.has(row.id ?? i)" @change="toggleRow(row, i)" />
                <span></span>
              </label>
            </td>
            <td v-for="col in visibleColumns"
                :key="col.key + '-' + (row.id ?? i)"
                :class="['td', 'col-' + col.key, col.align ? 'align-' + col.align : '']"
                :style="col.width ? { width: col.width + 'px' } : null"
            >
              <template v-if="cellFormat(col) === 'link'">
                <a href="#" class="link">{{ row[col.key] }}</a>
              </template>
              <template v-else-if="cellFormat(col) === 'money'">
                {{ formatMoney(row[col.key]) }}
              </template>
              <template v-else-if="cellFormat(col) === 'status'">
                <span :class="['status', statusClass(row[col.key])]"></span>
                <span class="status-text">{{ row[col.key] }}</span>
              </template>
              <template v-else>
                <span :title="col.ellipsis ? row[col.key] : null" :class="{ 'ellipsis': col.ellipsis }">{{ row[col.key] }}</span>
              </template>
            </td>
          </tr>
          <tr v-if="!sortedRows.length">
            <td :colspan="visibleColumns.length + 1" class="empty">Нет данных</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Excel-like filter popover -->
    <div v-if="filter.open" class="filter-popover" :style="filter.style" @click.stop>
      <div class="filter-head">
        <input v-model="filter.search" class="filter-search" type="text" placeholder="Поиск" />
      </div>
      <div class="filter-select-all">
        <label class="checkbox">
          <input type="checkbox" :checked="isAllOptionsChecked" @change="toggleSelectAllOptions($event)" />
          <span></span>
        </label>
        <span class="sel-all-label">Выделить все</span>
      </div>
      <div class="filter-list">
        <label v-for="opt in filteredOptions" :key="opt.token" class="option">
          <input type="checkbox" :value="opt.token" :checked="filter.tempSelected.has(opt.token)" @change="onTempToggle(opt.token, $event)" />
          <span class="opt-label">{{ opt.display }}</span>
        </label>
      </div>
      <div class="filter-actions">
        <button class="btn ghost" @click="clearFilterActive">Очистить</button>
        <div class="spacer"></div>
        <button class="btn" @click="applyFilter">ОК</button>
      </div>
    </div>

    <div class="table-footer">
<div class="left">Всего {{ rows.length }} {{ pluralizeRecords(rows.length) }}</div> 
<div class="center">
  <button class="icon-btn" @click="prevPage" :disabled="currentPage === 1">‹</button>
  <span>{{ currentPage }} / {{ totalPages }}</span>
  <button class="icon-btn" @click="nextPage" :disabled="currentPage === totalPages">›</button>
</div>
      <div class="right">
        <button class="icon-btn" title="Обновить" @click="$emit('refresh')">⟳</button>
        <button class="icon-btn" title="Настройки" @click="$emit('settings')">⚙️</button>
        <button class="icon-btn" title="Ещё" @click="$emit('more')">⋮</button>
      </div>
    </div>
  </div>
</template>


<script setup>
import { computed, reactive, ref, onMounted, onBeforeUnmount } from 'vue'

// Local defaults (если проп columns не передан)
const defaultColumns = [
  { key: 'date', label: 'Дата', width: 96, sortable: true },
  { key: 'carrier', label: 'Транспортная компания', width: 180, sortable: true },
  { key: 'orderNo', label: '№ заказа', width: 110, sortable: true, align: 'right', format: 'link' },
  { key: 'track', label: 'Трек номер ТК', width: 140, sortable: true, align: 'right', format: 'link' },
  { key: 'recipient', label: 'Получатель', width: 160, sortable: true },
  { key: 'phone', label: 'Телефон получателя', width: 160, sortable: true },
  { key: 'address', label: 'Адрес', width: 520, sortable: false, ellipsis: true },
  { key: 'cod', label: 'Налож. платеж', width: 120, sortable: true, align: 'right', format: 'money' },
  { key: 'rate', label: 'Тариф', width: 100, sortable: true, align: 'right', format: 'money' },
  { key: 'status', label: 'Статус', width: 110, sortable: true, format: 'status' },
]

const props = defineProps({
  rows: { type: Array, default: () => [] },
  columns: { type: Array, default: undefined },
  pageSize: { type: Number, default: 10 },
})
function prevPage() {
  if (currentPage.value > 1) currentPage.value--
}
function nextPage() {
  if (currentPage.value < totalPages.value) currentPage.value++
}
const emit = defineEmits(['update:selection', 'refresh', 'settings', 'more'])

const visibleColumns = computed(() => (props.columns && props.columns.length ? props.columns : defaultColumns))
function pluralizeRecords(n) {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return 'запись'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'записи'
  return 'записей'
}
// SORT
const sort = reactive({ key: visibleColumns.value[0]?.key || 'date', dir: 'desc' })
function changeSort(key) {
  if (sort.key !== key) {
    sort.key = key
    sort.dir = 'asc'
  } else {
    sort.dir = sort.dir === 'asc' ? 'desc' : 'asc'
  }
}

function cellFormat(col) {
  if (col && col.format) return col.format
  if (!col) return 'text'
  if (col.key === 'status') return 'status'
  if (col.key === 'cod' || col.key === 'rate') return 'money'
  if (col.key === 'orderNo' || col.key === 'track') return 'link'
  return 'text'
}

const colMap = computed(() => {
  const m = {}
  visibleColumns.value.forEach(c => { m[c.key] = c })
  return m
})

function toNumberish(val) {
  if (val === undefined || val === null) return null
  const s = String(val).replace(/[ ,]/g, '')
  const n = Number(s)
  return Number.isNaN(n) ? null : n
}

function parseDateDMY(val) {
  const parts = String(val).split('.')
  if (parts.length === 3) {
    const [d, m, y] = parts.map(Number)
    if (!Number.isNaN(d) && !Number.isNaN(m) && !Number.isNaN(y)) {
      return new Date(y, m - 1, d).getTime()
    }
  }
  return null
}

function sortValue(row, key) {
  const v = row[key]
  const fmt = cellFormat(colMap.value[key])
  if (fmt === 'money') {
    const n = toNumberish(v); if (n !== null) return n
  }
  const d = parseDateDMY(v); if (d !== null) return d
  if (typeof v === 'number') return v
  if (v === undefined || v === null) return ''
  return String(v).toLowerCase()
}

// FILTERS
const TOKEN_BLANK = '__BLANK__'
const filters = reactive({})
function isFiltered(key) { return filters[key] && filters[key].size > 0 }
function valToToken(v) { return v == null || String(v).trim() === '' ? TOKEN_BLANK : String(v).trim() }
function tokenToDisplay(t) { return t === TOKEN_BLANK ? '(пусто)' : t }
function rowMatchesAllFilters(row, exceptKey = null) {
  for (const k in filters) {
    if (exceptKey && k === exceptKey) continue
    const set = filters[k]
    if (set && set.size && !set.has(valToToken(row[k]))) return false
  }
  return true
}
function optionsForColumn(key) {
  const base = props.rows.filter(r => rowMatchesAllFilters(r, key))
  const set = new Set(base.map(r => valToToken(r[key])))
  return Array.from(set).map(t => ({ token: t, display: tokenToDisplay(t) }))
}
const filter = reactive({ open: false, key: null, style: {}, search: '', options: [], tempSelected: new Set() })
function openFilter(key, evt) {
  filter.key = key
  filter.search = ''
  filter.options = optionsForColumn(key)
  const current = filters[key]
  filter.tempSelected = current?.size ? new Set(current) : new Set(filter.options.map(o => o.token))
  const rect = evt.currentTarget.getBoundingClientRect()
  filter.style = { left: rect.left + 'px', top: (rect.bottom + window.scrollY) + 'px' }
  filter.open = true
}
function closeFilter() { filter.open = false }
const filteredOptions = computed(() => filter.search ? filter.options.filter(o => o.display.toLowerCase().includes(filter.search.toLowerCase())) : filter.options)
const isAllOptionsChecked = computed(() => filter.options.length && filter.tempSelected.size === filter.options.length)
function toggleSelectAllOptions(e) { filter.tempSelected = new Set(e.target.checked ? filter.options.map(o => o.token) : []) }
function onTempToggle(token, e) {
  if (e.target.checked) filter.tempSelected.add(token); else filter.tempSelected.delete(token)
  filter.tempSelected = new Set(filter.tempSelected)
}
function applyFilter() {
  if (filter.tempSelected.size === filter.options.length) delete filters[filter.key]
  else filters[filter.key] = new Set(filter.tempSelected)
  closeFilter()
}
function clearFilterActive() { if (filter.key) delete filters[filter.key]; closeFilter() }
function onGlobalClick(e) { if (filter.open && !document.querySelector('.filter-popover')?.contains(e.target)) closeFilter() }
onMounted(() => document.addEventListener('click', onGlobalClick))
onBeforeUnmount(() => document.removeEventListener('click', onGlobalClick))

// DATA
const filteredRows = computed(() => props.rows.filter(row => rowMatchesAllFilters(row)))
const sortedRows = computed(() => {
  const list = [...filteredRows.value]
  const dir = sort.dir === 'asc' ? 1 : -1
  return list.sort((a, b) => {
    const va = sortValue(a, sort.key), vb = sortValue(b, sort.key)
    if (va < vb) return -1 * dir
    if (va > vb) return 1 * dir
    return 0
  })
})

// PAGINATION
const currentPage = ref(1)
const totalPages = computed(() => Math.ceil(sortedRows.value.length / props.pageSize) || 1)
const pagedRows = computed(() => {
  const start = (currentPage.value - 1) * props.pageSize
  return sortedRows.value.slice(start, start + props.pageSize)
})

// SELECTION
const selectedIds = ref(new Set())
const allChecked = computed(() => sortedRows.value.length && selectedIds.value.size === sortedRows.value.length)
function toggleAll(e) {
  const on = e.target.checked
  selectedIds.value = new Set(on ? sortedRows.value.map((r, i) => r.id ?? i) : [])
  emit('update:selection', Array.from(selectedIds.value))
}
function toggleRow(row, i) {
  const id = row.id ?? i
  if (selectedIds.value.has(id)) selectedIds.value.delete(id); else selectedIds.value.add(id)
  selectedIds.value = new Set(selectedIds.value)
  emit('update:selection', Array.from(selectedIds.value))
}

// HELPERS
function formatMoney(v) {
  if (v == null || v === '-' || v === '') return '-'
  const n = toNumberish(v)
  return n === null ? String(v) : n.toFixed(2)
}
function statusClass(s) {
  const v = String(s || '').toLowerCase()
  if (v.includes('отмен') || v.includes('cancel')) return 'canceled'
  if (v.includes('удал')) return 'deleted'
  return 'default'
}
</script>

<style scoped>
.center {
  flex: 1;
  text-align: center;
}
.shipments-table { font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; color: #222; position: relative; }
.table-wrap { overflow: auto; border: 1px solid #e6e8eb; border-bottom: none; border-radius: 4px 4px 0 0; background: #fff; }
.grid { width: 100%; border-collapse: separate; border-spacing: 0; min-width: 1280px; font-size: 12px; }

thead th { position: sticky; top: 0; background: #fafbfc; border-bottom: 1px solid #e6e8eb; color: #5b6774; font-weight: 600; height: 32px; padding: 0; }
.th-inner { display: flex; align-items: center; gap: 6px; padding: 0 6px 0 10px; height: 32px; white-space: nowrap; }
.th-inner.clickable { cursor: pointer; }

.col-check { width: 36px; text-align: center; }
.align-right { text-align: right; }

.sort { display: inline-flex; flex-direction: column; gap: 2px; }
.sort i { width: 0; height: 0; border-left: 4px solid transparent; border-right: 4px solid transparent; opacity: 0.35; }
.sort .asc { border-bottom: 5px solid #6b7785; margin-top: -1px; }
.sort .desc { border-top: 5px solid #6b7785; }
.sort i.active { opacity: 1; border-bottom-color: #2f343a; border-top-color: #2f343a; }

tbody td { border-bottom: 1px solid #eef0f2; padding: 6px 10px; height: 32px; vertical-align: middle; color: #2f343a; }
tbody tr:hover td { background: #f7f9fb; }
.ellipsis { max-width: 520px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: inline-block; }

.link { color: #1976d2; text-decoration: none; }
.link:hover { text-decoration: underline; }

.checkbox { display: inline-flex; align-items: center; justify-content: center; position: relative; width: 14px; height: 14px; }
.checkbox input { position: absolute; opacity: 0; width: 14px; height: 14px; margin: 0; }
.checkbox span { width: 14px; height: 14px; border: 1px solid #c7cbd1; border-radius: 2px; background: #fff; box-shadow: inset 0 0 0 2px #fff; }
.checkbox input:checked + span { background: #1a73e8; border-color: #1a73e8; box-shadow: inset 0 0 0 2px #1a73e8; }
.checkbox input:checked + span:after { content: ''; display: block; line-height: 14px; font-size: 12px; color: #fff; text-align: center; }

.status { display: inline-block; padding: 2px 6px; border-radius: 10px; font-size: 11px; line-height: 1; white-space: nowrap; }

.status-text { margin-left: 0 }

.table-footer { display: flex; align-items: center; justify-content: space-between; gap: 8px; border: 1px solid #e6e8eb; border-top: none; border-radius: 0 0 4px 4px; background: #fff; padding: 6px 8px; font-size: 12px; color: #5b6774; }
.icon-btn { border: 1px solid transparent; background: #fff; border-radius: 4px; padding: 2px 6px; font-size: 14px; cursor: pointer; }
.icon-btn:hover { background: #f3f4f6; }

tbody tr:nth-child(even) td { background: #fff; }

.filter-btn { margin-left: 2px; display: inline-flex; align-items: center; justify-content: center; width: 18px; height: 18px; border-radius: 4px; border: 1px solid transparent; background: transparent; cursor: pointer; }
.filter-btn:hover { background: #eef2f5; }
.funnel { width: 12px; height: 12px; fill: #6b7785; opacity: .55; }
.filter-btn.active .funnel { fill: #1976d2; opacity: 1; }

.filter-popover { position: fixed; z-index: 9999; width: 260px; background: #fff; border: 1px solid #e6e8eb; border-radius: 6px; box-shadow: 0 8px 24px rgba(0,0,0,.08); overflow: hidden; }
.filter-head { padding: 8px; border-bottom: 1px solid #f0f1f2; }
.filter-search { width: 100%; height: 28px; font-size: 12px; padding: 4px 8px; border: 1px solid #d6d9de; border-radius: 4px; outline: none; }
.filter-search:focus { border-color: #9eb9ff; box-shadow: 0 0 0 3px rgba(158,185,255,.35); }
.filter-select-all { display: flex; align-items: center; gap: 8px; padding: 8px; border-bottom: 1px solid #f0f1f2; font-size: 12px; color: #2f343a; }
.sel-all-label { user-select: none; }
.filter-list { max-height: 220px; overflow: auto; padding: 6px 8px; display: grid; gap: 6px; }
.option { display: grid; grid-auto-flow: column; grid-template-columns: 16px 1fr; align-items: center; gap: 8px; font-size: 12px; color: #2f343a; }
.option input[type="checkbox"] { width: 14px; height: 14px; }
.opt-label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.filter-actions { display: flex; align-items: center; gap: 8px; padding: 8px; border-top: 1px solid #f0f1f2; }
.filter-actions .spacer { flex: 1; }
.btn { padding: 6px 10px; font-size: 12px; border-radius: 4px; border: 1px solid #d0d5dd; background: #fff; cursor: pointer; }
.btn:hover { background: #f6f7f9; }
.btn.ghost { color: #6b7785; }
</style>
