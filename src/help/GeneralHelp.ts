import Help from '@/classes/Help';

export default class GeneralHelp extends Help {
  constructor() {
    super('general');
  }

  short =
    "Using the /general command you can set the template for the channel name of the channel you're in when nobody is playing a game.";
}
