import { computed } from 'vue'
import type { Material } from '../types'
import { useLocalStorage } from '../utils/storage'
import { uid } from '../utils/id'
import { toNumber } from '../utils/format'
import { useChannelStore } from './useChannelStore'

// 模块级单例状态
const materials = useLocalStorage<Material[]>('diy.materials', [])

/** 补货清单条目：在材料基础上附带渠道与价格信息，补货时一眼看到去哪买、多少钱 */
export interface RestockItem {
  material: Material
  /** 建议补货量：补到最低预警值 */
  restockQty: number
  channelId?: string
  channelName: string
  referencePrice?: number
  /** 参考花费 = 建议补货量 × 参考单价（无单价时为空） */
  estimatedCost?: number
}

export function useMaterialStore() {
  const channelStore = useChannelStore()

  function addMaterial(data: Omit<Material, 'id' | 'createdAt' | 'updatedAt'>): Material {
    const now = Date.now()
    const material: Material = { ...data, id: uid('mat_'), createdAt: now, updatedAt: now }
    materials.value.push(material)
    return material
  }

  function updateMaterial(id: string, patch: Partial<Omit<Material, 'id' | 'createdAt'>>) {
    const material = materials.value.find((m) => m.id === id)
    if (material) Object.assign(material, patch, { updatedAt: Date.now() })
  }

  function removeMaterial(id: string) {
    materials.value = materials.value.filter((m) => m.id !== id)
  }

  function getMaterial(id: string): Material | undefined {
    return materials.value.find((m) => m.id === id)
  }

  /** 库存预警：数量低于最低库存预警值的材料 */
  const lowStockMaterials = computed(() =>
    materials.value.filter((m) => toNumber(m.quantity) < toNumber(m.minStock)),
  )

  /**
   * 补货清单：预警材料 + 常用渠道 + 参考单价 + 建议补货量与参考花费。
   * 补货时直接看到每样东西去哪买、大概多少钱，无需再重新打听。
   */
  const restockList = computed<RestockItem[]>(() =>
    lowStockMaterials.value.map((material) => {
      const restockQty = Math.max(0, toNumber(material.minStock) - toNumber(material.quantity))
      const referencePrice =
        material.referencePrice === undefined || material.referencePrice === null
          ? undefined
          : toNumber(material.referencePrice)
      return {
        material,
        restockQty,
        channelId: material.channelId,
        channelName: channelStore.channelName(material.channelId),
        referencePrice,
        estimatedCost: referencePrice === undefined ? undefined : restockQty * referencePrice,
      }
    }),
  )

  /** 材料种类数 */
  const categoryCount = computed(() => materials.value.length)

  return {
    materials,
    addMaterial,
    updateMaterial,
    removeMaterial,
    getMaterial,
    lowStockMaterials,
    restockList,
    categoryCount,
  }
}
