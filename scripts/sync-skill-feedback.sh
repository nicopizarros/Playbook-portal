#!/usr/bin/env bash
# Pushes the current state of the editorial skill content straight to
# origin/main, isolated from whatever else is happening on the current branch.
# Used by the publish-newsletter and publish-sourced-article skills' "capture
# feedback" step so an editorial-voice lesson learned mid-session lands on main
# immediately, without waiting on that session's own feature branch/PR and
# without a human having to separately ask for it every time.
#
# TWO paths, not one. .claude/skills/ holds each skill's SKILL.md and its own
# ingestion/publishing references; .claude/playbook-editorial/ holds the voice,
# format-tier, device-library, overlap, field and image rules that BOTH skills
# read through symlinks. A voice lesson lands in the second one, so syncing
# only the first would quietly drop exactly the feedback this script exists to
# carry. (The symlinks themselves live under .claude/skills/ and are copied as
# links, not dereferenced, so the shared file is stored once in git.)
#
# Isolation is the point: this script never touches app code, scripts, or
# anything outside those two paths, and it builds the main-bound commit in a
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

SYNC_PATHS=(".claude/skills" ".claude/playbook-editorial")

git fetch origin main

TMP_DIR="$(mktemp -d)"
cleanup() { git worktree remove "$TMP_DIR" --force >/dev/null 2>&1 || true; }
trap cleanup EXIT

git worktree add --detach "$TMP_DIR" origin/main >/dev/null

mkdir -p "$TMP_DIR/.claude"
for path in "${SYNC_PATHS[@]}"; do
  rm -rf "${TMP_DIR:?}/$path"
  # -R (not -L) so the references/ symlinks are copied as links.
  cp -R "$REPO_ROOT/$path" "$TMP_DIR/$path"
done

pushd "$TMP_DIR" >/dev/null
git add -A -- "${SYNC_PATHS[@]}"
if git diff --cached --quiet; then
  echo "[sync-skill-feedback] No skill content changes vs origin/main, nothing to push."
  popd >/dev/null
  exit 0
fi

git commit -m "$MSG" >/dev/null
git push origin HEAD:main
echo "[sync-skill-feedback] Pushed ${SYNC_PATHS[*]} straight to main."
popd >/dev/null
