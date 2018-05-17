from webmodel.base import DBSession
from webmodel.item import Item

def addItemInfo(list_in):
    """
    Supplement a list of objects with property `itemId` with itemName,
    specification, model and unitId. Leave other property of the list untouched.

    Return: None
    """
    sess = DBSession()
    for elem in list_in:
        if 'itemId' in elem:
            item = sess.query(Item).get(elem['itemId'])
            elem['itemName'] = item.itemName
            elem['specification'] = item.specification
            elem['model'] = item.model
