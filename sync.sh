#!/usr/bin/env bash
where="root@88.190.58.142:/root/mounted/"
base="/bin/ /home/ /lib/ /lost+found/ /mnt/ /selinux/ /usr/
/vmlinuz /boot/ initrd.img /lib64/ /media/
/opt/ /root/ /sbin/ /srv/ /tmp/ /var/"
ropts="-aAzv --delete --numeric-ids"
rsync $ropts /etc/ $where/etc/ --exclude=network --exclude=fstab --exclude=70-persistent-net.rules
for i in $base;do 
    rsync $ropts $i $where/$i 
done
