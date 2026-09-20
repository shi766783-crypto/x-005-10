<script setup lang="ts">
import { reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import type { PurchaseChannel } from '../types'
import { useChannelStore } from '../stores/useChannelStore'
import { useMaterialStore } from '../stores/useMaterialStore'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void }>()

const channelStore = useChannelStore()
const materialStore = useMaterialStore()
const formRef = ref<FormInstance>()

const editingId = ref<string | null>(null)

const emptyForm = { name: '', contact: '', address: '' }
const form = reactive({ ...emptyForm })

const rules: FormRules = {
  name: [{ required: true, message: '请输入渠道名称', trigger: 'blur' }],
}

function resetForm() {
  editingId.value = null
  Object.assign(form, emptyForm)
  formRef.value?.clearValidate()
}

function startAdd() {
  resetForm()
}

function startEdit(channel: PurchaseChannel) {
  editingId.value = channel.id
  Object.assign(form, { name: channel.name, contact: channel.contact, address: channel.address })
  formRef.value?.clearValidate()
}

async function submit() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }
  if (editingId.value) {
    channelStore.updateChannel(editingId.value, { ...form })
    ElMessage.success('渠道已更新')
  } else {
    channelStore.addChannel({ ...form })
    ElMessage.success('渠道已添加')
  }
  resetForm()
}

async function remove(channel: PurchaseChannel) {
  // 统计引用该渠道的材料，删除后这些材料会变为「未设置渠道」
  const usedCount = materialStore.materials.value.filter((m) => m.channelId === channel.id).length
  const tip = usedCount
    ? `有 ${usedCount} 种材料正在使用该渠道，删除后这些材料需重新选择渠道。`
    : ''
  await ElMessageBox.confirm(`确定删除渠道「${channel.name}」吗？${tip}`, '提示', {
    type: 'warning',
  })
  channelStore.removeChannel(channel.id)
  if (editingId.value === channel.id) resetForm()
  ElMessage.success('已删除')
}

/** 渠道被多少种材料使用 */
function usedCount(channelId: string): number {
  return materialStore.materials.value.filter((m) => m.channelId === channelId).length
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    title="管理购买渠道"
    width="640px"
    @update:model-value="(v: boolean) => emit('update:modelValue', v)"
    @open="resetForm"
  >
    <el-alert
      type="info"
      :closable="false"
      show-icon
      title="渠道集中维护、可被多种材料复用；在这里改名或更新联系方式，所有引用它的材料自动同步。"
      class="hint"
    />

    <el-table :data="channelStore.channels.value" size="small" border class="channel-table">
      <el-table-column prop="name" label="渠道名称" min-width="130" />
      <el-table-column prop="contact" label="联系方式" min-width="130">
        <template #default="{ row }">{{ row.contact || '—' }}</template>
      </el-table-column>
      <el-table-column prop="address" label="地址 / 备注" min-width="140">
        <template #default="{ row }">{{ row.address || '—' }}</template>
      </el-table-column>
      <el-table-column label="使用中" width="80" align="center">
        <template #default="{ row }">
          <el-tag size="small" type="info">{{ usedCount(row.id) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120" align="center">
        <template #default="{ row }">
          <el-button size="small" @click="startEdit(row)">编辑</el-button>
          <el-button size="small" type="danger" text @click="remove(row)">删除</el-button>
        </template>
      </el-table-column>
      <template #empty>暂无渠道，先在下方添加一个常用购买渠道</template>
    </el-table>

    <el-divider content-position="left">
      {{ editingId ? '编辑渠道' : '添加渠道' }}
    </el-divider>

    <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
      <el-form-item label="渠道名称" prop="name">
        <el-input v-model="form.name" placeholder="如：家附近五金店 / 淘宝 XX 旗舰店" />
      </el-form-item>
      <el-form-item label="联系方式">
        <el-input v-model="form.contact" placeholder="如：电话 / 旺旺 / 微信（可空）" />
      </el-form-item>
      <el-form-item label="地址 / 备注">
        <el-input v-model="form.address" placeholder="如：XX 路 12 号 / 店铺链接（可空）" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="submit">
          {{ editingId ? '保存修改' : '添加渠道' }}
        </el-button>
        <el-button v-if="editingId" @click="startAdd">取消编辑</el-button>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="emit('update:modelValue', false)">完成</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.hint {
  margin-bottom: 12px;
}
.channel-table {
  margin-bottom: 8px;
}
</style>
