from landez import TilesManager
from landez.proj import GoogleProjection
from shapely import geometry
from PIL import Image
import json

min = 15
max = 240
grey_limit = 7
border_geojson = open("/home/ebr/dev/projets/CG44/data/buffer-feature.geojson").read()
border = geometry.asShape(json.loads(border_geojson))
proj = GoogleProjection(levels = range(19))

ortho44 = TilesManager(tiles_url="http://{s}.tiles.cg44.makina-corpus.net/ortho2012/{z}/{x}/{y}.jpg")

z = 10
x = 504
y = 665
print proj.tile_bbox((z, x, y))
img = ortho44.tile((z, x, y))
f = open("./test.jpg", "wb")
f.write(img)
f.close()

hysteresis = False
keeper = False

img = Image.open('./test.jpg')
img = img.convert("RGBA")
datas = img.getdata()

newData = []
for item in datas:
    if (item[0] < min and item[1] < min and item[2] < min) or (item[0] > max and item[1] > max and item[2] > max):
        if keeper:
        	newData.pop()
        	newData.append((0, 0, 0, 0))
        newData.append((0, 0, 0, 0))
        hysteresis = True
    else:
    	if hysteresis:
    		newData.append((0, 0, 0, 0))
    		if not(abs(item[0] - item[1]) < grey_limit and abs(item[0] - item[2]) < grey_limit):
    			hysteresis = False
    	else:
	        newData.append(item)
	        keeper = True

img.putdata(newData)
img.save("img2.png", "PNG")
