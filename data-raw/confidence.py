# Confidence for each count of each species, from the distribution of its relatives only.
# Relatives: the other species in the genus, or the family, the order, the class or the phylum.
# The first level with at least MIN others is used. Each relative contributes its first count.
# High:   the count is inside the middle half (Q1 to Q3) of the relatives.
# Medium: outside the middle half, but inside the usual range (Q1 - w to Q3 + w, with w = 1.5 x IQR and at least 3).
# Low:    outside the usual range.
# None:   fewer than MIN relatives at every level. Shown as "Not rated".
import statistics as st, collections, math
MIN=5
def compute(S):
    grp={l:collections.defaultdict(list) for l in (4,3,2,1,0)}
    for i,s in enumerate(S):
        for l in (4,3,2,1,0): grp[l][s[2][l]].append((i,s[3][0]))
    out=[]
    for i,s in enumerate(S):
        r=None
        for l in (4,3,2,1,0):
            o=[v for j,v in grp[l][s[2][l]] if j!=i]
            if len(o)>=MIN:
                a,b=[st.quantiles(o,n=4,method='inclusive')[x] for x in (0,2)]
                w=1.5*max(b-a,2); lo=a-w; hi=b+w
                def rng(x,y):
                    p,q=math.ceil(x),math.floor(y)
                    return (p,q) if p<=q else (round((x+y)/2),)*2
                tiers=['H' if a<=c<=b else 'M' if lo<=c<=hi else 'L' for c in s[3]]
                r={'lv':l,'k':len(o),'mid':rng(a,b),'use':(max(1,rng(lo,hi)[0]),rng(lo,hi)[1]),'tiers':tiers}
                break
        out.append(r)
    return out
def compact(r):
    # What the browser needs: level, number of relatives, middle half, usual range and the tier of each count
    if r is None: return None
    return [r['lv'],r['k'],r['mid'][0],r['mid'][1],r['use'][0],r['use'][1],''.join(r['tiers'])]
