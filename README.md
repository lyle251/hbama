# Trunk

Trunk is a multi-tenant campus marketplace for textbooks, dorm gear, lab supplies, tickets, tutoring and rides. It starts at the University of Alabama (Tuscaloosa) and is built so a new school can be added in under a minute. The interface is a block-world theme: stone inventory panels with bevels, a dirt-and-grass top bar, pixel type (Press Start 2P for headings, Jersey 15 for text), a day sky and a night sky, and Ellie the elephant. No red.

This repository is a **working front-end prototype** of the product brief. It is plain HTML, CSS and JavaScript with no build step and no API keys. All data lives in the browser (`localStorage`) and every external service sits behind a mock adapter.

## Run it

```
git clone https://github.com/lyle251/hbama && cd hbama
npx http-server -p 8080        # or simply open index.html
```

Open `http://localhost:8080`, then go to `#/demo` for the judging script (switch users, jump to any step, reset data).

## What is in the prototype

| Area | Screen | Notes |
|---|---|---|
| Landing, sign up, log in | `#/landing`, `#/login`, `#/verify` | Your school is detected from the `.edu` domain (`@crimson.ua.edu` is the University of Alabama), 6-digit email code (shown in a dev toast), mock student-ID check, "request my school" flow. There is no campus picker. |
| Market | `#/market`, `#/listing/ID` | Smart search (course codes, ISBN, synonyms, related items), category tree and filters, typeahead, cross-campus mode |
| Semester Kit | `#/kit` | myBama sync (mock), required items per course, "X sellers, lowest $Y", "Already have it", savings total, ranked matches, Wanted requests, syllabus paste, reverse "sell it" flow |
| Sell | `#/sell` | Class Materials require a course, category-specific fields, price helper, photos |
| Messenger | `#/chats` | Per-listing chat, meetup proposal on the campus map, ON HOLD, both confirm, SOLD, credits, ratings and reviews |
| Pickup map | `#/live/ID` | The only map in the app, with the five pickup places (below). It opens when both people accept a meetup, and shows buyer and seller to each other. Opt-in share window (60, 30 or 15 min), simulated walk, arrival, friend share link, SOS, 15-minute check-in |
| Profile | `#/profile/ID` | One profile for buying and selling, Trust Score breakdown, reviews, credit ledger, vouching |
| Campus Hub | `#/hub` | Per-tenant resource directory, open-now, favorites, "which resource do I need?" quiz, links to tutoring listings |
| Ask Ellie | button on every page | Shopping assistant. Ask "what do I need for ECE 380?" and get each item, the price new, and the sellers on your campus with links. Runs on a mock until the Gemma key is added |
| Admin | `#/admin/schools/new` | Create a tenant from a short config |

## Innovation highlights

- **The Semester Kit.** Trunk reads a student's class list and turns it into a shopping list with live campus prices, so students buy what they need and stop paying new-book prices.
- **Reverse flow.** When a semester ends, Trunk offers to list the student's materials to the students who take the course next term.
- **Skin-in-the-game vouching.** A trusted seller stakes credits on a newcomer. A good run returns the stake plus a bonus; a bad first review costs the voucher half.
- **Readable Trust Score.** 0 to 100, with every component shown (verification, rating, sales, credits, vouches weighted by the voucher's own score, account age, no-shows).
- **Safety built into the transaction.** Opt-in live location only in a window before the meetup, read-only friend links, safe-spot badges, SOS and an automatic check-in.
- **A shopping assistant.** Ask what a class needs and get the items, new prices and campus sellers in one answer.
- **Multi-tenant from day one.** Each school is a tenant record with its own domains, theme, spots, categories and resource hub. Students can browse and buy across campuses and choose to ship or meet halfway.

## How multi-tenancy works

- A **tenant** (`T.SCHOOLS` in `js/data.js`) holds slug, name, location, allowed email domains, theme overrides, vouch threshold, safe spots and resources.
- **Routing:** `#/market` works per school today. `T.tenantFromHost` maps `ua.trunk.app` to the `ua` tenant for production subdomains.
- **Isolation:** every listing carries a `school`. Market queries filter by the active tenant unless the buyer turns on **Browse other campuses**, which only returns listings sellers marked `cross`.
- **Customization:** theme tokens in `css/trunk.css` are CSS variables and can be overridden per tenant.

### Add a new school

1. Open `#/admin/schools/new` (Start menu, or Demo controls).
2. Enter name, slug, `.edu` domain, latitude, longitude and a color. Submit.
3. The school appears on the US map and students with that email domain can sign up.

## Pickup places

Meetups happen at one of five public campus places. Addresses were checked against UA pages; the two marked "confirm" came from a secondary page or a conflicting listing, so check them before launch.

| Place | Address |
|---|---|
| Student Center | 751 Campus Dr W, Tuscaloosa, AL 35487 |
| Gorgas Library | 711 Capstone Dr, Tuscaloosa, AL 35487 |
| Rodgers Library | 335 Hackberry Ln, Tuscaloosa, AL 35487 |
| Bruno Library (confirm) | 425 Stadium Dr, Tuscaloosa, AL 35487 |
| Rec Center (confirm) | 400 Peter Bryce Blvd, Tuscaloosa, AL 35401 (an older UREC page lists 401 5th Ave E) |

The in-app map is a schematic with approximate positions, not to scale. Each place links to Google Maps for real directions.

## Price check and product images

- Opening a listing shows a **Price check**: this price against the average of other sellers with the same item (same material, ISBN or course item), plus the UA Supply Store and Amazon averages. The two retail numbers are **demo estimates** derived from list prices until the real sources are wired (`priceRef` adapter).
- Product images, tried in order: the seller's upload, a file at `img/products/<listing id>.jpg` (drop real photos there, e.g. `L02.jpg`), then the free Open Library cover for the ISBN. If none loads, a drawn example illustration (`js/art.js`) shows. Tutoring and ride listings have no product, so they have no picture. Amazon product images need the Product Advertising API and an Associates account (stubbed). Google and Amazon pages are not scraped.

## Privacy and safety design

- Location sharing is **off by default** and starts only inside the window the user picks.
- Positions are kept in memory only and dropped when the meetup ends or sharing stops. Nothing is written to storage.
- Only the two parties and friends the user invites can see a position. Either person can stop at any time.
- The student ID photo never leaves the browser in the demo. In production it goes to the verification provider and is not stored by Trunk.
- The Campus Hub lists resource names and descriptions only. No phone numbers, URLs or hours are shown, because none have been confirmed.

## From mocks to real integrations

All integrations live in `js/adapters.js` behind one interface. `DEMO_MODE = true` selects the mock; each real stub lists what to wire up.

| Adapter | Mock today | Real |
|---|---|---|
| Assistant | Rule-based answers from Trunk's own listings and course data | Gemma (`gemma-3-27b-it`) through the Google AI API, called from the server so the key stays private; JSON validated with Zod; no invented links or prices |
| Student verification | Accepts 8-digit IDs starting with 1 | SheerID verification request |
| Registrar | Returns five seeded UA courses | Banner / myBama SSO and section lookup |
| Syllabus parsing | Deterministic parser over seeded materials plus ISBN/keyword extraction | Claude API server-side, JSON validated with Zod |
| Realtime | In-page timers | Server-Sent Events, Pusher or Supabase Realtime |
| Storage | `URL.createObjectURL` | Presigned S3 upload |

## Mocked and real

**Real in this prototype:** the buying state machine (`js/transactions.js`, the transitions are enforced and throw on illegal moves), Trust Score and vouch accounting, search ranking, form validation, credit ledger, tenant creation, responsive layout, light and dark themes.

**Mocked:** authentication and email delivery, student verification, registrar, AI parsing, the other party in a chat (auto-replies and auto-accepts), live GPS (simulated walk), maps (stylized SVG, fictional campus layout), persistence (browser only), and all listings, users and prices.

## Production path

The brief asks for Next.js 15, Prisma and Auth.js. This prototype defines the screens, rules and data shapes those layers would implement: `js/transactions.js` moves to a server module, `T.state` becomes the Prisma schema with a `tenantId` on every table, and each adapter becomes a server route.

## Design and legal

Block-world theme with Ellie kept as the mascot (grey body, green cap). Day and night themes follow the system setting, with a toggle in the top bar. Credits are shown as emeralds. Ellie is original artwork. No University of Alabama logos, mascots or fonts are used; building names on the map are generic and fictional.
