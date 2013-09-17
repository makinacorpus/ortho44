#!/usr/bin/env bash
cd ecws || exit -1
out=../out
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
    mark="$out/done/${i}${suf}"
    d="$out/${destname}"
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
if [[ ! -d "$out/done" ]];then mkdir -p "$out/done";fi
for i in *ecw;do
    tif_tmp_outfile="$out/$(basename $i .ecw).geotiff"
    for fmt in png jp2 geotiff jpeg;do
        WRAP_OPTS=""
        TRANSLATE_OPTS=""
        case $fmt in
            "png")
#                main $fmt
#                main $fmt 1
#                main $fmt 2
#                main $fmt 3
#                main $fmt 4
#                main $fmt 5
#                main $fmt 7
#                main $fmt 8
#                main $fmt 9
                ;;
            "jpeg")
#                main $fmt
#                main $fmt 65
                main $fmt 70
#                main $fmt 75
                main $fmt 80
#                main $fmt 85
                main $fmt 90
#                main $fmt 95
#                main $fmt 100
                ;;
            "jp2")
#                main $fmt
#                main $fmt 25_LOSS_COMPRESSED
#                main $fmt 50_LOSS
#                main $fmt 50_LOSS_COMPRESSED
#                main $fmt 75_LOSS
#                main $fmt 75_LOSS_COMPRESSED
#                main $fmt LOSELESS
#                main $fmt LOSELESS_COMPRESSED
                ;;
            *)
                #main $fmt
                ;;
        esac
    done
    if [[ -f "$tif_tmp_outfile" ]];then rm -fv $tif_tmp_outfile;fi
done

