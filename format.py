#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import pymongo
from collections import OrderedDict
#import sys

conn = pymongo.MongoClient()    # create connection
db = conn.contests              # use contest database. if it does not exist, create a new one.
users = db.users                # use users collection. if it does not exist, create a new one.


with open('print_order.json','r',encoding='utf-8') as f:
    order = eval(f.read())
f.close()


def data2html(ct):
# print contest data in format
    # print contest name as title1 first
    s = '''
    <h1 align="left" style="text-align:left;">
        {h1}
    </h1>      
    '''.format(h1 = ct['name'])
    for key1 in order.keys():
        # skip invalid instances
        if not isinstance(ct[key1],dict):
            continue

        # print key1 as title2
        s += '''
        <h2 align="left" style="text-align:left;">
            {h2}
        </h2>            
        '''.format(h2 = key1)

        for key2 in order[key1].keys():
            # print key2 as title3
            s += '''
            <h3 align="left" style="text-align:left;">
                {h3}
            </h3>
            '''.format(h3 = key2)

            for key3 in order[key1][key2].keys():
                # print key3 and its value as body 
                if ct[key1][key2][key3] != '':
                    s += '''
                    <p align="left" style="text-align:left;">
                        {k3}: {content}
                    </p>
                    '''.format(k3 = key3, content = ct[key1][key2][key3])
    # or return s
    return s


# find no-th contest data. you have to receive no from the user. note that no starts from 1.
no = 2
for i in users.find({'no':no},{'_id':0}):
# {'no':no} is searching for the no-th contest
# Don't modify or delete {'_id':0}, which is telling it not to show its original '_id' key-value.
    html_str = data2html(i)

print(html_str)

# for you to examine the output
'''
fo = open('test.txt','w')
sys.stdout = fo  
print(html_str)
'''

'''
for i in users.find({'name':'清华大学金相实验技能大赛'},{'_id':0}):
    print(i)
'''