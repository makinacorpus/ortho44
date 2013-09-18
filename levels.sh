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
ECHANTILLON=${ECHANTILLON:-8000000}
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


tif_retile() {
    j=0
    psuf=""
    ppref=""
    OUTPUT_FORMAT="${OUTPUT_FORMAT:-GTIFF}"
    OUTPUT_FORMAT_OPTS="-of $OUTPUT_FORMAT"
    COMPRESS=""
    FCOMPRESS=""
    case $OUTPUT_FORMAT in
        GTIFF)
            ppref="tif_"
            ;;
        JPEG2000)
            ppref="jp2_"
    esac
    case $OUTPUT_FORMAT in
        JPEG200)
            OUTPUT_FORMAT_OPTS="$OUTPUT_FORMAT_OPTS -co FORMAT=JP2 mode=int rate=1"
            ;;
        GTIFF)
            METHOD="${METHOD:-JPEG}"
            COMPRESS="-co COMPRESS=$METHOD"
            FCOMPRESS="$COMPRESS"
            case $METHOD in
                DEFLATE)
                    COMPRESS_OPTS='-co ZLEVEL=9'
                    FCOMPRESS_OPTS="$COMPRESS_OPTS"
                    psuf="_deflate"
                    ;;
                JPEG)
                    COMPRESS_OPTS='-co JPEG_QUALITY=90'
                    FCOMPRESS_OPTS='-fco JPEG_QUALITY=80'
                    psuf=""
                    ;;
            esac
            OUTPUT_FORMAT_OPTS="$OUTPUT_FORMAT_OPTS -co TILED=YES $COMPRESS $COMPRESS_OPTS"
            ;;
    esac
    size_x=${1:-256}
    size_y=${2:-256}
    optfile="$OUT/files-pyramid-"
    export ECW_GEOSERVER="$OUT/pyramid_geoser_${OUTPUT_FORMAT}_${METHOD}-${ECHANTILLON}_${size_x}_${size_y}"
    # rename images for geoserver to parse them
    # handle the 8 limit chars ...
    # for ec in $(ls $ECW_DATA/*.ecw);do
    #if [[ ! -f $ECW_GEOSERVER/$((ECHANTILLON-2)).ecw ]];then
    rm -rf $ECW_GEOSERVER;mkdir $ECW_GEOSERVER
    # in case of small echantillons, take the middle of the map
    if [[ $ECHANTILLON -lt 7000 ]];then
        mylist=$(ls $ECW_DATA/*.ecw|sort|tail -n 4000|head -n$ECHANTILLON)
    else
        mylist=$(ls $ECW_DATA/*.ecw|sort|head -n$ECHANTILLON)
    fi
    for ec in $mylist;do
        j=$((j+1))
        ln -sfv $ec $ECW_GEOSERVER/${j}.ecw
    done
    ls  $ECW_GEOSERVER/*ecw > $optfile
    nb=$(ls  $ECW_GEOSERVER/*ecw|wc -l)
    export PYRAMID=$OUT/${ppref}pyramid${psuf}_${nb}_${size_x}_${size_y}
    marker=$MARKERS/${ppref}pyramid${psuf}_${nb}_${size_x}_${size_y}
    dmarker=$MARKERS/${ppref}pyramid${psuf}_${nb}_${size_x}_${size_y}_dates
    if [[ ! -f $marker ]];then
        if [[ ! -d $PYRAMID ]];then mkdir $PYRAMID;fi
        echo "start $(date)">>$dmarker
        ortho44_gdal_retile.py -untilLevel 16 -v\
            $RETILE_OPTS \
            $OUTPUT_FORMAT_OPTS\
            -r bilinear  \
            -tileIndex index \
            -targetDir $PYRAMID \
            -ps $size_x $size_y\
            -levels 15 \
            -s_srs EPSG:2154 \
            --optfile "$optfile"
        exit -1
        echo "end $(date)">>$dmarker
        if [[ $? != 0 ]];then exit -1;fi
        touch $marker
    else
        echo "Pyramid $PYRAMID already tiled"
    fi
}
#for i in 256 128 512 1024 2048;do
#for i in 256 128;do
for i in ${@:-512};do
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

# FULL LAUNCH
# ./levels.sh pixelsize (eg: 512)

# ECHANTILLON LAUNCH
# ECNATILLON=10 ./levels.sh pixelsize (eg: 512)


# OUTPUTS:
# TIFF + DEFLATE
# > METHOD=DEFLATE ./levels.sh pixelsize (eg: 512)
# JP2
# > OUTPUT_FORMAT=JP2 ./levels.sh pixelsize (eg: 512)
