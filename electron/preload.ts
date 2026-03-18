import { contextBridge, ipcRenderer } from 'electron'

const api = {
  settings: {
    load: () => ipcRenderer.invoke('settings:load'),
    save: (s: object) => ipcRenderer.invoke('settings:save', s),
    resourcePath: () => ipcRenderer.invoke('settings:resourcePath')
  },
  pob: {
    loadBuild: (code: string) => ipcRenderer.invoke('pob:loadBuild', code),
    runSensitivity: (req: object) => ipcRenderer.invoke('pob:runSensitivity', req),
    calcWith: (params: object) => ipcRenderer.invoke('pob:calcWith', params),
    batchCalc: (jobs: object[]) => ipcRenderer.invoke('pob:batchCalc', jobs),
    parallelBatchCalc: (jobs: object[]) => ipcRenderer.invoke('pob:parallelBatchCalc', jobs),
    getSpecList: () => ipcRenderer.invoke('pob:getSpecList'),
    setActiveSpec: (index: number) => ipcRenderer.invoke('pob:setActiveSpec', index),
    getSkillSetList: () => ipcRenderer.invoke('pob:getSkillSetList'),
    setActiveSkillSet: (index: number) => ipcRenderer.invoke('pob:setActiveSkillSet', index),
    getItemSetList: () => ipcRenderer.invoke('pob:getItemSetList'),
    setActiveItemSet: (id: number) => ipcRenderer.invoke('pob:setActiveItemSet', id),
    getDangerAnalysis: () => ipcRenderer.invoke('pob:getDangerAnalysis'),
    getSynergies: () => ipcRenderer.invoke('pob:getSynergies'),
    getDamageBreakdown: () => ipcRenderer.invoke('pob:getDamageBreakdown'),
    reloadBuildData: () => ipcRenderer.invoke('pob:reloadBuildData'),
    getTooltip: (params: object) => ipcRenderer.invoke('pob:getTooltip', params),
    getAssetPath: (subpath: string) => ipcRenderer.invoke('pob:getAssetPath', subpath),
    getMainProcessLog: () => ipcRenderer.invoke('pob:getMainProcessLog'),
  }
}

contextBridge.exposeInMainWorld('api', api)

export type PobAPI = typeof api
