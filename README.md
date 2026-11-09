# status-band

A Claude Code mod that draws a band above the prompt: the folder and git branch (`*` when dirty), the model and effort, and colored meters for the context window and the 5-hour and weekly limits, with reset countdowns. Meters go green, yellow at 50%, red at 80%.

## Install

```
/plugin install status-band --marketplace adamico/status-band
```

## Share with your team

Add this to a project's `.claude/settings.json` and commit it. Anyone who opens the project and trusts the folder is offered the marketplace and the plugin:

```json
{
  "extraKnownMarketplaces": {
    "status-band": { "source": { "source": "github", "repo": "adamico/status-band" } }
  },
  "enabledPlugins": { "status-band@status-band": true }
}
```

## Develop

```
claude plugin validate .
claude plugin test .
```
