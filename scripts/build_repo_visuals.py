"""Rebuild original, self-contained SVG teaching graphics with the standard library.

Run from any directory: python scripts/build_repo_visuals.py
SVG text and named groups remain editable. No logos, fonts, scripts or images
are downloaded or embedded. The manifest records the teaching evidence.
"""
from pathlib import Path
from html import escape
import json

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "docs/assets"
PALETTE = {
    "ink": "#18324A", "surface": "#F5F7FB", "primary": "#315EFB",
    "secondary": "#7254B3", "status_accent": "#D97745",
    "divider": "#CBD5E1", "paper": "#FFFFFF", "muted": "#52677C",
}


def text(x, y, value, size=20, color="ink", weight="400", anchor="start", id=None):
    identifier = f' id="{id}"' if id else ''
    return (f'<text{identifier} x="{x}" y="{y}" font-size="{size}" '
            f'font-weight="{weight}" text-anchor="{anchor}" '
            f'fill="{PALETTE[color]}">{escape(value)}</text>')


def line(x1, y1, x2, y2, color="divider", width=2, dashed=False):
    dash = ' stroke-dasharray="6 5"' if dashed else ''
    return (f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" '
            f'stroke="{PALETTE[color]}" stroke-width="{width}"{dash}/>')


def circle(x, y, r=6, color="primary"):
    return f'<circle cx="{x}" cy="{y}" r="{r}" fill="{PALETTE[color]}"/>'


def svg_open(width, height, title, description):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" '
            f'height="{height}" viewBox="0 0 {width} {height}" role="img" '
            'aria-labelledby="title description">\n'
            f'<title id="title">{escape(title)}</title>\n'
            f'<desc id="description">{escape(description)}</desc>\n'
            '<g font-family="DejaVu Sans, Arial, sans-serif" '
            'stroke-linecap="round" stroke-linejoin="round">\n')


def hero():
    s = [svg_open(1200, 690, "One toolkit. Three ways to reason about a game.",
        "Nash: a prisoner's dilemma matrix highlights mutual defection. "
        "Selten: an entry tree highlights entry followed by accommodation. "
        "Harsanyi: Nature selects a cost; dotted information sets join "
        "indistinguishable nodes. These are three distinct teaching models.")]
    s += ['<rect width="1200" height="690" rx="20" fill="#FFFFFF"/>',
          '<path d="M 40 28 H 1160" stroke="#315EFB" stroke-width="4"/>',
          text(40, 65, "COMSCI / ECON 206  ·  WEEK 3", 17, "primary", "700"),
          text(40, 106, "What changes when the rules of interaction change?", 31, weight="700"),
          text(40, 138, "Compare three small models. Change one assumption. Explain the new prediction.", 20, "muted"),
          line(403, 177, 403, 558), line(796, 177, 796, 558)]
    for x, name, question in [(40,"Nash","Can either player gain alone?"),
                              (435,"Selten","Is the threat credible?"),
                              (830,"Harsanyi","What does each player know?")]:
        key = name.lower()
        s += [text(x, 196, name, 28, weight="700", id=f"{key}-label"),
              text(x, 228, question, 19, "muted")]

    # Payoff grid: geometry encodes both players' choices, not a decorative card.
    s += ['<g id="nash-matrix">',
          text(239, 270, "Column player", 18, "muted", anchor="middle"),
          text(190, 301, "C", 19, weight="700", anchor="middle"),
          text(300, 301, "D", 19, weight="700", anchor="middle"),
          '<rect x="135" y="315" width="220" height="124" rx="8" fill="#F5F7FB"/>',
          '<rect x="245" y="377" width="110" height="62" rx="6" fill="#315EFB"/>',
          line(245,315,245,439), line(135,377,355,377),
          text(112,354,"C",19,weight="700",anchor="middle"),
          text(112,416,"D",19,weight="700",anchor="middle"),
          text(40,339,"Row",18,"muted"), text(40,363,"player",18,"muted"),
          text(190,354,"3, 3",22,anchor="middle"),
          text(300,354,"0, 5",22,anchor="middle"),
          text(190,416,"5, 0",22,anchor="middle"),
          text(300,416,"1, 1",22,"paper","700","middle"), '</g>',
          text(40, 478, "NE: both defect", 22,"primary","700"),
          text(40, 509, "C = cooperate; D = defect", 18,"muted"),
          text(40, 538, "Payoffs: row, column",18,"muted")]

    # A complete decision tree, with the equilibrium path visibly selected.
    s += ['<g id="selten-tree">',
          line(585,285,466,382), line(585,285,690,360,"primary",4),
          line(690,360,627,432), line(690,360,751,432,"primary",4),
          text(585,267,"Entrant",19,weight="700",anchor="middle"),
          text(501,322,"Out",18,"muted"), text(670,332,"In",18,"primary","700"),
          text(698,307,"Incumbent",18,weight="700",anchor="middle"),
          text(605,390,"Fight",17,"muted"),
          text(712,379,"Accom.",16,"primary","700"),
          circle(585,285), circle(690,360),
          circle(466,382,4,"muted"), circle(627,432,4,"muted"), circle(751,432),
          text(466,412,"0, 2",19,anchor="middle"),
          text(622,461,"−1, −1",19,anchor="middle"),
          text(751,461,"1, 1",19,"primary","700","middle"), '</g>',
          text(435, 500,"SPNE: enter; accommodate",20,"primary","700"),
          text(435, 533,"After entry, 1 is better than −1.",18,"muted")]

    # Nature and three information sets preserve hidden types and actions.
    s += ['<g id="harsanyi-information">',
          '<path d="M 994 259 L 1005 270 L 994 281 L 983 270 Z" fill="#18324A"/>',
          text(994,251,"Nature",18,weight="700",anchor="middle"),
          line(988,278,903,329),line(1000,278,1089,329),
          text(863,292,"Low cost",17,"muted"),text(1049,292,"High cost",17,"muted"),
          text(863,315,"p = 0.5",17,"muted"),text(1073,315,"1 − p",17,"muted"),
          line(911,337,1081,337,"secondary",2.5,True),
          text(994,325,"I1",18,"secondary","700","middle"),
          circle(903,337,color="ink"),circle(1089,337,color="ink"),
          text(903,364,"Firm 1",17,weight="700",anchor="middle"),
          text(1089,364,"Firm 1",17,weight="700",anchor="middle"),
          line(898,372,857,407),line(908,372,951,407),
          line(1084,372,1043,407),line(1094,372,1137,407),
          text(857,389,"E",16,"muted"),text(941,389,"O",16,"muted"),
          text(1043,389,"E",16,"muted"),text(1127,389,"O",16,"muted"),
          line(863,415,945,415,"secondary",2.5,True),
          line(1049,415,1131,415,"secondary",2.5,True),
          circle(857,415,color="ink"),circle(951,415,color="ink"),circle(1043,415,color="ink"),circle(1137,415,color="ink"),
          text(904,407,"I2",17,"secondary","700","middle"),
          text(1090,407,"I3",17,"secondary","700","middle"),
          text(904,445,"Firm 2 · low",17,anchor="middle"),
          text(1090,445,"Firm 2 · high",17,anchor="middle"), '</g>',
          text(830,485,"BNE: Firm 1 enters",21,"primary","700"),
          text(830,514,"Firm 2: enter if low; out if high",18,"muted"),
          text(830,543,"E = enter; O = out",17,"muted")]

    # Protected legend and footer bands; no connectors enter text regions.
    s += [line(40,568,1160,568),
          line(45,596,79,596,"primary",4),text(94,602,"Selected equilibrium",17,"muted"),
          line(377,596,415,596,"secondary",2.5,True),text(430,602,"Same information set",17,"muted"),
          text(798,602,"Types tree: information structure only",16,"muted"),
          '<rect x="40" y="626" width="1120" height="40" rx="8" fill="#F5F7FB"/>',
          text(60,652,"01  QuantEcon + Nashpy",18,"primary","700"),
          text(470,652,"02  Gambit / PyGambit",18,"primary","700"),
          text(894,652,"Predict → solve → explain",17,"ink"),
          '</g></svg>']
    return '\n'.join(s)+'\n'


def button(label, kind, width, filled=False):
    s=[svg_open(width,42,label,"Navigation link: "+label),
       f'<rect x="1" y="1" width="{width-2}" height="40" rx="8" '
       f'fill="{PALETTE["primary" if filled else "paper"]}" '
       f'stroke="{PALETTE["primary"]}" stroke-width="1.5"/>']
    stroke=PALETTE['paper' if filled else 'primary']
    paths={
        'matrix':'M 14 13 H 32 V 29 H 14 Z M 23 13 V 29 M 14 21 H 32',
        'tree':'M 23 12 V 19 M 16 28 V 23 L 23 19 L 30 23 V 28',
        'code':'M 19 14 L 13 21 L 19 28 M 29 14 L 35 21 L 29 28 M 26 12 L 22 30',
        'download':'M 23 11 V 25 M 17 20 L 23 26 L 29 20 M 14 27 V 31 H 32 V 27',
    }
    s += [f'<path d="{paths[kind]}" fill="none" stroke="{stroke}" stroke-width="2"/>',
          text(45,27,label,15,'paper' if filled else 'primary','700'),'</g></svg>']
    return '\n'.join(s)+'\n'


def main():
    ASSETS.mkdir(exist_ok=True)
    (ASSETS/'game-theory-hero.svg').write_text(hero(),encoding='utf-8')
    buttons=[('teach-matrices','Teach: matrices','matrix',198,True),
             ('teach-trees','Teach: trees + types','tree',235,True),
             ('colab-01','Colab 01','code',139,False),
             ('colab-02','Colab 02','code',139,False),
             ('download','Download ZIP','download',181,False)]
    for filename,label,kind,width,filled in buttons:
        (ASSETS/f'{filename}.svg').write_text(button(label,kind,width,filled),encoding='utf-8')
    manifest={
        'figure':'game-theory-hero.svg','evidence_class':'conceptual teaching illustration',
        'iconography_mode':'minimal-scientific','palette':PALETTE,
        'composition_mechanism':'Compare payoff grid, observed decision branches and hidden-type information structure; selected outcomes tie each mechanism to its executed example.',
        'bands':{'title':[28,144],'panel_titles':[177,233],'models':[245,463],
                 'outcomes':[474,549],'legend':[581,610],'tools':[626,666]},
        'grayscale_encoding':'Grid position, thicker selected branches and text identify equilibria; dotted links with I1/I2/I3 identify indistinguishability. Hue is redundant.',
        'semantic_graphics':[
            {'concept':'Nash equilibrium','visual_encoding':'Two-player payoff grid with mutual-defection cell selected',
             'shape_ids':['nash-matrix','nash-label'],'origin':'original',
             'evidence_implication':'Illustrative prisoner dilemma only; the 1,1 outcome is the saved baseline, not a universal Nash payoff.'},
            {'concept':'Subgame-perfect equilibrium','visual_encoding':'Entry decision tree with a thick entry-accommodation continuation',
             'shape_ids':['selten-tree','selten-label'],'origin':'original',
             'evidence_implication':'Observed entry example; 1 exceeds -1 for the incumbent after entry. Accom. abbreviates accommodate.'},
            {'concept':'Bayesian information','visual_encoding':'Nature diamond, private-cost branches and three dotted information-set links',
             'shape_ids':['harsanyi-information','harsanyi-label'],'origin':'original',
             'evidence_implication':'The graphic stops before Firm 2 terminal actions; the full payoff tables and tree are in notebook 02. It preserves simultaneous hidden actions, not perfect observation.'}
        ],
        'evidence_sources':['../../notebooks/quantecon_nashpy/01_QuantEcon_Nashpy_Interactive.ipynb',
                            '../../notebooks/gambit_pygambit/02_Gambit_PyGambit_Interactive.ipynb'],
        'design_references':[
            {'url':'https://github.com/sunshineluyao/Oracle4SD','adaptation':'Centered actions, original vector hero, direct reproducibility links.'},
            {'url':'https://github.com/sunshineluyao/Web3AI4IO-SD-Template','adaptation':'Parallel tutorial entry points and linked repository map.'},
            {'url':'https://github.com/sunshineluyao/network-vis-emerging-tech-template','adaptation':'Separate classroom workflow from provenance and maintenance.'}],
        'external_assets':[], 'raster_content':False,
        'editable_source':'../../scripts/build_repo_visuals.py',
        'license':'Original course content follows ../../LICENSE_POLICY.md; no external artwork copied.',
    }
    (ASSETS/'figure_manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
    print('Built hero, five navigation buttons, and semantic figure manifest.')


if __name__=='__main__':
    main()
