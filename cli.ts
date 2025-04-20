#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env

import { parseArgs } from "jsr:@std/cli/parse-args";
import { join } from "jsr:@std/path";

// Get the directory where the script is located
const TOOLBELT_DIR = new URL(".", import.meta.url).pathname;

/**
 * Lists all available folders in the toolbelt directory
 */
async function listFolders(): Promise<void> {
  console.log("Available categories:");

  for await (const dirEntry of Deno.readDir(TOOLBELT_DIR)) {
    if (dirEntry.isDirectory && !dirEntry.name.startsWith(".")) {
      console.log(`  - ${dirEntry.name}`);
    }
  }

  console.log(
    "\nUsage: toolbelt <category> [snippet] or toolbelt <category> --list",
  );
}

/**
 * Lists all available files in a specified folder
 */
async function listFiles(folder: string): Promise<void> {
  const folderPath = join(TOOLBELT_DIR, folder);

  try {
    const stat = await Deno.stat(folderPath);
    if (!stat.isDirectory) {
      console.error(`Error: '${folder}' is not a directory.`);
      Deno.exit(1);
    }
  } catch (error) {
    console.error(`Error: Category '${folder}' not found.`);
    Deno.exit(1);
  }

  console.log(`Available snippets in '${folder}':`);

  for await (const dirEntry of Deno.readDir(folderPath)) {
    if (dirEntry.isFile && dirEntry.name.endsWith(".ts")) {
      // Remove .ts extension when displaying
      const snippetName = dirEntry.name.replace(/\.ts$/, "");
      console.log(`  - ${snippetName}`);
    }
  }

  console.log("\nUsage: toolbelt " + folder + " <snippet>");
}

/**
 * Copies a snippet file to the current directory
 */
async function copySnippet(folder: string, snippet: string): Promise<void> {
  const snippetFileName = snippet.endsWith(".ts") ? snippet : `${snippet}.ts`;
  const sourcePath = join(TOOLBELT_DIR, folder, snippetFileName);
  const currentDir = Deno.cwd();
  const destinationPath = join(currentDir, snippetFileName);

  try {
    // Check if source file exists
    await Deno.stat(sourcePath);
  } catch (error) {
    console.error(
      `Error: Snippet '${snippet}' not found in category '${folder}'.`,
    );
    console.log(`Run 'toolbelt ${folder} --list' to see available snippets.`);
    Deno.exit(1);
  }

  try {
    // Check if destination file already exists
    const destStat = await Deno.stat(destinationPath);
    if (destStat) {
      const confirm = prompt(
        `File '${snippetFileName}' already exists. Overwrite? (y/N) `,
      );
      if (confirm?.toLowerCase() !== "y") {
        console.log("Operation cancelled.");
        Deno.exit(0);
      }
    }
  } catch {
    // File doesn't exist, which is fine
  }

  try {
    // Copy the file
    await Deno.copyFile(sourcePath, destinationPath);
    console.log(`✓ Copied '${snippetFileName}' to current directory.`);
  } catch (error) {
    console.error(`Error copying file: ${error.message}`);
    Deno.exit(1);
  }
}

async function main() {
  const args = parseArgs(Deno.args, {
    boolean: ["list", "help"],
    alias: { l: "list", h: "help" },
  });

  // Handle help flag
  if (args.help) {
    console.log(`
Toolbelt - A utility for quickly adding code snippets to your project.

Usage:
  toolbelt --list                 List all available categories
  toolbelt --help                 Show this help message
  toolbelt <category> --list      List all snippets in a category
  toolbelt <category> <snippet>   Copy a specific snippet to the current directory
`);
    Deno.exit(0);
  }

  // Handle global list flag
  if (args.list && args._.length === 0) {
    await listFolders();
    Deno.exit(0);
  }

  // Handle category list
  if (args._.length === 1 && args.list) {
    await listFiles(String(args._[0]));
    Deno.exit(0);
  }

  // Handle copy snippet
  if (args._.length === 2) {
    await copySnippet(String(args._[0]), String(args._[1]));
    Deno.exit(0);
  }

  // If we get here, show help
  console.log("Invalid usage. See available options below:\n");
  await listFolders();
  Deno.exit(1);
}

if (import.meta.main) {
  main();
}
