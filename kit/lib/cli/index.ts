#!/usr/bin/env bun --hot

// @ts-ignore
import { argv } from "bun";
import yargs from "yargs-parser";
import dev from "./dev";

function main() {
    const options = yargs(argv.slice(3));
    const { _: commands } = options;
    const [command] = commands;
    if (command === "help" || options.help) {
        return help();
    }
    switch (command) {
        case "dev": {
            dev();
            break;
        }
        default: {
            help();
            break;
        }
    }
}

function help() {
    console.info(`
Usage: tangerine <command>

Commands:
    dev     Start the development server
`);
}

main();
