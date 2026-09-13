# Graph Report - laliga-fantasy  (2026-09-13)

## Corpus Check
- 82 files · ~148,453 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: .css 2, (none) 1)

## Summary
- 321 nodes · 466 edges · 26 communities (15 shown, 8 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 14 edges (avg confidence: 0.8)
- Token cost: 281,865 input · 49,739 output

## Community Hubs (Navigation)
- Fantasy Team Frontend
- Clerk Orgs Skill Docs
- Frontend Package Config
- React Auth Template Config
- Clerk CLI Skill Docs
- Clerk Setup/Testing/Webhooks
- Clerk Custom UI & React Skills
- Mock Player Data & Pitch UI
- React Auth Hooks & Routing
- Price/Points Scraper
- Team API (Neon/Clerk backend)
- Scraper Price History Merge
- React Template tsconfig
- Oxlint Config
- Custom Sign-in/up Flows
- React Auth Template Entry
- Clerk API Specs Script
- Clerk Execute Request Script
- Clerk Extract Endpoint Script
- Clerk Extract Tag Endpoints Script
- Favicon Asset
- Icon Sprite Asset
- Hero Banner Asset

## God Nodes (most connected - your core abstractions)
1. `formatEuros()` - 13 edges
2. `currentPrice()` - 12 edges
3. `todayDelta()` - 11 edges
4. `Clerk CLI Skill` - 11 edges
5. `Clerk Organizations Skill` - 11 edges
6. `TeamCrest()` - 9 edges
7. `compilerOptions` - 8 edges
8. `TeamView()` - 8 edges
9. `verifyWebhook(req)` - 8 edges
10. `Clerk Custom UI Skill` - 7 edges

## Surprising Connections (you probably didn't know these)
- `JSON_VAR_CANDIDATES / normalize_from_json() detection strategy` --semantically_similar_to--> `Auth Migration Process`  [INFERRED] [semantically similar]
  scraper/README.md → .agents/skills/clerk-setup/SKILL.md
- `react-basic-auth template index.html` --semantically_similar_to--> `index.html (front-end entry)`  [INFERRED] [semantically similar]
  .agents/skills/clerk-react-patterns/templates/react-basic-auth/index.html → index.html
- `clerk users list/create` --semantically_similar_to--> `Backend API Fast Path Operations`  [INFERRED] [semantically similar]
  .agents/skills/clerk-cli/references/recipes.md → .agents/skills/clerk-backend-api/SKILL.md
- `Clerk Organizations Skill` --references--> `Clerk React Patterns Skill`  [AMBIGUOUS]
  .agents/skills/clerk-orgs/SKILL.md → .agents/skills/clerk-react-patterns/SKILL.md
- `Scraper README (futbolfantasy.com)` --references--> `Actualizar precios LaLiga Fantasy (GitHub Actions workflow)`  [EXTRACTED]
  scraper/README.md → .github/workflows/update-prices.yml

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Metadata Replace-Not-Merge Pattern Across Clerk Resources** — agents_skills_clerk_backend_api_skill_metadataoverwritenotmerge, agents_skills_clerk_orgs_skill_metadatareplace, agents_skills_clerk_backend_api_skill_metadatatypes [INFERRED 0.85]
- **Agent-Mode Mutation Safety Pattern (dry-run, yes, sandbox warning)** — agents_skills_clerk_cli_skill_sandboxwarning, agents_skills_clerk_cli_references_agent_mode_agentmodedetection, agents_skills_clerk_backend_api_skill_writeconfirmationchecks, agents_skills_clerk_cli_skill_clerkapi [INFERRED 0.85]
- **Org Authorization Enforcement Surfaces (has, Show, protect, permissions)** — agents_skills_clerk_orgs_skill_hasfunction, agents_skills_clerk_custom_ui_core_3_show_component_showcomponent, agents_skills_clerk_orgs_references_nextjs_patterns_authprotect, agents_skills_clerk_orgs_references_roles_permissions_systempermissionscatalog [EXTRACTED 0.95]
- **Cross-framework verifyWebhook signature verification pattern** — clerk_webhooks_verifywebhook, clerk_webhooks_frameworks_express, clerk_webhooks_frameworks_astro, clerk_webhooks_frameworks_fastify, clerk_webhooks_frameworks_nuxt, clerk_webhooks_frameworks_reactrouter, clerk_webhooks_frameworks_tanstack [EXTRACTED 0.95]
- **Nightly scraper-to-frontend data pipeline** — github_workflows_update_prices_yml, scraper_scrape_market, scraper_scrape_points, scraper_merge_history, jugadores_json, src_hooks_useplayers [EXTRACTED 0.90]
- **Clerk React auth hooks used across route guards** — agents_skills_clerk_react_patterns_references_hooks_useauth, agents_skills_clerk_react_patterns_references_protected_routes_component, agents_skills_clerk_react_patterns_references_protected_routes_orgroute, agents_skills_clerk_react_patterns_references_router_integration_clerkprovider_position [INFERRED 0.85]

## Communities (26 total, 8 thin omitted)

### Community 0 - "Fantasy Team Frontend"
Cohesion: 0.10
Nodes (34): recharts, App(), Market(), SORTERS, TeamSelect(), PlayerDetail(), PlayerRow(), reasonLabel() (+26 more)

### Community 1 - "Clerk Orgs Skill Docs"
Cohesion: 0.07
Nodes (32): Clerk Backend API Skill, clerkClient (Backend SDK), Backend API Fast Path Operations, Metadata Overwrite Not Merge Gotcha, Clerk Metadata Types (public/private/unsafe), Mandatory Write Confirmation Checks, Instance Configuration (config pull/patch/put), Organizations via clerk api (+24 more)

### Community 2 - "Frontend Package Config"
Cohesion: 0.06
Nodes (30): dependencies, @clerk/backend, @clerk/react, @neondatabase/serverless, react, react-dom, recharts, devDependencies (+22 more)

### Community 3 - "React Auth Template Config"
Cohesion: 0.08
Nodes (24): dependencies, @clerk/react, react, react-dom, devDependencies, @types/react, @types/react-dom, typescript (+16 more)

### Community 4 - "Clerk CLI Skill Docs"
Cohesion: 0.10
Nodes (22): Agent Mode Detection, Clerk CLI Agent Mode Reference, Deploy Handoff and Verification Flow, CLI Exit Codes, --input-json Flag, Clerk CLI Auth & Targeting Reference, clerk auth login, Backend API (BAPI) (+14 more)

### Community 5 - "Clerk Setup/Testing/Webhooks"
Cohesion: 0.13
Nodes (19): clerk-setup Skill, clerk-testing Skill, clerk-webhooks Skill, clerk CLI, clerk init command, Framework Detection via package.json, Auth Migration Process, Framework-Specific Webhook Handlers reference (+11 more)

### Community 6 - "Clerk Custom UI & React Skills"
Cohesion: 0.13
Nodes (20): isClerkAPIResponseError, useSignIn Hook (Core 2), useSignUp Hook (Core 2), Device Trust (needs_client_trust), signIn.finalize(), useSignIn Hook (Core 3 / Current SDK), signUp.finalize(), Transferable Sign-Up (+12 more)

### Community 7 - "Mock Player Data & Pitch UI"
Cohesion: 0.14
Nodes (16): LaLiga Fantasy Estadísticas README, Mi equipo (localStorage team feature), Scraper README (futbolfantasy.com), LINE_Y, LINES, Pitch(), slotsForLine(), BASE_PLAYERS (+8 more)

### Community 8 - "React Auth Hooks & Routing"
Cohesion: 0.12
Nodes (17): getToken() for API calls, isLoaded Guard pattern, Hooks reference (clerk-react-patterns), useAuth(), useClerk(), ProtectedRoute Component, Protected Routes reference (clerk-react-patterns), OrgRoute Component (+9 more)

### Community 9 - "Price/Points Scraper"
Cohesion: 0.17
Nodes (13): beautifulsoup4>=4.12, Actualizar precios LaLiga Fantasy (GitHub Actions workflow), requests>=2.31, parse_table() fallback strategy, fetch_html(), _int_or_none(), main(), parse_table() (+5 more)

### Community 10 - "Team API (Neon/Clerk backend)"
Cohesion: 0.27
Nodes (10): clerkClient, getClerkUserId(), handler(), sql, ensureUserAndTeam(), getSquadIds(), handler(), sql (+2 more)

### Community 11 - "Scraper Price History Merge"
Cohesion: 0.29
Nodes (11): jugadores.json (canonical data file), Path, load_canonical(), main(), merge_market(), merge_points(), Fusiona los scrapes del día (data/raw/mercado_YYYY-MM-DD.json y, si existe,…, Inserta/reemplaza un punto por fecha exacta (idempotente ante re-ejecuciones). (+3 more)

### Community 12 - "React Template tsconfig"
Cohesion: 0.20
Nodes (9): compilerOptions, esModuleInterop, jsx, module, moduleResolution, skipLibCheck, strict, target (+1 more)

### Community 13 - "Oxlint Config"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 14 - "Custom Sign-in/up Flows"
Cohesion: 0.50
Nodes (4): Email Verification flow, Custom Flows reference (clerk-react-patterns), useSignIn hook / CustomSignIn, useSignUp hook / CustomSignUp

## Ambiguous Edges - Review These
- `Clerk Organizations Skill` → `Clerk React Patterns Skill`  [AMBIGUOUS]
  .agents/skills/clerk-orgs/SKILL.md · relation: references

## Knowledge Gaps
- **104 isolated node(s):** `api-specs-context.sh script`, `execute-request.sh script`, `extract-endpoint-detail.sh script`, `extract-tag-endpoints.sh script`, `name` (+99 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 138 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Clerk Organizations Skill` and `Clerk React Patterns Skill`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **Why does `recharts` connect `Fantasy Team Frontend` to `Frontend Package Config`?**
  _High betweenness centrality (0.120) - this node is a cross-community bridge._
- **Why does `Scraper README (futbolfantasy.com)` connect `Mock Player Data & Pitch UI` to `Price/Points Scraper`, `Scraper Price History Merge`?**
  _High betweenness centrality (0.116) - this node is a cross-community bridge._
- **Why does `clerk-setup Skill` connect `Clerk Setup/Testing/Webhooks` to `React Auth Hooks & Routing`?**
  _High betweenness centrality (0.066) - this node is a cross-community bridge._
- **What connects `api-specs-context.sh script`, `execute-request.sh script`, `extract-endpoint-detail.sh script` to the rest of the system?**
  _104 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Fantasy Team Frontend` be split into smaller, more focused modules?**
  _Cohesion score 0.10407239819004525 - nodes in this community are weakly interconnected._
- **Should `Clerk Orgs Skill Docs` be split into smaller, more focused modules?**
  _Cohesion score 0.07007575757575757 - nodes in this community are weakly interconnected._