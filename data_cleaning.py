#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import re
import sys
import os
import xlrd
from collections import OrderedDict

def sheet_process(table,skip_empty = 1):
    d = OrderedDict()
    if table.row_values(5)[3] != '赛事全称' or table.row_values(6)[3] != '赛事内容关键词1':
        return None

    contestName = str(table.row_values(5)[5]).replace('"','“')
    if contestName == '' and skip_empty:
        return None

    d.update({"no":len(data_list)+1,"name":contestName})

    for i in range(5,table.nrows):
        if table.row_values(i)[1] != "":
            title1 = table.row_values(i)[1]
            d[title1] = OrderedDict()
        if table.row_values(i)[2] != "":
            title2 = table.row_values(i)[2]
            d[title1][title2] = OrderedDict()
        title3 = table.row_values(i)[3]
        value = table.row_values(i)[5]
        if isinstance(value,float) and float(round(value)) == value:
            value = int(round(value))

        if re.match(r"是否采用\w+宣传",title3):
            add = title3.replace("是否采用","").replace("宣传","")
            if value == '否':
                no_flag = True
            else:
                no_flag = False

        if re.match(r"评价\d+",title3):
            remark_no = int(title3.replace('评价',''))
            if add == '微信':
                if 0 < remark_no <=3:
                    title3 = '阅读量第%d的文章的阅读量' % remark_no
                elif remark_no == 4:
                    title3 = '所有赛事相关文章的阅读量总数'
                elif remark_no == 5:
                    title3 = '发表的赛事相关文章总数'
            elif add == '海报' or add == '传单' or add == '大型展板':
                if remark_no == 1:
                    title3 = '版式数'
                if remark_no == 2:
                    title3 = '数量'
            elif add == '邮件':
                title3 = '发送到个人邮箱的数目'
            elif add == '路演':
                title3 = '总时间长度'

            title3 = add + title3
            
            if no_flag:
                value = ''
        
        d[title1][title2][title3] = str(value).replace('"','“').replace("'",'“')

    return d

def file_process(file,data_list,skip_empty = 1):
    wb = xlrd.open_workbook(file) # 打开xls文件
    for i in range(wb.nsheets): 
        ct = sheet_process(wb.sheets()[i],skip_empty)
        if ct != None:
            data_list.append(ct) 

data_list = []
empty_list = []

file_process('赛事调研_XX院系填写.xlsx',empty_list,skip_empty=0)

filelist = os.listdir(os.curdir)
for i in filelist:
    if re.match(r"\w+.xlsx",i):
        file_process(i,data_list)

fo = open("contest_data.json","w",encoding = "utf-8")
sys.stdout = fo
print(data_list)
fo.close()

fo = open("print_order.json","w",encoding = "utf-8")
sys.stdout = fo
print(OrderedDict(empty_list[0]))
fo.close
