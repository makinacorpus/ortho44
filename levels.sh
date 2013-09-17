#!/usr/bin/env bash
#
# This script takes the ECW files and convert it to a pyramid of JPEG Layers
# The top Layer will certainly by at a quality of 90% and others at 70%
# Idea is then to feed geoserver with those layers on the behalf of pyramid plugin
#
cd $(dirname $0)

export R=/var/makina
export PREFIX=${PREFIX:-$R/circus}
export ROOT=${ROOT:-$PREFIX/apps}
export PATH="$ROOT/bin:$PATH"
if [[ -e $PREFIX/bin/activate ]];then
    . $PREFIX/bin/activate
else
    apt-get install python-virtualenv
    virtualenv $PREFIX
    . $PREFIX/bin/activate
fi

export CUR=$PWD
export OUT=$CUR/out
export PYRAMID=$OUT/pyramid
export MARKERS="$OUT/done"
export ECW_DATA=${ECW_DATA:-$R/data/Ortho_2012_CG44}

export PATH=$ROOT/bin:$CUR:$PATH

WRAP_OPTS=""
TRANSLATE_OPTS=""
RETILE_OPTS=""

warp() {
    echo gdalwarp $WRAP_OPTS -s_srs EPSG:2154 -of "$1" "$2" "$3"
    gdalwarp $WRAP_OPTS -s_srs EPSG:2154 -of "$1" "$2" "$3"
    if [[ $? != 0 ]];then exit -1;fi
}
translate() {
    echo gdal_translate $TRANSLATE_OPTS -of "$1" "$2" "$3"
    gdal_translate $TRANSLATE_OPTS -of "$1" "$2" "$3"
    if [[ $? != 0 ]];then exit -1;fi
}

main() {
    format="$1" var="$2"
    echo "MAIN: $format -- $var"
    destname="$format"
    suf=".$format.done"
    if [[ -n $var ]];then
        destname="$destname.$var";
        suf=".$var.$suf";
    fi
    mark="$MARKERS/${i}${suf}"
    d="$OUT/${destname}"
    outfile="$d/$(basename $i .ecw).$format"
    tif_outfile="$outfile"
    WRAP_OPTS=""
    TRANSLATE_OPTS=""
    rate=$(echo $var|sed -re "s/([0-9]+)(_LOSS(_COMPRESSED))*$/\1/g")
    case $format in
        geotiff)
            tformat='GTiff'
            ;;
        png)
            tformat='PNG'
            if [[ -n $rate ]];then
                TRANSLATE_OPTS="-co ZLEVEL=$rate"
            fi
            ;;
        jpeg)
            tformat='JPEG'
            TRANSLATE_OPTS="-co QUALITY=$rate"
            ;;
        jp2)
            tformat='JPEG2000'
            case $var in
                *_LOSS_COMPRESSED)
                    TRANSLATE_OPTS="-co FORMAT=JPC -co mode=real"
                    if [[ -n $rate ]];then TRANSLATE_OPTS="$TRANSLATE_OPTS -co rate=0.$rate";fi
                    ;;
                *_LOSS)
                    TRANSLATE_OPTS="-co FORMAT=JP2 -co mode=real"
                    if [[ -n $rate ]];then TRANSLATE_OPTS="$TRANSLATE_OPTS -co rate=0.$rate";fi
                    ;;
                LOSELESS)
                    TRANSLATE_OPTS="-co FORMAT=JP2 -co mode=int -co rate=1"
                    ;;
                LOSELESS_COMPRESSED)
                    TRANSLATE_OPTS="-co FORMAT=JPC -co mode=int -co rate=1"
                    ;;
            esac
            ;;
        *) tformat='GTiff' ;;
    esac
    if [[ $format != "geotiff" ]];then
        tif_outfile="$tif_tmp_outfile"
    fi
    if [[ ! -d "$d" ]];then mkdir -p "$d";fi
    if [[ ! -f "$mark" ]];then
        # maybe internal convert
        infile=$i
        if [[ ! -f "$tif_outfile" ]];then
            warp GTiff "$infile" "$tif_outfile";
        fi
        if [[ $format != "geotiff" ]];then
            translate $tformat "$tif_tmp_outfile" "$outfile"
        fi
        touch "$mark"
    else
        echo "$i: Already done $format (delete $mark)"
    fi
}

# convert from ECW to jpeg 70/80/90
level_zero() {
    if [[ ! -d "$MARKERS" ]];then mkdir -p "$MARKERS";fi
    for ecw in $ECW_DATA/*ecw;do
        i=$(basename $ecw)
        echo $ecw $i
        tif_tmp_outfile="$OUT/$(basename $i .ecw).geotiff"
        for fmt in png jp2 geotiff jpeg;do
            WRAP_OPTS=""
            TRANSLATE_OPTS=""
            case $fmt in
                "jpeg")
                    main $fmt 70
                    main $fmt 80
                    main $fmt 90
                    ;;
            esac
        done
        if [[ -f "$tif_tmp_outfile" ]];then rm -fv $tif_tmp_outfile;fi
    done
}
#level_zero
retile() {
    if [[ ! -d $PYRAMID ]];then mkdir $PYRAMID;fi
    optfile="$OUT/pyramid-files"
    ls  $ECW_DATA/*ecw > $optfile
    ortho44_gdal_retile.py -untilLevel 1 -v\
        $RETILE_OPTS \
        -tileIndex ortho44.shp \
        -targetDir $PYRAMID \
        -of JPEG \
        -co 'QUALITY=70' \
        -fco 'QUALITY=90' \
        -levels 15 \
        -s_srs EPSG:2154 \
        --optfile "$optfile"   
    exit -1
    if [[ $? != 0 ]];then exit -1;fi
}
retile




# to test
# NB=40;for i in $(ls -1 /var/makina/data/Ortho_2012_CG44/*ecw|head -n $NB);do ln -fs $i ecws/;done;export ECW_DATA=$PWD/ecws





