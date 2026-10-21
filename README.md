# SW T32 Cutoff Tracker

Live at **[sw-t32.com](https://sw-t32.com)**. It projects the Summoners War siege T32 cutoff with **Trig's Algorithm** and shows what every top-100 guild needs, for Global, Europe, Asia+China and Japan+Korea.

## How it updates

A GitHub Action (`.github/workflows/update.yml`) pulls the siege leaderboards from [swgt.io](https://swgt.io/leaderboards/siege/) (with the site owner's permission) and rebuilds the pages:

- every 2 hours on Wednesdays and Saturdays (UTC), when swgt.io posts siege results
- a few catch-up checks on the other siege days
- it only publishes when the leaderboard actually changed

To update right away: **Actions** → **Update leaderboard from swgt.io** → **Run workflow**.

## Each new season

Edit `data/settings.json` and change `cutoffDate` to the date of the last siege that counts (`YYYY-MM-DD`). Saving the file runs the update. Sieges left are counted automatically: two a week (Monday–Tuesday and Thursday–Friday rounds), using each server's swgt.io "last updated" time.

To force a number instead, set for example `"siegesLeftOverride": {"Global": 2}`, and set it back to `{}` afterwards.

## Files

- `index.html`, `predictor.html`: generated pages (don't edit by hand)
- `data/settings.json`: cutoff date, scoring and servers (edit this)
- `data/boards.json`: latest leaderboards and the 32nd-place history (written by the updater)
- `tools/`: the swgt.io reader, the siege countdown and the page builder

Reaching the projected cutoff is a mathematical projection, not a guarantee of T32 qualification.
