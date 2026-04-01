#!/usr/bin/env bun
import { Command } from 'commander';
import { initCommand } from './commands/init.js';
import { scanCommand } from './commands/scan.js';
import { lintCommand } from './commands/lint.js';

const program = new Command();

program
  .name('ferret')
  .description('SpecFerret keeps your specs honest.')
  .version('0.1.0');

program.addCommand(initCommand);
program.addCommand(scanCommand);
program.addCommand(lintCommand);

program.parseAsync(process.argv);
