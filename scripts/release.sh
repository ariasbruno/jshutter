#!/usr/bin/env bash
set -euo pipefail

VALID_BUMPS=("patch" "minor" "major")

usage() {
	echo "Usage: $0 <patch|minor|major>"
	echo ""
	echo "Bumps the version in package.json, commits, tags, and pushes."
	echo ""
	echo "Examples:"
	echo "  $0 patch    # 0.1.0 → 0.1.1"
	echo "  $0 minor    # 0.1.0 → 0.2.0"
	echo "  $0 major    # 0.1.0 → 1.0.0"
	exit 1
}

if [[ $# -ne 1 ]] || [[ ! " ${VALID_BUMPS[*]} " =~ " $1 " ]]; then
	usage
fi

BUMPTYPE="$1"

# Ensure clean working tree
if [[ -n "$(git status --porcelain)" ]]; then
	echo "Error: Working tree is not clean. Commit or stash changes first."
	exit 1
fi

# Ensure on main/master
CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [[ "$CURRENT_BRANCH" != "main" && "$CURRENT_BRANCH" != "master" ]]; then
	echo "Error: Must be on main or current branch is '$CURRENT_BRANCH'."
	exit 1
fi

# Get current version from package.json
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo "Current version: $CURRENT_VERSION"

# Calculate new version using node
NEW_VERSION=$(node -e "
	const [maj, min, pat] = '$CURRENT_VERSION'.split('.').map(Number);
	switch ('$BUMPTYPE') {
		case 'major': console.log((maj+1) + '.0.0'); break;
		case 'minor': console.log(maj + '.' + (min+1) + '.0'); break;
		case 'patch': console.log(maj + '.' + min + '.' + (pat+1)); break;
	}
")

echo "New version: $NEW_VERSION"

# Update package.json version
npm version "$NEW_VERSION" --no-git-tag-version

# Commit
git add package.json
git commit -m "v$NEW_VERSION"

# Tag
git tag "v$NEW_VERSION"

# Push
git push origin "$CURRENT_BRANCH" --tags

echo ""
echo "✅ Released v$NEW_VERSION"
echo "   Commit pushed with tag v$NEW_VERSION"
echo "   GitHub Release will be created automatically by the workflow."
