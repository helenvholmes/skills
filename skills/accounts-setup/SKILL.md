---
name: accounts-setup
description: Get someone who is new to GitHub ready to build and ship a website with Claude Code — install the tools they're missing (git, the GitHub CLI, Node.js), sign them in to GitHub with the GitHub CLI, set their git name and email, and connect Claude to their Vercel account (and, if they want it, their GitHub account) through MCP. Use this whenever the user says they're new to GitHub or git, asks to "set up GitHub", "connect Vercel", "log in to GitHub", fix "gh: command not found" or "not logged in" errors, or is about to create their first repo or deploy, even if they only mention one of the two services.
---

# Accounts setup

The goal is a person who can save their work to GitHub and see it live on Vercel, who understands each step well enough to do it again, and who never had to paste a password or token into the chat.

Read `../audit/references/principles.md` first if it's there. The parts that matter most here: show changes before making them, make each one separately, and leave nothing behind the person didn't ask for.

## How to talk to the person

- Assume nothing about what they know. The first time a term comes up (repository, commit, push, branch, pull request, terminal, CLI, MCP, token), explain it in one plain sentence. `references/glossary.md` has wording to borrow. Don't explain it again after that.
- One step at a time. Say what the step is for, do it or tell them exactly what to do, then confirm it worked before moving on.
- When a step needs their hands (a browser sign-in, a password prompt, an installer window), tell them precisely what to type or click, then stop and wait. Don't guess that it worked; check.
- If something fails, say what happened in plain words before trying to fix it.

## Never handle secrets in the chat

- Never ask for a password, token, or one-time code. If the person offers one, tell them not to paste it, and if they already have, tell them to revoke it and make a new one (say where).
- Prefer browser sign-ins (OAuth) everywhere. They need no token at all.
- When a token truly can't be avoided, the person creates it and enters it in **a separate terminal window, not in Claude**. Anything typed into Claude Code, including a `!` command, becomes part of the conversation.
- Say where every credential ends up stored on their computer, and how to remove it.

## 1. See where they're starting

Run `scripts/check.sh` (from this skill's folder). It prints what's installed and what's signed in, and changes nothing. Read it back to the person in plain words ("You have git and Node, but not the GitHub CLI yet"), then only do the steps they still need. If they've done all of this before, finish in a minute.

Then ask, a few at a time:

1. Do you already have a GitHub account? If so, what's your username?
2. Do you have a Vercel account? If not, plan to sign up for one **with GitHub** (step 4), so the two are linked from the start.
3. What name do you want on your saved work? This shows publicly next to every change on GitHub. Most people use their real name; a handle is fine.
4. Should your code be public (anyone can see it, normal for portfolios and open source) or private?

Don't ask for their email address yet; step 3 suggests a private one.

## 2. Install what's missing

Required: **git**, the **GitHub CLI** (`gh`), and **Node.js** (the current LTS version). Detect the operating system and package manager, then:

| | macOS | Windows | Linux |
|---|---|---|---|
| With a package manager | `brew install git gh node` | `winget install --id Git.Git`, `winget install --id GitHub.cli`, `winget install --id OpenJS.NodeJS.LTS` | the distro's packages; for `gh`, follow cli.github.com, since distro versions are often old |
| Without | `xcode-select --install` gives git; get `gh` from cli.github.com and Node from nodejs.org | installers from git-scm.com, cli.github.com, nodejs.org | — |

You may run an install yourself when it needs no password and opens no window. Anything that asks for a password (`sudo`, an admin prompt) or opens an installer is the person's to run: give them the exact command or link and wait. If Homebrew isn't installed on a Mac, don't install it unasked; offer it or use the direct installers.

After installing, a new terminal window may be needed before the commands are found. Re-run `scripts/check.sh` to confirm.

## 3. Sign in to GitHub (required)

The GitHub CLI is how Claude creates repositories, saves work, and opens pull requests on the person's behalf. It signs in through the browser, so no token changes hands.

1. If they have no account, send them to github.com/signup and wait. Suggest turning on two-factor authentication when GitHub offers it.
2. Have them type this into Claude Code themselves (the `!` runs it in their terminal). It needs their browser and a one-time code, so you can't run it for them:

   ```
   ! gh auth login --hostname github.com --git-protocol https --web
   ```

   Tell them what will happen: a code appears, a browser tab opens, they paste the code there and approve.
3. Run `gh auth status` and confirm the username matches what they told you.
4. Run `gh auth setup-git` so git uses that same sign-in when saving to GitHub.
5. Set their name and email for git. For the email, suggest GitHub's private address, which keeps their real one off every public change:

   ```
   gh api user --jq '"\(.id)+\(.login)@users.noreply.github.com"'
   ```

   Then `git config --global user.name "<name>"` and `git config --global user.email "<that address>"`. Only change these if they're unset, or if the person says to; someone else's existing setup is theirs.
6. Set `git config --global init.defaultBranch main` if it's unset.

Checkpoint: `gh auth status` shows them signed in, and `git config --global user.email` is set.

## 4. Connect Claude to Vercel

Vercel's official MCP server lets Claude read their projects, deployments and build logs, and deploy, using a browser sign-in. Check vercel.com/docs/agent-resources/vercel-mcp for the current command if this one fails.

1. Explain MCP in a sentence: it's how Claude gets permission to use another service on their behalf, and they can remove it any time.
2. Add the server for all their projects:

   ```
   claude mcp add --transport http vercel --scope user https://mcp.vercel.com
   ```

3. Claude Code picks up new servers when it starts. Have them type `/exit`, then `claude --continue` to come back to this conversation.
4. Have them type `/mcp`, choose **vercel**, and sign in in the browser. If they have no Vercel account, the sign-in page offers to create one: choose **Continue with GitHub**.
5. Confirm it works by listing their Vercel projects or teams with the Vercel tools. An empty list is fine for a new account.

Checkpoint: the Vercel tools answer.

## 5. GitHub through MCP (optional)

The GitHub CLI already covers everything a website needs. GitHub's MCP server adds tools for issues, reviews and searching code. Offer it once, in one sentence; skip it if they don't want it.

1. Add it with a browser sign-in first:

   ```
   claude mcp add --transport http --scope user github https://api.githubcopilot.com/mcp/
   ```

   Restart as in step 4, then `/mcp` → **github** → sign in.
2. If the browser sign-in fails (it has been unreliable in Claude Code), the fallback is a token. Walk them through it without ever seeing it:
   - On GitHub: Settings → Developer settings → Personal access tokens → **Fine-grained tokens** → Generate. Limit it to the repositories they'll use, give it only the permissions they need (Contents, Pull requests and Issues: read and write; Metadata: read), and set an expiry.
   - Remove the server you added: `claude mcp remove github --scope user`.
   - In **a separate terminal window**, they run the command below, pasting the token where it says. Tell them the token is then stored in Claude Code's settings on their computer, and that it stops working when it expires or they revoke it on GitHub.

     ```
     claude mcp add --transport http --scope user github https://api.githubcopilot.com/mcp/ --header "Authorization: Bearer PASTE_TOKEN_HERE"
     ```

3. Restart Claude Code and confirm the GitHub tools answer.

## 6. Finish

Run `scripts/check.sh` once more and give a short summary in plain words:

- What's set up, and the GitHub username and Vercel account it's tied to
- What was skipped, and why
- How to undo each part: `gh auth logout`; `claude mcp remove vercel --scope user` (and `github`); revoking access from GitHub (Settings → Applications) and Vercel (Account Settings → Authentication)

Then go back to whatever they were doing before, or, if they came here to start a site, offer `portfolio-starter`.

## Don't

- Create repositories, commit, push or deploy here. This skill only gets accounts ready.
- Change global settings the person already has (git identity, credential helpers, shell profiles) without asking.
- Store anything in the project folder. Nothing this skill sets up belongs in a repository.
