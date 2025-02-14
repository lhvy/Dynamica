import db from '@db';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/index.js';
import logger from '@utils/logger';
import {
  Client,
  DiscordAPIError,
  EmbedBuilder,
  Guild,
  hyperlink,
} from 'discord.js';
// eslint-disable-next-line import/no-cycle
import Guilds from './Guilds';

/**
 * The list of basic commands to display.
 */
const basicCommands: {
  /**
   * The name of the command.
   */
  command: string;
  /**
   * The link to the help page of the command.
   */
  help: string;
  /**
   * The description of the command.
   */
  description: string;
}[] = [
  {
    command: '/help',
    help: 'https://dynamica.dev/docs/commands/help',
    description: 'Get a list of commands and their descriptions',
  },
  {
    command: '/invite',
    help: 'https://dynamica.dev/docs/commands/invite',
    description: 'Get an invite link for the bot',
  },
  {
    command: '/create',
    help: 'https://dynamica.dev/docs/commands/create',
    description: 'Create a new channel for people to join',
  },
  {
    command: '/alias',
    help: 'https://dynamica.dev/docs/commands/alias',
    description: 'Create a new alias for an activity',
  },
];

const commands = basicCommands
  .map(
    (command) =>
      `${hyperlink(`\`${command.command}\``, command.help)} - ${
        command.description
      }`
  )
  .join('\n');

const botInfoEmbed = new EmbedBuilder()
  .setTitle('Welcome to Dynamica!')
  .setDescription(
    'Dynamica is a Discord bot that allows you to manage voice channels in your server with ease.\n'
  )
  .addFields([
    { name: 'Basic Commands', value: commands },
    {
      name: 'Website',
      value:
        'Maybe you know this already but you can find out more about Dynamica at [dynamica.dev](https://dynamica.dev) including more commands.',
    },
    {
      name: 'Support',
      value:
        'If you have any questions or issues, you can join the [support server](https://discord.gg/zs892m6btf).',
    },
  ])

  .setAuthor({
    name: 'Dynamica',
    iconURL: 'https://dynamica.dev/img/dynamica.png',
  });

export default class DynamicaGuild {
  public id: string;

  constructor(id: string) {
    this.id = id;
  }

  public static async initialise(guild: Guild) {
    const owner = await guild.fetchOwner();
    if (!guild.members.me.permissions.has('Administrator')) {
      owner.send(
        `Hi there, I see you tried to invite me into your server. To make sure that the bot works correctly please allow it to have admin permissions and then re-invite it.\n\nIf you need more info as to why the bot needs admin go ${hyperlink(
          'here',
          'https://dynamica.dev/docs/faq#why-does-this-random-bot-need-admin'
        )}.`
      );
      await guild.leave();
      return;
    }

    // Attempt to send a message in the announcements channel
    try {
      await owner.send({
        embeds: [botInfoEmbed],
      });
    } catch (error) {
      logger.debug('Failed to send owner welcome message.');
    }

    try {
      await db.guild.create({
        data: {
          id: guild.id,
        },
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          logger.debug('Guild already exists in database');
        }
      } else {
        logger.error('Error creating guild in database:', error);
      }
    }

    logger.debug(`Joined guild ${guild.id} named: ${guild.name}`);
    const newGuild = new DynamicaGuild(guild.id);
    Guilds.add(newGuild);
  }

  prisma() {
    return db.guild.findUniqueOrThrow({
      where: { id: this.id },
    });
  }

  discord(client: Client<true>) {
    return client.guilds.fetch(this.id);
  }

  async deletePrisma() {
    return db.guild.delete({ where: { id: this.id } });
  }

  async leaveDiscord(client: Client<true>) {
    const guild = await this.discord(client);
    return guild.leave();
  }

  async leave(client: Client<true>) {
    try {
      await this.leaveDiscord(client);
      await this.deletePrisma();
      Guilds.remove(this.id);
    } catch (error) {
      if (error instanceof DiscordAPIError) {
        logger.error('Error leaving guild:', error);
      } else if (error instanceof PrismaClientKnownRequestError) {
        logger.error('Error deleting guild from database:', error);
      }
    }
  }

  /**
   * Change the setting allowing people to request to join a locked channel.
   * @param enabled the state to set the setting to
   * @returns this
   */
  async setAllowJoin(enabled: boolean) {
    await db.guild.update({
      where: { id: this.id },
      data: {
        allowJoinRequests: enabled,
      },
    });
  }
}
