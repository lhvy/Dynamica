import Command from '@/classes/Command';
import db from '@db';
import { ErrorEmbed, SuccessEmbed } from '@utils/discordEmbeds';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  CacheType,
  ChatInputCommandInteraction,
  ComponentType,
  SlashCommandBuilder,
} from 'discord.js';

// const ;

// export const join = new Command({ help, data, response });

export default class JoinCommand extends Command {
  constructor() {
    super('join');
  }

  data = new SlashCommandBuilder()
    .setName('join')
    .setDescription('Request to join a locked voice channel.')
    .setDMPermission(false)
    .addStringOption((option) =>
      option
        .setAutocomplete(true)
        .setName('secondary')
        .setDescription('The channel to request to join.')
        .setRequired(true)
    );

  // eslint-disable-next-line class-methods-use-this
  response = async (interaction: ChatInputCommandInteraction<CacheType>) => {
    const secondary = interaction.options.getString('secondary', true);

    const channelConfig = await db.secondary.findUnique({
      where: { id: secondary },
      include: { guild: true },
    });
    if (!channelConfig.guild.allowJoinRequests) {
      interaction.reply({
        embeds: [ErrorEmbed('Join Requests are not enabled on this server.')],
      });
      return;
    }

    const { creator } = channelConfig;

    const row = new ActionRowBuilder<ButtonBuilder>({
      type: ComponentType.ActionRow,
    }).addComponents(
      new ButtonBuilder()
        .setCustomId('channeljoinaccept')
        .setLabel('Allow')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('channeljoindeny')
        .setLabel('Deny')
        .setStyle(ButtonStyle.Danger)
    );
    interaction.reply({
      components: [row],
      content: `Does <@${interaction.user.id}> have permission to join <#${secondary}>? As the creator <@${creator}>, are they allowed to join?`,
    });
    interaction.channel
      .createMessageComponentCollector({
        componentType: ComponentType.Button,
        filter: (filteritem) => filteritem.user.id === channelConfig.creator,
      })
      .once('collect', async (collected) => {
        const button = collected;
        if (button.customId === 'channeljoinaccept') {
          const discordChannel = await collected.guild.channels.cache.get(
            secondary
          );
          if (!discordChannel.isVoiceBased()) return;

          await discordChannel.permissionOverwrites.create(interaction.user, {
            Connect: true,
          });
          await interaction.editReply({
            embeds: [
              SuccessEmbed(
                `<@${interaction.user.id}> has been granted access to <#${secondary}>.`
              ),
            ],
            components: [],
            content: null,
          });
        } else if (button.customId === 'channeljoindeny') {
          await interaction.editReply({
            content: null,
            components: [],
            embeds: [
              ErrorEmbed(`You have been denied access to <#${secondary}>.`),
            ],
          });
        } else {
          interaction.reply('Wrong button');
        }
      });
  };
}
