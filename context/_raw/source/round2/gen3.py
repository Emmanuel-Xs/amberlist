import json, os, re, datetime, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import gen
from gen import logo, icon, btn, chip, tag, head, card, h2, note, phone, row, toast, kbd

P = gen.P
LD = open('/home/claude/amberlist/src/ui/logo-data.ts').read()
HEX = re.search(r"HEX_PATH = '([^']+)'", LD).group(1)
STUB = re.search(r"STUB_PATH =\s*'([^']+)'", LD).group(1)
DROP = re.search(r"DROP_PATH =\s*'([^']+)'", LD).group(1)
CELLS = re.findall(r"p: '([^']+)',\s*on: (true|false)", LD)
ON = [p for p, o in CELLS if o == 'true']
OFF = [p for p, o in CELLS if o == 'false']
CHECK_ORDER = [ON[2], ON[4], ON[3], ON[1], ON[0]]

boards = {}


def page(title, w, h, body, css='', props='', logic_extra=''):
    return gen.board('x', title, w, h, body, css)


# ------------------------------------------------------------------ Celebrations
HEXP = 'M12 2.4 20.31 7.2v9.6L12 21.6 3.69 16.8V7.2Z'


def spark(cls, color, size, delay):
    return (f'<g class="{cls}" style="animation-delay: {delay}s"><path d="{HEXP}" transform="scale({size / 24})" '
            f'fill="var(--{color})" stroke="var(--on-pastel)" stroke-width="{1.4 * 24 / size:.2f}" stroke-linejoin="round"></path></g>')


# 1) Every tick: honey fills the circle, check pops, six hex sparks
tick_svg = '''<svg width="300" height="120" viewBox="0 0 300 120" aria-hidden="true" style="display: block; overflow: visible">
<defs><clipPath id="tkclip"><circle cx="40" cy="60" r="13"></circle></clipPath></defs>
<rect x="4" y="24" width="292" height="72" rx="20" fill="var(--surface)"></rect>
<circle cx="40" cy="60" r="13" fill="none" stroke="var(--line-strong)" stroke-width="1.5"></circle>
<g clip-path="url(#tkclip)"><g class="tk-fill"><path d="M20 62 q5 -3 10 0 t10 0 t10 0 t10 0 V90 H20 Z" fill="var(--accent)"></path></g></g>
<path class="tk-check" d="M34 60.5l4 4 8-9" fill="none" stroke="var(--on-accent)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></path>
<text x="68" y="66" font-size="16" font-weight="500" fill="var(--ink)" font-family="Poppins, sans-serif">Call mum</text>
<rect class="tk-strike" x="68" y="59" width="78" height="1.8" rx="1" fill="var(--ink-muted)"></rect>
'''
ang = [-90, -30, 30, 90, 150, 210]
cols = ['accent', 'butter', 'accent', 'peach', 'accent', 'mint']
for i, a in enumerate(ang):
    tick_svg += f'<g transform="translate(40 60) rotate({a})"><g class="tk-spark" style="animation-delay: {0.42 + i * 0.012:.3f}s"><g transform="translate(-4 -4)"><path d="{HEXP}" transform="scale(0.34)" fill="var(--{cols[i]})" stroke="var(--on-pastel)" stroke-width="3" stroke-linejoin="round"></path></g></g></g>'
tick_svg += '</svg>'

# 2) First task ever: a honey drop falls, splashes into comb cells, the row gets a warm glow
ft_svg = '''<svg width="340" height="300" viewBox="0 0 340 300" aria-hidden="true" style="display: block; overflow: visible">
<g class="ft-row"><rect x="10" y="150" width="320" height="72" rx="20" fill="var(--surface)"></rect>
<rect class="ft-glow" x="10" y="150" width="320" height="72" rx="20" fill="none" stroke="var(--accent)" stroke-width="2"></rect>
<circle cx="46" cy="186" r="12" fill="none" stroke="var(--line-strong)" stroke-width="1.5"></circle>
<text x="72" y="182" font-size="16" font-weight="500" fill="var(--ink)" font-family="Poppins, sans-serif">Read 20 pages</text>
<text x="72" y="203" font-size="13" fill="var(--ink-muted)" font-family="Poppins, sans-serif">Tomorrow · Study</text></g>
<g transform="translate(46 0)"><g class="ft-drop"><path d="M0 -14c0 0-9 11-9 16.5a9 9 0 0 0 18 0C9 -3 0 -14 0 -14z" fill="var(--accent)" stroke="var(--on-pastel)" stroke-width="1.5"></path><ellipse cx="-3" cy="1" rx="2" ry="3.4" fill="var(--bg)" opacity=".35"></ellipse></g></g>
<ellipse class="ft-ring" cx="46" cy="150" rx="18" ry="5" fill="none" stroke="var(--accent)" stroke-width="2"></ellipse>
'''
burst = [(-60, -70, 'accent', 11), (-20, -92, 'butter', 9), (24, -84, 'accent', 12), (62, -60, 'peach', 8), (-86, -34, 'mint', 8), (90, -30, 'accent', 10), (-40, -40, 'lavender', 7), (44, -36, 'sky', 7), (4, -110, 'accent', 8), (110, -64, 'butter', 7)]
css_burst = ''
for i, (dx, dy, c, s) in enumerate(burst):
    ft_svg += f'<g transform="translate(46 150)"><g class="ft-b ft-b{i}"><g transform="translate({-s / 2} {-s / 2})"><path d="{HEXP}" transform="scale({s / 24:.3f})" fill="var(--{c})" stroke="var(--on-pastel)" stroke-width="{1.4 * 24 / s:.2f}" stroke-linejoin="round"></path></g></g></g>'
    css_burst += (f'.ft-b{i}{{animation:ftb{i} 4s cubic-bezier(.2,.7,.4,1) infinite}}'
                  f'@keyframes ftb{i}{{0%,22%{{transform:translate(0,0) scale(0) rotate(0);opacity:0}}23%{{opacity:1;transform:translate(0,0) scale(.6)}}'
                  f'33%{{transform:translate({dx * 0.8}px,{dy}px) scale(1) rotate({dx}deg);opacity:1}}'
                  f'48%{{transform:translate({dx * 1.15}px,{dy * 0.2 + 40}px) scale(.9) rotate({dx * 2}deg);opacity:.9}}'
                  f'56%,100%{{transform:translate({dx * 1.25}px,{dy * 0.2 + 70}px) scale(.4) rotate({dx * 2.4}deg);opacity:0}}}}')
ft_svg += '</svg>'

# 3) All done today: the day's cells fill with honey one by one and seal into the logo
ad = f'<svg width="240" height="240" viewBox="-6 -1 76 76" aria-hidden="true" style="display: block; overflow: visible"><defs><clipPath id="adclip"><path d="{HEX}"></path></clipPath></defs>'
ad += f'<g class="ad-hex"><path d="{HEX}" fill="var(--accent)" stroke="var(--accent)" stroke-width="10" stroke-linejoin="round"></path><path d="{STUB}" fill="var(--accent)"></path></g>'
ad += '<g class="ad-comb" clip-path="url(#adclip)">' + ''.join(f'<polygon points="{p}" fill="none" stroke="var(--on-accent)" stroke-width="1.2" opacity=".22"></polygon>' for p in OFF) + '</g>'
for i, p in enumerate(CHECK_ORDER):
    ad += (f'<polygon points="{p}" fill="none" stroke="var(--line-strong)" stroke-width="1" class="ad-out"></polygon>'
           f'<polygon points="{p}" class="ad-cell" style="animation-delay: {0.25 + i * 0.22:.2f}s" stroke-width="1.6" stroke-linejoin="round"></polygon>')
ad += f'<path class="ad-drop" d="{DROP}" fill="var(--accent)"></path></svg>'

cel_css = ('.tk-fill{animation:tkfill 2.6s ease-in-out infinite}'
           '@keyframes tkfill{0%,8%{transform:translateY(22px)}22%{transform:translate(-8px,-6px)}30%,86%{transform:translate(-12px,-16px)}96%,100%{transform:translateY(22px)}}'
           '.tk-check{stroke-dasharray:22;animation:tkcheck 2.6s infinite;transform-box:fill-box;transform-origin:center}'
           '@keyframes tkcheck{0%,17%{stroke-dashoffset:22;transform:scale(.6)}25%{stroke-dashoffset:0;transform:scale(1.18)}32%,86%{stroke-dashoffset:0;transform:scale(1)}96%,100%{stroke-dashoffset:22;transform:scale(.6)}}'
           '.tk-strike{transform-box:fill-box;transform-origin:left;animation:tkstrike 2.6s infinite}'
           '@keyframes tkstrike{0%,24%{transform:scaleX(0)}36%,86%{transform:scaleX(1)}96%,100%{transform:scaleX(0)}}'
           '.tk-spark{opacity:0;animation:tkspark 2.6s cubic-bezier(.15,.8,.3,1) infinite}'
           '@keyframes tkspark{0%,16%{transform:translateX(0) scale(0);opacity:0}18%{opacity:1}34%{transform:translateX(26px) scale(1);opacity:1}44%,100%{transform:translateX(31px) scale(.2);opacity:0}}'
           '.ft-drop{animation:ftdrop 4s cubic-bezier(.55,0,1,.45) infinite;transform-box:fill-box;transform-origin:50% 100%}'
           '@keyframes ftdrop{0%,6%{transform:translateY(-10px) scale(.2,.2);opacity:0}10%{transform:translateY(20px) scale(.8,1);opacity:1}14%{transform:translateY(22px) scale(1,1)}22%{transform:translateY(136px) scale(.8,1.35);opacity:1}23%{transform:translateY(142px) scale(1.7,.45);opacity:1}25%,100%{transform:translateY(142px) scale(2.2,.2);opacity:0}}'
           '.ft-ring{opacity:0;transform-box:fill-box;transform-origin:center;animation:ftring 4s ease-out infinite}'
           '@keyframes ftring{0%,22%{opacity:0;transform:scale(.3)}24%{opacity:1}40%,100%{opacity:0;transform:scale(3.2)}}'
           '.ft-row{transform-box:fill-box;transform-origin:50% 0;animation:ftrow 4s infinite}'
           '@keyframes ftrow{0%{opacity:0;transform:translateY(10px)}5%{opacity:1;transform:none}23%{transform:none}26%{transform:scale(1.01,.95)}31%{transform:scale(.995,1.02)}36%,100%{transform:none}}'
           '.ft-glow{opacity:0;animation:ftglow 4s infinite}'
           '@keyframes ftglow{0%,23%{opacity:0}28%{opacity:1}70%{opacity:.35}90%,100%{opacity:0}}'
           + css_burst +
           '.ft-toast{opacity:0;animation:fttoast 4s cubic-bezier(.2,.8,.2,1) infinite}'
           '@keyframes fttoast{0%,32%{opacity:0;transform:translateY(16px)}40%,88%{opacity:1;transform:none}96%,100%{opacity:0}}'
           '.ad-cell{fill:var(--accent);stroke:var(--accent);transform-box:fill-box;transform-origin:50% 100%;animation:adcell 5s cubic-bezier(.3,.7,.3,1) infinite both}'
           '@keyframes adcell{0%{transform:scaleY(0);fill:var(--accent);stroke:var(--accent)}14%{transform:scaleY(1.08)}18%,46%{transform:scaleY(1);fill:var(--accent);stroke:var(--accent)}56%,90%{transform:scaleY(1);fill:var(--on-accent);stroke:var(--on-accent)}100%{transform:scaleY(1);fill:var(--on-accent);stroke:var(--on-accent);opacity:0}}'
           '.ad-out{animation:adout 5s infinite}@keyframes adout{0%,40%{opacity:1}52%,100%{opacity:0}}'
           '.ad-hex{transform-box:fill-box;transform-origin:center;animation:adhex 5s cubic-bezier(.3,1.4,.5,1) infinite}'
           '@keyframes adhex{0%,44%{transform:scale(.4);opacity:0}54%{transform:scale(1.06);opacity:1}60%,90%{transform:scale(1);opacity:1}100%{opacity:0}}'
           '.ad-comb{animation:adcomb 5s infinite}@keyframes adcomb{0%,54%{opacity:0}64%,90%{opacity:1}100%{opacity:0}}'
           '.ad-drop{transform-box:fill-box;transform-origin:50% 0;animation:addrop 5s ease-in infinite}'
           '@keyframes addrop{0%,60%{transform:scale(.2);opacity:0}68%{transform:scale(1);opacity:1}78%{transform:translateY(0) scale(1)}90%{transform:translateY(14px) scale(.9,1.2);opacity:0}100%{opacity:0}}'
           '.ad-text{animation:adtext 5s infinite}@keyframes adtext{0%,58%{opacity:0;transform:translateY(8px)}66%,90%{opacity:1;transform:none}100%{opacity:0}}'
           '.ad-glow{animation:adglow 5s infinite}@keyframes adglow{0%,52%{opacity:0;transform:scale(.6)}62%{opacity:.55;transform:scale(1)}90%{opacity:.2}100%{opacity:0}}'
           '@media (prefers-reduced-motion: reduce){.tk-spark,.ft-b0,.ft-b1,.ft-b2,.ft-b3,.ft-b4,.ft-b5,.ft-b6,.ft-b7,.ft-b8,.ft-b9,.ft-drop,.ft-ring{display:none}}')

stage = lambda inner, h=320: f'<div style="height: {h}px; border-radius: 24px; background: var(--bg); display: grid; place-items: center; position: relative; overflow: hidden">{inner}</div>'
cel = head('13 · Celebrations, from the logo itself',
           'No bee, no rainbow confetti. Every moment is built from what Honeylist already is: honey, comb cells and the drop that "just let go". Three sizes, used with restraint. All three loop here so you can watch them.')
cel += '<div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 28px">'
cel += card(tag('Every tick', 'rec') + stage(tick_svg)
            + '<div style="display: flex; flex-direction: column; gap: 6px; font-size: 14px; line-height: 20px"><span><strong>0 ms</strong> honey rises inside the circle with a little wave</span><span><strong>200 ms</strong> check draws and pops (spring), soft "plink" here</span><span><strong>250 ms</strong> six tiny comb cells flick out and fade</span><span><strong>450 ms</strong> row glides to Completed (already built)</span></div>'
            + note('Small enough for every task, 0.6 s. Reduced motion: the circle just fills, sound stays.'))
cel += card(tag('First task ever', 'rec') + stage(ft_svg + '<div class="ft-toast" style="position: absolute; left: 20px; right: 20px; bottom: 18px">' + toast('Your first task is in', 'Nice start. Tick it when it\'s done.', 'logo').replace('width: 400px', 'width: 100%') + '</div>')
            + '<div style="display: flex; flex-direction: column; gap: 6px; font-size: 14px; line-height: 20px"><span><strong>0 ms</strong> the row lands from the quick add</span><span><strong>250 ms</strong> a honey drop forms at the top and falls, stretching as it speeds up</span><span><strong>900 ms</strong> it splats on the row: squash, a ring, and comb cells burst out and fall with gravity</span><span><strong>1.3 s</strong> toast: "Your first task is in"</span></div>'
            + note('Once per person. Same treatment for the first note. 1.6 s, tap to skip.'))
cel += card(tag('All done for today', 'rec') + stage('<div class="ad-glow" style="position: absolute; width: 260px; height: 260px; border-radius: 50%; background: radial-gradient(circle, var(--accent-soft) 0%, transparent 70%)"></div>'
                                                     + f'<div style="position: relative; display: flex; flex-direction: column; align-items: center; gap: 6px">{ad}<span class="ad-text" style="font-size: 20px; font-weight: 600">All done for today</span></div>', 360)
            + '<div style="display: flex; flex-direction: column; gap: 6px; font-size: 14px; line-height: 20px"><span><strong>0 to 1.1 s</strong> the check\'s five comb cells fill with honey one by one, one per finished task feeling</span><span><strong>1.1 s</strong> the comb seals: the hexagon blooms behind them and the cells turn dark: it becomes the logo</span><span><strong>1.5 s</strong> the drop forms and lets go. Celebrate chord plays.</span></div>'
            + note('Only when the last task due today is done. 2.2 s, then the All done empty state (board 16) takes over the Today area.'))
cel += '</div>'
cel += card(h2('Why this and not the bee') + '<ul style="margin: 0; padding-left: 20px; display: flex; flex-direction: column; gap: 6px; font-size: 14px; line-height: 20px">'
            '<li>Research pointed the same way: Things 3 keeps its tick tiny and fast, Duolingo and Asana save big moments for milestones, and generic confetti or clip art reads as template.</li>'
            '<li>Every piece here is ours: the fill is honey, the particles are comb cells from the logo, the finale literally assembles the logo. Nobody else can ship this.</li>'
            '<li>Sound lands on impact, not before; particles use only amber plus our pastels.</li>'
            '<li>Built with Motion in the app (springs for the pop, gravity for the cells), canvas for particles so it stays smooth on phones.</li></ul>')
boards['Celebrate.dc.html'] = ('13 · Celebrations', 1440, 1120, cel, cel_css)

# ------------------------------------------------------------------ Icons v2
SV = 'fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"'
hx = lambda cx, cy, r: 'M' + ' '.join(f'{cx + r * __import__("math").cos(__import__("math").radians(-90 + 60 * k)):.2f} {cy + r * __import__("math").sin(__import__("math").radians(-90 + 60 * k)):.2f}' for k in range(6)) + 'Z'
G2 = {
    'Home': ('<path d="M4 11.2c0-.6.27-1.16.73-1.54l6.1-5a1.85 1.85 0 0 1 2.34 0l6.1 5c.46.38.73.94.73 1.54V18.5a2.5 2.5 0 0 1-2.5 2.5h-2.1a1 1 0 0 1-1-1v-3.6a2.4 2.4 0 0 0-4.8 0V20a1 1 0 0 1-1 1H6.5A2.5 2.5 0 0 1 4 18.5Z"></path>',
             '<path d="M4 11.2c0-.6.27-1.16.73-1.54l6.1-5a1.85 1.85 0 0 1 2.34 0l6.1 5c.46.38.73.94.73 1.54V18.5a2.5 2.5 0 0 1-2.5 2.5h-2.1a1 1 0 0 1-1-1v-3.6a2.4 2.4 0 0 0-4.8 0V20a1 1 0 0 1-1 1H6.5A2.5 2.5 0 0 1 4 18.5Z" fill="var(--accent)" stroke="var(--accent-ink)"></path>'),
    'Tasks': (f'<path d="{hx(6.5, 7, 4.2)}"></path><path d="m4.7 7.1 1.3 1.3 2.4-2.6"></path><path d="{hx(6.5, 17, 4.2)}"></path><path d="M13 7h8M13 17h8"></path>',
              f'<path d="{hx(6.5, 7, 4.2)}" fill="var(--accent)" stroke="var(--accent-ink)"></path><path d="m4.7 7.1 1.3 1.3 2.4-2.6" stroke="var(--on-accent)"></path><path d="{hx(6.5, 17, 4.2)}"></path><path d="M13 7h8M13 17h8"></path>'),
    'Notes': ('<path d="M6 3h9l4 4v14H6z"></path><path d="M15 3v4h4M9 12h6M9 16h4"></path>', '<path d="M6 3h9l4 4v14H6z" fill="var(--accent)" stroke="var(--accent-ink)"></path><path d="M15 3v4h4M9 12h6M9 16h4" stroke="var(--on-accent)"></path>'),
    'Folders': ('<path d="M7.5 9V4.5a1 1 0 0 1 1-1h5l2 2v3.5"></path><path d="M10.5 9V6.5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1V9"></path><path d="M3 9.5A1.5 1.5 0 0 1 4.5 8h4l1.6 1.6h9.4A1.5 1.5 0 0 1 21 11.2l-1 7.4A2.7 2.7 0 0 1 17.3 21H6.7A2.7 2.7 0 0 1 4 18.6Z"></path>',
                '<path d="M7.5 9V4.5a1 1 0 0 1 1-1h5l2 2v3.5" fill="var(--surface)"></path><path d="M10.5 9V6.5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1V9" fill="var(--surface)"></path><path d="M3 9.5A1.5 1.5 0 0 1 4.5 8h4l1.6 1.6h9.4A1.5 1.5 0 0 1 21 11.2l-1 7.4A2.7 2.7 0 0 1 17.3 21H6.7A2.7 2.7 0 0 1 4 18.6Z" fill="var(--accent)" stroke="var(--accent-ink)"></path>'),
    'Profile': ('<circle cx="12" cy="8" r="4"></circle><path d="M4 21c1.2-4 4.4-6 8-6s6.8 2 8 6"></path>', '<circle cx="12" cy="8" r="4" fill="var(--accent)" stroke="var(--accent-ink)"></circle><path d="M4 21c1.2-4 4.4-6 8-6s6.8 2 8 6" fill="var(--accent)" stroke="var(--accent-ink)"></path>'),
}
PLUS = '<path d="M12 5v14M5 12h14"></path>'


def nav2(style, active):
    items = ''
    for i, (lbl, (o, f)) in enumerate(G2.items()):
        if lbl == 'Profile':
            continue
        on = lbl == active
        if style == 'A':
            svg = f'<svg width="24" height="24" viewBox="0 0 24 24" {SV}>{o}</svg>'
            col = 'var(--accent-ink)' if on else 'var(--ink-muted)'
            pill = 'background: var(--accent-soft);' if on else ''
        else:
            svg = f'<svg width="24" height="24" viewBox="0 0 24 24" {SV}>{f if on else o}</svg>'
            col = 'var(--ink)' if on else 'var(--ink-muted)'
            pill = ''
        items += (f'<span style="display: flex; flex-direction: column; align-items: center; gap: 4px; width: 64px; color: {col}; font-size: 11px; font-weight: {600 if on else 500}">'
                  f'<span style="width: 56px; height: 32px; border-radius: 9999px; display: grid; place-items: center; {pill}">{svg}</span>{lbl}</span>')
        if i == 1:
            items += f'<span style="width: 50px; height: 50px; border-radius: 16px; background: var(--accent); color: var(--on-accent); display: grid; place-items: center"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round">{PLUS}</svg></span>'
    return f'<div style="width: 390px; height: 76px; border-radius: 24px; background: var(--surface); display: flex; align-items: center; justify-content: space-around; box-sizing: border-box; padding: 0 8px">{items}</div>'

ic = head('14 · Icons v2',
          'Your changes: a plain plus with no circle, Tasks keeps the list but its box becomes a comb cell with the check, a soft Home with no sharp corners, and an open folder with files inside. Notes and Profile stay.')
big = lambda st: ''.join(f'<div style="display: flex; flex-direction: column; align-items: center; gap: 10px; font-size: 13px; color: var(--ink-muted)"><svg width="64" height="64" viewBox="0 0 24 24" {SV.replace("1.75", "1.3")} style="color: var(--ink)">{(o if st == 0 else f)}</svg>{l}</div>' for l, (o, f) in G2.items())
ic += card(h2('Idle') + f'<div style="display: flex; gap: 56px">{big(0)}<div style="display: flex; flex-direction: column; align-items: center; gap: 10px; font-size: 13px; color: var(--ink-muted)"><svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" style="color: var(--ink)">{PLUS}</svg>Add</div></div>'
           + h2('Active, honey filled') + f'<div style="display: flex; gap: 56px">{big(1)}</div>')
ic += '<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 28px">'
ic += card(tag('A · Soft pill when active', 'alt') + nav2('A', 'Tasks') + nav2('A', 'Folders'))
ic += card(tag('B · Honey fill when active', 'rec') + nav2('B', 'Tasks') + nav2('B', 'Folders') + note('My pick now: with the comb cell in Tasks, the fill reads like honey filling a cell. The Add button becomes a soft square with a plain plus, so it no longer looks like a coin.'))
ic += '</div>'
boards['Icons2.dc.html'] = ('14 · Icons v2', 1440, 1000, ic)

# ------------------------------------------------------------------ Empty states v2
S2 = 'stroke="var(--on-pastel)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"'


def mini_logo(x, y, size):
    gen._lid[0] += 1
    i = f'ml{gen._lid[0]}'
    return (f'<svg x="{x}" y="{y}" width="{size}" height="{size}" viewBox="-6 -1 76 76" style="overflow: visible">'
            + gen.LOGO_INNER.replace('LGID', i) + '</svg>')

first_task = (f'<svg width="240" height="180" viewBox="0 0 200 150" aria-hidden="true" style="display: block">'
              '<ellipse cx="100" cy="136" rx="70" ry="8" style="fill: var(--surface-raised)"></ellipse>'
              '<circle cx="156" cy="34" r="14" style="fill: var(--accent)"></circle>'
              f'<rect x="58" y="28" width="84" height="104" rx="14" style="fill: var(--lavender)" {S2}></rect>'
              f'<rect x="80" y="20" width="40" height="18" rx="7" style="fill: var(--butter)" {S2}></rect>'
              + mini_logo(66, 45, 30) +
              f'<path fill="none" {S2} d="M96 60h30"></path>'
              f'<circle cx="80" cy="84" r="8" style="fill: #fdfcf9" {S2}></circle><path fill="none" {S2} d="M96 84h24"></path>'
              f'<circle cx="80" cy="108" r="8" style="fill: #fdfcf9" {S2}></circle><path fill="none" {S2} d="M96 108h28"></path></svg>')
all_done = (f'<svg width="240" height="180" viewBox="0 0 200 150" aria-hidden="true" style="display: block; overflow: visible">'
            '<ellipse cx="100" cy="136" rx="70" ry="8" style="fill: var(--surface-raised)"></ellipse>'
            '<ellipse cx="100" cy="134" rx="16" ry="3.2" style="fill: var(--accent)"></ellipse>'
            f'<rect x="30" y="44" width="28" height="10" rx="5" transform="rotate(-20 44 49)" style="fill: var(--mint)" {S2}></rect>'
            f'<rect x="146" y="30" width="24" height="10" rx="5" transform="rotate(25 158 35)" style="fill: var(--lavender)" {S2}></rect>'
            f'<path d="{HEXP}" transform="translate(150 94) scale(1.05)" style="fill: var(--sky)" {S2}></path>'
            f'<path d="{HEXP}" transform="translate(34 94) scale(.7)" style="fill: var(--peach)" {S2}></path>'
            + mini_logo(52, 8, 100) + '</svg>')
es2 = head('15 · Empty states with the logo',
           'Two changes you asked for, drawn in the original illustration style (pastel shapes, dark 2 px outlines, soft ground).')
es2 += '<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 28px">'
es2 += card(tag('Add your first task', 'rec') + f'<div style="display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 12px 0">{first_task}<span style="font-size: 17px; font-weight: 600">Add your first task</span><span style="font-size: 14px; line-height: 20px; color: var(--ink-muted); text-align: center; max-width: 320px">Type it above and press Enter, or press Q anywhere.</span>{btn("Add a task")}</div>'
            + note('Same clipboard, but the ticked box is our logo: a little promise of what a done task looks like here.'))
es2 += card(tag('All done for today', 'rec') + f'<div style="display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 12px 0">{all_done}<span style="font-size: 17px; font-weight: 600">All done for today</span><span style="font-size: 14px; line-height: 20px; color: var(--ink-muted); text-align: center; max-width: 320px">Nice work. Tomorrow has 2 tasks waiting.</span>{btn("See tomorrow", "outline", None, "chevronRight")}</div>'
            + note('The logo, big, with the drop already landed as a little honey puddle on the ground: the day is sealed. Pastel bits turn into comb cells.'))
es2 += '</div>'
boards['EmptyStates2.dc.html'] = ('15 · Empty states with the logo', 1440, 820, es2)

# ------------------------------------------------------------------ Date wheel (interactive)
wheel_css = ('.dw-stage{perspective:900px;perspective-origin:50% 50%;touch-action:pan-y;cursor:grab;user-select:none}'
             '.dw-stage:active{cursor:grabbing}.dw-stage:focus-visible{outline:2px solid var(--ring);outline-offset:4px}'
             '.dw-cyl{position:absolute;left:50%;top:50%;transform-style:preserve-3d}'
             '.dw-card{position:absolute;left:0;top:0;box-sizing:border-box;border-radius:14px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;backface-visibility:hidden;transition:background-color .2s,height .2s}'
             '.dw-day{font-size:18px;font-weight:600}.dw-wd{font-size:11px;font-weight:500;opacity:.8}'
             '.dw-dot{width:5px;height:5px;border-radius:50%}'
             '.dw-cal button:hover{background:var(--surface)}')


def wheel_board():
    return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Date wheel</title>
<script src="./support.js"></script>
<link rel="stylesheet" href="ds/zen/tokens.css">
<link rel="stylesheet" href="ds/zen/components/bundle.css">
<script src="ds/zen/components/bundle.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&amp;display=swap">
<style>body{{margin:0}} {wheel_css}</style>
</helmet>
<div data-theme="{{{{theme}}}}" style="width: {{{{wpx}}}}; height: 330px; box-sizing: border-box; padding: 20px; display: flex; flex-direction: column; gap: 14px; background: var(--surface); border-radius: 28px; color: var(--ink); font-family: var(--font-sans); position: relative">
<div style="display: flex; align-items: center; justify-content: space-between; gap: 8px">
<button type="button" onClick="{{{{toggleCal}}}}" aria-haspopup="dialog" aria-expanded="{{{{calOpen}}}}" style="display: flex; align-items: center; gap: 6px; height: 40px; padding: 0 12px 0 14px; border: 0; border-radius: 9999px; background: var(--surface-raised); color: var(--ink); font-family: var(--font-sans); font-size: 15px; font-weight: 600; cursor: pointer">{icon("calendar", 18)}<span>{{{{label}}}}</span>{icon("chevronDown", 16)}</button>
<div style="display: flex; gap: 8px; align-items: center">
<button type="button" onClick="{{{{goToday}}}}" style="height: 36px; padding: 0 14px; border-radius: 9999px; border: 1.5px solid var(--line-strong); background: transparent; color: var(--ink); font-family: var(--font-sans); font-size: 13px; font-weight: 600; cursor: pointer">Today</button>
<button type="button" aria-label="Earlier" onClick="{{{{prevWeek}}}}" style="width: 36px; height: 36px; border-radius: 12px; border: 0; background: var(--surface-raised); color: var(--ink); display: grid; place-items: center; cursor: pointer; transform: rotate(180deg)">{icon("chevronRight", 18)}</button>
<button type="button" aria-label="Later" onClick="{{{{nextWeek}}}}" style="width: 36px; height: 36px; border-radius: 12px; border: 0; background: var(--surface-raised); color: var(--ink); display: grid; place-items: center; cursor: pointer">{icon("chevronRight", 18)}</button>
</div>
</div>
<div class="dw-stage" tabIndex="0" role="listbox" aria-label="Pick a day" onPointerDown="{{{{down}}}}" onPointerMove="{{{{move}}}}" onPointerUp="{{{{up}}}}" onPointerCancel="{{{{up}}}}" onWheel="{{{{wheel}}}}" onKeyDown="{{{{key}}}}" style="position: relative; flex-grow: 1; overflow: hidden; border-radius: 20px; background: var(--bg)">
<div class="dw-cyl" style="transform: translateZ({{{{negR}}}})">
<sc-for list="{{{{cards}}}}" as="c" hint-placeholder-count="12">
<div class="dw-card" role="option" aria-selected="{{{{c.sel}}}}" onClick="{{{{c.pick}}}}" style="{{{{c.style}}}}">
<span class="dw-day">{{{{c.day}}}}</span><span class="dw-wd">{{{{c.wd}}}}</span><span class="dw-dot" style="background: {{{{c.dot}}}}"></span>
</div>
</sc-for>
</div>
<div style="position: absolute; inset: 0; pointer-events: none; background: linear-gradient(90deg, var(--bg) 0%, transparent 18%, transparent 82%, var(--bg) 100%)"></div>
</div>
<span style="font-size: 12px; color: var(--ink-muted)">{{{{hint}}}}</span>
<sc-if value="{{{{calOpen}}}}" hint-placeholder-val="{{{{no}}}}">
<div class="dw-cal" role="dialog" aria-label="Choose a date" style="position: absolute; left: 20px; top: 68px; z-index: 5; width: 300px; box-sizing: border-box; padding: 14px; border-radius: 20px; background: var(--surface-raised); box-shadow: var(--shadow-float); display: flex; flex-direction: column; gap: 10px">
<div style="display: flex; justify-content: space-between; align-items: center"><span style="font-size: 15px; font-weight: 600">{{{{calTitle}}}}</span><span style="font-size: 12px; color: var(--ink-muted)">Dots mark days with tasks</span></div>
<div style="display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 2px; font-size: 11px; color: var(--ink-muted); text-align: center"><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span></div>
<div style="display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 2px">
<sc-for list="{{{{cal}}}}" as="d" hint-placeholder-count="35">
<button type="button" onClick="{{{{d.pick}}}}" disabled="{{{{d.off}}}}" style="{{{{d.style}}}}">{{{{d.n}}}}</button>
</sc-for>
</div>
</div>
</sc-if>
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{{"theme":{{"editor":"enum","options":["dark","light"],"default":"dark"}},"w":{{"editor":"int","default":1000}},"$preview":{{"width":1000,"height":330}}}}'>
class Component extends DCLogic {{
  constructor(props) {{
    super(props);
    this.state = {{ rot: 0, calOpen: false }};
    this.drag = null; this.anim = 0;
    this.today = new Date(2026, 8, 30);
    this.busy = {{ '-2': 1, 0: 1, 1: 1, 3: 1, 6: 1 }};
    this.minI = -7; this.maxI = 9;
  }}
  componentWillUnmount() {{ cancelAnimationFrame(this.anim); }}
  dateAt(i) {{ const d = new Date(this.today); d.setDate(d.getDate() + i); return d; }}
  clampSoft(r) {{
    if (r < this.minI) return this.minI - (this.minI - r) * 0.3;
    if (r > this.maxI + 1) return this.maxI + 1 + (r - this.maxI - 1) * 0.3;
    return r;
  }}
  glideTo(target, v) {{
    cancelAnimationFrame(this.anim);
    target = Math.max(this.minI, Math.min(this.maxI, Math.round(target)));
    let x = this.state.rot, vel = v || 0;
    const k = 170, c = 26, dt = 1 / 60;
    const step = () => {{
      const a = -k * (x - target) - c * vel;
      vel += a * dt; x += vel * dt;
      if (Math.abs(x - target) < 0.002 && Math.abs(vel) < 0.01) {{ this.setState({{ rot: target }}); return; }}
      this.setState({{ rot: x }});
      this.anim = requestAnimationFrame(step);
    }};
    this.anim = requestAnimationFrame(step);
  }}
  renderVals() {{
    const W = this.props.w ?? 1000;
    const phone = W < 500;
    const cw = phone ? 54 : 64, gap = phone ? 8 : 12;
    const theta = phone ? 13 : 9.5;
    const R = (cw + gap) / 2 / Math.tan((theta / 2) * Math.PI / 180);
    const rot = this.state.rot;
    const sel = Math.round(rot);
    const wd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const cards = [];
    for (let i = this.minI; i <= this.maxI + 1; i++) {{
      const ang = (i - rot) * theta;
      if (Math.abs(ang) > 86) continue;
      const end = i === this.maxI + 1;
      const isSel = i === sel && !end;
      const today = i === 0;
      const h = isSel ? 92 : 76;
      const fade = Math.max(0.15, Math.cos(ang * Math.PI / 180));
      const bg = isSel ? 'var(--accent)' : 'var(--surface-raised)';
      const col = isSel ? 'var(--on-accent)' : 'var(--ink)';
      const ring = today && !isSel ? 'box-shadow: inset 0 0 0 2px var(--accent-ink);' : '';
      const d = this.dateAt(i);
      const style = end
        ? `width: 130px; height: 76px; margin-left: -65px; margin-top: -38px; transform: rotateY(${{ang}}deg) translateZ(${{R}}px); opacity: ${{fade}}; border: 1.5px dashed var(--line-strong); color: var(--ink-muted); font-size: 12px; text-align: center; padding: 0 10px`
        : `width: ${{cw}}px; height: ${{h}}px; margin-left: ${{-cw / 2}}px; margin-top: ${{-h / 2}}px; transform: rotateY(${{ang}}deg) translateZ(${{R}}px); opacity: ${{fade}}; background: ${{bg}}; color: ${{col}}; ${{ring}} cursor: pointer`;
      cards.push({{
        sel: isSel ? 'true' : 'false',
        day: end ? 'Nothing planned' : d.getDate(),
        wd: end ? 'after ' + this.dateAt(this.maxI - 3).getDate() + ' Oct' : (today ? 'Today' : wd[d.getDay()]),
        dot: !end && this.busy[i] ? (isSel ? 'var(--on-accent)' : 'var(--accent-ink)') : 'transparent',
        style,
        pick: () => {{ if (!end) this.glideTo(i, 0); }},
      }});
    }}
    const sd = this.dateAt(Math.max(this.minI, Math.min(this.maxI, sel)));
    const label = sel === 0 ? 'Today, ' + sd.getDate() + ' ' + sd.toLocaleDateString('en-GB', {{ month: 'long' }}) : sd.toLocaleDateString('en-GB', {{ weekday: 'long', day: 'numeric', month: 'long' }});
    // month grid for the picker
    const first = new Date(sd.getFullYear(), sd.getMonth(), 1);
    const lead = (first.getDay() + 6) % 7;
    const days = new Date(sd.getFullYear(), sd.getMonth() + 1, 0).getDate();
    const cal = [];
    for (let k = 0; k < lead; k++) cal.push({{ n: '', off: true, style: 'height: 34px; border: 0; background: transparent', pick: () => {{}} }});
    for (let n = 1; n <= days; n++) {{
      const dt = new Date(sd.getFullYear(), sd.getMonth(), n);
      const i = Math.round((dt - this.today) / 864e5);
      const isS = i === sel, isT = i === 0, has = this.busy[i];
      cal.push({{
        n, off: false,
        style: `height: 34px; border: 0; border-radius: 10px; font-family: var(--font-sans); font-size: 13px; font-weight: ${{isS || isT ? 600 : 400}}; cursor: pointer; background: ${{isS ? 'var(--accent)' : 'transparent'}}; color: ${{isS ? 'var(--on-accent)' : isT ? 'var(--accent-ink)' : 'var(--ink)'}}; ${{has && !isS ? 'text-decoration: underline; text-decoration-color: var(--accent-ink); text-underline-offset: 4px;' : ''}}`,
        pick: () => {{
          if (i > this.maxI) {{ this.maxI = i + 3; }}
          if (i < this.minI) {{ this.minI = i; }}
          this.setState({{ calOpen: false }}); this.glideTo(i, 0);
        }},
      }});
    }}
    return {{
      theme: this.props.theme ?? 'dark', no: false,
      wpx: W + 'px', negR: (-R) + 'px', cards, label, cal, calOpen: this.state.calOpen,
      calTitle: sd.toLocaleDateString('en-GB', {{ month: 'long', year: 'numeric' }}),
      s16: 16, s18: 18,
      hint: phone ? 'Flick to spin, tap a day. Stops 3 days after your last task.' : 'Drag or flick to spin (it keeps turning with your speed), scroll with the wheel or trackpad, or use the arrow keys. Stops 3 days after your last task.',
      toggleCal: () => this.setState({{ calOpen: !this.state.calOpen }}),
      goToday: () => this.glideTo(0, 0),
      prevWeek: () => this.glideTo(Math.round(this.state.rot) - 7, 0),
      nextWeek: () => this.glideTo(Math.round(this.state.rot) + 7, 0),
      down: (e) => {{
        cancelAnimationFrame(this.anim);
        this.drag = {{ x: e.clientX, rot: this.state.rot, t: performance.now(), v: 0, lx: e.clientX, moved: false }};
        try {{ e.currentTarget.setPointerCapture(e.pointerId); }} catch (err) {{}}
      }},
      move: (e) => {{
        if (!this.drag) return;
        const per = (phone ? 62 : 76);
        const now = performance.now();
        const dx = e.clientX - this.drag.lx;
        const dt = Math.max(1, now - this.drag.t);
        this.drag.v = 0.8 * (-dx / per / (dt / 1000)) + 0.2 * this.drag.v;
        this.drag.lx = e.clientX; this.drag.t = now;
        if (Math.abs(e.clientX - this.drag.x) > 4) this.drag.moved = true;
        this.setState({{ rot: this.clampSoft(this.drag.rot - (e.clientX - this.drag.x) / per) }});
      }},
      up: () => {{
        if (!this.drag) return;
        const v = this.drag.v, moved = this.drag.moved;
        this.drag = null;
        if (!moved) return;
        // speed sensitive: a fast flick travels further, then settles on a whole day
        this.glideTo(this.state.rot + v * 0.32, v);
      }},
      wheel: (e) => {{
        const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
        cancelAnimationFrame(this.anim);
        const r = this.clampSoft(this.state.rot + d / 90);
        this.setState({{ rot: r }});
        clearTimeout(this.wt); this.wt = setTimeout(() => this.glideTo(this.state.rot, 0), 120);
      }},
      key: (e) => {{
        const r = Math.round(this.state.rot);
        const m = {{ ArrowLeft: -1, ArrowRight: 1, PageUp: -7, PageDown: 7 }};
        if (e.key in m) {{ e.preventDefault(); this.glideTo(r + m[e.key], 0); }}
        if (e.key === 'Home') {{ e.preventDefault(); this.glideTo(0, 0); }}
      }},
    }};
  }}
}}
</script>
</body>
</html>
'''

open(os.path.join(P, 'DateWheel.dc.html'), 'w').write(wheel_board())
dwb = head('16 · Date wheel: a spinning disk with today in the middle',
           'Press Play on this board and try it. The days sit on a cylinder, so spinning it turns the disk and the perspective shifts as cards come round. Today starts in the centre. Above it, the date button opens a month picker to jump anywhere fast.')
dwb += '<div style="display: flex; flex-direction: column; gap: 10px">' + tag('Desktop and tablet', 'rec') + '<dc-import name="DateWheel" w="{{w1000}}" theme="{{theme}}" hint-size="1000px,330px"></dc-import></div>'
dwb += '<div style="display: flex; gap: 40px; align-items: flex-start"><div style="display: flex; flex-direction: column; gap: 10px">' + tag('Phone', 'rec') + '<dc-import name="DateWheel" w="{{w358}}" theme="{{theme}}" hint-size="358px,330px"></dc-import></div>'
dwb += card(h2('How it behaves') + '<ul style="margin: 0; padding-left: 20px; display: flex; flex-direction: column; gap: 6px; font-size: 14px; line-height: 20px">'
            '<li>Speed sensitive: drag and it follows your finger exactly; flick and it keeps spinning with your speed, slows like a real disk, then clicks onto a whole day (spring, no overshoot you can feel).</li>'
            '<li>Range: from your oldest overdue task, or 7 days back, to 3 days after your last planned task. Past that end it resists like a rubber band and shows "Nothing planned after".</li>'
            '<li>The date picker can jump outside the range; the wheel then extends to include that day.</li>'
            '<li>Cards: radius 14 (option A), the selected day grows and fills amber, today keeps an amber ring, a dot marks days with tasks.</li>'
            '<li>Keyboard: arrows move a day, Page Up and Down a week, Home goes to today. Screen readers get a list of days.</li>'
            '<li>Reduced motion: the flat strip from option A, no spin.</li></ul>', extra='flex-grow: 1') + '</div>'
boards['DateWheelBoard.dc.html'] = ('16 · Date wheel', 1440, 1040, dwb)

# ------------------------------------------------------------------ Round 3 index
r3 = head('Round 3 · for your approval',
          'Everything you approved in round 2 is built and live. These four are the redesigns you asked for. Reply with yes, no or changes per board.')
items = [('Celebrate', '13 · Celebrations', 'Tick, first task, all done. No bee.'),
         ('DateWheelBoard', '16 · Date wheel', 'Interactive: press Play and spin it.'),
         ('Icons2', '14 · Icons v2', 'Your changes. A or B?'),
         ('EmptyStates2', '15 · Empty states with the logo', 'All done and first task.')]
r3 += '<div style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 20px">'
for f, t, q in items:
    r3 += (f'<a href="{f}.dc.html" style="text-decoration: none; color: var(--ink); display: flex; flex-direction: column; gap: 8px; padding: 20px; border-radius: 24px; background: var(--surface); min-height: 100px; box-sizing: border-box">'
           f'<span style="font-size: 15px; font-weight: 600">{t}</span><span style="font-size: 13px; line-height: 18px; color: var(--ink-muted)">{q}</span></a>')
r3 += '</div>'
r3 += card(h2('Built from round 2, live now') + '<ul style="margin: 0; padding-left: 20px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px 32px; font-size: 14px; line-height: 20px">'
           '<li>Welcome screen with name and theme</li><li>Greeting by time, weekday, new or returning; name updates live</li>'
           '<li>Quick add: Add button on the right, plain plus, hint line, shortcuts tip later</li><li>Friendly toasts with badges and sounds</li>'
           '<li>Softer dark pastels plus your own colours (palette button)</li><li>Row actions, Low priority, tooltips, list or grid</li>'
           '<li>Centred confirm dialogs</li><li>Motion: toast springs, tick then glide to Completed, splash logo flies in, page transitions</li></ul>')
boards['Round3.dc.html'] = ('Round 3 · start here', 1440, 620, r3)

# ------------------------------------------------------------------ write + canvas
for name, v in boards.items():
    title, w, h, body = v[0], v[1], v[2], v[3]
    css = v[4] if len(v) > 4 else ''
    open(os.path.join(P, name), 'w').write(gen.board(name, title, w, h, body, css))

cv = json.load(open(os.path.join(P, 'canvas.json')))
cv['pages'] = [{'id': 'r2', 'name': 'Round 2'}, {'id': 'r3', 'name': 'Round 3'}]
for k in list(cv['boards']):
    cv['boards'][k]['page'] = 'r2'
lay = [('Round3.dc.html', 0, 0), ('Celebrate.dc.html', 0, 740), ('DateWheelBoard.dc.html', 1520, 0),
       ('DateWheel.dc.html', 3040, 0), ('Icons2.dc.html', 1520, 1160), ('EmptyStates2.dc.html', 0, 1980)]
sizes = {'Round3.dc.html': (1440, 620), 'Celebrate.dc.html': (1440, 1120), 'DateWheelBoard.dc.html': (1440, 1040), 'DateWheel.dc.html': (1000, 330), 'Icons2.dc.html': (1440, 1000), 'EmptyStates2.dc.html': (1440, 820)}
titles = {k: boards[k][0] for k in boards}
titles['DateWheel.dc.html'] = 'Date wheel component'
for n, x, y in lay:
    w, h = sizes[n]
    e = {'x': x, 'y': y, 'w': w, 'h': h, 'title': titles[n], 'page': 'r3'}
    if n in ('Celebrate.dc.html', 'DateWheelBoard.dc.html', 'DateWheel.dc.html'):
        e['is_interactive'] = True
    cv['boards'][n] = e
    if n not in cv['order']:
        cv['order'].append(n)
cv['launch'] = {'view': 'canvas', 'page': 'r3'}
json.dump(cv, open(os.path.join(P, 'canvas.json'), 'w'), indent=1)
print('ok')
