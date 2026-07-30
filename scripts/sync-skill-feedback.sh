#!/usr/bin/env bash
# Pushes the current state of .claude/skills/ straight to origin/main, isolated
# from whatever else is happening on the current branch. Used by the
# publish-newsletter and publish-sourced-article skills' "capture feedback"
# step so an editorial-voice lesson learned mid-session lands on main
# immediately, without waiting on that session's own feature branch/PR and
# without a human having to separately ask for it every time.
#
# Isolation is the point: this script never touches app code, scripts, or
# anything outside .claude/skills/, and it builds the main-bound commit in a
# throwaway worktree off origin/main, not off whatever branch happens to be
# checked out. That means an in-progress feature branch's unrelated, possibly
# unfinished commits can never leak onto main through this path, even if the
# calling session is mid-task on some other branch.
#
# Usage: scripts/sync-skill-feedback.sh "commit message"
set -euo pipefail

MSG="${1:?Usage: sync-skill-feedback.sh \"commit message\"}"
REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

git fetch origin main

TMP_DIR="$(mktemp -d)"
cleanup() { git worktree remove "$TMP_DIR" --force >/dev/null 2>&1 || true; }
trap cleanup EXIT

git worktree add --detach "$TMP_DIR" origin/main >/dev/null

rm -rf "$TMP_DIR/.claude/skills"
mkdir -p "$TMP_DIR/.claude"
cp -r "$REPO_ROOT/.claude/skills" "$TMP_DIR/.claude/skills"

pushd "$TMP_DIR" >/dev/null
git add .claude/skills
if git diff --cached --quiet; then
  echo "[sync-skill-feedback] No .claude/skills changes vs origin/main, nothing to push."
  popd >/dev/null
  exit 0
fi

git commit -m "$MSG" >/dev/null
git push origin HEAD:main
echo "[sync-skill-feedback] Pushed .claude/skills update straight to main."
popd >/dev/null
