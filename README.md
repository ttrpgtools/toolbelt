# toolbelt

Utilities and tools that I use in many of my repos.

Designed to be copied and pasted into your own projects.

## Use Locally

There are a couple of options for this. What I'm doing is having a local copy, and running it via a `fish` function.

```fish
function toolbelt
  deno run --allow-read --allow-write --allow-env "$HOME/Projects/toolbelt/cli.ts" $argv
end
```

```fish
toolbelt --help
```
