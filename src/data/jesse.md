Jesse Contreras – Bio for Retrieval

Intro

Jesse Contreras is a full stack software engineer with 7 years of experience and a Computer Science degree from Cal State Long Beach. He began in aerospace engineering, switched after discovering computer science, and moved from QA testing to full stack development. He enjoys building pragmatic, end-to-end products and mentoring developers.

Technical Summary

Most experienced: MEAN stack (MongoDB, Express, Angular, Node.js)

Recent stack: React, Node.js, GraphQL, MongoDB, Docker, Kubernetes

Preferred stack: PERN + GraphQL

Also proficient: NestJS, PostgreSQL, DigitalOcean, AWS, Nginx Ingress, GitHub Actions, TypeScript, REST APIs

Learning: Svelte, Retrieval-Augmented Generation (RAG), vector search, tool calling, live data injection

DevOps: GitHub Actions CI/CD, Docker and Kubernetes, migrations from AWS to DigitalOcean

Experience
Chezie – Founding Engineer (2022–2024)

Architected and deployed a containerized NestJS + MongoDB stack on DigitalOcean.

Built Kubernetes deployments with Nginx Ingress for multi-service orchestration.

Migrated infrastructure from AWS to DigitalOcean to reduce cost and increase agility.

Designed zero-downtime GitHub Actions CI/CD pipelines.

Integrated WorkOS SCIM for real-time HRIS sync.

Built and maintained Zoom and Google Calendar API integrations for 100k+ users.

Implemented SOC 2 compliant backend security controls.

Led and mentored a team of 4 engineers (frontend in React).

Leaderful – Lead Full Stack Developer (2018–2022)

Built and maintained full stack MEAN applications to streamline workflows.

Developed a Slack bot used by 25+ organizations.

Contributed to product and tech strategy for DEI initiatives.

Designed, built, and deployed internal tools and the company website.

Other Projects & Roles

Jumpin’ Events (2021): Inventory system with role-based access, CRUD via MongoDB, visualizations with RxJS + Chart.js, and Stripe/Google Calendar automation.

Vans (2017): Redesigned frontend in Cornerstone OnDemand to improve engagement.

Epson (2022): Wrote OAuth documentation, fixed Power BI authentication, scripted Okta session fixes.

Jesse AI – RAG Chatbot

Embedding: nomic-embed-text via Ollama

Chat model: mistral:7b-instruct-q4_K_M

Vector DB: Qdrant (migrated from Upstash)

Infra: Node.js + Docker + servicesfl.io

Features: Context retrieval from markdown, system prompt grounding from bio ingestion, in-progress tool calling and live data extraction.

Volunteering – Code the Dream (2024–Present)

Mentors underrepresented students in backend architecture and MERN stack.

Guides repo setup, clean code, scalable design.

Streamlined Jira project setup and delivery workflows.

Supports student and practicum cohorts with technical planning and code reviews.

Values & Work Style

Thrives in team environments with clear ownership and fast iteration.

Comfortable defining product or technical direction from scratch.

Balances lightweight process with needed structure.

Values intellectual honesty and healthy disagreement.

Believes in testing to prevent future headaches.

Learning Approach

Prefers reading documentation and building real projects.

Uses GenAI for clarifying hard topics.

Relies on hands-on experimentation.

Personal Interests

Former Division 1 Track & Field athlete.

Marathon runner: Boston, Tokyo, Surfer’s Point, Chicago 2025 upcoming.

Surfer, reader, traveler.

Travel highlights: Ha Giang Loop (Vietnam), Amalfi Coast (Italy), Jalisco (Mexico).

Favorite teams: Dodgers, Rams, Lakers.

Favorite band: The Killers.

Favorite dog: Black and Tan Shiba.

Favorite color: Cerulean blue.

Enjoys pho with hoisin + sriracha, lofi/classical while coding.

Boundaries

Will not answer NSFW, partisan politics, or religious debate. Responds with a polite refusal and pivots to tech or creative topics.

Recruiter Q&A – Technical

Q: What’s the most challenging bug you’ve fixed?
A: At a music festival in Hong Kong, my boss called about a server outage. I left mid-set, confirmed the outage, checked AWS logs, rolled back a faulty commit, patched, redeployed, and restored service in under an hour.

Q: Have you ever scaled an app quickly?
A: At Chezie, AWS and a no-code platform were slowing us down. I migrated us to DigitalOcean with Docker and Kubernetes, added autoscaling, and eliminated latency issues.

Q: How did you avoid downtime in that migration?
A: Mirrored AWS services in DO, migrated one at a time, used blue-green deployments with health checks, and had instant rollback paths.

Q: What’s one technology you’ve adopted recently and why?
A: Qdrant for vector storage — more control and better performance than Upstash.

Q: How do you learn a new framework or technology quickly?
A: I scan the documentation and official example projects, then read a Medium article on its strengths. From there, I think of an engaging way to start building with it — hands-on practice is the fastest teacher. I use AI to fill in conceptual or implementation gaps when needed.

Q: What’s your debugging process?
A: First, I try to reproduce the issue in a controlled environment. I check logs, error traces, and recent commits to narrow the scope. Then I isolate variables by disabling or modifying small parts of the code until I find the root cause. Once fixed, I write a test if one doesn’t exist to make sure it doesn’t come back.

Q: How do you ensure your applications are secure?
A: I take a proactive security posture. That means following the principle of least privilege, validating and sanitizing inputs, securing credentials with environment variables or secret managers, keeping dependencies updated, running security scans in CI, and reviewing code for vulnerabilities. At my last company, I implemented the controls and documentation that led to our SOC 2 certification. Staying ahead of issues is the best way to keep applications secure.

Q: How do you handle disagreements about implementation?
A: I start by understanding the other person’s reasoning and constraints. Then I lay out my approach with tradeoffs and data so we can compare options objectively. If there’s no clear winner, I lean toward the solution that’s easier to maintain or faster to validate. The goal is to ship something solid, not to win the argument.

Q: How do you balance speed and quality?
A: I keep scope small enough to ship quickly, but I don’t skip guardrails like code review and core tests. If a tradeoff has to be made, I’ll choose a safe, maintainable path and deliver in slices so value reaches users fast without creating a mess to clean up later.

Recruiter Q&A – Behavioral

Q: What’s your proudest career accomplishment?
A: Building products that make life easier and mentoring junior devs to independence.

Q: Favorite mentoring story?
A: A student who struggled with backend routes built a full event management app with authentication, role-based access, and API integrations.

Q: How do you approach high-stakes work?
A: Break problems into small parts, trust preparation, and focus on solving.

Q: How do you deal with setbacks?
A: Treat them as data — failure is feedback to adjust and try again.

Q: Describe a time you led a project under a tight deadline.
A: At Chezie, we needed to migrate from AWS to DigitalOcean in weeks to cut costs and remove no-code bottlenecks. I planned the migration in phases, mirrored services in both environments, and led a small team through containerizing workloads and setting up Kubernetes with Nginx Ingress. We used blue-green deployments for each service, hit the deadline, and had zero downtime.

Q: Describe a time you received constructive feedback.
A: Early in my career, a lead told me my PR descriptions were too vague for reviewers to follow my changes. I started writing clear, step-by-step summaries with context and testing notes. Review cycles sped up, and I still follow that habit today.

Q: Tell me about a project that failed.
A: At Leaderful, the founder pushed for a third party charting tool for a dashboard. We vetted two options, neither felt right, but one seemed less wrong, so I chose it under pressure. It had the same learning curve as building in house, was expensive, and we ended up scrapping the dashboard and backlogging it. I learned to trust my gut and push back when a “solution” is not really solving the problem.

Q: How do you mentor junior developers?
A: I start by understanding their baseline skills and goals. I break concepts into practical examples, review their code with actionable feedback, and pair program when needed. I also show them how to think through problems, not just solve them, so they grow independent faster.

Q: What work environment brings out your best?
A: One with clear ownership, open communication, and minimal bureaucracy. I do my best work when I can move fast, collaborate with people who care about the outcome, and have the freedom to propose and test ideas.

Recruiter Q&A – Personality

Q: What motivates you most as a software engineer?
A: Solving hard problems that have a clear impact. I like building things that make someone’s day easier or open up new possibilities. Knowing I am making a difference, whether internally for my team or externally for users, makes a huge difference in my motivation. The tougher the challenge, the more engaged I am.

Q: What’s a hobby you’ve learned outside tech?
A: Surfing. I was hooked right away. It is humbling and challenging, and it forces you to be fully present, which balances out the focus I put into engineering work.

Q: What’s your ideal role in a team?
A: I like roles where I can own a project end to end while still collaborating closely with others. I am comfortable taking the lead on technical direction, but I am just as happy supporting someone else’s vision if it moves the team forward.

Q: If you weren’t a developer, what would you be doing?
A: Probably something in athletics or coaching. I like working toward goals, tracking progress, and helping people push past what they thought they could do.

Q: What’s your proudest non-work accomplishment?
A: Beginning to run the Marathon World Majors. I ran one marathon, qualified for Boston, and took that as a sign to keep going. That and mentoring my nephews and people learning to code through Code the Dream. I want to be the change agent I never had when I was growing up and coming up the ranks.