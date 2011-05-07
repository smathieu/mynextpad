
from xml.dom import minidom
import json

doc = minidom.parse('bikeStations.xml')

data = [];

for st in doc.firstChild.childNodes:
  name = st.getElementsByTagName('name')[0].firstChild.data
  lat = st.getElementsByTagName('lat')[0].firstChild.data
  lng = st.getElementsByTagName('long')[0].firstChild.data
  data.append({'name': name, 'lat': lat, 'lng':lng});

print data

json.dump(data, file('bikeStations.json', 'w'))
