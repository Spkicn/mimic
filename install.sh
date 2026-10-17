#!/usr/bin/env sh
# Install the mimic skill into a DSH, Claude Code, or project-local skills directory.
#
#   ./install.sh                  -> ~/.dsh/skills     (DSH user scope)
#   ./install.sh --claude         -> ~/.claude/skills
#   ./install.sh --project-dsh[=DIR]    -> DIR/.dsh/skills    (default: .)
#   ./install.sh --project-claude[=DIR] -> DIR/.claude/skills (default: .)
#   ./install.sh --project DIR    -> treat DIR as the project directory
#   ./install.sh --list           -> show what would be installed
#   ./install.sh --force          -> overwrite an existing installation
#   ./install.sh --help           -> this text
set -eu

here=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
source_root="$here/skills"

usage() {
  sed -n '2,11p' "$0" | sed 's/^# \{0,1\}//'
}

die() { echo "install.sh: $*" >&2; exit 2; }

[ -d "$source_root" ] || die "skills/ not found next to this script (looked in $source_root)"

target="dsh"
project="."
force=0
list=0

while [ $# -gt 0 ]; do
  case "$1" in
    --dsh) target="dsh" ;;
    --claude) target="claude" ;;
    --project-dsh) target="project-dsh" ;;
    --project-claude) target="project-claude" ;;
    --project=*)
      target="project-dsh"
      project=${1#--project=}
      ;;
    --project)
      [ $# -ge 2 ] || die "--project needs a directory"
      target="project-dsh"
      project=$2
      shift
      ;;
    --project-dsh=*)
      target="project-dsh"
      project=${1#--project-dsh=}
      ;;
    --project-claude=*)
      target="project-claude"
      project=${1#--project-claude=}
      ;;
    --force) force=1 ;;
    --list|--dry-run) list=1 ;;
    -h|--help) usage; exit 0 ;;
    *) die "unknown option: $1" ;;
  esac
  shift
done

case "$target" in
  dsh)            dest_root="$HOME/.dsh/skills" ;;
  claude)         dest_root="$HOME/.claude/skills" ;;
  project-dsh)    dest_root="$project/.dsh/skills" ;;
  project-claude) dest_root="$project/.claude/skills" ;;
  *) die "unknown target: $target" ;;
esac

case "$target" in
  project-*)
    [ -d "$project" ] || die "project directory not found: $project"
    ;;
esac

if [ "$list" -eq 1 ]; then
  echo "source : $source_root"
  echo "target : $dest_root  ($target)"
  for d in "$source_root"/*/; do
    [ -d "$d" ] || continue
    echo "  - $(basename "$d")"
  done
  exit 0
fi

mkdir -p "$dest_root"

count=0
for d in "$source_root"/*/; do
  [ -d "$d" ] || continue
  name=$(basename "$d")
  dest="$dest_root/$name"
  if [ -e "$dest" ]; then
    if [ "$force" -eq 1 ]; then
      rm -rf "$dest"
    else
      echo "skip    $name  (already installed; pass --force to overwrite)"
      continue
    fi
  fi
  cp -R "$d" "$dest"
  echo "install $name -> $dest"
  count=$((count + 1))
done

echo
if [ "$count" -eq 0 ]; then
  echo "Nothing installed. Restart the agent session (or start a new one) so the skill catalog is re-read."
else
  echo "Done. Restart the agent session (or start a new one) so the skill catalog is re-read."
fi
