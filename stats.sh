#!/usr/bin/env bash
WHERE=/var/makina/data/Ortho_2012_CG44
ECHANTILLON=./ecws
NB_PIC=$(ls $WHERE/*ecw -1|wc -l)
TOTAL_SIZE=$(du -sc $WHERE/*ecw|tail -n1|awk '{print $1}')
ECHANTILLON_SIZE=$(du -sc $ECHANTILLON/*ecw|tail -n1|awk '{print $1}')
E_NB_PIC=$(ls $ECHANTILLON/*ecw -1|wc -l)
echo "ECW: $E_NB_PIC($ECHANTILLON_SIZE) / $NB_PIC($TOTAL_SIZE) ecws"
for i in out/jpeg.{70,80,90};do
    size=$(du -s $i|awk '{print $1}')
    nf=$(ls $i/*|grep -v xml|wc -l|awk '{print $1}')
    echo "JPEG: Size: $i: $size"
    echo "JPEG: Files: $i: $nf"
    echo "JPEG: Estimated($NB_PIC): $i $(echo "($size*$NB_PIC.0)/$nf"|bc)";
done|sort

#  nf         NB_PIC
#  size       x
# One of the tests gave:
# ECW: 820(5663252) / 7954(59650808) ecws
# JPEG: Estimated(820/7954): out/jpeg.70 37972008
# JPEG: Estimated(820/7954): out/jpeg.80 48955783
# JPEG: Estimated(820/7954): out/jpeg.90 74961483
# JPEG: Files: out/jpeg.70: 820
# JPEG: Files: out/jpeg.80: 820
# JPEG: Files: out/jpeg.90: 820
# JPEG: Size: out/jpeg.70: 3914640
# JPEG: Size: out/jpeg.80: 5046988
# JPEG: Size: out/jpeg.90: 7727988
# vim:set et sts=4 ts=4 tw=80:
