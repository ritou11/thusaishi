#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import pymongo
import sys
from collections import OrderedDict

fo = open("contest_data.json","r",encoding = "utf-8")
l = eval(fo.read())

conn = pymongo.MongoClient()
db = conn.contests
users = db.users

"""
for i in users.find():
    print(i)
"""
users.remove()
users.insert(l)
fo.close()

length = len(l)

dlist = {"length":length-1}
slist = str()
for no in range(1,length):
    for ct in users.find({"no":no}):
        slist += r"sh" + str(no) + r":" + ct["name"] + "\n"
        dlist.update({"sh"+str(no):ct["name"]})


dlist.update({'list':slist})

fo = open("contest_list.json","w",encoding="utf-8")
sys.stdout = fo
print(str(dlist).replace("'",'"'))
fo.close()



"""
for i in users.find({"赛事名称": "清华大学金相实验技能大赛"}):
    print(i)
"""