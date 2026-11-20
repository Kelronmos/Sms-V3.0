# Publish to GitHub

Target repository: `Kelronmos/SWI-Student-Monitor`.

The ChatGPT GitHub connector available in this session can inspect and write files to existing repositories but does not expose a repository-creation operation. The authenticated repository listing also returned no repositories, so no remote repository or push could be verified from this session.

## Windows
1. Install Git and GitHub CLI (`gh`).
2. Open a terminal and run `gh auth login`.
3. Extract this project to a writable folder and inspect the files before publishing.
4. Run `publish-to-github.bat`.
5. The script creates the repository as **private by default**, commits the local project, and pushes to `Kelronmos/SWI-Student-Monitor`.
6. If GitHub says the repository already exists, stop and inspect the remote before attempting any push. The script intentionally does not force-push.
7. Open the repository's Actions tab and verify the actual workflow run. A configured workflow is not a passing result.

## Safety
- Never commit `.env`, credentials, API tokens, real student records, local databases, or private exports.
- Keep repository private until the full tree and third-party licenses have been reviewed for public release.
- `PASS` is not `PROVEN`; `TESTED` is not `SEALED`; no production authorization is granted by publishing.
