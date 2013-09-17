#!/bin/sh
## BEGIN INIT INFO
# Provides: FastCGI servers for PHP
# Required-Start: networking
# Required-Stop: networking
# Default-Start: 2 3 4 5
# Default-Stop: S 0 1 6
# Short-Description: Start FastCGI servers with PHP.
# Description: Start PHP with spawn-fcgi. For use with nginx and lighttpd.
#
#
### END INIT INFO

RUN_USER=www-data
RUN_GROUP=www-data

LISTEN_ADDRESS=127.0.0.1
LISTEN_PORT=53217
PREFIX="CHANGEME"

SPAWN_FCGI=/usr/bin/spawn-fcgi
PHP_CGI=$PREFIX/apps/bin/mapserv
PID_DIR=/var/run/mapserv
PID_FILE=$PID_DIR/fastcgi.pid
CHILDREN=5

export MS_MAPFILE="$PREFIX/map.map"
export LD_LIBRARY_PATH="$LD_LIBRARY_PATH:/usr/lib/jvm/java-7-openjdk-amd64/jre/lib/amd64/server/"

# the -F switch of spawn-fcg does not work when the -n swich
# is set. using multiwatch instead
# see http://manpages.ubuntu.com/manpages/lucid/man1/spawn-fcgi.1.html


check() {
        if [ ! -d "$PID_DIR" ];then
                mkdir "$PID_DIR"
                chown $FASTCGI_USER:$FASTCGI_GROUP "$PID_DIR"
                chmod 0770 $PID_DIR
        fi
}
d_start() {
    check
    if [ -f $PID_FILE ]; then
      echo -n " already running"
    else
        start-stop-daemon --start -p $PID_FILE \
            --exec /usr/bin/env -- $SPAWN_FCGI  \
            -u $RUN_USER -g $RUN_GROUP -a $LISTEN_ADDRESS -p $LISTEN_PORT \
            -P $PID_FILE -- /usr/bin/multiwatch -f $CHILDREN $PHP_CGI
    fi
}

d_stop() {
    check
    start-stop-daemon --stop --quiet --pidfile $PID_FILE \
                      || echo -n " not running"
    if [ -f "$PID_FILE" ]; then
        rm "$PID_FILE"
    fi
}

case "$1" in
  start)
    echo -n "Starting FastCGI: $0"
    d_start
    echo "."
    ;;

  stop)
    echo -n "Stopping FastCGI: $0"
    d_stop
    echo "."
    ;;
  restart)
    echo -n "Restarting FastCGI: $0"
    d_stop
    sleep 1
    d_start
    ;;
  *)
    echo "usage: $0 {start|stop|restart}"
    ;;
esac
