from copy import deepcopy

from pyramid_rpc.jsonrpc import jsonrpc_method
from pyramid.threadlocal import get_current_request
from zope.sqlalchemy import mark_changed

from webmodel.base import DBSession
from webmodel.category import (Category, CategoryNode, CategoryRollup,
    loadCategory)

from ecop.base import RpcBase


def categoryFactory():
    """ We are not using redis for this since the category structure will
    be accessed during a page request multiple times. The network traffic along
    with the unpickling create an intolerable overhead. So we implemented our
    own memory cache """
    request = get_current_request()

    if hasattr(request, '__cs__'):
        return request.__cs__
    else:
        cs = loadCategory(DBSession())
        if request:
            request.__cs__ = cs
        return cs


def invalidateCategory():
    """ When category is modified, call this so next call to categoryFactory
    will reload from database.

    Note this method does not work across multiple requests and processes. It
    is actually not very useful in production environment.
    """
    request = get_current_request()
    del request.__cs__


def _assignNewCid(cs):
    """ Get the next unused category id """
    cids = []

    def addcid(cat):
        if not cat.isRoot():
            cids.append(cat.key)
    cs.walk(addcid)

    cids.sort()
    for idx in range(len(cids)):
        if cids[idx + 1] - cids[idx] > 1:
            return cids[idx] + 1


class CategoryJSON(RpcBase):

    @jsonrpc_method(endpoint='rpc', method='category.get')
    def getCategoryData(self):
        """ Return category data as a tree structure to be loaded in ExtJS:
              id: 6-digit category code
              text: name of the category
              num: number of items under the category
              children: an Array of children nodes
              leaf: true for leaf node. Not present for branch nodes.
        There is no root node. Example:
             [{id: 1020, text: '地板', num: 20, children: [...]},
              {id: 2000, text: '洁具', num: 30, children: [...]}
              ...]
        """
        ret = []
        cs = categoryFactory()

        def addNode(l, node):
            if not node.isRoot():
                r = {
                    'id': node.key,
                    'text': node.label,
                    'num': node.context.numberItems
                }
                l.append(r)

            if node.isLeaf():
                r['leaf'] = True
            else:
                if not node.isRoot():
                    r['children'] = []
                    l = r['children']
                for c in node.children:
                    addNode(l, c)

        addNode(ret, cs.root)
        return ret

    @jsonrpc_method(endpoint='rpc', method='category.update')
    def updateCategory(self, modified):
        """ The variable `modified` keeps a list of all modifications in
        natural occurring order. No pre-processing are done on the client side,
        everything is just faithfully recorded. So if you change the label to A
        and then to B, there will be two entries. Theses records can be then
        'replayed' here to reproduce the changes.

        Each entry in the list encode user actions as:

        ['A', cid, parent, prev_cid, label] # Add a new category **after** the
                                            # given position, None means first
        ['L', cid, label]                   # change category Label
        ['D', cid]                          # Delete the category
        ['M', cid, parent, prev_cid]        # Move the category **after** the
                                            # given position, None means first
        """
        todo = []
        cs = deepcopy(categoryFactory())

        # some pre-processing
        # 1. for 'L' and 'M' actions for a given cid, only keep the last one
        # 2. if category is deleted, all previous modifications for this
        #    category are not necessary. And if a new node is deleted, the
        #    deletion action itself is also not necessary.
        for i in modified:
            action, cid = i[0], i[1]
            if action in ('L', 'M'):
                try:
                    del todo[[(t[0], t[1]) for t in todo].index((action, cid))]
                except ValueError:
                    pass
            elif action == 'D':
                for idx in reversed(range(len(todo))):
                    if todo[idx][1] == cid:
                        del todo[idx]
                if not isinstance(cid, int):
                    continue
            todo.append(i)

        sess = self.sess

        # do the actual work
        for i in todo:
            action, cid = i[0], i[1]

            if action == 'L':
                cat = sess.query(Category).get(cid)
                cat.label = i[2]

            elif action == 'A':
                new_cid = _assignNewCid(cs)

                # replace all future actions with the new cid
                for m in todo:
                    if m[1] == cid:
                        m[1] = new_cid
                    if m[0] in ('M', 'A'):
                        if m[2] == cid:
                            m[2] = new_cid
                        if m[3] == cid:
                            m[3] = new_cid
                cid = new_cid

                parent_cid, prev_cid = i[2], i[3]
                if parent_cid == 'root':
                    parent_cid = 9999
                    parent = cs.root
                else:
                    parent = cs.get(parent_cid)

                if prev_cid:
                    prev = cs.get(prev_cid)
                    next_cid = prev.next.key if prev.next else None
                else:
                    next_cid = None

                new_cat = Category(categoryId=cid, label=i[4])
                sess.add(new_cat)
                sess.add(CategoryRollup(categoryId=cid, parentId=parent_cid,
                                        nextCategoryId=next_cid))
                if prev_cid:
                    sess.query(CategoryRollup).\
                        get(prev_cid).nextCategoryId = cid

                cs.addNode(parent, CategoryNode(new_cat),
                           prev.index + 1 if prev_cid else 0)

            elif action == 'M':
                cat = cs.get(cid)
                parent_cid, prev_cid = i[2], i[3]
                if parent_cid == 'root':
                    parent_cid = 9999
                    parent = cs.root
                else:
                    parent = cs.get(parent_cid)

                # if the category is moved back to its original position, we
                # must not allow code to continue
                if parent_cid == cat.parent.key and \
                        prev_cid == (cat.prev.key if cat.prev else None):
                    continue

                if cat.prev:
                    sess.query(CategoryRollup).\
                        get(cat.prev.key).nextCategoryId = \
                        cat.next.key if cat.next else None

                rollup = sess.query(CategoryRollup).get(cid)

                if parent_cid != cat.parent.key:
                    rollup.parentId = parent_cid

                if prev_cid:
                    prev = cs.get(prev_cid)
                    sess.query(CategoryRollup).\
                        get(prev_cid).nextCategoryId = cid
                    rollup.nextCategoryId = \
                        prev.next.key if prev.next else None
                else:
                    rollup.nextCategoryId = parent.children[0].key \
                        if parent.children else None

                cs.addNode(parent, cat, prev.index + 1 if prev_cid else 0)

            elif action == 'D':
                cat = cs.get(cid)
                cats = cat.descendants
                cats.add(cat)

                if cat.prev:
                    sess.query(CategoryRollup).\
                        get(cat.prev.key).nextCategoryId = \
                        cat.next.key if cat.next else None

                cs.deleteNode(cat)

                # Note it is dangerous to mix orm and sql within the same
                # session since orm can reorder query execution order
                # unexpectedly unless flush is used
                sess.execute(
                    Category.__table__.delete().where(
                        Category.categoryId.in_([c.key for c in cats])))
                sess.execute(
                    CategoryRollup.__table__.delete().where(
                        CategoryRollup.categoryId.in_([c.key for c in cats])))
                mark_changed(sess)

            # flush database changes after each and every action will guard
            # against possible conflicts by ORM reordering the sql statements
            sess.flush()

        sess.execute('select update_category_number_items()')
        invalidateCategory()
