#!/usr/bin/env sh
# Install the mimic skill into a DSH, Claude Code, or project-local skills directory.
#
#   ./install.sh                  -> ~/.dsh/skills     (DSH user scope)
#   ./install.sh --claude         -> ~/.claude/skills
#   ./install.sh --project-dsh    -> ./.dsh/skills
#   ./install.sh --project-claude -> ./.claude/skills
#   ./install.sh --list           -> show what would be installed
#   ./install.sh --force          -> overwrite an existing installation
set -eu

here=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
source_root="$here/skills"

[ -d "$source_root" ] || { echo "skills/ not found next to this script" >&2; exit 1; }

target="dsh"
project="."
force=0
list=0

for arg in "$@"; do
  case "$arg" in
    --dsh) target="dsh" ;;
    --claude) target="claude" ;;
    --project-dsh) target="project-dsh" ;;
    --project-claude) target="project-claude" ;;
    --project) project="$2"; shift ;;
    --force) force=1 ;;
    --list) list=1 ;;
    -h|--help) sed -n '2,12p' "$0"; exit 0 ;;
    *) echo "unknown option: $arg" >&2; exit 2 ;;
  esac
done

case "$target" in
  dsh)             dest_root="$HOME/.dsh/skills" ;;
  claude)          dest_root="$HOME/.claude/skills" ;;
  project-dsh)     dest_root="$project/.dsh/skills" ;;
  project-claude)  dest_root="$project/.claude/skills" ;;
esac

if [ "$list" -eq 1 ]; then
  echo "source : $source_root"
  echo "target : $dest_root  ($target)"
  for d in "$source_root"/*/; do [ -d "$d" ] && echo "  - $(basename "$d")"; done
  exit 0
fi

mkdir -p "$dest_root"

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
done

echo
echo "Done. Restart the agent session (or start a new one) so the skill catalog is re-read."
