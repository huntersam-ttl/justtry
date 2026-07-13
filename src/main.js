import "./styles.css";
import { supabase, supabaseReady, storageUrl } from "./supabase.js";
import { audienceBlocks, collaborationPaths, createTypes, eventServices, fallbackEvents, fallbackFeatured, originalSeries } from "./data.js";

const app = document.querySelector("#app");
const state = {
  content: [],
  events: [],
  applications: [],
  collaborations: [],
  series: [],
  session: null,
  adminProfile: null,
  adminErrors: [],
  adminNotice: null
};

const publicPages = [
  ["Home", "/"],
  ["Stories", "/stories"],
  ["Shows", "/shows"],
  ["Events", "/events"],
  ["About", "/about"],
  ["Work With Us", "/join"]
];

function route() {
  return window.location.pathname.replace(/\/$/, "") || "/";
}

function go(path) {
  history.pushState({}, "", path);
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function loadPublicData() {
  if (!supabaseReady) return;

  const [contentRes, eventsRes, seriesRes] = await Promise.all([
    supabase.from("content_items").select("*").eq("status", "published").order("published_date", { ascending: false }),
    supabase.from("events").select("*").in("status", ["published", "planned"]).order("date", { ascending: true }),
    supabase.from("series").select("*").order("created_at", { ascending: false })
  ]);

  state.content = contentRes.data || [];
  state.events = eventsRes.data || [];
  state.series = seriesRes.data || [];
}

async function loadAdminData() {
  if (!supabaseReady || !state.session) return;

  const [contentRes, eventsRes, appsRes, collabRes, seriesRes] = await Promise.all([
    supabase.from("content_items").select("*").order("created_at", { ascending: false }),
    supabase.from("events").select("*").order("created_at", { ascending: false }),
    supabase.from("team_applications").select("*").order("created_at", { ascending: false }),
    supabase.from("collaboration_requests").select("*").order("created_at", { ascending: false }),
    supabase.from("series").select("*").order("created_at", { ascending: false })
  ]);

  state.adminErrors = [contentRes, eventsRes, appsRes, collabRes, seriesRes]
    .filter((result) => result.error)
    .map((result) => result.error.message);
  state.content = contentRes.data || state.content;
  state.events = eventsRes.data || state.events;
  state.applications = appsRes.data || [];
  state.collaborations = collabRes.data || [];
  state.series = seriesRes.data || state.series;
}

function shell(inner) {
  return `
    <header class="site-header">
      <a class="brand" data-link href="/">
        <span class="brand-mark">JT</span>
        <span><strong>Just Try</strong><small>Media Hub</small></span>
      </a>
      <nav class="nav">${publicPages.map(([label, path]) => `<a data-link class="${route() === path ? "active" : ""}" href="${path}">${label}</a>`).join("")}</nav>
      <button class="menu-button" data-menu>Menu</button>
    </header>
    <main>${inner}</main>
    <footer class="footer">
      <div>
        <p class="eyebrow">Just Try Media</p>
        <h2>For the ones still trying.</h2>
        <p>A student-led media studio making documentaries, shows, and event films about people building from zero.</p>
      </div>
      <div class="footer-links">
        <a data-link href="/stories">Stories</a>
        <a data-link href="/shows">Shows</a>
        <a data-link href="/events">Events</a>
        <a data-link href="/join">Work With Us</a>
      </div>
      <div class="footer-links">
        <a href="https://www.instagram.com/" target="_blank" rel="noreferrer">Instagram</a>
        <a href="https://www.tiktok.com/" target="_blank" rel="noreferrer">TikTok</a>
        <a href="https://www.youtube.com/" target="_blank" rel="noreferrer">YouTube</a>
        <a href="mailto:hello@justtryhub.com">Email</a>
      </div>
    </footer>
  `;
}

function adminShell(inner, compact = false) {
  const email = state.session?.user?.email || "";
  return `
    <main class="admin-app ${compact ? "login-only" : ""}">
      <header class="admin-topbar">
        <a class="admin-brand" href="/">
          <span class="brand-mark">JT</span>
          <span><strong>Just Try Admin</strong><small>${email || "Media CMS"}</small></span>
        </a>
        <div class="admin-top-actions">
          ${email ? `<span class="admin-email">${email}</span>` : ""}
          ${email ? `<button class="button secondary admin-logout" data-logout>Logout</button>` : `<a class="button secondary" href="/">View Site</a>`}
        </div>
      </header>
      ${inner}
    </main>
  `;
}

function cardImage(item, label = "Coming soon") {
  const image = storageUrl(item.thumbnail_image || item.poster_image);
  if (image) return `<img src="${image}" alt="">`;
  return `<div class="visual-fallback"><span>${label}</span></div>`;
}

function contentCard(item) {
  return `
    <article class="content-card">
      <div class="card-media">${cardImage(item, item.type || item.category || "Story")}</div>
      <div class="card-body">
        <div class="meta-line"><span>${item.type || "feature"}</span><span>${item.category || "Just Try"}</span></div>
        <h3>${item.title}</h3>
        <p>${item.excerpt || "A Just Try Media story is being shaped. Check back soon."}</p>
        ${item.video_url || item.external_link ? `<a class="text-link" href="${item.video_url || item.external_link}" target="_blank" rel="noreferrer">Watch / Read</a>` : ""}
      </div>
    </article>
  `;
}

function eventCard(item) {
  return `
    <article class="event-card">
      <div>
        <p class="eyebrow">${item.date || "TBA"} · ${item.location || "Just Try"}</p>
        <h3>${item.title}</h3>
        <p>${item.description}</p>
      </div>
      ${item.ticket_link ? `<a class="button ghost" href="${item.ticket_link}" target="_blank" rel="noreferrer">Details</a>` : `<span class="pill">${item.status || "planned"}</span>`}
    </article>
  `;
}

function homePage() {
  const featured = state.content.filter((item) => item.featured).slice(0, 3);
  const cards = featured.length ? featured : fallbackFeatured;
  const events = state.events.length ? state.events.slice(0, 2) : fallbackEvents;
  const series = state.series.length ? state.series : originalSeries;

  return shell(`
    <section class="hero">
      <div class="hero-bg"></div>
      <div class="hero-copy">
        <p class="eyebrow">Documentaries · Shows · Events · Stories</p>
        <h1>For the ones still trying.</h1>
        <p>A student-led media studio making documentaries, shows, event films, and creator stories about people building from zero.</p>
        <div class="actions">
          <a data-link class="button primary" href="/stories">Explore Stories</a>
          <a data-link class="button secondary" href="/join">Work With Us</a>
        </div>
      </div>
      <div class="hero-montage" aria-label="Just Try Media formats">
        <article><span>01</span><strong>Documentaries</strong><small>founders, students, creators</small></article>
        <article><span>02</span><strong>Event films</strong><small>after movies, reels, interviews</small></article>
        <article><span>03</span><strong>Original shows</strong><small>culture, business, entertainment</small></article>
        <article><span>04</span><strong>Creator stories</strong><small>artists, makers, performers</small></article>
      </div>
    </section>

    ${sectionHeader("What We Create", "Documentaries, event films, original shows, and creator-led culture content.")}
    <section class="create-grid">${createTypes.map((type) => `<article><span>${type.code}</span><h3>${type.title}</h3><p>${type.description}</p></article>`).join("")}</section>

    ${sectionHeader("Original Series", "Poster-style formats built to grow into the Just Try slate.")}
    <section class="series-grid">${series.map(seriesCard).join("")}</section>

    <section class="light-section">
      ${sectionHeader("Who This Is For", "For students, creators, founders, small brands, and event organisers who want their story on camera.")}
      <div class="audience-grid">${audienceBlocks.map((block) => `<article><h3>${block.title}</h3><p>${block.description}</p></article>`).join("")}</div>
    </section>

    ${sectionHeader("Featured Stories", "Published stories and films from the Just Try Media hub.")}
    <section class="grid three">${cards.map(contentCard).join("")}</section>

    <section class="event-services">
      <div>
        <p class="eyebrow">Events / Work With Us</p>
        <h2>Event coverage that makes people wish they were there.</h2>
        <p>From promo reels to interviews and aftermovies, we turn live moments into media people keep sharing.</p>
        <a data-link class="button primary" href="/join">Book Event Coverage</a>
      </div>
      <div class="service-grid">${eventServices.map((service) => `<article>${service}</article>`).join("")}</div>
    </section>

    ${sectionHeader("Upcoming / Coverage", "Live formats, event services, and the next Just Try moments.")}
    <section class="stack">${events.map(eventCard).join("")}</section>

    <section class="split-band">
      <div>
        <p class="eyebrow">Work With Us</p>
        <h2>Join the media team, tell your story, or book coverage.</h2>
        <p>Hosts, editors, videographers, designers, writers, marketers, creators, founders, and event organisers all have a place here.</p>
        <a data-link class="button primary" href="/join">Apply to Join</a>
      </div>
      <div>
        <p class="eyebrow">Start Here</p>
        <h2>${collaborationPaths.join(". ")}.</h2>
        <p>Bring a launch, event, person, project, business, or early idea. We shape it into watchable media.</p>
        <a data-link class="button secondary" href="/join#collaborate">Start a Collaboration</a>
      </div>
    </section>
  `);
}

function sectionHeader(title, text) {
  return `<div class="section-heading"><p class="eyebrow">${title}</p><h2>${text}</h2></div>`;
}

function seriesCard(item, index) {
  const status = item.status || "Coming Soon";
  return `
    <article class="series-card">
      <div class="series-poster tone-${(index % 6) + 1}">
        <span>${String(index + 1).padStart(2, "0")}</span>
        <strong>${item.title}</strong>
      </div>
      <div>
        <p class="eyebrow">${item.category || "Original Series"}</p>
        <h3>${item.title}</h3>
        <p>${item.description || item.excerpt || "A Just Try original format in development."}</p>
        <span class="status-badge">${status}</span>
      </div>
    </article>
  `;
}

function listingPage(kind) {
  const titleMap = {
    "/stories": ["Stories", "Creator stories, founder stories, blogs, features, and culture pieces."],
    "/shows": ["Shows", "Original formats, conversations, challenges, diaries, and recurring series."],
    "/events": ["Events", "Upcoming events, event films, and coverage services."]
  };
  const [title, intro] = titleMap[route()] || titleMap["/stories"];
  const items = route() === "/events"
    ? state.events
    : state.content.filter((item) => kind.includes(item.type) || kind.includes(item.category));
  const fallback = route() === "/events" ? fallbackEvents : fallbackFeatured;

  return shell(`
    <section class="page-hero">
      <p class="eyebrow">Just Try Media</p>
      <h1>${title}</h1>
      <p>${intro}</p>
    </section>
    <section class="${route() === "/events" ? "stack" : "grid three"}">
      ${(items.length ? items : fallback).map(route() === "/events" ? eventCard : contentCard).join("")}
    </section>
  `);
}

function aboutPage() {
  return shell(`
    <section class="page-hero compact">
      <p class="eyebrow">About</p>
      <h1>A media hub for the attempt, not just the arrival.</h1>
      <p>Just Try Media documents people, cultures, communities, events, and early-stage ambition with cinematic care and editorial taste.</p>
    </section>
    <section class="about-grid">
      <article><h3>Editorial</h3><p>We care about story, rhythm, honesty, and the details that make people feel real.</p></article>
      <article><h3>Cinematic</h3><p>Films, photos, shows, and digital-first formats that look considered without feeling distant.</p></article>
      <article><h3>Youthful</h3><p>A voice built for creators, students, founders, communities, and people making their first serious moves.</p></article>
    </section>
  `);
}

function joinPage() {
  return shell(`
    <section class="page-hero compact">
      <p class="eyebrow">Work With Us</p>
      <h1>Join the team, tell your story, or book event coverage.</h1>
      <p>Apply to join the media team or send a collaboration request for a story, event, creator, artist, brand, or founder project.</p>
    </section>
    <section class="form-grid">
      ${formShell("join-form", "Join the Hub", ["name", "email", "role", "location", "portfolio_url", "message"])}
      ${formShell("collab-form", "Collaborate", ["name", "email", "project_type", "budget_range", "timeline", "message"])}
    </section>
  `);
}

function formShell(id, title, fields) {
  return `
    <form class="panel-form" id="${id}">
      <h2>${title}</h2>
      ${fields.map((field) => field === "message"
        ? `<label>${label(field)}<textarea name="${field}" rows="5" required></textarea></label>`
        : `<label>${label(field)}<input name="${field}" ${field === "email" ? "type=\"email\"" : "type=\"text\""} ${["name", "email"].includes(field) ? "required" : ""}></label>`
      ).join("")}
      <button class="button primary" type="submit">Submit</button>
      <p class="form-status" aria-live="polite"></p>
    </form>
  `;
}

function label(name) {
  return name.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDate(value) {
  if (!value) return "New";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function statusClass(status = "new") {
  if (["published", "active"].includes(status)) return "published";
  if (["draft", "planned", "paused"].includes(status)) return "draft";
  if (["archived"].includes(status)) return "archived";
  return "new";
}

async function submitForm(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const status = form.querySelector(".form-status");
  const data = Object.fromEntries(new FormData(form));

  if (!supabaseReady) {
    status.textContent = "Supabase is not connected yet. Add your project URL/key to enable submissions.";
    return;
  }

  const table = form.id === "join-form" ? "team_applications" : "collaboration_requests";
  const { error } = await supabase.from(table).insert(data);
  status.textContent = error ? error.message : "Submitted. We will review it from the admin dashboard.";
  if (!error) form.reset();
}

async function adminPage() {
  if (!supabaseReady) {
    return adminShell(`
      <section class="admin-login-card">
        <p class="eyebrow">Admin setup</p>
        <h1>Connect Supabase to enable the dashboard.</h1>
        <p>Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_PUBLISHABLE_KEY</code>, apply the SQL migration, then redeploy.</p>
      </section>
    `, true);
  }

  const { data } = await supabase.auth.getSession();
  state.session = data.session;
  if (!state.session) return adminShell(loginView(), true);

  const { data: profile, error: profileError } = await supabase
    .from("admin_profiles")
    .select("role")
    .eq("user_id", state.session.user.id)
    .maybeSingle();
  state.adminProfile = profile;
  if (profileError || profile?.role !== "admin") {
    return adminShell(`
      <section class="admin-login-card">
        <p class="eyebrow">Admin</p>
        <h1>Signed in, but not authorised.</h1>
        <p>${profileError ? profileError.message : "This account is not listed as a Just Try Media admin."}</p>
        <button class="button secondary" data-logout>Logout</button>
      </section>
    `, true);
  }

  await loadAdminData();
  return adminShell(dashboardView());
}

function loginView() {
  return `
    <section class="admin-login-card">
      <p class="eyebrow">Admin</p>
      <h1>Sign in to manage Just Try Media.</h1>
      <p>Manage stories, videos, series, events, applications, collaborations, and uploads from one bright CMS workspace.</p>
      <form class="panel-form admin-login-form" id="login-form">
        <label>Email<input name="email" type="email" autocomplete="email" required></label>
        <label>Password<input name="password" type="password" autocomplete="current-password" required></label>
        <div class="admin-form-actions">
          <button class="button primary" type="submit">Login</button>
          <button class="button secondary" type="button" data-magic-link>Send Magic Link</button>
          <button class="button ghost" type="button" data-reset-password>Reset Password</button>
        </div>
        <p class="form-status" aria-live="polite"></p>
      </form>
    </section>
  `;
}

function dashboardView() {
  const published = state.content.filter((item) => item.status === "published").length;
  const drafts = state.content.filter((item) => item.status !== "published").length;
  const events = state.events.length;
  const joinRequests = state.applications.length;
  const collaborationRequests = state.collaborations.length;
  return `
    <section class="admin-dashboard">
      <div class="admin-title-row">
        <div>
          <p class="eyebrow">Dashboard</p>
          <h1>Just Try Media control room.</h1>
          <p>Write posts, publish stories, manage requests, and keep the media hub moving.</p>
        </div>
        <a class="button primary" href="#content">Create Post</a>
      </div>
      <nav class="admin-tabs" aria-label="Admin sections">
        ${["Dashboard", "Content", "Series", "Events", "Join Requests", "Collaborations"].map((item, index) => `<a href="#${item.toLowerCase().replaceAll(" ", "-")}" class="${index === 0 ? "active" : ""}">${item}</a>`).join("")}
      </nav>
      ${state.adminNotice ? `<div class="admin-notice ${state.adminNotice.type}">${state.adminNotice.message}</div>` : ""}
      ${state.adminErrors.length ? `<div class="admin-notice error"><strong>Admin Data Warning:</strong> ${state.adminErrors.join(" ")}</div>` : ""}
    </section>
    <section class="stats">
      <article><span>${published}</span><p>Published Content</p></article>
      <article><span>${drafts}</span><p>Drafts</p></article>
      <article><span>${events}</span><p>Events</p></article>
      <article><span>${joinRequests}</span><p>Join Requests</p></article>
      <article><span>${collaborationRequests}</span><p>Collaborations</p></article>
    </section>
    <section class="admin-grid">
      <div class="admin-panel wide" id="dashboard">
        <h2>Account Access</h2>
        <p class="admin-helper">Update the current admin password after signing in with a reset or magic link.</p>
        <form class="mini-form" id="password-update-form">
          <input name="password" type="password" minlength="8" placeholder="New Password">
          <button class="button secondary" type="submit">Update Password</button>
          <p class="form-status" aria-live="polite"></p>
        </form>
      </div>
      ${contentManager()}
      ${eventManager()}
      ${seriesManager()}
      ${requestManager("Join Requests", state.applications, "join-requests", ["name", "email", "role", "location", "portfolio_url", "message"])}
      ${requestManager("Collaborations", state.collaborations, "collaborations", ["name", "email", "project_type", "budget_range", "timeline", "message"])}
    </section>
  `;
}

function contentManager() {
  return `
    <div class="admin-panel wide cms-editor" id="content">
      <div class="admin-section-head">
        <div>
          <p class="eyebrow">Content</p>
          <h2>Create stories, posts, videos, and features</h2>
        </div>
        <span class="count-pill">${state.content.length} items</span>
      </div>
      <form class="mini-form content-editor" id="content-form">
        <label class="field-title">Title<input name="title" placeholder="Story headline"></label>
        <div class="form-row three">
          <label>Slug<input name="slug" placeholder="story-slug"></label>
          <label>Type<select name="type">${["documentary", "show", "event", "blog", "feature", "short"].map((x) => `<option>${x}</option>`).join("")}</select></label>
          <label>Status<select name="status"><option>draft</option><option>published</option></select></label>
        </div>
        <div class="form-row two">
          <label>Category<input name="category" placeholder="Creator Stories"></label>
          <label>External Link<input name="external_link" placeholder="https://"></label>
        </div>
        <label>Excerpt<textarea name="excerpt" rows="3" placeholder="Short summary for cards and listings"></textarea></label>
        <label>Body<textarea name="body" rows="9" placeholder="Write the full story, notes, interview summary, or post body"></textarea></label>
        <div class="form-row two">
          <label>Video URL<input name="video_url" placeholder="YouTube, TikTok, Vimeo, etc."></label>
          <label>Thumbnail URL<input name="thumbnail_image" placeholder="Optional existing image URL/path"></label>
        </div>
        <label class="upload-card">
          <span>Upload Thumbnail</span>
          <strong>Drop in a poster, cover image, or story thumbnail.</strong>
          <input name="thumbnail_file" type="file" accept="image/*">
          <img class="upload-preview" alt="">
        </label>
        <label class="check"><input type="checkbox" name="featured"> Mark as featured on the public site</label>
        <div class="admin-form-actions">
          <button class="button secondary" type="submit" data-save-status="draft">Save Draft</button>
          <button class="button primary" type="submit" data-save-status="published">Publish</button>
        </div>
        <p class="form-status" aria-live="polite"></p>
      </form>
      ${tableList(state.content, "content_items", "No stories yet. Create your first story.")}
    </div>
  `;
}

function eventManager() {
  return `
    <div class="admin-panel" id="events">
      <div class="admin-section-head">
        <div>
          <p class="eyebrow">Events</p>
          <h2>Events and coverage</h2>
        </div>
        <span class="count-pill">${state.events.length} events</span>
      </div>
      <form class="mini-form" id="event-form">
        <label class="field-title">Title<input name="title" placeholder="Event title"></label>
        <div class="form-row two">
          <label>Slug<input name="slug" placeholder="event-slug"></label>
          <label>Date<input name="date" type="date"></label>
        </div>
        <div class="form-row two">
          <label>Location<input name="location" placeholder="Venue / city"></label>
          <label>Status<select name="status"><option>planned</option><option>published</option><option>archived</option></select></label>
        </div>
        <label>Description<textarea name="description" rows="7" placeholder="Describe the event, coverage offer, or recap"></textarea></label>
        <label>Ticket / Contact Link<input name="ticket_link" placeholder="https://"></label>
        <label>Poster URL<input name="poster_image" placeholder="Optional existing image URL/path"></label>
        <label class="upload-card">
          <span>Upload Poster</span>
          <strong>Add an event poster, promo visual, or cover image.</strong>
          <input name="poster_file" type="file" accept="image/*">
          <img class="upload-preview" alt="">
        </label>
        <div class="admin-form-actions">
          <button class="button secondary" type="submit" data-save-status="planned">Save Event</button>
          <button class="button primary" type="submit" data-save-status="published">Publish Event</button>
        </div>
        <p class="form-status" aria-live="polite"></p>
      </form>
      ${tableList(state.events, "events", "No events yet. Add the next Just Try moment.")}
    </div>
  `;
}

function seriesManager() {
  return `
    <div class="admin-panel" id="series">
      <div class="admin-section-head">
        <div>
          <p class="eyebrow">Series</p>
          <h2>Original formats</h2>
        </div>
        <span class="count-pill">${state.series.length} series</span>
      </div>
      <form class="mini-form" id="series-form">
        <label class="field-title">Title<input name="title" placeholder="Series title"></label>
        <div class="form-row two">
          <label>Slug<input name="slug" placeholder="series-slug"></label>
          <label>Status<select name="status"><option>planned</option><option>active</option><option>paused</option></select></label>
        </div>
        <label>Description<textarea name="description" rows="7" placeholder="What this recurring series is about"></textarea></label>
        <label>Poster Image URL<input name="poster_image" placeholder="Optional existing image URL/path"></label>
        <label class="upload-card">
          <span>Upload Poster</span>
          <strong>Add a clean series poster or visual identity card.</strong>
          <input name="poster_file" type="file" accept="image/*">
          <img class="upload-preview" alt="">
        </label>
        <div class="admin-form-actions">
          <button class="button secondary" type="submit" data-save-status="planned">Save Series</button>
          <button class="button primary" type="submit" data-save-status="active">Make Active</button>
        </div>
        <p class="form-status" aria-live="polite"></p>
      </form>
      ${tableList(state.series, "series", "No series yet. Build the first original format.")}
    </div>
  `;
}

function tableList(items, table, emptyText) {
  if (!items.length) return `<div class="empty-state"><strong>${emptyText}</strong><p>Saved items will appear here for quick publishing and review.</p></div>`;
  return `<div class="admin-list">${items.slice(0, 8).map((item) => `
    <article>
      <div>
        <strong>${item.title || item.name}</strong>
        <small>${item.type || item.category || item.location || item.slug || "Just Try Media"}</small>
      </div>
      <span class="status-chip ${statusClass(item.status)}">${item.status || item.type || "new"}</span>
      ${["content_items", "events"].includes(table) ? `<button class="${item.status === "published" ? "danger-action" : ""}" data-toggle="${table}" data-id="${item.id}" data-status="${item.status === "published" ? "draft" : "published"}">${item.status === "published" ? "Unpublish" : "Publish"}</button>` : ""}
    </article>
  `).join("")}</div>`;
}

function requestManager(title, items, id, fields) {
  return `
    <div class="admin-panel wide" id="${id}">
      <div class="admin-section-head">
        <div>
          <p class="eyebrow">${title}</p>
          <h2>${title === "Join Requests" ? "People who want to join the hub" : "People who want to collaborate"}</h2>
        </div>
        <span class="count-pill">${items.length} requests</span>
      </div>
      ${items.length ? `<div class="request-table">${items.map((item) => requestRow(item, fields)).join("")}</div>` : `<div class="empty-state"><strong>${title === "Join Requests" ? "No join requests yet." : "No collaboration requests yet."}</strong><p>Public form submissions will appear here when they arrive.</p></div>`}
    </div>
  `;
}

function requestRow(item, fields) {
  const type = item.role || item.project_type || "New request";
  const created = formatDate(item.created_at);
  const email = item.email || "";
  return `
    <article class="request-row">
      <div><strong>${item.name || "Unnamed"}</strong><small>${type}</small></div>
      <div>${email ? `<a href="mailto:${email}">${email}</a>` : "<span>No email</span>"}<small>${item.location || item.timeline || "No timeline"}</small></div>
      <span class="status-chip new">New</span>
      <span>${created}</span>
      <details>
        <summary>View Details</summary>
        <div>${fields.map((field) => item[field] ? `<p><strong>${label(field)}:</strong> ${item[field]}</p>` : "").join("")}</div>
      </details>
    </article>
  `;
}

async function handleAdminSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const status = form.querySelector(".form-status");
  const submitter = event.submitter;
  const data = Object.fromEntries(new FormData(form));
  const formData = new FormData(form);
  if (submitter?.dataset.saveStatus) data.status = submitter.dataset.saveStatus;
  if (data.featured === "on") data.featured = true;
  if (!("featured" in data) && form.id === "content-form") data.featured = false;
  if (form.id === "content-form" && !data.published_date && data.status === "published") data.published_date = new Date().toISOString();

  const table = { "content-form": "content_items", "event-form": "events", "series-form": "series" }[form.id];
  const uploadField = form.id === "content-form" ? "thumbnail_file" : "poster_file";
  const storageColumn = form.id === "content-form" ? "thumbnail_image" : "poster_image";
  status.textContent = "Saving...";
  const uploadedPath = await uploadMediaFile(formData.get(uploadField), table);
  if (uploadedPath === null) {
    status.textContent = "Upload failed. Try again.";
    return;
  }
  if (uploadedPath) data[storageColumn] = uploadedPath;
  delete data.thumbnail_file;
  delete data.poster_file;

  const { error } = await supabase.from(table).insert(data);
  if (error) {
    status.textContent = error.message;
    state.adminNotice = { type: "error", message: error.message };
    return;
  }
  const message = data.status === "published" || data.status === "active" ? "Published successfully." : "Saved successfully.";
  state.adminNotice = { type: "success", message };
  form.reset();
  render();
}

async function uploadMediaFile(file, folder) {
  if (!file || !file.name || !file.size) return "";
  const safeName = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-");
  const path = `${folder}/${crypto.randomUUID()}-${safeName}`;
  const { error } = await supabase.storage.from("media").upload(path, file, {
    cacheControl: "3600",
    upsert: false
  });
  if (error) {
    state.adminNotice = { type: "error", message: "Upload failed. Try again." };
    return null;
  }
  return path;
}

async function handleLogin(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const status = form.querySelector(".form-status");
  const data = Object.fromEntries(new FormData(form));
  status.textContent = "Checking login...";
  const { error } = await supabase.auth.signInWithPassword(data);
  status.textContent = error ? error.message : "Logged in.";
  if (!error) render();
}

async function handleMagicLink(button) {
  const form = button.closest("form");
  const status = form.querySelector(".form-status");
  const email = new FormData(form).get("email");
  if (!email) {
    status.textContent = "Enter your admin email first.";
    return;
  }
  status.textContent = "Sending magic link...";
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${window.location.origin}/admin` }
  });
  status.textContent = error ? error.message : "Magic link sent. Check your email, then open the link.";
}

async function handlePasswordReset(button) {
  const form = button.closest("form");
  const status = form.querySelector(".form-status");
  const email = new FormData(form).get("email");
  if (!email) {
    status.textContent = "Enter your admin email first.";
    return;
  }
  status.textContent = "Sending password reset...";
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/admin`
  });
  status.textContent = error ? error.message : "Password reset email sent.";
}

async function handlePasswordUpdate(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const status = form.querySelector(".form-status");
  const password = new FormData(form).get("password");
  if (!password || password.length < 8) {
    status.textContent = "Password must be at least 8 characters.";
    return;
  }
  status.textContent = "Updating password...";
  const { error } = await supabase.auth.updateUser({ password });
  status.textContent = error ? error.message : "Password updated.";
  if (!error) form.reset();
}

async function toggleStatus(button) {
  const { error } = await supabase.from(button.dataset.toggle).update({ status: button.dataset.status }).eq("id", button.dataset.id);
  if (error) {
    state.adminNotice = { type: "error", message: error.message };
    render();
    return;
  }
  state.adminNotice = { type: "success", message: button.dataset.status === "published" ? "Published successfully." : "Unpublished successfully." };
  render();
}

async function render() {
  await loadPublicData();
  const current = route();
  let view = homePage();
  if (current === "/stories") view = listingPage(["blog", "feature", "short", "Creator Stories", "Founder Stories", "Culture"]);
  if (current === "/shows") view = listingPage(["show", "documentary"]);
  if (current === "/events") view = listingPage(["event"]);
  if (current === "/about") view = aboutPage();
  if (current === "/join") view = joinPage();
  if (current === "/admin") view = await adminPage();
  app.innerHTML = view;
  bind();
}

function bind() {
  document.querySelectorAll("[data-link]").forEach((link) => link.addEventListener("click", (event) => {
    if (link.host === location.host) {
      event.preventDefault();
      go(link.getAttribute("href"));
    }
  }));
  document.querySelector("[data-menu]")?.addEventListener("click", () => document.querySelector(".nav")?.classList.toggle("open"));
  document.querySelectorAll("#join-form, #collab-form").forEach((form) => form.addEventListener("submit", submitForm));
  document.querySelector("#login-form")?.addEventListener("submit", handleLogin);
  document.querySelector("[data-magic-link]")?.addEventListener("click", (event) => handleMagicLink(event.currentTarget));
  document.querySelector("[data-reset-password]")?.addEventListener("click", (event) => handlePasswordReset(event.currentTarget));
  document.querySelector("#password-update-form")?.addEventListener("submit", handlePasswordUpdate);
  document.querySelectorAll("#content-form, #event-form, #series-form").forEach((form) => form.addEventListener("submit", handleAdminSubmit));
  document.querySelectorAll("input[type='file']").forEach((input) => input.addEventListener("change", showUploadPreview));
  document.querySelector("[data-logout]")?.addEventListener("click", async () => {
    await supabase.auth.signOut();
    render();
  });
  document.querySelectorAll("[data-toggle]").forEach((button) => button.addEventListener("click", () => toggleStatus(button)));
}

function showUploadPreview(event) {
  const input = event.currentTarget;
  const preview = input.closest(".upload-card")?.querySelector(".upload-preview");
  const file = input.files?.[0];
  if (!preview || !file) return;
  preview.src = URL.createObjectURL(file);
  preview.style.display = "block";
}

window.addEventListener("popstate", render);
render();
