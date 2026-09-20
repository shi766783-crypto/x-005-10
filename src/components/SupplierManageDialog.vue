<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useMaterialStore } from '../stores/useMaterialStore'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void }>()

const store = useMaterialStore()
const newName = ref('')

/** 每个渠道被多少种材料使用，帮助判断改名/删除的影响范围 */
const usageCount = computed(() => {
  const map = new Map<string, number>()
  store.materials.value.forEach((m) => {
    const s = m.supplier?.trim()
    if (s) map.set(s, (map.get(s) ?? 0) + 1)
  })
  return map
})

function add() {
  const name = newName.value.trim()
  if (!name) return
  if (store.suppliers.value.includes(name)) {
    ElMessage.warning('该渠道已在列表中')
    return
  }
  store.addSupplier(name)
  newName.value = ''
  ElMessage.success('已添加渠道')
}

async function rename(oldName: string) {
  const { value } = await ElMessageBox.prompt('修改渠道名称', '重命名渠道', {
    confirmButtonText: '保存',
    cancelButtonText: '取消',
    inputValue: oldName,
    inputPlaceholder: '输入新的渠道名称',
  })
  const next = value.trim()
  if (!next || next === oldName) return
  store.renameSupplier(oldName, next)
  ElMessage.success('渠道已更新，所有使用该渠道的材料已同步')
}

async function remove(name: string) {
  const used = usageCount.value.get(name) ?? 0
  const tip = used
    ? `「${name}」正被 ${used} 种材料使用。移除后将不能再从常用列表中选择，但这些材料上已记录的渠道不受影响，确定移除？`
    : `确定从常用列表移除「${name}」吗？`
  await ElMessageBox.confirm(tip, '移除渠道', { type: 'warning' })
  store.removeSupplier(name)
  ElMessage.success('已移除')
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    title="常用购买渠道"
    width="460px"
    @update:model-value="(v: boolean) => emit('update:modelValue', v)"
  >
    <div class="add-row">
      <el-input
        v-model="newName"
        placeholder="如：家附近五金店 / 京东自营"
        clearable
        @keyup.enter="add"
      />
      <el-button type="primary" @click="add">添加</el-button>
    </div>

    <el-table :data="store.suppliers.value" size="small" border max-height="320">
      <el-table-column label="渠道名称" min-width="160">
        <template #default="{ row }">
          {{ row }}
          <el-tag v-if="usageCount.get(row)" size="small" type="info" class="usage-tag">
            {{ usageCount.get(row) }} 种材料在用
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="130" align="center">
        <template #default="{ row }">
          <el-button size="small" @click="rename(row)">改名</el-button>
          <el-button size="small" type="danger" text @click="remove(row)">移除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-empty v-if="!store.suppliers.value.length" description="还没有常用渠道，先添加一个吧" :image-size="60" />

    <p class="muted tip">在材料表单里输入的新渠道会自动收录到这里；改名会同步更新所有关联材料。</p>

    <template #footer>
      <el-button type="primary" @click="emit('update:modelValue', false)">完成</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.add-row {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
.usage-tag {
  margin-left: 8px;
}
.tip {
  margin: 12px 0 0;
  font-size: 12px;
  line-height: 1.6;
}
</style>
