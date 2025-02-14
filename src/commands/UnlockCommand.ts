import Command from '@/classes/Command';
import Secondaries from '@/classes/Secondaries';
import creatorCheck from '@/preconditions/creator';
import { SuccessEmbed } from '@utils/discordEmbeds';
import {
  CacheType,
  channelMention,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';

export default class UnlockCommand extends Command {
  constructor() {
    super('unlock');
  }

  conditions = [creatorCheck];

  data = new SlashCommandBuilder()
    .setName('unlock')
    .setDMPermission(false)
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .setDescription('Remove any existing locks on locked secondary channels.');

  // eslint-disable-next-line class-methods-use-this
  response = async (interaction: ChatInputCommandInteraction<CacheType>) => {
    const guildMember = await interaction.guild.members.cache.get(
      interaction.user.id
    );

    const { channelId } = guildMember.voice;

    const dynamicaSecondary = Secondaries.get(channelId);

    await dynamicaSecondary.unlock(interaction.client);
    await interaction.reply({
      embeds: [SuccessEmbed(`Removed lock on ${channelMention(channelId)}.`)],
    });
  };
}
