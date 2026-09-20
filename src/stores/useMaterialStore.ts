import { computed } from 'vue'
import type { Material, RestockItem } from '../types'
import { useLocalStorage } from '../utils/storage'
import { uid } from '../utils/id'
import { toNumber } from '../utils/format'

// 模块级单例状态
const materials = useLocalStorage<Material[]>('diy.materials', [])
// 常用购买渠道：材料中填过的渠道自动收录，供其他材料复用
const suppliers = useLocalStorage<string[]>('diy.suppliers', [])

export function useMaterialStore() {
  function addMaterial(data: Omit<Material, 'id' | 'createdAt' | 'updatedAt'>): Material {
    const now = Date.now()
    const material: Material = { ...data, id: uid('mat_'), createdAt: now, updatedAt: now }
    materials.value.push(material)
    rememberSupplier(data.supplier)
    return material
  }

  function updateMaterial(id: string, patch: Partial<Omit<Material, 'id' | 'createdAt'>>) {
    const material = materials.value.find((m) => m.id === id)
    if (material) {
      Object.assign(material, patch, { updatedAt: Date.now() })
      rememberSupplier(patch.supplier)
    }
  }

  function removeMaterial(id: string) {
    materials.value = materials.value.filter((m) => m.id !== id)
  }

  function getMaterial(id: string): Material | undefined {
    return materials.value.find((m) => m.id === id)
  }

  /** 收录新渠道（非空、去重），供后续添加材料时直接选择 */
  function rememberSupplier(name?: string) {
    const trimmed = name?.trim()
    if (trimmed && !suppliers.value.includes(trimmed)) suppliers.value.push(trimmed)
  }

  /** 新增常用购买渠道 */
  function addSupplier(name: string) {
    rememberSupplier(name)
  }

  /**
   * 重命名渠道：同步更新常用渠道列表与所有使用该渠道的材料，
   * 保证改一次渠道，所有材料看到的都是新名字。
   */
  function renameSupplier(oldName: string, newName: string) {
    const target = newName.trim()
    if (!target || target === oldName) return
    const index = suppliers.value.indexOf(oldName)
    if (index === -1) return
    // 目标名称已存在则视为合并，避免列表重复
    if (suppliers.value.includes(target)) {
      suppliers.value.splice(index, 1)
    } else {
      suppliers.value[index] = target
    }
    materials.value.forEach((m) => {
      if (m.supplier === oldName) {
        m.supplier = target
        m.updatedAt = Date.now()
      }
    })
  }

  /** 删除常用渠道：仅从复用列表移除，材料上已记录的渠道保留 */
  function removeSupplier(name: string) {
    suppliers.value = suppliers.value.filter((s) => s !== name)
  }

  /** 库存预警：数量低于最低库存预警值的材料 */
  const lowStockMaterials = computed(() =>
    materials.value.filter((m) => toNumber(m.quantity) < toNumber(m.minStock)),
  )

  /** 补货清单：预警材料 + 建议补货量 + 购买渠道与参考单价 */
  const restockList = computed<RestockItem[]>(() =>
    lowStockMaterials.value.map((m) => ({
      id: m.id,
      name: m.name,
      category: m.category,
      unit: m.unit,
      quantity: toNumber(m.quantity),
      minStock: toNumber(m.minStock),
      restockQty: toNumber(m.minStock) - toNumber(m.quantity),
      location: m.location,
      supplier: m.supplier,
      unitPrice: m.unitPrice,
    })),
  )

  /** 补货预计花费：仅累加填写了有效参考单价的材料 */
  const restockEstimatedCost = computed(() =>
    restockList.value.reduce((sum, item) => {
      const price = toNumber(item.unitPrice)
      return price > 0 ? sum + price * item.restockQty : sum
    }, 0),
  )

  /** 补货清单中已记录购买渠道的材料数 */
  const restockWithSupplierCount = computed(
    () => restockList.value.filter((item) => item.supplier?.trim()).length,
  )

  /** 材料种类数 */
  const categoryCount = computed(() => materials.value.length)

  return {
    materials,
    suppliers,
    addMaterial,
    updateMaterial,
    removeMaterial,
    getMaterial,
    addSupplier,
    renameSupplier,
    removeSupplier,
    lowStockMaterials,
    restockList,
    restockEstimatedCost,
    restockWithSupplierCount,
    categoryCount,
  }
}
