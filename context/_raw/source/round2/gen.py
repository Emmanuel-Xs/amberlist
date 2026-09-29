import json, os, datetime

R = os.path.dirname(os.path.abspath(__file__))
P = os.path.join(R, 'project')
LOGO_INNER = open(os.path.join(R, 'logo_inner.txt')).read()
_lid = [0]


def logo(size, cls=''):
    _lid[0] += 1
    i = f'lg{_lid[0]}'
    return (f'<svg width="{size}" height="{size}" viewBox="-6 -1 76 76" aria-hidden="true" class="{cls}" '
            f'style="display: block; flex-shrink: 0; overflow: visible">' + LOGO_INNER.replace('LGID', i) + '</svg>')


def icon(name, size=20, extra=''):
    return f'<x-import component-from-global-scope="Zen.Icon" name="{name}" size="{{{{s{size}}}}}"{extra}></x-import>'


def btn(label, variant=None, size=None, ic=None, extra=''):
    a = ''
    if variant: a += f' variant="{variant}"'
    if size: a += f' size="{size}"'
    if ic: a += f' icon="{ic}"'
    return f'<x-import component-from-global-scope="Zen.Button"{a}{extra}>{label}</x-import>'


def chip(label, sel=False, ic=None):
    a = ' selected="{{yes}}"' if sel else ''
    if ic: a += f' icon="{ic}"'
    return f'<x-import component-from-global-scope="Zen.Chip"{a}>{label}</x-import>'


def tag(text, kind='cur'):
    st = {
        'cur': 'background: var(--surface-raised); color: var(--ink-muted)',
        'rec': 'background: var(--accent); color: var(--on-accent)',
        'alt': 'background: transparent; color: var(--ink); border: 1.5px solid var(--line-strong)',
        'no': 'background: var(--danger-soft); color: var(--danger)',
    }[kind]
    return (f'<span style="display: inline-flex; align-items: center; height: 26px; padding: 0 12px; border-radius: 9999px; '
            f'font-size: 12px; font-weight: 600; box-sizing: border-box; {st}">{text}</span>')


def head(title, sub):
    return (f'<header style="display: flex; flex-direction: column; gap: 6px; max-width: 1100px">'
            f'<h1 class="display-lg" style="margin: 0">{title}</h1>'
            f'<p style="margin: 0; font-size: 15px; line-height: 22px; color: var(--ink-muted)">{sub}</p></header>')


def card(inner, pad=24, gap=16, extra=''):
    return (f'<section style="display: flex; flex-direction: column; gap: {gap}px; padding: {pad}px; border-radius: 28px; '
            f'background: var(--surface); {extra}">{inner}</section>')


def h2(t):
    return f'<h2 class="heading" style="margin: 0">{t}</h2>'


def note(t):
    return f'<p style="margin: 0; font-size: 13px; line-height: 19px; color: var(--ink-muted)">{t}</p>'


def phone(inner, h=844, bg='var(--bg)', extra=''):
    return (f'<div style="width: 390px; height: {h}px; flex-shrink: 0; box-sizing: border-box; border-radius: 40px; '
            f'border: 1px solid var(--line); background: {bg}; overflow: hidden; position: relative; {extra}">{inner}</div>')


def board(name, title, w, h, body, css=''):
    return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>{title}</title>
<script src="./support.js"></script>
<link rel="stylesheet" href="ds/zen/tokens.css">
<link rel="stylesheet" href="ds/zen/components/bundle.css">
<script src="ds/zen/components/bundle.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&amp;display=swap">
<style>body{{margin:0}} kbd{{font-family:var(--font-sans)}} {css}</style>
</helmet>
<div data-theme="{{{{theme}}}}" style="width: {w}px; height: {h}px; box-sizing: border-box; padding: 48px 56px; display: flex; flex-direction: column; gap: 28px; background: var(--bg); color: var(--ink); font-family: var(--font-sans); overflow: hidden">
{body}
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{{"theme":{{"editor":"enum","options":["dark","light"],"default":"dark"}},"$preview":{{"width":{w},"height":{h}}}}}'>
class Component extends DCLogic {{
  renderVals() {{
    return {{ theme: this.props.theme ?? 'dark', yes: true, no: false, s14: 14, s16: 16, s18: 18, s20: 20, s22: 22, s24: 24, s28: 28, s32: 32, w120: 120, w140: 140, w160: 160 }};
  }}
}}
</script>
</body>
</html>
'''


KBD = 'display: inline-grid; place-items: center; min-width: 22px; height: 22px; padding: 0 6px; box-sizing: border-box; font-size: 12px; color: var(--ink-muted); border: 1px solid var(--line-strong); border-radius: 7px'


def kbd(k):
    return f'<kbd style="{KBD}">{k}</kbd>'


def row(title, meta='', done=False, menu='inset', extra='', lead_extra=''):
    circ = ('background: var(--accent); border: 1.5px solid var(--accent-edge); color: var(--on-accent)'
            if done else 'border: 1.5px solid var(--line-strong)')
    check = icon('check', 14) if done else ''
    mt = f'<span style="font-size: 13px; color: var(--ink-muted); display: flex; align-items: center; gap: 6px">{meta}</span>' if meta else ''
    tt = 'text-decoration: line-through; color: var(--ink-muted)' if done else ''
    if menu == 'edge':
        m = f'<span style="width: 28px; height: 44px; display: grid; place-items: center; margin-right: -12px; color: var(--ink-muted)">{icon("more", 20)}</span>'
    elif menu == 'none':
        m = ''
    elif menu == 'hover':
        m = (f'<span style="display: flex; gap: 4px">'
             f'<button type="button" aria-label="Open" style="width: 36px; height: 36px; border-radius: 12px; border: 0; background: var(--surface-raised); color: var(--ink); display: grid; place-items: center">{icon("chevronRight", 18)}</button>'
             f'<button type="button" aria-label="More actions" style="width: 36px; height: 36px; border-radius: 12px; border: 0; background: var(--surface-raised); color: var(--ink); display: grid; place-items: center">{icon("more", 18)}</button></span>')
    else:
        m = f'<button type="button" aria-label="More actions" style="width: 36px; height: 36px; border-radius: 12px; border: 0; background: transparent; color: var(--ink-muted); display: grid; place-items: center">{icon("more", 20)}</button>'
    return (f'<div style="display: flex; align-items: center; gap: 14px; min-height: 64px; padding: 10px 12px 10px 16px; box-sizing: border-box; '
            f'border-radius: 20px; background: var(--surface); box-shadow: var(--shadow-card); {extra}">'
            f'<span style="width: 24px; height: 24px; border-radius: 50%; box-sizing: border-box; display: grid; place-items: center; flex-shrink: 0; {circ}">{check}</span>'
            f'<span style="flex-grow: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0">'
            f'<span style="font-size: 15px; font-weight: 500; {tt}">{title}</span>{mt}</span>{lead_extra}{m}</div>')


BEE = '''<svg width="SZ" height="SZ" viewBox="0 0 48 48" aria-hidden="true" style="display: block; overflow: visible">
<ellipse cx="18" cy="15" rx="9" ry="6.5" transform="rotate(-24 18 15)" fill="var(--sky)" fill-opacity=".55" stroke="var(--on-pastel)" stroke-width="1.6"></ellipse>
<ellipse cx="28" cy="13" rx="8" ry="6" transform="rotate(20 28 13)" fill="var(--sky)" fill-opacity=".55" stroke="var(--on-pastel)" stroke-width="1.6"></ellipse>
<ellipse cx="24" cy="28" rx="13" ry="10" fill="var(--accent)" stroke="var(--on-pastel)" stroke-width="2"></ellipse>
<path d="M20 18.8c-1.8 2.6-2.6 5.8-2.4 9.2s1.4 6.4 3.4 8.6M28.5 18.8c1.5 2.8 2 6 1.6 9.2s-1.8 6.1-3.8 8.1" fill="none" stroke="var(--on-pastel)" stroke-width="3.4" stroke-linecap="round"></path>
<circle cx="35" cy="25.5" r="1.8" fill="var(--on-pastel)"></circle>
<path d="M11 28.5 7.5 29" stroke="var(--on-pastel)" stroke-width="2" stroke-linecap="round"></path>
</svg>'''


def bee(sz):
    return BEE.replace('SZ', str(sz))


def hexcell(size, color, extra=''):
    return (f'<svg width="{size}" height="{size}" viewBox="0 0 24 24" aria-hidden="true" style="display: block; {extra}">'
            f'<path d="M12 2.4 20.31 7.2v9.6L12 21.6 3.69 16.8V7.2Z" fill="var(--{color})" stroke="var(--on-pastel)" stroke-width="1.4" stroke-linejoin="round"></path></svg>')


boards = {}

# ---------------------------------------------------------------- 1 Onboarding
def onboarding_form(w=None):
    return (f'<div style="display: flex; flex-direction: column; gap: 22px; {"width: %dpx" % w if w else ""}">'
            f'<div style="display: flex; flex-direction: column; align-items: flex-start; gap: 14px">{logo(64)}'
            f'<h2 class="display" style="margin: 0">Welcome to Honeylist</h2>'
            f'<p style="margin: 0; font-size: 15px; line-height: 22px; color: var(--ink-muted)">A calm place for your tasks, notes and quick thoughts. Two quick things and you\'re in.</p></div>'
            f'<x-import component-from-global-scope="Zen.Input" label="What should we call you?" placeholder="Your first name" default-value="Emmanuel"></x-import>'
            f'<div style="display: flex; flex-direction: column; gap: 10px"><span style="font-size: 13px; font-weight: 500">Pick a look</span>'
            f'<div style="display: flex; gap: 8px; flex-wrap: wrap">{chip("Dark", True, "moon")}{chip("Light", False, "sun")}{chip("Match device")}</div></div>'
            f'<div style="display: flex; flex-direction: column; gap: 8px">'
            f'<x-import component-from-global-scope="Zen.Button" block="{{{{yes}}}}" size="lg">Let\'s go</x-import>'
            f'{btn("Skip for now", "ghost")}</div>'
            f'{note("You can change both any time in Profile.")}</div>')

ob = head('1 · Welcome and your name',
          'First visit only, before Home. One screen, no tour. On phones it is a full page; on tablet and desktop a dialog over the app. The name field is not focused on phones so the keyboard stays down until you tap it.')
ob += '<div style="display: flex; gap: 48px; align-items: flex-start">'
ob += phone(f'<div style="padding: 72px 24px 24px; box-sizing: border-box; height: 100%">{onboarding_form()}</div>')
ob += ('<div style="display: flex; flex-direction: column; gap: 20px; flex-grow: 1">'
       '<div style="position: relative; width: 880px; height: 560px; border-radius: 24px; overflow: hidden; border: 1px solid var(--line); background: var(--bg)">'
       '<div style="position: absolute; inset: 0; background: var(--scrim)"></div>'
       f'<div style="position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 460px; box-sizing: border-box; padding: 32px; border-radius: 28px; background: var(--surface); box-shadow: var(--shadow-float)">{onboarding_form()}</div></div>'
       + card(h2('After') +
              '<div style="display: flex; gap: 40px">'
              '<div style="display: flex; flex-direction: column; gap: 4px"><span style="font-size: 15px; color: var(--ink-muted)">Good evening, Emmanuel</span>'
              '<span class="display" style="font-size: 26px; font-weight: 600">Let\'s plan your day.</span></div>'
              '<div style="display: flex; flex-direction: column; gap: 4px"><span style="font-size: 15px; color: var(--ink-muted)">Skipped: Good evening</span>'
              '<span class="display" style="font-size: 26px; font-weight: 600">Let\'s plan your day.</span></div></div>'
              + note('If skipped we never ask again with a popup. Profile keeps the name field, and the greeting simply has no name.'), pad=24)
       + '</div></div>')
boards['Onboarding.dc.html'] = ('1 · Welcome and name', 1440, 1040, ob)

# ---------------------------------------------------------------- 2 Quick add
def qa_current():
    return ('<div style="height: 56px; display: flex; align-items: center; gap: 12px; padding: 0 12px 0 10px; border-radius: 9999px; background: var(--surface-raised)">'
            f'<span style="width: 36px; height: 36px; border-radius: 50%; background: var(--accent); color: var(--on-accent); display: grid; place-items: center">{icon("plus", 20)}</span>'
            '<span style="flex-grow: 1; font-size: 15px; color: var(--ink-muted)">Add a task. Try "Read 20 pages tomorrow #study"</span>'
            f'{kbd("Q")}</div>')


def qa_a(focus=False, text=''):
    ring = 'box-shadow: 0 0 0 2px var(--ring)' if focus else ''
    t = (f'<span style="flex-grow: 1; font-size: 15px">{text}<span style="display: inline-block; width: 1.5px; height: 18px; background: var(--ink); vertical-align: -3px; margin-left: 1px"></span></span>'
         if text else '<span style="flex-grow: 1; font-size: 15px; color: var(--ink-muted)">Add a task, like "Call mum tomorrow 5pm"</span>')
    right = (f'<span style="font-size: 12px; color: var(--ink-muted); display: flex; align-items: center; gap: 6px">{kbd("Enter")}</span>'
             + btn('Add', None, 'sm', 'plus')) if focus else (f'<span style="font-size: 12px; color: var(--ink-muted); display: flex; align-items: center; gap: 6px">Press {kbd("Q")} anywhere</span>')
    return (f'<div style="height: 56px; display: flex; align-items: center; gap: 12px; padding: 0 8px 0 18px; border-radius: 9999px; background: var(--surface-raised); {ring}">'
            f'<span style="width: 22px; height: 22px; border-radius: 50%; border: 1.5px dashed var(--line-strong); box-sizing: border-box; flex-shrink: 0"></span>'
            f'{t}{right}</div>')


def search_bar():
    return ('<div style="height: 52px; display: flex; align-items: center; gap: 10px; padding: 0 18px; border-radius: 9999px; border: 1.5px solid var(--line-strong)">'
            f'<span style="color: var(--ink-muted)">{icon("search", 20)}</span><span style="font-size: 15px; color: var(--ink-muted)">Search tasks</span></div>')

qa = head('2 · Quick add that doesn\'t look like search',
          'Today the amber plus sits on the left and Q sits on the right, the same shape as a search bar, so the field reads as search. Proposal: start the field with an empty task circle (it looks like the row you are about to create), move the action to the right, and say the shortcut in words.')
qa += '<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 32px">'
qa += card(tag('Current') + search_bar() + qa_current() + note('Plus on the left, Q on the right: reads as a second search bar.'))
qa += card(tag('A · Recommended', 'rec') + search_bar() + qa_a() + note('Idle: dashed circle like a new row, and "Press Q anywhere" so the shortcut is discoverable.'))
qa += card(tag('A · Typing', 'rec') + qa_a(True, 'Read 20 pages tomorrow #study') +
           '<div style="display: flex; gap: 8px; padding-left: 12px">'
           + ''.join(f'<span style="display: inline-flex; align-items: center; gap: 6px; height: 30px; padding: 0 12px; border-radius: 9999px; background: var(--accent-soft); color: var(--accent-ink); font-size: 13px; font-weight: 500">{icon(i, 16)}{l}</span>' for i, l in [('calendar', 'Tomorrow'), ('folder', 'Study')])
           + '</div>' + note('Focused: amber ring, the Add button appears on the right with Enter beside it, parsed chips show underneath.'))
qa += card(tag('A · Phone', 'rec') +
           '<div style="width: 358px; height: 52px; display: flex; align-items: center; gap: 10px; padding: 0 6px 0 16px; border-radius: 9999px; background: var(--surface-raised); box-sizing: border-box">'
           '<span style="width: 22px; height: 22px; border-radius: 50%; border: 1.5px dashed var(--line-strong); box-sizing: border-box"></span>'
           '<span style="flex-grow: 1; font-size: 15px; color: var(--ink-muted)">Add a task</span>'
           f'<span style="width: 40px; height: 40px; border-radius: 50%; background: var(--accent); color: var(--on-accent); display: grid; place-items: center">{icon("plus", 20)}</span></div>'
           + note('Phones: no shortcut hint, just a round Add button on the right. Tapping the field does not jump the page.'))
qa += '</div>'
boards['QuickAdd.dc.html'] = ('2 · Quick add', 1440, 900, qa)

# ---------------------------------------------------------------- 3 Where things appear
def zone(label, st, tone='accent'):
    col = {'accent': 'var(--accent-soft); color: var(--accent-ink); border: 1.5px dashed var(--accent-ink)',
           'ink': 'var(--surface-raised); color: var(--ink); border: 1.5px dashed var(--line-strong)',
           'danger': 'var(--danger-soft); color: var(--danger); border: 1.5px dashed var(--danger)'}[tone]
    return f'<div style="position: absolute; {st}; box-sizing: border-box; border-radius: 14px; background: {col}; display: grid; place-items: center; font-size: 12px; font-weight: 600; text-align: center; padding: 4px">{label}</div>'

wt = head('3 · Where each kind of message appears',
          'One rule per kind, so nothing surprises you. Toasts never cover the task pane on the right, and nothing floats at the top of the screen.')
wt += '<div style="display: flex; gap: 40px; align-items: flex-start">'
wt += ('<div style="position: relative; width: 820px; height: 520px; border-radius: 24px; border: 1px solid var(--line); background: var(--bg); overflow: hidden; flex-shrink: 0">'
       '<div style="position: absolute; left: 0; top: 0; bottom: 0; width: 150px; background: var(--surface)"></div>'
       '<div style="position: absolute; right: 16px; top: 16px; bottom: 16px; width: 210px; border-radius: 18px; background: var(--surface)"></div>'
       + zone('Banner, in the page', 'left: 170px; top: 20px; width: 420px; height: 52px', 'ink')
       + zone('Dialog: only to confirm something destructive', 'left: 250px; top: 170px; width: 280px; height: 130px', 'danger')
       + zone('Toast', 'left: 170px; bottom: 20px; width: 300px; height: 52px')
       + zone('Task pane: no toasts here', 'right: 16px; top: 16px; width: 210px; height: 488px', 'ink')
       + '<span style="position: absolute; left: 20px; top: 20px; font-size: 12px; color: var(--ink-muted)">Sidebar</span></div>')
wt += ('<div style="position: relative; width: 250px; height: 520px; border-radius: 32px; border: 1px solid var(--line); background: var(--bg); overflow: hidden; flex-shrink: 0">'
       + zone('Banner, in the page', 'left: 14px; top: 60px; right: 14px; height: 50px', 'ink')
       + zone('Dialog is a bottom sheet', 'left: 0; right: 0; bottom: 70px; height: 150px', 'danger')
       + zone('Toast above the bar', 'left: 20px; right: 20px; bottom: 236px; height: 46px')
       + '<div style="position: absolute; left: 0; right: 0; bottom: 0; height: 64px; background: var(--surface)"></div></div>')
wt += '</div>'
rules = [('Toast', 'Result of something you just did, with Undo when it can be undone. Praise lines live here too.', 'Bottom left of the content on desktop, bottom centre above the nav on phones. 4 s, pauses on hover. Max 2 stacked.'),
         ('Celebration', 'Rare moments: first task ever, everything due today done, a habit goal reached.', 'Centre of the screen, never blocks: confetti plus the bee for 1.8 s, then a toast. Tap anywhere to skip.'),
         ('Banner', 'Something about your data that stays true for a while: overdue tasks, you\'re offline, save your data.', 'Inside the page at the top of the list, never floating. Dismissible.'),
         ('Dialog', 'Only when you are about to lose something Undo can\'t bring back: delete a folder, delete everything, merge accounts.', 'Centre on tablet and desktop, bottom sheet on phones. Cancel is focused first.'),
         ('Inline', 'Field errors and save status ("Saving", "Saved").', 'Under the field, or beside the thing being saved.')]
wt += card('<div style="display: grid; grid-template-columns: 160px minmax(0, 1fr) minmax(0, 1fr); gap: 12px 24px; font-size: 14px; line-height: 20px">'
           + '<span style="font-weight: 600; color: var(--ink-muted)">Kind</span><span style="font-weight: 600; color: var(--ink-muted)">When</span><span style="font-weight: 600; color: var(--ink-muted)">Where and how long</span>'
           + ''.join(f'<span style="font-weight: 600">{a}</span><span>{b}</span><span style="color: var(--ink-muted)">{c}</span>' for a, b, c in rules)
           + '</div>')
boards['WhereMessages.dc.html'] = ('3 · Where messages appear', 1440, 1120, wt)

# ---------------------------------------------------------------- 4 Messages (Duolingo style)
def toast(title, body='', badge='logo', action='', tone='neutral', bar=True):
    b = {'logo': f'<span style="width: 40px; height: 40px; display: grid; place-items: center; flex-shrink: 0">{logo(34)}</span>',
         'bee': f'<span style="width: 40px; height: 40px; border-radius: 12px; background: var(--accent-soft); display: grid; place-items: center; flex-shrink: 0">{bee(32)}</span>',
         'check': f'<span style="width: 40px; height: 40px; border-radius: 50%; background: var(--accent); color: var(--on-accent); display: grid; place-items: center; flex-shrink: 0">{icon("check", 20)}</span>',
         'trash': f'<span style="width: 40px; height: 40px; border-radius: 50%; background: var(--surface); color: var(--ink); display: grid; place-items: center; flex-shrink: 0">{icon("trash", 18)}</span>',
         'alert': f'<span style="width: 40px; height: 40px; border-radius: 50%; background: var(--danger-soft); color: var(--danger); display: grid; place-items: center; flex-shrink: 0">{icon("alert", 18)}</span>',
         'flame': f'<span style="width: 40px; height: 40px; border-radius: 50%; background: var(--peach); color: var(--on-pastel); display: grid; place-items: center; flex-shrink: 0">{icon("flame", 20)}</span>'}[badge]
    a = f'<span style="font-size: 14px; font-weight: 600; color: var(--accent-ink); padding: 0 6px">{action}</span>' if action else ''
    bd = f'<span style="font-size: 13px; line-height: 18px; color: var(--ink-muted)">{body}</span>' if body else ''
    barh = '<span style="position: absolute; left: 0; bottom: 0; height: 3px; width: 64%; background: var(--accent)"></span>' if bar else ''
    return (f'<div style="position: relative; overflow: hidden; display: flex; align-items: center; gap: 12px; width: 400px; box-sizing: border-box; padding: 12px 14px 14px 12px; border-radius: 20px; background: var(--surface-raised); box-shadow: var(--shadow-float)">'
            f'{b}<span style="flex-grow: 1; display: flex; flex-direction: column; gap: 2px"><span style="font-size: 15px; font-weight: 600">{title}</span>{bd}</span>{a}{barh}</div>')

ms = head('4 · Friendly messages, Duolingo style',
          'Short, warm, a little playful, never emoji (the design system rule). A badge on the left gives each moment a face: the logo for everyday wins, the bee for first times and streaks. Copy rotates so it doesn\'t repeat. Routine actions stay quiet; the bigger the moment, the more we say.')
ms += '<div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 28px">'
cols = [
    ('Task added', [toast('Added to Today', 'You\'ve got 3 things on today.', 'logo', 'Open'),
                    toast('On the list for Friday', '', 'logo', 'Open'),
                    toast('First one today. Nice.', 'Small steps count.', 'bee')]),
    ('Task done', [toast('Done. 2 left today', 'Moved to Completed.', 'check', 'Undo'),
                   toast('Ticked off. Keep going', '4 done this week.', 'check', 'Undo'),
                   toast('3 days in a row', 'You\'ve finished something every day.', 'flame')]),
    ('Nudges and the rest', [toast('3 tasks slipped past their date', 'Move them to today?', 'alert', 'Move', bar=False),
                             toast('Note deleted', '', 'trash', 'Undo'),
                             toast('Couldn\'t save your note', 'Check your connection.', 'alert', 'Retry', bar=False)]),
]
for t, items in cols:
    ms += '<div style="display: flex; flex-direction: column; gap: 14px">' + h2(t) + ''.join(items) + '</div>'
ms += '</div>'
ms += card(h2('Tone rules') + '<ul style="margin: 0; padding-left: 20px; display: flex; flex-direction: column; gap: 6px; font-size: 14px; line-height: 20px">'
           '<li>Say what happened first ("Moved to Completed"), then the encouragement.</li>'
           '<li>Every completion says where the task went, so nobody wonders if it was deleted.</li>'
           '<li>Overdue gets one gentle banner a day with a real action (Move to today), never a guilt trip.</li>'
           '<li>At most one praise toast per minute; quick add in a row just shows "Added".</li></ul>')
boards['Messages.dc.html'] = ('4 · Friendly messages', 1440, 1000, ms)

# ---------------------------------------------------------------- 5 First task celebration
fl = head('5 · Your first task: bee and honey confetti',
          'Only once, the very first task ever. The bee flies in along a dotted path, circles the new row and lands on its circle; honeycomb shaped confetti in our pastels pops; then a toast. 1.8 s total, tap to skip, and with reduced motion you only get the toast.')
confetti = ''
spots = [(40, 300, 'lavender', 16, 0), (300, 280, 'mint', 14, .1), (90, 250, 'peach', 12, .2), (250, 330, 'sky', 18, .05), (170, 230, 'butter', 14, .15), (330, 240, 'lavender', 10, .25), (60, 360, 'mint', 12, .3), (200, 370, 'peach', 16, .12)]
for x, y, c, s, d in spots:
    confetti += f'<span class="cf" style="position: absolute; left: {x}px; top: {y}px; animation-delay: {d}s">{hexcell(s, c)}</span>'
demo = ('<div style="padding: 64px 16px 0; display: flex; flex-direction: column; gap: 14px">'
        '<span style="font-size: 15px; color: var(--ink-muted)">Good evening, Emmanuel</span>'
        '<span style="font-size: 26px; font-weight: 600">Let\'s plan your day.</span>'
        + '<div class="newrow">' + row('Read 20 pages', icon('calendar', 14) + 'Tomorrow · Study') + '</div></div>'
        + confetti
        + f'<span class="beefly" style="position: absolute; left: 0; top: 0">{bee(44)}</span>'
        + '<div class="toastin" style="position: absolute; left: 16px; right: 16px; bottom: 96px">'
        + toast('Your first task is in', 'Nice start. Tick it when it\'s done.', 'bee').replace('width: 400px', 'width: 100%')
        + '</div>'
        + '<div style="position: absolute; left: 0; right: 0; bottom: 0; height: 72px; background: var(--surface)"></div>')
fl += '<div style="display: flex; gap: 48px; align-items: flex-start">'
fl += '<div style="display: flex; flex-direction: column; gap: 10px">' + tag('Live, loops every 4 s', 'rec') + phone(demo, 700) + '</div>'
steps = [('0 ms', 'Row slides in from the quick add (250 ms).'), ('250 ms', 'Bee flies in on a dotted curve and circles the row (900 ms).'),
         ('900 ms', 'Bee lands on the circle, honeycomb confetti pops out (700 ms).'), ('1200 ms', 'Toast rises: "Your first task is in".'),
         ('1800 ms', 'Bee flies off the top. Done.')]
fl += ('<div style="display: flex; flex-direction: column; gap: 24px; flex-grow: 1">'
       + card(h2('Timeline') + ''.join(f'<div style="display: flex; gap: 16px; font-size: 14px; line-height: 20px"><span style="width: 72px; flex-shrink: 0; font-weight: 600; color: var(--accent-ink)">{a}</span><span>{b}</span></div>' for a, b in steps))
       + card(h2('The bee') + f'<div style="display: flex; gap: 32px; align-items: center">{bee(120)}<div style="display: flex; flex-direction: column; gap: 8px">'
              + note('Original drawing in our illustration style: amber body, 2 px on-pastel outline, sky wings. It only appears for firsts: first task, first note, first 3 day streak, first habit goal.')
              + note('Confetti is little honeycomb cells instead of generic paper, so it belongs to Honeylist.') + '</div></div>')
       + card(h2('Other celebrations') + note('All done for today: the big amber check illustration with the same confetti and the celebrate sound. Ordinary task completions never get confetti, only the toast.'))
       + '</div></div>')
fl_css = ('.beefly{animation:fly 4s ease-in-out infinite;offset-path:path("M -40 120 C 120 20, 330 60, 300 200 S 60 260, 40 196 S 80 170, 36 190");offset-rotate:0deg}'
          '@keyframes fly{0%{offset-distance:0%;opacity:0}8%{opacity:1}45%{offset-distance:100%}70%{offset-distance:100%;transform:translateY(0)}85%{offset-distance:100%;transform:translate(260px,-260px);opacity:1}86%,100%{opacity:0;offset-distance:100%;transform:translate(260px,-260px)}}'
          '.cf{opacity:0;animation:pop 4s ease-out infinite}'
          '@keyframes pop{0%,28%{opacity:0;transform:translate(0,40px) scale(.3) rotate(0)}34%{opacity:1;transform:translate(0,-10px) scale(1) rotate(40deg)}55%{opacity:1}70%,100%{opacity:0;transform:translate(0,60px) rotate(120deg)}}'
          '.toastin{opacity:0;animation:tin 4s ease-out infinite}'
          '@keyframes tin{0%,30%{opacity:0;transform:translateY(16px)}36%,85%{opacity:1;transform:none}95%,100%{opacity:0}}'
          '.newrow{animation:rin 4s ease-out infinite}'
          '@keyframes rin{0%{opacity:0;transform:translateY(10px)}6%,100%{opacity:1;transform:none}}'
          '@media (prefers-reduced-motion: reduce){.beefly,.cf{display:none}.toastin,.newrow{animation:none;opacity:1}}')
boards['FirstTask.dc.html'] = ('5 · First task celebration', 1440, 900, fl, fl_css)

# ---------------------------------------------------------------- 6 Date strip
days = [('Sun', 27), ('Mon', 28), ('Tue', 29), ('Wed', 30), ('Thu', 1), ('Fri', 2), ('Sat', 3), ('Sun', 4), ('Mon', 5), ('Tue', 6)]


def strip(radius, sel_grow=True, dots=False, endcap=False, n=10):
    out = '<div style="display: flex; gap: 10px; align-items: center">'
    for i, (wd, d) in enumerate(days[:n]):
        sel = d == 29
        today = d == 29
        h = 76 if sel and sel_grow else 64
        bg = 'var(--accent); color: var(--on-accent)' if sel else 'var(--surface-raised); color: var(--ink)'
        dot = ''
        if dots and d in (30, 2, 3, 6):
            dot = f'<span style="width: 5px; height: 5px; border-radius: 50%; background: {"var(--on-accent)" if sel else "var(--accent-ink)"}"></span>'
        elif dots:
            dot = '<span style="width: 5px; height: 5px"></span>'
        out += (f'<div style="width: 58px; height: {h}px; border-radius: {radius}; background: {bg}; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; flex-shrink: 0">'
                f'<span style="font-size: 17px; font-weight: 600">{d}</span><span style="font-size: 11px; font-weight: 500; opacity: .8">{wd}</span>{dot}</div>')
    if endcap:
        out += (f'<div style="width: 120px; height: 64px; border-radius: {radius}; border: 1.5px dashed var(--line-strong); box-sizing: border-box; display: grid; place-items: center; text-align: center; font-size: 12px; line-height: 16px; color: var(--ink-muted)">Nothing planned<br>after 6 Oct</div>')
    return out + '</div>'


def strip_head():
    return ('<div style="display: flex; align-items: center; justify-content: space-between">'
            '<span style="font-size: 17px; font-weight: 600">September 2026</span>'
            '<span style="display: flex; gap: 8px; align-items: center">' + btn('Today', 'outline', 'sm')
            + f'<button type="button" aria-label="Earlier days" style="width: 36px; height: 36px; border-radius: 12px; border: 0; background: var(--surface-raised); color: var(--ink); display: grid; place-items: center; transform: rotate(180deg)">{icon("chevronRight", 18)}</button>'
            + f'<button type="button" aria-label="Later days" style="width: 36px; height: 36px; border-radius: 12px; border: 0; background: var(--surface-raised); color: var(--ink); display: grid; place-items: center">{icon("chevronRight", 18)}</button>'
            '</span></div>')

ds = head('6 · Calendar strip: calmer shape, bounded glide',
          'I agree the full pills look heavy on desktop. Proposal: rounded tiles (14 px, the same radius as our inputs), a month header with Today and arrows on desktop, and a dot under days that have tasks.')
ds += card(tag('Current') + strip('9999px', n=7))
ds += card('<div style="display: flex; gap: 8px">' + tag('A · Recommended', 'rec') + tag('radius 14, dots for busy days', 'cur') + '</div>' + strip_head() + strip('14px', dots=True, endcap=True))
ds += card('<div style="display: flex; gap: 8px">' + tag('B', 'alt') + tag('radius 10, no growth', 'cur') + '</div>' + strip('10px', sel_grow=False, dots=True))
ds += card(h2('How it scrolls') + '<ul style="margin: 0; padding-left: 20px; display: flex; flex-direction: column; gap: 6px; font-size: 14px; line-height: 20px">'
           '<li>Range: from your oldest overdue task (or 7 days back) to 3 days after the last day that has a task, as you asked. The end shows "Nothing planned after 6 Oct" instead of empty days forever.</li>'
           '<li>Flick on phones and it glides with momentum: a fast flick travels further, a slow drag moves exactly with your finger, then it settles on a whole day.</li>'
           '<li>Desktop: mouse wheel and trackpad scroll it sideways smoothly, arrows jump a week, Today brings you back.</li>'
           '<li>Reduced motion: no glide, it jumps.</li></ul>')
boards['DateStrip.dc.html'] = ('6 · Calendar strip', 1440, 1140, ds)

# ---------------------------------------------------------------- 7 Task rows
def pr(label, ic, col):
    return f'<span style="display: inline-flex; align-items: center; gap: 4px; color: {col}; font-weight: 500">{icon(ic, 14)}{label}</span>'

tip = ('<div style="position: absolute; right: -8px; top: -44px; padding: 7px 10px; border-radius: 10px; background: var(--ink); color: var(--bg); font-size: 12px; font-weight: 500; display: flex; gap: 8px; align-items: center; white-space: nowrap">More actions</div>')
tr = head('7 · Task rows: menu, priority, tooltips, list or grid',
          'The three dots sat on the very edge of the row with no room around them. Proposal: a proper 36 px button inset from the edge, shown on hover or focus on desktop and always on phones, with a tooltip.')
tr += '<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 28px">'
tr += card(tag('Current') + row('Plan portfolio redesign', '0 of 3', menu='edge') + row('Submit HNG stage 2', pr('High', 'flag', 'var(--danger)') + ' · Due Fri', menu='edge'))
tr += card(tag('A · Recommended', 'rec')
           + '<div style="position: relative">' + row('Plan portfolio redesign', '0 of 3 · Work', menu='hover', extra='background: var(--surface-raised)') + '</div>'
           + row('Submit HNG stage 2', pr('High', 'flag', 'var(--danger)') + '<span>· Due Fri</span>', menu='none')
           + row('Water the plants', pr('Low', 'chevronDown', 'var(--ink-muted)') + '<span>· Personal</span>', menu='none')
           + note('Hovered row shows Open and More, each with a tooltip. Priority shows as an icon plus the word, so it never relies on colour.'))
tr += card(h2('Why only High has a flag') + note('Every task starts as Medium, so a mark on Medium would sit on nearly every row and mean nothing. Proposal: High gets a red flag and the word High, Low gets a muted down arrow and the word Low, Medium shows nothing. That is what the PRD asked for; the app only did High.'))
tr += card(h2('Tooltips') + '<div style="display: flex; gap: 40px; align-items: flex-end; padding-top: 48px">'
           + '<div style="position: relative">' + f'<span style="width: 44px; height: 44px; border-radius: 14px; background: var(--surface-raised); display: grid; place-items: center">{icon("scratch", 22)}</span>'
           + '<div style="position: absolute; left: 0; top: -44px; padding: 7px 10px; border-radius: 10px; background: var(--ink); color: var(--bg); font-size: 12px; font-weight: 500; display: flex; gap: 8px; align-items: center; white-space: nowrap">Scratchpad <kbd style="font-size: 11px; padding: 1px 6px; border-radius: 6px; border: 1px solid var(--line-strong); color: var(--bg)">N</kbd></div></div>'
           + '<div style="position: relative">' + f'<span style="width: 44px; height: 44px; border-radius: 14px; background: var(--surface-raised); display: grid; place-items: center">{icon("pin", 20)}</span>'
           + '<div style="position: absolute; left: 0; top: -44px; padding: 7px 10px; border-radius: 10px; background: var(--ink); color: var(--bg); font-size: 12px; font-weight: 500; white-space: nowrap">Pin note</div></div></div>'
           + note('Inverted colours (ink ground, bg text), radius 10, 13 px, shows after 400 ms on hover or at once on keyboard focus, and includes the shortcut when there is one. Not shown on touch.'))
tr += '</div>'
grid_card = lambda t, c, m: (f'<div style="border-radius: 20px; overflow: hidden; background: var(--surface); box-shadow: var(--shadow-card); display: flex; flex-direction: column">'
                             f'<div style="height: 8px; background: var(--{c})"></div><div style="padding: 16px; display: flex; flex-direction: column; gap: 10px; min-height: 120px">'
                             f'<span style="display: flex; justify-content: space-between; align-items: center"><span style="width: 22px; height: 22px; border-radius: 50%; border: 1.5px solid var(--line-strong)"></span><span style="color: var(--ink-muted)">{icon("more", 18)}</span></span>'
                             f'<span style="font-size: 15px; font-weight: 600">{t}</span><span style="font-size: 13px; color: var(--ink-muted)">{m}</span></div></div>')
seg = ('<div style="display: inline-flex; padding: 4px; border-radius: 9999px; background: var(--surface-raised); gap: 4px">'
       f'<span style="height: 32px; padding: 0 12px; border-radius: 9999px; display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 500; color: var(--ink-muted)">{icon("tasks", 16)}List</span>'
       f'<span style="height: 32px; padding: 0 12px; border-radius: 9999px; display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; background: var(--accent); color: var(--on-accent)">{icon("folder", 16)}Grid</span></div>')
tr += card('<div style="display: flex; justify-content: space-between; align-items: center">' + h2('List or grid') + seg + '</div>'
           + '<div style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px">'
           + grid_card('Plan portfolio redesign', 'butter', 'Work · 0 of 3') + grid_card('Read 20 pages', 'lavender', 'Study · Tomorrow')
           + grid_card('Call mum', 'mint', 'Personal · 17:00') + grid_card('Submit HNG stage 2', 'peach', 'High · Due Fri') + '</div>'
           + note('A toggle beside the Tasks title, remembered per device. Grid uses a thin folder colour band on top; groups (Today, This week) stay the same in both.'))
boards['TaskRows.dc.html'] = ('7 · Rows, priority, tooltips, grid', 1440, 1240, tr)

# ---------------------------------------------------------------- 8 Confirmations
def dialog(title, text, confirm, typed=False, ic='trash'):
    t = ('<div style="display: flex; flex-direction: column; gap: 8px"><span style="font-size: 13px; font-weight: 500">Type <strong style="color: var(--danger); font-weight: 700; letter-spacing: .04em">DELETE</strong> to confirm</span>'
         '<span style="height: 44px; border-bottom: 1.5px solid var(--line-strong)"></span></div>') if typed else ''
    return (f'<div style="width: 440px; box-sizing: border-box; padding: 24px; border-radius: 28px; background: var(--surface-raised); box-shadow: var(--shadow-float); display: flex; flex-direction: column; gap: 16px">'
            f'<span style="width: 48px; height: 48px; border-radius: 50%; background: var(--danger-soft); color: var(--danger); display: grid; place-items: center">{icon(ic, 22)}</span>'
            f'<span style="font-size: 20px; font-weight: 600">{title}</span><span style="font-size: 14px; line-height: 20px; color: var(--ink-muted)">{text}</span>{t}'
            f'<span style="display: flex; justify-content: flex-end; gap: 8px">{btn("Cancel", "secondary")}{btn(confirm, "danger-solid", None, ic)}</span></div>')

cf = head('8 · Confirmations: where a dialog helps and where it gets in the way',
          'My honest take below. A dialog on every tap trains people to click Confirm without reading, which makes the truly dangerous ones less safe.')
cf += '<div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 28px">'
cf += card(tag('Completing a task: no dialog', 'rec') + row('Call mum', 'Personal', True, 'none')
           + toast('Done. 2 left today', 'Moved to Completed. Undo if that was a slip.', 'check', 'Undo').replace('width: 400px', 'width: 100%')
           + note('Completing never deletes. The task moves to Completed at the bottom of the list and counts toward your stats. The toast says exactly that.'))
cf += card(tag('Deleting a task: A · Undo only', 'rec')
           + toast('Task deleted', 'Its 3 subtasks went with it.', 'trash', 'Undo').replace('width: 400px', 'width: 100%')
           + note('Recommended: act at once and offer Undo for 5 s (design system rule). Fast for people cleaning up, and a slip is one tap to fix.')
           + tag('B · Always ask', 'alt') + note('If you still want a dialog, I suggest only for tasks that have subtasks or notes attached, since those lose the most.'))
cf += card(tag('Big and permanent: dialog', 'rec') + note('Deleting a folder, deleting all data, merging accounts. Delete all needs DELETE typed. Examples below.'))
cf += '</div>'
cf += '<div style="display: flex; gap: 28px">' + dialog('Delete the Work folder?', 'Its 6 tasks and 2 notes move to Inbox. Nothing else is deleted.', 'Delete folder', ic='folder') + dialog('Delete all your data?', 'Every task, note and folder will be removed for good. This cannot be undone.', 'Delete everything', True) + dialog('Delete "Plan portfolio redesign"?', 'Its 3 subtasks and 1 linked note go with it.', 'Delete task') + '</div>'
cf += note('Right: what option B would look like for a task with subtasks.')
boards['Confirmations.dc.html'] = ('8 · Confirmations', 1440, 1120, cf)

# ---------------------------------------------------------------- 9 Note colours
def ncard(title, bg, fg, extra='', band=''):
    return (f'<div style="width: 200px; height: 150px; box-sizing: border-box; border-radius: 20px; background: {bg}; color: {fg}; padding: 16px; display: flex; flex-direction: column; gap: 8px; box-shadow: var(--shadow-card); position: relative; overflow: hidden; {extra}">'
            f'{band}<span style="font-size: 15px; font-weight: 600">{title}</span><span style="font-size: 13px; line-height: 19px; opacity: .78">Buy milk, eggs and bread on the way home</span></div>')

pastels = ['lavender', 'butter', 'mint', 'peach', 'sky']
soft = {'lavender': '#c7a9e6', 'butter': '#e8cf86', 'mint': '#a6dcb0', 'peach': '#eeb39b', 'sky': '#a3c8ea'}
nc = head('9 · Note colours: easier on the eyes, plus your own',
          'On the dark theme the bright pastels glow next to charcoal. Two ways to calm them, and a way to add any colour while keeping text readable.')
nc += card(tag('Current') + '<div style="display: flex; gap: 16px">' + ''.join(ncard(p.title(), f'var(--{p})', 'var(--on-pastel)') for p in pastels) + '</div>')
nc += card('<div style="display: flex; gap: 8px">' + tag('A · Recommended', 'rec') + tag('softer pastels on dark only', 'cur') + '</div>'
           + '<div style="display: flex; gap: 16px">' + ''.join(ncard(p.title(), soft[p], 'var(--on-pastel)') for p in pastels) + '</div>'
           + note('Same hues, about 12% less bright on the dark theme. Light theme unchanged. Dark text on them still passes 7:1.'))
nc += card('<div style="display: flex; gap: 8px">' + tag('B', 'alt') + tag('tinted cards with a colour band', 'cur') + '</div>'
           + '<div style="display: flex; gap: 16px">' + ''.join(ncard(p.title(), f'color-mix(in srgb, var(--{p}) 16%, var(--surface))', 'var(--ink)', band=f'<span style="position: absolute; left: 0; right: 0; top: 0; height: 6px; background: var(--{p})"></span>') for p in pastels) + '</div>'
           + note('Quietest option: the card stays dark with a hint of colour and a band on top. Loses some of the playful feel.'))
sw = ''.join(f'<span style="width: 40px; height: 40px; border-radius: 50%; background: var(--{p}); box-shadow: inset 0 0 0 1.5px rgba(0,0,0,.12)"></span>' for p in ['surface'] + pastels)
sw += '<span style="width: 40px; height: 40px; border-radius: 50%; background: #f4a7c7"></span>'
sw += f'<span style="width: 40px; height: 40px; border-radius: 50%; border: 1.5px dashed var(--line-strong); display: grid; place-items: center; color: var(--ink-muted); box-sizing: border-box">{icon("plus", 18)}</span>'
picker = ('<div style="width: 300px; padding: 16px; box-sizing: border-box; border-radius: 20px; background: var(--surface-raised); box-shadow: var(--shadow-float); display: flex; flex-direction: column; gap: 12px">'
          '<span style="font-size: 13px; font-weight: 600">Your colour</span>'
          '<span style="height: 16px; border-radius: 9999px; background: linear-gradient(90deg,#f7a8a8,#f7d7a8,#e8f0a0,#a8f0b8,#a8e0f0,#b0b8f7,#e0a8f0,#f7a8a8); position: relative"><span style="position: absolute; left: 88%; top: -4px; width: 24px; height: 24px; border-radius: 50%; background: #f4a7c7; border: 3px solid var(--ink); box-sizing: border-box"></span></span>'
          f'<span style="display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--ink-muted)"><span style="color: var(--success)">{icon("check", 16)}</span>Text stays readable: 9.8 to 1</span>'
          + btn('Add colour', None, 'sm') + '</div>')
nc += card(h2('Add your own') + '<div style="display: flex; gap: 40px; align-items: flex-start"><div style="display: flex; flex-direction: column; gap: 12px"><div style="display: flex; gap: 10px">' + sw + '</div>'
           + note('The plus opens a simple hue slider (no hex typing). We only let you pick light, soft shades, so dark text always passes contrast; the check line confirms it. Up to 6 saved colours, shared by notes and folders.') + '</div>' + picker + ncard('Pink', '#f4a7c7', 'var(--on-pastel)') + '</div>')
boards['NoteColors.dc.html'] = ('9 · Note colours', 1440, 1240, nc)

# ---------------------------------------------------------------- 10 Icons
SV = 'fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"'
glyph = {
    'Home': ('<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1Z"></path>', '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1Z" fill="var(--accent)" stroke="var(--accent-ink)"></path>'),
    'Tasks': ('<rect x="4" y="4" width="16" height="16" rx="4"></rect><path d="m8 12 3 3 5-6"></path>', '<rect x="4" y="4" width="16" height="16" rx="4" fill="var(--accent)" stroke="var(--accent-ink)"></rect><path d="m8 12 3 3 5-6" stroke="var(--on-accent)"></path>'),
    'Notes': ('<path d="M6 3h9l4 4v14H6z"></path><path d="M15 3v4h4M9 12h6M9 16h4"></path>', '<path d="M6 3h9l4 4v14H6z" fill="var(--accent)" stroke="var(--accent-ink)"></path><path d="M15 3v4h4M9 12h6M9 16h4" stroke="var(--on-accent)"></path>'),
    'Folders': ('<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"></path>', '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" fill="var(--accent)" stroke="var(--accent-ink)"></path>'),
    'Profile': ('<circle cx="12" cy="8" r="4"></circle><path d="M4 21c1.2-4 4.4-6 8-6s6.8 2 8 6"></path>', '<circle cx="12" cy="8" r="4" fill="var(--accent)" stroke="var(--accent-ink)"></circle><path d="M4 21c1.2-4 4.4-6 8-6s6.8 2 8 6" fill="var(--accent)" stroke="var(--accent-ink)"></path>'),
}


def navbar(style, active='Tasks'):
    items = ''
    for i, (lbl, (o, f)) in enumerate(glyph.items()):
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
            items += f'<span style="width: 48px; height: 48px; border-radius: 50%; background: var(--accent); color: var(--on-accent); display: grid; place-items: center">{icon("plus", 24)}</span>'
    return f'<div style="width: 390px; height: 76px; border-radius: 24px; background: var(--surface); display: flex; align-items: center; justify-content: space-around; box-sizing: border-box; padding: 0 8px">{items}</div>'

ic = head('10 · Icons: distinct shapes, clear active state',
          'The honeycomb set failed because every icon was the same hexagon. Rule for the set: each destination gets a different silhouette (house, checked square, page, folder, person), and the logo stays a brand mark only, never a nav button.')
ic += '<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 28px">'
ic += card(tag('A · Outline, active in a soft pill', 'rec') + navbar('A') + note('Closest to the approved design. Active item: accent-ink glyph inside the accent-soft pill, like the sidebar row.'))
ic += card(tag('B · Outline, active fills in honey', 'alt') + navbar('B') + note('Active icon fills with amber (like honey filling a cell). More playful and ties to the brand without looking alike.'))
ic += '</div>'
big = ''.join(f'<div style="display: flex; flex-direction: column; align-items: center; gap: 10px; font-size: 13px; color: var(--ink-muted)"><svg width="56" height="56" viewBox="0 0 24 24" {SV.replace("1.75", "1.25")} style="color: var(--ink)">{o}</svg>{l}</div>' for l, (o, f) in glyph.items())
big2 = ''.join(f'<div style="display: flex; flex-direction: column; align-items: center; gap: 10px; font-size: 13px; color: var(--ink-muted)"><svg width="56" height="56" viewBox="0 0 24 24" {SV.replace("1.75", "1.25")}>{f}</svg>{l}</div>' for l, (o, f) in glyph.items())
ic += card(h2('The set, idle and active') + f'<div style="display: flex; gap: 48px">{big}</div><div style="display: flex; gap: 48px">{big2}</div>'
           + note('Drawn on lucide\'s 24 px grid and stroke so they sit with every other icon in the app. Tasks becomes a checked square instead of a bulleted list, so it no longer looks like Notes.'))
boards['Icons.dc.html'] = ('10 · Icons', 1440, 1000, ic)

# ---------------------------------------------------------------- 11 Splash to app
def frame(i, label, inner):
    return (f'<div style="display: flex; flex-direction: column; gap: 10px"><div style="position: relative; width: 300px; height: 190px; border-radius: 16px; border: 1px solid var(--line); background: var(--bg); overflow: hidden">{inner}</div>'
            f'<span style="font-size: 13px; line-height: 18px"><strong>{i}</strong> <span style="color: var(--ink-muted)">{label}</span></span></div>')

side = '<div style="position: absolute; left: 0; top: 0; bottom: 0; width: 64px; background: var(--surface)"></div>'
content = lambda o: (f'<div style="position: absolute; left: 80px; top: {40 + (1 - o) * 10}px; right: 16px; display: flex; flex-direction: column; gap: 8px; opacity: {o}">'
                     '<span style="height: 10px; width: 90px; border-radius: 6px; background: var(--surface-raised)"></span><span style="height: 16px; width: 150px; border-radius: 6px; background: var(--ink); opacity: .7"></span>'
                     '<span style="height: 26px; border-radius: 9999px; background: var(--surface-raised)"></span><span style="height: 60px; border-radius: 12px; background: var(--surface)"></span></div>')
center_logo = lambda s, x='50%', y='50%': f'<div style="position: absolute; left: {x}; top: {y}; transform: translate(-50%, -50%)">{logo(s)}</div>'
sp = head('11 · From the loading screen into the app',
          'Today the splash fades out over a blank page, so it feels like two separate things. Proposal: the logo itself travels to where it lives in the app (sidebar on desktop, header on phones) while the page rises in behind it.')
sp += '<div style="display: flex; gap: 24px">'
sp += frame(1, 'Drop forms and falls (loops while loading, always finishes the fall).', center_logo(72))
sp += frame(2, 'Ready: background opens up, logo starts to shrink (300 ms).', side + center_logo(52, '45%'))
sp += frame(3, 'Logo lands in the sidebar spot; content rises and fades in, 60 ms apart (350 ms).', side + center_logo(30, '32px', '26px') + content(0.5))
sp += frame(4, 'Settled. Total about 700 ms after the data is ready.', side + center_logo(30, '32px', '26px') + content(1))
sp += '</div>'
sp += card(h2('Motion, overall') + '<div style="display: grid; grid-template-columns: 220px 160px 160px minmax(0, 1fr); gap: 10px 24px; font-size: 14px; line-height: 20px">'
           + '<span style="font-weight: 600; color: var(--ink-muted)">What</span><span style="font-weight: 600; color: var(--ink-muted)">Now</span><span style="font-weight: 600; color: var(--ink-muted)">Proposed</span><span style="font-weight: 600; color: var(--ink-muted)">Notes</span>'
           + ''.join(f'<span>{a}</span><span style="color: var(--ink-muted)">{b}</span><span style="font-weight: 600">{c}</span><span style="color: var(--ink-muted)">{d}</span>' for a, b, c, d in [
               ('Tick a task', '200 ms', '350 ms', 'Circle fills, check draws, then the row glides to Completed (400 ms).'),
               ('Row added or removed', 'none / 250 ms', '300 ms', 'Height animates so the list doesn\'t jump.'),
               ('Page change', 'none', '250 ms crossfade', 'Content only; the nav never moves.'),
               ('Sheet, dialog', '250 / 200 ms', '320 / 260 ms', 'Spring, no bounce past the edge.'),
               ('Toast in', '200 ms', '280 ms', 'Rises 12 px with a soft spring.'),
               ('Celebration', 'confetti 1 s', '1.8 s', 'Tap to skip.'),
               ('Bottom bar hide', '280 ms', '300 ms', 'Only after 24 px of scroll, so it doesn\'t flicker.')])
           + '</div>' + note('Durations are longer than the design system\'s 300 ms cap, so this needs your yes. Everything goes instant for reduced motion.'))
boards['SplashToApp.dc.html'] = ('11 · Splash into the app, motion', 1440, 900, sp)

# ---------------------------------------------------------------- 12 Empty states with buttons
def es(ill, title, text, b, bic='plus', v=None):
    bb = btn(b, v, None, bic)
    return card(f'<x-import component-from-global-scope="Zen.EmptyState" illustration="{ill}" title="{title}" text="{text}" illustration-width="{{{{w160}}}}">{bb}</x-import>', pad=8, extra='align-items: center')

em = head('12 · Empty states, back to the design, with a button under each',
          'The original illustrations are back in the app. Every empty state now ends with the one action that fills it.')
em += '<div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 24px">'
em += es('tasks', 'Add your first task', 'Type it above and press Enter, or press Q anywhere.', 'Add a task')
em += es('notes', 'No notes yet', 'Capture ideas, meeting notes and checklists. Markdown works.', 'New note')
em += es('folder', 'This folder is empty', 'Move tasks here from their menu, or type #work when you add one.', 'Add a task')
em += es('done', 'All done for today', 'Nice work. Tomorrow has 2 tasks waiting.', 'See tomorrow', 'chevronRight', 'outline')
em += es('search', 'No results for "invoce"', 'Check the spelling, or try a word from the note instead.', 'Clear search', 'x', 'outline')
em += es('habits', 'Build your first habit', 'Pick something small you want to do most days. We\'ll track the streak.', 'Add a habit')
em += '</div>'
boards['EmptyStates.dc.html'] = ('12 · Empty states', 1440, 1000, em)

# ---------------------------------------------------------------- Main: index
items = [('Onboarding', '1 · Welcome and your name', 'OK to add this screen?'),
         ('QuickAdd', '2 · Quick add', 'A, or keep the plus on the left?'),
         ('WhereMessages', '3 · Where messages appear', 'OK with these placement rules?'),
         ('Messages', '4 · Friendly messages', 'Tone right? Too much, too little?'),
         ('FirstTask', '5 · First task: bee and confetti', 'Keep the bee?'),
         ('DateStrip', '6 · Calendar strip', 'A or B? Range rule OK?'),
         ('TaskRows', '7 · Rows, priority, tooltips, grid', 'OK to all four?'),
         ('Confirmations', '8 · Confirmations', 'Undo only (A) or dialog for tasks (B)?'),
         ('NoteColors', '9 · Note colours', 'A or B, and custom colours OK?'),
         ('Icons', '10 · Icons', 'A or B?'),
         ('SplashToApp', '11 · Splash and motion', 'OK to go past 300 ms?'),
         ('EmptyStates', '12 · Empty states', 'Buttons OK?')]
mn = head('Honeylist · round 2 proposals',
          'Everything here changes the approved design, so nothing is built until you say yes. Open a board, then reply with your picks (for example "2A, 6A, 8A, 10B"). Bug fixes that bring the app back in line with the design are already live.')
mn += '<div style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 20px">'
for f, t, q in items:
    mn += (f'<a href="{f}.dc.html" style="text-decoration: none; color: var(--ink); display: flex; flex-direction: column; gap: 8px; padding: 20px; border-radius: 24px; background: var(--surface); min-height: 108px; box-sizing: border-box">'
           f'<span style="font-size: 15px; font-weight: 600">{t}</span><span style="font-size: 13px; line-height: 18px; color: var(--ink-muted)">{q}</span></a>')
mn += '</div>'
mn += '<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px">'
mn += card(h2('Already fixed, live now') + '<ul style="margin: 0; padding-left: 20px; display: flex; flex-direction: column; gap: 6px; font-size: 14px; line-height: 20px">'
           '<li>Icons and empty state art back to the approved design</li><li>Row animations removed (janky on phones, and they pushed task menus under other rows)</li>'
           '<li>Phone keyboard no longer pops up again and again in dialogs</li><li>Note editor: one quiet frame instead of a double outline</li>'
           '<li>DELETE is bold and red</li><li>Browser autofill keeps our colours</li><li>Task pane scrollbar sits inside the card</li><li>Home shows at most 6 tasks plus See all</li></ul>')
mn += card(h2('Still to plan with you') + '<ul style="margin: 0; padding-left: 20px; display: flex; flex-direction: column; gap: 6px; font-size: 14px; line-height: 20px">'
           '<li>Phase 2: Google sign in that keeps guest data</li><li>Habits, repeating tasks, reminders that actually notify</li>'
           '<li>shadcn components (Radix under the hood) for dialogs, menus, tooltips, popovers</li><li>A motion library for the springs and the glide</li></ul>')
mn += '</div>'
boards['Main.dc.html'] = ('Start here', 1440, 900, mn)

# ---------------------------------------------------------------- write
order = ['Main.dc.html', 'Onboarding.dc.html', 'QuickAdd.dc.html', 'WhereMessages.dc.html', 'Messages.dc.html', 'FirstTask.dc.html', 'DateStrip.dc.html',
         'TaskRows.dc.html', 'Confirmations.dc.html', 'NoteColors.dc.html', 'Icons.dc.html', 'SplashToApp.dc.html', 'EmptyStates.dc.html']
bmeta = {}
x = y = 0
col = 0
rowh = 0
for i, name in enumerate(order):
    v = boards[name]
    title, w, h, body = v[0], v[1], v[2], v[3]
    css = v[4] if len(v) > 4 else ''
    open(os.path.join(P, name), 'w').write(board(name, title, w, h, body, css))
    if col == 2:
        col = 0
        y += rowh + 120
        rowh = 0
    bx = col * (1440 + 80)
    bmeta[name] = {'x': bx, 'y': y, 'w': w, 'h': h, 'title': title}
    if name == 'FirstTask.dc.html':
        bmeta[name]['is_interactive'] = True
    rowh = max(rowh, h)
    col += 1
now = datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')
canvas = {'v': 3, 'createdOnFiles': {'v': 1, 'at': now}, 'title': 'Honeylist round 2 proposals', 'launch': {'view': 'canvas'}, 'pages': [],
          'boards': bmeta, 'order': order, 'notes': {},
          'designSystems': [{'title': 'Zen Todo', 'namespace': 'zen', 'artifact': 'https://claude.ai/artifact/3XQD4Ko6NbjtsMWkJLpC3d', 'version': '1790699639-ac64', 'copiedAt': now}]}
json.dump(canvas, open(os.path.join(P, 'canvas.json'), 'w'), indent=1)
print('ok', len(order))
