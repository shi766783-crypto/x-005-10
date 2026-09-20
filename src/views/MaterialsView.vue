<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { Material } from '../types'
import { MATERIAL_CATEGORIES } from '../types'
import { useMaterialStore } from '../stores/useMaterialStore'
import { formatPrice, formatAmount } from '../utils/format'
import MaterialFormDialog from '../components/MaterialFormDialog.vue'
import SupplierManageDialog from '../components/SupplierManageDialog.vue'

const materialStore = useMaterialStore()

const dialogVisible = ref(false)
const supplierDialogVisible = ref(false)
const editingMaterial = ref<Material | null>(null)

const filterCategory = ref('')
const keyword = ref('')
const onlyLowStock = ref(false)

const filtered = computed(() =>
  materialStore.materials.value.filter((m) => {
    const matchCategory = !filterCategory.value || m.category === filterCategory.value
    const matchKeyword = !keyword.value || m.name.includes(keyword.value)
    const matchLowStock = !onlyLowStock.value || m.quantity < m.minStock
    return matchCategory && matchKeyword && matchLowStock
  }),
)

function openAdd() {
  editingMaterial.value = null
  dialogVisible.value = true
}
function openEdit(material: Material) {
  editingMaterial.value = material
  dialogVisible.value = true
}
async function remove(material: Material) {
  await ElMessageBox.confirm(`确定删除材料「${material.name}」吗？`, '提示', { type: 'warning' })
  materialStore.removeMaterial(material.id)
  ElMessage.success('已删除')
}
</script>

<template>
  <div class="page">
    <div class="page-header">
      <h2 class="page-title">材料库存</h2>
      <div>
        <el-button @click="supplierDialogVisible = true">
          <el-icon><Shop /></el-icon>&nbsp;常用渠道
        </el-button>
        <el-button type="primary" @click="openAdd">
          <el-icon><Plus /></el-icon>&nbsp;添加材料
        </el-button>
      </div>
    </div>

    <section class="card" style="margin-bottom: 16px">
      <div class="section-head">
        <span class="section-title">补货清单（库存预警）</span>
        <div>
          <template v-if="materialStore.restockList.value.length">
            <el-tag type="warning">
              {{ materialStore.restockList.value.length }} 种材料待补货
            </el-tag>
            <el-tag type="info" class="cost-tag">
              {{ materialStore.restockWithSupplierCount.value }} 种已记录渠道
            </el-tag>
            <el-tag type="success" class="cost-tag">
              预计花费 {{ formatAmount(materialStore.restockEstimatedCost.value) }}
            </el-tag>
          </template>
          <el-tag v-else type="success">库存健康</el-tag>
        </div>
      </div>
      <el-table v-if="materialStore.restockList.value.length" :data="materialStore.restockList.value" size="small" border>
        <el-table-column prop="name" label="材料" min-width="110" />
        <el-table-column prop="category" label="类别" width="90" />
        <el-table-column label="当前库存" width="100" align="center">
          <template #default="{ row }">
            <span class="gap-missing">{{ row.quantity }} {{ row.unit }}</span>
          </template>
        </el-table-column>
        <el-table-column label="需补货" width="100" align="center">
          <template #default="{ row }">
            <el-tag type="danger" size="small">{{ row.restockQty }} {{ row.unit }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="购买渠道" min-width="130">
          <template #default="{ row }">
            <span v-if="row.supplier">{{ row.supplier }}</span>
            <el-tooltip v-else content="编辑该材料补充常用购买渠道" placement="top">
              <el-button size="small" link type="primary" @click="openEdit(row)">补录渠道</el-button>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="参考单价" width="100" align="center">
          <template #default="{ row }">
            <span v-if="row.unitPrice">{{ formatPrice(row.unitPrice) }}/{{ row.unit }}</span>
            <span v-else class="muted">—</span>
          </template>
        </el-table-column>
        <el-table-column label="预估花费" width="100" align="center">
          <template #default="{ row }">
            <span v-if="row.unitPrice">{{ formatAmount(row.restockQty * row.unitPrice) }}</span>
            <span v-else class="muted">—</span>
          </template>
        </el-table-column>
        <el-table-column prop="location" label="存放位置" min-width="100" />
        <el-table-column label="操作" width="80" align="center">
          <template #default="{ row }">
            <el-button size="small" @click="openEdit(row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-else description="暂无预警材料" :image-size="60" />
    </section>

    <div class="card filter-bar">
      <el-input v-model="keyword" placeholder="搜索材料名称" clearable style="width: 200px" />
      <el-select v-model="filterCategory" placeholder="全部类别" clearable style="width: 150px">
        <el-option v-for="c in MATERIAL_CATEGORIES" :key="c" :label="c" :value="c" />
      </el-select>
      <el-checkbox v-model="onlyLowStock">仅看预警</el-checkbox>
      <span class="muted">共 {{ materialStore.categoryCount.value }} 种材料</span>
    </div>

    <div class="card">
      <el-table :data="filtered" border>
        <el-table-column prop="name" label="名称" min-width="120" />
        <el-table-column prop="category" label="类别" width="90" />
        <el-table-column label="数量" width="100" align="center">
          <template #default="{ row }">
            <span :style="{ color: row.quantity < row.minStock ? 'var(--danger)' : 'inherit', fontWeight: row.quantity < row.minStock ? 600 : 400 }">
              {{ row.quantity }} {{ row.unit }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="最低预警值" width="100" align="center">
          <template #default="{ row }">{{ row.minStock }} {{ row.unit }}</template>
        </el-table-column>
        <el-table-column label="购买渠道" min-width="130">
          <template #default="{ row }">
            <span v-if="row.supplier">{{ row.supplier }}</span>
            <span v-else class="muted">未记录</span>
          </template>
        </el-table-column>
        <el-table-column label="参考单价" width="110" align="center">
          <template #default="{ row }">
            <span v-if="row.unitPrice">{{ formatPrice(row.unitPrice) }}/{{ row.unit }}</span>
            <span v-else class="muted">—</span>
          </template>
        </el-table-column>
        <el-table-column prop="location" label="存放位置" min-width="110" />
        <el-table-column label="操作" width="140" align="center">
          <template #default="{ row }">
            <el-button size="small" @click="openEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" text @click="remove(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <MaterialFormDialog v-model="dialogVisible" :material="editingMaterial" />
    <SupplierManageDialog v-model="supplierDialogVisible" />
  </div>
</template>

<style scoped>
.filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 8px;
}
.section-title {
  font-weight: 600;
  font-size: 15px;
}
.cost-tag {
  margin-left: 8px;
}
</style>
