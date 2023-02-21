@echo off
git archive --format zip --output dists\LPS-TardyKioskExtensions-Custom.zip --worktree-attributes --verbose -9 HEAD
pause