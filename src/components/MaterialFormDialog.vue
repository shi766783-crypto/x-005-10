<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import type { Material, MaterialCategory } from '../types'
import { MATERIAL_CATEGORIES } from '../types'
import { useMaterialStore } from '../stores/useMaterialStore'
import { useChannelStore } from '../stores/useChannelStore'
import { toNumber } from '../utils/format'
import ChannelManagerDialog from './ChannelManagerDialog.vue'

const props = defineProps<{ modelValue: boolean; material: Material | null }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void; (e: 'saved'): void }>()

const store = useMaterialStore()
const channelStore = useChannelStore()
const formRef = ref<FormInstance>()
const channelDialogVisible = ref(false)

const emptyForm = {
  name: '',
  category: '木材' as MaterialCategory,
  quantity: 0,
  unit: '个',
  minStock: 0,
  location: '',
  channelId: '' as string,
  referencePrice: undefined as number | undefined,
}

const form = reactive({ ...emptyForm })

const rules: FormRules = {
  name: [{ required: true, message: '请输入材料名称', trigger: 'blur' }],
  unit: [{ required: true, message: '请输入单位', trigger: 'blur' }],
}

watch(
  () => props.modelValue,
  (visible) => {
    if (visible) {
      Object.assign(form, {
        ...emptyForm,
        ...props.material,
        channelId: props.material?.channelId ?? '',
        referencePrice: props.material?.referencePrice,
      })
    }
  },
)

async function submit() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }
  const payload = {
    ...form,
    quantity: toNumber(form.quantity),
    minStock: toNumber(form.minStock),
    // 空字符串的渠道、未填的单价归一化为 undefined，避免存脏值
    channelId: form.channelId || undefined,
    referencePrice:
      form.referencePrice === undefined || form.referencePrice === null
        ? undefined
        : toNumber(form.referencePrice),
  }
  if (props.material) store.updateMaterial(props.material.id, payload)
  else store.addMaterial(payload)
  ElMessage.success(props.material ? '材料已更新' : '材料已添加')
  emit('saved')
  emit('update:modelValue', false)
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    :title="material ? '编辑材料' : '添加材料'"
    width="520px"
    @update:model-value="(v: boolean) => emit('update:modelValue', v)"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
      <el-form-item label="名称" prop="name">
        <el-input v-model="form.name" placeholder="如：松木板" />
      </el-form-item>
      <el-form-item label="类别" prop="category">
        <el-select v-model="form.category" style="width: 100%">
          <el-option v-for="c in MATERIAL_CATEGORIES" :key="c" :label="c" :value="c" />
        </el-select>
      </el-form-item>
      <el-form-item label="数量">
        <el-input-number v-model="form.quantity" :min="0" />
      </el-form-item>
      <el-form-item label="单位" prop="unit">
        <el-input v-model="form.unit" placeholder="如：块 / 米 / 个" />
      </el-form-item>
      <el-form-item label="最低库存">
        <el-input-number v-model="form.minStock" :min="0" />
        <span class="muted" style="margin-left: 8px">低于该值触发预警</span>
      </el-form-item>
      <el-form-item label="存放位置">
        <el-input v-model="form.location" placeholder="如：储物间 A 区" />
      </el-form-item>
      <el-form-item label="购买渠道">
        <el-select
          v-model="form.channelId"
          placeholder="选择常用购买渠道（可空）"
          clearable
          filterable
          style="width: calc(100% - 92px)"
        >
          <el-option
            v-for="c in channelStore.channels.value"
            :key="c.id"
            :label="c.name"
            :value="c.id"
          />
          <template #empty>
            <div style="padding: 4px 0; color: var(--text-secondary)">还没有可用渠道</div>
          </template>
        </el-select>
        <el-button style="margin-left: 8px" @click="channelDialogVisible = true">管理渠道</el-button>
      </el-form-item>
      <el-form-item label="参考单价">
        <el-input-number v-model="form.referencePrice" :min="0" :precision="2" :step="1" />
        <span class="muted" style="margin-left: 8px">
          元 / {{ form.unit || '单位' }}，补货时估算花费
        </span>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="emit('update:modelValue', false)">取消</el-button>
      <el-button type="primary" @click="submit">保存</el-button>
    </template>

    <ChannelManagerDialog v-model="channelDialogVisible" />
  </el-dialog>
</template>
