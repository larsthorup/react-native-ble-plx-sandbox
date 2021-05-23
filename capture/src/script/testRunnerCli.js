import * as cp from 'child_process';
import * as fs from 'fs';
import { promisify } from 'util';

import 'dotenv/config';
import { launch } from '../lib/testLauncher.js';

const exec = promisify(cp.exec);
const { spawn } = cp;
const { log } = console;
const env = process.env;
const expectedFailCount = Number(process.argv[2] || '0');
const { name: appName } = JSON.parse(fs.readFileSync('./app.json'));

const { exitCode } = await launch({ appName, env, exec, expectedFailCount, log, spawn });
process.exit(exitCode);
