# Final checklist

Adapted from the London Noise pitch checklist (`ssh.ldn` README + `doc/A.brainstorming/note.md`) and the tokens& submit list (`compileflow/docs/archive/hackathon/hackathon-submission-draft.md`). This file is the Haggleberry version.

If the user says **final checklist**, perform every section below in order. Tick a box in this file only when its done-when line is true. If a step is blocked, write the blocker under that box and continue any step that does not depend on it. Stay off the negotiation engine, merchant live, and Supabase schema unless a step says otherwise.

Crew:

| Who | Public profile to encode |
| --- | --- |
| Mangle Kuo | https://manglekuo.com (GitHub `ghcpuman902`) |
| Cornelius Hagmeister | https://github.com/CorneliusHagmeister |

Use a LinkedIn URL for either person only when it is already written in this repo or the user pasted it in the same conversation. Repo: https://github.com/CorneliusHagmeister/CursorHack

Stage path the recording must show, in this order:

1. `/` as a logged-out shop.
2. `/login` → **Continue as demo shopper** (Sam: `sam.okonkwo@example.com`). Judges get a prefilled text area on `/login`, not an Account copy-and-paste step.
3. Open a product and make an offer. Finn answers with a deal, not a bare discount.
4. Apply the deal and confirm checkout.
5. `/merchant/live` shows the same session.
6. `/pitch` is the last frame: live URL, repo, and a QR for each person.

## 1. Live URL

- [x] Find the production URL for this repo (Vercel project linked to `CorneliusHagmeister/CursorHack`, or a URL the user already gave). Write it on the line below.

Live URL: `https://indigo-lane.vercel.app/`

Done when: the line above is a real `https://` URL that loads this app, and the same URL appears in the README run/demo section, in `docs/hackathon/writeup.md`, and on `/pitch`. If no deployment exists, leave the line as `_`, say so in the reply, and point the end card at the repo URL until a deployment exists. Do not invent a domain.

## 2. Writeup

- [x] Write `docs/hackathon/writeup.md` and link it from the README.

The writeup must include, in this order:

- Product name **Haggleberry** and one sentence: shoppers negotiate packages of terms (price, return, shipping, final sale), and both sides see the same deal.
- The live URL from section 1, the repo URL, and how to run (`pnpm install`, `pnpm run dev`).
- Demo login: email `sam.okonkwo@example.com`, password `indigo-demo`, and **Continue as demo shopper**.
- The stage path above, including `/pitch` as the close.
- Data, stated as demo data: seeded catalogue, stub bank statement at `/api/demo/bank-statement` (not a linked bank), return copy from `src/lib/return-policies.ts`, orders in `data/orders.json` unless Supabase is configured. Prices come from `src/lib/negotiation/engine.ts`.
- Architecture pointer: this README and `docs/negotiation-api.md`.
- How context is shared: a prefilled text area on `/login` (board lock 15:43). The password stays with the shopper.
- Team: Mangle Kuo and Cornelius Hagmeister.
- Closing line: terms beyond a basic return should be a package you can negotiate, because both sides can see the risk.

Done when: `docs/hackathon/writeup.md` exists, the README links to it, and every item above is present.

## 3. End card — QR for each of us

- [x] Add `/pitch` and the QR images.

Generate PNGs with `npx --yes qrcode` into `public/pitch/`:

- `mangle.png` → Mangle's profile URL from the table above
- `cornelius.png` → Cornelius's profile URL from the table above
- `demo.png` → the live URL from section 1, or the repo URL if section 1 is still `_`

Build `src/app/pitch/page.tsx` as the last screen of the demo. Show:

- Heading: Haggleberry
- The live URL as text (repo URL if there is no deployment yet)
- Repo link: https://github.com/CorneliusHagmeister/CursorHack
- Two QR images, each with the person's name as the only caption (Mangle Kuo, Cornelius Hagmeister)
- The demo QR, captioned with the URL it encodes
- The closing line from section 2

Follow the UI rules in `.cursor/rules/`. One heading. No eyebrow label. No emoji. Group the three QRs with spacing.

Done when: `/pitch` renders all three images, the URLs match the files, and the demo script ends by opening `/pitch`.

## 4. Demo recording

- [x] Write `docs/hackathon/demo-script.md` with the six stage beats and roughly 30 seconds each (3 minutes total). The last beat is `/pitch` held long enough to scan the QRs.
- [ ] Walk that path in the browser

  Blocker (2026-09-26): stills reel not captured in this pass — script + `/pitch` QRs ready; agents can fill `docs/hackathon/demo/*.png` after Cor’s order-404 fix. and save one PNG per beat to `docs/hackathon/demo/`: `01-shop.png`, `02-login.png`, `03-offer.png`, `04-checkout.png`, `05-merchant.png`, `06-pitch.png`.
- [ ] Build a silent stills reel, 3 seconds per beat:

```bash
cd docs/hackathon/demo
printf "file '01-shop.png'\nduration 3\nfile '02-login.png'\nduration 3\nfile '03-offer.png'\nduration 3\nfile '04-checkout.png'\nduration 3\nfile '05-merchant.png'\nduration 3\nfile '06-pitch.png'\nduration 5\nfile '06-pitch.png'\n" > reel.txt
ffmpeg -y -f concat -i reel.txt -vf "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2" -c:v libx264 -pix_fmt yuv420p demo.mp4
```

If `ffmpeg` is missing, keep the PNGs and the script, and write the blocker under this box.

Done when: the six PNGs and `demo-script.md` exist. `demo.mp4` exists, or the blocker explains why it does not.

## 5. What has to be visible before presenting

Carried over from the London Noise list. Each one must show up on `/pitch` or in the writeup.

- [ ] GitHub repository
- [ ] Live demo URL (or an explicit note that it is not deployed yet)
- [ ] Demo QR
- [ ] QR for Mangle Kuo
- [ ] QR for Cornelius Hagmeister
- [ ] Team names
- [ ] Data sources (writeup: seeded catalogue, stub statement, demo returns)
- [ ] Architecture (writeup → README + `docs/negotiation-api.md`)
- [ ] How an agent gets context without the password (prefilled text area on `/login`)
- [ ] Closing line from section 2

Done when: a reader of `/pitch` plus the writeup can check every box without opening the editor.

## 6. Repo

- [ ] README names Haggleberry, links the writeup, and includes the live URL once section 1 has one.
- [ ] No secrets and no `.env.local` in the commit.
- [ ] Latest commit is pushed to `CorneliusHagmeister/CursorHack`.

Done when: `git status` is clean for these files and the remote has the commit. Ask before committing if the user has not asked for a commit in that turn.
