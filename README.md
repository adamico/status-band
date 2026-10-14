# status-band

A Claude Code mod that draws a band above the prompt: the folder and git branch (`*` when dirty), the model and effort, and colored meters for the context window and the 5-hour and weekly limits, with reset countdowns. Meters go green, yellow at 50%, red at 80%.

## Install

```
/plugin install status-band --marketplace adamico/status-band
```

## Develop

```
claude plugin validate .
claude plugin test .
```
