import * as commander from 'commander'
var commands = require('./commands')
export class App {

    private commander: commander.CommanderStatic
    constructor() {
        this.commander = commander
    }

    public initialize() {
        commander
            .version('0.0.1')
            .option('-v, --vscode', 'Add Chrome launcher configuration')
            .option('-m, --module <moduleName>', 'Module to bootstrap')
            .command('karma')
            .description('Add karma environment to an angular2 library.')
            .action(commands.karma)

        commander.parse(process.argv)
    }
}