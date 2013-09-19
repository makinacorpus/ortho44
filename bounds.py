#!/usr/bin/env python
# -*- coding: utf-8 -*-
__docformat__ = 'restructuredtext en'

import gdal

import os
import sys    
import ogr

def main(args=None):
    gdal.AllRegister()
    if not args:
        args=sys.argv[1:]
    for i in args:
        pt = os.path.abspath(i)
        shape = ogr.Open(pt)
        extent =  shape.GetLayer(0).GetExtent()
        print "%0.2f,%0.2f %0.2f,%0.2f" % extent


if __name__ == '__main__':
    main()


# vim:set et sts=4 ts=4 tw=80:
