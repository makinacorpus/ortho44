#!/usr/bin/env bash
#
# This script takes the ECW files and convert it to a pyramid of JPEG Layers
# The top Layer will certainly by at a quality of 90% and others at 70%
# Idea is then to feed geoserver with those layers on the behalf of pyramid plugin
#
cd $(dirname $0)

# XXX
# reset this to super large to include all ecws
# when tests will be finished
ECHANTILLON=8000000
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
    size_x=${1:-256}
    size_y=${2:-256}
    optfile="$OUT/files-pyramid-"
    export ECW_GEOSERVER="$OUT/pyramid_geoser"
    rm -rf $ECW_GEOSERVER;mkdir $ECW_GEOSERVER
    # rename images for geoserver to parse them
    # handle the 8 limit chars ...
    j=0
    for ec in $ECW_DATA/*.ecw;do
        j=$((j+1))
        ln -sfv $ec $ECW_GEOSERVER/${j}.ecw
    done
    ls  $ECW_GEOSERVER/*ecw > $optfile
    nb=$(ls  $ECW_GEOSERVER/*ecw|wc -l)
    export PYRAMID=$OUT/pyramid_${nb}_${size_x}_${size_y}
    marker=$MARKERS/pyramid_${nb}_${size_x}_${size_y}
    if [[ ! -f $marker ]];then
        if [[ ! -d $PYRAMID ]];then mkdir $PYRAMID;fi
            ortho44_gdal_retile.py -untilLevel 16 -v\
            $RETILE_OPTS \
            -tileIndex index \
            -targetDir $PYRAMID \
            -ps $size_x $size_y\
            -of JPEG \
            -co 'QUALITY=70' \
            -fco 'QUALITY=90' \
            -levels 15 \
            -s_srs EPSG:2154 \
            --optfile "$optfile"
        if [[ $? != 0 ]];then exit -1;fi
        touch $marker
    else
        echo "Pyramid $PYRAMID already tiled"
    fi
}
tif_retile() {
    j=0
    size_x=${1:-256}
    size_y=${2:-256}
    optfile="$OUT/files-pyramid-"
    export ECW_GEOSERVER="$OUT/pyramid_geoser_${ECHANTILLON}_${size_x}_${size_y}"
    # rename images for geoserver to parse them
    # handle the 8 limit chars ...
    # for ec in $(ls $ECW_DATA/*.ecw);do
    #if [[ ! -f $ECW_GEOSERVER/$((ECHANTILLON-2)).ecw ]];then
    rm -rf $ECW_GEOSERVER;mkdir $ECW_GEOSERVER
    for ec in $(ls $ECW_DATA/*.ecw|sort|head -n$ECHANTILLON);do
        j=$((j+1))
        ln -sfv $ec $ECW_GEOSERVER/${j}.ecw
    done
    #fi
    ls  $ECW_GEOSERVER/*ecw > $optfile
    nb=$(ls  $ECW_GEOSERVER/*ecw|wc -l)
    export PYRAMID=$OUT/tif_pyramid_${nb}_${size_x}_${size_y}
    marker=$MARKERS/tif_pyramid_${nb}_${size_x}_${size_y}
    dmarker=$MARKERS/tif_pyramid_${nb}_${size_x}_${size_y}_dates
    if [[ ! -f $marker ]];then
        if [[ ! -d $PYRAMID ]];then mkdir $PYRAMID;fi
        echo "start $(date)">>$dmarker
        ortho44_gdal_retile.py -untilLevel 16 -v\
            $RETILE_OPTS \
            -r bilinear  \
            -tileIndex index \
            -targetDir $PYRAMID \
            -ps $size_x $size_y\
            -of GTIFF \
            -co 'TILED=YES' \
            -co 'COMPRESS=JPEG' \
            -co 'JPEG_QUALITY=90' \
            -fco 'TILED=YES' \
            -fco 'COMPRESS=JPEG' \
            -fco 'JPEG_QUALITY=80' \
            -levels 15 \
            -s_srs EPSG:2154 \
            --optfile "$optfile"
        echo "end $(date)">>$dmarker
        if [[ $? != 0 ]];then exit -1;fi
        touch $marker
    else
        echo "Pyramid $PYRAMID already tiled"
    fi
}
#for i in 256 128 512 1024 2048;do
#for i in 256 128;do
for i in $@;do
    tif_retile $i $i
done


# NOTES:
# wget http://download.java.net/media/jai/builds/release/1_1_3/jai-1_1_3-lib-linux-amd64-jdk.bin -> exe in jdk folder

# to test
# NB=40;for i in $(ls -1 /var/makina/data/Ortho_2012_CG44/*ecw|head -n $NB);do ln -fs $i ecws/;done;export ECW_DATA=$PWD/ecws

# use the pyramid plugin
# download jai from java
# - reset a pyramid
# rm */{1,2,3,4,5,6}.{properties,shp,qix,shx,fix,prj,dbf} *properties
# - think to remove zoom layers after the last one which have only one image



