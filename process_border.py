from landez import TilesManager
from landez.proj import GoogleProjection
from shapely import geometry
from PIL import Image
import json
import os

min_color = 20
max_color = 235
grey_limit = 7
global_bbox = (-3.0, 46.8, -0.5, 48.0)

def isNeutral(item):
    return (item[0] < min_color and item[1] < min_color and item[2] < min_color) or (item[0] > max_color and item[1] > max_color and item[2] > max_color)

def getNeighbors(img, x, y):
    neighbors = []
    for i in range(max(0, x-1), min(256, x+2)):
        for j in range(max(0, y-1), min(256, y+2)):
            neighbors.append(img.getpixel((i, j)))
    return neighbors

def neutralAverage(items):
    neutral = 0.0
    for item in items:
        if isNeutral(item):
            neutral += 1
    if (neutral / len(items)) >= 0.3:
        for item in items:
            if (abs(item[0] - item[1]) < grey_limit and abs(item[0] - item[2]) < grey_limit):
                neutral += 1
    return (neutral / len(items)) >= 0.4

def process_tile(image_data, path, filename):
    f = open("./test.jpg", "wb")
    f.write(image_data)
    f.close()

    img = Image.open('./test.jpg')
    img = img.convert("RGBA")

    newData = []
    for j in range(0, 256):
        for i in range(0, 256):
            item = img.getpixel((i, j))
            # if i==189 and j==84:
            #     import pdb; pdb.set_trace( )
            if isNeutral(item) or neutralAverage(getNeighbors(img, i, j)):
                newData.append((0, 0, 0, 0))
            else:
                newData.append(item)

    img.putdata(newData)
    d = os.path.dirname(path)
    if not os.path.exists(d):
        os.makedirs(d)
    img.save(path + filename, "PNG")

border_geojson = open("./buffer-feature.geojson").read()
border = geometry.asShape(json.loads(border_geojson))
proj = GoogleProjection(levels = range(19), tms_scheme=True)

ortho44 = TilesManager(tiles_url='http://{s}.tiles.cg44.makina-corpus.net/ortho2012/{z}/{x}/{y}.jpg')
# z = 10
# x = 504
# y = 665

for tile in ortho44.tileslist(global_bbox, [11], tms_scheme=True):
    # if tile[1]!=504 or tile[2]!=665:
    #     continue
    # print tile
    bbox = proj.tile_bbox(tile)
    # print bbox
    bbox_geom = geometry.Polygon((
            (bbox[0], bbox[1]),
            (bbox[2], bbox[1]),
            (bbox[2], bbox[3]),
            (bbox[0], bbox[3]),
            ))
    # print geometry.mapping(bbox_geom)
    if bbox_geom.intersects(border):
        try:
            img = ortho44.tile(tile)
            #img = ortho44.tile((tile[0], tile[2], tile[1]))
        except Exception, e:
            print e
            continue
        path = "./%d/%d/" % (tile[0], tile[1])
        filename = "%d.png" % tile[2]
        process_tile(img, path, filename)


