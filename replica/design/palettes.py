#!/usr/bin/env python3
"""Genera src/palettes.css dalle 5 palette e ne controlla i contrasti (AA). python3 replica/design/palettes.py"""
import sys
def lum(h):
    h=h.lstrip('#'); c=[int(h[i:i+2],16)/255 for i in (0,2,4)]
    c=[x/12.92 if x<=.03928 else ((x+.055)/1.055)**2.4 for x in c]; return .2126*c[0]+.7152*c[1]+.0722*c[2]
def cr(a,b):
    x,y=sorted([lum(a),lum(b)],reverse=True); return (x+.05)/(y+.05)
DK=dict(danger='#FF7A85',success='#4ADE80',warning='#FBBF24')
LT=dict(danger='#B3202F',success='#086040',warning='#8A5500')
# id: (nome, dots, bibo(leg,bulb,eye,arm), dark{}, light{})
P={
'viola':('Viola e rosa',['#7C6BFF','#FF6FB5','#3FD8FF'],
 dict(dark=dict(bg='#14112B',deep='#0D0B1E',surface='#1F1B3F',raised='#2A2552',border='#3A346B',inp='#8C86C4',text='#F5F4FF',muted='#B4B0DA',accent='#A394FF',strong='#5B49E6',pink='#FF6FB5',cyan='#3FD8FF',
   hero=('#5B49E6','#BE185D'),title=('#9D8CFF','#FF6FB5'),scan=('#3FD8FF','#7C6BFF'),clean=('#FF6FB5','#FF9A62'),speed=('#4BE3A0','#3FD8FF'),app=('#1B1545','#14112B','#0D0B1E'),ga='rgba(255,111,181,.28)',gb='rgba(124,107,255,.24)',glow='rgba(124,107,255,.40)',shadow='rgba(5,3,20,',bar='#14112B',leg='#7C6BFF',arm='#D9D4FF',visor=('#2A2552','#0D0B1E'),ico='#0D0B1E'),
  light=dict(bg='#F6F4FF',deep='#EAE6FB',surface='#FFFFFF',raised='#E6E1FA',border='#CFC8F0',inp='#6B62A8',text='#17133A',muted='#4B4678',accent='#5B49E6',strong='#5B49E6',pink='#B0246B',cyan='#0B5F80',
   hero=('#5B49E6','#BE185D'),title=('#5B49E6','#BE185D'),app=('#E6E1FA','#F6F4FF','#FDFCFF'),glow='rgba(91,73,230,.28)',bar='#E6E1FA',shade='rgba(40,30,110,',scrim='rgba(23,19,58,.35)',scroll='rgba(23,19,58,.35)'))),
'oceano':('Oceano e oro',['#60A5FA','#FBBF24','#7DD3FC'],
 dict(dark=dict(bg='#0B1626',deep='#060E1A',surface='#122338',raised='#1B3350',border='#2C4B70',inp='#86A8CF',text='#F0F6FF',muted='#A9C0DA',accent='#60A5FA',strong='#1D4ED8',pink='#FBBF24',cyan='#7DD3FC',
   hero=('#1D4ED8','#B45309'),title=('#60A5FA','#FBBF24'),scan=('#7DD3FC','#4F9CF9'),clean=('#FBBF24','#FDE68A'),speed=('#86EFAC','#60A5FA'),app=('#10264A','#0B1626','#060E1A'),ga='rgba(251,191,36,.24)',gb='rgba(96,165,250,.24)',glow='rgba(96,165,250,.40)',shadow='rgba(2,8,18,',bar='#0B1626',leg='#3B82F6',arm='#D0E3FA',visor=('#1B3350','#060E1A'),ico='#060E1A'),
  light=dict(bg='#F1F6FD',deep='#E2ECF9',surface='#FFFFFF',raised='#DCE8F8',border='#BCCFE8',inp='#4A6D9C',text='#0B1B33',muted='#3B5577',accent='#1D4ED8',strong='#1D4ED8',pink='#92400E',cyan='#0369A1',
   hero=('#1D4ED8','#B45309'),title=('#1D4ED8','#B45309'),app=('#DCE8F8','#F1F6FD','#FAFCFF'),glow='rgba(29,78,216,.28)',bar='#DCE8F8',shade='rgba(15,50,110,',scrim='rgba(11,27,51,.35)',scroll='rgba(11,27,51,.35)'))),
'foresta':('Foresta e limone',['#4ADE80','#FACC15','#BEF264'],
 dict(dark=dict(bg='#0E1B14',deep='#08130D',surface='#15281D',raised='#1F3A2B',border='#2F5640',inp='#84B496',text='#F1FBF4',muted='#A8CDB4',accent='#4ADE80',strong='#15803D',pink='#FACC15',cyan='#BEF264',
   hero=('#15803D','#A16207'),title=('#4ADE80','#FACC15'),scan=('#BEF264','#16A34A'),clean=('#FACC15','#FDE68A'),speed=('#86EFAC','#4ADE80'),app=('#123324','#0E1B14','#08130D'),ga='rgba(250,204,21,.22)',gb='rgba(74,222,128,.22)',glow='rgba(74,222,128,.38)',shadow='rgba(2,14,8,',bar='#0E1B14',leg='#22C55E',arm='#D2EBDA',visor=('#1F3A2B','#08130D'),ico='#08130D'),
  light=dict(bg='#F2F9F3',deep='#E2F0E5',surface='#FFFFFF',raised='#DDEFE2',border='#BCD9C4',inp='#4A7A5A',text='#0C2014',muted='#3C5E48',accent='#136F35',strong='#15803D',pink='#854D0E',cyan='#3F6A0C',
   hero=('#15803D','#A16207'),title=('#15803D','#A16207'),app=('#DDEFE2','#F2F9F3','#FAFDFB'),glow='rgba(21,128,61,.28)',bar='#DDEFE2',shade='rgba(15,80,40,',scrim='rgba(12,32,20,.35)',scroll='rgba(12,32,20,.35)'))),
'rubino':('Rubino e sabbia',['#FB7185','#FDBA74','#FDE68A'],
 dict(dark=dict(bg='#1E1116',deep='#14090D',surface='#2B1820',raised='#3B2230',border='#5B3445',inp='#C79AAA',text='#FFF3F5',muted='#D8B4BE',accent='#FB7185',strong='#BE123C',pink='#FDBA74',cyan='#FDE68A',
   hero=('#BE123C','#B45309'),title=('#FB7185','#FDBA74'),scan=('#FDE68A','#FB7185'),clean=('#FDBA74','#FDE68A'),speed=('#86EFAC','#FDBA74'),app=('#34141F','#1E1116','#14090D'),ga='rgba(253,186,116,.22)',gb='rgba(251,113,133,.24)',glow='rgba(251,113,133,.40)',shadow='rgba(18,4,8,',bar='#1E1116',leg='#F43F5E',arm='#F7D5DB',visor=('#3B2230','#14090D'),ico='#14090D'),
  light=dict(bg='#FFF5F6',deep='#FCE7EA',surface='#FFFFFF',raised='#FADCE1',border='#EFC0C9',inp='#9C4A5C',text='#2A0F16',muted='#6B3A47',accent='#BE123C',strong='#BE123C',pink='#9A3412',cyan='#854D0E',
   hero=('#BE123C','#B45309'),title=('#BE123C','#B45309'),app=('#FADCE1','#FFF5F6','#FFFBFB'),glow='rgba(190,18,60,.28)',bar='#FADCE1',shade='rgba(110,20,40,',scrim='rgba(42,15,22,.35)',scroll='rgba(42,15,22,.35)'))),
}
BIBO={'viola':('#FF6FB5','#3FD8FF'),'oceano':('#FBBF24','#7DD3FC'),'foresta':('#FACC15','#BEF264'),'rubino':('#FDBA74','#FDE68A')}
fail=0
def chk(name,a,b,need=4.5):
    global fail; r=cr(a,b)
    if r<need: fail+=1; print('FAIL %s %s su %s = %.2f (<%s)'%(name,a,b,r,need))
for k,(nm,dots,m) in P.items():
    d,l=m['dark'],m['light']
    for mode,t,sh,ex in (('scuro',d,DK,'#FFFFFF'),('chiaro',l,LT,'#FFFFFF')):
        pre='%s/%s'%(k,mode); bgs=[t['bg'],t['deep'],t['surface'],t['raised']] if 'deep' in t else None
        bgs=[t['bg'],t['deep'],t['surface'],t['raised']]
        for b in bgs:
            for fg,n in ((t['text'],'text'),(t['muted'],'muted'),(t['accent'],'accent'),(t['pink'],'pink'),(t['cyan'],'cyan'),(sh['danger'],'danger'),(sh['success'],'success'),(sh['warning'],'warning')): chk(pre+' '+n,fg,b)
        chk(pre+' bordo-input',t['inp'],t['bg'],3); chk(pre+' bordo-input/surface',t['inp'],t['surface'],3)
        for h in t['hero']: chk(pre+' bianco su hero',ex,h)
        chk(pre+' bianco su strong',ex,t['strong'])
        if mode=='scuro': chk(pre+' icone su clean',t['ico'],t['clean'][0]); chk(pre+' icone su clean2',t['ico'],t['clean'][1]); chk(pre+' icone su scan',t['ico'],t['scan'][0]); chk(pre+' icone su scan2',t['ico'],t['scan'][1]); chk(pre+' icone su speed',t['ico'],t['speed'][0]); chk(pre+' icone su speed2',t['ico'],t['speed'][1])
def g(a,b): return 'linear-gradient(135deg, %s 0%%, %s 100%%)'%(a,b)
out=['/* Palette alternative (generato da replica/design/palettes.py). Quella di base (verde-acqua e arancio) sta in tokens.css e theme-light.css. */']
for k,(nm,dots,m) in P.items():
    d,l=m['dark'],m['light']; sh=d['shadow']
    out.append('html[data-palette="%s"] {'%k)
    for n,v in (('bg','bg'),('bg-deep','deep'),('surface','surface'),('surface-raised','raised'),('border','border'),('border-input','inp'),('text','text'),('text-muted','muted'),('accent','accent'),('accent-strong','strong'),('accent-pink','pink'),('accent-cyan','cyan')): out.append('  --color-%s: %s;'%(n,d[v]))
    out+=['  --color-danger: %s; --color-success: %s; --color-warning: %s;'%(DK['danger'],DK['success'],DK['warning']),
      '  --grad-app: linear-gradient(135deg, %s 0%%, %s 55%%, %s 100%%);'%d['app'],'  --grad-hero: %s;'%g(*d['hero']),'  --grad-title: %s;'%g(*d['title']),'  --grad-scan: %s;'%g(*d['scan']),'  --grad-clean: %s;'%g(*d['clean']),'  --grad-speed: %s;'%g(*d['speed']),
      '  --shadow-card: 0 8px 24px %s.40), inset 0 1px 0 rgba(255,255,255,.06);'%sh[:-1]+'' if False else '  --shadow-card: 0 8px 24px %s.40), inset 0 1px 0 rgba(255,255,255,.06);'%sh,
      '  --shadow-pop: 0 24px 60px %s.60);'%sh,'  --shadow-glow: 0 0 40px %s;'%d['glow'],
      '  --glow-a: %s; --glow-b: %s; --scrim: %s.6);'%(d['ga'],d['gb'],sh),'  --bar-bg: %s; --bar-fg: %s;'%(d['bar'],d['text']),
      '  --ink: %s; --bibo-leg: %s; --bibo-bulb: %s; --bibo-eye: %s; --bibo-arm: %s; --bibo-visor-a: %s; --bibo-visor-b: %s; --bibo-ant: %s;'%(d['ico'],d['leg'],d['pink'],d['cyan'],d['arm'],d['visor'][0],d['visor'][1],d['muted']),
      '  --chart-a: %s; --chart-b: %s; --chart-hot-a: %s; --chart-hot-b: %s;'%(d['leg'],d['cyan'],d['pink'],d['clean'][1]),'}']
    out.append('html[data-palette="%s"][data-theme="light"] {'%k)
    for n,v in (('bg','bg'),('bg-deep','deep'),('surface','surface'),('surface-raised','raised'),('border','border'),('border-input','inp'),('text','text'),('text-muted','muted'),('accent','accent'),('accent-strong','strong'),('accent-pink','pink'),('accent-cyan','cyan')): out.append('  --color-%s: %s;'%(n,l[v]))
    s=l['shade']
    out+=['  --color-danger: %s; --color-success: %s; --color-warning: %s;'%(LT['danger'],LT['success'],LT['warning']),
      '  --grad-app: linear-gradient(135deg, %s 0%%, %s 55%%, %s 100%%);'%l['app'],'  --grad-hero: %s;'%g(*l['hero']),'  --grad-title: %s;'%g(*l['title']),
      '  --shadow-card: 0 8px 24px %s.12), inset 0 1px 0 rgba(255,255,255,.9);'%s,'  --shadow-pop: 0 24px 60px %s.28);'%s,'  --shadow-glow: 0 0 40px %s;'%l['glow'],
      '  --glass-bg: rgba(255,255,255,.72); --glass-border: %s.16);'%s,'  --scrim: %s;'%l['scrim'],'  --bar-bg: %s; --bar-fg: %s;'%(l['bar'],l['text']),
      '  --chart-a: %s; --chart-b: %s; --chart-hot-a: %s; --chart-hot-b: %s;'%(l['accent'],l['cyan'],l['pink'],l['pink']),'}']
    out.append('html[data-palette="%s"][data-theme="light"] * { scrollbar-color: %s transparent; }'%(k,l['scroll']))
open('src/palettes.css','w').write('\n'.join(out)+'\n')
import json; json.dump({k:[v[0],v[1]] for k,v in P.items()},open('/dev/stdout','w')) if False else None
print('FAIL totali:',fail); sys.exit(1 if fail else 0)
