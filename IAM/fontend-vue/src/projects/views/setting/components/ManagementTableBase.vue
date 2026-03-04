<template>
  <CCard class="bg-style2 setting-table-card">
    <CCardBody>
      <div class="setting-table-card__header">
        <div class="setting-table-card__title d-flex align-items-center">
          <CIcon :name="icon" class="mr-2 setting-table-card__icon" />
          <span>{{ title }}</span>
        </div>
        <CButton size="sm" :color="addColor" class="setting-add-btn" variant="outline" @click="$emit('add')">
          <CIcon name="cil-plus"  v-c-tooltip="{ content: 'ADD', placement: 'top' }"/>
        </CButton>
      </div>

      <CDataTable
        :items="items"
        :fields="fields"
        table-filter
        sorter
        :items-per-page-select="enableItemsPerPageSelect"
        striped
        hover
        :items-per-page="itemsPerPage"
        :pagination="{ doubleArrows: false, align: 'end' }"
      >
        <template #state="scope">
          <slot name="state" v-bind="scope" />
        </template>

        <template #statusText="scope">
          <slot name="statusText" v-bind="scope" />
        </template>

        <template #actions="{ item }">
          <slot name="actions" :item="item">
            <td class="text-center">
              <CButton size="sm" color="info" variant="outline" class="mr-1 setting-action-btn" v-c-tooltip="{ content: 'Edit', placement: 'top' }" @click="$emit('edit', item)">
                <CIcon name="cil-pencil" />
              </CButton>
              <CButton size="sm" color="danger" variant="outline" class="setting-remove-btn" v-c-tooltip="{ content: 'Remove', placement: 'top' }" @click="$emit('remove', item)">
                <CIcon name="cil-trash" />
              </CButton>
            </td>
          </slot>
        </template>

        <template #empty>
          <div class="text-center text-muted py-4">{{ emptyMessage }}</div>
        </template>
      </CDataTable>
    </CCardBody>
  </CCard>
</template>

<script>
export default {
  name: 'ManagementTableBase',
  props: {
    title: { type: String, default: '' },
    icon: { type: String, default: 'cil-list' },
    addColor: { type: String, default: 'success' },
    addLabel: { type: String, default: 'Add' },
    emptyMessage: { type: String, default: 'No data found' },
    itemsPerPage: { type: Number, default: 10 },
    enableItemsPerPageSelect: { type: Boolean, default: true },
    items: { type: Array, default: () => [] },
    fields: { type: Array, default: () => [] }
  }
}
</script>

<style scoped lang="scss">
@import "./setting-page.shared";

.setting-table-card {
  animation: setting-fade-up 0.65s ease-out both;
  overflow: hidden;
  border: 1px solid rgba(223, 230, 238, 0.78);
  border-radius: 1.5rem;
  box-shadow: 0 14px 30px rgba(44, 52, 71, 0.06);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(249, 250, 252, 0.98));
}

.setting-table-card__header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
  padding-bottom: 0.85rem;
  border-bottom: 1px solid rgba(221, 228, 236, 0.85);
}

.setting-table-card__title {
  font-size: 1rem;
  font-weight: 700;
  color: #233247;
}

.setting-table-card__icon {
  color: #8c1515;
}

.setting-add-btn {
  border-radius: 999px;
  font-weight: 700;
  font-size: 0.78rem;
}

.setting-action-btn,
.setting-remove-btn {
  width: 2rem;
  height: 2rem;
  padding: 0;
  border-radius: 999px;
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.setting-action-btn:hover,
.setting-action-btn:focus {
  box-shadow: 0 10px 18px rgba(57, 175, 209, 0.22);
  transform: translateY(-1px);
}

.setting-remove-btn:hover,
.setting-remove-btn:focus {
  box-shadow: 0 10px 18px rgba(229, 83, 83, 0.22);
  transform: translateY(-1px);
}

.setting-table-card :deep(.table-responsive) {
  margin-bottom: 0;
}

.setting-table-card :deep(.form-inline) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin: 0 0 1rem;
  color: #5f6f86;
  font-size: 0.84rem;
  font-weight: 600;
}

.setting-table-card :deep(.form-inline label) {
  margin: 0;
  color: #5f6f86;
  font-size: 0.84rem;
  font-weight: 700;
}

.setting-table-card :deep(.form-inline .form-control) {
  min-width: 280px;
  width: min(100%, 420px);
  height: 40px;
  border: 1px solid #dde4ec;
  border-radius: 1rem;
  background: linear-gradient(180deg, #ffffff, #fbfcfe);
  color: #243447;
  box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.55);
  padding: 0.6rem 0.9rem;
}

.setting-table-card :deep(table) {
  margin-bottom: 0;
}

.setting-table-card :deep(thead th) {
  border-top: 0;
  border-bottom: 1px solid #e6ebf1;
  color: #41536d;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  background: #fbfcfe;
  vertical-align: middle;
}

.setting-table-card :deep(tbody td) {
  border-top: 1px solid #eef2f6;
  vertical-align: middle;
  padding-top: 0.74rem;
  padding-bottom: 0.74rem;
  background: #fff;
}

.setting-table-card :deep(tbody tr:hover td) {
  background: #fcfdff;
}

.setting-table-card :deep(.pagination) {
  margin-top: 1rem;
  margin-bottom: 0;
}

.setting-table-card :deep(.page-link) {
  border-radius: 0.75rem;
  border-color: #d9e1ea;
  color: #4a5d78;
  margin: 0 0.15rem;
  box-shadow: none;
}

.setting-table-card :deep(.page-item.active .page-link) {
  background: #8c1515;
  border-color: #8c1515;
  color: #fff;
}

@media (max-width: 767.98px) {
  .setting-table-card :deep(.form-inline) {
    align-items: stretch;
    flex-direction: column;
    justify-content: flex-start;
  }

  .setting-table-card :deep(.form-inline .form-control) {
    min-width: 100%;
    width: 100%;
  }
}
</style>
