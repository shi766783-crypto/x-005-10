import { computed } from 'vue'
import type { PurchaseChannel } from '../types'
import { useLocalStorage } from '../utils/storage'
import { uid } from '../utils/id'

// 模块级单例状态
const channels = useLocalStorage<PurchaseChannel[]>('diy.channels', [])

export function useChannelStore() {
  function addChannel(data: Omit<PurchaseChannel, 'id' | 'createdAt' | 'updatedAt'>): PurchaseChannel {
    const now = Date.now()
    const channel: PurchaseChannel = { ...data, id: uid('chn_'), createdAt: now, updatedAt: now }
    channels.value.push(channel)
    return channel
  }

  function updateChannel(id: string, patch: Partial<Omit<PurchaseChannel, 'id' | 'createdAt'>>) {
    const channel = channels.value.find((c) => c.id === id)
    if (channel) Object.assign(channel, patch, { updatedAt: Date.now() })
  }

  function removeChannel(id: string) {
    channels.value = channels.value.filter((c) => c.id !== id)
  }

  function getChannel(id?: string): PurchaseChannel | undefined {
    if (!id) return undefined
    return channels.value.find((c) => c.id === id)
  }

  /** 渠道名称：找不到（已删除）时回退占位，避免页面出现空白 */
  function channelName(id?: string): string {
    return getChannel(id)?.name ?? '未设置渠道'
  }

  const channelCount = computed(() => channels.value.length)

  return {
    channels,
    addChannel,
    updateChannel,
    removeChannel,
    getChannel,
    channelName,
    channelCount,
  }
}
