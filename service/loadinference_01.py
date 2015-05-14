import bson
import pymongo
import json
from bson import ObjectId
from pymongo import MongoClient
import string
import tangelo

import networkx as nx

'''
need to convert what is in mongo to this format:

{
  "name": "alternate worlds",
  "children": [
      { "name": "world1: 2 congruences, 3 overlap", "size": 100},
      { "name": "world2: 1 congruence", "size": 150}
      
      ]
}


'''

def run(host,database,collection,runname):
    # Create an empty response object.
    response = {}
    collectionNames = []

   # this method parses the run result documents and converts them to the format needed by a D3-based bubble diagram

    client = MongoClient(host, 27017)
    db = client[database]
    # pull out the selected run from the results collection
    query = {'name':runname}
    thisRun = db[collection].find(query)

    # mongodB cursors always return a list, since we are picking a single run, hard code the index
    worldList = []
    for world in thisRun[0]['results']:
        worldList.append(world['name'])

    relationsList = []
    for world in thisRun[0]['results']:
        # this isn't right, we need to group by world first not put them all in one
        relationsList.append(world['relations'])

    # aggregate world results for the UI
    #overlapCount = 0
    #for rel in relationsList:
    #    if rel['type'] == 'overlap':
    #        overlapCount += 1    
    

    # Pack the results into the response object, and return it.
    response['result'] = {}
    response['result']['worldList'] = worldList
    response['result']['relationsList'] = relationsList
    response['result']['relationsList'] = relationsList
    client.close()

    # Return the response object.
    #tangelo.log(str(response))
    return json.dumps(response)
