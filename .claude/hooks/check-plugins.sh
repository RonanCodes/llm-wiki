#!/bin/bash
# Check if recommended plugins are installed

INSTALLED=$(cat ~/.claude/plugins/installed_plugins.json 2>/dev/null || echo "{}")

if ! echo "$INSTALLED" | grep -q "ronan-skills@ronan-skills"; then
  cat << 'EOF'

This project recommends the "ronan-skills" plugin (ralph, frontend-design, create-skill, doc-standards).

It is NOT currently installed. To install:

  /plugin marketplace add RonanCodes/skills
  /plugin install ronan-skills@ronan-skills

Or clone the repo instead:

  git clone https://github.com/RonanCodes/skills.git <your-path>
  Add to ~/.claude/settings.json: "additionalDirectories": ["<your-path>"]

EOF
fi

exit 0
