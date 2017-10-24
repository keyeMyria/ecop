from pyramid_rpc.jsonrpc import jsonrpc_method

from webmodel.base import DBSession
from webmodel.region import loadRegion

from .base import RpcBase

__cached_region__ = None


def regionFactory():
    """ Cache the region dimension instance on the module level　"""
    global __cached_region__

    if not __cached_region__:
        __cached_region__ = loadRegion(DBSession())

    return __cached_region__


class RegionJSON(RpcBase):

    @jsonrpc_method(endpoint='rpc', method='regions.get.legacy')
    def getRegionsData(self):
        """ Return a tree structure to be loaded into a Ext.data.TreeStore:
              id: 6-digit region code
              text: text name of the region
              children: an Array of children nodes
              leaf: true for leaf node. Not present for branch nodes.
        There is no root node. The first level is all provinces. Example:
             [{id: 100000, text: '北京', c: [...]},
              {id: 310100, text: '上海', c: [...]}
              ...]
        """
        ret = []
        regions = regionFactory()

        def addNode(l, node):
            if not node.isRoot():
                r = {
                    'id': node.regionCode,
                    't': node.label
                }
                l.append(r)

            if node.isLeaf():
                r['leaf'] = True
            else:
                if not node.isRoot():
                    r['c'] = []
                    l = r['c']
                for c in node.children:
                    addNode(l, c)

        addNode(ret, regions.root)
        return ret


def getRegionName(regionCode):
    return regionFactory().getRegionName(regionCode)
