# site/tools/subset-font.py — 字体子集化（构建前置步骤，手动执行）
#
# 目的：站内 Inter 可变字体原为 latin(47KB) + latin-ext(83KB) 两份，合计 130KB，
# 且预加载只指向 latin —— 而波兰语正文（ą ć ę ł ń ś ź ż）全部落在 latin-ext，
# 导致预加载的那份用不上，第二份反而在关键渲染路径上迟到（实测 758ms），
# 引发字体替换回流（生产 CLS 0.285）。
#
# 做法：把两份子集合并为一份，覆盖 Latin-1 + Latin Extended-A + 站点用到的标点，
# 单一文件既消除第二次字体请求，也消除预加载错配。
#
# 用法：python site/tools/subset-font.py
# 产物：site/src/fonts/InterVariable-subset.woff2（build.js 复制到 dist/fonts/）
import os
import sys

from fontTools import subset

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'src', 'fonts')
OUT_NAME = 'InterVariable-subset.woff2'

# Latin-1 + Latin Extended-A 全覆盖 + 站点实际用到的排版符号
# （含波兰语 ąćęłńóśźż 与其大写、破折号、省略号、箭头、引号、数学符号）
RANGE = ''.join(chr(c) for c in range(0x20, 0x180))
EXTRA = '—–…→←„”‘’−×÷°©®™€£¥§¶•·≥≤≠∞√≈µΩαβγδπ'

# 以 latin-ext 为基底（它已含 Extended-A 全部字形），再并入 latin 侧字符
BASE = os.path.join(SRC, 'InterVariable-latin-ext.woff2')


def main() -> int:
    if not os.path.exists(BASE):
        print(f'✘ 缺少基底字体: {BASE}', file=sys.stderr)
        return 1
    opts = subset.Options()
    opts.flavor = 'woff2'
    opts.layout_features = '*'  # 保留连字/字距调整（可变字重的 kerning）
    opts.desubroutinize = True
    opts.hinting = False
    opts.name_IDs = ['*']
    font = subset.load_font(BASE, opts)
    subsetter = subset.Subsetter(options=opts)
    subsetter.populate(text=RANGE + EXTRA)
    subsetter.subset(font)
    out = os.path.join(SRC, OUT_NAME)
    subset.save_font(font, out, opts)
    before = os.path.getsize(BASE) + os.path.getsize(os.path.join(SRC, 'InterVariable-latin.woff2'))
    after = os.path.getsize(out)
    print(f'✔ {OUT_NAME}: {before / 1024:.0f}KB → {after / 1024:.1f}KB (省 {(1 - after / before) * 100:.0f}%)')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
