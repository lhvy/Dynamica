import Command from '@/classes/Command';
import Secondaries from '@/classes/Secondaries';
import creatorCheck from '@/preconditions/creator';
import {
  CacheType,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';

export default class TransferCommand extends Command {
  constructor() {
    super('transfer');
  }

  conditions = [creatorCheck];

  data = new SlashCommandBuilder()
    .setName('transfer')
    .setDMPermission(false)
    .setDMPermission(false)
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDescription('Transfer ownership of secondary channel to another person')
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription('The person to transfer ownership to.')
        .setRequired(true)
    );

  // eslint-disable-next-line class-methods-use-this
  response = async (interaction: ChatInputCommandInteraction<CacheType>) => {
    const user = interaction.options.getUser('user', true);
    const guildMember = await interaction.guild.members.cache.get(
      interaction.user.id
    );

    const { channelId } = guildMember.voice;

    const secondaryChannel = Secondaries.get(channelId);
    if (secondaryChannel) {
      await secondaryChannel.changeOwner(user);
      interaction.reply(
        `Ownership of <#${channelId}> channel to <@${user.id}>.`
      );
    } else {
      interaction.reply('Not a valid secondary channel.');
    }
  };
}
