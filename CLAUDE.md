# Websites — agent guide

This folder contains client draft websites hosted via GitHub Pages for client
review before migration to their own domain.

## Repo
- GitHub: https://github.com/techadvantagesupport/website
- Pages URL: https://techadvantagesupport.github.io/website/
- Each client site lives in its own subfolder: `website/<client-name>/index.html`

## Git setup
- Remote URL embeds the techadvantagesupport token (credential store has two
  accounts; token is baked into the remote URL to avoid pksteichen being used)
- Branch: main
- Push target: origin main (never force-push)

## Workflow
1. Create a subfolder per client: `<client-name>/`
2. Build the site inside that folder
3. Push to main — GitHub Pages serves it at:
   `https://techadvantagesupport.github.io/website/<client-name>/`
4. Share the Pages URL with the client for review
5. When approved, hand off files for deployment to their own domain
