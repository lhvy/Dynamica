import { Embed, SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription(
      "A help command that lists all commands available to users of the bot."
    )
    .addStringOption((option) =>
      option
        .setRequired(false)
        .setName("subcommand")
        .setDescription("Subcommand help")
    ),
  async execute(interaction: CommandInteraction) {
    const subcommand = interaction.options.getString("subcommand", false);

    const cachedGuildCommands = interaction.guild?.commands.cache;
    const guildCommands =
      cachedGuildCommands?.size === 0 || undefined
        ? cachedGuildCommands
        : await interaction.guild?.commands.fetch();

    const cachedApplicationCommands =
      interaction.client.application?.commands.cache;
    const applicationCommands =
      cachedApplicationCommands?.size === 0 || undefined
        ? cachedApplicationCommands
        : await interaction.client.application?.commands.fetch();

    const commands = process.env.GUILD_ID ? guildCommands : applicationCommands;
    console.log(commands);
    const subcommandList = commands
      ? commands
          ?.find((command) => command.name === subcommand)
          ?.options.map((option) => ({
            name: option.name,
            value: option.description,
          }))
      : [];
    const commandList = commands
      ? commands?.map((command) => ({
          name: command.name,
          value: command.description,
        }))
      : [];
    const list = !subcommand
      ? commandList
      : subcommandList
      ? subcommandList
      : [];
    // console.log(commands?.map((command) => command.options));

    await interaction.reply({
      embeds: [
        new Embed()
          .setDescription("Command List")
          .addFields(...list)
          .setColor(3447003)
          .setTitle("Info"),
      ],
    });
  },
};
