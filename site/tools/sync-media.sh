# site/tools/sync-media.sh — 把优化后的图片变体发布到 media 分支
#
# media 分支是站内图片的托管源（经 jsDelivr 分发到 cdn.jsdelivr.net）。
# site/tools/optimize-images.py 产出的变体落在 site/data/media/，
# 由本脚本提交到 media 分支的 static/assets/uploads/opt/。
#
# 用法：bash site/tools/sync-media.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SRC="$ROOT/site/data/media"
REMOTE="origin"
BRANCH="media"

[ -d "$SRC" ] || { echo "✘ 缺少 $SRC — 先跑 python site/tools/optimize-images.py" >&2; exit 1; }

# 独立 worktree 检出 media 分支（该分支无源码，只有图片）
WORKTREE="$ROOT/.media-sync"
rm -rf "$WORKTREE"
git worktree add -f "$WORKTREE" "$BRANCH"

cleanup() {
  git worktree remove "$WORKTREE" --force 2>/dev/null || true
  rm -rf "$WORKTREE"
}
trap cleanup EXIT

# 整树替换 opt/ 目录（先删旧的，再拷新的）
rm -rf "$WORKTREE/static/assets/uploads/opt"
mkdir -p "$WORKTREE/static/assets/uploads/opt"
cp -R "$SRC/static/assets/uploads/opt/." "$WORKTREE/static/assets/uploads/opt/"

cd "$WORKTREE"
git add -A
if git diff --cached --quiet; then
  echo "— media 分支无变化，跳过提交"
else
  git commit -m "perf(site): 同步图片优化变体（WebP + 多档宽度）"
  echo "✔ media 分支已提交"
  git push "$REMOTE" "$BRANCH"
  echo "✔ 已推送到 $REMOTE/$BRANCH"
fi
