import fn, { extractEmotes, getChannelPointsCustomRewards } from '../../fn'
import { logger, nonce, parseHumanDuration, SECOND } from '../../common/fn'
import { commands as commonCommands, newCommandTrigger, newJsonDate } from '../../common/commands'
import { Socket } from '../../net/WebSocketServer'
import { User } from '../../repo/Users'
import {
  ChatMessageContext,
  Command,
  FunctionCommand,
  Bot,
  Module,
  RandomTextCommand,
  CommandTriggerType,
  CommandAction,
  MODULE_NAME,
  WIDGET_TYPE,
  CommandEffectType,
  CommandEffect,
} from '../../types'
import {
  default_admin_settings,
  default_settings,
  GeneralModuleAdminSettings,
  GeneralModuleEmotesEventData,
  GeneralModuleSettings,
  GeneralModuleWsEventData,
  GeneralSaveEventData,
} from './GeneralModuleCommon'
import { NextFunction, Response } from 'express'
import legacy from '../../common/legacy'

const log = logger('GeneralModule.ts')

interface GeneralModuleData {
  commands: Command[]
  settings: GeneralModuleSettings
  adminSettings: GeneralModuleAdminSettings
}

interface GeneralModuleTimer {
  lines: number
  minLines: number
  minInterval: number
  command: FunctionCommand
  next: number
}

interface GeneralModuleInitData {
  data: GeneralModuleData
  commands: FunctionCommand[]
  redemptions: FunctionCommand[]
  timers: GeneralModuleTimer[]
  shouldSave: boolean
}

interface WsData {
  event: string
  data: GeneralModuleWsEventData
}

const noop = () => { return }

class GeneralModule implements Module {
  public name = MODULE_NAME.GENERAL

  // @ts-ignore
  private data: GeneralModuleData
  // @ts-ignore
  private commands: FunctionCommand[]
  // @ts-ignore
  private timers: GeneralModuleTimer[]

  private interval: NodeJS.Timer | null = null

  private channelPointsCustomRewards: Record<string, string[]> = {}

  constructor(
    public readonly bot: Bot,
    public user: User,
  ) {
    // @ts-ignore
    return (async () => {
      const initData = await this.reinit()
      this.data = initData.data
      this.commands = initData.commands
      this.timers = initData.timers
      if (initData.shouldSave) {
        await this.bot.getRepos().module.save(this.user.id, this.name, this.data)
      }
      this.inittimers()
      return this;
    })();
  }

  getCurrentMediaVolume() {
    return this.data.settings.volume
  }

  async userChanged(user: User) {
    this.user = user
  }

  inittimers() {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }

    // TODO: handle timeouts. commands executed via timer
    // are not added to command_execution database and also the
    // timeouts are not checked
    this.interval = setInterval(() => {
      const date = new Date()
      const now = date.getTime()
      this.timers.forEach(async (t) => {
        if (t.lines >= t.minLines && now > t.next) {
          const cmdDef = t.command
          const rawCmd = null
          const target = null
          const context = null
          await fn.applyEffects(cmdDef, this, rawCmd, context)
          await cmdDef.fn({ rawCmd, target, context, date })
          t.lines = 0
          t.next = now + t.minInterval
        }
      })
    }, 1 * SECOND)
  }

  fix(commands: any[]): { commands: Command[], shouldSave: boolean } {
    let shouldSave = false
    const fixedCommands = (commands || []).map((cmd: any) => {
      if (cmd.command) {
        cmd.triggers = [newCommandTrigger(cmd.command, cmd.commandExact || false)]
        delete cmd.command
      }
      cmd.variables = cmd.variables || []
      cmd.effects = cmd.effects || []

      if (typeof cmd.cooldown !== 'object') {
        cmd.cooldown = cmd.timeout || { global: '0', perUser: '0' }
      }
      if (cmd.timeout) {
        delete cmd.timeout
      }

      if (typeof cmd.disallow_users === 'undefined') {
        cmd.disallow_users = []
        shouldSave = true
      }
      if (typeof cmd.allow_users === 'undefined') {
        cmd.allow_users = []
        shouldSave = true
      }
      if (typeof cmd.enabled === 'undefined') {
        cmd.enabled = true
        shouldSave = true
      }

      if (cmd.variableChanges) {
        for (const variableChange of cmd.variableChanges) {
          cmd.effects.push(legacy.variableChangeToCommandEffect(variableChange))
        }
      }

      if (cmd.action === 'text' && !cmd.effects.find((effect: CommandEffect) => effect.type !== CommandEffectType.VARIABLE_CHANGE)) {
        cmd.effects.push(legacy.textToCommandEffect(cmd))
      }

      if (cmd.action === 'dict_lookup') {
        cmd.action = 'text'
        cmd.effects.push(legacy.dictLookupToCommandEffect(cmd))
      }

      if (cmd.action === 'emotes') {
        cmd.action = 'text'
        cmd.effects.push(legacy.emotesToCommandEffect(cmd))
      }

      if (cmd.action === 'media') {
        cmd.action = 'text'
        cmd.effects.push(legacy.mediaToCommandEffect(cmd))
      }

      if (cmd.action === 'madochan_createword') {
        cmd.action = 'text'
        cmd.effects.push(legacy.madochanToCommandEffect(cmd))
      }

      if (cmd.action === 'set_channel_title') {
        cmd.action = 'text'
        cmd.effects.push(legacy.setChannelTitleToCommandEffect(cmd))
      }

      if (cmd.action === 'set_channel_game_id') {
        cmd.action = 'text'
        cmd.effects.push(legacy.setChannelGameIdToCommandEffect(cmd))
      }

      if (cmd.action === 'add_stream_tags') {
        cmd.action = 'text'
        cmd.effects.push(legacy.addStreamTagsToCommandEffect(cmd))
      }

      if (cmd.action === 'remove_stream_tags') {
        cmd.action = 'text'
        cmd.effects.push(legacy.removeStreamTagsToCommandEffect(cmd))
      }

      if (cmd.action === 'chatters') {
        cmd.action = 'text'
        cmd.effects.push(legacy.chattersToCommandEffect(cmd))
      }

      if (cmd.action === 'countdown') {
        cmd.action = 'text'
        cmd.effects.push(legacy.countdownToCommandEffect(cmd))
      }

      if (cmd.action === 'media_volume') {
        cmd.action = 'text'
        cmd.effects.push(legacy.mediaVolumeToCommandEffect(cmd))
      }

      if (typeof cmd.restrict === 'undefined') {
        if (cmd.restrict_to.length === 0) {
          cmd.restrict = { active: false, to: [] }
        } else {
          cmd.restrict = { active: true, to: cmd.restrict_to }
        }
        shouldSave = true
      }

      cmd.triggers = (cmd.triggers || []).map((trigger: any) => {
        trigger.data.minLines = parseInt(trigger.data.minLines, 10) || 0
        if (trigger.data.minSeconds) {
          trigger.data.minInterval = trigger.data.minSeconds * SECOND
        }
        return trigger
      })
      return cmd
    })

    // add ids to commands that dont have one yet
    for (const command of fixedCommands) {
      if (!command.id) {
        command.id = nonce(10)
        shouldSave = true
      }
      if (!command.createdAt) {
        command.createdAt = newJsonDate()
        shouldSave = true
      }
      if (command.variableChanges) {
        delete command.variableChanges
        shouldSave = true
      }
    }
    return {
      commands: fixedCommands,
      shouldSave,
    }
  }

  async reinit(): Promise<GeneralModuleInitData> {
    const data = await this.bot.getRepos().module.load(this.user.id, this.name, {
      commands: [],
      settings: default_settings(),
      adminSettings: default_admin_settings(),
    })
    data.settings = default_settings(data.settings)
    const fixed = this.fix(data.commands)
    data.commands = fixed.commands

    if (!data.adminSettings) {
      data.adminSettings = {}
    }
    if (typeof data.adminSettings.showImages === 'undefined') {
      data.adminSettings.showImages = true
    }
    if (typeof data.adminSettings.autocommands === 'undefined') {
      data.adminSettings.autocommands = []
    }
    if (!data.adminSettings.autocommands.includes('!bot')) {
      const command = commonCommands.text.NewCommand() as RandomTextCommand
      command.triggers = [newCommandTrigger('!bot')]
      command.effects.push({
        type: CommandEffectType.CHAT,
        data: {
          text: ['$bot.message']
        }
      })
      data.commands.push(command)
      data.adminSettings.autocommands.push('!bot')
      fixed.shouldSave = true
    }

    const commands: FunctionCommand[] = []
    const timers: GeneralModuleTimer[] = []

    data.commands.forEach((cmd: RandomTextCommand) => {
      if (cmd.triggers.length === 0) {
        return
      }
      let cmdObj = null
      switch (cmd.action) {
        case CommandAction.TEXT:
          cmdObj = Object.assign({}, cmd, { fn: noop })
          break;
      }
      if (!cmdObj) {
        return
      }
      for (const trigger of cmd.triggers) {
        if (trigger.type === CommandTriggerType.FIRST_CHAT) {
          commands.push(cmdObj)
        } else if (trigger.type === CommandTriggerType.COMMAND) {
          // TODO: check why this if is required, maybe for protection against '' command?
          if (trigger.data.command) {
            commands.push(cmdObj)
          }
        } else if (trigger.type === CommandTriggerType.REWARD_REDEMPTION) {
          // TODO: check why this if is required, maybe for protection against '' command?
          if (trigger.data.command) {
            commands.push(cmdObj)
          }
        } else if (trigger.type === CommandTriggerType.FOLLOW) {
          commands.push(cmdObj)
        } else if (trigger.type === CommandTriggerType.SUB) {
          commands.push(cmdObj)
        } else if (trigger.type === CommandTriggerType.RAID) {
          commands.push(cmdObj)
        } else if (trigger.type === CommandTriggerType.BITS) {
          commands.push(cmdObj)
        } else if (trigger.type === CommandTriggerType.TIMER) {
          const interval = parseHumanDuration(trigger.data.minInterval)
          if (trigger.data.minLines || interval) {
            timers.push({
              lines: 0,
              minLines: trigger.data.minLines,
              minInterval: interval,
              command: cmdObj,
              next: new Date().getTime() + interval,
            })
          }
        }
      }
    })
    return { data, commands, timers, shouldSave: fixed.shouldSave } as GeneralModuleInitData
  }

  getRoutes() {
    return {
      get: {
        '/api/general/channel-emotes': async (req: any, res: Response, _next: NextFunction) => {
          const client = this.bot.getUserTwitchClientManager(this.user).getHelixClient()
          const channelId = await client?.getUserIdByNameCached(req.query.channel_name, this.bot.getCache())
          const emotes = channelId ? await client?.getChannelEmotes(channelId) : null
          res.send(emotes)
        },
        '/api/general/global-emotes': async (_req: any, res: Response, _next: NextFunction) => {
          const client = this.bot.getUserTwitchClientManager(this.user).getHelixClient()
          const emotes = await client?.getGlobalEmotes()
          res.send(emotes)
        },
      },
    }
  }

  async wsdata(eventName: string): Promise<WsData> {
    return {
      event: eventName,
      data: {
        commands: this.data.commands,
        settings: this.data.settings,
        adminSettings: this.data.adminSettings,
        globalVariables: await this.bot.getRepos().variables.all(this.user.id),
        channelPointsCustomRewards: this.channelPointsCustomRewards,
        mediaWidgetUrl: await this.bot.getWidgets().getWidgetUrl(WIDGET_TYPE.MEDIA, this.user.id),
        emoteWallWidgetUrl: await this.bot.getWidgets().getWidgetUrl(WIDGET_TYPE.EMOTE_WALL, this.user.id),
      },
    }
  }

  async updateClient(eventName: string, ws: Socket): Promise<void> {
    this.bot.getWebSocketServer().notifyOne([this.user.id], this.name, await this.wsdata(eventName), ws)
  }

  async updateClients(eventName: string): Promise<void> {
    this.bot.getWebSocketServer().notifyAll([this.user.id], this.name, await this.wsdata(eventName))
  }

  async save(): Promise<void> {
    await this.bot.getRepos().module.save(this.user.id, this.name, this.data)
    const initData = await this.reinit()
    this.data = initData.data
    this.commands = initData.commands
    this.timers = initData.timers
  }

  async saveCommands(): Promise<void> {
    await this.save()
  }

  getWsEvents() {
    return {
      'conn': async (ws: Socket) => {
        this.channelPointsCustomRewards = await getChannelPointsCustomRewards(this.bot, this.user)
        await this.updateClient('init', ws)
      },
      'save': async (_ws: Socket, data: GeneralSaveEventData) => {
        const fixed = this.fix(data.commands)
        this.data.commands = fixed.commands
        this.data.settings = data.settings
        this.data.adminSettings = data.adminSettings
        await this.save()
      },
    }
  }

  async volume(vol: number) {
    if (vol < 0) {
      vol = 0
    }
    if (vol > 100) {
      vol = 100
    }
    this.data.settings.volume = vol
    await this.save()
  }

  getCommands() {
    return this.commands
  }

  async onChatMsg(chatMessageContext: ChatMessageContext) {
    this.timers.forEach(t => {
      t.lines++
    })

    const emotes = extractEmotes(chatMessageContext)
    if (emotes) {
      const data: GeneralModuleEmotesEventData = {
        displayFn: this.data.settings.emotes.displayFn,
        emotes,
      }
      // extract emotes and send them to the clients
      this.bot.getWebSocketServer().notifyAll([this.user.id], 'general', {
        event: 'emotes',
        data,
      })
    }
  }
}

export default GeneralModule
