import Help from '@/classes/Help';

export default class TemplateHelp extends Help {
  constructor() {
    super('template');
  }

  short =
    'Using the /template command you can set the template for the channel name target primary channel.';

  long = `Using the /template command you can set the template for the channel name target primary channel. The default template is \`@@game@@ ##\` which will format the name of the channel according to the formatting rules.`;
}
