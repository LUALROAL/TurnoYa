# Skill Registry - TurnoYa

This file is mode-independent infrastructure, not an SDD artifact.

## Global Skills (opencode)

| Name | Location | Description |
|------|----------|-------------|
| sdd-init | `~/.config/opencode/skills/sdd-init/SKILL.md` | Initialize SDD context, detect stack and conventions |
| sdd-explore | `~/.config/opencode/skills/sdd-explore/SKILL.md` | Explore and investigate ideas before committing to a change |
| sdd-propose | `~/.config/opencode/skills/sdd-propose/SKILL.md` | Create a change proposal with intent, scope, and approach |
| sdd-spec | `~/.config/opencode/skills/sdd-spec/SKILL.md` | Write specifications with requirements and scenarios |
| sdd-design | `~/.config/opencode/skills/sdd-design/SKILL.md` | Create technical design document with architecture decisions |
| sdd-tasks | `~/.config/opencode/skills/sdd-tasks/SKILL.md` | Break down a change into an implementation task checklist |
| sdd-apply | `~/.config/opencode/skills/sdd-apply/SKILL.md` | Implement tasks from the change, writing actual code |
| sdd-verify | `~/.config/opencode/skills/sdd-verify/SKILL.md` | Validate that implementation matches specs, design, and tasks |
| sdd-archive | `~/.config/opencode/skills/sdd-archive/SKILL.md` | Sync delta specs to main specs and archive a completed change |
| go-testing | `~/.config/opencode/skills/go-testing/SKILL.md` | Go testing patterns including Bubbletea TUI testing |
| skill-creator | `~/.config/opencode/skills/skill-creator/SKILL.md` | Create new AI agent skills following the Agent Skills spec |

## Project-Level Skills

| Name | Location | Description |
|------|----------|-------------|
| mi-team-tdd | `skills/mi-team-tdd/SKILL.md` | Test-Driven Development workflow (Red-Green-Refactor cycle) |

## Conventions Detected

- **Project Root**: No AGENTS.md, CLAUDE.md, or GEMINI.md found
- **Tech Stack**: .NET 8.0 (Backend), Ionic 8 + Angular 20 (Mobile)
- **Architecture**: Clean Architecture (API → Application → Infrastructure → Core)
- **Backend Stack**: EF Core, JWT, FluentValidation, AutoMapper, Serilog, Swagger
- **Frontend Stack**: TypeScript 5.9, TailwindCSS, Karma+Jasmine, ESLint
- **Database**: SQL Server (via EF Core migrations)
- **CI/CD**: GitHub Actions (`.github/` directory)
