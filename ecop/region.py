from pyramid_rpc.jsonrpc import jsonrpc_method

from webmodel.base import DBSession
from webmodel.region import loadRegion

from .base import RpcBase

__cached_region__ = None


def regionFactory():
    """ Cache the region dimension instance on the module level　"""
    global __cached_region__ #pylint: disable=W0603

    if not __cached_region__:
        __cached_region__ = loadRegion(DBSession())

    return __cached_region__


class RegionJSON(RpcBase):

    @jsonrpc_method(endpoint='rpc', method='regions.get.legacy')
    def getRegionsDataLegacy(self):
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

    @jsonrpc_method(endpoint='rpc', method='regions.get')
    def getRegionsData(self, regionCode):
        """
        Return complete region data for the province which the parameter
        `regionCode` corresponds to. Return format is:
            {
                100000: ['北京', pid, [child ids]],
                310000: ['上海', pid, [child ids]]
                ...
            }
        The children list is optional. If a node is leaf, then it will be
        missing.

        Note parameter `regionCode` may not be a first level region. Whatever
        it is, the return value is **all** city and district data for the
        provice which **contains** the `regionCode`.
        """
        ret = {}
        region = regionFactory().get(regionCode)

        def addNode(node):
            d = [node.label, node.parent.key if node.parent else None]
            if node.children:
                d.append([c.key for c in node.children])
            ret[node.key] = d

        (region.ancestors[-1] if region.ancestors else region).walk(addNode)
        return ret


def getRegionName(regionCode):
    return regionFactory().getRegionName(regionCode)
