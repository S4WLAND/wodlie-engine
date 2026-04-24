import { create } from 'zustand'

interface TemplateState {
  selectedId: string | null
  setSelectedId: (id: string | null) => void
}

export const useTemplateStore = create<TemplateState>()((set) => ({
  selectedId: null,
  setSelectedId: (id) => set({ selectedId: id }),
}))
