# site/tools/optimize-images.py — 站内图片优化（产出待发布到 media 分支的变体）
#
# 目的：站内图片托管在 media 分支（经 jsDelivr 分发）。原图普遍远大于实际显示尺寸：
#   - hero 图 2000×2000 / 315KB，页面只显示约 560×420 CSS px
#   - 产品图 768×768 ~ 2480×2480，页面只显示 275×275（卡片）或 560×420（详情）
# 按显示尺寸生成 WebP + JPEG 双格式，页面用 <picture> + srcset 按 DPR 选档，
# 典型产品图从 638KB 降到 ~60KB。
#
# 只处理站内真正引用的图片（产品图 18 张）。分类大图（2048² PNG，合计 17MB）站内
# 并未使用（首页口味卡用 SVG 图标），仅 README 引用，不在本工具范围内。
#
# 产物：site/data/media/static/assets/uploads/opt/  +  变体清单 image-variants.json
# 发布：bash site/tools/sync-media.sh（提交到 media 分支 → jsDelivr 自动生效）
#
# 用法：python site/tools/optimize-images.py
import io
import json
import os
import urllib.request

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPO = os.path.dirname(ROOT)
MEDIA_DIR = os.path.join(REPO, 'site', 'data', 'media')
OUT_SUBDIR = 'static/assets/uploads/opt'

# 宽度档位：产品卡 275px 显示（→ 400/560 档），详情页 560px 显示（→ 800/1120 档）
WIDTHS = [400, 800, 1120]
QUALITY_WEBP = 80
QUALITY_JPG = 82


def source_images():
    """站内实际引用的产品图（去重、保持稳定顺序）"""
    with open(os.path.join(REPO, 'site', 'data', 'products.json'), encoding='utf8') as fh:
        data = json.load(fh)
    urls = []
    for p in data['products']:
        if p.get('image'):
            urls.append(p['image'])
    return sorted(set(urls))


def fetch(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=120) as resp:
        return resp.read()


def variants_for(url):
    """为一张原图生成各档位，输出 {宽: {webp, jpg, bytes}}"""
    name = url.rsplit('/', 1)[-1]
    stem = name.rsplit('.', 1)[0]
    data = fetch(url)
    im = Image.open(io.BytesIO(data))
    im.load()
    has_alpha = im.mode in ('RGBA', 'LA', 'P')

    out = {}
    for w in WIDTHS:
        if im.width <= w:
            continue
        r = im.copy()
        r.thumbnail((w, w), Image.LANCZOS)
        webp_name = f'{stem}-{w}.webp'
        webp_bytes = io.BytesIO()
        r.save(webp_bytes, 'WEBP', quality=QUALITY_WEBP, method=6)
        with open(os.path.join(MEDIA_DIR, OUT_SUBDIR, webp_name), 'wb') as fh:
            fh.write(webp_bytes.getvalue())

        jpg_name = f'{stem}-{w}.jpg'
        with open(os.path.join(MEDIA_DIR, OUT_SUBDIR, jpg_name), 'wb') as fh:
            r.convert('RGB').save(fh, 'JPEG', quality=QUALITY_JPG, optimize=True, progressive=True)

        out[w] = {
            'webp': f'{OUT_SUBDIR}/{webp_name}',
            'jpg': f'{OUT_SUBDIR}/{jpg_name}',
            'bytes': len(webp_bytes.getvalue()),
        }
    return out


def main():
    out_root = os.path.join(MEDIA_DIR, OUT_SUBDIR)
    os.makedirs(out_root, exist_ok=True)
    # 清掉上一轮产物，避免残留孤儿文件被发布
    for f in os.listdir(out_root):
        os.remove(os.path.join(out_root, f))

    urls = source_images()
    manifest = {}
    for i, url in enumerate(urls, 1):
        name = url.rsplit('/', 1)[-1]
        try:
            variants = variants_for(url)
        except Exception as exc:  # 单张失败不阻塞整批
            print(f'  ✗ {name}: {exc}')
            continue
        if not variants:
            print(f'  – {name}: 原图已是最小档，跳过')
            continue
        manifest[name] = {'orig': url, 'widths': variants}
        total = sum(v['bytes'] for v in variants.values())
        print(f'  [{i}/{len(urls)}] {name} → {sorted(variants)} (WebP 合计 {total / 1024:.0f}KB)')

    mpath = os.path.join(MEDIA_DIR, 'image-variants.json')
    with open(mpath, 'w', encoding='utf8', newline='\n') as fh:
        json.dump(manifest, fh, ensure_ascii=False, indent=2, sort_keys=True)
        fh.write('\n')
    print(f'✔ 变体清单: {mpath}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
