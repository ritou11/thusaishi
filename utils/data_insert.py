#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import pymongo
from collections import OrderedDict
import json

with open("contest_data.json", "r", encoding="utf-8") as fi:
  l = eval(fi.read())

conn = pymongo.MongoClient()
db = conn.contests
users = db.users

users.remove()
users.insert(l)

dlist = {"length": users.count(), "data": {}}
slist = str()

for ss in users.find().sort("no"):
  slist += r"ss" + str(ss["no"]) + r":" + ss["name"] + "\n"
  dlist["data"].update({"ss" + str(ss["no"]): ss["name"]})
dlist.update({'list': slist})

with open("../contest_list.json", "w", encoding="utf-8") as fo:
  json.dump(dlist, fo, ensure_ascii=False)
