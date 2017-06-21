#!/usr/bin/env node
'use strict'
const commander = require('commander')
var commands = require('./bin/commands')
commander
    .version('0.0.1')
    .command('karma')
    .description('Add karma environment to an angular2 library.')
    .action(commands.karma);

commander.parse(process.argv)