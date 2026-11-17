# Frome Orienteering app: setup

About 20 minutes, best done on a laptop. You need a free GitHub account and your Google account.

## What's in the folder

- `index.html`: the app itself
- `manifest.webmanifest`, `sw.js` and the three `.png` icons: let phones install it and use it offline
- `google-sheet-script.gs`: the results inbox (goes in Google, not on GitHub)
- `SETUP.md`: this guide

## 1. Make the results sheet (10 min)

1. Create a new Google Sheet and call it something like "Frome O results".
2. Go to **Extensions › Apps Script**. Delete what's there, paste in everything from `google-sheet-script.gs`.
   Near the top, choose a **publishing password** and put it between the quotes, e.g. `const PUBLISH_PASSWORD = "contour-lines-42";`. Only someone with this password can put results on the public page. Save.
3. Click **Deploy › New deployment**. Under the cog, pick **Web app**.
   - Execute as: **Me**
   - Who has access: **Anyone** (runners don't have Google accounts, so this has to be open)
4. Click **Deploy**, allow the permissions Google asks for, and copy the **Web app URL**. It ends in `/exec`.

**If Apps Script won't open, or says it isn't linked to anything:**
- **Use a computer.** The Apps Script editor doesn't work properly on a phone or tablet.
- **Open it from inside the Sheet** (Extensions › Apps Script), not from script.google.com, so the script is linked to that Sheet.
- **Signed into more than one Google account?** Apps Script often fails with "Sorry, unable to open the file at this time". Open a private/incognito window, sign into just the club's Google account, open the Sheet and try again.
- **Already made it at script.google.com?** That works too: copy the Sheet's ID (the long code in its web address, between `/d/` and `/edit`) into `SHEET_ID` near the top of the script, then save and deploy.

## 2. Add the link to the app (1 min)

Open `index.html` in any text editor. Near the top you'll find:

```
const CONFIG = {
  sheetUrl: ""
};
```

Paste your link between the quotes and save:

```
  sheetUrl: "https://script.google.com/macros/s/XXXXXXXX/exec"
```

## 3. Put it online with GitHub Pages (5 min)

1. Sign in at github.com and create a new repository, e.g. `frome-o`. Set it to **Public**.
2. Click **Add file › Upload files** and drag in everything **except** `google-sheet-script.gs`. Commit.
3. Go to **Settings › Pages**. Under Source, choose **Deploy from a branch**, branch `main`, folder `/ (root)`, and save.
4. After a minute your app is live at `https://YOUR-USERNAME.github.io/frome-o/`.

## 4. Use your own web address (optional, 10 min plus waiting)

Do this **before your first real event**. Phones save everything against the exact web address, so moving address later means the app starts empty on the new one. You'd have to download a backup on the old address and restore it on the new one.

**First decide which address:**

- **The club doesn't own `fromeorienteering.co.uk` yet:** buy it from a UK registrar (Namecheap, 123-reg, Cloudflare and so on). A .co.uk is usually around £10 a year. Use the bare domain.
- **The club already has a website on it:** use a subdomain such as `app.fromeorienteering.co.uk`. Pointing the whole domain at GitHub would replace the existing site.

**Then connect it:**

1. In your GitHub repository, go to **Settings › Pages › Custom domain**, type the address and click **Save**.
2. At your domain registrar, open the DNS settings and add these records:

   For the bare domain `fromeorienteering.co.uk`:

   | Type  | Name / Host | Value                        |
   |-------|-------------|------------------------------|
   | A     | @           | 185.199.108.153              |
   | A     | @           | 185.199.109.153              |
   | A     | @           | 185.199.110.153              |
   | A     | @           | 185.199.111.153              |
   | CNAME | www         | YOUR-USERNAME.github.io      |

   Or for a subdomain like `app.fromeorienteering.co.uk`:

   | Type  | Name / Host | Value                        |
   |-------|-------------|------------------------------|
   | CNAME | app         | YOUR-USERNAME.github.io      |

   Remove any old A or CNAME records for the same name first, or they'll clash.
3. Wait for GitHub's Pages settings to show the domain as connected. This usually takes minutes but can take a few hours.
4. Tick **Enforce HTTPS**. Don't skip this: phones only allow the camera on secure (https) sites, so scanning won't work without it.

From here on, use your own address wherever this guide says `YOUR-USERNAME.github.io/frome-o`. The QR on the printed start card always uses whatever address you open the app on, so print your control sheets after switching.

## 5. Set up your phone as the organiser

1. Open `https://YOUR-USERNAME.github.io/frome-o/#events` (or `https://fromeorienteering.co.uk/#events` if you set up your own address). You'll see **Organiser sign-in**: enter your publishing password and tap **Unlock organiser mode**. You need signal for this, and only once per phone. The Events, Results and Run tabs then appear.
2. Add it to your home screen: Safari **Share › Add to Home Screen**, or Chrome **⋮ › Install app**.
3. On the Events page, check **Auto-upload** says On and tap **Test connection**.
4. The **Results page** section just below already has your publishing password filled in from signing in. It's saved on your phone only.
5. Copy the **results page link** shown there (it ends in `#results-live`). That's the link to post in Spond.
6. Under **Club members**, paste in your members' names, one per line (or separated by commas), and tap **Add to list**. You can copy them from Spond. Runners will then pick their name from this list instead of typing it.

Runners just use the plain link (or the small QR on the start card), which opens straight to the runner screen. Without the password, nobody can get into the organiser screens.

To use another phone or laptop as organiser (say a helper's), sign in on it the same way. When they're done, tap **Lock organiser mode** at the bottom of the Events page. Their copy of the events stays on that device until they sign in again.

## 6. Before the first event

- **Do a test run:** print a start card, two controls and a finish card, then do a quick lap with a second phone. Check the result appears in Results within about 30 seconds.
- **Open the app once with signal before going to a venue.** After that it works offline, and results upload when signal returns.
- **Download a backup after each event** (Events page, Backup). Your events, maps and results live on your device only, so a lost or reset phone loses them without one.

## On the day

- **Print one start card per course.** The control sheet now has a 2.5 km start card and a 5 km start card. Runners scan the one for their course, so they get the right time limit and appear in the right results.
- **Still out:** the Results screen lists everyone who has started but not finished, with how long they've been out, in red once they're past their time limit. Before you pack up, it should say everyone is back. Use **Back safe** for anyone who returns without a result.
- **Paper runners:** log them as they go out (Add paper entry, finish time blank), so they show as still out too. Tap **Add finish** when they're back.
- **Pairs and groups:** runners pick Solo, Pair or Group before scanning the start. Results can be filtered by each.
- **Time warnings:** phones buzz and beep at 5 minutes left and at time up, with a banner on screen. A web app can't make a locked phone buzz, so the warning shows as soon as they wake the screen. Tell runners to keep the app open.

## Club member list

Once the list has names in it, runners choose from a dropdown instead of typing:
- **Solo:** they pick their own name, and their phone remembers it.
- **Pair or group:** they pick themselves and each partner, or **Guest** for anyone who isn't a member. A team name is optional.
- **New people** choose **I'm not on the list** and type their name. They can still run straight away, and their name appears under **Club members** on your Events page, marked as asking to join. Tap **Add**, or **Dismiss** if they're already listed under another spelling.

Because results are linked to the person rather than the spelling, the league always counts them as one. Renaming someone in **Edit or remove names** updates their past results too, including published ones. Removing someone keeps their past results.

To fix a result after the event, open it on the Results tab and tap **Edit name**. Choosing a name from the list links the result to that member. Then tap **Publish again**.

Only names are stored: no emails, photos or logins.

## Scoring

Each event has three scoring settings (Events › Edit):
- **Time limits** for each course.
- **Late penalty:** points off per minute or part minute over the limit (default 10).
- **Bonus for finishing in time:** a flat number of points for anyone back within their course's limit (default 0, i.e. off). Finishing exactly on the limit still gets it, but one second over doesn't.

Total = control points + bonus − late penalty. Ties go to the faster time. The start cards, results and CSV all show the bonus when it's switched on.

## Publishing results

1. After the event, check the results on the **Results** tab and fix anything that's wrong.
2. Tap **Publish results**. They appear on the public results page within a minute.
3. Changed something afterwards? Tap **Publish again** to update it. **Remove** takes an event off the page.
4. Post the results page link in the Spond event.

**Volunteers:** in the event editor (Events › Edit), tick everyone who helped under **Volunteers**, or type the name of anyone not on the club list. Do this before you publish, or tap **Publish again** afterwards. You can publish an event that only has volunteers, too. It's the same link every time, and always shows the latest.

The public page has three views:
- **Events:** each published event, by course, with Solo, Pair and Group filters. Each person's line also shows their season points and place up to and including that event, and the event's volunteers are thanked underneath.
- **League:** pick a season, or **All time**.
  - A **season** is the calendar year, by event date. This year's November and December events make a short 2026 season, and 2027 starts fresh in January. Earlier seasons stay in the dropdown. Each course has its own league: the course winner at each event gets 100 league points, and everyone else gets the same share of the winner's score (e.g. 150 when the winner scored 200 earns 75).
  - **All time** lists every person with the number of events they've done and their total points, on any course. Sort by **Most events** or **Most points**. A pair or group result counts for each club member in it (guests aren't counted).
- **Volunteers:** how many events each person has helped at, for a season or all time. Members are matched by who they are, whatever the spelling. Guests and anyone not on the list are matched by the name they typed.

The top three in every table get gold, silver and bronze medals, and anyone tied on the same score and time shares a place. Once a season is over, its League view opens with a champions podium for each course.

Runners can open it from the **Results** tab in the app, too.

## How results arrive

- **Auto-upload:** when a runner starts, their phone tells your sheet they're out. When they tap Finish, it sends their result. Both retry every 30 seconds until they get through, and your Results screen checks the sheet every 30 seconds.
- **Scan backup:** every runner's finish screen also shows a QR. Scan it from Results › Scan finish codes. Uploading and scanning the same person never makes a duplicate.
- **Paper:** add these with Add paper entry.

## Updating the app later

Upload the new `index.html` to the repository. Also open `sw.js`, raise the version number by one (it’s currently `frome-o-v2`, so the next update makes it `frome-o-v3`), and upload that too, so phones pick up the new version.

## Good to know

- The results sheet link is public by necessity, so someone determined could send junk to it. A made-up punch only scores if it matches a real control code, and you can delete any entry.
- **Choose a proper password,** not something guessable like "frome". It unlocks the organiser screens, publishing and the member list. Wrong guesses are slowed down, but a weak password is still easy to guess.
- **The results page is public.** Anyone with the link can see names and scores. For under-18s, consider asking families to enter a first name and initial only (e.g. "Sam T").
- If you change the Apps Script later, use **Deploy › Manage deployments › Edit › New version** so the link stays the same.
