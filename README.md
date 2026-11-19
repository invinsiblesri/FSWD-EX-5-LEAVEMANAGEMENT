# LeaveFlow · Leave Management

A polished leave-management dashboard built with **HTML, CSS and vanilla JavaScript**, deployed as a static site on **Vercel**.

## 🔗 Live Demo

**https://leavemanagement-invinsiblesri.vercel.app**

Sign in with any name and employee ID (no password) and the dashboard opens straight away.

## Highlights

- **Split sign-in screen** — glass card on a gradient panel, demo login with name, employee ID and department
- **Personal greeting** that changes with the time of day
- **Four stat tiles** — days available, days taken, pending requests and approval rate
- **Balance cards with progress rings** for casual and medical leave
- **Request history** with status pills (Pending / Approved / Rejected), reasons and date ranges
- **Filter chips** to switch between statuses instantly
- **Request modal** with a live duration preview and balance validation
- **Cancel** a pending request, and **reset demo data** from the footer
- Toast notifications instead of alerts
- Fully responsive: two-column split on desktop, single column on phones
- Data persists in `localStorage`, so refreshes and revisits keep your requests

## Tech Stack

| Layer | Used |
| --- | --- |
| Markup | Semantic HTML5 |
| Styling | Hand-written CSS — gradients, glassmorphism, CSS variables |
| Logic | Vanilla JavaScript (ES2020), no framework |
| Data | `localStorage` in the browser |
| Hosting | Vercel (static `public/` folder) |
| Optional API | Express + MongoDB in `server.js` |

## Project Structure

```
FSWD-EX-5-LEAVEMANAGEMENT/
├── public/
│   ├── index.html      # Sign-in screen, dashboard, request modal
│   ├── style.css       # Design system and responsive layout
│   └── app.js          # State, rendering, validation and persistence
├── server.js           # Original Express + MongoDB API (optional)
├── vercel.json         # Static deploy: serves public/, clean URLs
└── package.json
```

## How It Works On Vercel

`vercel.json` serves the `public/` folder directly — there is **no build step**:

```json
{
  "outputDirectory": "public",
  "cleanUrls": true
}
```

Leave data (profile and requests) is stored per browser in `localStorage`, so the deployed page is fully functional without a database. A first-time visitor gets a small set of sample requests so the dashboard never looks empty.

## Leave Rules

| Type | Yearly allowance |
| --- | --- |
| Casual leave | 12 days |
| Medical leave | 8 days |

- Days are counted inclusively between the start and end date
- Pending and approved requests both reduce the available balance
- A request that exceeds the remaining balance is blocked with an inline warning
- Rejected requests do not consume the balance

## Local Development

The front end needs nothing but a static file server:

```bash
# any static server pointed at public/
npx serve public
```

The original Express + MongoDB backend is still included if you want the API version:

```bash
npm install
cp .env.example .env        # add your MongoDB URI
npm run start:api           # http://localhost:5000
```

## Deployments

Every push to `main` triggers an automatic production deployment on Vercel.

- Production: https://leavemanagement-invinsiblesri.vercel.app
- Vercel project: `leavemanagement`
