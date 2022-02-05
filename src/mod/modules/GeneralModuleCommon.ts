import { Command, GlobalVariable } from "../../types"

export interface GeneralModuleSettings {
  volume: number
}

export interface GeneralModuleAdminSettings {
  showImages: boolean
}

export const default_settings = (): GeneralModuleSettings => ({
  volume: 100,
})

export const default_admin_settings = (): GeneralModuleAdminSettings => ({
  showImages: true,
})

export interface GeneralModuleWsEventData {
  commands: Command[]
  settings: GeneralModuleSettings
  adminSettings: GeneralModuleAdminSettings
  globalVariables: GlobalVariable[]
}

export interface GeneralSaveEventData {
  event: "save";
  commands: Command[];
  settings: GeneralModuleSettings;
  adminSettings: GeneralModuleAdminSettings;
}
