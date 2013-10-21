#!/usr/bin/env bash
#
# This script takes a gdal_retile made pyramid
# in input in  order to constuct files needed by
# geoserver pyramid plugin (the properties, .fix & .qix)
#
# Indeeed, geoserver can do that for us but not if the data
# is way too large


# tif is the default, jpg2000 is autodetected (*.jp2 in
# pyramid layers folders


OPWD=$PWD
cd $(dirname $0)
T=$PWD
bounds=$PWD/bounds.py

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
export GDAL_CACHEMAX=10000
export GDAL_FORCE_CACHING=YES
export VSI_CACHE=YES
export VSI_CACHE_SIZE=2000

WRAP_OPTS=""
TRANSLATE_OPTS=""


do_proj() {
cat > $1<<EOF
PROJCS["RGF93 / Lambert-93",
  GEOGCS["RGF93",
    DATUM["Reseau Geodesique Francais 1993",
      SPHEROID["GRS 1980", 6378137.0, 298.257222101, AUTHORITY["EPSG","7019"]],
      TOWGS84[0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
      AUTHORITY["EPSG","6171"]],
    PRIMEM["Greenwich", 0.0, AUTHORITY["EPSG","8901"]],
    UNIT["degree", 0.017453292519943295],
    AXIS["Geodetic longitude", EAST],
    AXIS["Geodetic latitude", NORTH],
    AUTHORITY["EPSG","4171"]],
  PROJECTION["Lambert_Conformal_Conic_2SP"],
  PARAMETER["central_meridian", 3.0],
  PARAMETER["latitude_of_origin", 46.5],
  PARAMETER["standard_parallel_1", 49.0],
  PARAMETER["false_easting", 700000.0],
  PARAMETER["false_northing", 6600000.0],
  PARAMETER["scale_factor", 1.0],
  PARAMETER["standard_parallel_2", 44.0],
  UNIT["m", 1.0],
  AXIS["Easting", EAST],
  AXIS["Northing", NORTH],
  AUTHORITY["EPSG","2154"]]
EOF
}

do_shp() {
    shp=$PWD/$lvl.shp
    echo "doing shapefile $shp"
    # geoserver doesnt like "./"
    find -L . -name "*.$EXT" |sed -re "s:\.\/::g"> shapes &&\
    gdaltindex $shp --optfile shapes &&\
    rm -f shapes
}

do_props() {
    echo "doing properties"
    do_proj $lvl.prj
cat > $lvl.properties<<EOF
#-Automagically created ny makina tools
# $(date)
Levels=$zoom_level,$zoom_level
Heterogeneous=false
AbsolutePath=false
Name=$lvl
TypeName=$lvl
Caching=false
ExpandToRGB=false
LocationAttribute=location
SuggestedSPI=$READER
LevelsNum=1
EOF
}
do_index() {
    echo "doing index"
    pwd
    if [[ -f $SHP ]];then
        atlasstyler "addFix=$PWD/$SHP"
    else
        echo "$SHP does not exist"
        exit -1
    fi

}

cook() {
    func=$1
    if [[ ! -d $MARKERS ]];then mkdir $MARKERS;fi
    mk="$MARKERS/.cook_pyr_${PWD//\//_}_${@//\//_}"
    if [[ ! -f $mk ]];then
        "$@"
        if [[ $? == 0 ]];then
            touch "$mk"
        else
            echo "stopped due to error ($@ in $PWD)"
            exit -1
        fi
    else
        shift
        echo "Already done $func ($@) in $PWD ($mk)"
    fi
}
main_props() {
    cat > $1<<EOF
#-Automagically created ny makina tools
# $(date)
Name=$name
Levels=$zoom_levels
LevelsNum=$nb_zoom_levels
Envelope2D=$($bounds 0/0.shp)
LevelsDirs=$levelsDirs
EOF
}

do_pyramid() {
    pushd $OPWD
    #pushd $1
    #exit -1
    CWD="$PWD"
    name="$(basename $CWD)"
    format=${FORMAT:-GTIFF}
    if [[ -z $FORMAT ]];then
        if [[ $(find -L $CWD -name "*jp2"|wc -l) -gt 2 ]];then
            format="JPEG2000"
        fi
    fi
    case $format in
        JPEG2000)
            EXT="jp2"
            READER="it.geosolutions.imageio.plugins.jp2ecw.JP2GDALEcwImageReaderSpi"
            ;;
        *)
            EXT="tif"
            READER="it.geosolutions.imageioimpl.plugins.tiff.TIFFImageReaderSpi"
            ;;
    esac
    j=0
    start_zoom=0.2
    zoom_level=$start_zoom
    zoom_levels=""
    nb_zoom_levels="0"
    levelsDirs=""
    #
    do_proj    $CWD/${name}.prj
    for lvl in $(seq 0 15|sort -rn);do
        zoom_level="$start_zoom"
        if [[ $lvl != 0 ]];then
            for it in $(seq "$((lvl))");do
                zoom_level=$(echo "$zoom_level*2"|bc|sed -re "s/^\./0./g")
            done
        fi
        w=$CWD/$lvl
        SHP=${lvl}.shp
        if [[ -d $w ]];then
            if [[ ! -f sample_image ]];then cp -v $T/sample_image .;fi
            levelsDirs="$levelsDirs $lvl"
            nb_zoom_levels=$((nb_zoom_levels+1))
            echo $w
            zpref=" "
            if [[ -z $zoom_levels ]];then
                zpref=""
            fi
            zoom_levels="$zoom_levels${zpref}$zoom_level,$zoom_level"
            cd $w && do_props && cd ..
            cd $w && cook do_shp && cd ..
            cd $w && cook do_index && cd ..
        fi
    done
    zoom_levels="$(echo $(python -c "print \"$zoom_levels\".replace(\" \", \"\\n\")"|sort -n))"
    levelsDirs="$(echo $(python -c "print \"$levelsDirs\".replace(\" \", \"\\n\")"|sort -n))"
    if [[ ! -f $CWD/sample_image ]];then cp -v $T/sample_image $CWD;fi
    cook main_props $CWD/${name}.properties
    main_props $CWD/${name}.properties
    chown -Rf tomcat7 $i
}

for i in ${@:-512};do
    do_pyramid $i
done
# reset:
# rm */{0,1,2,3,4,5,6,7,8,9,10}.{shp,shx,dbf}

# EG: 
#  cd /var/lib/tomcat7/webapps/geoserver/data/jp2/
#  /var/makina/data/test_wms/do_pyramid_index.sh 







