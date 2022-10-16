'use strict'

import { logger, MINUTE } from "../../common/fn";
import { isBroadcaster, isMod, isSubscriber } from "../../common/permissions";
import fn from "../../fn";
import { Bot, CommandTrigger, CommandTriggerType, Module, RawCommand, TwitchChatContext } from "../../types";
import { CommandExecutor } from "../CommandExecutor";
import TwitchHelixClient from "../TwitchHelixClient";
import { User } from "../../repo/Users";

const log = logger('ChatEventHandler.ts')

const rolesLettersFromTwitchChatContext = (context: TwitchChatContext): string[] => {
  const roles: string[] = []
  if (isMod(context)) {
    roles.push('M')
  }
  if (isSubscriber(context)) {
    roles.push('S')
  }
  if (isBroadcaster(context)) {
    roles.push('B')
  }
  return roles
}

const determineStreamStartDate = async (
  context: TwitchChatContext,
  helixClient: TwitchHelixClient,
): Promise<Date> => {
  const stream = await helixClient.getStreamByUserId(context['room-id'])
  if (stream) {
    return new Date(stream.started_at)
  }

  const date = new Date(new Date().getTime() - (5 * MINUTE))
  log.info({
    roomId: context['room-id'],
    date: date,
  }, `No stream is running atm, using fake start date.`)
  return date
}

const determineIsFirstChatStream = async (
  bot: Bot,
  user: User,
  context: TwitchChatContext,
): Promise<boolean> => {
  const helixClient = bot.getUserTwitchClientManager(user).getHelixClient()
  if (!helixClient) {
    return false
  }
  const minDate = await determineStreamStartDate(context, helixClient)
  return await bot.getChatLog().isFirstChatSince(context, minDate)
}

export class ChatEventHandler {
  async handle(
    bot: Bot,
    user: User,
    target: string,
    context: TwitchChatContext,
    msg: string,
  ): Promise<void> {
    const roles = rolesLettersFromTwitchChatContext(context)
    log.debug({
      username: context.username,
      roles,
      target,
      msg,
    })

    bot.getChatLog().insert(context, msg)

    let _isFirstChatAlltime: null | boolean = null
    const isFirstChatAlltime = async (): Promise<boolean> => {
      if (_isFirstChatAlltime === null) {
        _isFirstChatAlltime = await bot.getChatLog().isFirstChatAllTime(context)
      }
      return _isFirstChatAlltime
    }

    let _isFirstChatStream: null | boolean = null
    const isFirstChatStream = async (): Promise<boolean> => {
      if (_isFirstChatStream === null) {
        _isFirstChatStream = await determineIsFirstChatStream(bot, user, context)
      }
      return _isFirstChatStream
    }

    const isRelevantFirstChatTrigger = async (trigger: CommandTrigger): Promise<boolean> => {
      if (trigger.type !== CommandTriggerType.FIRST_CHAT) {
        return false
      }
      if (trigger.data.since === 'alltime') {
        return await isFirstChatAlltime()
      }
      if (trigger.data.since === 'stream') {
        return await isFirstChatStream()
      }
      return false
    }

    const createTriggers = async (
      m: Module
    ): Promise<{ triggers: CommandTrigger[], rawCmd: RawCommand | null }> => {
      let commandTriggers = []
      const triggers = []
      for (const command of m.getCommands()) {
        for (const trigger of command.triggers) {
          if (trigger.type === CommandTriggerType.COMMAND) {
            commandTriggers.push(trigger)
          } else if (await isRelevantFirstChatTrigger(trigger)) {
            triggers.push(trigger)
          }
        }
      }

      // make sure longest commands are found first
      // so that in case commands `!draw` and `!draw bad` are set up
      // and `!draw bad` is written in chat, that command only will be
      // executed and not also `!draw`
      commandTriggers = commandTriggers.sort((a, b) => b.data.command.length - a.data.command.length)
      let rawCmd = null
      for (const trigger of commandTriggers) {
        rawCmd = fn.parseCommandFromTriggerAndMessage(msg, trigger)
        if (!rawCmd) {
          continue
        }
        triggers.push(trigger)
        break
      }
      return { triggers, rawCmd }
    }

    const client = bot.getUserTwitchClientManager(user).getChatClient()
    const chatMessageContext = { client, target, context, msg }

    for (const m of bot.getModuleManager().all(user.id)) {
      const { triggers, rawCmd } = await createTriggers(m)
      if (triggers.length > 0) {
        const exec = new CommandExecutor()
        await exec.executeMatchingCommands(bot, user, rawCmd, target, context, triggers)
      }
      await m.onChatMsg(chatMessageContext);
    }
  }
}
