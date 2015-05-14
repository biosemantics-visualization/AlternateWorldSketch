import bson
import pymongo
import json
from bson import ObjectId
from pymongo import MongoClient
import string
import tangelo



def run(host,database,collection):
    # Create an empty response object.
    response = {}
    collectionNames = ['select a run to examine']

   # look through the collection and return a list of names of the datasets available
    
    client = MongoClient(host, 27017)
    db = client[database]
    # get a list of all collections (excluding system collections)
   
    for run in db[collection].find():
            collectionNames.append(run['name'])

    client.close()

    # Pack the results into the response object, and return it.
    response['result'] = collectionNames

    # Return the response object.
    tangelo.log(str(response))
    return json.dumps(response)
