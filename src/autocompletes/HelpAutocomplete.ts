import Autocomplete from '@/classes/Autocomplete';
import Helps from '@/classes/Helps';
import { AutocompleteInteraction, CacheType } from 'discord.js';
import Fuse from 'fuse.js';

export default class HelpAutocomplete extends Autocomplete {
  constructor() {
    super('help');
  }

  // eslint-disable-next-line class-methods-use-this
  public response: (
    interaction: AutocompleteInteraction<CacheType>
  ) => Promise<void> = async (interaction) => {
    const value = interaction.options.getFocused();
    const helpOptions = Helps.names;

    const fuse = new Fuse(helpOptions);

    const query = fuse.search(value.toString());

    interaction.respond(
      value.toString()
        ? query
            .map((result) => ({
              name: result.item,
              value: result.item,
            }))
            .slice(0, 24)
        : helpOptions
            ?.map((option) => ({
              name: option,
              value: option,
            }))
            .slice(0, 24)
    );
  };
}
