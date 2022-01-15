import { VoiceState } from "discord.js";
import { Event } from "../Event";
import { bree } from "../utils/bree";
import { db } from "../utils/db";
import { getChannel } from "../utils/getCached";
import {
  createSecondary,
  deleteDiscordSecondary,
} from "../utils/operations/secondary";

export const voiceStateUpdate: Event = {
  event: "voiceStateUpdate",
  once: false,
  async execute(oldVoiceState: VoiceState, newVoiceState: VoiceState) {
    if (oldVoiceState?.channelId === newVoiceState?.channelId) return;
    // If the channel doesn't change then just ignore it.

    // User joins channel
    if (newVoiceState.channel && newVoiceState.member) {
      const secondaryConfig = await db.secondary.findUnique({
        where: { id: newVoiceState.channelId },
      });
      const primaryConfig = await db.primary.findUnique({
        where: { id: newVoiceState.channelId },
      });
      // Create a new secondary if one doesn't already exist and the user has joined a primary channel
      if (primaryConfig) {
        createSecondary(
          newVoiceState.guild.channels,
          newVoiceState.channelId,
          newVoiceState.member
        );
      } else if (secondaryConfig) {
        // If a secondary exists then run rename job.
        if (newVoiceState.channel.members.size !== 1) {
          bree.run(newVoiceState.channelId);
          if (secondaryConfig.textChannelId) {
            const textChannel = await getChannel(
              newVoiceState.guild.channels,
              secondaryConfig.textChannelId
            );

            // Typeguard voice remove permission for people who have left the voice channel to see the text channel.
            if (textChannel.type === "GUILD_TEXT") {
              textChannel.permissionOverwrites.create(
                oldVoiceState.member?.id,
                {
                  VIEW_CHANNEL: true,
                }
              );
            }
          }
        }
      }
    }

    // User leaves channel
    if (oldVoiceState.channel && oldVoiceState.member) {
      const secondaryConfig = await db.secondary.findUnique({
        where: { id: oldVoiceState.channelId },
        include: { guild: true },
      });
      if (secondaryConfig) {
        console.log(oldVoiceState.channel?.members.size);
        if (oldVoiceState.channel?.members.size !== 0) {
          bree.run(oldVoiceState.channelId);
          // Get discord text channel
          if (secondaryConfig.textChannelId) {
            const textChannel = await getChannel(
              newVoiceState.guild.channels,
              secondaryConfig.textChannelId
            );

            // Typeguard voice remove permission for people who have left the voice channel to see the text channel.
            if (textChannel.type === "GUILD_TEXT") {
              textChannel.permissionOverwrites.create(
                oldVoiceState.member?.id,
                {
                  VIEW_CHANNEL: false,
                }
              );
            }
          }
        } else {
          deleteDiscordSecondary(oldVoiceState.channel, secondaryConfig);
          const textChannel = oldVoiceState.client.channels.cache.get(
            secondaryConfig.textChannelId
          );
          textChannel?.delete();
        }
      }
    }

    // User joins secondary channel
    if (newVoiceState.channelId && newVoiceState.member) {
      const secondaryConfig = await db.secondary.findUnique({
        where: { id: newVoiceState.channelId },
        include: { guild: true },
      });
      if (secondaryConfig) {
        if (
          secondaryConfig?.guild.textChannelsEnabled &&
          secondaryConfig.textChannelId
        ) {
          const textChannel = await getChannel(
            newVoiceState.guild.channels,
            secondaryConfig.textChannelId
          );
          if (textChannel.type === "GUILD_TEXT") {
            textChannel.permissionOverwrites.create(newVoiceState.member?.id, {
              VIEW_CHANNEL: true,
            });
          }
        }
      }
    }
  },
};
