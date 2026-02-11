@echo off
mkdir dists
git archive --format zip --output dists\LPS-TardyKiosk-Custom.zip --worktree-attributes --verbose -9 HEAD:TardyKiosk .
git archive --format zip --output dists\LPS-TardyKioskExtensions-Custom.zip --worktree-attributes --verbose -9 HEAD:TardyKioskExtensions .
pause
